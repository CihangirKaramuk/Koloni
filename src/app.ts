import { audio } from './audio/audio';
import { DAILY_REWARDS, claimDaily, dailyStatus } from './daily';
import { ECONOMY, type PowerId } from './economy';
import { addLives, canPlay, fmtTime, livesInfo, regenLives, spendLife } from './lives';
import { Game } from './core/game';
import type { LevelData } from './core/types';
import { loadLevel, prefetchLevel } from './level/loader';
import { getLevel, type LevelEntry, type TipId } from './level/levels';
import { platform } from './platform/parolla';
import { progress } from './platform/progress';
import { Renderer } from './render/renderer';
import { button, h, icon, setButtonSound } from './ui/dom';
import { BOOST_KEYS, BOOSTS, HUD_BOTTOM, Hud, type BoostId } from './ui/hud';
import { haptics } from './haptics';
import { Minigun } from './powers/minigun';
import { getLang, setLang, t, type StrKey } from './ui/i18n';
import {
  dailyGrid,
  difficultyBanner,
  foodThumb,
  heartPill,
  loadingScreen,
  type LoadingView,
  homeScreen,
  howToBody,
  modal,
  rewardIcon,
  rewardLabel,
  toggleIcons,
  type HeartView,
} from './ui/screens';

const DEV = new URLSearchParams(location.search).has('dev');
/** Yatay tutulan dokunmatik telefon (styles.css .rotate-hint ile aynı koşul). */
const ROTATE_MQ = window.matchMedia('(orientation: landscape) and (max-height: 500px) and (pointer: coarse)');

const TIPS: Record<TipId, { title: StrKey; body: StrKey[] }> = {
  basics: { title: 'tipBasicsTitle', body: ['tipBasics', 'tipBasics2'] },
  ice: { title: 'tipIceTitle', body: ['tipIce'] },
  hidden: { title: 'tipHiddenTitle', body: ['tipHidden'] },
  frozen: { title: 'tipFrozenTitle', body: ['tipFrozen'] },
};

/** Uygulama: ekranlar, oyun döngüsü, girdi, ses, kayıt ve portal bağlantısı burada buluşur. */
export class App {
  private renderer: Renderer;
  private hud: Hud;
  private game: Game | null = null;
  private entry: LevelEntry | null = null;
  private levelNo = 1;
  private boostersUsed = 0;
  private paused = false;
  private hidden = false;
  private screen: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private last = 0;
  /** Ana ekrandaki can göstergesi (saniyede bir güncellenir). */
  private heart: HeartView | null = null;
  /** Kazanılan ama karıncaları henüz yuvaya dönmemiş oyun */
  private winPending: Game | null = null;
  /** Havan topu gücü */
  private minigun = new Minigun();
  /** Bu oturumda günlük ödül paneli kendiliğinden gösterildi mi? */
  private dailyAutoShown = false;
  /** Bu oyun için can zaten harcandı mı? (aynı kayıp için iki kez harcanmasın) */
  private lifeSpentFor: Game | null = null;

  constructor(private canvas: HTMLCanvasElement, private ui: HTMLElement) {
    this.renderer = new Renderer(canvas);
    this.hud = new Hud({
      menu: () => this.openMenu(),
      boost: (id) => this.usePower(id),
      speed: () => this.onSpeedButton(),
    });
    ui.append(this.hud.el);
    setButtonSound(() => audio.play('button'));
    this.renderer.minigun = this.minigun;
    this.minigun.onImpact = (x, y) => {
      this.renderer.boom(x, y);
      audio.play('burn');
    };
    this.minigun.onShot = () => audio.play('tap', { pitch: 1.5 });
    // Geliştirici kancası (yalnızca ?dev=1): konsoldan koloni.game vb.
    if (DEV) Object.assign(window as object, { koloni: this, koloniAudio: audio, koloniProgress: progress });
  }

  async start() {
    const info = await platform.init();
    setLang(info.locale);
    await progress.load();
    audio.sfxOn = progress.data.settings.sfx;
    audio.musicOn = progress.data.settings.music;
    haptics.on = progress.data.settings.vibrate;

    this.bindInput();
    this.onResize();
    window.addEventListener('resize', () => this.onResize());
    document.addEventListener('visibilitychange', () => this.onVisibility());
    this.tickLives();
    setInterval(() => this.tickLives(), 1000);
    this.showTitle();
    document.getElementById('boot')?.remove();
    // Yatay tutulan telefon: oyun dikey tasarlandı, tahta sığmaz. Uyarı göster, oyunu durdur.
    document.body.append(h('div', { class: 'rotate-hint' }, h('div', { class: 'rotate-phone' }), h('p', {}, t('rotate'))));
    requestAnimationFrame((ts) => this.loop(ts));
  }

  /* ---------------- Döngü ---------------- */

  private loop(ts: number) {
    // Sonraki kare en başta istenir: bir karede hata olsa bile oyun donmaz.
    requestAnimationFrame((t2) => this.loop(t2));
    try {
      this.step(ts);
    } catch (e) {
      console.error(e);
    }
  }

  private step(ts: number) {
    const dt = Math.min(0.05, this.last ? (ts - this.last) / 1000 : 0);
    this.last = ts;
    // Pencere / iframe boyutu, resize olayı kaçsa bile (ör. sayfa 0×0 açılıp sonra büyüdüyse) yakalanır.
    if (window.innerWidth !== this.viewW || window.innerHeight !== this.viewH) this.onResize();
    if (!this.hidden) {
      const g = this.game;
      if (g && !this.paused && !ROTATE_MQ.matches) {
        g.update(dt);
        this.minigun.update(dt * g.speed, g);
        // Bölüm bitti ve son karınca da yuvasına girdi: kutlama + ödül paneli.
        if (this.winPending === g && g.ants.length === 0 && !this.minigun.active) {
          this.winPending = null;
          setTimeout(() => g === this.game && this.showWin(), 250);
        }
        this.hud.setProgress(1 - g.board.totalHp() / this.startHp);
        if (g.status === 'playing') {
          this.checkFinale();
          this.tickSpeed(dt);
        }
      }
      this.renderer.frame(this.paused ? 0 : dt);
    }
  }

  /** Son yerleşimin yapıldığı pencere boyutu. */
  private viewW = -1;
  private viewH = -1;

  private onResize() {
    const w = window.innerWidth;
    const hh = window.innerHeight;
    this.viewW = w;
    this.viewH = hh;
    // Kısa ekranlarda (eski / küçük telefonlar) üst ve alt çubuk sıkışık düzene geçer
    // (styles.css: max-height 720px); tahtaya daha çok yer kalır.
    const compact = hh <= 720;
    this.renderer.topInset = compact ? 94 : 116;
    this.renderer.bottomInset = compact ? 54 + 26 : HUD_BOTTOM + 40;
    this.renderer.resize(w, hh, Math.min(window.devicePixelRatio || 1, 2));
  }

  private onVisibility() {
    this.hidden = document.hidden;
    if (this.hidden) {
      audio.suspend();
      platform.setPlaying(false);
    } else {
      audio.resume();
      this.last = 0;
      if (this.game?.status === 'playing' && !this.paused) platform.setPlaying(true);
    }
  }

  private bindInput() {
    this.canvas.addEventListener('pointerdown', (e) => {
      audio.unlock();
      const g = this.game;
      if (!g || this.paused || g.status !== 'playing' || this.overlay) return;
      if (this.handMode) {
        this.handTap(e.clientX, e.clientY);
        return;
      }
      const col = this.renderer.hitColumn(e.clientX, e.clientY);
      if (col !== null) this.tapColumn(col);
    });
    // Ekranın herhangi bir yerine ilk dokunuşta sesi aç (tarayıcı kuralı).
    window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
    window.addEventListener('keydown', (e) => {
      audio.unlock();
      const g = this.game;
      if (e.key === 'Escape' && this.handMode) {
        this.setHandMode(false);
        return;
      }
      if (e.key === 'Escape') {
        if (this.overlay && this.paused) this.closeOverlay(true);
        else if (g?.status === 'playing') this.openMenu();
        return;
      }
      if (!g || this.paused || this.overlay || g.status !== 'playing') return;
      if (e.repeat) return;
      const n = Number(e.key);
      if (n >= 1 && n <= g.columns.length) this.tapColumn(n - 1);
      const key = e.key.toLowerCase();
      const boost = BOOSTS.find((b) => BOOST_KEYS[b.id] === key);
      if (boost) this.usePower(boost.id);
      if (e.key === ' ') {
        e.preventDefault();
        this.onSpeedButton();
      }
    });
  }

  /** Bölüm başındaki toplam lokma (ilerleme çubuğu için). */
  private startHp = 1;

  private tapColumn(col: number) {
    this.game!.tap(col);
  }

  /* ---------------- Ekranlar ---------------- */

  private setScreen(el: HTMLElement | null, titleAnts = false) {
    this.renderer.titleAnts = titleAnts;
    this.screen?.remove();
    this.screen = el;
    if (el) this.ui.insertBefore(el, this.hud.el);
  }

  private openOverlay(el: HTMLElement, pause: boolean) {
    this.closeOverlay(false);
    this.overlay = el;
    this.ui.append(el);
    if (pause) {
      this.paused = true;
      platform.setPlaying(false);
    }
  }

  private closeOverlay(resume: boolean) {
    this.overlay?.remove();
    this.overlay = null;
    if (resume) {
      this.paused = false;
      this.last = 0;
      if (this.game?.status === 'playing') platform.setPlaying(true);
    }
  }

  private showTitle() {
    this.loadToken++; // bekleyen bölüm yüklemesi varsa iptal
    this.minigun.active = false;
    this.setHandMode(false);
    prefetchLevel(progress.data.unlocked);
    platform.setPlaying(false);
    this.closeOverlay(false);
    this.paused = false;
    this.game = null;
    this.renderer.setGame(null);
    this.hud.show(false);
    const n = progress.data.unlocked;
    this.setScreen(
      homeScreen({
        level: n,
        difficulty: getLevel(n).difficulty,
        userName: platform.user?.name ?? null,
        canLogin: !platform.info.standalone,
        onPlay: () => this.startLevel(progress.data.unlocked, true),
        onSettings: () => this.openSettings(),
        onHow: () => this.openHowTo(),
        onLogin: () => platform.requestLogin(),
      }),
      true,
    );
    // Üstte: can + altın; solda günlük ödül hediyesi.
    this.heart = heartPill(fmtTime, () => this.openLivesInfo());
    this.updateHeart();
    this.screen?.append(
      h('div', { class: 'home-stats' }, this.heart.el, h('div', { class: 'coin-pill' }, icon('coin'), String(progress.data.coins))),
    );
    const daily = dailyStatus(progress.data, Date.now());
    const gift = button(null, 'round yellow', () => this.openDaily(), 'gift');
    this.screen?.append(h('div', { class: 'gift-btn' }, gift, daily.canClaim ? h('span', { class: 'dot' }) : null));
    if (daily.canClaim && !this.dailyAutoShown) {
      this.dailyAutoShown = true;
      setTimeout(() => !this.game && !this.overlay && this.openDaily(), 600);
    }
  }

  /* ---------------- Can sistemi ---------------- */

  private tickLives() {
    if (regenLives(progress.data, Date.now())) progress.update(() => {});
    this.updateHeart();
  }

  private updateHeart() {
    if (!this.heart) return;
    const i = livesInfo(progress.data, Date.now());
    this.heart.update(i.lives, i.full, i.nextIn, i.unlimitedLeft);
  }

  /**
   * Bölümden vazgeçildi (kaybetti ve tekrar/ana sayfa seçti ya da yarıda bıraktı): 1 can gider.
   * Hiç dokunulmadan çıkılırsa can gitmez.
   */
  private forfeit() {
    const g = this.game;
    if (!g || this.lifeSpentFor === g) return;
    const started = g.status === 'lost' || (g.status === 'playing' && g.taps > 0);
    if (!started) return;
    this.lifeSpentFor = g;
    progress.update((p) => spendLife(p, Date.now()), true);
  }

  /** Can yokken açılan panel: sayaç, altınla doldur, reklamla +1. */
  private openNoLives(then?: () => void) {
    const note = h('div', { class: 'note' });
    const num = h('b', {}, '0');
    const timer = h('p', {});
    const tick = () => {
      const i = livesInfo(progress.data, Date.now());
      num.textContent = String(i.lives);
      timer.textContent = `${t('nextLife')}: ${fmtTime(i.nextIn)}`;
      if (i.lives > 0 && then) {
        clearInterval(iv);
        this.closeOverlay(true);
        then();
      }
    };
    const iv = setInterval(tick, 1000);
    const close = () => {
      clearInterval(iv);
      this.closeOverlay(true);
    };
    const refill = () => {
      if (progress.data.coins < ECONOMY.refillPrice) {
        note.textContent = t('notEnough');
        audio.play('blocked');
        return;
      }
      progress.update((p) => {
        p.coins -= ECONOMY.refillPrice;
        addLives(p, ECONOMY.maxLives, Date.now());
      }, true);
      audio.play('slotDone');
      close();
      this.afterLivesChanged(then);
    };
    const refillBtn = button(t('refill'), 'green', refill);
    refillBtn.append(h('span', { class: 'price' }, ' · ', icon('coin'), String(ECONOMY.refillPrice)));
    this.openOverlay(
      modal({
        title: t('noLivesTitle'),
        head: 'blue',
        body: [h('div', { class: 'big-heart' }, icon('heart', ''), num), timer, h('p', {}, t('noLivesSub')), note],
        actions: [refillBtn],
        onClose: close,
      }),
      true,
    );
    tick();
  }

  private afterLivesChanged(then?: () => void) {
    this.updateHeart();
    if (then) then();
    else if (!this.game) this.showTitle();
  }

  /** Kalbe dokununca: can doluysa bilgi, değilse doldurma paneli. */
  private openLivesInfo() {
    const i = livesInfo(progress.data, Date.now());
    if (i.full || i.unlimitedLeft > 0) return;
    this.openNoLives();
  }

  /* ---------------- Günlük ödül ---------------- */

  private openDaily() {
    const now = Date.now();
    const st = dailyStatus(progress.data, now);
    const close = () => {
      this.closeOverlay(true);
      if (!this.game) this.showTitle();
    };
    const claim = () => {
      const r = claimDaily(progress.data, Date.now());
      if (!r) return;
      progress.update(() => {}, true);
      audio.play('win');
      this.refreshHud();
      // Ödül özeti
      this.openOverlay(
        modal({
          title: t('dailyTitle'),
          head: 'purple',
          body: [h('div', { class: 'big-reward' }, rewardIcon(r)), h('div', { class: 'sub' }, rewardLabel(r))],
          actions: [button(t('gotIt'), 'green big', close)],
        }),
        true,
      );
    };
    this.openOverlay(
      modal({
        title: t('dailyTitle'),
        head: 'purple',
        body: [dailyGrid(DAILY_REWARDS, st.day, !st.canClaim), st.canClaim ? null : h('p', { class: 'daily-note' }, t('comeBack'))],
        actions: st.canClaim ? [button(t('claim'), 'green big', claim, 'gift')] : [],
        onClose: close,
      }),
      true,
    );
  }

  private openHowTo() {
    this.openOverlay(
      modal({
        title: t('howTo'),
        head: 'blue',
        body: [howToBody()],
        actions: [button(t('gotIt'), 'green', () => this.closeOverlay(true))],
        onClose: () => this.closeOverlay(true),
      }),
      true,
    );
  }

  /** Ayarlar paneli. Oyun içindeyken "Tekrar" ve "Ana sayfa" da içerir. */
  private openSettings() {
    const s = progress.data.settings;
    const inGame = !!this.game && this.game.status === 'playing';
    const close = () => this.closeOverlay(true);
    this.openOverlay(
      modal({
        title: t('settings'),
        body: [
          toggleIcons([
            { label: t('sfx'), icon: 'sound', value: s.sfx, onChange: (v) => (progress.update((p) => (p.settings.sfx = v)), (audio.sfxOn = v)) },
            { label: t('music'), icon: 'music', value: s.music, onChange: (v) => (progress.update((p) => (p.settings.music = v)), audio.setMusic(v)) },
            ...(haptics.supported
              ? [
                  {
                    label: t('vibrate'),
                    icon: 'vibrate' as const,
                    value: s.vibrate,
                    onChange: (v: boolean) => {
                      progress.update((p) => (p.settings.vibrate = v));
                      haptics.on = v;
                      haptics.buzz('power');
                    },
                  },
                ]
              : []),
          ]),
          h('div', { class: 'keys-hint' }, t('keysHint')),
          inGame ? h('div', { class: 'divider' }) : null,
        ],
        actions: inGame
          ? [
              button(t('replay'), 'yellow', () => (this.forfeit(), this.startLevel(this.levelNo))),
              button(t('home'), 'red', () => (this.forfeit(), this.showTitle())),
            ]
          : [],
        onClose: close,
      }),
      true,
    );
  }

  /* ---------------- Bölüm akışı ---------------- */

  /** Bölümü başlat: can yoksa "can kalmadı" paneli. */
  private startLevel(n: number, fromHome = false) {
    regenLives(progress.data, Date.now());
    if (!canPlay(progress.data, Date.now())) {
      if (this.game) this.showTitle();
      this.openNoLives(() => this.beginLevel(n, true));
      return;
    }
    this.beginLevel(n, fromHome);
  }

  /**
   * Bölüm verisi arka planda (Web Worker) hazırlanır. Ana sayfadan "Oyna" ile gelince
   * ya da bölüm hemen hazır değilse tam ekran yükleme ekranı gösterilir.
   */
  private loadToken = 0;

  private beginLevel(n: number, withScreen = false) {
    const token = ++this.loadToken;
    const p = loadLevel(n);
    let screen: LoadingView | null = null;
    const show = () => {
      if (screen || token !== this.loadToken) return;
      platform.setPlaying(false);
      this.closeOverlay(false);
      this.game = null;
      this.renderer.setGame(null);
      this.hud.show(false);
      screen = loadingScreen();
      this.setScreen(screen.el, true);
    };
    if (withScreen) show();
    const timer = setTimeout(show, 150);
    const shownAt = performance.now();
    void p.then((level) => {
      clearTimeout(timer);
      if (token !== this.loadToken) return; // bu arada ana sayfaya dönüldü vb.
      const go = () => {
        if (token !== this.loadToken) return;
        this.startWithLevel(n, level);
        prefetchLevel(n + 1);
      };
      if (!screen) return go();
      // Ekran çok kısa yanıp sönmesin: en az ~0,9 sn görünsün, çubuk dolsun.
      const wait = Math.max(0, 900 - (performance.now() - shownAt));
      setTimeout(() => screen!.finish(go), wait);
    });
  }

  /** Şu anki bölümün verisi (geliştirici kancası otomatik oynatma için kullanır). */
  levelData: LevelData | null = null;

  private startWithLevel(n: number, level: LevelData) {
    this.levelData = level;
    this.levelNo = n;
    this.entry = getLevel(n);
    this.game = new Game(level);
    this.startHp = Math.max(1, this.game.board.totalHp());
    this.hud.setProgress(0);
    this.finale = false;
    this.minigun.active = false;
    this.setHandMode(false);
    this.applySpeed();
    this.boostersUsed = 0;
    this.renderer.setGame(this.game);
    this.setScreen(null);
    this.closeOverlay(false);
    this.paused = false;
    this.hud.show(true);
    this.refreshHud();
    this.hookGame(this.game);

    const banner = difficultyBanner(this.entry.difficulty);
    if (banner) {
      this.ui.append(banner);
      setTimeout(() => banner.remove(), 2000);
    }
    // Bu bölümde ilk kez görülen özel taş (ya da ilk bölümdeki temel anlatım) için ipucu.
    const tip = this.entry.tips.find((x) => !progress.data.tips.includes(x));
    if (tip) this.showTip(tip);
    else platform.setPlaying(true);
  }

  private showTip(tip: TipId) {
    const def = TIPS[tip];
    const done = () => {
      progress.update((p) => p.tips.push(tip));
      this.closeOverlay(true);
    };
    this.openOverlay(
      modal({
        title: t(def.title),
        body: def.body.map((k) => h('p', {}, t(k))),
        actions: [button(t('gotIt'), 'green', done)],
      }),
      true,
    );
  }

  private hookGame(g: Game) {
    const ev = g.events;
    ev.on('tap', () => (audio.play('tap', { pitch: 0.9 + Math.random() * 0.2 }), haptics.buzz('tap')));
    ev.on('blocked', () => (audio.play('blocked'), haptics.buzz('blocked')));
    ev.on('bite', ({ cleared }) => audio.play(cleared ? 'clear' : 'eat', { pitch: 0.9 + Math.random() * 0.3 }));
    ev.on('burn', () => audio.play('burn'));
    ev.on('slotDone', () => audio.play('slotDone'));
    ev.on('status', ({ status }) => {
      if (g !== this.game) return;
      if (status === 'won') {
        // Son piksel alındı; kazanma paneli son karınca yuvaya girince açılır (loop'ta).
        platform.setPlaying(false);
        this.winPending = g;
      } else if (status === 'lost') {
        platform.setPlaying(false);
        audio.play('lose');
        haptics.buzz('lose');
        setTimeout(() => g === this.game && g.status === 'lost' && this.showLose(), 350);
      } else if (status === 'playing') {
        platform.setPlaying(true);
      }
    });
  }

  private showWin() {
    audio.play('win');
    haptics.buzz('win');
    this.renderer.celebrate();
    const n = this.levelNo;
    const stars = Math.max(1, 3 - this.boostersUsed);
    const d = this.entry!.difficulty;
    const bonus = { easy: 0, medium: ECONOMY.mediumBonus, hard: ECONOMY.hardBonus, extreme: ECONOMY.extremeBonus };
    const reward = ECONOMY.winReward + bonus[d];
    // Aynı bölümü tekrar oynayarak altın kasılmasın: ödül yalnızca ilk kazanışta.
    const first = n >= progress.data.unlocked;
    progress.update((p) => {
      p.unlocked = Math.max(p.unlocked, n + 1);
      p.stars[n] = Math.max(p.stars[n] ?? 0, stars);
      if (first) p.coins += reward;
    }, true);
    this.refreshHud();
    const name = this.entry!.art.name[getLang()];
    const go = () => this.showTitle();
    this.openOverlay(
      modal({
        title: t('winTitle'),
        head: 'purple',
        body: [
          foodThumb(this.entry!.art),
          h('div', { class: 'sub' }, name),
          first ? h('div', { class: 'reward-line' }, icon('coin'), `+${reward}`) : null,
        ],
        actions: [button(t('continue'), 'green big', go)],
        onBackdrop: go,
      }),
      false,
    );
  }

  private showLose() {
    const g = this.game!;
    const canSlot = g.slots.length < g.cfg.maxSlots;
    this.openOverlay(
      modal({
        title: t('loseTitle'),
        head: 'blue',
        body: [
          h('p', {}, t('loseSub')),
          progress.data.unlimitedUntil > Date.now() ? null : h('div', { class: 'life-note' }, icon('heart'), t('loseLife')),
        ],
        actions: [
          canSlot ? this.powerButton('slot', 'green', () => this.usePower('slot', true)) : null,
          this.powerButton('gun', 'yellow', () => this.usePower('gun', true)),
          h(
            'div',
            { class: 'row' },
            button(t('retry'), 'blue small', () => (this.forfeit(), this.startLevel(this.levelNo)), 'retry'),
            button(t('home'), 'red small', () => (this.forfeit(), this.showTitle()), 'home'),
          ),
        ],
      }),
      false,
    );
  }

  /** Güç butonu: envanterde varsa adet, yoksa altın fiyatı gösterir. */
  private powerButton(kind: 'slot' | 'gun', cls: string, fn: () => void) {
    const have = progress.data.boosters[kind];
    const b = button(t(kind === 'slot' ? 'adSlot' : 'p_gun'), `${cls} fit`, fn);
    b.append(
      have > 0
        ? h('span', {}, ` (${have})`)
        : h('span', { class: 'price' }, ' · ', icon('coin'), String(ECONOMY.prices[kind])),
    );
    return b;
  }

  /* ---------------- Güçler ve ekonomi ---------------- */

  private powerTitle(kind: PowerId): string {
    return kind === 'speed' ? t('speedPower') : t(`p_${kind}` as StrKey);
  }

  private powerDesc(kind: PowerId): string {
    return kind === 'speed' ? t('speedDesc') : t(`d_${kind}` as StrKey);
  }

  /**
   * Bir gücü kullan. Envanterde varsa harcar; yoksa satın alma panelini açar.
   * fromLose: kaybetme panelinden çağrıldı (oyun 'lost' durumunda).
   * Parmak hemen harcanmaz: önce seçim modu açılır, bir renge dokunulunca harcanır.
   */
  private usePower(kind: BoostId, fromLose = false) {
    const g = this.game;
    if (!g || (g.status !== 'playing' && !(fromLose && g.status === 'lost'))) return;
    if (kind === 'hand' && this.handMode) {
      this.setHandMode(false);
      return;
    }
    if (kind === 'slot' && g.slots.length >= g.cfg.maxSlots) {
      this.toast(t('maxSlots').replace('{n}', String(g.cfg.maxSlots)));
      audio.play('blocked');
      haptics.buzz('blocked');
      return;
    }
    if (kind === 'gun' && this.minigun.active) return;
    if (kind === 'rainbow' && g.freeSlot() < 0) {
      this.toast(t('noFreeSlot'));
      audio.play('blocked');
      return;
    }
    if (progress.data.boosters[kind] <= 0) {
      this.openShop(kind, fromLose);
      return;
    }
    // İlk kullanımda gücü kısaca tanıt; "Dene!" deyince kullanılır.
    if (!fromLose && this.introPower(kind, () => this.usePower(kind))) return;
    if (fromLose) this.closeOverlay(true);
    if (kind === 'hand') {
      this.setHandMode(true);
      return;
    }
    if (this.applyBooster(kind)) progress.update((p) => p.boosters[kind]--);
    this.refreshHud();
  }

  /** Gücü uygula; uygulanamadıysa (hedef yok vb.) false — o zaman hak harcanmaz. */
  private applyBooster(kind: 'slot' | 'gun' | 'rainbow'): boolean {
    const g = this.game;
    if (!g) return false;
    let ok = false;
    if (kind === 'slot') ok = g.addSlot();
    else if (kind === 'rainbow') ok = g.addRainbow(ECONOMY.rainbowAnts);
    else {
      const n = g.nestAnchor;
      const e = g.track.pointAt(g.track.entrance);
      // Silah yuvanın solunda, tahtanın altında belirir.
      ok = this.minigun.start(g, n ? n.x - n.r - 2.6 : e.x - 4, n ? n.y : e.y + 2);
    }
    if (ok) {
      this.boostersUsed++;
      haptics.buzz('power');
    }
    return ok;
  }

  /* ---------------- Parmak: renk seçim modu ---------------- */

  private handMode = false;
  private toastEl: HTMLElement | null = null;

  private setHandMode(on: boolean) {
    this.handMode = on;
    this.renderer.handMode = on;
    this.hud.setActive(on ? 'hand' : null);
    if (on) this.toast(t('handPick'), true);
    else this.hideToast();
  }

  /** Seçim modunda dokunulan yer: tahtada bir renkse o rengi sil, değilse modu kapat. */
  private handTap(px: number, py: number) {
    const g = this.game!;
    // Büyük resimlerde pikseller çok küçük: parmağın altındaki en yakın dolu pikseli al.
    const cell = this.renderer.nearestFilledCell(px, py, 18);
    const c = cell ? g.board.get(cell.x, cell.y) : null;
    if (!c || c.hp <= 0) {
      this.setHandMode(false);
      return;
    }
    const n = g.wipeColor(c.color);
    if (n > 0) {
      progress.update((p) => p.boosters.hand--);
      this.boostersUsed++;
      audio.play('burn');
      haptics.buzz('power');
    }
    this.setHandMode(false);
    this.refreshHud();
  }

  /** Ekranın üstünde kısa bilgi yazısı. */
  private toast(text: string, sticky = false) {
    this.hideToast();
    this.toastEl = h('div', { class: 'power-toast' }, text);
    this.ui.append(this.toastEl);
    if (!sticky) {
      const el = this.toastEl;
      setTimeout(() => {
        if (this.toastEl === el) this.hideToast();
      }, 1500);
    }
  }

  private hideToast() {
    this.toastEl?.remove();
    this.toastEl = null;
  }

  /** "Bu gücün fiyatı şu kadar, al" paneli. Altın yetmezse ödüllü reklam seçeneği. */
  private powerIcon(kind: PowerId): HTMLElement {
    const icoName = ({ slot: 'plusSlot', gun: 'gun', hand: 'hand', rainbow: 'rainbowNest', speed: 'fast' } as const)[kind];
    const iconBox = h('div', { class: 'shop-icon' }, icon(icoName, ''));
    if (kind === 'speed') iconBox.style.background = 'linear-gradient(#95d4ff, #35a0ff)';
    return iconBox;
  }

  /**
   * Gücün ilk kullanımı: ne yaptığını anlatan kısa pencere. Gösterildiyse true döner;
   * oyuncu "Dene!" deyince pencere kapanır ve `then` çalışır (güç kullanılır).
   */
  private introPower(kind: PowerId, then: () => void): boolean {
    const id = `power_${kind}`;
    if (progress.data.tips.includes(id)) return false;
    const go = () => {
      progress.update((p) => p.tips.push(id), true);
      this.closeOverlay(true);
      then();
    };
    this.openOverlay(
      modal({
        title: this.powerTitle(kind),
        head: kind === 'speed' ? 'blue' : 'purple',
        body: [
          this.powerIcon(kind),
          h('p', {}, this.powerDesc(kind)),
          kind === 'speed' ? h('p', {}, t('speedIntro')) : null,
        ],
        actions: [button(t('tryIt'), 'green big', go)],
        onClose: () => {
          progress.update((p) => p.tips.push(id), true);
          this.closeOverlay(true);
        },
      }),
      true,
    );
    return true;
  }

  private openShop(kind: PowerId, fromLose = false) {
    const price = ECONOMY.prices[kind];
    const note = h('div', { class: 'note' });
    const back = () => (fromLose ? this.showLose() : this.closeOverlay(true));
    const grant = () => {
      this.closeOverlay(true);
      if (kind === 'speed') this.startSpeed();
      else {
        // Satın alınan hak envantere eklenir; butonda "1" görünür, oyuncu istediği an kullanır.
        // Kaybetme panelinden alındıysa oyunu kurtarmak için hemen kullanılır.
        progress.update((p) => p.boosters[kind]++, true);
        if (fromLose) this.usePower(kind, true);
        else this.refreshHud();
      }
    };
    const buy = () => {
      if (progress.data.coins < price) {
        note.textContent = t('notEnough');
        audio.play('blocked');
        return;
      }
      progress.update((p) => (p.coins -= price), true);
      audio.play('slotDone');
      this.refreshHud();
      grant();
    };
    const iconBox = this.powerIcon(kind);
    const buyBtn = button(null, 'green big', buy);
    buyBtn.append(h('span', { class: 'price' }, icon('coin'), String(price)));
    this.openOverlay(
      modal({
        title: this.powerTitle(kind),
        head: kind === 'speed' ? 'blue' : 'purple',
        body: [
          iconBox,
          h('p', {}, this.powerDesc(kind)),
          h('div', { class: 'coin-pill in-panel' }, icon('coin'), String(progress.data.coins)),
          note,
        ],
        actions: [buyBtn],
        onClose: back,
      }),
      true,
    );
  }

  /* ---------------- Hızlı karıncalar ---------------- */

  private speedSaveTimer = 0;

  private speedActive(): boolean {
    return progress.data.speedOn && progress.data.speedLeft > 0;
  }

  /**
   * Hız gücü butonu: süre varsa aç / kapat (kapalıyken süre akmaz, sonra kaldığı yerden
   * devam eder); süre yoksa satın alma paneli.
   */
  private onSpeedButton() {
    if (!this.game || this.game.status !== 'playing') return;
    // Final hızlanmasında buton çalışmaz (zaten hızlı, süre harcanmıyor).
    if (this.finale) return;
    if (progress.data.speedLeft <= 0) {
      this.openShop('speed');
      return;
    }
    if (this.introPower('speed', () => this.onSpeedButton())) return;
    progress.update((p) => (p.speedOn = !p.speedOn), true);
    audio.play(progress.data.speedOn ? 'tap' : 'button');
    this.applySpeed();
    this.refreshHud();
  }

  /** Satın alınan süre mevcut sürenin üstüne eklenir ve güç açılır. */
  private startSpeed() {
    progress.update((p) => {
      p.speedLeft += ECONOMY.speedDuration;
      p.speedOn = true;
    }, true);
    this.applySpeed();
    this.refreshHud();
  }

  /** Süre yalnızca güç açıkken ve aktif oynarken akar; bitince normal hıza dön. */
  /**
   * Final hızlanması: sütunlarda dokunulacak grup kalmadı (hepsi slotlarda), bölüm bitmek üzere.
   * Oyun kendiliğinden hızlı moda geçer; bu, satın alınan hız süresinden harcamaz.
   */
  private finale = false;

  private checkFinale() {
    const g = this.game;
    if (!g || this.finale) return;
    if (g.columns.every((c) => c.length === 0)) {
      this.finale = true;
      this.applySpeed();
      // Hız gücü açıksa butonu duraklatılmış göster (süreden harcanmaz; tercih saklı kalır).
      this.refreshHud();
    }
  }

  /** Oyun hızı: final hızlanması ya da açık hız gücü → hızlı, değilse normal. */
  private applySpeed() {
    if (!this.game) return;
    this.game.speed = this.finale || this.speedActive() ? ECONOMY.speedMultiplier : 1;
  }

  private tickSpeed(dt: number) {
    const p = progress.data;
    // Final hızlanmasında oyuncunun hız süresi harcanmaz.
    if (p.speedLeft <= 0 || !p.speedOn || this.finale) return;
    p.speedLeft = Math.max(0, p.speedLeft - dt);
    this.hud.setSpeed(p.speedLeft, p.speedOn);
    this.speedSaveTimer += dt;
    if (p.speedLeft === 0) {
      progress.data.speedOn = false;
      this.applySpeed();
      // Süre bitti: güç kapalıya döner, yeni süre gelince oyuncu kendisi açar.
      progress.update((q) => (q.speedOn = false));
      this.refreshHud();
      this.speedSaveTimer = 0;
    } else if (this.speedSaveTimer > 5) {
      // Her karede değil, birkaç saniyede bir kaydet.
      progress.update(() => {});
      this.speedSaveTimer = 0;
    }
  }

  private openMenu() {
    if (this.game) this.openSettings();
  }

  private refreshHud() {
    const p = progress.data;
    this.hud.set(this.levelNo, p.boosters, p.coins, p.speedLeft, p.speedOn && !this.finale);
  }
}

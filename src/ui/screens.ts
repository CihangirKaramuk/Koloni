import type { DailyReward } from '../daily';
import type { PixelArt } from '../level/art/foods';
import { CHAR_TO_COLOR, colorHex } from '../level/palette';
import { button, h, icon } from './dom';
import { t, type StrKey } from './i18n';

import type { Difficulty } from '../level/levels';
export type { Difficulty };

/* ---------------- Ana ekran ---------------- */

export interface HomeOpts {
  level: number;
  difficulty: Difficulty;
  userName: string | null;
  canLogin: boolean;
  onPlay(): void;
  onSettings(): void;
  onHow(): void;
  onLogin(): void;
}

/** Ana ekran: logo, delikten yükselen bölüm küpü, büyük "Oyna" butonu. Bölüm seçimi yok. */
export function homeScreen(o: HomeOpts): HTMLElement {
  const letters = [...'Koloni'].map((ch, i) => h('span', { style: `animation-delay:${i * 0.12}s` }, ch));
  // Her zorluğun etiketi ve rengi (küp rengi CSS'te: kolay sarı, orta mavi, zor mor, ekstra zor kırmızı)
  const diffLabel: Record<Difficulty, StrKey> = { easy: 'easy', medium: 'medium', hard: 'hard', extreme: 'extreme' };
  const dl = diffLabel[o.difficulty];
  return h(
    'div',
    { class: 'screen passthrough' },
    h('div', { class: 'home-top' }, button(null, 'round blue', o.onHow, 'help'), button(null, 'round purple', o.onSettings, 'gear')),
    h('div', { class: 'logo' }, ...letters),
    h('div', { class: 'logo-sub' }, t('tagline')),
    h(
      'div',
      { class: `level-cube ${o.difficulty}` },
      h('div', { class: 'l1' }, t('level')),
      h('div', { class: 'l2' }, String(o.level)),
      h('div', { class: 'l3' }, t(dl)),
    ),
    o.userName ? h('div', { class: 'hello' }, `${t('hello')}, ${o.userName}!`) : null,
    h('div', { class: 'home-play' }, button(t('play'), 'purple big', o.onPlay)),
    !o.userName && o.canLogin ? h('div', { class: 'login-chip', onclick: o.onLogin }, t('login')) : null,
  );
}

/* ---------------- Ahşap panel (modal) ---------------- */

export interface ModalOpts {
  title: string;
  head?: 'blue' | 'purple';
  body: (Node | string | null)[];
  actions?: (Node | null)[];
  onClose?: () => void;
  /** Panelin dışına dokununca da çalışsın (ör. "devam etmek için dokun"). */
  onBackdrop?: () => void;
}

export function modal(o: ModalOpts): HTMLElement {
  const panel = h(
    'div',
    { class: 'panel' },
    // Uzun başlıklar (ör. "Gökkuşağı yuvası") daha küçük yazılır ki kapat butonuna değmesin.
    h('div', { class: `panel-head ${o.head ?? ''} ${o.title.length > 13 ? 'long' : ''}` }, o.title),
    ...o.body,
    o.actions ? h('div', { class: 'actions' }, ...o.actions) : null,
  );
  if (o.onClose) panel.append(button(null, 'round red close', o.onClose, 'close'));
  const bd = h('div', { class: 'backdrop' }, panel);
  if (o.onBackdrop) bd.addEventListener('click', (e) => e.target === bd && o.onBackdrop!());
  return bd;
}

export function starsRow(n: number): HTMLElement {
  const row = h('div', { class: 'stars' });
  for (let k = 1; k <= 3; k++) row.append(icon(k <= n ? 'star' : 'starOff', 's'));
  return row;
}

/** Bölüm resminin önizlemesi (kazanınca tam hali gösterilir). */
export function foodThumb(art: PixelArt, px = 150): HTMLCanvasElement {
  const w = Math.max(...art.rows.map((r) => r.length));
  const hgt = art.rows.length;
  const c = h('canvas', { class: 'food-thumb', width: w, height: hgt });
  const ctx = c.getContext('2d')!;
  art.rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const id = CHAR_TO_COLOR[ch];
      if (id === undefined) return;
      ctx.fillStyle = colorHex(id);
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  const s = Math.max(1, Math.floor(px / Math.max(w, hgt)));
  c.style.width = `${w * s}px`;
  c.style.height = `${hgt * s}px`;
  return c;
}

/** Ses / müzik / hız ayarları: yuvarlak, açıkken yeşil kapalıyken gri ikon butonlar. */
export function toggleIcons(items: { label: string; icon: 'sound' | 'music' | 'fast' | 'vibrate'; value: boolean; onChange(v: boolean): void }[]) {
  return h(
    'div',
    { class: 'toggles' },
    ...items.map((it) => {
      let v = it.value;
      const b = button(null, `round ${v ? '' : 'grey'}`, () => {
        v = !v;
        b.classList.toggle('grey', !v);
        it.onChange(v);
      }, it.icon);
      return h('div', { class: 'toggle-item' }, h('span', {}, it.label), b);
    }),
  );
}

export function howToBody(): HTMLElement {
  const keys: StrKey[] = ['how1', 'how2', 'how3', 'how4'];
  return h(
    'div',
    { class: 'how' },
    ...keys.map((k, i) => h('div', { class: 'step' }, h('div', { class: 'num' }, String(i + 1)), h('span', {}, t(k)))),
  );
}

/** Zor bölüm başında kısa afiş. */
export function difficultyBanner(d: Difficulty): HTMLElement | null {
  if (d !== 'hard' && d !== 'extreme') return null;
  return h(
    'div',
    { class: `banner ${d}` },
    h('div', { class: 'b1' }, t(d === 'hard' ? 'hardBanner' : 'extremeBanner')),
    h('div', { class: 'b2' }, t('level')),
  );
}

/* ---------------- Can göstergesi ---------------- */

export interface HeartView {
  el: HTMLElement;
  update(lives: number, full: boolean, nextIn: number, unlimitedLeft: number): void;
}

/** Kalp + can sayısı + sayaç (dolu / 14:59 / ∞ 09:54). */
export function heartPill(fmt: (ms: number) => string, onClick?: () => void): HeartView {
  const num = h('span', { class: 'heart-num' });
  const label = h('span', { class: 'heart-label' });
  const el = h('div', { class: 'heart-pill', onclick: onClick }, h('span', { class: 'heart-ico' }, icon('heart', ''), num), label);
  return {
    el,
    update(lives, full, nextIn, unlimitedLeft) {
      const inf = unlimitedLeft > 0;
      el.classList.toggle('inf', inf);
      num.textContent = inf ? '∞' : String(lives);
      label.textContent = inf ? fmt(unlimitedLeft) : full ? t('full') : fmt(nextIn);
    },
  };
}

/* ---------------- Günlük ödül ---------------- */


const POWER_ICON = { slot: 'plusSlot', gun: 'gun', hand: 'hand', rainbow: 'rainbowNest' } as const;

export function rewardIcon(r: DailyReward): HTMLElement {
  // Paket: içindeki ödüllerin simgeleri yan yana.
  if (r.kind === 'bundle') return h('div', { class: `r-bundle n${r.items.length}` }, ...r.items.map(rewardIcon));
  // Her güçten: dört güç simgesi 2×2.
  if (r.kind === 'allPowers')
    return h('div', { class: 'r-ico r-allPowers' }, ...(['slot', 'gun', 'hand', 'rainbow'] as const).map((id) => icon(POWER_ICON[id], '')));
  const name = r.kind === 'coins' ? 'coin' : r.kind === 'speed' ? 'fast' : r.kind === 'unlimited' ? 'heart' : POWER_ICON[r.id];
  const box = h('div', { class: `r-ico r-${r.kind}` }, icon(name, ''));
  if (r.kind === 'unlimited') box.append(h('span', { class: 'r-inf' }, '∞'));
  return box;
}

export function rewardLabel(r: DailyReward): string {
  switch (r.kind) {
    case 'coins':
      return `${r.amount} ${t('rCoins')}`;
    case 'speed':
      return `${r.minutes} ${t('minutes')} ${t('rSpeed')}`;
    case 'unlimited':
      return `∞ ${t('rLives')} ${r.minutes} ${t('minutes')}`;
    case 'power':
      return r.amount > 1 ? `${t(`p_${r.id}` as StrKey)} ×${r.amount}` : t(`p_${r.id}` as StrKey);
    case 'allPowers':
      return t('allPowers');
    case 'bundle':
      // Her öğe kendi satırında (kartlarda "+" ile uzun tek satır sığmıyordu).
      return r.items.map(rewardLabel).join('\n');
  }
}

/** Kart için kısa alt yazı: yalnızca miktar ("50", "3 dk", "×1"); isimler özet penceresinde. */
function rewardCaption(r: DailyReward): string {
  switch (r.kind) {
    case 'coins':
      return String(r.amount);
    case 'speed':
    case 'unlimited':
      return `${r.minutes} ${t('minutes')}`;
    case 'power':
    case 'allPowers':
      return `×${r.amount}`;
    case 'bundle':
      return '';
  }
}

/** Kartta tek ödül: simge ve altında kısa miktar. */
function rewardChip(r: DailyReward): HTMLElement {
  return h('div', { class: 'r-chip' }, rewardIcon(r), h('span', { class: 'r-cap' }, rewardCaption(r)));
}

/** 7 günlük ödül ızgarası: alınanlar tikli, bugünkü parlak, sonrakiler sade. */
export function dailyGrid(rewards: DailyReward[], today: number, claimedToday: boolean): HTMLElement {
  return h(
    'div',
    { class: 'daily-grid' },
    ...rewards.map((r, i) => {
      const day = i + 1;
      const done = day < today || (day === today && claimedToday);
      const now = day === today && !claimedToday;
      return h(
        'div',
        {
          class: `daily-card ${done ? 'done' : ''} ${now ? 'today' : ''} ${day === rewards.length ? 'big' : ''}`,
          // Tam açıklama üzerine gelince (masaüstü) ve ödül alınınca özet penceresinde görünür.
          title: rewardLabel(r).split('\n').join(' + '),
        },
        h('div', { class: 'd-day' }, `${day}. ${t('day')}`),
        h('div', { class: `d-items n${r.kind === 'bundle' ? r.items.length : 1}` }, ...(r.kind === 'bundle' ? r.items : [r]).map(rewardChip)),
        done ? h('div', { class: 'd-check' }, icon('check', '')) : null,
      );
    }),
  );
}

/* ---------------- Yükleme ekranı ---------------- */

export interface LoadingView {
  el: HTMLElement;
  /** Çubuğu doldur, kısa bir an sonra `done` çağır. */
  finish(done: () => void): void;
}

/**
 * Tam ekran yükleme: büyük logo, deliğin etrafındaki karıncalar (canvas), altta
 * "YÜKLENİYOR…" ve dolan çubuk. Bölüm arkada hazırlanırken gösterilir.
 */
export function loadingScreen(): LoadingView {
  const fill = h('div', { class: 'load-fill' });
  const letters = [...'Koloni'].map((ch, i) => h('span', { style: `animation-delay:${i * 0.12}s` }, ch));
  const el = h(
    'div',
    { class: 'screen loading-screen passthrough' },
    h('div', { class: 'logo' }, ...letters),
    h('div', { class: 'logo-sub' }, t('tagline')),
    h('div', { class: 'load-box' }, h('div', { class: 'load-text' }, t('loading')), h('div', { class: 'load-bar' }, fill)),
  );
  // Hazır olana kadar çubuk yavaşça %90'a yaklaşır.
  let p = 0.05;
  let done = false;
  const tick = () => {
    if (done || !el.isConnected) return;
    p += (0.9 - p) * 0.04;
    fill.style.width = `${(p * 100).toFixed(1)}%`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return {
    el,
    finish(cb) {
      done = true;
      fill.style.transition = 'width 0.25s ease-out';
      fill.style.width = '100%';
      setTimeout(cb, 300);
    },
  };
}

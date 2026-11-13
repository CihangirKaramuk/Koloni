import { button, h, icon } from './dom';
import { t } from './i18n';

/** Alttaki 4 özel güç (hız gücü üstte ayrı). */
export type BoostId = 'slot' | 'gun' | 'hand' | 'rainbow';
export const BOOSTS: { id: BoostId; icon: 'plusSlot' | 'gun' | 'hand' | 'rainbowNest' }[] = [
  { id: 'slot', icon: 'plusSlot' },
  { id: 'gun', icon: 'gun' },
  { id: 'hand', icon: 'hand' },
  { id: 'rainbow', icon: 'rainbowNest' },
];

/** Masaüstü klavye kısayolları: güçler. */
export const BOOST_KEYS: Record<BoostId, string> = { slot: 'q', gun: 'w', hand: 'e', rainbow: 'r' };

export interface HudActions {
  menu(): void;
  boost(id: BoostId): void;
  speed(): void;
}

/** Alt güçlendirici çubuğunun yüksekliği (canvas yerleşimi bunu boş bırakır). */
export const HUD_BOTTOM = 64;

/** Oyun içi arayüz: üstte ayarlar / bölüm / hız gücü, altta mor güçler çubuğu. */
export class Hud {
  readonly el: HTMLDivElement;
  private level: HTMLDivElement;
  private badges = new Map<BoostId, HTMLSpanElement>();
  private buttons = new Map<BoostId, HTMLButtonElement>();
  private speedBadge: HTMLSpanElement;
  private speedBtn: HTMLButtonElement;
  private speedLabel: HTMLSpanElement;
  private coins: HTMLSpanElement;
  private bar: HTMLDivElement;
  private levelText: HTMLSpanElement;
  private barPct = -1;

  constructor(a: HudActions) {
    this.levelText = h('span', {});
    this.bar = h('div', { class: 'fill' });
    // İlerleme çubuğu bölüm etiketinin içinde, yazının altında: ayrı bir satır kaplamaz.
    this.level = h('div', { class: 'level-pill' }, this.levelText, h('div', { class: 'level-progress', title: t('progress') }, this.bar));
    const menu = button(null, 'round purple', a.menu, 'gear');
    menu.title = t('settings');
    this.speedLabel = h('span', {}, '2x');
    this.speedBadge = h('span', { class: 'badge mini' });
    this.speedBtn = button(null, 'speed grey', a.speed, 'fast');
    this.speedBtn.append(this.speedLabel, this.speedBadge);
    this.speedBtn.title = `${t('speedPower')} (Space)`;

    const boosts = BOOSTS.map(({ id, icon: ico }) => {
      const badge = h('span', { class: 'badge' });
      const label = t(`p_${id}`);
      const key = BOOST_KEYS[id].toUpperCase();
      const b = h(
        'button',
        { class: 'boost', type: 'button', title: `${label} (${key})`, 'aria-label': label, onclick: () => a.boost(id) },
        icon(ico),
        badge,
        h('span', { class: 'key-hint' }, key),
      );
      this.badges.set(id, badge);
      this.buttons.set(id, b);
      return b;
    });

    this.coins = h('span', {});
    this.el = h(
      'div',
      { class: 'hidden' },
      h(
        'div',
        { class: 'hud-top' },
        menu,
        // Ortada: bölüm adı (içinde ilerleme çubuğu) ve hemen altında altın bakiyesi
        h('div', { class: 'top-center' }, this.level, h('div', { class: 'coin-pill in-top' }, icon('coin'), this.coins)),
        this.speedBtn,
      ),
      h('div', { class: 'hud-bottom' }, h('div', { class: 'bar-inner' }, ...boosts)),
    );
  }

  show(on: boolean) {
    this.el.classList.toggle('hidden', !on);
  }

  set(level: number, counts: Record<BoostId, number>, coins: number, speedLeft: number, speedOn: boolean) {
    this.levelText.textContent = `${t('level')} ${level}`;
    for (const { id } of BOOSTS) this.setBadge(this.badges.get(id)!, counts[id] ?? 0);
    this.setCoins(coins);
    this.setSpeed(speedLeft, speedOn);
  }

  /** Resmin yenen oranı (0..1). DOM yalnızca yüzde değişince güncellenir. */
  setProgress(f: number) {
    const pct = Math.round(Math.max(0, Math.min(1, f)) * 100);
    if (pct === this.barPct) return;
    this.barPct = pct;
    this.bar.style.width = `${pct}%`;
  }

  /** Bir güç butonunu "seçili" göster (ör. parmak seçim modu). */
  setActive(id: BoostId | null) {
    for (const [k, b] of this.buttons) b.classList.toggle('active', k === id);
  }

  setCoins(n: number) {
    this.coins.textContent = String(n);
  }

  /**
   * Hız gücü üç durumda:
   * - açık: mavi, süre geri sayar
   * - duraklatılmış: gri, kalan süre görünür, "II" rozeti
   * - süre yok: gri, "2x" ve yeşil "+" (satın alınabilir)
   */
  setSpeed(left: number, on: boolean) {
    const has = left > 0;
    const active = has && on;
    this.speedBtn.classList.toggle('blue', active);
    this.speedBtn.classList.toggle('grey', !active);
    this.speedBadge.classList.toggle('hidden', active);
    this.speedBadge.classList.toggle('plus', !has);
    this.speedBadge.classList.toggle('paused', has && !on);
    this.speedBadge.textContent = has ? 'II' : '+';
    const s = Math.ceil(left);
    this.speedLabel.textContent = has ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '2x';
  }

  private setBadge(el: HTMLSpanElement, n: number) {
    el.textContent = n > 0 ? String(n) : '+';
    el.classList.toggle('plus', n <= 0);
  }
}

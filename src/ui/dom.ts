import { ICONS, type IconName } from './icons';

type Child = Node | string | null | undefined | false;

/** Minik DOM oluşturucu: h('div', { class: 'x', onclick }, ...çocuklar) */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else el.setAttribute(k, String(v));
  }
  for (const c of children) if (c) el.append(c);
  return el;
}

export function icon(name: IconName, cls = 'ico'): HTMLSpanElement {
  return h('span', { class: cls, html: ICONS[name] });
}

/** Tıklamada küçük ses + çift tıklama koruması olan buton. */
export function button(
  label: string | Node | null,
  cls: string,
  onClick: () => void,
  ico?: IconName,
): HTMLButtonElement {
  let busy = false;
  const b = h('button', {
    class: `btn ${cls}`,
    type: 'button',
    onclick: () => {
      if (busy) return;
      busy = true;
      setTimeout(() => (busy = false), 250);
      onButton();
      onClick();
    },
  });
  if (ico) b.append(icon(ico));
  if (label) b.append(label);
  return b;
}

let onButton: () => void = () => {};
export function setButtonSound(fn: () => void) {
  onButton = fn;
}

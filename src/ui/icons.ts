/** Arayüz ikonları: parlak butonların üstünde duran beyaz/renkli, yumuşak gölgeli simgeler. */
const SH = 'rgba(80,30,10,0.35)';
const svg = (body: string, vb = '0 0 32 32') =>
  `<svg viewBox="${vb}" width="100%" height="100%" aria-hidden="true" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
/** Aynı şekli önce gölge, sonra beyaz çizer (kabartma hissi). */
const raised = (d: string, fill = '#fff') => `<path d="${d}" fill="${SH}" transform="translate(0 1.6)"/><path d="${d}" fill="${fill}"/>`;

export const ICONS = {
  gear: svg(
    raised(
      'M13.6 3h4.8l.8 3.4 2.4 1 3-1.8 3.4 3.4-1.8 3 1 2.4 3.4.8v4.8l-3.4.8-1 2.4 1.8 3-3.4 3.4-3-1.8-2.4 1-.8 3.4h-4.8l-.8-3.4-2.4-1-3 1.8-3.4-3.4 1.8-3-1-2.4L3 18.4v-4.8l3.4-.8 1-2.4-1.8-3 3.4-3.4 3 1.8 2.4-1zM16 11a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
    ),
  ),
  fast: svg(raised('M4 7.5l11 8.5-11 8.5zM16 7.5l11 8.5-11 8.5z')),
  plusSlot: svg(
    `<rect x="4" y="12" width="24" height="16" rx="5" fill="#f6c9c0"/><rect x="4" y="10" width="24" height="15" rx="5" fill="#ffe3dc"/>` +
      `<path d="M13 4h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill="#2f9a1e" transform="translate(0 1.4)"/><path d="M13 4h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill="#6fdc3c"/>`,
  ),
  fire: svg(
    `<path d="M16 2c1.2 5 8.5 8 8.5 16.5a8.5 8.5 0 0 1-17 0c0-4.3 2.2-6.6 4.3-8.6 0 3.2 1.1 5.3 3.2 5.3-2.2-5.3 0-10.6 1-13.2z" fill="#d6420f" transform="translate(0 1.4)"/>` +
      `<path d="M16 2c1.2 5 8.5 8 8.5 16.5a8.5 8.5 0 0 1-17 0c0-4.3 2.2-6.6 4.3-8.6 0 3.2 1.1 5.3 3.2 5.3-2.2-5.3 0-10.6 1-13.2z" fill="#ff7a1a"/>` +
      `<path d="M16 17c2.2 2 4.2 3.4 4.2 6.3a4.2 4.2 0 0 1-8.4 0c0-2.2 2.1-4.3 4.2-6.3z" fill="#ffd23f"/>`,
  ),
  close: svg(raised('M8.5 6l7.5 7.5L23.5 6l2.5 2.5-7.5 7.5 7.5 7.5-2.5 2.5-7.5-7.5L8.5 26 6 23.5l7.5-7.5L6 8.5z')),
  play: svg(raised('M10 5.5l17 10.5-17 10.5z')),
  retry: svg(raised('M16 5a11 11 0 1 1-10.6 13.8l3.9-1A7 7 0 1 0 16 9v4l-6-6 6-6z')),
  home: svg(raised('M16 4l13 11.5h-4V28h-6v-8h-6v8H7V15.5H3z')),
  help: svg(
    raised('M16 3a13 13 0 1 1 0 26 13 13 0 0 1 0-26z', '#fff') +
      '<path d="M12.3 12.6a3.8 3.8 0 1 1 5.4 3.4c-1.1.6-1.7 1.3-1.7 2.6" fill="none" stroke="#3a8dff" stroke-width="3.2"/><circle cx="16" cy="23.2" r="2" fill="#3a8dff"/>',
  ),
  sound: svg(raised('M4 12h5l7-6v20l-7-6H4zM20 10.5a7 7 0 0 1 0 11l-2-2.2a4 4 0 0 0 0-6.6zM23 6.5a12 12 0 0 1 0 19l-2-2.3a9 9 0 0 0 0-14.4z')),
  vibrate: svg(
    raised('M11 4h10a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm1 4v15h8V8z') +
      raised('M5 10l2 1.5v9L5 22zM27 10l-2 1.5v9l2 1.5z'),
  ),
  music: svg(raised('M12 6l15-3v17.5a4 4 0 1 1-3-3.9V8.2l-9 1.8v14a4 4 0 1 1-3-3.9z')),
  ad: svg(
    `<rect x="3" y="7" width="26" height="19" rx="5" fill="#b1221a"/><rect x="3" y="5.5" width="26" height="19" rx="5" fill="#f2493d"/>` +
      `<path d="M13 10.5l8 4.5-8 4.5z" fill="#fff"/>`,
  ),
  star: svg(
    `<path d="M16 3.5l3.9 8.1 8.6 1.1-6.3 6 1.6 8.7L16 23.2l-7.8 4.2 1.6-8.7-6.3-6 8.6-1.1z" fill="#d08a00" transform="translate(0 1.5)"/>` +
      `<path d="M16 3.5l3.9 8.1 8.6 1.1-6.3 6 1.6 8.7L16 23.2l-7.8 4.2 1.6-8.7-6.3-6 8.6-1.1z" fill="#ffd23f"/>` +
      `<path d="M12 11l3-.4" stroke="#fff6c8" stroke-width="2"/>`,
  ),
  /** Havan topu: turuncu gövde, döner gri namlular, ahşap kaide, namlu ateşi */
  gun: svg(
    `<rect x="3" y="21" width="20" height="9" rx="3" fill="#7b4822"/><rect x="3" y="20" width="20" height="8" rx="3" fill="#b57a48"/>` +
      `<rect x="13" y="7.5" width="14" height="3.2" rx="1.6" fill="#626881"/><rect x="13" y="11.5" width="14" height="3.2" rx="1.6" fill="#c9cddb"/><rect x="13" y="15.5" width="14" height="3.2" rx="1.6" fill="#8a8fa3"/>` +
      `<rect x="24" y="6" width="3" height="14" rx="1.4" fill="#4a4f63"/>` +
      `<rect x="4" y="7" width="12" height="15" rx="4" fill="#d6420f"/><rect x="4" y="6" width="12" height="14" rx="4" fill="#ff7a1a"/><rect x="6" y="8" width="7" height="2.5" rx="1.2" fill="#ffb98a"/>` +
      `<path d="M29.5 9.5l2-2 .5 3 2 .3-1.8 1.5 1 2.6-2.6-1-1.6 2-.3-2.6-2.6-.8 2.4-1.4z" fill="#ffd23f"/>`,
  ),
  /** Parmak: sarı eldivenli işaret parmağı */
  hand: svg(
    `<rect x="10.5" y="3" width="6.5" height="17" rx="3.2" fill="#e0a01a"/><rect x="10.5" y="2" width="6.5" height="16" rx="3.2" fill="#ffd23f"/>` +
      `<rect x="8" y="13" width="17" height="15" rx="5.5" fill="#e0a01a"/><rect x="8" y="12" width="17" height="14" rx="5.5" fill="#ffd23f"/>` +
      `<path d="M17 15.5v4M20.5 15.5v4" stroke="#e0a01a" stroke-width="1.6" stroke-linecap="round"/>` +
      `<rect x="7" y="25" width="19" height="5.5" rx="2.5" fill="#fff"/><rect x="7" y="28.2" width="19" height="2.3" rx="1.1" fill="#d4cdc3"/>` +
      `<rect x="12" y="4" width="2.2" height="6" rx="1.1" fill="#fff6c8"/>`,
  ),
  /** Gökkuşağı yuvası: iç içe renkli tepecik ve karınca deliği */
  rainbowNest: svg(
    `<path d="M2 28a14 14 0 0 1 28 0z" fill="#ee4035"/><path d="M5 28a11 11 0 0 1 22 0z" fill="#ff8c1a"/>` +
      `<path d="M8 28a8 8 0 0 1 16 0z" fill="#ffd23f"/><path d="M11 28a5 5 0 0 1 10 0z" fill="#4cc34a"/>` +
      `<ellipse cx="16" cy="27.5" rx="3.6" ry="2.3" fill="#3f230d"/>` +
      `<path d="M2 28h28" stroke="#3a8dff" stroke-width="2.4" stroke-linecap="round"/>` +
      `<circle cx="8" cy="9" r="1.6" fill="#ff79b0"/><circle cx="24" cy="7" r="1.4" fill="#86dcff"/><circle cx="27" cy="13" r="1.1" fill="#ffd23f"/>`,
  ),
  heart: svg(
    `<path d="M16 28.5S3 20.6 3 11.6A6.6 6.6 0 0 1 16 9a6.6 6.6 0 0 1 13 2.6c0 9-13 16.9-13 16.9z" fill="#b0221a" transform="translate(0 1.4)"/>` +
      `<path d="M16 28.5S3 20.6 3 11.6A6.6 6.6 0 0 1 16 9a6.6 6.6 0 0 1 13 2.6c0 9-13 16.9-13 16.9z" fill="#ff4d5e"/>` +
      `<path d="M8 9.5a4 4 0 0 1 4-2" stroke="#ffd0d5" stroke-width="2.2" fill="none"/>`,
  ),
  gift: svg(
    `<rect x="4" y="13" width="24" height="16" rx="4" fill="#d0407c"/><rect x="4" y="11" width="24" height="16" rx="4" fill="#ff79b0"/>` +
      `<rect x="2.5" y="8" width="27" height="7" rx="3" fill="#ff4d5e"/>` +
      `<rect x="13.5" y="8" width="5" height="19" fill="#ffd23f"/>` +
      `<path d="M16 8c-2-5-9-6-8-1 .5 2 4 2 8 1zM16 8c2-5 9-6 8-1-.5 2-4 2-8 1z" fill="#ffd23f" stroke="#e0a01a" stroke-width="1.2"/>`,
  ),
  check: svg(raised('M5 16.5l4-4 5 5L24 7.5l4 4-14 14z', '#5ccf3a')),
  coin: svg(
    `<circle cx="16" cy="17.5" r="13" fill="#c97a00"/><circle cx="16" cy="16" r="13" fill="#ffc21f"/>` +
      `<circle cx="16" cy="16" r="9.5" fill="#ffd95a" stroke="#e09a00" stroke-width="2"/>` +
      `<path d="M16 9.5l1.9 4 4.3.5-3.2 3 .9 4.3-3.9-2.2-3.9 2.2.9-4.3-3.2-3 4.3-.5z" fill="#e08a00"/>` +
      `<path d="M8.5 11a9 9 0 0 1 5-4.2" stroke="#fff6c8" stroke-width="2" fill="none"/>`,
  ),
  starOff: svg(
    `<path d="M16 3.5l3.9 8.1 8.6 1.1-6.3 6 1.6 8.7L16 23.2l-7.8 4.2 1.6-8.7-6.3-6 8.6-1.1z" fill="rgba(120,70,30,0.25)"/>`,
  ),
};

export type IconName = keyof typeof ICONS;

// Thin line icons (Ink, 2px), the category icons used when a food has no sticker, and the logo.
const svg = (body, { size = 24, stroke = 2, label } = {}) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${body}</svg>`;

const P = {
  home: '<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6.5H9V21H4.5a1 1 0 0 1-1-1z"/>',
  fridge: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M6 9.5h12M9 5.5v2M9 12.5v3"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>',
  people: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5"/>',
  plate: '<circle cx="12" cy="13" r="6.5"/><circle cx="12" cy="13" r="3.5"/><path d="M3 4v5M3 9v11M21 4c-1.5 1-2 3-2 5h2M21 9v11"/>',
  sprout: '<path d="M12 21v-8M12 13c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5zM12 15c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/>',
  plan: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  cart: '<path d="M3 4h2.2l2.3 10.6a1.2 1.2 0 0 0 1.2.9h8.9a1.2 1.2 0 0 0 1.2-.9L20.5 8H6.1"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  barcode: '<path d="M4 5v14M7 5v14M10.5 5v14M14 5v14M16.5 5v14M20 5v14"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7 10 4h4l1.5 3"/><circle cx="12" cy="13.5" r="3.4"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
  store: '<path d="M4 10h16l-1.5-5h-13z"/><path d="M5.5 10v10h13V10M10 20v-5h4v5"/>',
  cupboard: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M12 4v16M10 11v2M14 11v2"/>',
  jar: '<path d="M7 8h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"/><rect x="6" y="4" width="12" height="4" rx="1"/>',
  box: '<path d="M3.5 8 12 4l8.5 4v9L12 21l-8.5-4z"/><path d="M3.5 8 12 12l8.5-4M12 12v9"/>',
  balcony: '<path d="M3 11h18M4 20h16M6 11v9M10 11v9M14 11v9M18 11v9M8 11V6a4 4 0 0 1 8 0v5"/>',
  shelf: '<path d="M4 5h16M4 12h16M4 19h16M5 5v14M19 5v14"/>',
  fork: '<path d="M7 3v18M4.5 3v5a2.5 2.5 0 0 0 5 0V3M16.5 21V3c-2 1.4-3 3.8-3 6.6V13h3"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  moon: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z"/>',
  bars: '<path d="M5 20v-6M10 20V9M15 20v-9M20 20V5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  dots: '<circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/>',
};

export const ICON = Object.fromEntries(Object.entries(P).map(([k, body]) => [k, (o) => svg(body, o)]));
ICON.stop = () => '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor"/></svg>';

export const CAT_ICON = {
  meat: (o) => svg('<ellipse cx="15" cy="9" rx="6" ry="5" transform="rotate(-40 15 9)"/><path d="M11.2 12.8L7.2 16.8"/><circle cx="5.6" cy="16.4" r="1.7"/><circle cx="7.6" cy="18.4" r="1.7"/>', o),
  dairy: (o) => svg('<path d="M9 3h6M9.5 3v3L7 9.5V20a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5L14.5 6V3M7 13h10"/>', o),
  produce: (o) => svg('<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7"/>', o),
  other: (o) => svg('<rect x="6" y="8" width="12" height="13" rx="2.5"/><path d="M7.5 4.5h9V8h-9zM9 13h6"/>', o),
  nonfood: (o) => svg('<path d="M9 3h6v4l2 3v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V10l2-3z"/><path d="M7 14h10"/>', o),
};

// Icon for a storage place, from its name and kind (v0.2).
export function placeIcon(place, o) {
  const n = (place.name || '').toLowerCase();
  const k = /balcon/.test(n) ? 'balcony' : /bin|jar|tub|container|caddy/.test(n) ? 'jar' : /box|bed|drawer|crate|suitcase/.test(n) ? 'box'
    : /shelf|rack/.test(n) ? 'shelf' : place.kind === 'frozen' || /freez/.test(n) ? 'snow' : place.kind === 'cold' || /fridge/.test(n) ? 'fridge' : 'cupboard';
  return ICON[k](o);
}

// App icon from board 07: a narrow fridge that reads as a phone, red badge = something to eat first.
export function appIcon({ size = 32, badge = true } = {}) {
  return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">
    <rect width="40" height="40" rx="10" fill="var(--leaf)"/>
    <rect x="13" y="7" width="14" height="26" rx="3.5" fill="#fff" stroke="var(--ink)" stroke-width="2.2"/>
    <path d="M13 16h14M16.5 10.5v3M16.5 19v4.5" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>
    ${badge ? '<circle cx="28.5" cy="9" r="4" fill="var(--tomato)" stroke="#fff" stroke-width="1.5"/>' : ''}
  </svg>`;
}

// Wordmark: lower-case "eat it" + an exclamation mark made of a green bar and a tomato dot.
export function wordmark(size = 'md') {
  return `<span class="wordmark wm-${size}" role="img" aria-label="Eat It!">eat it<span class="bang" aria-hidden="true"><i></i><b></b></span></span>`;
}

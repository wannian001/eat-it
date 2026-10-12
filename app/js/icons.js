// Thin line icons (Ink, 2px) and the four category icons used when a food has no sticker.
const svg = (body, { size = 24, stroke = 2, label } = {}) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${body}</svg>`;

export const ICON = {
  grid: (o) => svg('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>', o),
  fridge: (o) => svg('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M6 9.5h12M9 5.5v2M9 12.5v3"/>', o),
  plus: (o) => svg('<path d="M12 5v14M5 12h14"/>', o),
  minus: (o) => svg('<path d="M5 12h14"/>', o),
  close: (o) => svg('<path d="M6 6l12 12M18 6L6 18"/>', o),
  back: (o) => svg('<path d="M15 5l-7 7 7 7"/>', o),
  check: (o) => svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', o),
  mic: (o) => svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>', o),
  lock: (o) => svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', o),
  snow: (o) => svg('<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>', o),
  people: (o) => svg('<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5"/>', o),
  plate: (o) => svg('<circle cx="12" cy="13" r="6.5"/><circle cx="12" cy="13" r="3.5"/><path d="M3 4v5M3 9v11M21 4c-1.5 1-2 3-2 5h2M21 9v11"/>', o),
  sprout: (o) => svg('<path d="M12 21v-8M12 13c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5zM12 15c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/>', o),
  stop: () => '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor"/></svg>',
  dots: (o) => svg('<circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/>', o),
};

export const CAT_ICON = {
  meat: (o) => svg('<ellipse cx="15" cy="9" rx="6" ry="5" transform="rotate(-40 15 9)"/><path d="M11.2 12.8L7.2 16.8"/><circle cx="5.6" cy="16.4" r="1.7"/><circle cx="7.6" cy="18.4" r="1.7"/>', o),
  dairy: (o) => svg('<path d="M9 3h6M9.5 3v3L7 9.5V20a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5L14.5 6V3M7 13h10"/>', o),
  produce: (o) => svg('<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7"/>', o),
  other: (o) => svg('<rect x="6" y="8" width="12" height="13" rx="2.5"/><path d="M7.5 4.5h9V8h-9zM9 13h6"/>', o),
};

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
export function wordmark() {
  return `<span class="wordmark" role="img" aria-label="Eat It!">eat it<span class="bang" aria-hidden="true"><i></i><b></b></span></span>`;
}

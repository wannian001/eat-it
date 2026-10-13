// Shared bits of markup. Every string that came from data goes through esc().
import { food, foodName, stickerUrl } from './foods.js?v=1d4b465';
import { dateTag, dot } from './dates.js?v=1d4b465';
import { CAT_ICON } from './icons.js?v=1d4b465';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Food picture: the sticker if there is one, otherwise the category icon (VISUAL-SPEC §5).
export function pic(foodId, { bag = false, size = 44, lot } = {}) {
  const f = food(foodId);
  const name = lot?.name && !f.sticker ? null : bag && f.bag ? f.bag : f.sticker;
  if (name) return `<img class="pic" src="${stickerUrl(name)}" width="${size}" height="${size}" alt="" draggable="false">`;
  const cat = lot?.cat || f.cat;
  return `<span class="pic pic-cat cat-${cat}" style="width:${size}px;height:${size}px">${(CAT_ICON[cat] || CAT_ICON.other)({ size: Math.round(size * 0.5) })}</span>`;
}

export function tag(date, today, ctx = 'tile') {
  const t = dateTag(date, today, ctx);
  if (!t.text) return '';
  return `<span class="tag tag-${t.kind}">${esc(t.text)}</span>`;
}

export function dotHtml(date, today) {
  const d = dot(date, today);
  return d ? `<span class="dot dot-${d}" aria-hidden="true"></span>` : '';
}

// Screen-reader label for a food tile, e.g. "Milk, use by Sun".
export function label(foodId, count, date, today, ctx, lot) {
  const t = date ? dateTag(date, today, ctx).text : '';
  const n = count > 1 ? `${count} ` : '';
  return `${n}${foodName(foodId, count, lot)}${t ? `, ${t.charAt(0).toLowerCase()}${t.slice(1)}` : ''}`;
}

export function qtyText(qty, unit) {
  if (unit === 'g') return qty >= 1000 ? `${+(qty / 1000).toFixed(2)} kg` : `${Math.round(qty)} g`;
  if (unit === 'L') return `${+qty.toFixed(2)} L`;
  if (unit === 'bag') return qty === 1 ? '1 bag' : `${qty} bags`;
  return String(+(+qty).toFixed(2));
}

// "500 g · half left" for a lot.
export function amountText(lot) {
  const q = qtyText(lot.qty, lot.unit);
  const a = lot.amount && lot.amount !== 'Full' ? `${lot.amount.toLowerCase()} left` : '';
  return [lot.unit === 'pc' && lot.qty === 1 ? '' : q, a].filter(Boolean).join(' · ') || '1';
}

// Page heading (v0.2 layout, hi-fi type): small eyebrow, big title, one line, an action on the right.
export function pageHead(eyebrow, title, sub, action = '') {
  return `<header class="phead"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${sub ? `<p class="psub">${sub}</p>` : ''}</div>${action ? `<div class="phead-act">${action}</div>` : ''}</header>`;
}

export function secHead(title, right = '') {
  return `<div class="sec-h"><h2>${title}</h2>${right}</div>`;
}

export function toggle(act, arg, on, label, disabled = false) {
  return `<button class="switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="${esc(label)}" data-act="${act}" data-arg="${esc(arg)}"${disabled ? ' disabled' : ''}><i></i></button>`;
}

export const aiBadge = '<span class="ai" title="Done by AI">AI</span>';

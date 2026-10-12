// Shared bits of markup. Every string that came from data goes through esc().
import { food, foodName, stickerUrl } from './foods.js';
import { dateTag, dot } from './dates.js';
import { CAT_ICON } from './icons.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Food picture: the sticker if there is one, otherwise the category icon (VISUAL-SPEC §5).
export function pic(foodId, { bag = false, size = 44 } = {}) {
  const f = food(foodId);
  const name = bag && f.bag ? f.bag : f.sticker;
  if (name) return `<img class="pic" src="${stickerUrl(name)}" width="${size}" height="${size}" alt="" draggable="false">`;
  return `<span class="pic pic-cat" style="width:${size}px;height:${size}px">${CAT_ICON[f.cat]({ size: Math.round(size * 0.55) })}</span>`;
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
export function label(foodId, count, date, today, ctx) {
  const t = date ? dateTag(date, today, ctx).text : '';
  const n = count > 1 ? `${count} ` : '';
  return `${n}${foodName(foodId, count)}${t ? `, ${t.charAt(0).toLowerCase()}${t.slice(1)}` : ''}`;
}

export function qtyText(qty, unit) {
  if (unit === 'g') return qty >= 1000 ? `${+(qty / 1000).toFixed(2)} kg` : `${Math.round(qty)} g`;
  if (unit === 'L') return `${+qty.toFixed(2)} L`;
  return String(+(+qty).toFixed(2));
}

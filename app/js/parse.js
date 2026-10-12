// Turn a spoken sentence into food taken out of the fridge, with no AI:
//   "I had one bag of beef, two tomatoes and three eggs."
//   -> beef 1 bag, tomato 2, eggs 3, plus the character spans to highlight on screen.
// Only foods in the catalogue are recognised. Anything else is ignored rather than guessed.
// exact = a number or a container was said ("two tomatoes", "one bag of beef"). Anything vaguer
// ("some spinach", "the curry") is asked about afterwards: how much is left?

import { FOODS, NOT_FOOD } from './foods.js';

const NUMBERS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, both: 2,
  'a couple of': 2, 'a couple': 2, 'couple of': 2, 'a dozen': 12, dozen: 12, 'half a dozen': 6 };
// "bag of beef" takes whole bags; "punnet of strawberries" counts pieces of the lot. A slice, bowl
// or piece is part of something ("two slices of toast" is not two loaves), so those are asked about.
const CONTAINERS = { bag: 'bag', bags: 'bag', pack: 'bag', packs: 'bag', packet: 'bag', packets: 'bag', box: 'bag', boxes: 'bag', tray: 'bag', trays: 'bag', carton: 'bag', cartons: 'bag',
  tub: 'pc', tubs: 'pc', bottle: 'pc', bottles: 'pc', punnet: 'pc', punnets: 'pc',
  piece: 'part', pieces: 'part', slice: 'part', slices: 'part', bowl: 'part', bowls: 'part', serve: 'part', serves: 'part', cup: 'part', cups: 'part', handful: 'part', plate: 'part', plates: 'part', spoonful: 'part', spoonfuls: 'part' };
// Words that can sit between the number and the food: "three large eggs".
const ADJ = '(?:(?:large|small|big|medium|fresh|whole|ripe|raw|cooked|leftover|organic|free range)\\s+)?';
// "didn't use the milk", "made it without milk": the food is named but nothing was taken.
const NOT_RE = /\b(?:didn'?t|did not|don'?t|do not|haven'?t|have not|hasn'?t|not|no|without|never)\b(?:\s+[a-z']+){0,3}\s*$/i;

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alt = (xs) => xs.map(esc).join('|');

// Aliases sorted longest first so "spring onion" wins over "onion" and "chicken thighs" over "chicken".
const ALIASES = [...Object.entries(FOODS).flatMap(([id, f]) => f.aliases.map((a) => [a, id])), ...NOT_FOOD.map((a) => [a, null])]
  .sort((a, b) => b[0].length - a[0].length);
const ALIAS_ID = Object.fromEntries(ALIASES);
const FOOD_RE = new RegExp(`\\b(${alt(ALIASES.map(([a]) => a))})\\b`, 'gi');

const OF = '(?:\\s+of)?(?:\\s+(?:the|my|a))?';
const PART_RE = new RegExp(`(?:^|[^a-z0-9])((?:some|a bit|a little|half|the rest|part)${OF})\\s+(?:(?:${alt(Object.keys(CONTAINERS))})\\s+of\\s+(?:the\\s+|my\\s+)?)?$`, 'i');
const byLength = (xs) => [...xs].sort((a, b) => b.length - a.length);
const QTY_RE = new RegExp(`(?:^|[^a-z0-9])(?:(\\d+(?:\\.\\d+)?|${alt(byLength(Object.keys(NUMBERS)))})\\s+)?(?:(${alt(Object.keys(CONTAINERS))})\\s+of\\s+(?:the\\s+|my\\s+)?)?${ADJ}$`, 'i');

// Look backwards from a food word, but never past the previous food: "two bags of", "some", "3".
function quantityBefore(text, start, floor) {
  const seg = text.slice(floor, start);
  const lead = (m) => start - m[0].replace(/^[^a-z0-9]/i, '').length;
  const p = seg.match(PART_RE);
  if (p) return { qty: 1, unit: null, part: true, exact: false, from: lead(p) };
  const m = seg.match(QTY_RE);
  if (!m || (!m[1] && !m[2])) return { qty: 1, unit: null, part: false, exact: false, from: start };
  const n = m[1] ? m[1].toLowerCase().replace(/\s+/g, ' ') : null;
  const qty = n == null ? 1 : /^\d/.test(n) ? parseFloat(n) : NUMBERS[n];
  const unit = m[2] ? CONTAINERS[m[2].toLowerCase()] : null;
  if (unit === 'part') return { qty: 1, unit: null, part: true, exact: false, from: lead(m) };
  return { qty, unit, part: false, exact: true, from: lead(m) };
}

export function parseAte(text) {
  const items = [];
  let floor = 0;
  FOOD_RE.lastIndex = 0;
  let m;
  while ((m = FOOD_RE.exec(text))) {
    const food = ALIAS_ID[m[1].toLowerCase()];
    const end = m.index + m[1].length;
    const before = text.slice(floor, m.index);
    if (food && !NOT_RE.test(before)) items.push({ food, ...quantityBefore(text, m.index, floor), end });
    floor = end;
  }
  return mergeItems(items.map((it) => ({ ...it, spans: [[it.from, it.end]] })));
}

// One entry per food. The same food said twice adds up when both had a number in the same unit
// ("an egg … and another egg"); otherwise it becomes one vague mention, asked about once.
export function mergeItems(items) {
  const out = [];
  for (const it of items) {
    const same = out.find((x) => x.food === it.food);
    if (!same) { out.push({ food: it.food, qty: it.qty, unit: it.unit, part: !!it.part, exact: !!it.exact, spans: [...(it.spans || [])] }); continue; }
    same.spans.push(...(it.spans || []));
    if (same.exact && it.exact && same.unit === it.unit) same.qty += it.qty;
    else Object.assign(same, { qty: 1, unit: null, part: true, exact: false });
  }
  return out;
}

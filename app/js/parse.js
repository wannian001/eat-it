// Turn a spoken sentence into food taken out of the fridge, with no AI:
//   "I had one bag of beef, two tomatoes and three eggs."
//   -> beef 1 bag, tomato 2, eggs 3, plus the character spans to highlight on screen.
// Only foods in the catalogue are recognised. Anything else is ignored rather than guessed.
// exact = a number or a container was said ("two tomatoes", "one bag of beef"). Anything vaguer
// ("some spinach", "the curry") is asked about afterwards: how much is left?

import { FOODS } from './foods.js';

const NUMBERS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, both: 2 };
// "bag of beef" takes whole bags; "punnet of strawberries" counts pieces of the lot.
const CONTAINERS = { bag: 'bag', bags: 'bag', pack: 'bag', packs: 'bag', packet: 'bag', packets: 'bag', box: 'bag', boxes: 'bag', tray: 'bag', trays: 'bag', tub: 'pc', tubs: 'pc', bottle: 'pc', bottles: 'pc', carton: 'pc', punnet: 'pc', punnets: 'pc', piece: 'pc', pieces: 'pc', slice: 'pc', slices: 'pc', bowl: 'pc', bowls: 'pc' };

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alt = (xs) => xs.map(esc).join('|');

// Aliases sorted longest first so "spring onion" wins over "onion" and "chicken thighs" over "chicken".
const ALIASES = Object.entries(FOODS)
  .flatMap(([id, f]) => f.aliases.map((a) => [a, id]))
  .sort((a, b) => b[0].length - a[0].length);
const ALIAS_ID = Object.fromEntries(ALIASES);
const FOOD_RE = new RegExp(`\\b(${alt(ALIASES.map(([a]) => a))})\\b`, 'gi');

const OF = '(?:\\s+of)?(?:\\s+(?:the|my|a))?';
const PART_RE = new RegExp(`(?:^|[^a-z0-9])((?:some|a bit|a little|half|the rest|part)${OF})\\s+(?:(?:${alt(Object.keys(CONTAINERS))})\\s+of\\s+(?:the\\s+|my\\s+)?)?$`, 'i');
const QTY_RE = new RegExp(`(?:^|[^a-z0-9])(?:(\\d+(?:\\.\\d+)?|${alt(Object.keys(NUMBERS))})\\s+)?(?:(${alt(Object.keys(CONTAINERS))})\\s+of\\s+(?:the\\s+|my\\s+)?)?$`, 'i');

// Look backwards from a food word, but never past the previous food: "two bags of", "some", "3".
function quantityBefore(text, start, floor) {
  const seg = text.slice(floor, start);
  const lead = (m) => start - m[0].replace(/^[^a-z0-9]/i, '').length;
  const p = seg.match(PART_RE);
  if (p) return { qty: 1, unit: null, part: true, exact: false, from: lead(p) };
  const m = seg.match(QTY_RE);
  if (!m || (!m[1] && !m[2])) return { qty: 1, unit: null, part: false, exact: false, from: start };
  const n = m[1] ? m[1].toLowerCase() : null;
  const qty = n == null ? 1 : /^\d/.test(n) ? parseFloat(n) : NUMBERS[n];
  return { qty, unit: m[2] ? CONTAINERS[m[2].toLowerCase()] : null, part: false, exact: true, from: lead(m) };
}

export function parseAte(text) {
  const items = [];
  let floor = 0;
  FOOD_RE.lastIndex = 0;
  let m;
  while ((m = FOOD_RE.exec(text))) {
    const food = ALIAS_ID[m[1].toLowerCase()];
    const q = quantityBefore(text, m.index, floor);
    const end = m.index + m[1].length;
    items.push({ food, ...q, end });
    floor = end;
  }
  // Same food said twice ("an egg ... and another egg") adds up.
  const merged = [];
  for (const it of items) {
    const same = merged.find((x) => x.food === it.food && x.unit === it.unit && !x.part && !it.part);
    if (same) { same.qty += it.qty; same.exact = same.exact && it.exact; same.spans.push([it.from, it.end]); }
    else merged.push({ food: it.food, qty: it.qty, unit: it.unit, part: it.part, exact: it.exact, spans: [[it.from, it.end]] });
  }
  return merged;
}

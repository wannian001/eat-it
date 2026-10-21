// Turn a spoken sentence into food taken out of the fridge, with no AI:
//   "I had one bag of beef, two tomatoes and three eggs."
//   -> beef 1 bag, tomato 2, eggs 3, plus the character spans to highlight on screen.
// Only foods in the catalogue are recognised. Anything else is ignored rather than guessed.
// exact = a number or a container was said ("two tomatoes", "one bag of beef"). Anything vaguer
// ("some spinach", "the curry") is asked about afterwards: how much is left?

import { FOODS, NOT_FOOD, ALIASES_ZH, hasCjk } from './foods.js';

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
  if (hasCjk(text)) return parseAteZh(text);
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

// ---------- Chinese ----------
// "我做了一袋牛肉和两个番茄，还吃了一些咖喱。" -> beef 1 bag, tomato 2, curry (asked about).
// Same rules as English: a number (with or without a measure word) is exact; 一些 / 一点 / 半 /
// a slice or a bowl, or no number at all, is asked about afterwards. 没 / 不加 / 除了 = not taken.

const CN_DIGIT = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function cnNumber(t) {
  if (/^\d/.test(t)) return parseFloat(t);
  if (!t.includes('十')) return [...t].reduce((n, c) => n * 10 + (CN_DIGIT[c] ?? 0), 0);
  const [tens, ones] = t.split('十');
  return (tens ? CN_DIGIT[tens] ?? 1 : 1) * 10 + (ones ? CN_DIGIT[ones] ?? 0 : 0);
}
// Measure words: a bag or box takes whole bags; a piece, stalk or bottle counts pieces; a slice,
// bowl or spoonful is part of something.
const MEASURE_ZH = { 袋: 'bag', 包: 'bag', 盒: 'bag', 箱: 'bag', 托: 'bag',
  个: 'pc', 只: 'pc', 根: 'pc', 颗: 'pc', 粒: 'pc', 瓶: 'pc', 罐: 'pc', 条: 'pc', 块: 'pc', 枚: 'pc', 把: 'pc', 捆: 'pc', 串: 'pc', 棵: 'pc', 头: 'pc',
  片: 'part', 碗: 'part', 勺: 'part', 匙: 'part', 口: 'part', 份: 'part', 杯: 'part', 盘: 'part', 碟: 'part' };
const MW = Object.keys(MEASURE_ZH).join('|');
const ADJ_ZH = '(?:大|小|新鲜的?|生的?|熟的?|冷冻的?|剩下的|有机的?)?';
const QTY_ZH = new RegExp(`(?:(\\d+(?:\\.\\d+)?|[零一二两三四五六七八九十]+)\\s*(${MW})?|(一些|一点儿?|一部分|部分|一半|半|剩下的|剩的|些|点儿?)\\s*(?:${MW})?)(?:的)?${ADJ_ZH}\\s*$`);
const NOT_ZH = /(?:没有|没|别|未|不用|不加|不放|不吃|不要|除了|无)[^，,。；;、]{0,3}$/;

function quantityBeforeZh(seg, start) {
  const m = seg.match(QTY_ZH);
  if (!m) return { qty: 1, unit: null, part: false, exact: false, from: start };
  const from = start - m[0].length;
  if (m[3]) return { qty: 1, unit: null, part: true, exact: false, from };
  const unit = m[2] ? MEASURE_ZH[m[2]] : null;
  if (unit === 'part') return { qty: 1, unit: null, part: true, exact: false, from };
  return { qty: cnNumber(m[1]), unit: unit === 'bag' ? 'bag' : null, part: false, exact: true, from };
}

function parseAteZh(text) {
  const items = [];
  let floor = 0;
  for (let i = 0; i < text.length;) {
    const hit = ALIASES_ZH.find(([a]) => text.startsWith(a, i));
    if (!hit) { i += 1; continue; }
    const [alias, food] = hit;
    const end = i + alias.length;
    const before = text.slice(floor, i);
    if (food && !NOT_ZH.test(before)) items.push({ food, ...quantityBeforeZh(before, i), end });
    floor = end;
    i = end;
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

// People and their starting homes. John and May are the two personas from the group's fieldwork
// report (fictional; every food, date, price and name here is made up). The fridge contents follow
// the hi-fi canvas v3; the cupboard, week plan, shopping list, receipts and settings come from the
// v0.2 prototype. Their demo day is Saturday 10 October 2026, the day shown on the canvas.
// "You" starts empty, uses the real date and only ever holds what the user puts in.

import { food as foodOf } from './foods.js';

const DAY = '2026-10-10';

const put = (id, day, lines) => ({ id, type: 'put', day, lines, seed: true });
const plan = (day, lot) => ({ id: `plan-${day}-${lot}`, type: 'plan.add', day, lot, seed: true });
const mode = (day, m) => ({ id: `mode-${day}`, type: 'plan', day, mode: m, seed: true });
const est = (on) => ({ kind: 'est', on });
const estDays = (days) => ({ kind: 'est', days });
const useBy = (on) => ({ kind: 'use_by', on });
const bb = (on) => ({ kind: 'best_before', on });
const none = (note) => ({ kind: 'none', note });

export const PERSONAS = {
  john: {
    id: 'john', name: 'John', initial: 'J', demo: true, age: 23, mail: 'john.student@example.com',
    today: DAY, clock: '14:20', lockClock: '7:42',
    about: '23 岁 · 一个人住 · 有冰箱和冷冻室 · 一次买一到两周',
    places: [
      { id: 'fridge', name: 'Fridge', kind: 'cold', sub: 'all yours', full: 35 },
      { id: 'freezer', name: 'Freezer', kind: 'frozen', sub: '3 drawers', full: 50 },
      { id: 'pantry', name: 'Cupboard', kind: 'room', sub: 'all yours', full: 45 },
    ],
    house: null, others: [],
    settings: { summary: true, quiet: true, lockNames: true, shareFree: false, shareShelf: false },
    usual: ['milk', 'spinach', 'eggs', 'bread'],
    said: 'I had one bag of beef, two tomatoes and three eggs.',
    shop: [
      { id: 's1', name: 'Eggs', own: 'mine', who: 'John' },
      { id: 's2', name: 'Bananas', own: 'mine', who: 'John' },
      { id: 's3', name: 'Oats', own: 'mine', who: 'John' },
    ],
    suggest: ['Beef mince 2 kg, bulk deal', 'Broccoli', 'Milk 2 L'],
    overlaps: [],
    seed: [
      put('john-0912', '2026-09-12', [{ food: 'beef', qty: 1000, unit: 'g', place: 'freezer', bags: 5 }]),
      put('john-0926', '2026-09-26', [{ food: 'dumplings', qty: 1, unit: 'bag', place: 'freezer', amount: 'Half' }]),
      put('john-0930', '2026-09-30', [{ food: 'pork', qty: 400, unit: 'g', place: 'freezer' }]),
      put('john-1003', '2026-10-03', [{ food: 'chicken', qty: 4, unit: 'pc', place: 'freezer', bags: 4 }]),
      put('john-1004', '2026-10-04', [
        { food: 'milk', qty: 2, unit: 'L', place: 'fridge', spot: 'top', date: useBy('2026-10-11') },
        { food: 'eggs', qty: 6, unit: 'pc', place: 'fridge', spot: 'top', date: bb('2026-10-30') },
        { food: 'yoghurt', qty: 2, unit: 'pc', place: 'fridge', spot: 'top', date: useBy('2026-10-18') },
        { food: 'cheese', qty: 1, unit: 'pc', place: 'fridge', spot: 'top', date: bb('2026-11-20') },
        { food: 'tofu', qty: 1, unit: 'pc', place: 'fridge', spot: 'middle', date: useBy('2026-10-16') },
        { food: 'lemon', qty: 2, unit: 'pc', place: 'fridge', spot: 'middle', date: est('2026-10-31') },
        { food: 'carrot', qty: 3, unit: 'pc', place: 'fridge', spot: 'crisper', date: est('2026-10-31') },
        { food: 'pasta', qty: 1, unit: 'pc', place: 'pantry', date: bb('2027-08-31') },
        { food: 'rice', qty: 1, unit: 'pc', place: 'pantry', date: none('Dry · keeps for months'), amount: 'Most' },
        { food: 'oats', qty: 1, unit: 'pc', place: 'pantry', date: bb('2027-02-28'), amount: 'Low' },
      ]),
      put('john-1008', '2026-10-08', [
        { food: 'curry', qty: 1, unit: 'pc', place: 'fridge', spot: 'middle', date: est('2026-10-11') },
        { food: 'avocado', qty: 2, unit: 'pc', place: 'fridge', spot: 'middle', date: est('2026-10-13') },
        { food: 'spinach', qty: 1, unit: 'pc', place: 'fridge', spot: 'crisper', date: bb('2026-10-10') },
        { food: 'tomato', qty: 4, unit: 'pc', place: 'fridge', spot: 'crisper', date: est('2026-10-17') },
        { food: 'broccoli', qty: 1, unit: 'pc', place: 'fridge', spot: 'crisper', date: est('2026-10-15') },
      ]),
      plan('2026-10-10', 'john-1008:0'), plan('2026-10-10', 'john-1008:2'),
      plan('2026-10-11', 'john-1003:0:0'),
      plan('2026-10-12', 'john-0912:0:0'), plan('2026-10-12', 'john-1004:6'),
      plan('2026-10-13', 'john-1004:4'),
      plan('2026-10-14', 'john-1008:4'),
      plan('2026-10-15', 'john-0930:0'), plan('2026-10-15', 'john-1008:3'),
    ],
    // What the demo "AI scan" of the bench returns: the 7 lines on canvas board 03.
    photo: { when: DAY, lines: [
      { food: 'beef', qty: 1000, unit: 'g', date: useBy('2026-10-17'), place: 'freezer' },
      { food: 'chicken', qty: 4, unit: 'pc', date: useBy('2026-10-15') },
      { food: 'milk', qty: 2, unit: 'L', date: useBy('2026-10-19') },
      { food: 'spinach', qty: 1, unit: 'pc', date: bb('2026-10-13') },
      { food: 'tomato', qty: 4, unit: 'pc', date: estDays(7) },
      { food: 'springonion', qty: 1, unit: 'pc', date: estDays(5), unsure: ['leek'] },
      { food: 'yuzu', qty: 1, unit: 'pc', date: bb('2027-03-31') },
    ] },
    receipt: { when: DAY, time: '13:52', lines: [
      { raw: 'BEEF MINCE 3STAR 1KG', price: '13.00', food: 'beef', qty: 1000, unit: 'g', place: 'freezer', date: useBy('2026-10-17') },
      { raw: 'CHKN THGH FLLT 4PC', price: '9.50', food: 'chicken', qty: 4, unit: 'pc', date: useBy('2026-10-15') },
      { raw: 'MILK FULL CRM 2L', price: '3.30', food: 'milk', qty: 2, unit: 'L', date: null },
      { raw: 'BABY SPINACH 120G', price: '3.00', food: 'spinach', qty: 1, unit: 'pc', date: estDays(4) },
      { raw: 'TOMATO LOOSE KG 0.62', price: '4.30', food: 'tomato', qty: 4, unit: 'pc', date: estDays(7) },
      { raw: 'SPR ONION BCH', price: '2.00', food: 'springonion', qty: 1, unit: 'pc', date: estDays(5), unsure: ['leek'] },
      { raw: 'YUZU TEA 1KG', price: '8.95', food: 'yuzu', qty: 1, unit: 'pc', date: bb('2027-03-31') },
      { raw: 'PAPER TOWEL 4PK', price: '5.00', food: 'papertowel', qty: 4, unit: 'pc', nonfood: true },
    ] },
    email: { when: DAY, time: '09:12', from: 'Online supermarket', subject: 'Your order has been delivered', lines: [
      { raw: 'Salmon fillets 2pk 250g', price: '12.00', food: 'salmon', qty: 2, unit: 'pc', place: 'freezer' },
      { raw: 'Greek yoghurt 1kg', price: '6.50', food: 'yoghurt', qty: 1, unit: 'pc', date: useBy('2026-10-24') },
      { raw: 'Baby spinach 120g', price: '3.00', food: 'spinach', qty: 1, unit: 'pc', date: estDays(4) },
      { raw: 'Paper towel 4pk', price: '5.00', food: 'papertowel', qty: 4, unit: 'pc', nonfood: true },
    ] },
    barcode: { raw: '9 300633 OAT MILK 1L', food: 'oatmilk', qty: 1, unit: 'L', date: bb('2026-11-24') },
    scenes: [
      { t: '周六 7:42 · 锁屏：冻了 4 周的那袋牛肉', d: '不开 App 就知道先用哪袋（分镜 9e）', clock: '7:42', route: 'lock' },
      { t: '周六 14:20 · 大采购后扫小票', d: 'AI 读出 8 行：1 行要确认、1 行不是食物；肉建议分 5 袋', clock: '14:20', route: 'review', review: 'receipt' },
      { t: '肉分袋进冷冻室', d: '每袋自动带上冷冻日期；最旧那袋还在最前面', clock: '14:24', route: 'home', doing: ['receipt'] },
      { t: '周二 21:30 · 期中周三天不做饭', d: '菜自动挪到下一个做饭的日子，放不到那天的会提醒', offset: 3, clock: '21:30', route: 'plan', doing: ['receipt', 'busy:1', 'out:2', 'out:3'] },
      { t: '周六 · 冷冻室最旧的先用', d: '按冷冻日期排，最旧那袋排最前，附解冻指引', offset: 7, clock: '11:00', route: 'home', doing: ['receipt'], sheet: 'oldest' },
    ],
  },

  may: {
    id: 'may', name: 'May', initial: 'M', demo: true, age: 21, mail: 'may.student@example.com',
    today: DAY, clock: '18:10', lockClock: '8:00',
    about: '21 岁 · 和两个同学合租 · 共用冰箱、没有冷冻室 · 几乎天天买',
    places: [
      { id: 'fridge', name: 'Fridge', kind: 'cold', sub: 'your shelf + shared', full: 85 },
      { id: 'pantry', name: 'Cupboard', kind: 'room', sub: 'your half shelf', full: 40 },
    ],
    house: { name: 'Shared house · 3 people', code: 'SL-4821', mates: [{ name: 'Lily', initial: 'L' }, { name: 'Sam', initial: 'S' }] },
    // Housemates' food only ever shows as a number (Brief §4.4).
    others: [{ who: 'Lily', place: 'fridge', n: 2 }, { who: 'Sam', place: 'fridge', n: 1 }, { who: 'Lily', place: 'pantry', n: 6 }, { who: 'Sam', place: 'pantry', n: 3 }],
    shelves: [{ name: 'Top shelf', who: 'Lily & Sam', pct: 70 }, { name: 'Shared shelf', who: 'Everyone', pct: 60 }, { name: 'Your shelf', who: 'May', pct: 85 }, { name: 'Crisper', who: 'May', pct: 50 }],
    settings: { summary: true, quiet: true, lockNames: true, shareFree: true, shareShelf: true },
    usual: ['milk', 'strawberry', 'yoghurt', 'bread'],
    said: 'I had two chicken thighs and some spinach.',
    shop: [
      { id: 's1', name: 'Rice 5 kg', own: 'shared', who: null, note: 'Shared rice is running low' },
      { id: 's2', name: 'Milk 2 L', own: 'shared', who: 'Lily' },
      { id: 's3', name: 'Bread', own: 'mine', who: 'May' },
      { id: 's4', name: 'Cooking oil', own: 'shared', who: 'Sam' },
    ],
    suggest: ['Salad kit, family size', 'Milk 2 L', 'Eggs'],
    overlaps: [{ who: 'Lily', when: 'Thu 4–6 pm' }, { who: 'Sam', when: 'Sat 10–11 am' }],
    seed: [
      put('may-1006', '2026-10-06', [
        { food: 'milk', qty: 2, unit: 'L', place: 'fridge', spot: 'shared', owner: 'shared', date: useBy('2026-10-14'), amount: 'Half' },
        { food: 'eggs', qty: 8, unit: 'pc', place: 'fridge', spot: 'shared', owner: 'shared', date: bb('2026-10-28') },
        { food: 'lemon', qty: 3, unit: 'pc', place: 'fridge', spot: 'shared', owner: 'shared', date: est('2026-10-31') },
        { food: 'rice', qty: 1, unit: 'pc', place: 'pantry', owner: 'shared', date: none('Dry · keeps for months'), amount: 'Low' },
        { food: 'noodles', qty: 4, unit: 'pc', place: 'pantry', date: bb('2027-03-31') },
      ]),
      put('may-1009', '2026-10-09', [
        { food: 'chicken', qty: 2, unit: 'pc', place: 'fridge', spot: 'mine', date: useBy('2026-10-11') },
        { food: 'strawberry', qty: 1, unit: 'pc', place: 'fridge', spot: 'mine', date: est('2026-10-12') },
        { food: 'yoghurt', qty: 1, unit: 'pc', place: 'fridge', spot: 'mine', date: useBy('2026-10-17'), amount: 'Most' },
        { food: 'spinach', qty: 1, unit: 'pc', place: 'fridge', spot: 'crisper', date: bb('2026-10-10'), amount: 'Half' },
        { food: 'tomato', qty: 3, unit: 'pc', place: 'fridge', spot: 'crisper', date: est('2026-10-15') },
        { food: 'avocado', qty: 1, unit: 'pc', place: 'fridge', spot: 'crisper', date: est('2026-10-14') },
        { food: 'mushrooms', qty: 200, unit: 'g', place: 'fridge', spot: 'crisper', date: est('2026-10-13') },
        { food: 'bread', qty: 1, unit: 'pc', place: 'pantry', date: bb('2026-10-12'), amount: 'Half' },
      ]),
      plan('2026-10-10', 'may-1009:0'), plan('2026-10-10', 'may-1009:3'), plan('2026-10-10', 'may-1009:6'),
      plan('2026-10-11', 'may-1009:4'),
      plan('2026-10-12', 'may-1009:2'),
      mode('2026-10-13', 'out'),
    ],
    photo: { when: DAY, lines: [
      { food: 'apple', qty: 4, unit: 'pc', date: estDays(14) },
      { food: 'springonion', qty: 1, unit: 'pc', date: estDays(5), unsure: ['leek'] },
      { food: 'tofu', qty: 1, unit: 'pc', date: null },
      { food: 'bread', qty: 1, unit: 'pc', place: 'pantry', date: null },
    ] },
    receipt: { when: DAY, time: '17:42', lines: [
      { raw: 'BANANA CAVENDISH KG 0.84', price: '3.28', food: 'banana', qty: 5, unit: 'pc', place: 'pantry', date: estDays(5) },
      { raw: 'TOFU FIRM 450G', price: '2.70', food: 'tofu', qty: 1, unit: 'pc', date: null },
      { raw: 'SPR ONION BCH', price: '2.00', food: 'springonion', qty: 1, unit: 'pc', date: estDays(5), unsure: ['leek'] },
    ] },
    email: { when: DAY, time: '16:05', from: 'Online supermarket', subject: 'Your order has been delivered', lines: [
      { raw: 'Oat milk 1L x1', price: '3.20', food: 'oatmilk', qty: 1, unit: 'L', place: 'pantry', date: bb('2026-11-24') },
      { raw: 'Strawberries 250g x1', price: '4.50', food: 'strawberry', qty: 1, unit: 'pc', date: estDays(3) },
      { raw: 'Chickpeas 400g can x2', price: '2.40', food: 'chickpeas', qty: 2, unit: 'pc', place: 'pantry', date: bb('2028-03-31') },
      { raw: 'Dishwashing liquid 500ml x1', price: '3.00', food: 'dishliquid', qty: 1, unit: 'pc', owner: 'shared', nonfood: true },
    ] },
    barcode: { raw: '9 300601 GREEK YOGHURT 1KG', food: 'yoghurt', qty: 1, unit: 'pc', date: useBy('2026-10-24') },
    scenes: [
      { t: '周六 18:10 · 朋友约她出去吃', d: '打开 App：今晚原本要做的菜、哪些快坏，一页看到', clock: '18:10', route: 'home' },
      { t: '点 Eating out tonight', d: '今晚的菜自动挪到周日，最急的鸡腿肉排第一（分镜 10b）', clock: '18:11', route: 'plan', doing: ['out:0'] },
      { t: '周日 08:00 · 只有一条提醒', d: '今天要用：鸡腿肉（包装日期）和菠菜（包装日期）', offset: 1, clock: '8:00', route: 'lock', doing: ['out:-1'] },
      { t: '周一 17:30 · 在超市', d: '想买大包沙拉，提醒空间不够；加牛奶，提醒室友已经在买', offset: 2, clock: '17:30', route: 'shop', doing: ['out:-2'], shop: 'Salad kit, family size' },
      { t: '周一 22:30 · 睡前说 10 秒', d: '不用每顿都开 App（分镜 10c）', offset: 2, clock: '22:30', route: 'ate', doing: ['out:-2'] },
    ],
  },

  me: {
    id: 'me', name: 'You', initial: 'Y', demo: false, mail: '',
    today: null, clock: null, lockClock: null,
    places: [], house: null, others: [],
    settings: { summary: true, quiet: true, lockNames: false, shareFree: false, shareShelf: false },
    usual: null, said: null, shop: [], suggest: ['Milk 2 L', 'Eggs', 'Bread'], overlaps: [],
    seed: [], photo: null, receipt: null, email: null, barcode: null, scenes: [],
  },
};

export const PERSONA_IDS = ['john', 'may', 'me'];

// Shelves of a cold place, top to bottom, as drawn on the open fridge (boards 01 and 02).
export function shelvesOf(place, persona) {
  if (place.kind !== 'cold') return [{ spot: null }];
  if (persona.house) {
    return [
      { spot: 'housemates', kind: 'locked' },
      { spot: 'shared', label: 'Shared', icon: 'people' },
      { spot: 'mine', label: 'Mine', capacity: 4 },
      { spot: 'crisper', kind: 'crisper' },
    ];
  }
  return [{ spot: 'top' }, { spot: 'middle' }, { spot: 'crisper', kind: 'crisper' }];
}

export const SPOT_NAMES = { top: 'Top shelf', middle: 'Middle shelf', crisper: 'Crisper drawer', shared: 'Shared shelf', mine: 'Your shelf' };

// Where a new item goes in a place.
export function spotFor(foodId, owner, persona, place) {
  if (!place || place.kind !== 'cold') return null;
  const f = foodOf(foodId);
  const crisper = f.cat === 'produce' && f.spot === 'crisper';
  if (persona.house) return crisper ? 'crisper' : owner === 'shared' ? 'shared' : 'mine';
  return crisper ? 'crisper' : f.spot === 'top' ? 'top' : 'middle';
}

// Which place a new item goes to by default.
export function placeFor(foodId, places, { frozen } = {}) {
  const f = foodOf(foodId);
  const of = (k) => places.find((p) => p.kind === k);
  if (frozen && of('frozen')) return of('frozen').id;
  if ((f.room || f.dry || f.cat === 'nonfood') && of('room')) return of('room').id;
  return (of('cold') || of('room') || places[0])?.id || null;
}

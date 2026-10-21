// The two users the app ships with, and the template for new ones. John and May are the personas
// from the group's fieldwork report (fictional; every food, date, price and name here is made up).
// They are ordinary users: real date, their own saved data. Their starting fridge follows the hi-fi
// canvas v3; the cupboard, shopping list, receipts and settings come from the v0.2
// prototype. It is written for SEED_DAY and moved to the day each user is first opened (users.js).

import { food as foodOf } from './foods.js?v=a3e659d';
import { L, isZh } from './i18n.js?v=a3e659d';

export const SEED_DAY = '2026-10-10';
const DAY = SEED_DAY;

const put = (id, day, lines) => ({ id, type: 'put', day, lines, seed: true });
const mode = (day, m) => ({ id: `mode-${day}`, type: 'plan', day, mode: m, seed: true });
const est = (on) => ({ kind: 'est', on });
const estDays = (days) => ({ kind: 'est', days });
const useBy = (on) => ({ kind: 'use_by', on });
const bb = (on) => ({ kind: 'best_before', on });
const none = (note) => ({ kind: 'none', note });

export const BUILTIN = {
  john: {
    id: 'john', name: 'John', initial: 'J', builtin: true, mail: 'john.student@example.com',
    places: [
      { id: 'fridge', name: 'Fridge', kind: 'cold', sub: 'all yours', full: 35 },
      { id: 'freezer', name: 'Freezer', kind: 'frozen', sub: '3 drawers', full: 50 },
      { id: 'pantry', name: 'Cupboard', kind: 'room', sub: 'all yours', full: 45 },
    ],
    house: null, others: [],
    settings: { summary: true, quiet: true, lockNames: true, shareShelf: false },
    usual: ['milk', 'spinach', 'eggs', 'bread'],
    shop: [
      { id: 's1', name: 'Eggs', own: 'mine', who: 'John' },
      { id: 's2', name: 'Bananas', own: 'mine', who: 'John' },
      { id: 's3', name: 'Oats', own: 'mine', who: 'John' },
    ],
    suggest: ['Beef mince 2 kg, bulk deal', 'Broccoli', 'Milk 2 L'],
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
      // Away from tomorrow for three days: the milk, the curry and the avocados would go off meanwhile.
      mode('2026-10-11', 'out'), mode('2026-10-12', 'out'), mode('2026-10-13', 'out'),
    ],
    // What the simulated "AI scan" of the bench returns: the 7 lines on canvas board 03.
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
  },

  may: {
    id: 'may', name: 'May', initial: 'M', builtin: true, mail: 'may.student@example.com',
    places: [
      { id: 'fridge', name: 'Fridge', kind: 'cold', sub: 'your shelf + shared', full: 85 },
      { id: 'pantry', name: 'Cupboard', kind: 'room', sub: 'your half shelf', full: 40 },
    ],
    house: { name: 'Shared house · 3 people', code: 'EI-4821', mates: [{ name: 'Lily', initial: 'L' }, { name: 'Sam', initial: 'S' }] },
    // Housemates' food only ever shows as a number (Brief §4.4).
    others: [{ who: 'Lily', place: 'fridge', n: 2 }, { who: 'Sam', place: 'fridge', n: 1 }, { who: 'Lily', place: 'pantry', n: 6 }, { who: 'Sam', place: 'pantry', n: 3 }],
    shelves: [{ name: 'Top shelf', who: 'Lily & Sam', pct: 70 }, { name: 'Shared shelf', who: 'Everyone', pct: 60 }, { name: 'My shelf', who: 'May', pct: 85 }, { name: 'Crisper', who: 'May', pct: 50 }],
    settings: { summary: true, quiet: true, lockNames: true, shareShelf: true },
    usual: ['milk', 'strawberry', 'yoghurt', 'bread'],
    shop: [
      { id: 's1', name: 'Rice 5 kg', own: 'shared', who: null, note: 'Shared rice is running low' },
      { id: 's2', name: 'Milk 2 L', own: 'shared', who: 'Lily' },
      { id: 's3', name: 'Bread', own: 'mine', who: 'May' },
      { id: 's4', name: 'Cooking oil', own: 'shared', who: 'Sam' },
    ],
    suggest: ['Salad kit, family size', 'Milk 2 L', 'Eggs'],
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
      // Eating out tomorrow and the day after: the chicken, strawberries and bread would go off meanwhile.
      mode('2026-10-11', 'out'), mode('2026-10-12', 'out'),
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
  },

};

// A new user starts with nothing and sets up their own places first (onboarding).
export function blankUser(id, name) {
  return {
    id, name, initial: (name || '?').trim().charAt(0).toUpperCase() || '?', builtin: false, mail: '',
    places: [], house: null, others: [],
    settings: { summary: true, quiet: true, lockNames: false, shareShelf: false },
    usual: null, shop: [], suggest: ['Milk 2 L', 'Eggs', 'Bread'],
    seed: [], photo: null, receipt: null, email: null, barcode: null,
  };
}

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

export const SPOT_NAMES = { top: 'Top shelf', middle: 'Middle shelf', crisper: 'Crisper drawer', shared: 'Shared shelf', mine: 'My shelf' };
const SPOT_ZH = { top: '顶层', middle: '中间层', crisper: '果蔬抽屉', shared: '公共层', mine: '我的一层' };
export const spotName = (k) => (isZh() ? SPOT_ZH[k] : SPOT_NAMES[k]) || '';

// The three kinds of storage place, as the screens name them.
export const placeKinds = () => ({ cold: L('Cold (fridge)', '冷藏（冰箱）'), frozen: L('Frozen (freezer)', '冷冻（冷冻室）'), room: L('Room temperature', '常温') });

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

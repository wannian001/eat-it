// People and their starting fridges. John and May are the two personas from the group's
// fieldwork report (fictional; every food, date and name here is made up). Their demo day is
// Saturday 10 October 2026, the day shown in the hi-fi canvas, so the screens match it.
// "You" starts empty, uses the real date and only ever holds what the user puts in.

import { food as foodOf } from './foods.js';

const DEMO_DAY = '2026-10-10';

const ALONE = [
  { spot: 'freezer', kind: 'freezer', label: 'Freezer' },
  { spot: 'top' },
  { spot: 'middle' },
  { spot: 'crisper', kind: 'crisper' },
];

const SHARED = [
  { spot: 'housemates', kind: 'locked' },
  { spot: 'shared', label: 'Shared', icon: 'people' },
  { spot: 'mine', label: 'Mine', capacity: 4 },
  { spot: 'crisper', kind: 'crisper' },
];

const put = (id, day, lines) => ({ id, type: 'put', day, lines, seed: true });
const est = (on) => ({ kind: 'est', on });
const useBy = (on) => ({ kind: 'use_by', on });
const bestBefore = (on) => ({ kind: 'best_before', on });

export const PERSONAS = {
  john: {
    id: 'john', name: 'John', initial: 'J', title: 'My fridge', demo: true,
    today: DEMO_DAY, clock: '7:42', zones: ALONE, freezer: true,
    usual: ['milk', 'spinach', 'eggs', 'bread'],
    said: 'I had one bag of beef, two tomatoes and three eggs.',
    seed: [
      put('john-0912', '2026-09-12', [{ food: 'beef', qty: 1000, unit: 'g', bags: 5 }]),
      put('john-0926', '2026-09-26', [{ food: 'dumplings', qty: 1, unit: 'bag', spot: 'freezer' }]),
      put('john-1003', '2026-10-03', [{ food: 'chicken', qty: 4, unit: 'pc', bags: 4 }]),
      put('john-1004', '2026-10-04', [
        { food: 'milk', qty: 2, unit: 'L', date: useBy('2026-10-11') },
        { food: 'eggs', qty: 6, unit: 'pc', date: bestBefore('2026-10-30') },
        { food: 'yoghurt', qty: 2, unit: 'pc', date: useBy('2026-10-18') },
        { food: 'cheese', qty: 1, unit: 'pc', date: bestBefore('2026-11-20') },
        { food: 'tofu', qty: 1, unit: 'pc', date: useBy('2026-10-16') },
        { food: 'lemon', qty: 2, unit: 'pc', date: est('2026-10-31') },
        { food: 'carrot', qty: 3, unit: 'pc', date: est('2026-10-31') },
      ]),
      put('john-1008', '2026-10-08', [
        { food: 'curry', qty: 1, unit: 'pc', date: est('2026-10-11') },
        { food: 'avocado', qty: 2, unit: 'pc', date: est('2026-10-13') },
        { food: 'spinach', qty: 1, unit: 'pc', date: bestBefore('2026-10-10') },
        { food: 'tomato', qty: 4, unit: 'pc', date: est('2026-10-17') },
        { food: 'broccoli', qty: 1, unit: 'pc', date: est('2026-10-15') },
      ]),
    ],
    // What the demo "AI scan" returns: the 7 lines on canvas board 03.
    scan: [
      { food: 'beef', qty: 1000, unit: 'g', date: useBy('2026-10-17') },
      { food: 'chicken', qty: 4, unit: 'pc', date: useBy('2026-10-15') },
      { food: 'milk', qty: 2, unit: 'L', date: useBy('2026-10-19') },
      { food: 'spinach', qty: 1, unit: 'pc', date: bestBefore('2026-10-13') },
      { food: 'tomato', qty: 4, unit: 'pc', date: { kind: 'est', days: 7 } },
      { food: 'springonion', qty: 1, unit: 'pc', date: { kind: 'est', days: 5 }, unsure: ['leek'] },
      { food: 'yuzu', qty: 1, unit: 'pc', date: bestBefore('2027-03-31') },
    ],
  },

  may: {
    id: 'may', name: 'May', initial: 'M', title: 'Our fridge', demo: true,
    today: DEMO_DAY, clock: '7:42', zones: SHARED, freezer: false,
    house: { mates: [{ initial: 'L', name: 'Lily' }, { initial: 'S', name: 'Sam' }] },
    usual: ['milk', 'strawberry', 'yoghurt', 'bread'],
    said: 'I had two chicken thighs and some spinach.',
    seed: [
      put('may-1006', '2026-10-06', [
        // Housemates' food only ever shows as a number (Brief §4.4).
        { food: 'bread', qty: 1, unit: 'pc', owner: 'housemate', spot: 'housemates', date: bestBefore('2026-10-12') },
        { food: 'cheese', qty: 1, unit: 'pc', owner: 'housemate', spot: 'housemates', date: bestBefore('2026-11-02') },
        { food: 'yoghurt', qty: 1, unit: 'pc', owner: 'housemate', spot: 'housemates', date: useBy('2026-10-15') },
        { food: 'milk', qty: 2, unit: 'L', owner: 'shared', spot: 'shared', date: useBy('2026-10-14') },
        { food: 'eggs', qty: 8, unit: 'pc', owner: 'shared', spot: 'shared', date: bestBefore('2026-10-28') },
        { food: 'lemon', qty: 3, unit: 'pc', owner: 'shared', spot: 'shared', date: est('2026-10-31') },
      ]),
      put('may-1009', '2026-10-09', [
        { food: 'chicken', qty: 2, unit: 'pc', spot: 'mine', date: useBy('2026-10-11') },
        { food: 'strawberry', qty: 1, unit: 'pc', spot: 'mine', date: est('2026-10-12') },
        { food: 'yoghurt', qty: 1, unit: 'pc', spot: 'mine', date: useBy('2026-10-17') },
        { food: 'spinach', qty: 1, unit: 'pc', spot: 'crisper', date: bestBefore('2026-10-10') },
        { food: 'tomato', qty: 3, unit: 'pc', spot: 'crisper', date: est('2026-10-15') },
        { food: 'avocado', qty: 1, unit: 'pc', spot: 'crisper', date: est('2026-10-14') },
      ]),
    ],
    scan: [
      { food: 'tofu', qty: 1, unit: 'pc', date: useBy('2026-10-16') },
      { food: 'yoghurt', qty: 1, unit: 'pc', date: useBy('2026-10-20') },
      { food: 'broccoli', qty: 1, unit: 'pc', date: { kind: 'est', days: 5 } },
      { food: 'banana', qty: 4, unit: 'pc', date: { kind: 'est', days: 5 } },
      { food: 'bread', qty: 1, unit: 'pc', date: bestBefore('2026-10-15') },
    ],
  },

  me: {
    id: 'me', name: 'You', initial: 'Y', title: 'My fridge', demo: false,
    today: null, clock: null, zones: ALONE, freezer: true,
    usual: null, said: null, seed: [], scan: null,
  },
};

export const PERSONA_IDS = ['john', 'may', 'me'];

export function zonesOf(p) {
  return p.zones.filter((z) => z.kind !== 'freezer' || p.freezer);
}

// Where a new item goes on this person's shelves.
export function spotFor(foodId, owner, p) {
  const f = foodOf(foodId);
  if (p.house) {
    if (owner === 'shared') return 'shared';
    return f.cat === 'produce' && f.spot === 'crisper' ? 'crisper' : 'mine';
  }
  return f.spot;
}

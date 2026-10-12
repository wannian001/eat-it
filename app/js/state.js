// The fridge is never stored directly. It is rebuilt by replaying an append-only list of events,
// the same idea as the owner's personal food log (buy / put / use / ate). Correcting a mistake
// means adding an event, never editing an old one.
//
// Event types
//   put    { day, lines: [{ food, qty, unit, spot, owner, date, bags }] }   food comes in
//   use    { day, lot, how: 'one' | 'some' }                                Used it / Used some
//   ate    { day, items: [{ food, qty, unit, part }] }                      "I ate ..." (voice)
//   fix    { lot, on }                                                      user corrects an estimate
//   thaw   { day, lot, spot }                                               bag moves to the fridge
//   out    { day, on }                                                      "Out tonight" switch
//   snooze { day, until }                                                   "Later" on a nudge
//
// A lot is one thing you can pick up: a bag, a bottle, a tray of 4 thighs, a carton of 6 eggs.

import { FOODS, food as foodOf } from './foods.js';
import { addDays, urgency, kindOrder, daysBetween } from './dates.js';

const THAWED_DAYS = 1; // our guess, shown dashed like every estimate

export function replay(events) {
  const s = { lots: new Map(), splits: {}, puts: {}, out: {}, snoozeUntil: null, thawedOn: null, fresh: new Set() };
  for (const e of events) apply(s, e);
  return s;
}

export function apply(s, e) {
  // "fresh" = lots the user just put in, so the screen can show them arriving. Seeds never count.
  s.fresh = new Set();
  switch (e.type) {
    case 'put': return put(s, e);
    case 'use': return use(s, e);
    case 'ate': for (const it of e.items || []) consume(s, it); return;
    case 'fix': { const l = s.lots.get(e.lot); if (l && l.date) l.date = { ...l.date, on: e.on }; return; }
    case 'thaw': {
      const l = s.lots.get(e.lot);
      if (l && l.spot === 'freezer') Object.assign(l, { spot: e.spot || foodOf(l.food).spot, date: { kind: 'est', on: addDays(e.day, THAWED_DAYS) }, thawed: true });
      s.thawedOn = e.day;
      return;
    }
    case 'out': s.out[e.day] = !!e.on; return;
    case 'snooze': s.snoozeUntil = e.until; return;
    default: return;
  }
}

function lineDate(line, day) {
  const d = line.date;
  if (d && d.on) return { kind: d.kind, on: d.on };
  const days = d?.days ?? foodOf(line.food).est;
  return days == null ? null : { kind: 'est', on: addDays(day, days) };
}

function put(s, e) {
  const mark = (id) => { if (!e.seed) s.fresh.add(id); };
  (e.lines || []).forEach((line, i) => {
    const base = { food: line.food, owner: line.owner || 'me', addedOn: e.day };
    s.puts[line.food] = (s.puts[line.food] || 0) + 1;
    const bags = line.bags || 1;
    if (bags > 1) {
      s.splits[line.food] = bags;
      const each = Math.round((line.qty / bags) * 100) / 100;
      for (let b = 0; b < bags; b++) {
        const id = `${e.id}:${i}:${b}`;
        s.lots.set(id, { ...base, id, qty: each, unit: line.unit, spot: 'freezer', bag: true, date: { kind: 'frozen', on: e.day } });
        mark(id);
      }
      return;
    }
    const id = `${e.id}:${i}`;
    const spot = line.spot || foodOf(line.food).spot;
    const date = spot === 'freezer' ? { kind: 'frozen', on: line.frozenOn || e.day } : lineDate(line, e.day);
    s.lots.set(id, { ...base, id, qty: line.qty ?? 1, unit: line.unit || foodOf(line.food).unit, spot, bag: !!line.bag || spot === 'freezer', date });
    mark(id);
  });
}

// Used it = one fewer (one egg, one bag, the whole bottle). Used some = partly used.
function use(s, e) {
  const l = s.lots.get(e.lot);
  if (!l) return;
  if (e.how === 'some') {
    if (l.unit === 'pc' && l.qty > 1) l.qty -= 1; else l.part = true;
    return;
  }
  if (l.unit === 'pc' && l.qty > 1) l.qty -= 1; else s.lots.delete(e.lot);
}

// Lots of one food the user may eat from, in the order they should go:
// already in the fridge before the freezer, then soonest date / oldest bag first.
export function lotsOf(s, food) {
  return [...s.lots.values()]
    .filter((l) => l.food === food && l.owner !== 'housemate')
    .sort((a, b) => (a.spot === 'freezer') - (b.spot === 'freezer') || (a.date?.on || '9999').localeCompare(b.date?.on || '9999') || a.id.localeCompare(b.id));
}

// Take what the user said they ate. Returns how many units were actually taken.
export function consume(s, { food, qty = 1, unit, part }) {
  const lots = lotsOf(s, food);
  if (!lots.length) return 0;
  if (part) {
    const l = lots[0];
    if (l.unit === 'pc' && l.qty > 1) l.qty -= 1; else l.part = true;
    return 1;
  }
  let left = qty, taken = 0;
  const byBag = unit === 'bag';
  for (const l of byBag ? [...lots.filter((x) => x.bag), ...lots.filter((x) => !x.bag)] : lots) {
    if (left <= 0) break;
    if (l.unit === 'pc' && !byBag) {
      const t = Math.min(left, l.qty);
      l.qty -= t; left -= t; taken += t;
      if (l.qty <= 0) s.lots.delete(l.id);
    } else {
      s.lots.delete(l.id); left -= 1; taken += 1;
    }
  }
  return taken;
}

// What the tile number shows: counted foods by piece, everything else by lot (bag, bottle).
export const units = (l) => (l.unit === 'pc' ? l.qty : 1);

export function countOf(s, food) {
  return lotsOf(s, food).reduce((n, l) => n + units(l), 0);
}

// One tile per food per spot. Lots inside a tile are ordered most urgent / oldest first.
export function tiles(s, spot, today, { owners } = {}) {
  const groups = new Map();
  for (const l of s.lots.values()) {
    if (l.spot !== spot) continue;
    if (owners && !owners.includes(l.owner)) continue;
    if (!groups.has(l.food)) groups.set(l.food, []);
    groups.get(l.food).push(l);
  }
  const out = [];
  for (const [food, lots] of groups) {
    lots.sort((a, b) => (a.date?.on || '9999').localeCompare(b.date?.on || '9999') || a.id.localeCompare(b.id));
    out.push({ food, lots, lot: lots[0], count: lots.reduce((n, l) => n + units(l), 0), fresh: lots.some((l) => s.fresh.has(l.id)) });
  }
  // Keep a stable shelf order: catalogue order, so things don't jump around between visits.
  const order = Object.keys(FOODS);
  return out.sort((a, b) => order.indexOf(a.food) - order.indexOf(b.food));
}

// "Eat first": one card per food, outside the freezer, not the housemates', due within ~2 days.
export function eatFirst(s, today, limit = 3) {
  const best = new Map();
  for (const l of s.lots.values()) {
    if (l.spot === 'freezer' || l.owner === 'housemate') continue;
    const u = urgency(l.date, today);
    if (u == null || u > 2.5) continue;
    const cur = best.get(l.food);
    if (!cur || u < cur.u) best.set(l.food, { food: l.food, lot: l, u });
  }
  return [...best.values()]
    .sort((a, b) => a.u - b.u || kindOrder(a.lot.date) - kindOrder(b.lot.date))
    .slice(0, limit);
}

export function frozenLots(s) {
  return [...s.lots.values()].filter((l) => l.spot === 'freezer' && l.owner !== 'housemate')
    .sort((a, b) => a.date.on.localeCompare(b.date.on) || a.id.localeCompare(b.id));
}

export const oldestFrozen = (s) => frozenLots(s)[0] || null;

// "Beef, bag 1" = the oldest bag of that food in the freezer.
export function bagNumber(s, lot) {
  return frozenLots(s).filter((l) => l.food === lot.food).findIndex((l) => l.id === lot.id) + 1;
}

export const lastSplit = (s, food) => s.splits[food] || null;

// Foods bought most often, for the one-tap "Usual" row.
export function usual(s, n = 4, fallback = ['milk', 'spinach', 'eggs', 'bread']) {
  const ranked = Object.entries(s.puts).sort((a, b) => b[1] - a[1]).map(([f]) => f);
  return [...new Set([...ranked, ...fallback])].slice(0, n);
}

// Should the oldest frozen bag nudge the user today? At most one nudge a day (Brief C3), and none
// after a bag was thawed today, on an "Out tonight" day, or while snoozed.
export function nudge(s, today, minWeeks = 4) {
  const lot = oldestFrozen(s);
  if (!lot) return null;
  if (s.out[today] || s.thawedOn === today) return null;
  if (s.snoozeUntil && daysBetween(today, s.snoozeUntil) > 0) return null;
  return daysBetween(lot.date.on, today) >= minWeeks * 7 ? lot : null;
}

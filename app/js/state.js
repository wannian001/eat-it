// Nothing in the app is stored directly. Everything — the food, places, eating-out days, the
// shopping list, settings — is rebuilt by replaying an append-only list of events, the same idea
// as the owner's personal food log. Correcting a mistake means adding an event ("undo" names the
// event it cancels), never editing an old one.
//
// Food events
//   put      { lines: [{ food, name?, cat?, qty, unit, place, spot, owner, date, bags, guess? }], source? }
//   use      { lot, how: 'one' | 'some' }        Used it (one fewer) / Used some (partly used)
//   toss     { lot }                              Threw it out
//   ate      { items: [{ food, qty, unit, part, left }] }  "I ate …"; left = plenty|little|none answers
//                                                  "After today, is there any curry left?"
//   fix      { lot, on }                          change an estimate
//   date     { lot, date }                        set the date from the pack
//   amount   { lot, value: Full|Most|Half|Low }
//   open     { lot }
//   freeze   { lot, place }                       move into a freezer, dated today
//   thaw     { lot, place, spot }                 out of the freezer into the fridge
//   move     { lot, place, spot }
// Plan, shopping, home
//   plan     { day, mode: cook|out|none, skip? }  "Ate at home that day?" yes = cook, no = out, none = unanswered;
//                                                  skip = said yes but chose not to record what was used
//   qty      { lot, qty }                         set how many are left (0 = gone)
//   snooze   { until }
//   shop.add { id, name, own, who } · shop.done { id } · shop.claim { id, who }
//   place.add { id, name, kind } · place.edit { id, name?, kind?, full?, src? } · place.remove { id, moveTo }
//   set      { key, value }                       reminder / sharing switches
//   profile  { name }
//   house    { action: create|join|leave, code? }
//   link     { what: email|account, on, senders? }
//   setup    { name, places: [{ id, name, kind }], house }   first-run setup for "You"
//   undo     { target }

import { FOODS, food as foodOf } from './foods.js?v=a3e659d';
import { addDays, urgency, kindOrder, daysBetween, lastGood } from './dates.js?v=a3e659d';

const THAWED_DAYS = 1; // our guess, shown dashed like every estimate
const clone = (x) => JSON.parse(JSON.stringify(x ?? null));

export function emptyState(persona) {
  return {
    lots: new Map(), splits: {}, puts: {}, fresh: new Set(), history: {},
    places: clone(persona.places) || [],
    plan: {}, snoozeUntil: null, thawedOn: null,
    shop: clone(persona.shop) || [],
    settings: { summary: true, quiet: true, lockNames: false, shareShelf: false, ...clone(persona.settings) },
    profile: { name: persona.name, mail: persona.mail || '' },
    house: clone(persona.house) || null,
    links: { email: false, senders: [], account: false },
    done: {}, // receipt / email keys already put in
    setUp: !!persona.builtin,
  };
}

export function replay(events, persona) {
  const s = emptyState(persona);
  const undone = new Set(events.filter((e) => e.type === 'undo').map((e) => e.target));
  for (const e of events) {
    if (undone.has(e.id) || e.type === 'undo') continue;
    try { apply(s, e); } catch (err) { console.warn('[eatit] skipped an event that could not be read', e, err); }
  }
  return s;
}

export const placeOf = (s, id) => s.places.find((p) => p.id === id) || null;
export const firstOfKind = (s, kind) => s.places.find((p) => p.kind === kind) || null;
export const hasFreezer = (s) => !!firstOfKind(s, 'frozen');
const isFrozenPlace = (s, id) => placeOf(s, id)?.kind === 'frozen';

// Days marked "eating out" ahead, grouped into runs (Sat–Sun), each with the food that would go off
// while you're away. prep = the last day at home before, when to use or freeze it.
export function awayRuns(s, today, horizon = 14) {
  const days = Object.keys(s.plan).filter((d) => s.plan[d].mode === 'out' && d > today && daysBetween(today, d) <= horizon).sort();
  const runs = [];
  for (const d of days) {
    const last = runs[runs.length - 1];
    if (last && addDays(last.to, 1) === d) last.to = d; else runs.push({ from: d, to: d });
  }
  return runs.map((r) => ({
    ...r,
    prep: addDays(r.from, -1),
    lots: [...s.lots.values()]
      .filter((l) => l.owner !== 'housemate' && !isFrozenPlace(s, l.place) && lastGood(l.date) >= r.from && lastGood(l.date) <= r.to)
      .sort((a, b) => lastGood(a.date).localeCompare(lastGood(b.date))),
  })).filter((r) => r.lots.length);
}

// What happened on each day, for the week calendar ("Ate", "Added", …).
function note(s, day, entry) {
  (s.history[day] ||= []).push(entry);
}
const nameOf = (l) => ({ food: l.food, name: l.name || null });

export function apply(s, e) {
  // "fresh" = lots the user just put in, so the screen can show them arriving. Seeds never count.
  s.fresh = new Set();
  const lot = e.lot ? s.lots.get(e.lot) : null;
  switch (e.type) {
    case 'put': return put(s, e);
    case 'use': if (lot) { note(s, e.day, { kind: 'use', how: e.how, ...nameOf(lot) }); use(s, lot, e.how); } return;
    case 'qty':
      if (!lot) return;
      note(s, e.day, { kind: 'qty', from: units(lot), to: e.qty, ...nameOf(lot) });
      if (e.qty <= 0) s.lots.delete(e.lot); else if (lot.unit === 'pc') lot.qty = e.qty;
      return;
    case 'toss': if (lot) note(s, e.day, { kind: 'toss', ...nameOf(lot) }); s.lots.delete(e.lot); return;
    case 'ate':
      for (const it of e.items || []) {
        const taken = consume(s, it, e.day);
        note(s, e.day, { kind: 'ate', food: it.food, qty: it.qty, unit: it.unit, part: it.part, left: it.left, taken });
      }
      return;
    case 'fix': if (lot?.date) lot.date = { ...lot.date, on: e.on, guess: false }; return;
    case 'date': if (lot) lot.date = { ...e.date }; return;
    case 'amount': if (lot) { lot.amount = e.value; note(s, e.day, { kind: 'amount', value: e.value, ...nameOf(lot) }); } return;
    case 'open': if (lot) lot.opened = e.day; return;
    case 'freeze':
      if (lot && placeOf(s, e.place)) { Object.assign(lot, { place: e.place, spot: null, bag: true, date: { kind: 'frozen', on: e.day } }); note(s, e.day, { kind: 'freeze', ...nameOf(lot) }); }
      return;
    case 'thaw':
      if (lot && isFrozenPlace(s, lot.place)) { Object.assign(lot, { place: e.place, spot: e.spot || null, date: { kind: 'est', on: addDays(e.day, THAWED_DAYS) }, thawed: true }); note(s, e.day, { kind: 'thaw', ...nameOf(lot) }); s.thawedOn = e.day; }
      return;
    case 'move': if (lot && placeOf(s, e.place)) Object.assign(lot, { place: e.place, spot: e.spot ?? null }); return;
    case 'plan': if (e.mode === 'none') delete s.plan[e.day]; else s.plan[e.day] = { mode: e.mode === 'cook' ? 'cook' : 'out', skip: !!e.skip }; return;
    case 'out': if (e.on) s.plan[e.day] = { mode: 'out' }; else delete s.plan[e.day]; return;
    case 'snooze': s.snoozeUntil = e.until; return;
    case 'shop.add': s.shop.push({ id: e.id, name: e.name, own: e.own || 'mine', who: e.who ?? null, done: false }); return;
    case 'shop.done': { const it = s.shop.find((x) => x.id === e.id); if (it) it.done = !it.done; return; }
    case 'shop.claim': { const it = s.shop.find((x) => x.id === e.id); if (it) it.who = e.who; return; }
    case 'place.add': s.places.push({ id: e.id, name: e.name, kind: e.kind, sub: '', full: null }); return;
    case 'place.edit': {
      const p = placeOf(s, e.id);
      if (!p) return;
      for (const k of ['name', 'kind', 'full', 'src']) if (e[k] !== undefined) p[k] = e[k];
      if (e.full !== undefined) p.measuredOn = e.day;
      if (e.kind !== undefined) for (const l of s.lots.values()) if (l.place === p.id) settle(s, l, e.day);
      return;
    }
    case 'place.remove': {
      if (!placeOf(s, e.id)) return;
      const to = placeOf(s, e.moveTo);
      for (const l of [...s.lots.values()]) {
        if (l.place !== e.id) continue;
        if (!to) { s.lots.delete(l.id); continue; }
        l.place = to.id; l.spot = null;
        settle(s, l, e.day);
      }
      s.places = s.places.filter((p) => p.id !== e.id);
      return;
    }
    case 'set': s.settings[e.key] = e.value; return;
    case 'profile': s.profile.name = e.name || s.profile.name; return;
    case 'house':
      if (e.action === 'leave') s.house = null;
      else s.house = { name: e.action === 'join' ? 'Shared house' : `${s.profile.name}'s household`, code: e.code, mates: s.house?.mates || [] };
      return;
    case 'link':
      if (e.what === 'email') s.links = { ...s.links, email: !!e.on, senders: e.senders || [] };
      else s.links = { ...s.links, account: !!e.on };
      return;
    case 'setup':
      s.profile.name = e.name || s.profile.name;
      s.places = clone(e.places);
      s.house = e.house === 'alone' ? null : { name: e.house === 'join' ? 'Shared house' : `${s.profile.name}'s household`, code: e.code, mates: [] };
      s.setUp = true;
      return;
    default: return;
  }
}

function lineDate(line, day) {
  const d = line.date;
  if (d && d.kind === 'none') return { kind: 'none', note: d.note };
  if (d && d.on) return { kind: d.kind, on: d.on, guess: !!d.guess };
  const days = d?.days ?? foodOf(line.food).est;
  return days == null ? null : { kind: 'est', on: addDays(day, days), guess: !!(d?.guess) };
}

function put(s, e) {
  const mark = (id) => { if (!e.seed) s.fresh.add(id); };
  note(s, e.day, { kind: 'put', count: (e.lines || []).length, source: e.source || null });
  if (e.source) s.done[e.source] = true;
  (e.lines || []).forEach((line, i) => {
    const base = { food: line.food, name: line.name || null, cat: line.cat || null, owner: line.owner || 'me', addedOn: e.day, tip: line.tip || null, amount: line.amount || null };
    s.puts[line.food] = (s.puts[line.food] || 0) + 1;
    const frozenPlace = isFrozenPlace(s, line.place);
    const bags = line.bags || 1;
    if (bags > 1 && frozenPlace) {
      s.splits[line.food] = bags;
      const each = Math.round((line.qty / bags) * 100) / 100;
      for (let b = 0; b < bags; b++) {
        const id = `${e.id}:${i}:${b}`;
        s.lots.set(id, { ...base, id, qty: each, unit: line.unit, place: line.place, spot: null, bag: true, date: { kind: 'frozen', on: line.frozenOn || e.day } });
        mark(id);
      }
      return;
    }
    const id = `${e.id}:${i}`;
    const date = frozenPlace && line.date?.kind !== 'best_before' ? { kind: 'frozen', on: line.frozenOn || e.day } : lineDate(line, e.day);
    s.lots.set(id, { ...base, id, qty: line.qty ?? 1, unit: line.unit || foodOf(line.food).unit, place: line.place, spot: line.spot || null, bag: !!line.bag || frozenPlace, date });
    mark(id);
  });
}

// Food that lands in a freezer is frozen from that day; food that leaves one is thawed (our guess).
function settle(s, l, day) {
  const frozenNow = isFrozenPlace(s, l.place);
  if (frozenNow && l.date?.kind !== 'frozen') Object.assign(l, { bag: true, date: { kind: 'frozen', on: day } });
  else if (!frozenNow && l.date?.kind === 'frozen') Object.assign(l, { date: { kind: 'est', on: addDays(day, THAWED_DAYS) }, thawed: true });
}

// Used it = one fewer (one egg, one bag, the whole bottle). Used some = partly used.
function use(s, l, how) {
  if (how === 'some') {
    if (l.unit === 'pc' && l.qty > 1) l.qty -= 1; else { l.part = true; l.amount = l.amount === 'Half' || l.amount === 'Low' ? 'Low' : 'Half'; }
    return;
  }
  if (l.unit === 'pc' && l.qty > 1) l.qty -= 1; else s.lots.delete(l.id);
}

// Lots of one food the user may eat from, in the order they should go:
// already in the fridge before the freezer, then soonest date / oldest bag first.
export function lotsOf(s, foodId) {
  return [...s.lots.values()]
    .filter((l) => l.food === foodId && l.owner !== 'housemate')
    .sort((a, b) => (isFrozenPlace(s, a.place) - isFrozenPlace(s, b.place)) || (a.date?.on || '9999').localeCompare(b.date?.on || '9999') || a.id.localeCompare(b.id));
}

const AMOUNT_RANK = { Full: 4, Most: 3, Half: 2, Low: 1 };
// An answer can only make "how much is left" smaller, never bigger.
const lower = (now, to) => ((AMOUNT_RANK[to] ?? 4) < (AMOUNT_RANK[now] ?? 4) ? to : now);

// Take n units, soonest first: pieces off a counted lot, whole lots otherwise, half a bag as "half".
function take(s, lots, n, byBag) {
  let left = n, taken = 0;
  for (const l of byBag ? [...lots.filter((x) => x.bag), ...lots.filter((x) => !x.bag)] : lots) {
    if (left <= 0) break;
    if (l.unit === 'pc' && !byBag) {
      const t = Math.min(left, l.qty);
      l.qty = Math.round((l.qty - t) * 100) / 100; left -= t; taken += t;
      if (l.qty <= 0) s.lots.delete(l.id);
    } else if (left >= 1) {
      s.lots.delete(l.id); left -= 1; taken += 1;
    } else {
      l.part = true; l.amount = lower(l.amount, 'Half'); taken += left; left = 0;
    }
  }
  return taken;
}

// Take what the user said they ate. Returns how many units were actually taken. For an earlier
// day, only food that was already at home that day counts.
export function consume(s, { food, qty = 1, unit, part, left: remains }, day = null) {
  let lots = lotsOf(s, food);
  if (day) { const then = lots.filter((l) => !l.addedOn || l.addedOn <= day); if (then.length) lots = then; }
  if (!lots.length) return 0;
  const total = lots.reduce((n, l) => n + units(l), 0);
  // The user said how much is left.
  if (remains) {
    if (remains === 'none') { for (const l of lots) s.lots.delete(l.id); return total; }
    // Several bags or pieces: "a little left" keeps about a quarter; "plenty left" = one was used.
    if (total > 1) return take(s, lots, total - (remains === 'little' ? Math.max(1, Math.round(total / 4)) : total - 1), false);
    const l = lots[0];
    l.part = true;
    l.amount = lower(l.amount, remains === 'little' ? 'Low' : 'Most');
    return 0;
  }
  if (part) { use(s, lots[0], 'some'); return 1; }
  return take(s, lots, qty, unit === 'bag');
}

export const units = (l) => (l.unit === 'pc' ? l.qty : 1);

export function countOf(s, foodId) {
  return lotsOf(s, foodId).reduce((n, l) => n + units(l), 0);
}

const groupKey = (l) => l.name ? `${l.food}|${l.name}` : l.food;

// One tile per food in a place (and spot). Lots inside a tile are ordered most urgent / oldest first.
export function tiles(s, place, spot, { owners } = {}) {
  const groups = new Map();
  for (const l of s.lots.values()) {
    if (l.place !== place) continue;
    if (spot !== undefined && (l.spot || null) !== spot) continue;
    if (owners && !owners.includes(l.owner)) continue;
    const k = groupKey(l);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(l);
  }
  const order = Object.keys(FOODS);
  return [...groups.values()].map((lots) => {
    lots.sort((a, b) => (a.date?.on || '9999').localeCompare(b.date?.on || '9999') || a.id.localeCompare(b.id));
    return { food: lots[0].food, key: groupKey(lots[0]), lots, lot: lots[0], count: lots.reduce((n, l) => n + units(l), 0), fresh: lots.some((l) => s.fresh.has(l.id)) };
  }).sort((a, b) => (order.indexOf(a.food) + 1 || 999) - (order.indexOf(b.food) + 1 || 999) || a.key.localeCompare(b.key));
}

// "Eat first": one card per food, outside the freezer, due within ~2 days.
export function eatFirst(s, today, limit = 3) {
  const best = new Map();
  for (const l of s.lots.values()) {
    if (isFrozenPlace(s, l.place) || l.owner === 'housemate') continue;
    const u = urgency(l.date, today);
    if (u == null || u > 2.5) continue;
    const cur = best.get(groupKey(l));
    if (!cur || u < cur.u) best.set(groupKey(l), { food: l.food, lot: l, u });
  }
  return [...best.values()].sort((a, b) => a.u - b.u || kindOrder(a.lot.date) - kindOrder(b.lot.date)).slice(0, limit);
}

export function frozenLots(s) {
  return [...s.lots.values()].filter((l) => isFrozenPlace(s, l.place) && l.date?.kind === 'frozen')
    .sort((a, b) => a.date.on.localeCompare(b.date.on) || a.id.localeCompare(b.id));
}

export const oldestFrozen = (s) => frozenLots(s)[0] || null;

// "Beef, bag 1" = the oldest bag of that food in the freezer.
export function bagNumber(s, lot) {
  return frozenLots(s).filter((l) => l.food === lot.food).findIndex((l) => l.id === lot.id) + 1;
}

export const lastSplit = (s, foodId) => s.splits[foodId] || null;

// Foods bought most often, for the one-tap "Usual" row.
export function usual(s, n = 4, fallback = ['milk', 'spinach', 'eggs', 'bread']) {
  const ranked = Object.entries(s.puts).filter(([f]) => FOODS[f]).sort((a, b) => b[1] - a[1]).map(([f]) => f);
  return [...new Set([...ranked, ...fallback])].slice(0, n);
}

export const modeOf = (s, day) => s.plan[day]?.mode || 'cook';
// The answer to "Ate at home today?": 'home', 'out', or null if not answered yet.
export const mealAnswer = (s, day) => ({ cook: 'home', out: 'out' }[s.plan[day]?.mode] || null);
export const mealSkipped = (s, day) => !!s.plan[day]?.skip;

// Should the oldest frozen bag nudge the user today? At most one nudge a day (Brief C3), and none
// after a bag was thawed today, on a day you're eating out, or while snoozed.
export function nudge(s, today, minWeeks = 4) {
  const lot = oldestFrozen(s);
  if (!lot) return null;
  if (modeOf(s, today) !== 'cook' || s.thawedOn === today) return null;
  if (s.snoozeUntil && daysBetween(today, s.snoozeUntil) > 0) return null;
  return daysBetween(lot.date.on, today) >= minWeeks * 7 ? lot : null;
}


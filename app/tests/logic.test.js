// Run with: cd app && node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { dateTag, urgency, addDays, daysBetween } from '../js/dates.js';
import { parseAte } from '../js/parse.js';
import { matchFood } from '../js/foods.js';
import { replay, eatFirst, countOf, nudge, oldestFrozen, bagNumber, lastSplit, modeOf } from '../js/state.js';
import { weekDays } from '../js/views/week.js';
import { BUILTIN, blankUser } from '../js/seed.js';
import { shiftDates } from '../js/users.js';
import { openStore, httpAdapter, memoryAdapter } from '../js/store.js';

const TODAY = '2026-10-10'; // Saturday, the canvas demo day
const JOHN = BUILTIN.john, MAY = BUILTIN.may;
const john = (...events) => replay([...JOHN.seed, ...events], JOHN);
const may = (...events) => replay([...MAY.seed, ...events], MAY);
let n = 0;
const ev = (type, x) => ({ id: `t${++n}`, type, day: TODAY, ...x });

test('date tags read like the canvas', () => {
  assert.equal(dateTag({ kind: 'use_by', on: '2026-10-11' }, TODAY).text, 'Use by Sun');
  assert.equal(dateTag({ kind: 'use_by', on: '2026-10-17' }, TODAY).text, 'Use by 17 Oct');
  assert.equal(dateTag({ kind: 'best_before', on: TODAY }, TODAY).text, 'Best before today');
  assert.equal(dateTag({ kind: 'best_before', on: '2026-11-20' }, TODAY).text, 'Best before Nov');
  assert.equal(dateTag({ kind: 'best_before', on: '2027-03-31' }, TODAY).text, 'Best before Mar 2027');
  assert.equal(dateTag({ kind: 'est', on: '2026-10-11' }, TODAY, 'card').text, '~1 day left');
  assert.equal(dateTag({ kind: 'est', on: '2026-10-17' }, TODAY, 'receipt').text, '~1 week (our guess)');
  assert.equal(dateTag({ kind: 'frozen', on: '2026-09-12' }, TODAY).text, '4 weeks');
  assert.equal(dateTag({ kind: 'none', note: 'Dry · keeps for months' }, TODAY).text, 'Dry · keeps for months');
});

test('best before ranks after use by and estimates on the same day', () => {
  assert.equal(urgency({ kind: 'use_by', on: '2026-10-11' }, TODAY), 1);
  assert.equal(urgency({ kind: 'best_before', on: TODAY }, TODAY), 1.5);
  assert.equal(urgency({ kind: 'frozen', on: '2026-09-12' }, TODAY), null);
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(daysBetween('2026-09-12', TODAY), 28);
});

test('voice sentences and typed names become food', () => {
  const said = 'I had one bag of beef, two tomatoes and three eggs.';
  const j = parseAte(said);
  assert.deepEqual(j.map(({ food, qty, unit }) => [food, qty, unit]), [['beef', 1, 'bag'], ['tomato', 2, null], ['eggs', 3, null]]);
  assert.equal(said.slice(...j[0].spans[0]), 'one bag of beef');
  assert.deepEqual(parseAte('I had two chicken thighs and some spinach.').map(({ food, qty, part }) => [food, qty, part]), [['chicken', 2, false], ['spinach', 1, true]]);
  assert.deepEqual(parseAte('I had pizza'), []);
  assert.equal(matchFood('Firm tofu'), 'tofu');
  assert.equal(matchFood('2 spring onions'), 'springonion');
  assert.equal(matchFood('a new thing'), null);
});

test("John's demo home matches board 01 plus the v0.2 cupboard", () => {
  const s = john();
  assert.deepEqual(eatFirst(s, TODAY).map((x) => x.food), ['milk', 'curry', 'spinach']);
  assert.equal(countOf(s, 'beef'), 5);
  const oldest = oldestFrozen(s);
  assert.equal(oldest.food, 'beef');
  assert.equal(bagNumber(s, oldest), 1);
  assert.equal(lastSplit(s, 'beef'), 5);
  assert.equal(nudge(s, TODAY)?.id, oldest.id);
  assert.deepEqual(s.places.map((p) => p.id), ['fridge', 'freezer', 'pantry']);
  assert.ok([...s.lots.values()].some((l) => l.place === 'pantry' && l.food === 'rice'));
});

test("May's demo home matches board 02, no freezer", () => {
  const s = may();
  assert.deepEqual(eatFirst(s, TODAY).map((x) => x.food), ['chicken', 'spinach', 'strawberry']);
  assert.equal(nudge(s, TODAY), null);
  assert.equal(modeOf(s, '2026-10-13'), 'out');
});

test('eating takes the oldest bag first', () => {
  const s = john(ev('ate', { items: parseAte('one bag of beef, two tomatoes and three eggs') }));
  assert.equal(countOf(s, 'beef'), 4);
  assert.equal(countOf(s, 'tomato'), 2);
  assert.equal(countOf(s, 'eggs'), 3);
});

test('splitting into bags freezes them and remembers the split', () => {
  const s = john(ev('put', { lines: [{ food: 'beef', qty: 1000, unit: 'g', place: 'freezer', bags: 2 }] }));
  assert.equal(countOf(s, 'beef'), 7);
  assert.equal(lastSplit(s, 'beef'), 2);
  assert.equal(s.fresh.size, 2);
});

test('eating out marks the day and holds the freezer nudge', () => {
  const s = john(ev('plan', { day: TODAY, mode: 'out' }));
  assert.equal(modeOf(s, TODAY), 'out');
  assert.equal(nudge(s, TODAY), null);
  assert.equal(modeOf(may(), '2026-10-13'), 'out');
});

test('fixing stock by hand: set a count, or all gone', () => {
  const s = john(ev('qty', { lot: 'john-1004:1', qty: 2 }));
  assert.equal(countOf(s, 'eggs'), 2);
  const t = john(ev('qty', { lot: 'john-1004:0', qty: 0 }));
  assert.equal(countOf(t, 'milk'), 0);
  assert.deepEqual(t.history[TODAY].map((h) => [h.kind, h.food, h.to]), [['qty', 'milk', 0]]);
  const u = john(ev('qty', { lot: 'john-1004:1', qty: 5 }), ev('qty', { lot: 'john-1004:1', qty: 4 }));
  assert.deepEqual(weekDays({ store: { state: u, today: TODAY } }).find((d) => d.isToday).ate, ['Eggs: 6 \u2192 4']);
});

test('the week calendar shows what is due each day and what was eaten', () => {
  const s = john(ev('ate', { items: [{ food: 'tomato', qty: 2, exact: true }, { food: 'curry', left: 'none' }] }));
  const app = { store: { state: s, today: TODAY } };
  const days = weekDays(app);
  assert.equal(days.length, 7);
  assert.equal(days[0].date, '2026-10-05'); // Monday
  const sat = days.find((d) => d.date === TODAY);
  assert.ok(sat.isToday);
  assert.deepEqual(sat.ate, ['Tomatoes \u22122', 'Curry: all gone']);
  const sun = days.find((d) => d.date === '2026-10-11');
  assert.deepEqual(sun.due.map((l) => l.food), ['milk']);
});

test('undo cancels exactly one event', () => {
  const put = ev('put', { lines: [{ food: 'eggs', qty: 12, unit: 'pc', place: 'fridge', spot: 'top' }] });
  assert.equal(countOf(john(put), 'eggs'), 18);
  assert.equal(countOf(john(put, ev('undo', { target: put.id })), 'eggs'), 6);
});

test('thaw, freeze, move and toss', () => {
  const lot = oldestFrozen(john());
  const s = john(ev('thaw', { lot: lot.id, place: 'fridge', spot: 'middle' }));
  assert.equal(s.lots.get(lot.id).place, 'fridge');
  assert.equal(nudge(s, TODAY), null);
  const t = john(ev('freeze', { lot: 'john-1004:4', place: 'freezer' }));
  assert.equal(t.lots.get('john-1004:4').date.kind, 'frozen');
  const u = john(ev('toss', { lot: 'john-1004:4' }));
  assert.equal(u.lots.has('john-1004:4'), false);
});

test('places, settings, shopping and first-run setup', () => {
  const s = john(
    ev('place.add', { id: 'rb', name: 'Rice bin', kind: 'room' }),
    ev('move', { lot: 'john-1004:8', place: 'rb' }),
    ev('place.remove', { id: 'pantry', moveTo: 'fridge' }),
    ev('set', { key: 'quiet', value: false }),
    ev('shop.add', { id: 'x', name: 'Milk 2 L', own: 'mine', who: 'John' }),
    ev('shop.done', { id: 'x' }),
  );
  assert.deepEqual(s.places.map((p) => p.id), ['fridge', 'freezer', 'rb']);
  assert.equal(s.lots.get('john-1004:8').place, 'rb');
  assert.equal(s.lots.get('john-1004:7').place, 'fridge');
  assert.equal(s.settings.quiet, false);
  assert.equal(s.shop.find((x) => x.id === 'x').done, true);
  const me = replay([ev('setup', { name: 'Jiakuo', places: [{ id: 'fridge', name: 'Fridge', kind: 'cold' }], house: 'alone' })], blankUser('u-test', 'Jiakuo'));
  assert.equal(me.setUp, true);
  assert.equal(me.profile.name, 'Jiakuo');
});

test('a store over HTTP saves and reloads events; a memory store forgets', async () => {
  const saved = [];
  const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => { saved.push(JSON.parse(body)); res.end('{}'); });
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ events: saved.filter((x) => req.url.includes(`person=${x.person}`)).map((x) => x.event) }));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/api/eatit`;
  try {
    const me = { ...blankUser('u-test', 'You'), today: TODAY };
    const store = await openStore(me, httpAdapter(base));
    await store.dispatch({ type: 'setup', name: 'You', places: [{ id: 'fridge', name: 'Fridge', kind: 'cold' }], house: 'alone' });
    await store.dispatch({ type: 'put', lines: [{ food: 'eggs', qty: 12, unit: 'pc', place: 'fridge', spot: 'top', date: { kind: 'best_before', on: '2026-10-30' } }] });
    assert.equal(store.error, null);
    assert.equal(saved.length, 2);
    const again = await openStore(me, httpAdapter(base));
    assert.equal(countOf(again.state, 'eggs'), 12);
  } finally {
    server.close();
  }
  const demo = await openStore(JOHN, memoryAdapter());
  await demo.dispatch({ type: 'toss', lot: 'john-1004:0' });
  assert.equal((await openStore(JOHN, memoryAdapter())).state.lots.has('john-1004:0'), true);
});

test("built-in users start on the day they are first opened", () => {
  const shifted = shiftDates({ seed: JOHN.seed }, 2).seed;
  const s = replay(shifted, JOHN);
  // Same fridge, two days later: milk is still "use by" tomorrow, the beef still 4 weeks frozen.
  assert.deepEqual(eatFirst(s, '2026-10-12').map((x) => x.food), ['milk', 'curry', 'spinach']);
  assert.equal(nudge(s, '2026-10-12')?.food, 'beef');
  assert.equal(shiftDates('not a date', 3), 'not a date');
  assert.equal(shiftDates({ on: '2026-10-31' }, 1).on, '2026-11-01');
});

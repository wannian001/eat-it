// Run with: cd app && node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { dateTag, urgency, addDays, daysBetween } from '../js/dates.js';
import { parseAte } from '../js/parse.js';
import { replay, eatFirst, countOf, tiles, nudge, oldestFrozen, bagNumber, lastSplit } from '../js/state.js';
import { PERSONAS } from '../js/seed.js';
import { openStore, httpAdapter } from '../js/store.js';

const TODAY = '2026-10-10'; // Saturday, the canvas demo day

test('date tags read like the canvas', () => {
  assert.equal(dateTag({ kind: 'use_by', on: '2026-10-11' }, TODAY).text, 'Use by Sun');
  assert.equal(dateTag({ kind: 'use_by', on: '2026-10-17' }, TODAY).text, 'Use by 17 Oct');
  assert.equal(dateTag({ kind: 'best_before', on: TODAY }, TODAY).text, 'Best before today');
  assert.equal(dateTag({ kind: 'best_before', on: '2026-11-20' }, TODAY).text, 'Best before Nov');
  assert.equal(dateTag({ kind: 'best_before', on: '2027-03-31' }, TODAY).text, 'Best before Mar 2027');
  assert.equal(dateTag({ kind: 'est', on: '2026-10-11' }, TODAY, 'card').text, '~1 day left');
  assert.equal(dateTag({ kind: 'est', on: '2026-10-17' }, TODAY, 'receipt').text, '~1 week (our guess)');
  assert.equal(dateTag({ kind: 'frozen', on: '2026-09-12' }, TODAY).text, '4 weeks');
  assert.equal(dateTag({ kind: 'frozen', on: '2026-09-12' }, TODAY, 'sheet').text, 'Frozen 4 weeks');
});

test('best before ranks after use by and estimates on the same day', () => {
  assert.equal(urgency({ kind: 'use_by', on: '2026-10-11' }, TODAY), 1);
  assert.equal(urgency({ kind: 'best_before', on: TODAY }, TODAY), 1.5);
  assert.equal(urgency({ kind: 'frozen', on: '2026-09-12' }, TODAY), null);
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(daysBetween('2026-09-12', TODAY), 28);
});

test('voice sentences become food and amounts', () => {
  const john = parseAte('I had one bag of beef, two tomatoes and three eggs.');
  assert.deepEqual(john.map(({ food, qty, unit, part }) => [food, qty, unit, part]), [
    ['beef', 1, 'bag', false], ['tomato', 2, null, false], ['eggs', 3, null, false],
  ]);
  const text = 'I had one bag of beef, two tomatoes and three eggs.';
  assert.equal(text.slice(...john[0].spans[0]), 'one bag of beef');

  const may = parseAte('I had two chicken thighs and some spinach.');
  assert.deepEqual(may.map(({ food, qty, part }) => [food, qty, part]), [['chicken', 2, false], ['spinach', 1, true]]);

  assert.deepEqual(parseAte('spring onion and a leek').map((x) => x.food), ['springonion', 'leek']);
  assert.deepEqual(parseAte('an egg and another egg')[0].qty, 2);
  assert.deepEqual(parseAte('I had pizza'), []);
});

test("John's demo fridge matches board 01", () => {
  const s = replay(PERSONAS.john.seed);
  assert.deepEqual(eatFirst(s, TODAY).map((x) => x.food), ['milk', 'curry', 'spinach']);
  assert.equal(countOf(s, 'beef'), 5);
  const oldest = oldestFrozen(s);
  assert.equal(oldest.food, 'beef');
  assert.equal(bagNumber(s, oldest), 1);
  assert.equal(lastSplit(s, 'beef'), 5);
  assert.equal(nudge(s, TODAY)?.id, oldest.id);
  assert.deepEqual(tiles(s, 'freezer', TODAY).map((t) => [t.food, t.count]), [['beef', 5], ['chicken', 4], ['dumplings', 1]]);
});

test("May's demo fridge matches board 02 and hides housemates' food", () => {
  const s = replay(PERSONAS.may.seed);
  assert.deepEqual(eatFirst(s, TODAY).map((x) => x.food), ['chicken', 'spinach', 'strawberry']);
  // Lily and Sam's yoghurt is in the fridge, but never counts as May's.
  assert.equal(countOf(s, 'yoghurt'), 1);
  assert.equal(tiles(s, 'mine', TODAY).length, 3);
});

test('eating takes the oldest bag first and the "Got it" numbers add up', () => {
  const ate = { id: 't1', type: 'ate', day: TODAY, items: parseAte('one bag of beef, two tomatoes and three eggs') };
  const s = replay([...PERSONAS.john.seed, ate]);
  assert.equal(countOf(s, 'beef'), 4);
  assert.equal(countOf(s, 'tomato'), 2);
  assert.equal(countOf(s, 'eggs'), 3);
  // The bag that went was one of the 12 Sep bags.
  assert.equal(oldestFrozen(s).date.on, '2026-09-12');
});

test('splitting into bags freezes them and remembers the split', () => {
  const put = { id: 'p1', type: 'put', day: TODAY, lines: [{ food: 'beef', qty: 1000, unit: 'g', bags: 2 }] };
  const s = replay([...PERSONAS.john.seed, put]);
  assert.equal(countOf(s, 'beef'), 7);
  assert.equal(lastSplit(s, 'beef'), 2);
  assert.equal(s.fresh.size, 2);
  assert.ok([...s.fresh].every((id) => s.lots.get(id).spot === 'freezer' && s.lots.get(id).qty === 500));
});

test('thaw moves a bag to the fridge and stops the nudge for today', () => {
  const s0 = replay(PERSONAS.john.seed);
  const lot = oldestFrozen(s0);
  const s = replay([...PERSONAS.john.seed, { id: 'th', type: 'thaw', day: TODAY, lot: lot.id, spot: 'middle' }]);
  assert.equal(s.lots.get(lot.id).spot, 'middle');
  assert.equal(s.lots.get(lot.id).date.kind, 'est');
  assert.equal(nudge(s, TODAY), null);
  assert.ok(nudge(s, '2026-10-11'));
});

test('Out tonight and Later both hold the nudge', () => {
  const out = replay([...PERSONAS.john.seed, { id: 'o', type: 'out', day: TODAY, on: true }]);
  assert.equal(nudge(out, TODAY), null);
  const later = replay([...PERSONAS.john.seed, { id: 'l', type: 'snooze', day: TODAY, until: '2026-10-11' }]);
  assert.equal(nudge(later, TODAY), null);
  assert.ok(nudge(later, '2026-10-11'));
});

test('used it / used some', () => {
  const s0 = replay(PERSONAS.john.seed);
  const eggs = tiles(s0, 'top', TODAY).find((t) => t.food === 'eggs').lot;
  const s1 = replay([...PERSONAS.john.seed, { id: 'u', type: 'use', day: TODAY, lot: eggs.id, how: 'one' }]);
  assert.equal(countOf(s1, 'eggs'), 5);
  const milk = tiles(s0, 'top', TODAY).find((t) => t.food === 'milk').lot;
  const s2 = replay([...PERSONAS.john.seed, { id: 'u', type: 'use', day: TODAY, lot: milk.id, how: 'some' }]);
  assert.equal(s2.lots.get(milk.id).part, true);
});

test('a store over HTTP saves and reloads events', async () => {
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
    const me = { ...PERSONAS.me, today: TODAY };
    const store = await openStore(me, httpAdapter(base));
    await store.dispatch({ type: 'put', lines: [{ food: 'eggs', qty: 12, unit: 'pc', date: { kind: 'best_before', on: '2026-10-30' } }] });
    assert.equal(store.error, null);
    assert.equal(saved.length, 1);
    const again = await openStore(me, httpAdapter(base));
    assert.equal(countOf(again.state, 'eggs'), 12);
  } finally {
    server.close();
  }
});

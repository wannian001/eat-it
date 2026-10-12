// Fixes from the 10-13 review: the voice reader must never take food the user didn't eat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN } from '../js/seed.js';
import { openStore, memoryAdapter, httpAdapter } from '../js/store.js';
import { understand } from '../js/ai.js';
import { parseAte } from '../js/parse.js';
import { questionsFor, ateResult } from '../js/views/ate.js';
import { countOf, lotsOf, firstOfKind } from '../js/state.js';
import { matchFood } from '../js/foods.js';
import { dateTag } from '../js/dates.js';

const open = (who, extra = []) => openStore({ ...BUILTIN[who], today: '2026-10-10' }, memoryAdapter(extra));
async function say(store, text, answers = {}, day = null) {
  const { items } = await understand(text, [], { endpoint: null });
  const qs = questionsFor(store, items);
  const ans = Object.fromEntries(qs.map((q) => [q.food, answers[q.food]]).filter(([, v]) => v));
  await store.dispatch(ateResult(store, items, ans, day).event);
  return qs.map((q) => q.food);
}
const pick = (t) => parseAte(t).map(({ food, qty, unit, exact }) => [food, qty, unit, exact]);

test('two-word foods and parts of things are read as one thing', () => {
  assert.deepEqual(pick('two packets of egg noodles'), [['noodles', 2, 'bag', true]]);
  assert.deepEqual(pick('I used the pork mince'), [['pork', 1, null, false]]);
  assert.deepEqual(pick('chicken stock and two tomatoes'), [['tomato', 2, null, true]]);
  assert.deepEqual(pick('two slices of toast'), [['bread', 1, null, false]]);
  assert.deepEqual(pick("I didn't use the milk"), []);
  assert.deepEqual(pick('a couple of eggs and three large tomatoes'), [['eggs', 2, null, true], ['tomato', 3, null, true]]);
  assert.equal(matchFood('Lamb mince'), null);
});

test('egg noodles leave the eggs alone; toast asks instead of taking the loaf', async () => {
  const s = await open('may');
  const eggs = countOf(s.state, 'eggs');
  await say(s, 'two packets of egg noodles');
  assert.equal(countOf(s.state, 'eggs'), eggs);
  assert.deepEqual(await say(s, 'two slices of toast', { bread: 'little' }), ['bread']);
  assert.equal(lotsOf(s.state, 'bread')[0].amount, 'Low');
});

test('the same food twice is asked about once; "plenty left" never adds food', async () => {
  const s = await open('may');
  const before = lotsOf(s.state, 'milk')[0].amount;
  assert.deepEqual(await say(s, 'some milk and the rest of the milk', { milk: 'plenty' }), ['milk']);
  assert.equal(lotsOf(s.state, 'milk')[0].amount, before);
});

test('"all gone" empties every bag of that food; "a little" keeps about a quarter', async () => {
  let s = await open('john');
  await say(s, 'I used the beef', { beef: 'none' });
  assert.equal(countOf(s.state, 'beef'), 0);
  s = await open('john');
  await say(s, 'I used the beef', { beef: 'little' });
  assert.equal(countOf(s.state, 'beef'), 1);
});

test('an AI reply in grams or with a negative number becomes a question, not a deletion', async () => {
  const stock = [{ food: 'beef', name: 'Beef' }];
  for (const items of [[{ food: 'beef', qty: 500, unit: 'g', exact: true }], [{ food: 'beef', qty: -3, exact: true }]]) {
    const r = await understand('x', stock, { endpoint: 'http://ai', fetchImpl: async () => ({ ok: true, json: async () => ({ items }) }) });
    assert.equal(r.items[0].exact, false);
  }
});

test('removing the freezer thaws what moves out; a bad server reply still opens', async () => {
  const s = await open('john');
  const fz = firstOfKind(s.state, 'frozen'), fridge = firstOfKind(s.state, 'cold');
  await s.dispatch({ type: 'place.remove', id: fz.id, moveTo: fridge.id });
  assert.ok(lotsOf(s.state, 'beef').every((l) => l.date.kind !== 'frozen'));
  const bad = httpAdapter('http://x', async () => ({ ok: true, json: async () => ({ events: [null, 'x', { nope: 1 }] }) }));
  const t = await openStore({ ...BUILTIN.may, today: '2026-10-10' }, bad);
  assert.ok(t.state.lots.size > 0);
  assert.equal(dateTag({ kind: 'est', on: '2026-10-08' }, '2026-10-10').text, 'Past our guess');
});

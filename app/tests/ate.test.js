// The "I ate" flow: what gets asked, what the answers do, and the optional AI server.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { BUILTIN } from '../js/seed.js';
import { openStore, memoryAdapter } from '../js/store.js';
import { countOf, lotsOf } from '../js/state.js';
import { understand } from '../js/ai.js';
import { questionsFor, ateResult } from '../js/views/ate.js';

test("John's line asks only about the curry, then applies the answer", async () => {
  const store = await openStore({ ...BUILTIN.john, today: '2026-10-10' }, memoryAdapter());
  const { items } = await understand('I cooked one bag of beef with two tomatoes, and had some of the curry.', [], { endpoint: null });
  const qs = questionsFor(store, items);
  assert.deepEqual(qs.map((q) => q.food), ['curry']);
  const { event, rows } = ateResult(store, items, { curry: 'none' });
  await store.dispatch(event);
  assert.equal(countOf(store.state, 'beef'), 4);
  assert.equal(countOf(store.state, 'tomato'), 2);
  assert.equal(countOf(store.state, 'curry'), 0);
  assert.equal(rows.find((r) => r.food === 'curry').answer, 'none');
});

test("May's line asks about spinach and mushrooms; 'a little' keeps them, marked low", async () => {
  const store = await openStore({ ...BUILTIN.may, today: '2026-10-10' }, memoryAdapter());
  const { items } = await understand('I made a stir fry with two chicken thighs, some spinach and the mushrooms.', [], { endpoint: null });
  assert.deepEqual(questionsFor(store, items).map((q) => q.food), ['spinach', 'mushrooms']);
  const { event } = ateResult(store, items, { spinach: 'little', mushrooms: 'plenty' });
  await store.dispatch(event);
  assert.equal(countOf(store.state, 'chicken'), 0);
  assert.equal(lotsOf(store.state, 'spinach')[0].amount, 'Low');
  assert.equal(lotsOf(store.state, 'mushrooms')[0].amount, 'Most');
});

test('food you do not have is not asked about', async () => {
  const store = await openStore({ ...BUILTIN.may, today: '2026-10-10' }, memoryAdapter());
  const { items } = await understand('I had some of the curry', [], { endpoint: null });
  assert.deepEqual(questionsFor(store, items), []);
});

test('an AI server can do the reading; bad answers fall back to the built-in reader', async () => {
  let reply = { items: [{ food: 'curry', part: true }, { food: 'unicorn', qty: 2 }] };
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(reply)); });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const endpoint = `http://127.0.0.1:${server.address().port}/ai`;
  try {
    const stock = [{ food: 'curry', name: 'Curry' }, { food: 'eggs', name: 'Eggs' }];
    const a = await understand('finished the leftovers', stock, { endpoint });
    assert.equal(a.by, 'server');
    assert.deepEqual(a.items.map((x) => [x.food, x.exact]), [['curry', false]]);
    reply = { nonsense: true };
    const b = await understand('two eggs', stock, { endpoint });
    assert.equal(b.by, 'local');
    assert.deepEqual(b.items.map((x) => [x.food, x.qty, x.exact]), [['eggs', 2, true]]);
  } finally {
    server.close();
  }
  const c = await understand('two eggs', [], { endpoint: 'http://127.0.0.1:1/nowhere' });
  assert.equal(c.by, 'local');
});

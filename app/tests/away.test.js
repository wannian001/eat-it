// Days out ahead: what would go off while you're away, and when to deal with it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { replay, awayRuns } from '../js/state.js';
import { canFreeze } from '../js/foods.js';
import { BUILTIN } from '../js/seed.js';

const TODAY = '2026-10-10';
const run = (who, ...events) => awayRuns(replay([...BUILTIN[who].seed, ...events], BUILTIN[who]), TODAY);
const foods = (r) => r.lots.map((l) => l.food);

test('days out in a row become one run, with the food that goes off meanwhile', () => {
  const [may] = run('may');
  assert.deepEqual([may.from, may.to, may.prep], ['2026-10-11', '2026-10-12', '2026-10-10']);
  assert.deepEqual(foods(may), ['chicken', 'strawberry', 'bread']);
  const [john] = run('john');
  assert.deepEqual([john.from, john.to], ['2026-10-11', '2026-10-13']);
  assert.deepEqual(foods(john), ['milk', 'curry', 'avocado']);
  assert.ok(canFreeze('curry') && canFreeze('chicken') && !canFreeze('milk'));
});

test('a day out with nothing going off needs no reminder; taking a day back ends the run there', () => {
  const quiet = run('may', { id: 'q', type: 'plan', day: '2026-10-20', mode: 'out' });
  assert.equal(quiet.length, 1);           // only the seeded run; 20 Oct has nothing due
  const shorter = run('john', { id: 'b', type: 'plan', day: '2026-10-13', mode: 'none' });
  assert.deepEqual(foods(shorter[0]), ['milk', 'curry']);
});

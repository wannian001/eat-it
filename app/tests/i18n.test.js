// Chinese: the language switch, the Chinese voice reader, Chinese dates and data names.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setLang, lang, dz, L } from '../js/i18n.js';
import { parseAte } from '../js/parse.js';
import { matchFood, foodName, shortName } from '../js/foods.js';
import { dateTag, fmtDay, longDay } from '../js/dates.js';
import { qtyText, amountText } from '../js/ui.js';

const TODAY = '2026-10-10';
const said = (t) => parseAte(t).map(({ food, qty, unit, part, exact }) => [food, qty, unit, part, exact]);

test('the Chinese voice reader: numbers and measure words are exact, vague amounts are asked about', () => {
  assert.deepEqual(said('我做了一袋牛肉和两个番茄，还吃了一些咖喱。'), [['beef', 1, 'bag', false, true], ['tomato', 2, null, false, true], ['curry', 1, null, true, false]]);
  assert.deepEqual(said('我用两块鸡腿肉、一些菠菜和蘑菇炒了个菜。'), [['chicken', 2, null, false, true], ['spinach', 1, null, true, false], ['mushrooms', 1, null, false, false]]);
  assert.deepEqual(said('煮了十二个饺子和半袋牛肉'), [['dumplings', 12, null, false, true], ['beef', 1, null, true, false]]);
  // Named but not taken; sauces are not the food.
  assert.deepEqual(said('早上吃了三个鸡蛋，没喝牛奶'), [['eggs', 3, null, false, true]]);
  assert.deepEqual(said('加了番茄酱和洋葱'), []);
  // The highlighted words cover the amount too.
  const t = '我做了一袋牛肉';
  assert.equal(t.slice(...parseAte(t)[0].spans[0]), '一袋牛肉');
});

test('typed Chinese food names match the catalogue', () => {
  assert.equal(matchFood('两盒老豆腐'), 'tofu');
  assert.equal(matchFood('西红柿'), 'tomato');
  assert.equal(matchFood('洋葱'), null);
  assert.equal(matchFood('Firm tofu'), 'tofu');
});

test('switching to Chinese changes names, dates and amounts; English stays as it was', () => {
  setLang('en');
  assert.equal(foodName('tomato', 2), 'Tomatoes');
  assert.equal(dateTag({ kind: 'use_by', on: '2026-10-11' }, TODAY).text, 'Use by Sun');
  setLang('zh');
  assert.equal(lang(), 'zh');
  assert.equal(foodName('tomato', 2), '番茄');
  assert.equal(shortName('beef'), '牛肉');
  assert.equal(foodName('x-rice-bin', 1, { name: 'My own thing' }), 'My own thing');
  assert.equal(dateTag({ kind: 'use_by', on: '2026-10-11' }, TODAY).text, '食用期限 周日');
  assert.equal(dateTag({ kind: 'use_by', on: '2026-10-17' }, TODAY).text, '食用期限 10月17日');
  assert.equal(dateTag({ kind: 'best_before', on: '2027-03-31' }, TODAY).text, '最佳食用 2027年3月');
  assert.equal(dateTag({ kind: 'est', on: '2026-10-11' }, TODAY, 'card').text, '约剩 1 天');
  assert.equal(dateTag({ kind: 'est', on: '2026-10-17' }, TODAY, 'receipt').text, '约 1 周（估计）');
  assert.equal(dateTag({ kind: 'frozen', on: '2026-09-12' }, TODAY).text, '4 周');
  assert.equal(dateTag({ kind: 'none', note: 'Dry · keeps for months' }, TODAY).text, '干货 · 能放好几个月');
  assert.equal(fmtDay(TODAY), '10月10日 周六');
  assert.equal(longDay(TODAY), '10月10日 星期六');
  assert.equal(qtyText(3, 'bag'), '3 袋');
  assert.equal(amountText({ qty: 2, unit: 'L', amount: 'Half' }), '2 L · 还剩一半');
  setLang('en');
});

test('data the app made is shown in Chinese; what a user typed is shown as typed', () => {
  setLang('zh');
  assert.equal(dz('Fridge'), '冰箱');
  assert.equal(dz('Shared house · 3 people'), '合租 · 3 人');
  assert.equal(dz("Alex's household"), 'Alex 的家');
  assert.equal(dz('Rice 5 kg'), '大米 5 kg');
  assert.equal(dz('米桶旁边的箱子'), '米桶旁边的箱子');
  assert.equal(L('Add food', '添加食物'), '添加食物');
  setLang('en');
  assert.equal(dz('Fridge'), 'Fridge');
});

// Food catalogue. Names are what the app shows; aliases are what the voice parser and the
// "Type it in" box listen for (longest alias wins, so "spring onion" beats "onion").
//
// cat    meat | dairy | produce | other | nonfood -> category icon when there is no sticker
// spot   where it sits in a fridge without housemates: top | middle | crisper
// unit   pc (counted) | g | L | bag            -> counted foods show a number on the tile
// est    days it keeps when the pack has no date. OUR GUESSES, always shown "~" + dashed
//        (VISUAL-SPEC §7). Leftovers = 3 days (UQ, 2–3 days).
// group  the words used to explain an estimate: "leafy greens · bought Sat 10 Oct · in the fridge"
// tip    a storage guide shown on the food card, marked "guide"
// byWeight  meat sold by weight can be split into bags (Brief §4.7)
// room   kept at room temperature by default (cupboard)

import { isZh } from './i18n.js?v=a3e659d';

export const FOODS = {
  beef:        { name: 'Beef mince', short: 'Beef', aliases: ['beef mince', 'minced beef', 'ground beef', 'mince', 'beef'], sticker: 'beef', bag: 'beefbag', cat: 'meat', spot: 'middle', unit: 'g', byWeight: true, est: 2, group: 'fresh mince', keep: 'Mince is best used within about 3–4 months frozen.', tip: 'Thaw it in the fridge overnight, not on the bench.' },
  chicken:     { name: 'Chicken thigh', plural: 'Chicken thighs', short: 'Chicken', aliases: ['chicken thighs', 'chicken thigh', 'chicken', 'thighs', 'thigh'], sticker: 'chicken', bag: 'chickenbag', cat: 'meat', spot: 'middle', unit: 'pc', est: 2, group: 'fresh chicken', tip: 'Keep raw meat on the bottom shelf so nothing drips onto other food.' },
  pork:        { name: 'Pork shoulder', short: 'Pork', aliases: ['pork shoulder', 'pork mince', 'minced pork', 'pork'], sticker: null, bag: null, cat: 'meat', spot: 'middle', unit: 'g', byWeight: true, est: 2, group: 'fresh pork', tip: 'Thaw it in the fridge overnight, not on the bench.' },
  salmon:      { name: 'Salmon fillets', short: 'Salmon', aliases: ['salmon fillets', 'salmon fillet', 'salmon', 'fish'], cat: 'meat', spot: 'middle', unit: 'pc', est: 2, group: 'fresh fish', tip: 'Thaw it in the fridge overnight, not on the bench.' },
  dumplings:   { name: 'Dumplings', aliases: ['frozen dumplings', 'dumplings', 'dumpling'], sticker: 'dumplings', cat: 'other', spot: 'middle', unit: 'bag', tip: 'Cook them straight from frozen.' },
  peas:        { name: 'Frozen peas', short: 'Peas', aliases: ['frozen peas', 'peas'], cat: 'produce', spot: 'middle', unit: 'g', tip: 'Cook them straight from frozen.' },
  milk:        { name: 'Milk', aliases: ['full cream milk', 'milk'], sticker: 'milk', cat: 'dairy', spot: 'top', unit: 'L', est: 7, group: 'milk', tip: 'Keep it at the back of the fridge, not in the door.' },
  soymilk:     { name: 'Soy milk', aliases: ['soy milk', 'soya milk'], sticker: 'milk', cat: 'dairy', spot: 'top', unit: 'L', est: 7, group: 'soy milk' },
  oatmilk:     { name: 'Oat milk', aliases: ['oat milk'], sticker: 'milk', cat: 'dairy', spot: 'top', unit: 'L', est: 7, group: 'oat milk', tip: 'Unopened it can stay in the cupboard; keep it cold once opened.' },
  eggs:        { name: 'Eggs', one: 'Egg', aliases: ['eggs', 'egg'], sticker: 'eggs', cat: 'dairy', spot: 'top', unit: 'pc', est: 21, group: 'eggs', tip: 'Keep them in the carton.' },
  yoghurt:     { name: 'Yoghurt', aliases: ['greek yoghurt', 'greek yogurt', 'yoghurts', 'yoghurt', 'yogurts', 'yogurt'], sticker: 'yoghurt', cat: 'dairy', spot: 'top', unit: 'pc', est: 7, group: 'yoghurt', tip: 'Use a clean spoon each time.' },
  cheese:      { name: 'Cheese', aliases: ['tasty cheddar', 'cheddar', 'cheese'], sticker: 'cheese', cat: 'dairy', spot: 'top', unit: 'pc', est: 21, group: 'hard cheese', tip: 'Wrap it tightly once it is open.' },
  curry:       { name: 'Curry', aliases: ['leftover curry', 'curry', 'leftovers'], sticker: 'leftovers', cat: 'other', spot: 'middle', unit: 'pc', est: 3, leftover: true, group: 'leftovers' },
  tofu:        { name: 'Tofu', aliases: ['firm tofu', 'tofu'], sticker: 'tofu', cat: 'other', spot: 'middle', unit: 'pc', est: 5, group: 'tofu', tip: 'Once opened, keep it covered in water and change the water daily.' },
  avocado:     { name: 'Avocado', plural: 'Avocados', aliases: ['avocados', 'avocado', 'avos', 'avo'], sticker: 'avocado', cat: 'produce', spot: 'middle', unit: 'pc', est: 3, group: 'avocados' },
  lemon:       { name: 'Lemon', plural: 'Lemons', aliases: ['lemons', 'lemon'], sticker: 'lemon', cat: 'produce', spot: 'middle', unit: 'pc', est: 21, group: 'citrus' },
  spinach:     { name: 'Spinach', aliases: ['baby spinach', 'spinach'], sticker: 'spinach', cat: 'produce', spot: 'crisper', unit: 'pc', est: 4, group: 'leafy greens', tip: 'Keep it in the crisper drawer. A paper towel in the bag soaks up moisture.' },
  tomato:      { name: 'Tomato', plural: 'Tomatoes', aliases: ['tomatoes', 'tomato'], sticker: 'tomato', cat: 'produce', spot: 'crisper', unit: 'pc', est: 7, group: 'tomatoes', tip: 'Ripe tomatoes last longer in the fridge. Let them warm up before eating.' },
  carrot:      { name: 'Carrot', plural: 'Carrots', aliases: ['carrots', 'carrot'], sticker: 'carrot', cat: 'produce', spot: 'crisper', unit: 'pc', est: 21, group: 'carrots', tip: 'Keep them in the crisper drawer.' },
  broccoli:    { name: 'Broccoli', aliases: ['broccoli'], sticker: 'broccoli', cat: 'produce', spot: 'crisper', unit: 'pc', est: 5, group: 'broccoli', tip: 'Keep it unwashed in the crisper drawer.' },
  capsicum:    { name: 'Red capsicum', plural: 'Red capsicums', short: 'Capsicum', aliases: ['red capsicum', 'capsicums', 'capsicum'], cat: 'produce', spot: 'crisper', unit: 'pc', est: 7, group: 'capsicum', tip: 'Keep it whole and dry in the crisper drawer.' },
  mushrooms:   { name: 'Mushrooms', aliases: ['mushrooms', 'mushroom'], cat: 'produce', spot: 'crisper', unit: 'g', est: 4, group: 'mushrooms', tip: 'A paper bag keeps them from going slimy.' },
  springonion: { name: 'Spring onion', plural: 'Spring onions', aliases: ['spring onions', 'spring onion', 'green onions', 'green onion', 'scallions', 'scallion'], sticker: 'springonion', cat: 'produce', spot: 'crisper', unit: 'pc', est: 5, group: 'spring onions' },
  leek:        { name: 'Leek', plural: 'Leeks', aliases: ['leeks', 'leek'], cat: 'produce', spot: 'crisper', unit: 'pc', est: 7, group: 'leek' },
  strawberry:  { name: 'Strawberries', aliases: ['strawberries', 'strawberry'], sticker: 'strawberry', cat: 'produce', spot: 'crisper', unit: 'pc', est: 3, group: 'berries' },
  banana:      { name: 'Banana', plural: 'Bananas', aliases: ['bananas', 'banana'], sticker: 'banana', cat: 'produce', spot: 'middle', unit: 'pc', est: 5, room: true, group: 'bananas' },
  apple:       { name: 'Apple', plural: 'Apples', aliases: ['apples', 'apple'], sticker: 'apple', cat: 'produce', spot: 'crisper', unit: 'pc', est: 14, group: 'apples' },
  bread:       { name: 'Bread', aliases: ['bread', 'loaf', 'toast'], sticker: 'bread', cat: 'other', spot: 'middle', unit: 'pc', est: 5, room: true, group: 'bread', tip: 'Keep it sealed, somewhere cool and dry.' },
  rice:        { name: 'Rice', aliases: ['rice'], sticker: 'rice', cat: 'other', spot: 'middle', unit: 'pc', room: true, dry: true, tip: 'Put cooked rice in the fridge soon after cooking.' },
  noodles:     { name: 'Instant noodles', short: 'Noodles', aliases: ['instant noodles', 'egg noodles', 'rice noodles', 'noodles', 'ramen'], cat: 'other', spot: 'middle', unit: 'pc', room: true },
  pasta:       { name: 'Penne pasta', short: 'Pasta', aliases: ['penne pasta', 'penne', 'pasta', 'spaghetti'], cat: 'other', spot: 'middle', unit: 'pc', room: true },
  oats:        { name: 'Oats', aliases: ['rolled oats', 'oats', 'porridge'], cat: 'other', spot: 'middle', unit: 'pc', room: true },
  chickpeas:   { name: 'Chickpeas', aliases: ['chickpeas', 'chickpea'], cat: 'other', spot: 'middle', unit: 'pc', room: true },
  cannedtom:   { name: 'Diced tomatoes', aliases: ['diced tomatoes', 'canned tomatoes', 'tinned tomatoes'], cat: 'other', spot: 'middle', unit: 'pc', room: true },
  pb:          { name: 'Peanut butter', aliases: ['peanut butter'], sticker: 'pb', cat: 'other', spot: 'middle', unit: 'pc', room: true },
  yuzu:        { name: 'Yuzu tea', aliases: ['yuzu tea', 'yuzu'], sticker: 'yuzu', cat: 'other', spot: 'middle', unit: 'pc' },
  salad:       { name: 'Salad kit', aliases: ['salad kit', 'salad'], cat: 'produce', spot: 'crisper', unit: 'pc', est: 3, group: 'salad leaves' },
  papertowel:  { name: 'Paper towel', aliases: ['paper towel'], cat: 'nonfood', unit: 'pc' },
  dishliquid:  { name: 'Dishwashing liquid', aliases: ['dishwashing liquid', 'dish soap'], cat: 'nonfood', unit: 'pc' },
};

// The same catalogue in Chinese: name, short name, the words the voice reader and "Type it in"
// listen for (longest first, as in English), and the estimate / storage-tip wording.
const ZH = {
  beef:        { name: '牛肉末', short: '牛肉', aliases: ['牛肉末', '牛肉馅', '牛绞肉', '肉末', '肉馅', '牛肉'], group: '新鲜肉末', keep: '冷冻的肉末最好在 3–4 个月内吃完。', tip: '放冰箱冷藏室里过夜解冻，别放在台面上。' },
  chicken:     { name: '鸡腿肉', short: '鸡肉', aliases: ['去骨鸡腿', '鸡腿肉', '鸡腿', '鸡肉', '鸡块'], group: '新鲜鸡肉', tip: '生肉放最下层，免得汁水滴到别的食物上。' },
  pork:        { name: '猪肩肉', short: '猪肉', aliases: ['猪肩肉', '猪肉末', '猪肉馅', '猪肉'], group: '新鲜猪肉', tip: '放冰箱冷藏室里过夜解冻，别放在台面上。' },
  salmon:      { name: '三文鱼排', short: '三文鱼', aliases: ['三文鱼排', '三文鱼', '鲑鱼', '鱼排'], group: '新鲜鱼', tip: '放冰箱冷藏室里过夜解冻，别放在台面上。' },
  dumplings:   { name: '饺子', aliases: ['速冻饺子', '饺子', '水饺'], tip: '不用解冻，直接下锅。' },
  peas:        { name: '冷冻豌豆', short: '豌豆', aliases: ['冷冻豌豆', '豌豆', '青豆'], tip: '不用解冻，直接下锅。' },
  milk:        { name: '牛奶', aliases: ['全脂牛奶', '牛奶', '牛乳'], group: '牛奶', tip: '放冰箱里面，别放门上。' },
  soymilk:     { name: '豆奶', aliases: ['豆奶', '豆浆'], group: '豆奶' },
  oatmilk:     { name: '燕麦奶', aliases: ['燕麦奶'], group: '燕麦奶', tip: '没开封可以放橱柜，开封后要冷藏。' },
  eggs:        { name: '鸡蛋', aliases: ['鸡蛋', '蛋'], group: '鸡蛋', tip: '连盒子一起放。' },
  yoghurt:     { name: '酸奶', aliases: ['希腊酸奶', '酸奶', '优格'], group: '酸奶', tip: '每次用干净的勺子。' },
  cheese:      { name: '奶酪', aliases: ['切达奶酪', '切达', '奶酪', '芝士', '起司'], group: '硬奶酪', tip: '开封后包紧。' },
  curry:       { name: '咖喱', aliases: ['剩咖喱', '咖喱', '剩菜'], group: '剩菜' },
  tofu:        { name: '豆腐', aliases: ['老豆腐', '北豆腐', '豆腐'], group: '豆腐', tip: '开封后泡在水里盖好，每天换水。' },
  avocado:     { name: '牛油果', aliases: ['牛油果', '鳄梨'], group: '牛油果' },
  lemon:       { name: '柠檬', aliases: ['柠檬'], group: '柑橘' },
  spinach:     { name: '菠菜', aliases: ['嫩菠菜', '菠菜'], group: '叶菜', tip: '放果蔬抽屉。袋子里垫张厨房纸吸潮。' },
  tomato:      { name: '番茄', aliases: ['番茄', '西红柿'], group: '番茄', tip: '熟透的番茄放冰箱更耐放，吃之前回一下温。' },
  carrot:      { name: '胡萝卜', aliases: ['胡萝卜', '红萝卜'], group: '胡萝卜', tip: '放果蔬抽屉。' },
  broccoli:    { name: '西兰花', aliases: ['西兰花', '西蓝花', '花椰菜'], group: '西兰花', tip: '别洗，直接放果蔬抽屉。' },
  capsicum:    { name: '红甜椒', short: '甜椒', aliases: ['红甜椒', '红椒', '甜椒', '彩椒'], group: '甜椒', tip: '整个放、保持干燥，放果蔬抽屉。' },
  mushrooms:   { name: '蘑菇', aliases: ['蘑菇', '口蘑', '香菇'], group: '蘑菇', tip: '装纸袋里，不容易发黏。' },
  springonion: { name: '小葱', aliases: ['小葱', '香葱', '青葱', '葱花', '葱'], group: '小葱' },
  leek:        { name: '韭葱', aliases: ['韭葱', '大葱'], group: '韭葱' },
  strawberry:  { name: '草莓', aliases: ['草莓'], group: '莓果' },
  banana:      { name: '香蕉', aliases: ['香蕉'], group: '香蕉' },
  apple:       { name: '苹果', aliases: ['苹果'], group: '苹果' },
  bread:       { name: '面包', aliases: ['切片面包', '吐司', '面包'], group: '面包', tip: '封好口，放阴凉干燥处。' },
  rice:        { name: '大米', aliases: ['大米', '米饭', '白米'], tip: '煮好的米饭尽快放进冰箱。' },
  noodles:     { name: '方便面', short: '面条', aliases: ['方便面', '泡面', '鸡蛋面', '米粉', '面条', '拉面'] },
  pasta:       { name: '通心粉', short: '意面', aliases: ['通心粉', '笔管面', '意大利面', '意面'] },
  oats:        { name: '燕麦', aliases: ['燕麦片', '燕麦', '麦片'] },
  chickpeas:   { name: '鹰嘴豆', aliases: ['鹰嘴豆'] },
  cannedtom:   { name: '番茄罐头', aliases: ['番茄罐头', '罐头番茄', '切块番茄'] },
  pb:          { name: '花生酱', aliases: ['花生酱'] },
  yuzu:        { name: '柚子茶', aliases: ['柚子茶', '柚子'] },
  salad:       { name: '沙拉套装', aliases: ['沙拉套装', '沙拉'], group: '沙拉菜' },
  papertowel:  { name: '厨房纸', aliases: ['厨房纸', '纸巾'] },
  dishliquid:  { name: '洗洁精', aliases: ['洗洁精', '洗碗液'] },
};

export const CATS = ['meat', 'dairy', 'produce', 'other', 'nonfood'];

// Letters and digits in any script, so a name typed in Chinese still gets its own id.
const slug = (s) => String(s).toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');

// Food the catalogue doesn't know (typed in by hand) gets an id "x-<name>"; lots carry name + cat.
export function food(id) {
  return FOODS[id] || { name: String(id || '').replace(/^x-/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()), aliases: [], cat: 'other', spot: 'middle', unit: 'pc' };
}

// Display name for a count: "Tomatoes", "Egg", "Beef mince" (Chinese has no plurals). A lot may
// carry its own name.
export function foodName(id, n = 2, lot) {
  if (lot?.name) return lot.name;
  if (isZh() && ZH[id]) return ZH[id].name;
  const f = food(id);
  if (n === 1 && f.one) return f.one;
  if (n !== 1 && f.plural) return f.plural;
  return f.name;
}

export const shortName = (id, lot) => lot?.name || (isZh() && ZH[id] ? ZH[id].short || ZH[id].name : food(id).short || food(id).name);

// Search: the name on screen or the English one, so "milk" still finds 牛奶.
export const nameMatches = (id, lot, needle) => [foodName(id, 2, lot), lot?.name || food(id).name].some((n) => n.toLowerCase().includes(needle));

// The estimate and storage wording of a food: 'group' | 'tip' | 'keep', in the current language.
export const foodText = (id, k) => (isZh() ? ZH[id]?.[k] : FOODS[id]?.[k]) || null;

// Food that freezes well enough to save it from going off: meat, leftovers, bread.
export const canFreeze = (id) => { const f = food(id); return f.cat === 'meat' || !!f.leftover || id === 'bread'; };

// Phrases that contain a catalogue word but are something else: "chicken stock" is not chicken
// thighs, "lamb mince" is not beef mince. They match as "no food" (null), so nothing gets taken.
export const NOT_FOOD = ['chicken stock', 'beef stock', 'vegetable stock', 'stock cube', 'stock cubes', 'chicken mince', 'lamb mince', 'turkey mince', 'veal mince',
  'chicken salt', 'beef jerky', 'fish sauce', 'oyster sauce', 'tomato sauce', 'tomato paste', 'tomato soup', 'apple juice', 'orange juice', 'apple cider',
  'milk chocolate', 'chocolate milk', 'banana bread', 'rice paper', 'rice cooker', 'rice wine', 'rice vinegar', 'egg cup', 'peanut oil', 'cheese sauce'];

// The same in Chinese: soy sauce chicken is still chicken, but "番茄酱" is not tomatoes.
export const NOT_FOOD_ZH = ['鸡精', '鸡汤块', '牛肉干', '牛肉酱', '鱼露', '蚝油', '番茄酱', '番茄汁', '番茄汤', '番茄沙司', '西红柿酱', '苹果汁', '苹果醋', '橙汁',
  '牛奶巧克力', '巧克力牛奶', '香蕉面包', '面包糠', '米酒', '米醋', '电饭煲', '花生油', '蛋糕', '蛋挞', '蛋黄酱', '洋葱', '豆腐乳', '腐乳', '草莓酱', '柠檬茶', '柠檬水'];

export const hasCjk = (s) => /[㐀-鿿]/.test(String(s));

// Match free text ("2 firm tofu", "Spring onions", "两盒老豆腐") to a catalogue id, longest alias first.
const ALIASES = [...Object.entries(FOODS).flatMap(([id, f]) => f.aliases.map((a) => [a, id])), ...NOT_FOOD.map((a) => [a, null])].sort((a, b) => b[0].length - a[0].length);
export const ALIASES_ZH = [...Object.entries(ZH).flatMap(([id, f]) => f.aliases.map((a) => [a, id])), ...NOT_FOOD_ZH.map((a) => [a, null])].sort((a, b) => b[0].length - a[0].length);
export function matchFood(text) {
  if (hasCjk(text)) {
    const t = String(text);
    for (const [a, id] of ALIASES_ZH) if (t.includes(a)) return id;
  }
  const t = ` ${String(text).toLowerCase()} `;
  for (const [a, id] of ALIASES) if (t.includes(` ${a} `) || t.includes(` ${a},`) || t.includes(` ${a}.`)) return id;
  return null;
}
export const customId = (name) => `x-${slug(name)}`;

// Days to show when nothing on the pack says otherwise. Always shown as "~ … (our guess)".
const GUESS = { meat: 2, dairy: 7, produce: 5, other: 7, nonfood: null };
export const guessDays = (id) => food(id).est ?? GUESS[food(id).cat];

// What one tap on a "Usual" item adds before the user adjusts it.
export function defaultQty(id) {
  const u = food(id).unit;
  return u === 'g' ? { qty: 500, unit: 'g' } : u === 'L' ? { qty: 2, unit: 'L' } : { qty: 1, unit: u };
}

export function stickerUrl(name) {
  return `../assets/stickers/${name}.svg`;
}

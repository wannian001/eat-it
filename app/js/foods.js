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

export const CATS = ['meat', 'dairy', 'produce', 'other', 'nonfood'];

const slug = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Food the catalogue doesn't know (typed in by hand) gets an id "x-<name>"; lots carry name + cat.
export function food(id) {
  return FOODS[id] || { name: String(id || '').replace(/^x-/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()), aliases: [], cat: 'other', spot: 'middle', unit: 'pc' };
}

// Display name for a count: "Tomatoes", "Egg", "Beef mince". A lot may carry its own name.
export function foodName(id, n = 2, lot) {
  if (lot?.name) return lot.name;
  const f = food(id);
  if (n === 1 && f.one) return f.one;
  if (n !== 1 && f.plural) return f.plural;
  return f.name;
}

export const shortName = (id, lot) => lot?.name || food(id).short || food(id).name;

// Food that freezes well enough to save it from going off: meat, leftovers, bread.
export const canFreeze = (id) => { const f = food(id); return f.cat === 'meat' || !!f.leftover || id === 'bread'; };

// Phrases that contain a catalogue word but are something else: "chicken stock" is not chicken
// thighs, "lamb mince" is not beef mince. They match as "no food" (null), so nothing gets taken.
export const NOT_FOOD = ['chicken stock', 'beef stock', 'vegetable stock', 'stock cube', 'stock cubes', 'chicken mince', 'lamb mince', 'turkey mince', 'veal mince',
  'chicken salt', 'beef jerky', 'fish sauce', 'oyster sauce', 'tomato sauce', 'tomato paste', 'tomato soup', 'apple juice', 'orange juice', 'apple cider',
  'milk chocolate', 'chocolate milk', 'banana bread', 'rice paper', 'rice cooker', 'rice wine', 'rice vinegar', 'egg cup', 'peanut oil', 'cheese sauce'];

// Match free text ("2 firm tofu", "Spring onions") to a catalogue id, longest alias first.
const ALIASES = [...Object.entries(FOODS).flatMap(([id, f]) => f.aliases.map((a) => [a, id])), ...NOT_FOOD.map((a) => [a, null])].sort((a, b) => b[0].length - a[0].length);
export function matchFood(text) {
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

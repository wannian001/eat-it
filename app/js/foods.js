// Food catalogue. Names are what the app shows; aliases are what the voice parser listens for
// (longest alias wins, so "spring onion" beats "onion").
//
// cat   meat | dairy | produce | other  -> category icon when there is no sticker (VISUAL-SPEC §5)
// spot  where it goes by default in a fridge without housemates: top | middle | crisper
// unit  pc (counted) | g | L | bag     -> counted foods show a number on the tile
// est   days it keeps when the pack has no date. These are OUR GUESSES and the app always
//       labels them "~" + dashed (VISUAL-SPEC §7). Leftovers = 3 days (UQ, 2–3 days).
// byWeight  meat sold by weight can be split into bags (Brief §4.7)

export const FOODS = {
  beef:        { name: 'Beef mince', short: 'Beef', aliases: ['beef mince', 'minced beef', 'ground beef', 'mince', 'beef'], sticker: 'beef', bag: 'beefbag', cat: 'meat', spot: 'middle', unit: 'g', byWeight: true },
  chicken:     { name: 'Chicken thigh', plural: 'Chicken thighs', short: 'Chicken', aliases: ['chicken thighs', 'chicken thigh', 'chicken', 'thighs', 'thigh'], sticker: 'chicken', bag: 'chickenbag', cat: 'meat', spot: 'middle', unit: 'pc' },
  dumplings:   { name: 'Dumplings', aliases: ['dumplings', 'dumpling'], sticker: 'dumplings', cat: 'other', spot: 'middle', unit: 'bag' },
  milk:        { name: 'Milk', aliases: ['milk'], sticker: 'milk', cat: 'dairy', spot: 'top', unit: 'L' },
  eggs:        { name: 'Eggs', one: 'Egg', aliases: ['eggs', 'egg'], sticker: 'eggs', cat: 'dairy', spot: 'top', unit: 'pc' },
  yoghurt:     { name: 'Yoghurt', aliases: ['yoghurts', 'yoghurt', 'yogurts', 'yogurt'], sticker: 'yoghurt', cat: 'dairy', spot: 'top', unit: 'pc' },
  cheese:      { name: 'Cheese', aliases: ['cheese'], sticker: 'cheese', cat: 'dairy', spot: 'top', unit: 'pc' },
  curry:       { name: 'Curry', aliases: ['leftover curry', 'curry', 'leftovers'], sticker: 'leftovers', cat: 'other', spot: 'middle', unit: 'pc', est: 3, leftover: true },
  tofu:        { name: 'Tofu', aliases: ['tofu'], sticker: 'tofu', cat: 'other', spot: 'middle', unit: 'pc' },
  avocado:     { name: 'Avocado', plural: 'Avocados', aliases: ['avocados', 'avocado', 'avos', 'avo'], sticker: 'avocado', cat: 'produce', spot: 'middle', unit: 'pc', est: 3 },
  lemon:       { name: 'Lemon', plural: 'Lemons', aliases: ['lemons', 'lemon'], sticker: 'lemon', cat: 'produce', spot: 'middle', unit: 'pc', est: 21 },
  spinach:     { name: 'Spinach', aliases: ['baby spinach', 'spinach'], sticker: 'spinach', cat: 'produce', spot: 'crisper', unit: 'pc', est: 4 },
  tomato:      { name: 'Tomato', plural: 'Tomatoes', aliases: ['tomatoes', 'tomato'], sticker: 'tomato', cat: 'produce', spot: 'crisper', unit: 'pc', est: 7 },
  carrot:      { name: 'Carrot', plural: 'Carrots', aliases: ['carrots', 'carrot'], sticker: 'carrot', cat: 'produce', spot: 'crisper', unit: 'pc', est: 21 },
  broccoli:    { name: 'Broccoli', aliases: ['broccoli'], sticker: 'broccoli', cat: 'produce', spot: 'crisper', unit: 'pc', est: 5 },
  springonion: { name: 'Spring onion', plural: 'Spring onions', aliases: ['spring onions', 'spring onion', 'green onions', 'green onion', 'scallions', 'scallion'], sticker: 'springonion', cat: 'produce', spot: 'crisper', unit: 'pc', est: 5 },
  leek:        { name: 'Leek', plural: 'Leeks', aliases: ['leeks', 'leek'], cat: 'produce', spot: 'crisper', unit: 'pc', est: 7 },
  strawberry:  { name: 'Strawberries', aliases: ['strawberries', 'strawberry'], sticker: 'strawberry', cat: 'produce', spot: 'crisper', unit: 'pc', est: 3 },
  banana:      { name: 'Banana', plural: 'Bananas', aliases: ['bananas', 'banana'], sticker: 'banana', cat: 'produce', spot: 'middle', unit: 'pc', est: 5 },
  apple:       { name: 'Apple', plural: 'Apples', aliases: ['apples', 'apple'], sticker: 'apple', cat: 'produce', spot: 'crisper', unit: 'pc', est: 14 },
  bread:       { name: 'Bread', aliases: ['bread', 'toast'], sticker: 'bread', cat: 'other', spot: 'middle', unit: 'pc' },
  rice:        { name: 'Rice', aliases: ['rice'], sticker: 'rice', cat: 'other', spot: 'middle', unit: 'pc', est: 2, leftover: true },
  pb:          { name: 'Peanut butter', aliases: ['peanut butter'], sticker: 'pb', cat: 'other', spot: 'middle', unit: 'pc' },
  yuzu:        { name: 'Yuzu tea', aliases: ['yuzu tea', 'yuzu'], sticker: 'yuzu', cat: 'other', spot: 'middle', unit: 'pc' },
};

export const CATS = ['meat', 'dairy', 'produce', 'other'];
export const CAT_NAMES = { meat: 'Meat', dairy: 'Dairy', produce: 'Fruit & veg', other: 'Other' };

export function food(id) {
  return FOODS[id] || { name: id, aliases: [], cat: 'other', spot: 'middle', unit: 'pc' };
}

// Display name for a count: "Tomatoes", "Egg", "Beef mince".
export function foodName(id, n = 2) {
  const f = food(id);
  if (n === 1 && f.one) return f.one;
  if (n !== 1 && f.plural) return f.plural;
  return f.name;
}

// Days to show when nothing on the pack says otherwise. Always shown as "~ … (our guess)".
const GUESS = { meat: 2, dairy: 7, produce: 5, other: 7 };
export const guessDays = (id) => food(id).est ?? GUESS[food(id).cat];

// What one tap on a "Usual" item adds before the user adjusts it.
export function defaultQty(id) {
  const u = food(id).unit;
  return u === 'g' ? { qty: 500, unit: 'g' } : u === 'L' ? { qty: 2, unit: 'L' } : { qty: 1, unit: u };
}

export function stickerUrl(name) {
  return `../assets/stickers/${name}.svg`;
}

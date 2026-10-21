// Two languages: English (the course version) and Chinese. Every piece of screen text is written
// as L('English', '中文') where it is used, so both stay side by side and nothing is missed.
//
// Which language: ?lang=zh / ?lang=en in the address (a portfolio link can pick one), else the
// last choice on this device, else the browser's language (Chinese browsers get Chinese).
//
// Data is stored in English (place names, the shared house, seed shopping items …) and shown
// through dz(), which translates the names the app itself made; anything a user typed is shown
// as typed. So switching language also switches John's and May's fridges.

const KEY = 'eatit:pref:lang';
const ok = (l) => (l === 'zh' || l === 'en' ? l : null);

function fromUrl() {
  try { return ok(new URLSearchParams(globalThis.location?.search || '').get('lang')); } catch { return null; }
}
function saved() {
  try { return ok(JSON.parse(globalThis.localStorage?.getItem(KEY) ?? 'null')); } catch { return null; }
}
function browser() {
  const l = globalThis.navigator?.language || '';
  return /^zh/i.test(l) ? 'zh' : null;
}

let current = fromUrl() || saved() || browser() || 'en';

export const lang = () => current;
export const isZh = () => current === 'zh';
export const L = (en, zh) => (current === 'zh' ? zh : en);

export function setLang(l) {
  current = ok(l) || 'en';
  try { globalThis.localStorage?.setItem(KEY, JSON.stringify(current)); } catch { /* storage blocked */ }
  // Keep the address in step, so a reload (or a copied link) opens the same language.
  try {
    const u = new URL(globalThis.location.href);
    if (u.searchParams.has('lang')) { u.searchParams.set('lang', current); history.replaceState(null, '', u); }
  } catch { /* not in a browser */ }
  syncDocument();
}

export function syncDocument() {
  if (globalThis.document?.documentElement) document.documentElement.lang = current === 'zh' ? 'zh-CN' : 'en-AU';
}

// Speech recognition language for "I ate".
export const speechLang = () => (current === 'zh' ? 'zh-CN' : 'en-AU');

// Names the app made itself, in the data. Exact matches only.
const DATA = {
  // places and their notes
  Fridge: '冰箱', Freezer: '冷冻室', Cupboard: '橱柜', 'Second fridge': '第二台冰箱', 'Mini fridge': '小冰箱',
  'Chest freezer': '卧式冰柜', 'Rice bin': '米桶', 'Box under the bed': '床底收纳箱', Balcony: '阳台',
  'all yours': '全归你', '3 drawers': '3 个抽屉', 'your shelf + shared': '你的一层 + 公共层', 'your half shelf': '你的半层',
  // households
  'Shared house · 3 people': '合租 · 3 人', 'Shared house': '合租的家', 'Lives alone': '一个人住',
  // May's fridge shelves
  'Top shelf': '顶层', 'Shared shelf': '公共层', 'My shelf': '我的一层', Crisper: '果蔬抽屉', 'Lily & Sam': 'Lily 和 Sam', Everyone: '所有人',
  // shopping list and suggestions
  Eggs: '鸡蛋', Bananas: '香蕉', Oats: '燕麦', 'Rice 5 kg': '大米 5 kg', 'Milk 2 L': '牛奶 2 L', Bread: '面包', 'Cooking oil': '食用油',
  'Beef mince 2 kg, bulk deal': '牛肉末 2 kg，大包装特价', Broccoli: '西兰花', 'Salad kit, family size': '沙拉套装，家庭装',
  'Salad kit, single serve': '沙拉套装，单人份', 'Shared rice is running low': '公共的米快没了',
  // dates with no day
  'Dry · keeps for months': '干货 · 能放好几个月',
  // email receipts
  'Online supermarket': '网上超市', 'Your order has been delivered': '你的订单已送达',
  'Online supermarket orders': '网上超市订单', 'In-store e-receipts': '门店电子小票', 'Meal-kit and delivery apps': '净菜和外卖 App',
};

export function dz(s) {
  if (current !== 'zh' || s == null) return s ?? '';
  const t = String(s);
  if (Object.hasOwn(DATA, t)) return DATA[t];
  const own = t.match(/^(.+)'s household$/);
  if (own) return `${own[1]} 的家`;
  return t;
}

// "Full / Most / Half / Low": how much of a pack is left.
const AMOUNT = { Full: ['Full', '满的'], Most: ['Most', '大半'], Half: ['Half', '一半'], Low: ['Low', '快没了'] };
export const amountWord = (a) => (AMOUNT[a] ? L(...AMOUNT[a]) : a);

// "Lily and Sam" / "Lily 和 Sam"; three or more: "A, B and C" / "A、B 和 C".
export function andList(xs) {
  const a = xs.filter(Boolean);
  if (a.length < 2) return a.join('');
  return isZh() ? `${a.slice(0, -1).join('、')} 和 ${a[a.length - 1]}` : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
}

// English plural helper: n thing(s).
export const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many);

syncDocument();

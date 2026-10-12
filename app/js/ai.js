// Understanding "what I cooked today". By default the built-in rule-based reader (parse.js) does it,
// offline. If CONFIG.ai names a server (e.g. an AI in the owner's own system), the sentence and the
// food at home go there instead:
//
//   POST {ai}  { text, stock: [{ food, name }] }  ->  { items: [{ food, qty?, unit?, part?, exact? }] }
//
// Whatever comes back is checked against the food at home; if the server fails or answers nonsense,
// the built-in reader is used, so the screen never gets stuck.
import { CONFIG } from './config.js';
import { parseAte } from './parse.js';

const clean = (items, known) => (Array.isArray(items) ? items : [])
  .filter((it) => it && typeof it.food === 'string' && known.has(it.food))
  .map((it) => ({
    food: it.food,
    qty: Number.isFinite(+it.qty) && +it.qty > 0 ? +it.qty : 1,
    unit: it.unit === 'bag' || it.unit === 'pc' ? it.unit : null,
    part: !!it.part,
    exact: !!it.exact && !it.part,
    spans: [],
  }));

export async function understand(text, stock, { endpoint = CONFIG.ai, fetchImpl = globalThis.fetch } = {}) {
  if (endpoint) {
    try {
      const r = await fetchImpl(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, stock }) });
      if (r.ok) {
        const items = clean((await r.json()).items, new Set(stock.map((x) => x.food)));
        if (items.length) return { items, by: 'server' };
      }
    } catch (err) { console.warn('[eatit] AI server failed, using the built-in reader', err); }
  }
  return { items: parseAte(text), by: 'local' };
}

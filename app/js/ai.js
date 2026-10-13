// Understanding "what I cooked today". By default the built-in rule-based reader (parse.js) does it,
// offline. If CONFIG.ai names a server (e.g. an AI in the owner's own system), the sentence and the
// food at home go there instead:
//
//   POST {ai}  { text, stock: [{ food, name }] }  ->  { items: [{ food, qty?, unit?, part?, exact? }] }
//
// Whatever comes back is checked against the food at home; if the server fails or answers nonsense,
// the built-in reader is used, so the screen never gets stuck.

import { CONFIG } from './config.js?v=1d4b465';
import { parseAte, mergeItems } from './parse.js?v=1d4b465';

// Only a positive number in a unit the app knows (none, bag, pc) counts as exact; anything else
// (500 g, −3, "lots") becomes a question about how much is left instead of taking food.
const clean = (items, known) => mergeItems((Array.isArray(items) ? items : [])
  .filter((it) => it && typeof it.food === 'string' && known.has(it.food))
  .map((it) => {
    const n = typeof it.qty === 'number' ? it.qty : NaN;
    const unitOk = it.unit == null || it.unit === 'bag' || it.unit === 'pc';
    const exact = !!it.exact && !it.part && unitOk && Number.isFinite(n) && n > 0;
    return { food: it.food, qty: exact ? n : 1, unit: exact ? it.unit ?? null : null, part: !!it.part || !exact, exact, spans: [] };
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

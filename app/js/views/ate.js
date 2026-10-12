// Board 04: "What did you eat?" -> live transcript -> "Got it" with what comes out of the fridge.
import { food, foodName, shortName } from '../foods.js';
import { countOf, frozenLots } from '../state.js';
import { parseAte } from '../parse.js';
import { ICON } from '../icons.js';
import { esc, pic } from '../ui.js';

function transcriptHtml(text) {
  const items = parseAte(text);
  const spans = items.flatMap((it) => it.spans.map(([a, b]) => ({ a, b, food: it.food, bag: it.unit === 'bag' }))).sort((x, y) => x.a - y.a);
  let html = '', at = 0;
  for (const s of spans) {
    html += esc(text.slice(at, s.a));
    html += `<span class="said-pic">${pic(s.food, { bag: s.bag, size: 28 })}</span><mark>${esc(text.slice(s.a, s.b))}</mark>`;
    at = s.b;
  }
  return html + esc(text.slice(at));
}

const wave = () => `<span class="wave" aria-hidden="true">${Array.from({ length: 13 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</span>`;

// What the sentence would take out, worked out on a copy of the fridge so nothing changes until Done.
export function ateResult(store, text) {
  const items = parseAte(text);
  const event = store.make({ type: 'ate', items: items.map(({ food: f, qty, unit, part }) => ({ food: f, qty, unit, part })) });
  const after = store.preview(event);
  const rows = items.map((it) => {
    const before = countOf(store.state, it.food);
    const left = countOf(after, it.food);
    return { ...it, before, left, delta: left - before };
  });
  // "Beef left 4": only for food in the freezer, which is the part people can't see.
  const frozen = new Set(frozenLots(after).map((l) => l.food));
  return { event, rows, leftRows: rows.filter((r) => frozen.has(r.food) && r.before > 0) };
}

function inner(app) {
  const a = app.ui.ate;
  const close = `<button class="round light" data-act="go" data-arg="home" aria-label="Close">${ICON.close({ size: 18 })}</button>`;
  if (a.phase === 'done') {
    const { rows, leftRows } = a.result;
    const tiles = rows.map((r) => {
      const badge = r.before === 0 ? '0' : r.part && r.delta === 0 ? 'some' : `−${-r.delta}`;
      const sr = r.before === 0 ? `${foodName(r.food, 1)}, not in your fridge` : r.part && r.delta === 0 ? `Used some ${foodName(r.food, 2)}` : `${foodName(r.food, -r.delta)}, minus ${-r.delta}`;
      return `<span class="got-tile${r.before === 0 ? ' missing' : ''}" role="img" aria-label="${esc(sr)}">${pic(r.food, { bag: r.unit === 'bag', size: 50 })}<span class="got-badge">${esc(badge)}</span></span>`;
    }).join('');
    return `<div class="screen ate">
      <header class="cam-top">${close}</header>
      <main class="scroll ate-body">
        <h1 class="display left">${rows.length ? 'Got it' : "Didn't catch any food"}</h1>
        ${rows.length ? `<div class="got-tiles">${tiles}</div>` : '<p class="muted">Try naming the food, like "two eggs and some spinach".</p>'}
        ${leftRows.map((r) => `<div class="left-row">${pic(r.food, { bag: true, size: 28 })}<span>${esc(shortName(r.food))} left</span><b>${r.left}</b></div>`).join('')}
      </main>
      <div class="dock col">
        ${rows.length ? '<button class="btn btn-primary wide" data-act="ate-done">Done</button>' : ''}
        <button class="btn btn-secondary wide" data-act="listen">Say it again</button>
      </div>
    </div>`;
  }
  if (a.phase === 'listening') {
    return `<div class="screen ate">
      <header class="cam-top">${close}</header>
      <main class="scroll ate-body"><p class="said" aria-live="polite">${a.text ? transcriptHtml(a.text) : '<span class="said-wait">Listening…</span>'}</p></main>
      <div class="dock col center">${wave()}<button class="mic stop" data-act="stop" aria-label="Stop">${ICON.stop()}</button></div>
    </div>`;
  }
  const note = a.phase === 'nosupport' ? '<p class="ate-note">Voice isn\'t available in this browser. Tap food on the fridge and choose Used it instead.</p>' : '';
  return `<div class="screen ate">
    <header class="cam-top">${close}</header>
    <main class="scroll ate-body center">
      <h1 class="display">What did<br>you eat?</h1>
      <button class="mic" data-act="listen" aria-label="Start talking">${ICON.mic({ size: 30, stroke: 2.2 })}</button>
      ${note}
    </main>
  </div>`;
}

export function atePage(app) {
  return `<div class="phone-only fill">${inner(app)}</div><div class="desk-only device-stage">${inner(app)}</div>`;
}

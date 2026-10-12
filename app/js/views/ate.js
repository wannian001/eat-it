// Board 04, extended: say what you cooked today -> AI reads it -> for anything you didn't give a
// number for, it asks "After today, is there any curry left?" (plenty / a little / all gone)
// -> "Got it" with what comes out of the fridge -> Done.

import { food, foodName, shortName } from '../foods.js';
import { longDay } from '../dates.js';
import { countOf, frozenLots, lotsOf } from '../state.js';
import { parseAte } from '../parse.js';
import { ICON } from '../icons.js';
import { esc, pic, aiBadge } from '../ui.js';

export const LEFT = { plenty: 'Plenty left', little: 'A little left', none: 'All gone' };
const LEVEL = { plenty: 3, little: 1, none: 0 };

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
const level = (n) => `<span class="lvl" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;

// Which foods need a question: at home, and no number was said for them. "A packet of eggs" when
// the eggs are one carton of 8 (not bags) is asked about too, rather than taking the whole carton.
function needsAsk(s, it) {
  const lots = lotsOf(s, it.food);
  if (!lots.length) return false;
  if (!it.exact) return true;
  return it.unit === 'bag' && !lots.some((l) => l.bag) && lots.some((l) => l.unit === 'pc' && l.qty > 1);
}
export function questionsFor(store, items) {
  const seen = new Set();
  return items.filter((it) => needsAsk(store.state, it) && !seen.has(it.food) && seen.add(it.food))
    .map((it) => ({ food: it.food, lot: lotsOf(store.state, it.food)[0] }));
}

// The "ate" event and the summary rows, worked out on a copy of the fridge so nothing changes until Done.
export function ateResult(store, items, answers = {}, day = null) {
  const event = store.make({
    type: 'ate',
    day: day || store.today,
    items: items.map(({ food, qty, unit, part, exact }) => (answers[food] ? { food, left: answers[food] } : { food, qty, unit, part: part || !exact })),
  });
  const after = store.preview(event);
  const rows = items.map((it) => {
    const before = countOf(store.state, it.food);
    const left = countOf(after, it.food);
    return { ...it, before, left, delta: left - before, answer: answers[it.food] || null };
  });
  // "Beef left 4": only for food in the freezer, which is the part people can't see.
  const frozen = new Set(frozenLots(after).map((l) => l.food));
  return { event, rows, leftRows: rows.filter((r) => frozen.has(r.food) && r.before > 0) };
}

function inner(app) {
  const a = app.ui.ate;
  const close = `<button class="round light" data-act="ate-close" aria-label="Close">${ICON.close({ size: 18 })}</button>`;

  if (a.phase === 'thinking') {
    return `<div class="screen ate">
      <header class="cam-top">${close}</header>
      <main class="scroll ate-body center"><p class="said">${transcriptHtml(a.text)}</p><p class="thinking">${aiBadge}Working out what you used…</p></main>
    </div>`;
  }

  if (a.phase === 'ask') {
    const q = a.questions[a.step];
    const name = foodName(q.food, 2, q.lot).toLowerCase();
    // "is there any curry" but "are there any mushrooms"
    const are = !!food(q.food).plural || /s$/.test(name);
    return `<div class="screen ate">
      <header class="cam-top">${close}<span class="ask-step">${a.step + 1} / ${a.questions.length}</span></header>
      <main class="scroll ate-body">
        <p class="ask-kicker">${aiBadge}One quick question</p>
        <span class="ask-pic">${pic(q.food, { bag: q.lot?.bag, size: 84, lot: q.lot })}</span>
        <h1 class="display left">After ${a.day ? 'that' : 'today'}, ${are ? 'are' : 'is'} there any ${esc(name)} left?</h1>
        <p class="muted">How much?</p>
        <div class="ask-opts" role="group" aria-label="How much ${esc(name)} is left">
          ${Object.entries(LEFT).map(([k, t]) => `<button class="ask-opt${a.answers[q.food] === k ? ' on' : ''}" data-act="ate-answer" data-arg="${k}">${level(LEVEL[k])}<span>${t}</span></button>`).join('')}
        </div>
      </main>
      <div class="dock"><button class="btn btn-quiet" data-act="ate-back">${ICON.back({ size: 16 })}${a.step ? 'Back' : 'Say it again'}</button></div>
    </div>`;
  }

  if (a.phase === 'done') {
    const { rows, leftRows } = a.result;
    const tiles = rows.map((r) => {
      const badge = r.before === 0 ? '0' : r.answer === 'none' ? 'gone' : r.answer ? (r.answer === 'little' ? 'a little' : 'plenty') : r.part && r.delta === 0 ? 'some' : `−${-r.delta}`;
      const sr = r.before === 0 ? `${foodName(r.food, 1)}, not in your fridge` : r.answer ? `${foodName(r.food, 2)}, ${LEFT[r.answer].toLowerCase()}` : `${foodName(r.food, -r.delta || 1)}, minus ${-r.delta}`;
      return `<span class="got-tile${r.before === 0 ? ' missing' : ''}${r.answer ? ` got-${r.answer}` : ''}" role="img" aria-label="${esc(sr)}">${pic(r.food, { bag: r.unit === 'bag', size: 50 })}<span class="got-badge">${esc(badge)}</span></span>`;
    }).join('');
    return `<div class="screen ate">
      <header class="cam-top">${close}</header>
      <main class="scroll ate-body">
        <h1 class="display left">${rows.length ? 'Got it' : "Didn't catch any food"}</h1>
        ${rows.length ? `<div class="got-tiles">${tiles}</div>` : '<p class="muted">Try naming the food, like "two eggs and some spinach".</p>'}
        ${leftRows.map((r) => `<div class="left-row">${pic(r.food, { bag: true, size: 28 })}<span>${esc(shortName(r.food))} left</span><b>${r.left}</b></div>`).join('')}
        ${rows.filter((r) => r.answer).map((r) => `<div class="left-row">${pic(r.food, { size: 28 })}<span>${esc(foodName(r.food, 2))}</span>${level(LEVEL[r.answer])}<small>${esc(LEFT[r.answer])}</small></div>`).join('')}
      </main>
      <div class="dock col">
        ${rows.length ? '<button class="btn btn-primary wide" data-act="ate-done">Done</button>' : ''}
        <button class="btn btn-secondary wide" data-act="listen">Say it again</button>
        ${rows.length ? '' : '<button class="link" data-act="ate-type-again">Type it instead</button>'}
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

  const note = a.phase === 'nosupport' ? '<p class="ate-note">Voice isn\'t available here, so type it instead.</p>' : '';
  const typed = a.typing
    ? `<div class="ate-type"><input id="ate-text" type="text" placeholder="e.g. made curry with two chicken thighs" autocomplete="off" aria-label="What you ate" data-enter="ate-typed"><button class="btn btn-primary sm" data-act="ate-typed">Go</button></div>`
    : '<button class="link" data-act="ate-type">Or type it</button>';
  return `<div class="screen ate">
    <header class="cam-top">${close}</header>
    <main class="scroll ate-body center">
      <h1 class="display">What did you<br>eat ${a.day ? `on ${esc(longDay(a.day).split(' ')[0])}` : 'today'}?</h1>
      <p class="ate-hint">Tell it like you'd tell a friend: what you cooked and what went in.</p>
      <button class="mic" data-act="listen" aria-label="Start talking">${ICON.mic({ size: 30, stroke: 2.2 })}</button>
      ${note}${typed}
    </main>
  </div>`;
}

export function atePage(app) {
  return `<div class="phone-only fill">${inner(app)}</div><div class="desk-only device-stage">${inner(app)}</div>`;
}

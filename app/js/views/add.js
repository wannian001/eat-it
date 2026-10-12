// Board 03: snap a photo or receipt -> "New food" list -> Put it all in.
// The scanner is not real yet: John and May get their demo lines, "You" adds food by tapping.
import { FOODS, CATS, food, foodName, guessDays, defaultQty } from '../foods.js';
import { lastSplit, usual } from '../state.js';
import { receiptDay, addDays, dateTag } from '../dates.js';
import { spotFor } from '../seed.js';
import { ICON, CAT_ICON } from '../icons.js';
import { esc, pic, qtyText } from '../ui.js';

let seq = 0;
const key = () => `l${++seq}`;

export function usualFoods(app) {
  const p = app.store.persona;
  return p.usual || usual(app.store.state);
}

function boxSize(i) {
  return i < 2 ? 'lg' : i < 4 ? 'md' : 'sm';
}

export function addScreen(app) {
  const { store, ui } = app;
  const p = store.persona;
  const a = ui.add;
  const scan = p.scan || [];
  const n = scan.length + a.picks.length;
  const hint = p.scan ? (a.mode === 'receipt' ? 'Real receipt goes here' : 'Real photo goes here') : 'Scanner not connected';
  const boxes = scan.map((l, i) => `
    <span class="box box-${boxSize(i)}${l.unsure ? ' box-unsure' : ''}">
      ${pic(l.food, { size: i < 2 ? 76 : 58 })}${l.unsure ? '<span class="q" aria-hidden="true">?</span>' : ''}
    </span>`).join('');
  return `<div class="screen cam${a.scanning ? ' scanning' : ''}">
    <header class="cam-top">
      <button class="round light" data-act="go" data-arg="home" aria-label="Close">${ICON.close({ size: 18 })}</button>
      <span class="cam-hint">${esc(hint)}</span>
      <span class="cam-count" aria-label="${n} items">${n}</span>
    </header>
    <div class="cam-view">
      ${p.scan
        ? `<div class="boxes" aria-hidden="true">${boxes}</div><span class="scanline"></span>`
        // No scanner connected: tap what you bought instead.
        : `<div class="cam-pick" role="group" aria-label="Food">${pickable().map((f) => `<button class="usual-b${a.picks.includes(f) ? ' on' : ''}" data-act="usual" data-arg="${esc(f)}" aria-pressed="${a.picks.includes(f)}" aria-label="${esc(foodName(f, 1))}">${pic(f, { size: 34 })}</button>`).join('')}</div>`}
    </div>
    <div class="cam-bottom">
      <div class="usual" role="group" aria-label="Usual">
        <span class="usual-l">Usual</span>
        ${usualFoods(app).map((f) => `<button class="usual-b${a.picks.includes(f) ? ' on' : ''}" data-act="usual" data-arg="${esc(f)}" aria-pressed="${a.picks.includes(f)}" aria-label="${esc(foodName(f, 1))}">${pic(f, { size: 30 })}</button>`).join('')}
      </div>
      <div class="mode" role="group" aria-label="Scan">
        <button class="${a.mode === 'photo' ? 'on' : ''}" data-act="mode" data-arg="photo" aria-pressed="${a.mode === 'photo'}">Photo</button>
        <button class="${a.mode === 'receipt' ? 'on' : ''}" data-act="mode" data-arg="receipt" aria-pressed="${a.mode === 'receipt'}">Receipt</button>
      </div>
      <button class="shutter" data-act="shoot" aria-label="${p.scan ? 'Scan' : 'Next'}"></button>
    </div>
  </div>`;
}

// Lines the review screen starts with: scanned lines, then one-tap "Usual" picks.
export function buildLines(app) {
  const { store, ui } = app;
  const p = store.persona;
  const lines = (p.scan || []).map((l) => ({ ...l, date: l.date ? { ...l.date } : null }));
  for (const f of ui.add.picks) lines.push({ food: f, ...defaultQty(f), date: { kind: 'est', days: guessDays(f) } });
  return lines.map((l) => newLine(app, l));
}

export function newLine(app, l) {
  const { store } = app;
  const p = store.persona;
  const splittable = !!(food(l.food).byWeight && p.freezer);
  return {
    key: key(), food: l.food, qty: l.qty ?? 1, unit: l.unit || food(l.food).unit, date: l.date || { kind: 'est', days: guessDays(l.food) },
    unsure: l.unsure || null, answer: null, owner: 'me',
    splittable, bags: splittable ? (lastSplit(store.state, l.food) || 1) : 1,
  };
}

const sortByCat = (lines) => [...lines].sort((a, b) => CATS.indexOf(food(a.food).cat) - CATS.indexOf(food(b.food).cat));

// A review line's date as the replay will see it, for showing "Use by 17 Oct" / "~1 week (our guess)".
function shownDate(line, today) {
  const d = line.date;
  return d.on ? d : { kind: d.kind, on: addDays(today, d.days) };
}

function splitRow(app, line) {
  const last = lastSplit(app.store.state, line.food);
  const opts = [...new Set([1, 2, last || 4])];
  if (!opts.includes(line.bags)) opts.push(line.bags);
  return `<div class="rsplit">
    <span class="rsplit-l">${last ? `${last} bags, like last time` : 'Split into bags?'}</span>
    <span class="chips">${opts.map((o) => `<button class="chip${line.bags === o ? ' on' : ''}" data-act="bags" data-arg="${line.key}|${o}" aria-pressed="${line.bags === o}">${o === 1 ? 'Whole' : o}</button>`).join('')}<button class="chip" data-act="bags" data-arg="${line.key}|+" aria-label="More bags">${ICON.plus({ size: 14, stroke: 2.4 })}</button></span>
  </div>`;
}

function lineHtml(app, line, first) {
  const { store, ui } = app;
  const today = store.today;
  const f = line.answer || line.food;
  const d = shownDate(line, today);
  const t = dateTag(d, today, 'receipt');
  const editing = ui.add.edit === line.key;
  const dateEl = line.date.kind === 'est'
    ? (editing
      ? `<span class="stepper sm"><button class="step" data-act="line-days" data-arg="${line.key}|-1" aria-label="One day sooner">${ICON.minus({ size: 14 })}</button><span class="rdate d-est">${esc(t.text)}</span><button class="step" data-act="line-days" data-arg="${line.key}|1" aria-label="One day later">${ICON.plus({ size: 14 })}</button></span>`
      : `<button class="rdate d-est as-link" data-act="line-edit" data-arg="${line.key}" aria-label="Change estimate, now ${esc(t.text)}">${esc(t.text)}</button>`)
    : `<span class="rdate d-${t.kind}">${esc(t.text)}</span>`;
  const q = esc(qtyText(line.qty, line.unit));
  const qtyEl = ui.add.editQty === line.key
    ? `<span class="stepper sm"><button class="step" data-act="line-qty" data-arg="${line.key}|-1" aria-label="Less">${ICON.minus({ size: 14 })}</button><span class="rqty">${q}</span><button class="step" data-act="line-qty" data-arg="${line.key}|1" aria-label="More">${ICON.plus({ size: 14 })}</button></span>`
    : `<button class="rqty as-link" data-act="qty-edit" data-arg="${line.key}" aria-label="Change amount, now ${q}">${q}</button>`;
  const unsure = line.unsure
    ? `<span class="chips">${[line.food, ...line.unsure].map((alt, i) => `<button class="chip${line.answer === alt ? ' on' : ''}" data-act="answer" data-arg="${line.key}|${esc(alt)}" aria-pressed="${line.answer === alt}">${i === 0 ? 'Yes' : esc(food(alt).name)}</button>`).join('')}</span>`
    : '';
  const owner = store.persona.house
    ? `<span class="chips"><button class="chip${line.owner === 'me' ? ' on' : ''}" data-act="owner" data-arg="${line.key}|me" aria-pressed="${line.owner === 'me'}">Mine</button><button class="chip${line.owner === 'shared' ? ' on' : ''}" data-act="owner" data-arg="${line.key}|shared" aria-pressed="${line.owner === 'shared'}">Shared</button></span>`
    : '';
  const cat = food(f).cat;
  return `<li class="rline${first ? ' cat-start' : ''}">
    <span class="rcat cat-${cat}">${first ? CAT_ICON[cat]({ size: 16 }) : ''}</span>
    <span class="rpic">${pic(f, { size: 30 })}</span>
    <div class="rmain">
      <div class="rname">${esc(foodName(f, line.qty))}${line.unsure && !line.answer ? '?' : ''}</div>
      ${dateEl}
    </div>
    <div class="rright">${qtyEl}<button class="rx" data-act="line-remove" data-arg="${line.key}" aria-label="Remove ${esc(foodName(f, line.qty))}">${ICON.close({ size: 14 })}</button></div>
    ${line.splittable || unsure || owner ? `<div class="rextra">${line.splittable ? splitRow(app, line) : ''}${unsure}${owner}</div>` : ''}
  </li>`;
}

export function reviewScreen(app) {
  const { store, ui } = app;
  const lines = sortByCat(ui.add.lines);
  let prevCat = null;
  const items = lines.map((l) => {
    const cat = food(l.answer || l.food).cat;
    const first = cat !== prevCat;
    prevCat = cat;
    return lineHtml(app, l, first);
  }).join('');
  return `<div class="screen review">
    <header class="top">
      <button class="round" data-act="go" data-arg="add" aria-label="Back">${ICON.back({ size: 18 })}</button>
      <h1>New food</h1>
    </header>
    <main class="scroll">
      <div class="receipt">
        <div class="receipt-h"><span>${esc(receiptDay(store.today))}</span><span>${lines.length}</span></div>
        <ul class="rlist">${items}</ul>
        <button class="add-more" data-act="pick">${ICON.plus({ size: 14, stroke: 2.4 })}Add more</button>
      </div>
    </main>
    <div class="dock">
      <button class="btn btn-primary wide" data-act="put-all"${lines.length ? '' : ' disabled'}>${ICON.check({ size: 18, stroke: 2.6 })}Put it all in</button>
    </div>
  </div>`;
}

const pickable = () => Object.keys(FOODS).filter((f) => !food(f).leftover);

export function pickSheet() {
  const ids = pickable();
  return `<div class="sheet-wrap" data-act="close" role="presentation">
    <section class="sheet" role="dialog" aria-modal="true" aria-label="Add food" data-stop>
      <span class="handle" aria-hidden="true"></span>
      <div class="pick-grid">${ids.map((f) => `<button class="pick" data-act="pick-add" data-arg="${esc(f)}">${pic(f, { size: 36 })}<span>${esc(foodName(f, 1))}</span></button>`).join('')}</div>
    </section>
  </div>`;
}

// One tap on + / − in the review list: a piece, 250 g, or half a litre.
export const QTY_STEP = { pc: 1, bag: 1, g: 250, L: 0.5 };

// Turn the reviewed lines into one "put" event.
export function putLines(app) {
  const p = app.store.persona;
  return app.ui.add.lines.map((l) => {
    const f = l.answer || l.food;
    const bags = l.splittable && p.freezer ? l.bags : 1;
    return { food: f, qty: l.qty, unit: l.unit, date: l.date, bags, owner: l.owner, spot: spotFor(f, l.owner, p) };
  });
}


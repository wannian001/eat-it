// Adding food. Desktop: the v0.2 "How did it come in?" page. Phone: board 03's camera.
// Every way ends in the same "New food" check (board 03), which on the desktop sits next to the
// receipt, email or photo it came from (v0.2). Recognition is simulated: John and May get demo lines.
import { FOODS, CATS, food, foodName, guessDays, defaultQty } from '../foods.js';
import { lastSplit, usual, placeOf, hasFreezer, firstOfKind } from '../state.js';
import { receiptDay, addDays, dateTag, fmtDay, relDay } from '../dates.js';
import { spotFor, placeFor } from '../seed.js';
import { ICON, CAT_ICON, placeIcon } from '../icons.js';
import { esc, pic, qtyText, pageHead, aiBadge } from '../ui.js';

let seq = 0;
const key = () => `l${++seq}`;

export const usualFoods = (app) => app.store.persona.usual || usual(app.store.state);
const pickable = () => Object.keys(FOODS).filter((f) => !food(f).leftover && food(f).cat !== 'nonfood');

const METHODS = [
  ['receipt', 'Scan a receipt', 'Best after a big shop. AI reads each line, then you check it.', true, true],
  ['photo', 'Photo of your food', 'Take one now or pick one from your photos. AI recognises the food.', false, true],
  ['email', 'Receipts from your email', 'AI finds grocery receipts in your inbox. Asks you first.', false, true],
  ['barcode', 'Scan a barcode', 'One item at a time.'],
  ['type', 'Type it in', 'Name, where it goes, done.'],
  ['account', 'Link a supermarket account', 'Online orders come in by themselves. Asks first.'],
];
const METHOD_ICON = { receipt: 'receipt', photo: 'camera', email: 'mail', barcode: 'barcode', type: 'pen', account: 'store' };

export function waysPage(app) {
  const s = app.store.state;
  const desc = { email: s.links.email ? 'Connected. New receipts show up under Needs a look.' : null, account: s.links.account ? 'Linked. New online orders show up under Needs a look.' : null };
  return `<div class="page ways">
    <header class="top phone-only"><button class="round" data-act="go" data-arg="add" aria-label="Back">${ICON.back({ size: 18 })}</button><h1>Add food</h1></header>
    <div class="desk-only">${pageHead('Add food', 'How did it come in?', 'Whichever way you add food, you can fix it later. Anything AI reads or recognises is checked by you before it goes in.')}</div>
    <div class="mgrid">${METHODS.map(([k, t, d, main, ai]) => `<button class="method${main ? ' main' : ''}" data-act="method" data-arg="${k}"><span class="m-ic">${ICON[METHOD_ICON[k]]({ size: 22 })}</span><b>${esc(k === 'account' && s.links.account ? 'Supermarket account linked' : t)}${ai ? aiBadge : ''}</b><small>${esc(desc[k] || d)}</small></button>`).join('')}</div>
    <section class="ate-promo"><button class="method" data-act="go" data-arg="ate"><span class="m-ic">${ICON.mic({ size: 22 })}</span><b>Took food out? Say what you ate</b><small>Ten seconds at bedtime instead of logging every meal.</small></button></section>
  </div>`;
}

function boxSize(i) {
  return i < 2 ? 'lg' : i < 4 ? 'md' : 'sm';
}

// The camera (board 03). mode: photo | receipt | barcode.
export function cameraScreen(app) {
  const { store, ui } = app;
  const p = store.persona;
  const a = ui.add;
  const src = a.mode === 'receipt' ? p.receipt : a.mode === 'barcode' ? (p.barcode ? { lines: [p.barcode] } : null) : p.photo;
  const lines = src?.lines || [];
  const n = (p.photo ? lines.filter((l) => !l.nonfood).length : 0) + a.picks.length;
  const hint = !p.photo ? 'Scanner not connected' : a.img ? 'Your photo' : a.mode === 'receipt' ? 'Real receipt goes here' : a.mode === 'barcode' ? 'Point at a barcode' : 'Real photo goes here';
  let view;
  if (!p.photo) {
    view = `<div class="cam-pick" role="group" aria-label="Food">${pickable().map((f) => `<button class="usual-b${a.picks.includes(f) ? ' on' : ''}" data-act="usual" data-arg="${esc(f)}" aria-pressed="${a.picks.includes(f)}" aria-label="${esc(foodName(f, 1))}">${pic(f, { size: 34 })}</button>`).join('')}</div>`;
  } else if (a.mode === 'receipt') {
    view = `<div class="cam-receipt" aria-hidden="true">${receiptPaper(p.receipt, { mini: true })}</div><span class="scanline"></span>`;
  } else if (a.mode === 'barcode') {
    view = `<div class="cam-barcode" aria-hidden="true"><span class="bc-frame">${pic(p.barcode.food, { size: 90 })}<span class="bc-lines">${ICON.barcode({ size: 120, stroke: 2.5 })}</span></span></div><span class="scanline"></span>`;
  } else {
    view = `<div class="boxes" aria-hidden="true">${lines.map((l, i) => `<span class="box box-${boxSize(i)}${l.unsure ? ' box-unsure' : ''}">${pic(l.food, { size: i < 2 ? 76 : 58 })}${l.unsure ? '<span class="q">?</span>' : ''}</span>`).join('')}</div><span class="scanline"></span>`;
  }
  return `<div class="screen cam${a.scanning ? ' scanning' : ''}"${a.img ? ` style="--photo:url('${a.img}')"` : ''}>
    <header class="cam-top">
      <button class="round light" data-act="go" data-arg="home" aria-label="Close">${ICON.close({ size: 18 })}</button>
      <span class="cam-hint">${esc(hint)}</span>
      <span class="cam-count" aria-label="${n} items">${n}</span>
    </header>
    <div class="cam-view${a.img ? ' has-photo' : ''}">${view}</div>
    <div class="cam-bottom">
      <div class="usual" role="group" aria-label="Usual">
        <span class="usual-l">Usual</span>
        ${usualFoods(app).map((f) => `<button class="usual-b${a.picks.includes(f) ? ' on' : ''}" data-act="usual" data-arg="${esc(f)}" aria-pressed="${a.picks.includes(f)}" aria-label="${esc(foodName(f, 1))}">${pic(f, { size: 30 })}</button>`).join('')}
      </div>
      <div class="mode" role="group" aria-label="Scan">
        ${[['photo', 'Photo'], ['receipt', 'Receipt'], ['barcode', 'Barcode']].map(([k, t]) => `<button class="${a.mode === k ? 'on' : ''}" data-act="mode" data-arg="${k}" aria-pressed="${a.mode === k}"${!p.photo && k !== 'photo' ? ' disabled' : ''}>${t}</button>`).join('')}
      </div>
      <div class="cam-row">
        <label class="cam-side" aria-label="Choose a photo">${ICON.camera({ size: 20 })}<input type="file" accept="image/*" data-file="scan"${p.photo ? '' : ' disabled'}></label>
        <button class="shutter" data-act="shoot" aria-label="${p.photo ? 'Scan' : 'Next'}"></button>
        <button class="cam-side" data-act="go" data-arg="ways" aria-label="Other ways to add food">${ICON.dots({ size: 20 })}</button>
      </div>
    </div>
  </div>`;
}

export function addPage(app) {
  return `<div class="phone-only fill">${cameraScreen(app)}</div><div class="desk-only">${waysPage(app)}</div>`;
}

export function scanPage(app) {
  return `<div class="device-stage">${cameraScreen(app)}</div>`;
}

// ---------- the "New food" check ----------

export function newLine(app, l) {
  const s = app.store.state, p = app.store.persona;
  const splittable = !!(food(l.food).byWeight && hasFreezer(s));
  const bags = splittable ? (lastSplit(s, l.food) || 1) : 1;
  const place = l.place && placeOf(s, l.place) ? l.place : placeFor(l.food, s.places, { frozen: bags > 1 });
  return {
    key: key(), raw: l.raw || null, price: l.price || null,
    food: l.food, name: l.name || null, cat: l.cat || null,
    qty: l.qty ?? 1, unit: l.unit || food(l.food).unit,
    date: l.date ? { ...l.date } : null,
    place: bags > 1 && firstOfKind(s, 'frozen') ? firstOfKind(s, 'frozen').id : place,
    owner: l.owner || 'me',
    unsure: l.unsure || null, answer: null,
    nonfood: !!l.nonfood, keep: false, skip: false,
    splittable, bags,
    persona: p.id,
  };
}

export function buildLines(app, src) {
  const p = app.store.persona;
  const base = src === 'receipt' ? p.receipt?.lines : src === 'email' ? p.email?.lines : src === 'barcode' ? [p.barcode] : src === 'photo' ? p.photo?.lines : [];
  const lines = (base || []).filter(Boolean).map((l) => newLine(app, l));
  for (const f of app.ui.add.picks) lines.push(newLine(app, { food: f, ...defaultQty(f), date: { kind: 'est', days: guessDays(f), guess: true } }));
  return lines;
}

const needs = (l) => !l.skip && ((l.unsure && !l.answer) || (l.nonfood && !l.keep));
const kept = (l) => !l.skip && !(l.nonfood && !l.keep);

function shownDate(line, today) {
  const d = line.date;
  if (!d) return null;
  return d.on || d.kind === 'none' ? d : { kind: d.kind, on: addDays(today, d.days) };
}

function receiptPaper(R, { mini } = {}) {
  if (!R) return '';
  const total = R.lines.every((l) => l.price) ? R.lines.reduce((t, l) => t + parseFloat(l.price), 0).toFixed(2) : null;
  return `<div class="paper${mini ? ' mini' : ''}"><div class="ptop">SUPERMARKET<br>TAX INVOICE<br>${esc(receiptDay(R.when))} ${esc(R.time || '')}</div><div class="pdash"></div>${R.lines.map((l) => `<div class="pline"><span>${esc(l.raw)}</span><span>${esc(l.price)}</span></div>`).join('')}<div class="pdash"></div>${total ? `<div class="pline tot"><span>TOTAL</span><span>$${total}</span></div>` : ''}<div class="pfoot">${R.lines.length} ITEMS · THANK YOU</div></div>`;
}

function sourcePanel(app) {
  const p = app.store.persona, a = app.ui.add;
  if (a.src === 'receipt') return receiptPaper(p.receipt);
  if (a.src === 'email') {
    const E = p.email;
    const total = E.lines.reduce((t, l) => t + parseFloat(l.price || 0), 0).toFixed(2);
    return `<div class="mail"><div class="mail-h"><b>${esc(E.from)}</b><span>${esc(fmtDay(E.when))} · ${esc(E.time)}</span></div><p class="mail-s">${esc(E.subject)}</p>${E.lines.map((l) => `<div class="mline"><span>${esc(l.raw)}</span><span>$${esc(l.price)}</span></div>`).join('')}<div class="mline tot"><span>Total</span><span>$${total}</span></div><p class="mail-f">${aiBadge}Read by Eat It!. Only this email was opened.</p></div>`;
  }
  if (a.src === 'barcode') return `<div class="shot-ph tall">${pic(p.barcode.food, { size: 96 })}<code>${esc(p.barcode.raw)}</code></div>`;
  if (a.src === 'photo') {
    return `<div class="shot">${a.img ? `<img src="${a.img}" alt="Your photo of the food">` : `<div class="boxes demo">${(p.photo?.lines || []).map((l, i) => `<span class="box box-${boxSize(i)}${l.unsure ? ' box-unsure' : ''}">${pic(l.food, { size: 48 })}<span class="n">${i + 1}</span></span>`).join('')}</div>`}<span class="shot-cap">${aiBadge}found ${(p.photo?.lines || []).length} things</span></div>`;
  }
  return `<div class="shot-ph tall">${ICON.pen({ size: 48, stroke: 1.4 })}<span>Picked by you</span></div>`;
}

function splitRow(app, line) {
  const last = lastSplit(app.store.state, line.food);
  const opts = [...new Set([1, 2, last || 4])];
  if (!opts.includes(line.bags)) opts.push(line.bags);
  const each = line.bags > 1 ? qtyText(line.qty / line.bags, line.unit) : null;
  return `<div class="rsplit">
    <span class="rsplit-l">${last ? `${last} bags, like last time` : 'Split into bags for the freezer?'}${each ? ` · ${esc(each)} each` : ''}</span>
    <span class="chips">${opts.map((o) => `<button class="chip${line.bags === o ? ' on' : ''}" data-act="bags" data-arg="${line.key}|${o}" aria-pressed="${line.bags === o}">${o === 1 ? 'Whole' : o}</button>`).join('')}<button class="chip" data-act="bags" data-arg="${line.key}|+" aria-label="More bags">${ICON.plus({ size: 14, stroke: 2.4 })}</button></span>
  </div>`;
}

function lineHtml(app, line, first) {
  const { store, ui } = app;
  const s = store.state, today = store.today;
  const f = line.answer || line.food;
  const cat = line.cat || food(f).cat;
  if (line.skip) {
    return `<li class="rline skipped${first ? ' cat-start' : ''}"><span class="rcat"></span><span class="rpic">${pic(f, { size: 30 })}</span><div class="rmain"><s>${esc(foodName(f, line.qty, line))}</s><small>won't be added</small></div><div class="rright"><button class="chip-btn" data-act="line-restore" data-arg="${line.key}">Put back</button></div></li>`;
  }
  const d = shownDate(line, today);
  const t = d ? dateTag(d, today, 'receipt') : { text: line.nonfood ? '' : app.ui.add.src === 'photo' ? 'No date in the photo' : 'No date on the receipt', kind: 'none' };
  const dateEl = line.date?.kind === 'est' && line.date.days != null
    ? (ui.add.edit === line.key
      ? `<span class="stepper sm"><button class="step" data-act="line-days" data-arg="${line.key}|-1" aria-label="One day sooner">${ICON.minus({ size: 14 })}</button><span class="rdate d-est">${esc(t.text)}</span><button class="step" data-act="line-days" data-arg="${line.key}|1" aria-label="One day later">${ICON.plus({ size: 14 })}</button></span>`
      : `<button class="rdate d-est as-link" data-act="line-edit" data-arg="${line.key}" aria-label="Change estimate, now ${esc(t.text)}">${esc(t.text)}</button>`)
    : `<span class="rdate d-${t.kind}">${esc(t.text)}</span>`;
  const packDate = !line.nonfood && (!line.date || line.date.guess)
    ? `<select class="mini-sel" data-change="line-date" data-arg="${line.key}" aria-label="Add the date from the pack"><option value="">Add date from pack…</option>${[1, 2, 3, 5, 7, 10, 14].map((n) => `<option value="use_by|${addDays(today, n)}">Use by ${esc(relDay(addDays(today, n), today))}</option>`).join('')}${[7, 30, 90].map((n) => `<option value="best_before|${addDays(today, n)}">Best before ${esc(fmtDay(addDays(today, n)))}</option>`).join('')}</select>`
    : '';
  const q = esc(qtyText(line.qty, line.unit));
  const qtyEl = ui.add.editQty === line.key
    ? `<span class="stepper sm"><button class="step" data-act="line-qty" data-arg="${line.key}|-1" aria-label="Less">${ICON.minus({ size: 14 })}</button><span class="rqty">${q}</span><button class="step" data-act="line-qty" data-arg="${line.key}|1" aria-label="More">${ICON.plus({ size: 14 })}</button></span>`
    : `<button class="rqty as-link" data-act="qty-edit" data-arg="${line.key}" aria-label="Change amount, now ${q}">${q}</button>`;
  const place = placeOf(s, line.place);
  const ctl = line.nonfood && !line.keep ? '' : `<span class="chips">
      <button class="chip" data-act="line-place" data-arg="${line.key}" title="Change where it goes">${place ? placeIcon(place, { size: 14 }) : ''}${esc(place?.name || 'Choose a place')}</button>
      ${s.house ? `<button class="chip" data-act="owner" data-arg="${line.key}">${line.owner === 'shared' ? `${ICON.people({ size: 14 })}Shared` : 'Mine'}</button>` : ''}
    </span>`;
  const unsure = line.unsure
    ? `<div class="rq"><span class="hint">${line.unsure.length ? `AI isn't sure: ${esc(foodName(line.food, 2).toLowerCase())} or ${esc(line.unsure.map((x) => foodName(x, 2).toLowerCase()).join(' or '))}?` : 'AI isn\'t sure about this line.'}</span>
       <span class="chips">${[line.food, ...line.unsure].map((alt, i) => `<button class="chip${line.answer === alt ? ' on' : ''}" data-act="answer" data-arg="${line.key}|${esc(alt)}" aria-pressed="${line.answer === alt}">${i === 0 ? 'Yes' : esc(food(alt).name)}</button>`).join('')}</span></div>`
    : '';
  const nonfood = line.nonfood && !line.keep
    ? `<div class="rq"><span class="hint">AI thinks this isn't food.</span><span class="chips"><button class="chip on" data-act="line-skip" data-arg="${line.key}">Skip it</button><button class="chip" data-act="line-keep" data-arg="${line.key}">It's food</button></span></div>`
    : '';
  return `<li class="rline${first ? ' cat-start' : ''}${needs(line) ? ' need' : ''}">
    <span class="rcat cat-${cat}">${first ? (CAT_ICON[cat] || CAT_ICON.other)({ size: 16 }) : ''}</span>
    <span class="rpic">${pic(f, { size: 30, lot: line })}</span>
    <div class="rmain">
      ${line.raw ? `<code class="raw">${esc(line.raw)}</code>` : ''}
      <div class="rname">${esc(foodName(f, line.qty, line))}${line.unsure && !line.answer ? '?' : ''}</div>
      ${dateEl}${packDate}
    </div>
    <div class="rright">${qtyEl}<button class="rx" data-act="line-remove" data-arg="${line.key}" aria-label="Remove ${esc(foodName(f, line.qty, line))}">${ICON.close({ size: 14 })}</button></div>
    <div class="rextra">${ctl}${line.splittable && place?.kind === 'frozen' ? splitRow(app, line) : line.splittable ? splitRow(app, line) : ''}${unsure}${nonfood}</div>
  </li>`;
}

export function reviewPage(app) {
  const { store, ui } = app;
  const lines = [...ui.add.lines].sort((a, b) => CATS.indexOf(a.cat || food(a.answer || a.food).cat) - CATS.indexOf(b.cat || food(b.answer || b.food).cat));
  let prev = null;
  const items = lines.map((l) => { const c = l.cat || food(l.answer || l.food).cat; const first = c !== prev; prev = c; return lineHtml(app, l, first); }).join('');
  const need = lines.filter(needs).length;
  const n = lines.filter(kept).length;
  const src = ui.add.src;
  const title = src === 'photo' ? 'Check what AI found' : src === 'email' ? 'Check your email receipt' : src === 'receipt' ? 'Check your receipt' : 'New food';
  const sub = src === 'photo' ? `${aiBadge}recognised these in your photo. AI can mistake one food for another and can't read dates from a photo, so check each one.`
    : src === 'email' ? `${aiBadge}turned this email into a list. Email receipts don't show use-by dates, so add those from the pack if you can.`
    : src === 'receipt' ? `${aiBadge}read each line. Where each one goes is a guess. Receipts don't show use-by dates, so add those from the pack if you can.`
    : 'Check the list, then put it all in.';
  const btn = ui.add.lines.length ? (need ? `Check ${need} line${need > 1 ? 's' : ''} first` : `Put it all in · ${n}`) : 'Nothing to add';
  return `<div class="page review">
    <header class="top phone-only"><button class="round" data-act="go" data-arg="${src === 'email' ? 'ways' : 'add'}" aria-label="Back">${ICON.back({ size: 18 })}</button><h1>New food</h1></header>
    <div class="desk-only"><button class="link back-link" data-act="go" data-arg="add">${ICON.back({ size: 14 })}Add food</button>${pageHead(src === 'picks' ? 'Add food' : `${esc(src[0].toUpperCase() + src.slice(1))} · ${esc(fmtDay(store.today))}`, title, sub)}</div>
    <div class="rgrid">
      <div class="desk-only src">${sourcePanel(app)}</div>
      <div>
        <div class="receipt">
          <div class="receipt-h"><span>${esc(receiptDay(store.today))}</span><span>${lines.length}</span></div>
          <ul class="rlist">${items}</ul>
          <button class="add-more" data-act="sheet" data-arg="pick">${ICON.plus({ size: 14, stroke: 2.4 })}Add more</button>
        </div>
        <div class="confirm"><span class="muted">${need ? `${need} line${need > 1 ? 's need' : ' needs'} a quick check.` : 'Everything checked.'}</span>
          <button class="btn btn-primary wide-phone" data-act="put-all"${need || !n ? ' disabled' : ''}>${need ? '' : ICON.check({ size: 18, stroke: 2.6 })}${esc(btn)}</button></div>
      </div>
    </div>
  </div>`;
}

// The reviewed lines as one "put" event.
export function putLines(app, lines = app.ui.add.lines) {
  const s = app.store.state, p = app.store.persona;
  return lines.filter(kept).map((l) => {
    const f = l.answer || l.food;
    const place = placeOf(s, l.place) || placeOf(s, placeFor(f, s.places));
    const bags = l.splittable && place?.kind === 'frozen' ? l.bags : 1;
    const date = l.date ? (l.date.days != null && l.answer && l.answer !== l.food ? { kind: 'est', days: guessDays(f), guess: l.date.guess } : l.date) : (food(f).cat === 'nonfood' ? null : { kind: 'est', days: guessDays(f), guess: true });
    return { food: f, name: l.name || null, cat: l.cat || null, qty: l.qty, unit: l.unit, date, bags, owner: l.owner, place: place?.id || null, spot: spotFor(f, l.owner, p, place) };
  }).filter((l) => l.place);
}

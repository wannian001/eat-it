// Sheets: a bottom sheet on the phone, a side drawer on the desktop (v0.2 drawers, hi-fi look).
import { FOODS, food, foodName, shortName, matchFood } from '../foods.js';
import { placeOf, bagNumber, oldestFrozen, hasFreezer } from '../state.js';
import { dateTag, daysBetween, fmtDay, relDay, dayMonth, addDays } from '../dates.js';
import { shelvesOf, SPOT_NAMES } from '../seed.js';
import { ICON, placeIcon } from '../icons.js';
import { esc, pic, tag, amountText, aiBadge } from '../ui.js';
import { effSpot } from './parts.js';

const KIND = { cold: 'Cold (fridge)', frozen: 'Frozen (freezer)', room: 'Room temperature' };

export function wrap(inner, { label = 'Details', wide = false } = {}) {
  return `<div class="sheet-wrap" data-act="close" role="presentation">
    <section class="sheet${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(label)}" data-stop>
      <span class="handle" aria-hidden="true"></span>
      <button class="sheet-x" data-act="close" aria-label="Close">${ICON.close({ size: 18 })}</button>
      ${inner}
    </section>
  </div>`;
}

function explain(app, lot) {
  const today = app.store.today;
  const d = lot.date;
  if (!d) return 'No date for this one.';
  const place = placeOf(app.store.state, lot.place);
  switch (d.kind) {
    case 'use_by':
      return daysBetween(today, d.on) < 0 ? "The use-by date has passed, so don't eat it." : "Use-by date from the pack. It's about safety: don't eat it after this date, even if it looks fine.";
    case 'best_before':
      return "Best-before date from the pack. It's about quality: usually still fine after it, but check how it looks and smells.";
    case 'frozen': {
      const days = daysBetween(d.on, today);
      const oldest = oldestFrozen(app.store.state)?.id === lot.id;
      return `In the freezer since ${dayMonth(d.on)} (${days} day${days === 1 ? '' : 's'}). Frozen food stays safe while it's frozen, but quality drops the longer it's there.${food(lot.food).keep ? ` ${food(lot.food).keep}` : ''}${oldest ? ' This is your oldest bag, so use it first.' : ''}`;
    }
    case 'est': {
      if (food(lot.food).leftover) {
        const ago = daysBetween(lot.addedOn, today);
        return `${ago <= 0 ? 'Cooked today.' : ago === 1 ? 'Cooked yesterday.' : `Cooked ${ago} days ago.`} Leftovers keep about 2–3 days in the fridge.`;
      }
      if (lot.thawed) return 'Thawed in the fridge. This is our guess — tap the date to change it.';
      const basis = `${food(lot.food).group || foodName(lot.food, 2, lot).toLowerCase()} · ${lot.date.guess ? 'added' : 'bought'} ${fmtDay(lot.addedOn)} · in the ${(place?.name || 'fridge').toLowerCase()}`;
      return `No date from the pack, so this is our guess from: ${basis}. It's a guide, not a promise.`;
    }
    case 'none': return d.note || '';
    default: return '';
  }
}

function dateOptions(today) {
  const o = [];
  for (const n of [0, 1, 2, 3, 4, 5, 7, 10, 14]) o.push([`use_by|${addDays(today, n)}`, `Use by ${relDay(addDays(today, n), today)}`]);
  for (const n of [3, 7, 30, 90, 180]) o.push([`best_before|${addDays(today, n)}`, `Best before ${fmtDay(addDays(today, n))}`]);
  return o;
}

export function lotSheet(app) {
  const { store, ui } = app;
  const s = store.state, p = store.persona, today = store.today;
  const lot = s.lots.get(ui.sheet.arg);
  if (!lot) return wrap('<p class="sheet-text">This food is gone.</p>');
  const place = placeOf(s, lot.place);
  const frozen = lot.date?.kind === 'frozen';
  const bagNo = frozen ? bagNumber(s, lot) : 0;
  const title = bagNo ? `${shortName(lot.food, lot)}, bag ${bagNo}` : foodName(lot.food, lot.unit === 'pc' ? lot.qty : 1, lot);
  const spot = place ? effSpot(lot, place, p) : null;
  const sub = [amountText(lot) === '1' ? null : amountText(lot), place?.name, SPOT_NAMES[spot], s.house ? (lot.owner === 'shared' ? `Shared with ${s.house.mates?.map((m) => m.name).join(' and ') || 'housemates'}` : 'Mine') : null, lot.opened ? `opened ${relDay(lot.opened, today)}` : null].filter(Boolean).join(' · ');
  const isEst = lot.date?.kind === 'est';
  const source = !lot.date ? '' : lot.date.kind === 'est' ? 'our guess' : lot.date.kind === 'frozen' ? `since ${dayMonth(lot.date.on)}` : lot.date.kind === 'none' ? '' : 'on the pack';
  const dateHtml = isEst && ui.sheet.edit === 'est'
    ? `<span class="stepper"><button class="step" data-act="est" data-arg="${esc(lot.id)}|-1" aria-label="One day sooner">${ICON.minus({ size: 16 })}</button>${tag(lot.date, today, 'sheet')}<button class="step" data-act="est" data-arg="${esc(lot.id)}|1" aria-label="One day later">${ICON.plus({ size: 16 })}</button></span>`
    : isEst ? `<button class="tag-btn" data-act="sheet-edit" data-arg="est" aria-label="Change the estimate, now ${esc(dateTag(lot.date, today, 'sheet').text)}">${tag(lot.date, today, 'sheet')}</button>`
    : tag(lot.date, today, 'sheet');
  const setDate = ui.sheet.edit === 'date'
    ? `<label class="fld"><span>Date on the pack</span><select data-change="lot-date" data-arg="${esc(lot.id)}"><option value="">Choose…</option>${dateOptions(today).map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select></label>`
    : '';
  const shelves = place ? shelvesOf(place, p).filter((x) => x.kind !== 'locked') : [];
  const where = `<div class="where">
    <label class="fld inline"><span>In the</span><select data-change="lot-place" data-arg="${esc(lot.id)}" aria-label="Which place">${s.places.map((pl) => `<option value="${esc(pl.id)}"${pl.id === lot.place ? ' selected' : ''}>${esc(pl.name)}</option>`).join('')}</select></label>
    ${shelves.length > 1 ? `<label class="fld inline"><span>on the</span><select data-change="lot-spot" data-arg="${esc(lot.id)}" aria-label="Which shelf">${shelves.map((x) => `<option value="${x.spot}"${x.spot === spot ? ' selected' : ''}>${esc(SPOT_NAMES[x.spot] || x.spot)}</option>`).join('')}</select></label>` : ''}
  </div>`;
  const amt = lot.amount || 'Full';
  const freezer = hasFreezer(s);
  return wrap(`
    <div class="sheet-head">
      <span class="sheet-pic">${pic(lot.food, { bag: lot.bag, size: 56, lot })}</span>
      <div><h2>${esc(title)}</h2><p class="sheet-sub">${esc(sub)}</p></div>
    </div>
    <div class="datebox d-${lot.date?.kind || 'none'}">
      <div class="datebox-h">${dateHtml}${source ? `<small>${esc(source)}</small>` : ''}</div>
      <p>${esc(explain(app, lot))}${lot.part ? ' Some already used.' : ''}</p>
      ${lot.date?.kind === 'est' && ui.sheet.edit !== 'date' ? `<button class="chip-btn" data-act="sheet-edit" data-arg="date">Set the date from the pack</button>` : ''}
      ${setDate}
    </div>
    <div class="btn-row">
      <button class="btn btn-primary" data-act="use" data-arg="${esc(lot.id)}|one">Used it</button>
      <button class="btn btn-secondary" data-act="use" data-arg="${esc(lot.id)}|some">Used some</button>
    </div>
    <div class="sheet-sec stock"><h3>In stock <small>Forgot to say what you ate? Fix it here.</small></h3>
      <div class="stock-row">
        ${lot.unit === 'pc' ? `<span class="stepper"><button class="step" data-act="qty" data-arg="${esc(lot.id)}|${lot.qty - 1}" aria-label="One fewer">${ICON.minus({ size: 16 })}</button><b class="stock-n" aria-live="polite">${lot.qty}</b><button class="step" data-act="qty" data-arg="${esc(lot.id)}|${lot.qty + 1}" aria-label="One more">${ICON.plus({ size: 16 })}</button></span>` : ''}
        <div class="seg small">${['Full', 'Most', 'Half', 'Low'].map((a) => `<button class="${amt === a ? 'on' : ''}" data-act="amount" data-arg="${esc(lot.id)}|${a}" aria-pressed="${amt === a}">${a}</button>`).join('')}</div>
        <button class="chip-btn" data-act="qty" data-arg="${esc(lot.id)}|0">All gone</button>
      </div>
    </div>
    <div class="sheet-sec"><h3>Where it is</h3>${where}</div>
    <div class="sheet-sec"><h3>Quick update</h3><div class="acts">
      <button class="act" data-act="open" data-arg="${esc(lot.id)}"${frozen || lot.opened ? ' disabled' : ''}>Opened</button>
      ${frozen ? `<button class="act" data-act="thaw" data-arg="${esc(lot.id)}">Thaw tonight</button>` : `<button class="act" data-act="freeze" data-arg="${esc(lot.id)}"${freezer ? '' : ' disabled title="No freezer at home"'}>Freeze it</button>`}
      <button class="act" data-act="sheet-edit" data-arg="date">Edit the date</button>
      <button class="act" data-act="toss" data-arg="${esc(lot.id)}">Threw it out</button>
    </div></div>
    ${lot.tip || food(lot.food).tip ? `<div class="tip"><b>Storage tip</b><span>${esc(lot.tip || food(lot.food).tip)}</span><em>guide</em></div>` : ''}
  `, { label: title });
}

export function placesSheet(app) {
  const s = app.store.state;
  const count = (id) => [...s.lots.values()].filter((l) => l.place === id).length;
  const rm = app.ui.sheet.remove;
  const rows = s.places.map((pl) => {
    const n = count(pl.id);
    const rank = (x) => (x.kind === pl.kind ? 0 : x.kind === 'frozen' ? 2 : 1);
    const others = s.places.filter((x) => x.id !== pl.id).sort((a, b) => rank(a) - rank(b));
    const confirm = rm === pl.id
      ? `<div class="confirm-box">${n ? `${n} item${n === 1 ? ' is' : 's are'} here. Move ${n === 1 ? 'it' : 'them'} to <select id="rm-to" aria-label="Move food to">${others.map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select>` : 'Nothing is stored here.'}
         <div class="btn-row"><button class="btn btn-danger sm" data-act="place-remove-go" data-arg="${esc(pl.id)}"${n && !others.length ? ' disabled' : ''}>${n ? 'Move and remove' : 'Remove'}</button><button class="btn btn-quiet sm" data-act="place-remove-cancel">Keep it</button></div></div>`
      : '';
    return `<div class="place-row">
      <div class="pr-top"><span class="pr-ic">${placeIcon(pl, { size: 18 })}</span><input type="text" value="${esc(pl.name)}" data-change="place-name" data-arg="${esc(pl.id)}" aria-label="Name of this place"><button class="chip-btn" data-act="place-remove" data-arg="${esc(pl.id)}">Remove</button></div>
      <div class="pr-row"><select data-change="place-kind" data-arg="${esc(pl.id)}" aria-label="Type of place">${Object.entries(KIND).map(([k, t]) => `<option value="${k}"${pl.kind === k ? ' selected' : ''}>${t}</option>`).join('')}</select><span class="muted">${n} item${n === 1 ? '' : 's'}</span></div>
      <div class="pr-row"><span>How full</span><input type="range" min="0" max="100" step="5" value="${pl.full ?? 0}" data-change="place-full" data-arg="${esc(pl.id)}" aria-label="How full is ${esc(pl.name)}"><span class="pr-pct">${pl.full == null ? '—' : `${pl.full}%`}</span><button class="chip-btn" data-act="sheet" data-arg="measure:${esc(pl.id)}">${ICON.camera({ size: 14 })}Photo</button></div>
      ${confirm}
    </div>`;
  }).join('');
  const sug = [['Second fridge', 'cold'], ['Mini fridge', 'cold'], ['Chest freezer', 'frozen'], ['Rice bin', 'room'], ['Box under the bed', 'room'], ['Balcony', 'room']]
    .filter(([n]) => !s.places.some((x) => x.name.toLowerCase() === n.toLowerCase()));
  return wrap(`<h2 class="sheet-title">Storage places</h2><p class="sheet-sub">Add the places where you really keep food, and remove any you don't have. The type helps Eat It! guess how long food lasts.</p>
    <div class="places">${rows || '<p class="muted">No places yet. Add one below.</p>'}</div>
    <div class="new-place"><h3>Add a place</h3><div class="np-row"><input type="text" id="np-name" placeholder="e.g. Rice bin" autocomplete="off" aria-label="Name of the new place"><select id="np-kind" aria-label="Type of the new place">${Object.entries(KIND).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select><button class="btn btn-primary sm" data-act="place-add">Add</button></div>
    ${sug.length ? `<div class="chips">${sug.map(([n, k]) => `<button class="chip" data-act="place-add-quick" data-arg="${esc(n)}|${k}">${placeIcon({ name: n, kind: k }, { size: 14 })}${esc(n)}</button>`).join('')}</div>` : ''}</div>`, { label: 'Storage places', wide: true });
}

// "Measure with a photo" (v0.2): the estimate is simulated; the photo is never kept.
export function measureSheet(app) {
  const s = app.store.state;
  const m = app.ui.sheet;
  const pl = placeOf(s, m.place);
  if (!pl) return wrap('<p>That place was removed.</p>');
  const name = esc(pl.name.toLowerCase());
  const shot = m.img ? `<img src="${m.img}" alt="Your photo of the ${name}">` : `<div class="shot-ph">${placeIcon(pl, { size: 64, stroke: 1.4 })}<span>Example photo</span></div>`;
  if (!m.phase || m.phase === 'pick') {
    return wrap(`<h2 class="sheet-title">How full is the ${name}?</h2><p class="sheet-sub">Take one photo with the door open. Eat It! estimates how much of the space is used.</p>
      <ul class="pv"><li class="y">Stand back so the whole space is in the picture</li><li class="y">Sharing it? Point at your own shelf</li><li class="y">The photo is only used for the estimate. It isn't saved or shown to anyone</li></ul>
      <div class="btn-row wrap"><label class="btn btn-primary filebtn">${ICON.camera({ size: 18 })}Take a photo<input type="file" accept="image/*" capture="environment" data-file="measure" aria-label="Take a photo"></label><button class="btn btn-secondary" data-act="measure-demo">Use an example photo</button></div>
      <p class="small">No photo? You can also drag the slider in Storage places.</p>`, { label: 'Measure' });
  }
  if (m.phase === 'scan') return wrap(`<h2 class="sheet-title">Looking at the ${name}…</h2><div class="shot scanning">${shot}<span class="sweep"></span></div>`, { label: 'Measuring' });
  return wrap(`<h2 class="sheet-title">${esc(pl.name)}</h2><div class="shot">${shot}<span class="shot-cap">Estimate</span></div>
    <p class="measure-out">≈ ${m.val}% full</p>
    <p class="muted">Estimated from your photo. Food hidden at the back or inside boxes can't be seen, so treat it as a rough guide.</p>
    <label class="fld"><span>Looks wrong? Drag to fix it.</span><input type="range" min="0" max="100" step="5" value="${m.val}" data-change="measure-val"></label>
    <div class="btn-row"><button class="btn btn-primary" data-act="measure-save">Save</button><button class="btn btn-secondary" data-act="measure-again">Take another</button></div>
    <p class="small">The photo is thrown away after this. Only the number is kept${s.house ? ', and housemates see it only if you share how full your shelf is' : ''}.</p>`, { label: 'Measure' });
}

export function typeSheet(app) {
  const s = app.store.state, today = app.store.today;
  const t = app.ui.sheet;
  const matched = t.name ? matchFood(t.name) : null;
  return wrap(`<h2 class="sheet-title">Type it in</h2>
    <label class="fld"><span>What is it?</span><span class="fld-pic">${matched ? pic(matched, { size: 28 }) : ''}<input type="text" id="qa-name" placeholder="e.g. Firm tofu" autocomplete="off" value="${esc(t.name || '')}" data-input="qa-name"></span></label>
    <label class="fld"><span>How many / how much?</span><input type="text" id="qa-qty" placeholder="1" autocomplete="off" value="${esc(t.qty || '')}" inputmode="decimal"></label>
    <label class="fld"><span>Where does it go?</span><select id="qa-place">${s.places.map((pl) => `<option value="${esc(pl.id)}">${esc(pl.name)}</option>`).join('')}</select></label>
    ${s.house ? `<label class="fld"><span>Whose is it?</span><select id="qa-own"><option value="me">Mine</option><option value="shared">Shared with ${esc(s.house.mates?.map((m) => m.name).join(' and ') || 'housemates')}</option></select></label>` : ''}
    <label class="fld"><span>Date on the pack</span><select id="qa-date"><option value="est">No date, estimate it for me</option>${dateOptions(today).map(([v, x]) => `<option value="${v}">${esc(x)}</option>`).join('')}</select></label>
    <div class="btn-row"><button class="btn btn-secondary" data-act="close">Cancel</button><button class="btn btn-primary" data-act="type-add"${s.places.length ? '' : ' disabled'}>Add</button></div>`, { label: 'Type it in' });
}

export function consentSheet() {
  return wrap(`<h2 class="sheet-title">Link a supermarket account?</h2><p class="sheet-sub">Your online orders can be added for you, so you type less.</p>
    <div class="cols-2"><div><h3>Eat It! reads</h3><ul class="pv"><li class="y">Product names and amounts</li><li class="y">The day you bought them</li></ul></div><div><h3>It never reads</h3><ul class="pv"><li class="n">Payment details or your address</li><li class="n">Anything else in your account</li></ul></div></div>
    <p class="small">If you share a household, housemates only see items you mark as shared. You can unlink any time and delete everything that was imported.</p>
    <div class="btn-row"><button class="btn btn-secondary" data-act="close">Not now</button><button class="btn btn-primary" data-act="link" data-arg="account|on">Link account</button></div>`, { label: 'Link a supermarket account' });
}

export function emailSheet(app) {
  const s = app.store.state, p = app.store.persona;
  if (s.links.email) {
    const E = p.email;
    return wrap(`<h2 class="sheet-title">AI checked your inbox</h2><p class="sheet-sub">${aiBadge}Emails from the last 7 days, only from: ${esc(s.links.senders.join(', ') || 'no senders picked')}.</p>
      ${!E || s.done.email ? '<div class="card"><p>No new receipts.</p></div>' : `<ul class="rows"><li><button class="row" data-act="review" data-arg="email"><span class="row-ic">${ICON.mail({ size: 20 })}</span><span class="r-main"><b>${esc(E.subject)}</b><small>${esc(E.from)} · ${esc(fmtDay(E.when))} · ${E.lines.length} lines</small></span><span class="mini">Review</span></button></li></ul>`}`, { label: 'Email receipts' });
  }
  return wrap(`<h2 class="sheet-title">Let AI read receipts in your email?</h2>
    <p class="sheet-sub">${aiBadge}Eat It! looks for grocery receipts in your inbox and turns them into a list you check. Nothing is added until you say so.</p>
    <h3>Only look at emails from</h3>
    <div class="checks"><label><input type="checkbox" id="em-c1" checked>Online supermarket orders</label><label><input type="checkbox" id="em-c2" checked>In-store e-receipts</label><label><input type="checkbox" id="em-c3">Meal-kit and delivery apps</label></div>
    <div class="cols-2"><div><h3>AI reads</h3><ul class="pv"><li class="y">Item names, amounts and the date</li><li class="y">Only emails from the senders you tick</li></ul></div><div><h3>It never</h3><ul class="pv"><li class="n">Opens any other email</li><li class="n">Sends, deletes or keeps emails</li><li class="n">Shows your receipts to housemates</li></ul></div></div>
    <p class="small">You can disconnect any time in Household & settings.</p>
    <div class="btn-row"><button class="btn btn-secondary" data-act="close">Not now</button><button class="btn btn-primary" data-act="email-connect">Connect my email</button></div>`, { label: 'Email receipts' });
}

export function pickSheet() {
  const ids = Object.keys(FOODS).filter((f) => !food(f).leftover && food(f).cat !== 'nonfood');
  return wrap(`<h2 class="sheet-title">Add food</h2><div class="pick-grid">${ids.map((f) => `<button class="pick" data-act="pick-add" data-arg="${esc(f)}">${pic(f, { size: 36 })}<span>${esc(foodName(f, 1))}</span></button>`).join('')}</div>`, { label: 'Add food', wide: true });
}

// "Food at home" (v0.2): one place at a time, as a picture or a list, with search and Mine / Shared.
import { foodName } from '../foods.js';
import { placeOf } from '../state.js';
import { urgency } from '../dates.js';
import { SPOT_NAMES } from '../seed.js';
import { ICON, placeIcon } from '../icons.js';
import { esc, pic, tag, pageHead, amountText } from '../ui.js';
import { fridgePicture, shelfPanel, effSpot } from './parts.js';
import { phoneHeader } from './home.js';

const KIND = { cold: 'Cold (fridge)', frozen: 'Frozen (freezer)', room: 'Room temperature' };

export function currentPlace(app) {
  const s = app.store.state;
  return placeOf(s, app.ui.food.place) || s.places[0] || null;
}

function lotsHere(app, place) {
  const { q, own } = app.ui.food;
  const needle = q.trim().toLowerCase();
  return [...app.store.state.lots.values()].filter((l) => l.place === place.id
    && (own === 'all' || l.owner === own)
    && (!needle || foodName(l.food, 2, l).toLowerCase().includes(needle)));
}

function tableHtml(app, place) {
  const s = app.store.state, p = app.store.persona, today = app.store.today;
  const frozen = place.kind === 'frozen';
  const lots = lotsHere(app, place).sort(frozen
    ? (a, b) => (a.date?.on || '9999').localeCompare(b.date?.on || '9999')
    : (a, b) => (urgency(a.date, today) ?? 999) - (urgency(b.date, today) ?? 999));
  const rows = lots.map((l) => {
    const whose = s.house ? (l.owner === 'shared' ? 'Shared' : 'Mine') : 'Mine';
    const spot = SPOT_NAMES[effSpot(l, place, p)] || '';
    return `<button class="frow" data-act="lot" data-arg="${esc(l.id)}">
      <span class="fn">${pic(l.food, { bag: l.bag, size: 32, lot: l })}<span><b>${esc(foodName(l.food, l.unit === 'pc' ? l.qty : 1, l))}</b><small>${esc([amountText(l), s.house ? whose : null].filter(Boolean).join(' · '))}</small></span></span>
      <span class="fx">${esc(amountText(l))}</span><span class="fx">${esc(whose)}</span><span class="fx">${esc(spot)}</span>
      <span class="fd">${tag(l.date, today)}</span>
    </button>`;
  }).join('');
  const others = s.house && app.ui.food.own === 'all' && !app.ui.food.q
    ? (p.others || []).filter((o) => o.place === place.id).map((o) => `<div class="frow other"><span class="fn"><span class="avatar av-1 sm-av">${esc(o.who[0])}</span><span><b>${esc(o.who)}'s food · ${o.n} item${o.n === 1 ? '' : 's'}</b><small>Only ${esc(o.who)} sees what they are</small></span></span><span class="fx"></span><span class="fx">${esc(o.who)}</span><span class="fx"></span><span class="fd"><span class="lock-tag">${ICON.lock({ size: 12 })}Private</span></span></div>`).join('')
    : '';
  const empty = !rows && !others ? `<div class="frow other"><span class="fn">${app.ui.food.q ? `Nothing called "${esc(app.ui.food.q)}" here.` : 'Nothing here yet.'}</span></div>` : '';
  return `<div class="sec-h"><h2>${lots.length} item${lots.length === 1 ? '' : 's'}</h2><span class="muted sm-t">${frozen ? 'Oldest first' : 'Soonest first'}</span></div>
    <div class="ftable"><div class="fhead"><span>Item</span><span>Amount</span><span>Whose</span><span>Spot</span><span>Date</span></div>${rows}${others}${empty}</div>`;
}

function pictureHtml(app, place) {
  const pic = place.kind === 'room' ? shelfPanel(app, place) : fridgePicture(app, { places: [place] });
  return `<div class="viz-h"><span>${placeIcon(place, { size: 18 })}<b>${esc(place.name)}</b> · ${place.full == null ? 'not measured yet' : `${place.src === 'photo' ? '≈' : 'about'} ${place.full}% full`}</span><button class="link" data-act="sheet" data-arg="measure:${esc(place.id)}">Measure with a photo</button></div>
    <div class="viz">${pic}
      <div class="legend"><span><i class="lg-red"></i>Use by soon</span><span><i class="lg-amber"></i>Best before today</span><span><i class="lg-est"></i>Date is our guess</span><span><i class="lg-frost"></i>Frozen</span><span class="lg-note">Tap any food to see or change it.</span></div>
    </div>`;
}

export function foodPage(app) {
  const { store, ui } = app;
  const s = store.state;
  const place = currentPlace(app);
  const edit = `<button class="btn btn-secondary sm" data-act="sheet" data-arg="places">${ICON.settings({ size: 16 })}Edit places</button>`;
  if (!place) {
    return `<div class="page">${pageHead('Food at home', 'Where do you keep food?', 'Add the places you really use: a fridge, a cupboard, a rice bin, a box under the bed.')}
      <div class="card"><p class="card-t">No storage places yet</p><div class="btn-row">${edit}</div></div></div>`;
  }
  const tabs = `<div class="seg" role="tablist">${s.places.map((pl) => `<button role="tab" aria-selected="${pl.id === place.id}" class="${pl.id === place.id ? 'on' : ''}" data-act="place" data-arg="${esc(pl.id)}">${placeIcon(pl, { size: 16 })}${esc(pl.name)}</button>`).join('')}</div>`;
  const view = `<div class="seg small">${[['picture', 'Picture'], ['list', 'List']].map(([k, t]) => `<button class="${ui.food.view === k ? 'on' : ''}" data-act="food-view" data-arg="${k}" aria-pressed="${ui.food.view === k}">${t}</button>`).join('')}</div>`;
  const filt = s.house ? `<div class="chips">${[['all', 'All'], ['me', 'Mine'], ['shared', 'Shared']].map(([k, t]) => `<button class="chip${ui.food.own === k ? ' on' : ''}" data-act="own" data-arg="${k}" aria-pressed="${ui.food.own === k}">${t}</button>`).join('')}</div>` : '';
  const search = `<label class="search">${ICON.search({ size: 16 })}<input id="food-q" type="search" placeholder="Find food" value="${esc(ui.food.q)}" aria-label="Search food" data-input="food-q"></label>`;
  return `<div class="page food">
    ${phoneHeader(app, `What's in the ${place.name.toLowerCase()}`)}
    <div class="desk-only">${pageHead('Food at home', `What's in the ${esc(place.name.toLowerCase())}`, `Check from anywhere, no need to open it. <span class="muted">${esc(KIND[place.kind])}${place.sub ? ` · ${esc(place.sub)}` : ''}</span>`, `<button class="btn btn-primary" data-act="go" data-arg="add">${ICON.plus({ size: 18, stroke: 2.4 })}Add food</button>`)}</div>
    <div class="toolbar">${tabs}<span class="desk-only">${edit}</span></div>
    <div class="vtools">${view}${filt}${search}</div>
    ${ui.food.view === 'list' ? tableHtml(app, place) : pictureHtml(app, place)}
    <div class="phone-only center-row">${edit}</div>
  </div>`;
}

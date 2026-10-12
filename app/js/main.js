// Wiring: the shell (desktop side nav / phone tab bar), routes (#/week …), one click handler for
// every data-act, change/input handlers, the voice session and the user system.

import { spotFor } from './seed.js';
import { userProfile, currentUser, signIn, signOut, addUser, renameUser, removeUser, restartUser } from './users.js';
import { addDays, daysBetween } from './dates.js';
import { CONFIG } from './config.js';
import { openStore, localAdapter, httpAdapter, prefs } from './store.js';
import { matchFood, customId, food, foodName, guessDays, defaultQty, shortName } from './foods.js';
import { placeOf, firstOfKind, modeOf } from './state.js';
import { ICON, appIcon, wordmark } from './icons.js';
import { esc } from './ui.js';
import { homePage } from './views/home.js';
import { foodPage } from './views/food.js';
import { addPage, scanPage, waysPage, reviewPage, buildLines, newLine, putLines } from './views/add.js';
import { atePage, ateResult, questionsFor } from './views/ate.js';
import { understand } from './ai.js';
import { weekPage } from './views/week.js';
import { shopPage, shopCheck } from './views/shop.js';
import { householdPage } from './views/household.js';
import { signInPage, userList } from './views/people.js';
import { widgetsPage, lockPage } from './views/phone.js';
import { onboardingPage, freshOnboarding } from './views/onboarding.js';
import { lotSheet, placesSheet, measureSheet, typeSheet, consentSheet, emailSheet, pickSheet } from './views/sheets.js';

const root = document.getElementById('app');
const ROUTES = { home: homePage, food: foodPage, add: addPage, ways: waysPage, scan: scanPage, review: reviewPage, ate: atePage, week: weekPage, plan: weekPage, shop: shopPage, settings: householdPage, widgets: widgetsPage, lock: lockPage };
const FULL = new Set(['add', 'scan', 'ate', 'widgets', 'lock']); // phone: no tab bar
const NO_TABS = new Set([...FULL, 'review', 'ways']);
const SHEETS = { lot: lotSheet, places: placesSheet, measure: measureSheet, type: typeSheet, consent: consentSheet, email: emailSheet, pick: pickSheet };
const NAV = [['home', 'Home', 'home'], ['food', 'Food at home', 'fridge'], ['week', 'Week calendar', 'plan'], ['shop', 'Shopping list', 'cart'], ['settings', 'Household', 'settings']];
const TABS = [['home', 'Home', 'fridge'], ['food', 'Food', 'list'], ['week', 'Week', 'plan'], ['shop', 'Shop', 'cart'], ['settings', 'Me', 'user']];

const freshAdd = (over = {}) => ({ mode: 'photo', picks: [], scanning: false, src: 'picks', img: null, lines: [], edit: null, editQty: null, ...over });
const freshAte = () => ({ phase: 'idle', text: '', items: [], questions: [], answers: {}, step: 0, result: null });
const freshUi = (keep = {}) => ({
  view: prefs.get('view', 'picture'), sheet: null, add: freshAdd(), ate: freshAte(),
  food: { place: null, q: '', own: 'all', view: 'picture' }, toast: null, shopAlert: null, flash: false,
  weekOffset: 0, confirm: null, lockDismissed: false, userMenu: false, adding: false, onb: freshOnboarding(), ...keep,
});
const app = { store: null, route: 'home', ui: freshUi() };

// ---------- rendering ----------

function shell(content) {
  const { store, ui, route } = app;
  const s = store.state, p = store.persona;
  const name = s.profile.name || p.name;
  const side = `<aside class="side" aria-label="Main">
    <div class="side-brand">${appIcon({ size: 32, badge: false })}${wordmark('sm')}</div>
    <div class="side-acts"><button class="btn btn-primary" data-act="go" data-arg="add">${ICON.plus({ size: 18, stroke: 2.4 })}Add food</button><button class="btn btn-secondary" data-act="go" data-arg="ate">${ICON.minus({ size: 18, stroke: 2.4 })}I ate</button></div>
    <nav class="side-nav">${NAV.map(([r, t, ic]) => `<button class="nav-item${route === r || (r === 'home' && route === 'home') ? ' on' : ''}" data-act="go" data-arg="${r}"${route === r ? ' aria-current="page"' : ''}>${ICON[ic]({ size: 20 })}${t}</button>`).join('')}</nav>
    <div class="side-bottom">
      ${ui.userMenu ? userList(app, { compact: true }) : ''}
      <button class="side-me" data-act="user-menu" aria-expanded="${!!ui.userMenu}" aria-label="Signed in as ${esc(name)}. Switch user"><span class="avatar av-0">${esc(name[0])}</span><span><b>${esc(name)}</b><small>${esc(s.house?.name || 'Lives alone')}</small></span>${ICON.settings({ size: 16 })}</button>
    </div>
  </aside>`;
  const tabs = NO_TABS.has(route) ? '' : `<nav class="tabs" aria-label="Main">${TABS.map(([r, t, ic]) => `<button class="tab${route === r ? ' on' : ''}" data-act="go" data-arg="${r}"${route === r ? ' aria-current="page"' : ''}>${ICON[ic]({ size: 22 })}<span>${t}</span></button>`).join('')}</nav>`;
  const pill = route === 'home' || route === 'food'
    ? `<div class="pill-bar"><div class="seg"><button class="seg-primary" data-act="go" data-arg="add">${ICON.plus({ size: 18, stroke: 2.4 })}Add food</button><button class="seg-plain" data-act="go" data-arg="ate">${ICON.minus({ size: 18, stroke: 2.4 })}I ate</button></div></div>` : '';
  const toast = ui.toast ? `<div class="toast" role="status">${esc(ui.toast.msg)}${ui.toast.undo ? `<button data-act="undo" data-arg="${esc(ui.toast.undo)}">Undo</button>` : ''}</div>` : '';
  return `<div class="shell r-${route}${FULL.has(route) ? ' full' : ''}${NO_TABS.has(route) ? ' no-tabs' : ''}">${side}<main class="main" id="main">${content}</main>${pill}${tabs}${toast}</div>`;
}

function render() {
  const scroller = root.querySelector('.main');
  const keep = scroller && root.dataset.route === app.route ? scroller.scrollTop : 0;
  const sheetWasOpen = !!root.querySelector('.sheet');
  const active = document.activeElement;
  const focusId = active && root.contains(active) && active.id ? active.id : null;
  const sel = focusId && 'selectionStart' in active ? [active.selectionStart, active.selectionEnd] : null;

  let html;
  if (app.ui.adding) html = onboardingPage(app);
  else if (!app.store) html = signInPage();
  else if (!app.store.persona.builtin && !app.store.state.setUp) html = onboardingPage(app);
  else {
    const sheet = app.ui.sheet && SHEETS[app.ui.sheet.type] ? SHEETS[app.ui.sheet.type](app) : '';
    html = shell(ROUTES[app.route](app)) + sheet;
  }
  const enteringWeek = app.route === 'week' && root.dataset.route !== 'week';
  root.innerHTML = html;
  root.dataset.route = app.route;
  // Phone: the seven days scroll sideways; open on today, like the personal system's week page.
  const todayCard = root.querySelector('.day.today');
  const strip = todayCard?.parentElement;
  if (enteringWeek && strip && strip.scrollWidth > strip.clientWidth) strip.scrollLeft = todayCard.offsetLeft - strip.offsetLeft - 16;
  document.body.dataset.route = app.route;
  const next = root.querySelector('.main');
  if (next) next.scrollTop = keep;
  if (sheetWasOpen) root.querySelector('.sheet-wrap')?.classList.add('still');
  if (focusId) {
    const el = document.getElementById(focusId);
    if (el) { el.focus({ preventScroll: true }); if (sel && el.setSelectionRange) try { el.setSelectionRange(...sel); } catch { /* not a text input */ } }
  } else if (app.ui.sheet && !sheetWasOpen) root.querySelector('.sheet button:not(.sheet-x), .sheet input, .sheet select')?.focus({ preventScroll: true });
}

function routeFromHash() {
  const r = location.hash.replace(/^#\/?/, '') || 'home';
  if (!ROUTES[r]) return 'home';
  if (r === 'review' && !app.ui.add.lines.length && app.ui.add.src !== 'picks') return 'add';
  return r;
}

function go(route) {
  const target = route === 'home' ? '#/' : `#/${route}`;
  if (location.hash === target || (route === 'home' && (!location.hash || location.hash === '#'))) { onRoute(); return; }
  location.hash = target;
}

function onRoute() {
  const r = routeFromHash();
  if (r !== 'ate') stopVoice();
  if (r === 'add' && !['scan', 'review', 'ways'].includes(app.route)) app.ui.add = freshAdd();
  if (r === 'ate' && app.route !== 'ate') app.ui.ate = freshAte();
  if (r !== app.route) { app.ui.confirm = null; app.ui.userMenu = false; }
  if (r === 'lock' && app.route !== 'lock') app.ui.lockDismissed = false;
  app.route = r;
  if (!app.ui.keepSheet) app.ui.sheet = null;
  app.ui.keepSheet = false;
  render();
  if (r !== 'review') document.getElementById('main')?.scrollTo?.(0, 0);
}

// ---------- users ----------

async function openUser(id) {
  const persona = userProfile(id);
  if (!persona) { app.store = null; return; }
  app.store = await openStore(persona, CONFIG.store ? httpAdapter(CONFIG.store) : localAdapter);
  app.store.subscribe(onStore);
  signIn(id);
}

function onStore() { render(); }

function toast(msg, undo = null) {
  app.ui.toast = { msg, undo };
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { app.ui.toast = null; render(); }, 5000);
}


// ---------- voice ----------

let rec = null;

function stopVoice() {
  if (rec) { rec.onend = null; try { rec.abort(); } catch { /* already stopped */ } rec = null; }
}

// After speaking: let the AI (or the built-in reader) work out the food, then ask about anything
// without a number ("is there any curry left?"), then show the summary.
async function finishVoice() {
  const a = app.ui.ate;
  a.phase = 'thinking';
  render();
  const s = app.store.state;
  const stock = [...new Map([...s.lots.values()].map((l) => [l.food, { food: l.food, name: foodName(l.food, 2, l) }])).values()];
  const [{ items }] = await Promise.all([understand(a.text, stock), new Promise((r) => setTimeout(r, 700))]);
  if (app.ui.ate !== a || app.route !== 'ate') return;
  a.items = items;
  a.questions = questionsFor(app.store, items);
  a.answers = {};
  a.step = 0;
  if (a.questions.length) { a.phase = 'ask'; render(); return; }
  a.result = ateResult(app.store, items);
  a.phase = 'done';
  render();
}

function listen() {
  stopVoice();
  app.ui.ate = { ...freshAte(), phase: 'listening' };
  render();
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { app.ui.ate.phase = 'nosupport'; app.ui.ate.typing = true; render(); return; }
  rec = new SR();
  rec.lang = 'en-AU';
  rec.interimResults = true;
  rec.continuous = true;
  let finalText = '';
  rec.onresult = (e) => {
    let interim = '';
    for (let k = e.resultIndex; k < e.results.length; k++) {
      const r = e.results[k];
      if (r.isFinal) finalText += `${r[0].transcript} `; else interim += r[0].transcript;
    }
    app.ui.ate.text = `${finalText}${interim}`.trim();
    render();
  };
  rec.onerror = (e) => {
    if (['not-allowed', 'service-not-allowed', 'audio-capture', 'network'].includes(e.error)) { stopVoice(); app.ui.ate.phase = 'nosupport'; app.ui.ate.typing = true; render(); }
  };
  rec.onend = () => { rec = null; if (app.ui.ate.phase === 'listening') finishVoice(); };
  try { rec.start(); } catch { rec = null; app.ui.ate.phase = 'nosupport'; app.ui.ate.typing = true; render(); }
}

function stopListening() {
  if (rec) { rec.stop(); return; }
  finishVoice();
}

// ---------- actions ----------

const line = (k) => app.ui.add.lines.find((l) => l.key === k);
const split = (arg) => String(arg ?? '').split('|');
const val = (id) => document.getElementById(id)?.value ?? '';
const dispatch = (e) => app.store.dispatch(e);
const lotName = (id) => { const l = app.store.state.lots.get(id); return l ? foodName(l.food, 2, l) : 'Food'; };

function startScan(img) {
  const a = app.ui.add;
  if (a.scanning) return;
  const p = app.store.persona;
  if (img) a.img = img;
  const toReview = () => {
    a.scanning = false;
    a.src = p.photo ? a.mode : 'picks';
    a.lines = buildLines(app, a.src);
    go('review');
  };
  if (!p.photo) { toReview(); return; }
  a.scanning = true;
  render();
  setTimeout(() => { if (['add', 'scan'].includes(app.route)) toReview(); }, 1400);
}

function addShop(name, own = 'mine') {
  dispatch({ type: 'shop.add', id: `s${Date.now().toString(36)}`, name, own, who: app.store.state.profile.name });
  toast(`${name} added to the list.`);
}

const ACT = {
  go: (r) => go(r),
  noop() {},
  view() { app.ui.view = app.ui.view === 'list' ? 'picture' : 'list'; prefs.set('view', app.ui.view); render(); },
  lot(id) { app.ui.sheet = { type: 'lot', arg: id, edit: null }; render(); },
  sheet(arg) {
    const [type, x] = split(arg).join('|').split(':');
    app.ui.sheet = type === 'measure' ? { type, place: x, phase: 'pick' } : { type };
    render();
  },
  close() { app.ui.sheet = null; render(); },
  'sheet-edit'(what) { app.ui.sheet.edit = app.ui.sheet.edit === what ? null : what; render(); },

  async use(arg) {
    const [lot, how] = split(arg);
    const name = lotName(lot);
    if (app.ui.sheet?.type === 'lot') app.ui.sheet = null;
    const e = await dispatch({ type: 'use', lot, how });
    toast(how === 'some' ? `${name}: used some.` : `${name}: one fewer.`, e.id);
  },
  est(arg) {
    const [id, n] = split(arg);
    const l = app.store.state.lots.get(id);
    if (!l) return;
    const on = addDays(l.date.on, Number(n));
    if (daysBetween(app.store.today, on) < 0) return;
    dispatch({ type: 'fix', lot: id, on });
  },
  amount(arg) { const [lot, value] = split(arg); dispatch({ type: 'amount', lot, value }); },
  open(id) { dispatch({ type: 'open', lot: id }); },
  async freeze(id) {
    const fz = firstOfKind(app.store.state, 'frozen');
    if (!fz) return;
    const e = await dispatch({ type: 'freeze', lot: id, place: fz.id });
    toast(`${lotName(id)} is in the ${fz.name.toLowerCase()}.`, e.id);
  },
  async thaw(id) {
    const s = app.store.state, l = s.lots.get(id);
    const cold = firstOfKind(s, 'cold');
    if (!l || !cold) return;
    if (app.ui.sheet?.type === 'lot') app.ui.sheet = null;
    const e = await dispatch({ type: 'thaw', lot: id, place: cold.id, spot: spotFor(l.food, l.owner, app.store.persona, cold) });
    toast(`${shortName(l.food, l)} moves to the ${cold.name.toLowerCase()} tonight.`, e.id);
  },
  async toss(id) {
    const name = lotName(id);
    app.ui.sheet = null;
    const e = await dispatch({ type: 'toss', lot: id });
    toast(`${name} removed.`, e.id);
  },
  async 'out-day'(day) {
    const on = modeOf(app.store.state, day) !== 'out';
    const e = await dispatch({ type: 'plan', day, mode: on ? 'out' : 'cook' });
    toast(on ? `${day === app.store.today ? 'Tonight' : 'That night'}: eating out. Reminders move to the next day.` : 'Back to eating at home.', e.id);
  },
  out() { return ACT['out-day'](app.store.today); },
  'week-move'(n) { app.ui.weekOffset = Number(n) === 0 ? 0 : (app.ui.weekOffset || 0) + Number(n); render(); },
  async qty(arg) {
    const [lot, n] = split(arg);
    const name = lotName(lot);
    const q = Math.max(0, Number(n));
    if (q === 0 && app.ui.sheet?.type === 'lot') app.ui.sheet = null;
    const e = await dispatch({ type: 'qty', lot, qty: q });
    if (q === 0) toast(`${name}: all gone.`, e.id);
  },
  async later() { await dispatch({ type: 'snooze', until: addDays(app.store.today, 1) }); toast('Reminder moved to tomorrow.'); },
  'lock-dismiss'() { app.ui.lockDismissed = true; render(); },
  async undo(arg) {
    for (const id of split(arg).join(',').split(',').filter(Boolean)) await dispatch({ type: 'undo', target: id });
    app.ui.toast = null;
    render();
  },

  place(id) { app.ui.food.place = id; render(); },
  'food-view'(v) { app.ui.food.view = v; render(); },
  own(v) { app.ui.food.own = v; render(); },
  'place-remove'(id) { app.ui.sheet.remove = id; render(); },
  'place-remove-cancel'() { app.ui.sheet.remove = null; render(); },
  async 'place-remove-go'(id) {
    const moveTo = val('rm-to') || null;
    app.ui.sheet.remove = null;
    await dispatch({ type: 'place.remove', id, moveTo });
  },
  async 'place-add'() {
    const name = val('np-name').trim();
    if (!name) { document.getElementById('np-name')?.focus(); return; }
    await dispatch({ type: 'place.add', id: `p${Date.now().toString(36)}`, name, kind: val('np-kind') || 'room' });
    toast(`${name} added.`);
  },
  async 'place-add-quick'(arg) { const [name, kind] = split(arg); await dispatch({ type: 'place.add', id: `p${Date.now().toString(36)}`, name, kind }); toast(`${name} added.`); },
  'measure-demo'() { measureStart(null); },
  'measure-again'() { app.ui.sheet = { type: 'measure', place: app.ui.sheet.place, phase: 'pick' }; render(); },
  async 'measure-save'() {
    const m = app.ui.sheet;
    await dispatch({ type: 'place.edit', id: m.place, full: m.val, src: 'photo' });
    app.ui.sheet = null;
    toast('Saved. The photo was not kept.');
  },

  method(k) {
    const s = app.store.state;
    if (k === 'email') { app.ui.sheet = { type: 'email' }; render(); return; }
    if (k === 'type') { app.ui.sheet = { type: 'type', name: '' }; render(); return; }
    if (k === 'account') { if (s.links.account) toast('Your supermarket account is already linked.'); else { app.ui.sheet = { type: 'consent' }; render(); } return; }
    app.ui.add = freshAdd({ mode: k });
    go('scan');
  },
  usual(f) {
    const picks = app.ui.add.picks;
    app.ui.add.picks = picks.includes(f) ? picks.filter((x) => x !== f) : [...picks, f];
    render();
  },
  mode(m) { app.ui.add.mode = m; app.ui.add.img = null; render(); },
  shoot() { startScan(null); },
  review(src) {
    app.ui.add = freshAdd({ src, mode: src });
    app.ui.add.lines = buildLines(app, src);
    app.ui.sheet = null;
    go('review');
  },
  bags(arg) {
    const [k, n] = split(arg);
    const l = line(k);
    l.bags = n === '+' ? Math.min(12, l.bags + 1) : Number(n);
    const fz = firstOfKind(app.store.state, 'frozen');
    if (l.bags > 1 && fz) l.place = fz.id;
    render();
  },
  answer(arg) {
    const [k, f] = split(arg);
    const l = line(k);
    l.answer = f;
    if (l.date?.kind === 'est' && l.date.days != null) l.date = { kind: 'est', days: guessDays(f) };
    render();
  },
  owner(k) { const l = line(k); l.owner = l.owner === 'shared' ? 'me' : 'shared'; render(); },
  'line-place'(k) {
    const l = line(k), ps = app.store.state.places;
    if (!ps.length) return;
    const i = ps.findIndex((p) => p.id === l.place);
    l.place = ps[(i + 1) % ps.length].id;
    if (placeOf(app.store.state, l.place)?.kind !== 'frozen') l.bags = 1;
    render();
  },
  'line-edit'(k) { app.ui.add.edit = app.ui.add.edit === k ? null : k; render(); },
  'line-days'(arg) { const [k, n] = split(arg); const l = line(k); l.date = { ...l.date, kind: 'est', days: Math.max(0, (l.date.days ?? 0) + Number(n)) }; render(); },
  'qty-edit'(k) { app.ui.add.editQty = app.ui.add.editQty === k ? null : k; render(); },
  'line-qty'(arg) {
    const [k, n] = split(arg);
    const l = line(k);
    const step = { pc: 1, bag: 1, g: 250, L: 0.5 }[l.unit] || 1;
    l.qty = Math.max(step, l.qty + Number(n) * step);
    render();
  },
  'line-remove'(k) { line(k).skip = true; render(); },
  'line-restore'(k) { line(k).skip = false; render(); },
  'line-skip'(k) { line(k).skip = true; render(); },
  'line-keep'(k) { line(k).keep = true; line(k).nonfood = false; render(); },
  'pick-add'(f) {
    app.ui.add.lines.push(newLine(app, { food: f, ...defaultQty(f), date: { kind: 'est', days: guessDays(f), guess: true } }));
    app.ui.sheet = null;
    render();
  },
  async 'put-all'() {
    const lines = putLines(app);
    if (!lines.length) return;
    const src = app.ui.add.src;
    app.ui.add = freshAdd();
    app.ui.flash = true;
    setTimeout(() => { app.ui.flash = false; }, 1500);
    go('home');
    const e = await dispatch({ type: 'put', lines, source: ['receipt', 'email'].includes(src) ? src : undefined });
    toast(`${lines.length} item${lines.length > 1 ? 's' : ''} added.`, e.id);
  },
  async 'type-add'() {
    const name = val('qa-name').trim();
    if (!name) { document.getElementById('qa-name')?.focus(); return; }
    const s = app.store.state, p = app.store.persona;
    const f = matchFood(name) || customId(name);
    const known = !!matchFood(name);
    const place = placeOf(s, val('qa-place')) || s.places[0];
    const owner = val('qa-own') || 'me';
    const d = val('qa-date');
    const date = d && d !== 'est' ? { kind: d.split('|')[0], on: d.split('|')[1] } : { kind: 'est', days: guessDays(f), guess: true };
    const qty = parseFloat(val('qa-qty')) || (known ? defaultQty(f).qty : 1);
    const unit = known ? food(f).unit : 'pc';
    app.ui.sheet = null;
    const e = await dispatch({ type: 'put', lines: [{ food: f, name: known ? null : name, cat: known ? null : 'other', qty, unit, place: place.id, spot: spotFor(f, owner, p, place), owner, date }] });
    toast(`${known ? foodName(f, qty) : name} added to the ${place.name.toLowerCase()}.`, e.id);
  },
  async link(arg) {
    const [what, on] = split(arg);
    app.ui.sheet = null;
    await dispatch({ type: 'link', what, on: on === 'on', senders: [] });
    toast(what === 'account' ? (on === 'on' ? 'Supermarket account linked.' : 'Supermarket account unlinked.') : on === 'on' ? 'Email connected.' : 'Email disconnected.');
  },
  async 'email-connect'() {
    const senders = [['em-c1', 'Online supermarket orders'], ['em-c2', 'In-store e-receipts'], ['em-c3', 'Meal-kit and delivery apps']].filter(([id]) => document.getElementById(id)?.checked).map(([, t]) => t);
    app.ui.keepSheet = true;
    await dispatch({ type: 'link', what: 'email', on: true, senders });
  },

  listen: () => listen(),
  stop: () => stopListening(),
  'ate-type'() { app.ui.ate.typing = true; render(); document.getElementById('ate-text')?.focus(); },
  'ate-typed'() {
    const text = val('ate-text').trim();
    if (!text) { document.getElementById('ate-text')?.focus(); return; }
    stopVoice();
    app.ui.ate = { ...freshAte(), text };
    finishVoice();
  },
  'ate-answer'(v) {
    const a = app.ui.ate;
    a.answers[a.questions[a.step].food] = v;
    if (a.step < a.questions.length - 1) a.step += 1;
    else { a.result = ateResult(app.store, a.items, a.answers); a.phase = 'done'; }
    render();
  },
  'ate-back'() {
    const a = app.ui.ate;
    if (a.step > 0) { a.step -= 1; render(); } else listen();
  },
  async 'ate-done'() {
    const ev = app.ui.ate.result?.event;
    app.ui.ate = freshAte();
    go('home');
    if (ev) { const e = await dispatch(ev); toast('Updated your fridge.', e.id); }
  },

  'shop-done'(id) { dispatch({ type: 'shop.done', id }); },
  'shop-claim'(id) { dispatch({ type: 'shop.claim', id, who: app.store.state.profile.name }); },
  'shop-add'() {
    const name = val('shop-in').trim();
    if (!name) return;
    const al = shopCheck(app, name);
    if (al) { app.ui.shopAlert = al; render(); return; }
    addShop(name);
  },
  'shop-suggest'(name) {
    const al = shopCheck(app, name);
    if (al) { app.ui.shopAlert = al; render(); return; }
    addShop(name);
  },
  'shop-alert'(i) {
    const a = app.ui.shopAlert?.acts[Number(i)];
    app.ui.shopAlert = null;
    if (a?.add) addShop(a.add, a.own); else render();
  },
  'shop-together'(arg) { const [who, when] = split(arg); toast(`Suggested ${when} to ${who}.`); render(); },

  set(key) { dispatch({ type: 'set', key, value: !app.store.state.settings[key] }); },
  confirm(what) { app.ui.confirm = what || null; render(); },
  async house(action) {
    if (action === 'join' && !val('join-code').trim()) { document.getElementById('join-code')?.focus(); return; }
    const code = action === 'create' ? `SL-${1000 + Math.floor(Math.random() * 9000)}` : action === 'join' ? val('join-code').trim().toUpperCase() : null;
    app.ui.confirm = null;
    await dispatch({ type: 'house', action, code });
  },
  async 'copy-code'(code) { try { await navigator.clipboard.writeText(code); toast('Code copied.'); } catch { toast(code); } render(); },
  export() {
    const blob = new Blob([app.store.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `eat-it-${app.store.persona.id}-${app.store.today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  async reset() {
    const p = app.store.persona;
    app.ui.confirm = null;
    await app.store.reset();
    if (p.builtin) { restartUser(p.id); await openUser(p.id); }
    app.ui = freshUi({ view: app.ui.view });
    go('home');
  },

  // ----- users -----
  'user-menu'() { app.ui.userMenu = !app.ui.userMenu; render(); },
  async user(id) {
    stopVoice();
    await openUser(id);
    app.ui = freshUi({ view: app.ui.view });
    go('home');
  },
  'user-add'() { stopVoice(); app.ui = freshUi({ view: app.ui.view, adding: true }); render(); },
  'user-add-cancel'() { app.ui.adding = false; render(); },
  'sign-out'() { stopVoice(); signOut(); app.store = null; app.ui = freshUi({ view: app.ui.view }); go('home'); },
  async 'user-remove'() {
    const id = app.store.persona.id;
    await app.store.reset();
    removeUser(id);
    ACT['sign-out']();
  },

  ob(step) {
    const n = document.getElementById('ob-name');
    if (n) app.ui.onb.name = n.value.trim();
    const c = document.getElementById('ob-code');
    if (c) app.ui.onb.code = c.value.trim();
    app.ui.onb.step = step;
    render();
  },
  'ob-add'() {
    const name = val('ob-place').trim();
    if (!name) return;
    app.ui.onb.extra.push({ name, kind: val('ob-kind') || 'room' });
    render();
  },
  'ob-del'(i) { app.ui.onb.extra.splice(Number(i), 1); render(); },
  'ob-house'(v) { app.ui.onb.house = v; render(); },
  async 'ob-finish'() {
    const o = app.ui.onb;
    const c = document.getElementById('ob-code');
    if (c) o.code = c.value.trim().toUpperCase();
    const BASE = { fridge: ['Fridge', 'cold'], freezer: ['Freezer', 'frozen'], pantry: ['Cupboard', 'room'] };
    const places = [...Object.entries(BASE).filter(([id]) => o.places[id]).map(([id, [name, kind]]) => ({ id, name, kind, sub: '', full: null })),
      ...o.extra.map((x, i) => ({ id: `x${i}`, name: x.name, kind: x.kind, sub: '', full: null }))];
    const code = o.house === 'create' ? `SL-${1000 + Math.floor(Math.random() * 9000)}` : o.house === 'join' ? (o.code || null) : null;
    if (app.ui.adding) { await openUser(addUser(o.name)); app.ui.adding = false; }
    await dispatch({ type: 'setup', name: o.name || app.store.persona.name, places, house: o.house, code });
    go('home');
  },
};

function measureStart(img) {
  const m = app.ui.sheet;
  m.img = img; m.phase = 'scan';
  m.val = img ? 55 + Math.floor(Math.random() * 7) * 5 : 70; // simulated: the prototype does not analyse the photo
  render();
  setTimeout(() => { if (app.ui.sheet?.type === 'measure' && app.ui.sheet.phase === 'scan') { app.ui.sheet.phase = 'done'; render(); } }, 1500);
}

const CHANGE = {
  async 'lot-date'(arg, v) { if (!v) return; const [kind, on] = v.split('|'); app.ui.sheet.edit = null; await dispatch({ type: 'date', lot: arg, date: { kind, on } }); },
  async 'lot-place'(arg, v) {
    const s = app.store.state, l = s.lots.get(arg), pl = placeOf(s, v);
    if (!l || !pl) return;
    if (pl.kind === 'frozen' && l.date?.kind !== 'frozen') { await dispatch({ type: 'freeze', lot: arg, place: pl.id }); return; }
    if (pl.kind !== 'frozen' && l.date?.kind === 'frozen') { await dispatch({ type: 'thaw', lot: arg, place: pl.id, spot: spotFor(l.food, l.owner, app.store.persona, pl) }); return; }
    await dispatch({ type: 'move', lot: arg, place: pl.id, spot: spotFor(l.food, l.owner, app.store.persona, pl) });
  },
  async 'lot-spot'(arg, v) { const l = app.store.state.lots.get(arg); if (l) await dispatch({ type: 'move', lot: arg, place: l.place, spot: v }); },
  'place-name'(id, v) { if (v.trim()) dispatch({ type: 'place.edit', id, name: v.trim() }); },
  'place-kind'(id, v) { dispatch({ type: 'place.edit', id, kind: v }); },
  'place-full'(id, v) { dispatch({ type: 'place.edit', id, full: Number(v), src: 'hand' }); },
  'measure-val'(_a, v) { app.ui.sheet.val = Number(v); render(); },
  'line-date'(k, v) { if (!v) return; const [kind, on] = v.split('|'); line(k).date = { kind, on }; render(); },
  'profile-name'(_a, v) {
    if (!v.trim()) return;
    if (!app.store.persona.builtin) renameUser(app.store.persona.id, v.trim());
    dispatch({ type: 'profile', name: v.trim() });
  },
  'ob-place'(id, _v, el) { app.ui.onb.places[id] = el.checked; },
};

root.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || !root.contains(el)) return;
  // A sheet's backdrop closes it; clicks inside the sheet itself don't.
  if (el.classList.contains('sheet-wrap') && e.target !== el) return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset.arg); }
});

root.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.file) {
    const f = el.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    if (el.dataset.file === 'measure') measureStart(url); else startScan(url);
    return;
  }
  const fn = CHANGE[el.dataset.change];
  if (fn) fn(el.dataset.arg, el.value, el);
});

root.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.input === 'food-q') { app.ui.food.q = el.value; render(); }
  if (el.dataset.input === 'qa-name' && app.ui.sheet) { app.ui.sheet.name = el.value; render(); }
  if (el.dataset.change === 'measure-val') { app.ui.sheet.val = Number(el.value); const out = root.querySelector('.measure-out'); if (out) out.textContent = `≈ ${el.value}% full`; }
});

root.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.dataset?.enter) { e.preventDefault(); ACT[e.target.dataset.enter]?.(); }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && app.ui.sheet) { app.ui.sheet = null; render(); }
});

window.addEventListener('hashchange', onRoute);

// ---------- start ----------

(async () => {
  const params = new URLSearchParams(location.search);
  if (params.get('frame') === '0') document.body.classList.add('bare');
  const asked = params.get('user') || params.get('p');
  const id = asked && userProfile(asked) ? asked : currentUser();
  if (id) await openUser(id);
  onRoute();
})();

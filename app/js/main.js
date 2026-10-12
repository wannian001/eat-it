// Wiring: routes (#/add, #/ate ...), one click handler for every data-act, and the voice session.
import { PERSONAS, spotFor } from './seed.js';
import { addDays, daysBetween } from './dates.js';
import { CONFIG } from './config.js';
import { openStore, localAdapter, httpAdapter, prefs } from './store.js';
import { homeScreen, foodSheet } from './views/fridge.js';
import { addScreen, reviewScreen, pickSheet, buildLines, newLine, putLines, QTY_STEP } from './views/add.js';
import { ateScreen, ateResult } from './views/ate.js';
import { widgetsScreen, lockScreen } from './views/phone.js';
import { meSheet } from './views/me.js';
import { defaultQty, guessDays } from './foods.js';

const root = document.getElementById('app');
const ROUTES = { home: homeScreen, add: addScreen, review: reviewScreen, ate: ateScreen, widgets: widgetsScreen, lock: lockScreen };
const SHEETS = { food: foodSheet, pick: pickSheet, me: meSheet };

const freshAdd = () => ({ mode: 'photo', picks: [], scanning: false, lines: [], edit: null, editQty: null });
const freshAte = () => ({ phase: 'idle', text: '', result: null });
const app = { store: null, route: 'home', ui: { view: prefs.get('view', 'fridge'), sheet: null, add: freshAdd(), ate: freshAte() } };

// ---------- rendering ----------

function render() {
  if (!app.store) return;
  const scroller = root.querySelector('.scroll');
  const sheetWasOpen = !!root.querySelector('.sheet');
  const keep = scroller && root.dataset.route === app.route ? scroller.scrollTop : 0;
  const sheet = app.ui.sheet && SHEETS[app.ui.sheet.type] ? SHEETS[app.ui.sheet.type](app) : '';
  root.innerHTML = ROUTES[app.route](app) + sheet;
  root.dataset.route = app.route;
  // Only animate a sheet when it opens, not every time its content changes.
  if (sheetWasOpen) root.querySelector('.sheet-wrap')?.classList.add('still');
  const next = root.querySelector('.scroll');
  if (next) next.scrollTop = keep;
  if (sheet && !root.contains(document.activeElement)) root.querySelector('.sheet button')?.focus({ preventScroll: true });
}

function routeFromHash() {
  const r = location.hash.replace(/^#\/?/, '') || 'home';
  if (!ROUTES[r]) return 'home';
  if (r === 'review' && !app.ui.add.lines.length) return 'add';
  return r;
}

function go(route) {
  const target = route === 'home' ? '#/' : `#/${route}`;
  if (location.hash === target || (route === 'home' && !location.hash)) { onRoute(); return; }
  location.hash = target;
}

function onRoute() {
  const r = routeFromHash();
  if (r !== 'ate') stopVoice();
  if (r === 'add' && app.route !== 'review') app.ui.add = freshAdd();
  if (r === 'ate' && app.route !== 'ate') app.ui.ate = freshAte();
  app.route = r;
  app.ui.sheet = null;
  render();
}

// ---------- people ----------

async function openPerson(id) {
  const base = PERSONAS[id] || PERSONAS.john;
  const persona = base.demo ? base : { ...base, freezer: prefs.get('me-freezer', true) };
  const adapter = !base.demo && CONFIG.store ? httpAdapter(CONFIG.store) : localAdapter;
  app.store = await openStore(persona, adapter);
  app.store.subscribe(render);
  prefs.set('person', base.id);
}

// ---------- voice ----------

let rec = null;
let demoTimer = null;

function stopVoice() {
  if (demoTimer) { clearInterval(demoTimer); demoTimer = null; }
  if (rec) { rec.onend = null; try { rec.abort(); } catch { /* already stopped */ } rec = null; }
}

function finishVoice() {
  app.ui.ate.phase = 'done';
  app.ui.ate.result = ateResult(app.store, app.ui.ate.text);
  render();
}

function listen() {
  stopVoice();
  const p = app.store.persona;
  app.ui.ate = { phase: 'listening', text: '', result: null };
  render();
  // John and May say their storyboard line, word by word, so a screen recording is repeatable.
  if (p.said) {
    const words = p.said.split(' ');
    let i = 0;
    demoTimer = setInterval(() => {
      i += 1;
      app.ui.ate.text = words.slice(0, i).join(' ');
      render();
      if (i >= words.length) { clearInterval(demoTimer); demoTimer = null; }
    }, 260);
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { app.ui.ate.phase = 'nosupport'; render(); return; }
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
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
      stopVoice(); app.ui.ate.phase = 'nosupport'; render();
    }
  };
  rec.onend = () => { rec = null; if (app.ui.ate.phase === 'listening') finishVoice(); };
  try { rec.start(); } catch { rec = null; app.ui.ate.phase = 'nosupport'; render(); }
}

function stopListening() {
  if (demoTimer) { clearInterval(demoTimer); demoTimer = null; app.ui.ate.text = app.store.persona.said; }
  if (rec) { rec.stop(); return; } // onend finishes
  finishVoice();
}

// ---------- actions ----------

const line = (k) => app.ui.add.lines.find((l) => l.key === k);
const split = (arg) => String(arg).split('|');

const ACT = {
  go: (r) => go(r),
  view() { app.ui.view = app.ui.view === 'list' ? 'fridge' : 'list'; prefs.set('view', app.ui.view); render(); },
  me() { app.ui.sheet = { type: 'me' }; render(); },
  food(arg) { app.ui.sheet = { type: 'food', arg, edit: false }; render(); },
  close() { app.ui.sheet = null; render(); },

  use(arg) {
    const [lot, how] = split(arg);
    if (app.ui.sheet?.type === 'food') app.ui.sheet = null;
    app.store.dispatch({ type: 'use', lot, how });
  },
  'est-edit'() { app.ui.sheet.edit = true; render(); },
  est(arg) {
    const [id, n] = split(arg);
    const lot = app.store.state.lots.get(id);
    if (!lot) return;
    const on = addDays(lot.date.on, Number(n));
    if (daysBetween(app.store.today, on) < 0) return;
    app.store.dispatch({ type: 'fix', lot: id, on });
  },

  usual(f) {
    const picks = app.ui.add.picks;
    app.ui.add.picks = picks.includes(f) ? picks.filter((x) => x !== f) : [...picks, f];
    render();
  },
  mode(m) { app.ui.add.mode = m; render(); },
  shoot() {
    if (app.ui.add.scanning) return;
    const toReview = () => { app.ui.add.scanning = false; app.ui.add.lines = buildLines(app); go('review'); };
    if (!app.store.persona.scan) { toReview(); return; }
    app.ui.add.scanning = true;
    render();
    setTimeout(() => { if (app.route === 'add') toReview(); }, 1400);
  },
  bags(arg) {
    const [k, n] = split(arg);
    const l = line(k);
    l.bags = n === '+' ? Math.min(12, l.bags + 1) : Number(n);
    render();
  },
  answer(arg) {
    const [k, f] = split(arg);
    const l = line(k);
    l.answer = f;
    // The scanner's guess of days belonged to the food it thought it saw.
    if (l.date.kind === 'est' && l.date.days != null) l.date = { kind: 'est', days: guessDays(f) };
    render();
  },
  owner(arg) { const [k, o] = split(arg); line(k).owner = o; render(); },
  'line-edit'(k) { app.ui.add.edit = app.ui.add.edit === k ? null : k; render(); },
  'line-days'(arg) {
    const [k, n] = split(arg);
    const l = line(k);
    l.date = { kind: 'est', days: Math.max(0, (l.date.days ?? 0) + Number(n)) };
    render();
  },
  'qty-edit'(k) { app.ui.add.editQty = app.ui.add.editQty === k ? null : k; render(); },
  'line-qty'(arg) {
    const [k, n] = split(arg);
    const l = line(k);
    const step = QTY_STEP[l.unit] || 1;
    l.qty = Math.max(step, l.qty + Number(n) * step);
    render();
  },
  'line-remove'(k) { app.ui.add.lines = app.ui.add.lines.filter((l) => l.key !== k); render(); },
  pick() { app.ui.sheet = { type: 'pick' }; render(); },
  'pick-add'(f) {
    app.ui.add.lines.push(newLine(app, { food: f, ...defaultQty(f), date: { kind: 'est', days: guessDays(f) } }));
    app.ui.sheet = null;
    render();
  },
  async 'put-all'() {
    if (!app.ui.add.lines.length) return;
    const lines = putLines(app);
    app.ui.add = freshAdd();
    app.ui.flash = true;
    setTimeout(() => { app.ui.flash = false; }, 1200);
    go('home');
    await app.store.dispatch({ type: 'put', lines });
  },

  listen: () => listen(),
  stop: () => stopListening(),
  async 'ate-done'() {
    const ev = app.ui.ate.result?.event;
    app.ui.ate = freshAte();
    go('home');
    if (ev) await app.store.dispatch(ev);
  },

  out() { const s = app.store; s.dispatch({ type: 'out', on: !s.state.out[s.today] }); },
  thaw(id) {
    const lot = app.store.state.lots.get(id);
    if (lot) app.store.dispatch({ type: 'thaw', lot: id, spot: spotFor(lot.food, 'me', app.store.persona) });
  },
  later() { app.store.dispatch({ type: 'snooze', until: addDays(app.store.today, 1) }); },

  async person(id) {
    stopVoice();
    await openPerson(id);
    app.ui = { view: app.ui.view, sheet: null, add: freshAdd(), ate: freshAte() };
    go('home');
  },
  async 'me-freezer'() {
    prefs.set('me-freezer', !app.store.persona.freezer);
    await openPerson('me');
    app.ui.sheet = { type: 'me' };
    render();
  },
  export() {
    const blob = new Blob([app.store.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `eat-it-${app.store.persona.id}-${app.store.today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  'reset-ask'() { app.ui.sheet.confirm = true; render(); },
  'reset-cancel'() { app.ui.sheet.confirm = false; render(); },
  async reset() { app.ui.sheet = null; await app.store.reset(); go('home'); },
};

root.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || !root.contains(el)) return;
  // A sheet's backdrop closes it; clicks inside the sheet itself don't.
  if (el.classList.contains('sheet-wrap') && e.target !== el) return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset.arg); }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && app.ui.sheet) { app.ui.sheet = null; render(); }
});

window.addEventListener('hashchange', onRoute);

// ---------- start ----------

(async () => {
  const params = new URLSearchParams(location.search);
  if (params.get('frame') === '0') document.body.classList.add('bare');
  const asked = params.get('p');
  await openPerson(PERSONAS[asked] ? asked : prefs.get('person', 'john'));
  onRoute();
})();

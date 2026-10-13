// Shopping list (v0.2): a list shared with housemates, and checks before you buy what you already
// have or can't fit.

import { food, foodName, matchFood } from '../foods.js?v=1d4b465';
import { countOf, lotsOf, firstOfKind, hasFreezer } from '../state.js?v=1d4b465';
import { fmtDay, dateTag } from '../dates.js?v=1d4b465';
import { ICON } from '../icons.js?v=1d4b465';
import { esc, pic, pageHead, secHead } from '../ui.js?v=1d4b465';
import { roomBars, phoneTitle } from './parts.js?v=1d4b465';

// Before adding: do you already have it, is a housemate getting it, is there room? (R1, R4, R5)
export function shopCheck(app, name) {
  const s = app.store.state, p = app.store.persona, today = app.store.today;
  const f = matchFood(name);
  const me = s.profile.name;
  const shared = s.shop.find((x) => !x.done && x.own === 'shared' && x.who && x.who !== me && f && matchFood(x.name) === f);
  if (shared) return { title: `${shared.who} is already getting shared ${foodName(f, 2).toLowerCase()}`, body: 'You can still buy your own if you want some just for you.', acts: [{ t: 'Skip it' }, { t: `Add ${foodName(f, 2).toLowerCase()} just for me`, add: name, own: 'mine' }] };
  if (/family|bulk|\b2 ?kg|\b5 ?kg/i.test(name)) {
    const cold = firstOfKind(s, 'cold');
    const fz = firstOfKind(s, 'frozen');
    const full = (fz && f && food(f).cat === 'meat') ? fz : cold;
    const meat = f && food(f).cat === 'meat';
    if ((full && ((full.full ?? 0) >= 70 || meat)) || !hasFreezer(s)) {
      const haveBags = f ? lotsOf(s, f).filter((l) => l.bag).length : 0;
      return {
        title: full ? `Your ${full.name.toLowerCase()} is about ${full.full ?? 0}% full` : 'There may not be room',
        body: `${haveBags ? `You already have ${haveBags} bag${haveBags > 1 ? 's' : ''} at home. ` : ''}${hasFreezer(s) ? '' : "There's no freezer at home. "}${p.id === 'may' ? 'You usually shop again within two days.' : ''}`.trim(),
        acts: f === 'salad' ? [{ t: 'Get a single-serve kit', add: 'Salad kit, single serve', own: 'mine' }, { t: 'Add family size anyway', add: name, own: 'mine' }] : [{ t: 'Skip it this week' }, { t: 'Add anyway', add: name, own: 'mine' }],
      };
    }
  }
  if (f && countOf(s, f) > 0) {
    const l = lotsOf(s, f)[0];
    const t = dateTag(l.date, today).text;
    return { title: `You have ${countOf(s, f)} ${foodName(f, countOf(s, f), l).toLowerCase()} at home`, body: t ? `${t}.` : '', acts: [{ t: 'Skip it' }, { t: 'Add anyway', add: name, own: 'mine' }] };
  }
  return null;
}

export function shopPage(app) {
  const s = app.store.state, p = app.store.persona, today = app.store.today;
  const mates = s.house?.mates || [];
  const me = s.profile.name;
  const sub = mates.length ? `<button class="link" data-act="go" data-arg="settings">Shared with ${esc(mates.map((m) => m.name).join(' and '))} ›</button>` : `Just you. <button class="link" data-act="go" data-arg="settings">Invite housemates ›</button>`;
  const al = app.ui.shopAlert;
  const alert = al ? `<div class="card card-warn" role="status"><p class="card-t">${esc(al.title)}</p>${al.body ? `<p>${esc(al.body)}</p>` : ''}<div class="btn-row wrap">${al.acts.map((a, i) => `<button class="btn ${i === 0 ? 'btn-primary' : 'btn-secondary'} sm" data-act="shop-alert" data-arg="${i}">${esc(a.t)}</button>`).join('')}</div></div>` : '';
  const rows = s.shop.map((it) => {
    const f = matchFood(it.name);
    const parts = [];
    if (mates.length) { parts.push(it.own === 'shared' ? 'Shared' : 'Mine'); parts.push(it.done ? 'bought' : it.who ? (it.who === me ? "you're getting it" : `${it.who} is getting it`) : 'nobody yet'); }
    if (it.note) parts.push(it.note);
    return `<li class="srow${it.done ? ' done' : ''}"><button class="tick${it.done ? ' on' : ''}" data-act="shop-done" data-arg="${esc(it.id)}" aria-pressed="${!!it.done}" aria-label="Mark ${esc(it.name)} as bought">${it.done ? ICON.check({ size: 14, stroke: 3 }) : ''}</button>${f ? pic(f, { size: 30 }) : pic('x', { size: 30, lot: { cat: 'other', name: it.name } })}<span class="r-main"><b>${esc(it.name)}</b>${parts.length ? `<small>${esc(parts.join(' · '))}</small>` : ''}</span>${!it.who && !it.done ? `<button class="chip-btn" data-act="shop-claim" data-arg="${esc(it.id)}">I'll get it</button>` : ''}</li>`;
  }).join('');
  return `<div class="page shop">
    ${phoneTitle(app, 'Shopping list')}
    <div class="desk-only">${pageHead(esc(fmtDay(today)), 'Shopping list', sub)}</div>
    <p class="phone-only psub pad">${sub}</p>
    <div class="cols2">
      <div class="stack">
        ${alert}
        <section>${secHead('List')}
          <div class="card flush"><ul class="slist">${rows || '<li class="srow"><span class="muted">Nothing on the list.</span></li>'}</ul>
          <div class="addrow"><input id="shop-in" type="text" placeholder="Add something" autocomplete="off" aria-label="Add to the shopping list" data-enter="shop-add"><button class="btn btn-primary sm" data-act="shop-add">Add</button></div></div>
          <div class="chips sugg"><span class="muted sm-t">Try:</span>${(p.suggest || []).map((x) => `<button class="chip" data-act="shop-suggest" data-arg="${esc(x)}">${matchFood(x) ? pic(matchFood(x), { size: 18 }) : ''}${esc(x)}</button>`).join('')}</div>
        </section>
      </div>
      <div class="stack">
        <section>${secHead('Room at home before you buy', '<button class="link" data-act="sheet" data-arg="places">Update</button>')}<div class="card flush">${roomBars(app)}</div></section>
      </div>
    </div>
  </div>`;
}

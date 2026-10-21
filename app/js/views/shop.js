// Shopping list (v0.2): a list shared with housemates, and checks before you buy what you already
// have or can't fit.

import { food, foodName, matchFood } from '../foods.js?v=a3e659d';
import { countOf, lotsOf, firstOfKind, hasFreezer } from '../state.js?v=a3e659d';
import { fmtDay, dateTag } from '../dates.js?v=a3e659d';
import { ICON } from '../icons.js?v=a3e659d';
import { esc, pic, pageHead, secHead } from '../ui.js?v=a3e659d';
import { roomBars, phoneTitle } from './parts.js?v=a3e659d';
import { L, isZh, dz, andList } from '../i18n.js?v=a3e659d';

// Before adding: do you already have it, is a housemate getting it, is there room? (R1, R4, R5)
export function shopCheck(app, name) {
  const s = app.store.state, p = app.store.persona, today = app.store.today;
  const f = matchFood(name);
  const me = s.profile.name;
  const shared = s.shop.find((x) => !x.done && x.own === 'shared' && x.who && x.who !== me && f && matchFood(x.name) === f);
  if (shared) return { title: L(`${shared.who} is already getting shared ${foodName(f, 2).toLowerCase()}`, `${shared.who} 已经在买公共的${foodName(f, 2)}了`), body: L('You can still buy your own if you want some just for you.', '如果想要自己单独的一份，还是可以买。'), acts: [{ t: L('Skip it', '不买了') }, { t: L(`Add ${foodName(f, 2).toLowerCase()} just for me`, `给自己加一份${foodName(f, 2)}`), add: name, own: 'mine' }] };
  if (/family|bulk|\b2 ?kg|\b5 ?kg|家庭装|大包装|批发|2 ?(?:kg|公斤)|5 ?(?:kg|公斤)/i.test(name)) {
    const cold = firstOfKind(s, 'cold');
    const fz = firstOfKind(s, 'frozen');
    const full = (fz && f && food(f).cat === 'meat') ? fz : cold;
    const meat = f && food(f).cat === 'meat';
    if ((full && ((full.full ?? 0) >= 70 || meat)) || !hasFreezer(s)) {
      const haveBags = f ? lotsOf(s, f).filter((l) => l.bag).length : 0;
      const body = isZh()
        ? `${haveBags ? `家里已经有 ${haveBags} 袋了。` : ''}${hasFreezer(s) ? '' : '家里没有冷冻室。'}${p.id === 'may' ? '你通常两天内会再去买。' : ''}`
        : `${haveBags ? `You already have ${haveBags} bag${haveBags > 1 ? 's' : ''} at home. ` : ''}${hasFreezer(s) ? '' : "There's no freezer at home. "}${p.id === 'may' ? 'You usually shop again within two days.' : ''}`.trim();
      return {
        title: full ? L(`Your ${full.name.toLowerCase()} is about ${full.full ?? 0}% full`, `你的${dz(full.name)}大约 ${full.full ?? 0}% 满了`) : L('There may not be room', '可能放不下'),
        body,
        acts: f === 'salad' ? [{ t: L('Get a single-serve kit', '买单人份的'), add: 'Salad kit, single serve', own: 'mine' }, { t: L('Add family size anyway', '还是加家庭装'), add: name, own: 'mine' }] : [{ t: L('Skip it this week', '这周先不买') }, { t: L('Add anyway', '还是加上'), add: name, own: 'mine' }],
      };
    }
  }
  if (f && countOf(s, f) > 0) {
    const l = lotsOf(s, f)[0];
    const t = dateTag(l.date, today).text;
    return { title: L(`You have ${countOf(s, f)} ${foodName(f, countOf(s, f), l).toLowerCase()} at home`, `家里还有${foodName(f, countOf(s, f), l)}（${countOf(s, f)}）`), body: t ? `${t}${L('.', '。')}` : '', acts: [{ t: L('Skip it', '不买了') }, { t: L('Add anyway', '还是加上'), add: name, own: 'mine' }] };
  }
  return null;
}

export function shopPage(app) {
  const s = app.store.state, p = app.store.persona, today = app.store.today;
  const mates = s.house?.mates || [];
  const me = s.profile.name;
  const names = andList(mates.map((m) => m.name));
  const sub = mates.length ? `<button class="link" data-act="go" data-arg="settings">${esc(L(`Shared with ${names}`, `与 ${names} 共用`))} ›</button>` : `${L('Just you.', '只有你。')} <button class="link" data-act="go" data-arg="settings">${L('Invite housemates', '邀请室友')} ›</button>`;
  const al = app.ui.shopAlert;
  const alert = al ? `<div class="card card-warn" role="status"><p class="card-t">${esc(al.title)}</p>${al.body ? `<p>${esc(al.body)}</p>` : ''}<div class="btn-row wrap">${al.acts.map((a, i) => `<button class="btn ${i === 0 ? 'btn-primary' : 'btn-secondary'} sm" data-act="shop-alert" data-arg="${i}">${esc(a.t)}</button>`).join('')}</div></div>` : '';
  const rows = s.shop.map((it) => {
    const f = matchFood(it.name);
    const parts = [];
    if (mates.length) { parts.push(it.own === 'shared' ? L('Shared', '公共') : L('Mine', '我的')); parts.push(it.done ? L('bought', '买好了') : it.who ? (it.who === me ? L("you're getting it", '你来买') : L(`${it.who} is getting it`, `${it.who} 来买`)) : L('nobody yet', '还没人认领')); }
    if (it.note) parts.push(dz(it.note));
    return `<li class="srow${it.done ? ' done' : ''}"><button class="tick${it.done ? ' on' : ''}" data-act="shop-done" data-arg="${esc(it.id)}" aria-pressed="${!!it.done}" aria-label="${esc(L(`Mark ${it.name} as bought`, `把${dz(it.name)}标成已买`))}">${it.done ? ICON.check({ size: 14, stroke: 3 }) : ''}</button>${f ? pic(f, { size: 30 }) : pic('x', { size: 30, lot: { cat: 'other', name: it.name } })}<span class="r-main"><b>${esc(dz(it.name))}</b>${parts.length ? `<small>${esc(parts.join(' · '))}</small>` : ''}</span>${!it.who && !it.done ? `<button class="chip-btn" data-act="shop-claim" data-arg="${esc(it.id)}">${L("I'll get it", '我来买')}</button>` : ''}</li>`;
  }).join('');
  return `<div class="page shop">
    ${phoneTitle(app, L('Shopping list', '购物清单'))}
    <div class="desk-only">${pageHead(esc(fmtDay(today)), L('Shopping list', '购物清单'), sub)}</div>
    <p class="phone-only psub pad">${sub}</p>
    <div class="cols2">
      <div class="stack">
        ${alert}
        <section>${secHead(L('List', '清单'))}
          <div class="card flush"><ul class="slist">${rows || `<li class="srow"><span class="muted">${L('Nothing on the list.', '清单上还没有东西。')}</span></li>`}</ul>
          <div class="addrow"><input id="shop-in" type="text" placeholder="${L('Add something', '加点什么')}" autocomplete="off" aria-label="${L('Add to the shopping list', '加到购物清单')}" data-enter="shop-add"><button class="btn btn-primary sm" data-act="shop-add">${L('Add', '添加')}</button></div></div>
          <div class="chips sugg"><span class="muted sm-t">${L('Try:', '试试：')}</span>${(p.suggest || []).map((x) => `<button class="chip" data-act="shop-suggest" data-arg="${esc(x)}">${matchFood(x) ? pic(matchFood(x), { size: 18 }) : ''}${esc(dz(x))}</button>`).join('')}</div>
        </section>
      </div>
      <div class="stack">
        <section>${secHead(L('Room at home before you buy', '买之前看看家里还有没有地方'), `<button class="link" data-act="sheet" data-arg="places">${L('Update', '更新')}</button>`)}<div class="card flush">${roomBars(app)}</div></section>
      </div>
    </div>
  </div>`;
}

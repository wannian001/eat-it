// Boards 05 and 06: what the app looks like outside the app. A web page can't put real widgets on
// an iPhone, so these are live previews drawn from the same fridge; taps here change the fridge.

import { food, foodName, shortName } from '../foods.js?v=a3e659d';
import { eatFirst, oldestFrozen, frozenLots, bagNumber, nudge, modeOf, awayRuns } from '../state.js?v=a3e659d';
import { urgency, frozenWeeks, frozenFor, longDay, dot } from '../dates.js?v=a3e659d';
import { ICON, appIcon } from '../icons.js?v=a3e659d';
import { esc, pic, label } from '../ui.js?v=a3e659d';
import { shelfGroups, awayTitle } from './parts.js?v=a3e659d';
import { L, isZh, plural } from '../i18n.js?v=a3e659d';

// "milk, eggs and bread" / "牛奶、鸡蛋和面包"
const foodList = (list) => (isZh() ? (list.length > 1 ? `${list.slice(0, -1).join('、')}和${list[list.length - 1]}` : list[0] || '')
  : `${list.slice(0, -1).join(', ')}${list.length > 1 ? ' and ' : ''}${list[list.length - 1]}`);

function freshGroups(app) {
  const s = app.store.state, today = app.store.today;
  return s.places.filter((pl) => pl.kind !== 'frozen').flatMap((pl) => shelfGroups(app, pl))
    .sort((a, b) => (urgency(a.lot.date, today) ?? 99) - (urgency(b.lot.date, today) ?? 99));
}

function widgetGrid(app) {
  const today = app.store.today;
  const groups = freshGroups(app);
  const fruit = [...groups.filter((t) => food(t.food).cat === 'produce'), ...groups.filter((t) => food(t.food).cat !== 'produce')].slice(0, 4);
  return `<section class="w w-sm w-grid" aria-label="${L('Use soon', '尽快吃')}">${fruit.map((t) => {
    const d = dot(t.lot.date, today);
    return `<button class="wg-tile${d ? ' hot' : ''}" data-act="use" data-arg="${esc(t.lot.id)}|one" aria-label="${L('Used one', '用掉一个')}${L(': ', '：')}${esc(label(t.food, t.count, t.lot.date, today, 'tile', t.lot))}">${pic(t.food, { size: 34, lot: t.lot })}${d ? '<span class="dot dot-red"></span>' : ''}</button>`;
  }).join('')}</section>`;
}

function widgetFreezer(app) {
  const s = app.store.state, today = app.store.today;
  const lot = oldestFrozen(s);
  if (!lot) {
    const n = eatFirst(s, today).length;
    return `<section class="w w-sm w-count" aria-label="${L(`${n} to use soon`, `${n} 样要尽快吃`)}"><span class="wc-n">${n}</span><span class="wc-l">${L('Use soon', '尽快吃')}</span></section>`;
  }
  const n = frozenLots(s).filter((l) => l.food === lot.food).length;
  const wk = frozenWeeks(lot.date.on, today);
  return `<section class="w w-sm w-freezer" aria-label="${esc(L(`Freezer: ${n} bags of ${foodName(lot.food, 2, lot)}, oldest ${frozenFor(lot.date.on, today)}`, `冷冻室：${foodName(lot.food, 2, lot)} ${n} 袋，最早的冻了 ${frozenFor(lot.date.on, today)}`))}">
    <span class="wf-snow">${ICON.snow({ size: 18 })}</span>
    ${wk >= 1 ? `<span class="wf-wk">${L(`${wk} wk`, `${wk}周`)}</span>` : ''}
    <span class="wf-pic">${pic(lot.food, { bag: true, size: 52, lot })}</span>
    <span class="wf-n">${n}</span>
  </section>`;
}

function widgetMedium(app) {
  const groups = freshGroups(app).slice(0, 8);
  return `<section class="w w-md" aria-label="${L('My fridge', '我的冰箱')}">
    <div class="wm-main">
      <div class="wm-h">${appIcon({ size: 18, badge: false })}<span>${L('My fridge', '我的冰箱')}</span></div>
      <div class="wm-tiles">${groups.map((t) => `<span class="wm-tile">${pic(t.food, { size: 24, lot: t.lot })}${t.count > 1 ? `<b>${t.count}</b>` : ''}</span>`).join('')}</div>
    </div>
    <div class="wm-btns">
      <button class="wm-b plus" data-act="go" data-arg="add" aria-label="${L('Add food', '添加食物')}">${ICON.plus({ size: 18, stroke: 2.4 })}</button>
      <button class="wm-b minus" data-act="go" data-arg="ate" aria-label="${L('I ate', '我吃了')}">${ICON.minus({ size: 18, stroke: 2.4 })}</button>
    </div>
  </section>`;
}

function widgetOut(app) {
  const s = app.store.state, today = app.store.today;
  const on = modeOf(s, today) === 'out';
  return `<section class="w w-sm w-out">
    ${on ? `<span class="wo-moved">${ICON.fork({ size: 18 })}${L('Eating out', '在外面吃')}</span>` : `<span class="wo-icon">${ICON.plate({ size: 22, stroke: 1.8 })}</span>`}
    <span class="wo-title">${L('Out tonight', '今晚在外面吃')}</span>
    <button class="switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="${L('Out tonight', '今晚在外面吃')}" data-act="out"><i></i></button>
  </section>`;
}

function homeScreenInner(app) {
  const badge = eatFirst(app.store.state, app.store.today).length > 0;
  return `<div class="screen phone home-screen">
    <div class="hs-grid">
      ${widgetGrid(app)}${widgetFreezer(app)}${widgetMedium(app)}${widgetOut(app)}
      <button class="hs-app" data-act="go" data-arg="home" aria-label="${L('Open Eat It!', '打开 Eat It!')}">${appIcon({ size: 54, badge })}<span>Eat It!</span></button>
      <span class="hs-ghost"></span><span class="hs-ghost"></span><span class="hs-ghost"></span>
    </div>
    <div class="hs-dock" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  </div>`;
}

function lockInner(app) {
  const s = app.store.state, p = app.store.persona, today = app.store.today;
  const due = nudge(s, today);
  const use = eatFirst(s, today, 5).filter((x) => x.u <= 1);
  const n = eatFirst(s, today).length;
  const oldest = oldestFrozen(s);
  const names = s.settings.lockNames;
  const clock = app.store.clock;
  const ring = `<svg viewBox="0 0 44 44" width="48" height="48" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--white)" stroke-width="4.5" opacity=".7"/><circle cx="22" cy="22" r="18" fill="none" stroke="var(--tomato)" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="${Math.min(1, n / 3) * 113} 113" transform="rotate(-90 22 22)"/></svg>`;
  let notif = '';
  const away = awayRuns(s, today).find((r) => r.prep === today);
  if (away && !app.ui.lockDismissed) {
    const list = away.lots.map((l) => foodName(l.food, 2, l).toLowerCase());
    const body = names ? L(`Use or freeze today: ${foodList(list)}.`, `今天吃掉或冻起来：${foodList(list)}。`) : L(`${list.length} ${plural(list.length, 'thing')} to use or freeze today.`, `今天有 ${list.length} 样要吃掉或冻起来。`);
    notif = `<section class="notif" aria-label="${L('Notification from Eat It!', '来自 Eat It! 的通知')}">
      <div class="nf-h">${appIcon({ size: 18, badge: false })}<span>Eat It!</span><small>${L('now', '现在')}</small></div>
      <div class="nf-b">${names ? `<span class="nf-pics">${away.lots.slice(0, 3).map((l) => pic(l.food, { size: 30, lot: l })).join('')}</span>` : ''}<div><b>${esc(awayTitle(away, today))}</b><small>${esc(body)}</small></div></div>
      <div class="btn-row"><button class="btn btn-primary sm" data-act="go" data-arg="home">${L('Open', '打开')}</button><button class="btn btn-secondary sm" data-act="lock-dismiss">${L('Later', '稍后')}</button></div>
    </section>`;
  } else if (due && !app.ui.lockDismissed) {
    const title = names ? L(`${shortName(due.food, due)}, bag ${bagNumber(s, due)}`, `${shortName(due.food, due)}第 ${bagNumber(s, due)} 袋`) : L('The oldest bag in your freezer', '冷冻室里最早的一袋');
    notif = `<section class="notif" aria-label="${L('Notification from Eat It!', '来自 Eat It! 的通知')}">
      <div class="nf-h">${appIcon({ size: 18, badge: false })}<span>Eat It!</span><small>${L('now', '现在')}</small></div>
      <div class="nf-b">${names ? pic(due.food, { bag: true, size: 40, lot: due }) : ''}<div><b>${esc(title)}</b><small>${esc(L(`Frozen ${frozenFor(due.date.on, today)}`, `已冻 ${frozenFor(due.date.on, today)}`))}</small></div></div>
      <div class="btn-row"><button class="btn btn-primary sm" data-act="thaw" data-arg="${esc(due.id)}">${L('Thaw tonight', '今晚解冻')}</button><button class="btn btn-secondary sm" data-act="later">${L('Later', '稍后')}</button></div>
    </section>`;
  } else if (use.length && !app.ui.lockDismissed) {
    const list = use.map((x) => foodName(x.food, 2, x.lot).toLowerCase());
    const body = names ? `${foodList(list)}${L('.', '。')}` : L(`${use.length} ${plural(use.length, 'thing')} to use today.`, `今天有 ${use.length} 样要用掉。`);
    notif = `<section class="notif" aria-label="${L('Notification from Eat It!', '来自 Eat It! 的通知')}">
      <div class="nf-h">${appIcon({ size: 18, badge: false })}<span>Eat It!</span><small>${L('now', '现在')}</small></div>
      <div class="nf-b">${names ? `<span class="nf-pics">${use.slice(0, 3).map((x) => pic(x.food, { size: 30, lot: x.lot })).join('')}</span>` : ''}<div><b>${use.some((x) => x.u <= 0) ? L('Use today', '今天要用掉') : L('Use soon', '尽快吃')}</b><small>${esc(body.charAt(0).toUpperCase() + body.slice(1))}</small></div></div>
      <div class="btn-row"><button class="btn btn-primary sm" data-act="go" data-arg="home">${L('Open', '打开')}</button><button class="btn btn-secondary sm" data-act="lock-dismiss">${L('Later', '稍后')}</button></div>
    </section>`;
  }
  return `<div class="screen phone lock">
    <div class="lk-top">
      <p class="lk-date">${esc(longDay(today))}</p>
      <p class="lk-time">${esc(clock)}</p>
      <div class="lk-widgets">
        <span class="lk-ring" role="img" aria-label="${L(`${n} to eat first`, `${n} 样要先吃`)}">${ring}<b>${n}</b></span>
        ${oldest ? `<span class="lk-rect">${pic(oldest.food, { bag: true, size: 26, lot: oldest })}<span><b>${L(`Bag ${bagNumber(s, oldest)}`, `第 ${bagNumber(s, oldest)} 袋`)}</b><small>${L(`${frozenWeeks(oldest.date.on, today)} wk frozen`, `冻了 ${frozenWeeks(oldest.date.on, today)} 周`)}</small></span></span>` : ''}
      </div>
    </div>
    ${notif}
    <button class="home-bar" data-act="go" data-arg="home" aria-label="${L('Open Eat It!', '打开 Eat It!')}"><i></i></button>
  </div>`;
}

export function widgetsPage(app) {
  return `<div class="phone-only fill">${homeScreenInner(app)}</div><div class="desk-only device-stage">${homeScreenInner(app)}<p class="stage-note">${L("Home-screen widgets. A web page can't add real widgets, so this preview uses the same data: tap a fruit to use one, or turn on Out tonight.", '手机桌面小组件。网页放不了真的小组件，所以这里用同一份数据做了预览：点一个水果就用掉一个，也可以打开“今晚在外面吃”。')}</p></div>`;
}

export function lockPage(app) {
  return `<div class="phone-only fill">${lockInner(app)}</div><div class="desk-only device-stage">${lockInner(app)}<p class="stage-note">${L('Lock screen with one quiet nudge a day. You can hide food names in Household.', '锁屏每天只轻轻提醒一次。可以在“同住与设置”里隐藏食物名。')}</p></div>`;
}

// "Food at home" (v0.2): one place at a time, as a picture or a list, with search and Mine / Shared.
import { foodName, nameMatches } from '../foods.js';
import { placeOf } from '../state.js';
import { urgency } from '../dates.js';
import { spotName, placeKinds } from '../seed.js';
import { ICON, placeIcon } from '../icons.js';
import { esc, pic, tag, pageHead, amountText } from '../ui.js';
import { fridgePicture, shelfPanel, effSpot, fullText } from './parts.js';
import { phoneHeader } from './home.js';
import { L, dz, plural } from '../i18n.js';

// "What's in the fridge" / "冰箱里有什么"
const whatsIn = (place) => L(`What's in the ${place.name.toLowerCase()}`, `${dz(place.name)}里有什么`);

export function currentPlace(app) {
  const s = app.store.state;
  return placeOf(s, app.ui.food.place) || s.places[0] || null;
}

function lotsHere(app, place) {
  const { q, own } = app.ui.food;
  const needle = q.trim().toLowerCase();
  return [...app.store.state.lots.values()].filter((l) => l.place === place.id
    && (own === 'all' || l.owner === own)
    && (!needle || nameMatches(l.food, l, needle)));
}

function tableHtml(app, place) {
  const s = app.store.state, p = app.store.persona, today = app.store.today;
  const frozen = place.kind === 'frozen';
  const lots = lotsHere(app, place).sort(frozen
    ? (a, b) => (a.date?.on || '9999').localeCompare(b.date?.on || '9999')
    : (a, b) => (urgency(a.date, today) ?? 999) - (urgency(b.date, today) ?? 999));
  const rows = lots.map((l) => {
    const whose = s.house && l.owner === 'shared' ? L('Shared', '公共') : L('Mine', '我的');
    const spot = spotName(effSpot(l, place, p));
    return `<button class="frow" data-act="lot" data-arg="${esc(l.id)}">
      <span class="fn">${pic(l.food, { bag: l.bag, size: 32, lot: l })}<span><b>${esc(foodName(l.food, l.unit === 'pc' ? l.qty : 1, l))}</b><small>${esc([amountText(l), s.house ? whose : null].filter(Boolean).join(' · '))}</small></span></span>
      <span class="fx">${esc(amountText(l))}</span><span class="fx">${esc(whose)}</span><span class="fx">${esc(spot)}</span>
      <span class="fd">${tag(l.date, today)}</span>
    </button>`;
  }).join('');
  const others = s.house && app.ui.food.own === 'all' && !app.ui.food.q
    ? (p.others || []).filter((o) => o.place === place.id).map((o) => `<div class="frow other"><span class="fn"><span class="avatar av-1 sm-av">${esc(o.who[0])}</span><span><b>${esc(L(`${o.who}'s food · ${o.n} ${plural(o.n, 'item')}`, `${o.who} 的食物 · ${o.n} 样`))}</b><small>${esc(L(`Only ${o.who} sees what they are`, `具体是什么只有 ${o.who} 看得到`))}</small></span></span><span class="fx"></span><span class="fx">${esc(o.who)}</span><span class="fx"></span><span class="fd"><span class="lock-tag">${ICON.lock({ size: 12 })}${L('Private', '不公开')}</span></span></div>`).join('')
    : '';
  const empty = !rows && !others ? `<div class="frow other"><span class="fn">${app.ui.food.q ? esc(L(`Nothing called "${app.ui.food.q}" here.`, `这里没有“${app.ui.food.q}”。`)) : L('Nothing here yet.', '这里还没有东西。')}</span></div>` : '';
  return `<div class="sec-h"><h2>${L(`${lots.length} ${plural(lots.length, 'item')}`, `${lots.length} 样`)}</h2><span class="muted sm-t">${frozen ? L('Oldest first', '最早放进去的在前') : L('Soonest first', '最快到期的在前')}</span></div>
    <div class="ftable"><div class="fhead"><span>${L('Item', '食物')}</span><span>${L('Amount', '数量')}</span><span>${L('Whose', '归谁')}</span><span>${L('Spot', '位置')}</span><span>${L('Date', '日期')}</span></div>${rows}${others}${empty}</div>`;
}

function pictureHtml(app, place) {
  const pic = place.kind === 'room' ? shelfPanel(app, place) : fridgePicture(app, { places: [place] });
  return `<div class="viz-h"><span>${placeIcon(place, { size: 18 })}<b>${esc(dz(place.name))}</b> · ${esc(fullText(place))}</span><button class="link" data-act="sheet" data-arg="measure:${esc(place.id)}">${L('Measure with a photo', '拍照量一下')}</button></div>
    <div class="viz">${pic}
      <div class="legend"><span><i class="lg-red"></i>${L('Use by soon', '食用期限快到了')}</span><span><i class="lg-amber"></i>${L('Best before today', '最佳食用期是今天')}</span><span><i class="lg-est"></i>${L('Date is our guess', '日期是估计的')}</span><span><i class="lg-frost"></i>${L('Frozen', '冷冻')}</span><span class="lg-note">${L('Tap any food to see or change it.', '点任意食物可以查看或修改。')}</span></div>
    </div>`;
}

export function foodPage(app) {
  const { store, ui } = app;
  const s = store.state;
  const place = currentPlace(app);
  const edit = `<button class="btn btn-secondary sm" data-act="sheet" data-arg="places">${ICON.settings({ size: 16 })}${L('Edit places', '编辑存放的地方')}</button>`;
  if (!place) {
    return `<div class="page">${pageHead(L('Food at home', '家里的食物'), L('Where do you keep food?', '你把食物放在哪里？'), L('Add the places you really use: a fridge, a cupboard, a rice bin, a box under the bed.', '加上你真正在用的地方：冰箱、橱柜、米桶、床底的箱子。'))}
      <div class="card"><p class="card-t">${L('No storage places yet', '还没有存放的地方')}</p><div class="btn-row">${edit}</div></div></div>`;
  }
  const tabs = `<div class="seg" role="tablist">${s.places.map((pl) => `<button role="tab" aria-selected="${pl.id === place.id}" class="${pl.id === place.id ? 'on' : ''}" data-act="place" data-arg="${esc(pl.id)}">${placeIcon(pl, { size: 16 })}${esc(dz(pl.name))}</button>`).join('')}</div>`;
  const view = `<div class="seg small">${[['picture', L('Picture', '图')], ['list', L('List', '列表')]].map(([k, t]) => `<button class="${ui.food.view === k ? 'on' : ''}" data-act="food-view" data-arg="${k}" aria-pressed="${ui.food.view === k}">${t}</button>`).join('')}</div>`;
  const filt = s.house ? `<div class="chips">${[['all', L('All', '全部')], ['me', L('Mine', '我的')], ['shared', L('Shared', '公共')]].map(([k, t]) => `<button class="chip${ui.food.own === k ? ' on' : ''}" data-act="own" data-arg="${k}" aria-pressed="${ui.food.own === k}">${t}</button>`).join('')}</div>` : '';
  const search = `<label class="search">${ICON.search({ size: 16 })}<input id="food-q" type="search" placeholder="${L('Find food', '找食物')}" value="${esc(ui.food.q)}" aria-label="${L('Search food', '搜索食物')}" data-input="food-q"></label>`;
  return `<div class="page food">
    ${phoneHeader(app, whatsIn(place))}
    <div class="desk-only">${pageHead(L('Food at home', '家里的食物'), esc(whatsIn(place)), `${L('Check from anywhere, no need to open it.', '在哪儿都能看，不用打开门。')} <span class="muted">${esc(placeKinds()[place.kind])}${place.sub ? ` · ${esc(dz(place.sub))}` : ''}</span>`, `<button class="btn btn-primary" data-act="go" data-arg="add">${ICON.plus({ size: 18, stroke: 2.4 })}${L('Add food', '添加食物')}</button>`)}</div>
    <div class="toolbar">${tabs}<span class="desk-only">${edit}</span></div>
    <div class="vtools">${view}${filt}${search}</div>
    ${ui.food.view === 'list' ? tableHtml(app, place) : pictureHtml(app, place)}
    <div class="phone-only center-row">${edit}</div>
  </div>`;
}

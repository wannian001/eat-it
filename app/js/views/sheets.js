// Sheets: a bottom sheet on the phone, a side drawer on the desktop (v0.2 drawers, hi-fi look).
import { FOODS, food, foodName, shortName, matchFood, foodText } from '../foods.js';
import { placeOf, bagNumber, oldestFrozen, hasFreezer } from '../state.js';
import { dateTag, daysBetween, fmtDay, relDay, dayMonth, addDays } from '../dates.js';
import { shelvesOf, spotName, placeKinds } from '../seed.js';
import { ICON, placeIcon } from '../icons.js';
import { esc, pic, tag, amountText, aiBadge } from '../ui.js';
import { effSpot } from './parts.js';
import { L, isZh, dz, amountWord, andList, plural } from '../i18n.js';

export function wrap(inner, { label = L('Details', '详情'), wide = false } = {}) {
  return `<div class="sheet-wrap" data-act="close" role="presentation">
    <section class="sheet${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(label)}" data-stop>
      <span class="handle" aria-hidden="true"></span>
      <button class="sheet-x" data-act="close" aria-label="${L('Close', '关闭')}">${ICON.close({ size: 18 })}</button>
      ${inner}
    </section>
  </div>`;
}

function explain(app, lot) {
  const today = app.store.today;
  const d = lot.date;
  if (!d) return L('No date for this one.', '这个没有日期。');
  const place = placeOf(app.store.state, lot.place);
  switch (d.kind) {
    case 'use_by':
      return daysBetween(today, d.on) < 0 ? L("The use-by date has passed, so don't eat it.", '已经过了食用期限，别吃了。') : L("Use-by date from the pack. It's about safety: don't eat it after this date, even if it looks fine.", '这是包装上的食用期限，关乎安全：过了这天就别吃，看起来没坏也一样。');
    case 'best_before':
      return L("Best-before date from the pack. It's about quality: usually still fine after it, but check how it looks and smells.", '这是包装上的最佳食用日期，关乎品质：过了通常还能吃，但先看看、闻闻。');
    case 'frozen': {
      const days = daysBetween(d.on, today);
      const oldest = oldestFrozen(app.store.state)?.id === lot.id;
      const keep = foodText(lot.food, 'keep');
      return isZh()
        ? `${dayMonth(d.on)}放进冷冻室（${days} 天）。冻着的时候是安全的，但放得越久品质越差。${keep || ''}${oldest ? '这是冷冻室里最早的一袋，先吃它。' : ''}`
        : `In the freezer since ${dayMonth(d.on)} (${days} day${days === 1 ? '' : 's'}). Frozen food stays safe while it's frozen, but quality drops the longer it's there.${keep ? ` ${keep}` : ''}${oldest ? ' This is your oldest bag, so use it first.' : ''}`;
    }
    case 'est': {
      if (food(lot.food).leftover) {
        const ago = daysBetween(lot.addedOn, today);
        return isZh()
          ? `${ago <= 0 ? '今天做的。' : ago === 1 ? '昨天做的。' : `${ago} 天前做的。`}剩菜在冰箱里大约能放 2–3 天。`
          : `${ago <= 0 ? 'Cooked today.' : ago === 1 ? 'Cooked yesterday.' : `Cooked ${ago} days ago.`} Leftovers keep about 2–3 days in the fridge.`;
      }
      if (lot.thawed) return L('Thawed in the fridge. This is our guess — tap the date to change it.', '在冰箱里解冻的。日期是我们估的，点日期可以改。');
      const group = foodText(lot.food, 'group') || foodName(lot.food, 2, lot).toLowerCase();
      if (isZh()) return `包装上没有日期，所以这是我们估的，依据：${group} · ${fmtDay(lot.addedOn)}${lot.date.guess ? '加进来' : '买的'} · 放在${dz(place?.name || 'Fridge')}。只是参考，不是保证。`;
      const basis = `${group} · ${lot.date.guess ? 'added' : 'bought'} ${fmtDay(lot.addedOn)} · in the ${(place?.name || 'fridge').toLowerCase()}`;
      return `No date from the pack, so this is our guess from: ${basis}. It's a guide, not a promise.`;
    }
    case 'none': return dz(d.note) || '';
    default: return '';
  }
}

function dateOptions(today) {
  const o = [];
  for (const n of [0, 1, 2, 3, 4, 5, 7, 10, 14]) o.push([`use_by|${addDays(today, n)}`, L(`Use by ${relDay(addDays(today, n), today)}`, `食用期限 ${relDay(addDays(today, n), today)}`)]);
  for (const n of [3, 7, 30, 90, 180]) o.push([`best_before|${addDays(today, n)}`, L(`Best before ${fmtDay(addDays(today, n))}`, `最佳食用 ${fmtDay(addDays(today, n))}`)]);
  return o;
}

export function lotSheet(app) {
  const { store, ui } = app;
  const s = store.state, p = store.persona, today = store.today;
  const lot = s.lots.get(ui.sheet.arg);
  if (!lot) return wrap(`<p class="sheet-text">${L('This food is gone.', '这个食物已经没有了。')}</p>`);
  const place = placeOf(s, lot.place);
  const frozen = lot.date?.kind === 'frozen';
  const bagNo = frozen ? bagNumber(s, lot) : 0;
  const title = bagNo ? L(`${shortName(lot.food, lot)}, bag ${bagNo}`, `${shortName(lot.food, lot)}第 ${bagNo} 袋`) : foodName(lot.food, lot.unit === 'pc' ? lot.qty : 1, lot);
  const spot = place ? effSpot(lot, place, p) : null;
  const mates = andList(s.house?.mates?.map((m) => m.name) || []) || L('housemates', '室友');
  const sub = [amountText(lot) === '1' ? null : amountText(lot), place ? dz(place.name) : null, spotName(spot), s.house ? (lot.owner === 'shared' ? L(`Shared with ${mates}`, `与 ${mates} 共用`) : L('Mine', '我的')) : null, lot.opened ? L(`opened ${relDay(lot.opened, today)}`, `${relDay(lot.opened, today)}开封`) : null].filter(Boolean).join(' · ');
  const isEst = lot.date?.kind === 'est';
  const source = !lot.date ? '' : lot.date.kind === 'est' ? L('our guess', '我们估的') : lot.date.kind === 'frozen' ? L(`since ${dayMonth(lot.date.on)}`, `${dayMonth(lot.date.on)}起`) : lot.date.kind === 'none' ? '' : L('on the pack', '包装上的');
  const dateHtml = isEst && ui.sheet.edit === 'est'
    ? `<span class="stepper"><button class="step" data-act="est" data-arg="${esc(lot.id)}|-1" aria-label="${L('One day sooner', '早一天')}">${ICON.minus({ size: 16 })}</button>${tag(lot.date, today, 'sheet')}<button class="step" data-act="est" data-arg="${esc(lot.id)}|1" aria-label="${L('One day later', '晚一天')}">${ICON.plus({ size: 16 })}</button></span>`
    : isEst ? `<button class="tag-btn" data-act="sheet-edit" data-arg="est" aria-label="${esc(L(`Change the estimate, now ${dateTag(lot.date, today, 'sheet').text}`, `修改估计，现在是${dateTag(lot.date, today, 'sheet').text}`))}">${tag(lot.date, today, 'sheet')}</button>`
    : tag(lot.date, today, 'sheet');
  const setDate = ui.sheet.edit === 'date'
    ? `<label class="fld"><span>${L('Date on the pack', '包装上的日期')}</span><select data-change="lot-date" data-arg="${esc(lot.id)}"><option value="">${L('Choose…', '选一个…')}</option>${dateOptions(today).map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select></label>`
    : '';
  const shelves = place ? shelvesOf(place, p).filter((x) => x.kind !== 'locked') : [];
  const where = `<div class="where">
    <label class="fld inline"><span>${L('In the', '放在')}</span><select data-change="lot-place" data-arg="${esc(lot.id)}" aria-label="${L('Which place', '哪个地方')}">${s.places.map((pl) => `<option value="${esc(pl.id)}"${pl.id === lot.place ? ' selected' : ''}>${esc(dz(pl.name))}</option>`).join('')}</select></label>
    ${shelves.length > 1 ? `<label class="fld inline"><span>${L('on the', '的')}</span><select data-change="lot-spot" data-arg="${esc(lot.id)}" aria-label="${L('Which shelf', '哪一层')}">${shelves.map((x) => `<option value="${x.spot}"${x.spot === spot ? ' selected' : ''}>${esc(spotName(x.spot) || x.spot)}</option>`).join('')}</select></label>` : ''}
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
      <p>${esc(explain(app, lot))}${lot.part ? L(' Some already used.', '已经用掉一些了。') : ''}</p>
      ${lot.date?.kind === 'est' && ui.sheet.edit !== 'date' ? `<button class="chip-btn" data-act="sheet-edit" data-arg="date">${L('Set the date from the pack', '填包装上的日期')}</button>` : ''}
      ${setDate}
    </div>
    <div class="btn-row">
      <button class="btn btn-primary" data-act="use" data-arg="${esc(lot.id)}|one">${L('Used it', '用掉了')}</button>
      <button class="btn btn-secondary" data-act="use" data-arg="${esc(lot.id)}|some">${L('Used some', '用了一些')}</button>
    </div>
    <div class="sheet-sec stock"><h3>${L('In stock', '还剩多少')} <small>${L('Forgot to say what you ate? Fix it here.', '忘了说吃了什么？在这里改。')}</small></h3>
      <div class="stock-row">
        ${lot.unit === 'pc' ? `<span class="stepper"><button class="step" data-act="qty" data-arg="${esc(lot.id)}|${lot.qty - 1}" aria-label="${L('One fewer', '少一个')}">${ICON.minus({ size: 16 })}</button><b class="stock-n" aria-live="polite">${lot.qty}</b><button class="step" data-act="qty" data-arg="${esc(lot.id)}|${lot.qty + 1}" aria-label="${L('One more', '多一个')}">${ICON.plus({ size: 16 })}</button></span>` : ''}
        <div class="seg small">${['Full', 'Most', 'Half', 'Low'].map((a) => `<button class="${amt === a ? 'on' : ''}" data-act="amount" data-arg="${esc(lot.id)}|${a}" aria-pressed="${amt === a}">${amountWord(a)}</button>`).join('')}</div>
        <button class="chip-btn" data-act="qty" data-arg="${esc(lot.id)}|0">${L('All gone', '没有了')}</button>
      </div>
    </div>
    <div class="sheet-sec"><h3>${L('Where it is', '放在哪里')}</h3>${where}</div>
    <div class="sheet-sec"><h3>${L('Quick update', '快速更新')}</h3><div class="acts">
      <button class="act" data-act="open" data-arg="${esc(lot.id)}"${frozen || lot.opened ? ' disabled' : ''}>${L('Opened', '开封了')}</button>
      ${frozen ? `<button class="act" data-act="thaw" data-arg="${esc(lot.id)}">${L('Thaw tonight', '今晚解冻')}</button>` : `<button class="act" data-act="freeze" data-arg="${esc(lot.id)}"${freezer ? '' : ` disabled title="${L('No freezer at home', '家里没有冷冻室')}"`}>${L('Freeze it', '冻起来')}</button>`}
      <button class="act" data-act="sheet-edit" data-arg="date">${L('Edit the date', '改日期')}</button>
      <button class="act" data-act="toss" data-arg="${esc(lot.id)}">${L('Threw it out', '扔掉了')}</button>
    </div></div>
    ${lot.tip || foodText(lot.food, 'tip') ? `<div class="tip"><b>${L('Storage tip', '存放小提示')}</b><span>${esc(lot.tip || foodText(lot.food, 'tip'))}</span><em>${L('guide', '参考')}</em></div>` : ''}
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
      ? `<div class="confirm-box">${n ? `${L(`${n} item${n === 1 ? ' is' : 's are'} here. Move ${n === 1 ? 'it' : 'them'} to`, `这里有 ${n} 样东西。挪到`)} <select id="rm-to" aria-label="${L('Move food to', '把食物挪到')}">${others.map((x) => `<option value="${esc(x.id)}">${esc(dz(x.name))}</option>`).join('')}</select>` : L('Nothing is stored here.', '这里没放东西。')}
         <div class="btn-row"><button class="btn btn-danger sm" data-act="place-remove-go" data-arg="${esc(pl.id)}"${n && !others.length ? ' disabled' : ''}>${n ? L('Move and remove', '挪走并删除') : L('Remove', '删除')}</button><button class="btn btn-quiet sm" data-act="place-remove-cancel">${L('Keep it', '保留')}</button></div></div>`
      : '';
    return `<div class="place-row">
      <div class="pr-top"><span class="pr-ic">${placeIcon(pl, { size: 18 })}</span><input type="text" value="${esc(dz(pl.name))}" data-change="place-name" data-arg="${esc(pl.id)}" aria-label="${L('Name of this place', '这个地方的名字')}"><button class="chip-btn" data-act="place-remove" data-arg="${esc(pl.id)}">${L('Remove', '删除')}</button></div>
      <div class="pr-row"><select data-change="place-kind" data-arg="${esc(pl.id)}" aria-label="${L('Type of place', '类型')}">${Object.entries(placeKinds()).map(([k, t]) => `<option value="${k}"${pl.kind === k ? ' selected' : ''}>${t}</option>`).join('')}</select><span class="muted">${L(`${n} ${plural(n, 'item')}`, `${n} 样`)}</span></div>
      <div class="pr-row"><span>${L('How full', '有多满')}</span><input type="range" min="0" max="100" step="5" value="${pl.full ?? 0}" data-change="place-full" data-arg="${esc(pl.id)}" aria-label="${esc(L(`How full is ${pl.name}`, `${dz(pl.name)}有多满`))}"><span class="pr-pct">${pl.full == null ? '—' : `${pl.full}%`}</span><button class="chip-btn" data-act="sheet" data-arg="measure:${esc(pl.id)}">${ICON.camera({ size: 14 })}${L('Photo', '拍照')}</button></div>
      ${confirm}
    </div>`;
  }).join('');
  const sug = [['Second fridge', 'cold'], ['Mini fridge', 'cold'], ['Chest freezer', 'frozen'], ['Rice bin', 'room'], ['Box under the bed', 'room'], ['Balcony', 'room']]
    .filter(([n]) => !s.places.some((x) => x.name.toLowerCase() === n.toLowerCase() || x.name === dz(n)));
  return wrap(`<h2 class="sheet-title">${L('Storage places', '存放的地方')}</h2><p class="sheet-sub">${L("Add the places where you really keep food, and remove any you don't have. The type helps Eat It! guess how long food lasts.", '加上你真正放食物的地方，删掉没有的。类型能帮 Eat It! 估计食物能放多久。')}</p>
    <div class="places">${rows || `<p class="muted">${L('No places yet. Add one below.', '还没有地方，在下面加一个。')}</p>`}</div>
    <div class="new-place"><h3>${L('Add a place', '加一个地方')}</h3><div class="np-row"><input type="text" id="np-name" placeholder="${L('e.g. Rice bin', '比如：米桶')}" autocomplete="off" aria-label="${L('Name of the new place', '新地方的名字')}"><select id="np-kind" aria-label="${L('Type of the new place', '新地方的类型')}">${Object.entries(placeKinds()).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select><button class="btn btn-primary sm" data-act="place-add">${L('Add', '添加')}</button></div>
    ${sug.length ? `<div class="chips">${sug.map(([n, k]) => `<button class="chip" data-act="place-add-quick" data-arg="${esc(n)}|${k}">${placeIcon({ name: n, kind: k }, { size: 14 })}${esc(dz(n))}</button>`).join('')}</div>` : ''}</div>`, { label: L('Storage places', '存放的地方'), wide: true });
}

// "Measure with a photo" (v0.2): the estimate is simulated; the photo is never kept.
export function measureSheet(app) {
  const s = app.store.state;
  const m = app.ui.sheet;
  const pl = placeOf(s, m.place);
  if (!pl) return wrap(`<p>${L('That place was removed.', '这个地方已经删掉了。')}</p>`);
  const name = esc(isZh() ? dz(pl.name) : pl.name.toLowerCase());
  const shot = m.img ? `<img src="${m.img}" alt="${L(`Your photo of the ${name}`, `你拍的${name}`)}">` : `<div class="shot-ph">${placeIcon(pl, { size: 64, stroke: 1.4 })}<span>${L('Example photo', '示例照片')}</span></div>`;
  if (!m.phase || m.phase === 'pick') {
    return wrap(`<h2 class="sheet-title">${L(`How full is the ${name}?`, `${name}有多满？`)}</h2><p class="sheet-sub">${L('Take one photo with the door open. Eat It! estimates how much of the space is used.', '打开门拍一张。Eat It! 估计用掉了多少空间。')}</p>
      <ul class="pv"><li class="y">${L('Stand back so the whole space is in the picture', '站远一点，把整个空间拍进去')}</li><li class="y">${L('Sharing it? Point at your own shelf', '和别人合用？只拍你自己那一层')}</li><li class="y">${L("The photo is only used for the estimate. It isn't saved or shown to anyone", '照片只用来估计，不保存，也不给任何人看')}</li></ul>
      <div class="btn-row wrap"><label class="btn btn-primary filebtn">${ICON.camera({ size: 18 })}${L('Take a photo', '拍一张')}<input type="file" accept="image/*" capture="environment" data-file="measure" aria-label="${L('Take a photo', '拍一张')}"></label><button class="btn btn-secondary" data-act="measure-demo">${L('Use an example photo', '用示例照片')}</button></div>
      <p class="small">${L('No photo? You can also drag the slider in Storage places.', '不想拍？也可以在“存放的地方”里拖动滑块。')}</p>`, { label: L('Measure', '量一下') });
  }
  if (m.phase === 'scan') return wrap(`<h2 class="sheet-title">${L(`Looking at the ${name}…`, `正在看${name}…`)}</h2><div class="shot scanning">${shot}<span class="sweep"></span></div>`, { label: L('Measuring', '正在量') });
  return wrap(`<h2 class="sheet-title">${esc(dz(pl.name))}</h2><div class="shot">${shot}<span class="shot-cap">${L('Estimate', '估计')}</span></div>
    <p class="measure-out">${L(`≈ ${m.val}% full`, `约 ${m.val}% 满`)}</p>
    <p class="muted">${L("Estimated from your photo. Food hidden at the back or inside boxes can't be seen, so treat it as a rough guide.", '根据照片估的。藏在后面或盒子里的东西看不到，只当个大概。')}</p>
    <label class="fld"><span>${L('Looks wrong? Drag to fix it.', '不对？拖一下来改。')}</span><input type="range" min="0" max="100" step="5" value="${m.val}" data-change="measure-val"></label>
    <div class="btn-row"><button class="btn btn-primary" data-act="measure-save">${L('Save', '保存')}</button><button class="btn btn-secondary" data-act="measure-again">${L('Take another', '再拍一张')}</button></div>
    <p class="small">${L(`The photo is thrown away after this. Only the number is kept${s.house ? ', and housemates see it only if you share how full your shelf is' : ''}.`, `照片用完就丢掉，只留下这个数字${s.house ? '；只有你选择分享自己那层有多满时，室友才看得到' : ''}。`)}</p>`, { label: L('Measure', '量一下') });
}

export function typeSheet(app) {
  const s = app.store.state, today = app.store.today;
  const t = app.ui.sheet;
  const matched = t.name ? matchFood(t.name) : null;
  const mates = andList(s.house?.mates?.map((m) => m.name) || []) || L('housemates', '室友');
  return wrap(`<h2 class="sheet-title">${L('Type it in', '手动输入')}</h2>
    <label class="fld"><span>${L('What is it?', '是什么？')}</span><span class="fld-pic">${matched ? pic(matched, { size: 28 }) : ''}<input type="text" id="qa-name" placeholder="${L('e.g. Firm tofu', '比如：老豆腐')}" autocomplete="off" value="${esc(t.name || '')}" data-input="qa-name"></span></label>
    <label class="fld"><span>${L('How many / how much?', '多少？')}</span><input type="text" id="qa-qty" placeholder="1" autocomplete="off" value="${esc(t.qty || '')}" inputmode="decimal"></label>
    <label class="fld"><span>${L('Where does it go?', '放在哪里？')}</span><select id="qa-place">${s.places.map((pl) => `<option value="${esc(pl.id)}">${esc(dz(pl.name))}</option>`).join('')}</select></label>
    ${s.house ? `<label class="fld"><span>${L('Whose is it?', '归谁？')}</span><select id="qa-own"><option value="me">${L('Mine', '我的')}</option><option value="shared">${esc(L(`Shared with ${mates}`, `与 ${mates} 共用`))}</option></select></label>` : ''}
    <label class="fld"><span>${L('Date on the pack', '包装上的日期')}</span><select id="qa-date"><option value="est">${L('No date, estimate it for me', '没有日期，帮我估一个')}</option>${dateOptions(today).map(([v, x]) => `<option value="${v}">${esc(x)}</option>`).join('')}</select></label>
    <div class="btn-row"><button class="btn btn-secondary" data-act="close">${L('Cancel', '取消')}</button><button class="btn btn-primary" data-act="type-add"${s.places.length ? '' : ' disabled'}>${L('Add', '添加')}</button></div>`, { label: L('Type it in', '手动输入') });
}

export function consentSheet() {
  return wrap(`<h2 class="sheet-title">${L('Link a supermarket account?', '关联超市账号？')}</h2><p class="sheet-sub">${L('Your online orders can be added for you, so you type less.', '网上订单可以自动加进来，少打很多字。')}</p>
    <div class="cols-2"><div><h3>${L('Eat It! reads', 'Eat It! 会读取')}</h3><ul class="pv"><li class="y">${L('Product names and amounts', '商品名称和数量')}</li><li class="y">${L('The day you bought them', '购买日期')}</li></ul></div><div><h3>${L('It never reads', '不会读取')}</h3><ul class="pv"><li class="n">${L('Payment details or your address', '支付信息和你的地址')}</li><li class="n">${L('Anything else in your account', '账号里的其他内容')}</li></ul></div></div>
    <p class="small">${L('If you share a household, housemates only see items you mark as shared. You can unlink any time and delete everything that was imported.', '如果和别人同住，室友只看得到你标成公共的东西。随时可以取消关联，并删掉导入的全部内容。')}</p>
    <div class="btn-row"><button class="btn btn-secondary" data-act="close">${L('Not now', '先不用')}</button><button class="btn btn-primary" data-act="link" data-arg="account|on">${L('Link account', '关联账号')}</button></div>`, { label: L('Link a supermarket account', '关联超市账号') });
}

export function emailSheet(app) {
  const s = app.store.state, p = app.store.persona;
  if (s.links.email) {
    const E = p.email;
    return wrap(`<h2 class="sheet-title">${L('AI checked your inbox', 'AI 查看了你的收件箱')}</h2><p class="sheet-sub">${aiBadge}${esc(L(`Emails from the last 7 days, only from: ${s.links.senders.join(', ') || 'no senders picked'}.`, `最近 7 天的邮件，只看：${s.links.senders.map(dz).join('、') || '没有选发件人'}。`))}</p>
      ${!E || s.done.email ? `<div class="card"><p>${L('No new receipts.', '没有新小票。')}</p></div>` : `<ul class="rows"><li><button class="row" data-act="review" data-arg="email"><span class="row-ic">${ICON.mail({ size: 20 })}</span><span class="r-main"><b>${esc(dz(E.subject))}</b><small>${esc(dz(E.from))} · ${esc(fmtDay(E.when))} · ${L(`${E.lines.length} lines`, `${E.lines.length} 行`)}</small></span><span class="mini">${L('Review', '核对')}</span></button></li></ul>`}`, { label: L('Email receipts', '邮件小票') });
  }
  return wrap(`<h2 class="sheet-title">${L('Let AI read receipts in your email?', '让 AI 读邮箱里的小票？')}</h2>
    <p class="sheet-sub">${aiBadge}${L('Eat It! looks for grocery receipts in your inbox and turns them into a list you check. Nothing is added until you say so.', 'Eat It! 在收件箱里找买菜小票，整理成一张单子给你核对。你确认之前什么都不会加。')}</p>
    <h3>${L('Only look at emails from', '只看这些发件人')}</h3>
    <div class="checks"><label><input type="checkbox" id="em-c1" checked>${dz('Online supermarket orders')}</label><label><input type="checkbox" id="em-c2" checked>${dz('In-store e-receipts')}</label><label><input type="checkbox" id="em-c3">${dz('Meal-kit and delivery apps')}</label></div>
    <div class="cols-2"><div><h3>${L('AI reads', 'AI 会读')}</h3><ul class="pv"><li class="y">${L('Item names, amounts and the date', '商品名、数量和日期')}</li><li class="y">${L('Only emails from the senders you tick', '只读你勾选的发件人')}</li></ul></div><div><h3>${L('It never', '它不会')}</h3><ul class="pv"><li class="n">${L('Opens any other email', '打开别的邮件')}</li><li class="n">${L('Sends, deletes or keeps emails', '发送、删除或保存邮件')}</li><li class="n">${L('Shows your receipts to housemates', '把你的小票给室友看')}</li></ul></div></div>
    <p class="small">${L('You can disconnect any time in Household & settings.', '随时可以在“同住与设置”里断开。')}</p>
    <div class="btn-row"><button class="btn btn-secondary" data-act="close">${L('Not now', '先不用')}</button><button class="btn btn-primary" data-act="email-connect">${L('Connect my email', '连接我的邮箱')}</button></div>`, { label: L('Email receipts', '邮件小票') });
}

export function pickSheet() {
  const ids = Object.keys(FOODS).filter((f) => !food(f).leftover && food(f).cat !== 'nonfood');
  return wrap(`<h2 class="sheet-title">${L('Add food', '添加食物')}</h2><div class="pick-grid">${ids.map((f) => `<button class="pick" data-act="pick-add" data-arg="${esc(f)}">${pic(f, { size: 36 })}<span>${esc(foodName(f, 1))}</span></button>`).join('')}</div>`, { label: L('Add food', '添加食物'), wide: true });
}

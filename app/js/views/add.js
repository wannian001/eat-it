// Adding food. Desktop: the v0.2 "How did it come in?" page. Phone: board 03's camera.
// Every way ends in the same "New food" check (board 03), which on the desktop sits next to the
// receipt, email or photo it came from (v0.2). Recognition is simulated: John and May get fixed lines,
// new users pick food by tapping until a real recogniser is connected.

import { FOODS, CATS, food, foodName, guessDays, defaultQty } from '../foods.js?v=a3e659d';
import { lastSplit, usual, placeOf, hasFreezer, firstOfKind } from '../state.js?v=a3e659d';
import { receiptDay, paperDay, addDays, dateTag, fmtDay, relDay } from '../dates.js?v=a3e659d';
import { spotFor, placeFor } from '../seed.js?v=a3e659d';
import { ICON, CAT_ICON, placeIcon } from '../icons.js?v=a3e659d';
import { esc, pic, qtyText, pageHead, aiBadge } from '../ui.js?v=a3e659d';
import { L, dz, plural } from '../i18n.js?v=a3e659d';

let seq = 0;
const key = () => `l${++seq}`;

export const usualFoods = (app) => app.store.persona.usual || usual(app.store.state);
const pickable = () => Object.keys(FOODS).filter((f) => !food(f).leftover && food(f).cat !== 'nonfood');

const METHODS = () => [
  ['receipt', L('Scan a receipt', '扫小票'), L('Best after a big shop.', '大采购之后最方便。'), true, true],
  ['photo', L('Photo of your food', '给食物拍张照'), L('Snap what you bought.', '拍下买回来的东西。'), false, true],
  ['email', L('Receipts from your email', '邮箱里的小票'), L('AI finds grocery receipts in your inbox. Asks you first.', 'AI 在收件箱里找买菜小票。会先问你。'), false, true],
  ['barcode', L('Scan a barcode', '扫条形码'), L('One item at a time.', '一次一样。')],
  ['type', L('Type it in', '手动输入'), L('Name, where it goes, done.', '写名字、选位置，就好了。')],
  ['account', L('Link a supermarket account', '关联超市账号'), L('Online orders come in by themselves. Asks first.', '网上订单自动进来。会先问你。')],
];
const METHOD_ICON = { receipt: 'receipt', photo: 'camera', email: 'mail', barcode: 'barcode', type: 'pen', account: 'store' };

export function waysPage(app) {
  const s = app.store.state;
  const desc = { email: s.links.email ? L('Connected. Tap to see new receipts.', '已连接。点一下看新小票。') : null, account: s.links.account ? L('Linked. New online orders come in by themselves.', '已关联。新的网上订单会自动进来。') : null };
  return `<div class="page ways">
    <header class="top phone-only"><button class="round" data-act="go" data-arg="add" aria-label="${L('Back', '返回')}">${ICON.back({ size: 18 })}</button><h1>${L('Add food', '添加食物')}</h1></header>
    <div class="desk-only">${pageHead(L('Add food', '添加食物'), L('How did it come in?', '这些食物是怎么来的？'), L('AI reads it, you check it.', 'AI 来读，你来核对。'))}</div>
    <div class="mgrid">${METHODS().map(([k, t, d, main, ai]) => `<button class="method${main ? ' main' : ''}" data-act="method" data-arg="${k}"><span class="m-ic">${ICON[METHOD_ICON[k]]({ size: 22 })}</span><b>${esc(k === 'account' && s.links.account ? L('Supermarket account linked', '超市账号已关联') : t)}${ai ? aiBadge : ''}</b><small>${esc(desc[k] || d)}</small></button>`).join('')}</div>
    <section class="ate-promo"><button class="method" data-act="go" data-arg="ate"><span class="m-ic">${ICON.mic({ size: 22 })}</span><b>${L('Took food out? Say what you ate', '拿了食物？说一句吃了什么')}</b></button></section>
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
  // With the real camera on, the view is the live picture plus a frame for the mode; recognising
  // what's in it is still simulated (the shutter freezes the frame, then the usual results come).
  const live = ui.camLive && p.photo && !a.img;
  const hint = !p.photo ? L('Scanner not connected', '还没接识别功能') : a.img ? (a.scanning ? L('Reading…', '识别中…') : L('Your photo', '你的照片'))
    : a.mode === 'receipt' ? (live ? L('Fit the receipt in the frame', '把小票放进框里') : L('Real receipt goes here', '这里会是真的小票')) : a.mode === 'barcode' ? L('Point at a barcode', '对准条形码') : live ? L('Point at your food', '对准你的食物') : L('Real photo goes here', '这里会是真的照片');
  let view;
  if (live) {
    view = `<video class="cam-feed" autoplay playsinline muted aria-hidden="true"></video><span class="cam-guide g-${a.mode}" aria-hidden="true"></span>${a.mode === 'photo' ? '' : '<span class="scanline"></span>'}`;
  } else if (a.img && a.mode !== 'photo') {
    view = '<span class="scanline"></span>';
  } else if (!p.photo) {
    view = `<div class="cam-pick" role="group" aria-label="${L('Food', '食物')}">${pickable().map((f) => `<button class="usual-b${a.picks.includes(f) ? ' on' : ''}" data-act="usual" data-arg="${esc(f)}" aria-pressed="${a.picks.includes(f)}" aria-label="${esc(foodName(f, 1))}">${pic(f, { size: 34 })}</button>`).join('')}</div>`;
  } else if (a.mode === 'receipt') {
    view = `<div class="cam-receipt" aria-hidden="true">${receiptPaper(p.receipt, { mini: true })}</div><span class="scanline"></span>`;
  } else if (a.mode === 'barcode') {
    view = `<div class="cam-barcode" aria-hidden="true"><span class="bc-frame">${pic(p.barcode.food, { size: 90 })}<span class="bc-lines">${ICON.barcode({ size: 120, stroke: 2.5 })}</span></span></div><span class="scanline"></span>`;
  } else {
    view = `<div class="boxes" aria-hidden="true">${lines.map((l, i) => `<span class="box box-${boxSize(i)}${l.unsure ? ' box-unsure' : ''}">${pic(l.food, { size: i < 2 ? 76 : 58 })}${l.unsure ? '<span class="q">?</span>' : ''}</span>`).join('')}</div><span class="scanline"></span>`;
  }
  return `<div class="screen cam${a.scanning ? ' scanning' : ''}"${a.img ? ` style="--photo:url('${a.img}')"` : ''}>
    <header class="cam-top">
      <button class="round light" data-act="go" data-arg="home" aria-label="${L('Close', '关闭')}">${ICON.close({ size: 18 })}</button>
      <span class="cam-hint">${esc(hint)}</span>
      <span class="cam-count" aria-label="${L(`${n} items`, `${n} 样`)}">${n}</span>
    </header>
    <div class="cam-view${a.img ? ' has-photo' : ''}">${view}</div>
    <div class="cam-bottom">
      <div class="usual" role="group" aria-label="${L('Usual', '常买')}">
        <span class="usual-l">${L('Usual', '常买')}</span>
        ${usualFoods(app).map((f) => `<button class="usual-b${a.picks.includes(f) ? ' on' : ''}" data-act="usual" data-arg="${esc(f)}" aria-pressed="${a.picks.includes(f)}" aria-label="${esc(foodName(f, 1))}">${pic(f, { size: 30 })}</button>`).join('')}
      </div>
      <div class="mode" role="group" aria-label="${L('Scan', '扫描')}">
        ${[['photo', L('Photo', '拍照')], ['receipt', L('Receipt', '小票')], ['barcode', L('Barcode', '条形码')]].map(([k, t]) => `<button class="${a.mode === k ? 'on' : ''}" data-act="mode" data-arg="${k}" aria-pressed="${a.mode === k}"${!p.photo && k !== 'photo' ? ' disabled' : ''}>${t}</button>`).join('')}
      </div>
      <div class="cam-row">
        <label class="cam-side" aria-label="${L('Choose a photo', '选一张照片')}">${ICON.camera({ size: 20 })}<input type="file" accept="image/*" data-file="scan"${p.photo ? '' : ' disabled'}></label>
        <button class="shutter" data-act="shoot" aria-label="${p.photo ? L('Scan', '扫描') : L('Next', '下一步')}"></button>
        <button class="cam-side" data-act="go" data-arg="ways" aria-label="${L('Other ways to add food', '其他添加方式')}">${ICON.dots({ size: 20 })}</button>
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
  return `<div class="paper${mini ? ' mini' : ''}"><div class="ptop">SUPERMARKET<br>TAX INVOICE<br>${esc(paperDay(R.when))} ${esc(R.time || '')}</div><div class="pdash"></div>${R.lines.map((l) => `<div class="pline"><span>${esc(l.raw)}</span><span>${esc(l.price)}</span></div>`).join('')}<div class="pdash"></div>${total ? `<div class="pline tot"><span>TOTAL</span><span>$${total}</span></div>` : ''}<div class="pfoot">${R.lines.length} ITEMS · THANK YOU</div></div>`;
}

function sourcePanel(app) {
  const p = app.store.persona, a = app.ui.add;
  if (a.src === 'receipt') return receiptPaper(p.receipt);
  if (a.src === 'email') {
    const E = p.email;
    const total = E.lines.reduce((t, l) => t + parseFloat(l.price || 0), 0).toFixed(2);
    return `<div class="mail"><div class="mail-h"><b>${esc(dz(E.from))}</b><span>${esc(fmtDay(E.when))} · ${esc(E.time)}</span></div><p class="mail-s">${esc(dz(E.subject))}</p>${E.lines.map((l) => `<div class="mline"><span>${esc(l.raw)}</span><span>$${esc(l.price)}</span></div>`).join('')}<div class="mline tot"><span>${L('Total', '合计')}</span><span>$${total}</span></div><p class="mail-f">${aiBadge}${L('Only this email was opened.', '只打开了这一封邮件。')}</p></div>`;
  }
  if (a.src === 'barcode') return `<div class="shot-ph tall">${pic(p.barcode.food, { size: 96 })}<code>${esc(p.barcode.raw)}</code></div>`;
  if (a.src === 'photo') {
    const found = (p.photo?.lines || []).length;
    return `<div class="shot">${a.img ? `<img src="${a.img}" alt="${L('Your photo of the food', '你拍的食物照片')}">` : `<div class="boxes demo">${(p.photo?.lines || []).map((l, i) => `<span class="box box-${boxSize(i)}${l.unsure ? ' box-unsure' : ''}">${pic(l.food, { size: 48 })}<span class="n">${i + 1}</span></span>`).join('')}</div>`}<span class="shot-cap">${aiBadge}${L(`found ${found} things`, `找到 ${found} 样`)}</span></div>`;
  }
  return `<div class="shot-ph tall">${ICON.pen({ size: 48, stroke: 1.4 })}<span>${L('Picked by you', '你自己选的')}</span></div>`;
}

function splitRow(app, line) {
  const last = lastSplit(app.store.state, line.food);
  const opts = [...new Set([1, 2, last || 4])];
  if (!opts.includes(line.bags)) opts.push(line.bags);
  const each = line.bags > 1 ? qtyText(line.qty / line.bags, line.unit) : null;
  return `<div class="rsplit">
    <span class="rsplit-l">${last ? L(`${last} bags, like last time`, `和上次一样分 ${last} 袋`) : L('Split into bags for the freezer?', '分成几袋再冻？')}${each ? esc(L(` · ${each} each`, ` · 每袋 ${each}`)) : ''}</span>
    <span class="chips">${opts.map((o) => `<button class="chip${line.bags === o ? ' on' : ''}" data-act="bags" data-arg="${line.key}|${o}" aria-pressed="${line.bags === o}">${o === 1 ? L('Whole', '不分') : o}</button>`).join('')}<button class="chip" data-act="bags" data-arg="${line.key}|+" aria-label="${L('More bags', '多分一袋')}">${ICON.plus({ size: 14, stroke: 2.4 })}</button></span>
  </div>`;
}

function lineHtml(app, line, first) {
  const { store, ui } = app;
  const s = store.state, today = store.today;
  const f = line.answer || line.food;
  const cat = line.cat || food(f).cat;
  if (line.skip) {
    return `<li class="rline skipped${first ? ' cat-start' : ''}"><span class="rcat"></span><span class="rpic">${pic(f, { size: 30 })}</span><div class="rmain"><s>${esc(foodName(f, line.qty, line))}</s><small>${L("won't be added", '不会加进去')}</small></div><div class="rright"><button class="chip-btn" data-act="line-restore" data-arg="${line.key}">${L('Put back', '放回来')}</button></div></li>`;
  }
  const d = shownDate(line, today);
  const t = d ? dateTag(d, today, 'receipt') : { text: line.nonfood ? '' : app.ui.add.src === 'photo' ? L('No date in the photo', '照片里看不到日期') : L('No date on the receipt', '小票上没有日期'), kind: 'none' };
  const dateEl = line.date?.kind === 'est' && line.date.days != null
    ? (ui.add.edit === line.key
      ? `<span class="stepper sm"><button class="step" data-act="line-days" data-arg="${line.key}|-1" aria-label="${L('One day sooner', '早一天')}">${ICON.minus({ size: 14 })}</button><span class="rdate d-est">${esc(t.text)}</span><button class="step" data-act="line-days" data-arg="${line.key}|1" aria-label="${L('One day later', '晚一天')}">${ICON.plus({ size: 14 })}</button></span>`
      : `<button class="rdate d-est as-link" data-act="line-edit" data-arg="${line.key}" aria-label="${esc(L(`Change estimate, now ${t.text}`, `修改估计，现在是${t.text}`))}">${esc(t.text)}</button>`)
    : `<span class="rdate d-${t.kind}">${esc(t.text)}</span>`;
  const packDate = !line.nonfood && (!line.date || line.date.guess)
    ? `<select class="mini-sel" data-change="line-date" data-arg="${line.key}" aria-label="${L('Add the date from the pack', '填包装上的日期')}"><option value="">${L('Add date from pack…', '填包装上的日期…')}</option>${[1, 2, 3, 5, 7, 10, 14].map((n) => `<option value="use_by|${addDays(today, n)}">${esc(L(`Use by ${relDay(addDays(today, n), today)}`, `食用期限 ${relDay(addDays(today, n), today)}`))}</option>`).join('')}${[7, 30, 90].map((n) => `<option value="best_before|${addDays(today, n)}">${esc(L(`Best before ${fmtDay(addDays(today, n))}`, `最佳食用 ${fmtDay(addDays(today, n))}`))}</option>`).join('')}</select>`
    : '';
  const q = esc(qtyText(line.qty, line.unit));
  const qtyEl = ui.add.editQty === line.key
    ? `<span class="stepper sm"><button class="step" data-act="line-qty" data-arg="${line.key}|-1" aria-label="${L('Less', '少一点')}">${ICON.minus({ size: 14 })}</button><span class="rqty">${q}</span><button class="step" data-act="line-qty" data-arg="${line.key}|1" aria-label="${L('More', '多一点')}">${ICON.plus({ size: 14 })}</button></span>`
    : `<button class="rqty as-link" data-act="qty-edit" data-arg="${line.key}" aria-label="${L(`Change amount, now ${q}`, `修改数量，现在是 ${q}`)}">${q}</button>`;
  const place = placeOf(s, line.place);
  const ctl = line.nonfood && !line.keep ? '' : `<span class="chips">
      <button class="chip" data-act="line-place" data-arg="${line.key}" title="${L('Change where it goes', '换个地方放')}">${place ? placeIcon(place, { size: 14 }) : ''}${esc(place ? dz(place.name) : L('Choose a place', '选个地方'))}</button>
      ${s.house ? `<button class="chip" data-act="owner" data-arg="${line.key}">${line.owner === 'shared' ? `${ICON.people({ size: 14 })}${L('Shared', '公共')}` : L('Mine', '我的')}</button>` : ''}
    </span>`;
  const unsure = line.unsure
    ? `<div class="rq"><span class="hint">${line.unsure.length ? esc(L(`AI isn't sure: ${foodName(line.food, 2).toLowerCase()} or ${line.unsure.map((x) => foodName(x, 2).toLowerCase()).join(' or ')}?`, `AI 不太确定：是${foodName(line.food, 2)}还是${line.unsure.map((x) => foodName(x, 2)).join('还是')}？`)) : L("AI isn't sure about this line.", 'AI 不太确定这一行。')}</span>
       <span class="chips">${[line.food, ...line.unsure].map((alt, i) => `<button class="chip${line.answer === alt ? ' on' : ''}" data-act="answer" data-arg="${line.key}|${esc(alt)}" aria-pressed="${line.answer === alt}">${esc(foodName(alt, 1))}</button>`).join('')}</span></div>`
    : '';
  const nonfood = line.nonfood && !line.keep
    ? `<div class="rq"><span class="hint">${L("AI thinks this isn't food.", 'AI 觉得这不是食物。')}</span><span class="chips"><button class="chip on" data-act="line-skip" data-arg="${line.key}">${L('Skip it', '跳过')}</button><button class="chip" data-act="line-keep" data-arg="${line.key}">${L("It's food", '是食物')}</button></span></div>`
    : '';
  return `<li class="rline${first ? ' cat-start' : ''}${needs(line) ? ' need' : ''}">
    <span class="rcat cat-${cat}">${first ? (CAT_ICON[cat] || CAT_ICON.other)({ size: 16 }) : ''}</span>
    <span class="rpic">${pic(f, { size: 30, lot: line })}</span>
    <div class="rmain">
      ${line.raw ? `<code class="raw">${esc(line.raw)}</code>` : ''}
      <div class="rname">${esc(foodName(f, line.qty, line))}${line.unsure && !line.answer ? '?' : ''}</div>
      ${dateEl}${packDate}
    </div>
    <div class="rright">${qtyEl}<button class="rx" data-act="line-remove" data-arg="${line.key}" aria-label="${esc(L(`Remove ${foodName(f, line.qty, line)}`, `去掉${foodName(f, line.qty, line)}`))}">${ICON.close({ size: 14 })}</button></div>
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
  const title = src === 'photo' ? L('Check what AI found', '核对 AI 找到的') : src === 'email' ? L('Check your email receipt', '核对邮件小票') : src === 'receipt' ? L('Check your receipt', '核对小票') : L('New food', '新食物');
  const sub = src === 'photo' ? `${aiBadge}${L('found these in your photo. Check each one.', '在照片里找到这些，请逐个核对。')}`
    : src === 'email' ? `${aiBadge}${L('made this list from your email. Check each line.', '从邮件里整理出这张单子，请逐行核对。')}`
    : src === 'receipt' ? `${aiBadge}${L('read each line. Check each one; add dates from the pack.', '读了每一行。请逐行核对，再填上包装上的日期。')}`
    : L('Check the list, then put it all in.', '核对一下，然后全部放进去。');
  const btn = ui.add.lines.length ? (need ? L(`Check ${need} ${plural(need, 'line')} first`, `先核对 ${need} 行`) : L(`Put it all in · ${n}`, `全部放进去 · ${n}`)) : L('Nothing to add', '没有要加的');
  const SRC = { photo: L('Photo', '照片'), email: L('Email', '邮件'), receipt: L('Receipt', '小票'), barcode: L('Barcode', '条形码') };
  return `<div class="page review">
    <header class="top phone-only"><button class="round" data-act="go" data-arg="${src === 'email' ? 'ways' : 'add'}" aria-label="${L('Back', '返回')}">${ICON.back({ size: 18 })}</button><h1>${L('New food', '新食物')}</h1></header>
    <div class="desk-only"><button class="link back-link" data-act="go" data-arg="add">${ICON.back({ size: 14 })}${L('Add food', '添加食物')}</button>${pageHead(src === 'picks' ? L('Add food', '添加食物') : `${esc(SRC[src] || src)} · ${esc(fmtDay(store.today))}`, title, sub)}</div>
    <div class="rgrid">
      <div class="desk-only src">${sourcePanel(app)}</div>
      <div>
        <div class="receipt">
          <div class="receipt-h"><span>${esc(receiptDay(store.today))}</span><span>${lines.length}</span></div>
          <ul class="rlist">${items}</ul>
          <button class="add-more" data-act="sheet" data-arg="pick">${ICON.plus({ size: 14, stroke: 2.4 })}${L('Add more', '再加一些')}</button>
        </div>
        <div class="confirm"><span class="muted">${need ? L(`${need} line${need > 1 ? 's need' : ' needs'} a quick check.`, `有 ${need} 行要核对一下。`) : L('Everything checked.', '都核对好了。')}</span>
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

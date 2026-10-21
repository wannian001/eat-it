// Household & settings + account (v0.2 "Sharing & settings" and "Account" on one page),
// plus the user switcher on the phone and the widget and lock-screen previews.

import { ICON, placeIcon, wordmark } from '../icons.js';
import { esc, pageHead, secHead, toggle, aiBadge, langSwitch } from '../ui.js';
import { phoneTitle, fullText } from './parts.js';
import { userCard } from './people.js';
import { placeKinds } from '../seed.js';
import { L, dz } from '../i18n.js';

const setRow = (icon, title, sub, right) => `<li><span class="row-ic">${ICON[icon]({ size: 20 })}</span><span class="r-main"><b>${title}</b><small>${sub}</small></span>${right}</li>`;

export function householdPage(app) {
  const { store, ui } = app;
  const s = store.state, p = store.persona;
  const st = s.settings;
  const mates = s.house?.mates || [];
  const name = s.profile.name || p.name;
  const house = s.house
    ? `<div class="card"><p class="card-t">${esc(dz(s.house.name))}</p>
        <div class="members"><span class="mem"><span class="avatar av-0">${esc(name[0])}</span><b>${esc(name)}</b><small class="muted">${L('(you)', '（你）')}</small></span>${mates.map((m, i) => `<span class="mem"><span class="avatar av-${i + 1}">${esc(m.initial)}</span>${esc(m.name)}</span>`).join('') || `<span class="muted">${L('Waiting for housemates to join.', '等室友加入。')}</span>`}</div>
        ${s.house.code ? `<p class="flab">${L('Invite code', '邀请码')}</p><div class="code-row"><span class="code">${esc(s.house.code)}</span><button class="btn btn-secondary sm" data-act="copy-code" data-arg="${esc(s.house.code)}">${L('Copy', '复制')}</button></div><p class="small">${L('Send this to a housemate. They type it when they set up the app.', '把它发给室友，他们设置 App 时输进去。')}</p>` : ''}
        ${ui.confirm === 'leave' ? `<div class="confirm-box"><p>${L('Leave this household? Your own food stays with you. Shared items stay with the household.', '退出这个家？你自己的食物跟着你走，公共的东西留在家里。')}</p><div class="btn-row"><button class="btn btn-danger sm" data-act="house" data-arg="leave">${L('Leave', '退出')}</button><button class="btn btn-quiet sm" data-act="confirm" data-arg="">${L('Cancel', '取消')}</button></div></div>` : `<div class="btn-row"><button class="btn btn-quiet sm" data-act="confirm" data-arg="leave">${L('Leave household', '退出这个家')}</button></div>`}
      </div>`
    : `<div class="card"><p class="card-t">${L('Just you', '只有你')}</p><p class="muted">${L('If you share a kitchen, housemates can see shared food and a shared list. Your own food stays private.', '如果和别人共用厨房，室友能看到公共的食物和一起用的清单。你自己的食物不公开。')}</p>
        <div class="btn-row wrap"><button class="btn btn-primary sm" data-act="house" data-arg="create">${L('Start a household', '建一个家')}</button><button class="btn btn-secondary sm" data-act="confirm" data-arg="join">${L('Join with a code', '用邀请码加入')}</button></div>
        ${ui.confirm === 'join' ? `<div class="addrow"><input id="join-code" type="text" placeholder="EI-4821" autocomplete="off" aria-label="${L('Invite code', '邀请码')}"><button class="btn btn-primary sm" data-act="house" data-arg="join">${L('Join', '加入')}</button></div>` : ''}</div>`;
  const sharing = mates.length ? `<section>${secHead(L('What your housemates can see', '室友能看到什么'))}<ul class="set">
      ${setRow('fridge', L('Shared food and how much is left', '公共食物和还剩多少'), L("Needed for a shared fridge, so it's always on.", '共用冰箱必须有，所以一直开着。'), toggle('noop', '', true, L('Shared food', '公共食物'), true))}
      ${setRow('cart', L("The shared list and who's getting what", '一起用的清单，以及谁买什么'), L('Always on.', '一直开着。'), toggle('noop', '', true, L('Shared list', '一起用的清单'), true))}
      ${setRow('bars', L('How full my shelf is', '我那层有多满'), L("Helps everyone see if there's room before a big shop.", '大采购之前，大家能看看还有没有地方。'), toggle('set', 'shareShelf', st.shareShelf, L('Share how full my shelf is', '分享我那层有多满')))}
    </ul><p class="flab">${L('Never shown to anyone', '永远不给任何人看')}</p><ul class="never"><li>${L('Your own food', '你自己的食物')}</li><li>${L('Who used up shared food', '谁用完了公共食物')}</li><li>${L('What you ate or threw out', '你吃了或扔了什么')}</li></ul></section>
    ${p.shelves ? `<section>${secHead(L('Fridge shelves', '冰箱各层'))}<div class="card">${p.shelves.map((x) => `<div class="shelf-bar"><span><b>${esc(dz(x.name))}</b><small class="muted">${esc(dz(x.who))}</small></span><div class="bar${x.pct >= 80 ? ' hi' : ''}"><i style="width:${x.pct}%"></i></div><em>${L(`about ${x.pct}%`, `约 ${x.pct}%`)}</em></div>`).join('')}</div></section>` : ''}` : '';
  const confirmClear = ui.confirm === 'clear'
    ? `<div class="confirm-box"><p>${p.builtin ? esc(L(`Start ${name} over with the original fridge, dated from today? Everything recorded since is cleared.`, `让 ${name} 从原来的冰箱重新开始，日期从今天算？之后记的都会清掉。`)) : L("Clear your fridge, places and settings on this device? This can't be undone.", '清空这台设备上你的冰箱、存放地方和设置？清了就恢复不了。')}</p><div class="btn-row"><button class="btn btn-danger sm" data-act="reset">${p.builtin ? L('Start over', '重新开始') : L('Clear everything', '全部清空')}</button><button class="btn btn-quiet sm" data-act="confirm" data-arg="">${L('Keep it', '保留')}</button></div></div>`
    : ui.confirm === 'remove'
      ? `<div class="confirm-box"><p>${esc(L(`Remove ${name} and everything they recorded from this device?`, `从这台设备上删掉 ${name} 和 TA 记的所有东西？`))}</p><div class="btn-row"><button class="btn btn-danger sm" data-act="user-remove">${L('Remove user', '删掉用户')}</button><button class="btn btn-quiet sm" data-act="confirm" data-arg="">${L('Keep', '保留')}</button></div></div>` : '';
  return `<div class="page household">
    ${phoneTitle(app, L('Household', '同住与设置'))}
    <div class="desk-only">${pageHead(L('Household & settings', '同住与设置'), esc(L(`${name}'s household`, `${name} 的家`)), esc(dz(s.house?.name || 'Lives alone')))}</div>
    <section class="phone-only">${userCard(app)}</section>
    <div class="cols2">
      <div class="stack">
        <section>${secHead(L('Household', '同住'))}${house}</section>
        ${sharing}
        <section>${secHead(L('Profile', '个人资料'))}<div class="card profile"><span class="avatar av-0 lg">${esc(name[0])}</span><label class="fld"><span>${L('First name', '名字')}</span><input type="text" value="${esc(name)}" data-change="profile-name" autocomplete="off"></label></div><p class="small">${L('Housemates see your first name, never your email.', '室友只看到你的名字，看不到你的邮箱。')}</p></section>
        <section>${secHead(L('Language', '语言'))}<div class="card lang-card"><p class="muted">${L('The app is in English. Switch to Chinese any time.', 'App 现在是中文。随时可以换成英文。')}</p>${langSwitch()}</div></section>
      </div>
      <div class="stack">
        <section>${secHead(L('Storage places', '存放的地方'), `<button class="link" data-act="sheet" data-arg="places">${L('Edit', '编辑')}</button>`)}<ul class="set">${s.places.map((pl) => setRow('fridge', esc(dz(pl.name)), `${esc(placeKinds()[pl.kind])} · ${esc(fullText({ ...pl, src: null }))}`, `<button class="chip-btn" data-act="sheet" data-arg="measure:${esc(pl.id)}">${ICON.camera({ size: 14 })}${L('Measure', '量一下')}</button>`).replace(ICON.fridge({ size: 20 }), placeIcon(pl, { size: 20 }))).join('') || `<li class="muted-row">${L('No storage places yet.', '还没有存放的地方。')}</li>`}</ul></section>
        <section>${secHead(L('Reminders', '提醒'))}<ul class="set">
          ${setRow('bell', L('Morning summary at 8:00', '早上 8:00 的小结'), L('What to use today, and where each date comes from.', '今天要用掉什么，每个日期是从哪来的。'), toggle('set', 'summary', st.summary, L('Morning summary', '早上的小结')))}
          ${setRow('moon', L('Quiet hours, 10 pm – 8 am', '免打扰，晚上 10 点到早上 8 点'), L('No reminders while you sleep.', '睡觉时不提醒。'), toggle('set', 'quiet', st.quiet, L('Quiet hours', '免打扰')))}
          ${setRow('lock', L('Show food names on the lock screen', '在锁屏上显示食物名'), st.lockNames ? L('Food names show on the lock screen.', '锁屏上会显示食物名。') : L('Off: the lock screen only says you have food to use today.', '已关闭：锁屏只说今天有东西要用掉。'), toggle('set', 'lockNames', st.lockNames, L('Food names on the lock screen', '锁屏显示食物名')))}
        </ul></section>
        <section>${secHead(L('Email receipts', '邮件小票'))}<div class="card conn"><span class="row-ic">${ICON.mail({ size: 20 })}</span><div>${s.links.email ? `<p class="card-t">${L('Connected', '已连接')} ${aiBadge}</p><p class="muted">${esc(L(`AI only looks at: ${s.links.senders.join(', ')}.`, `AI 只看：${s.links.senders.map(dz).join('、')}。`))}</p><div class="btn-row"><button class="btn btn-secondary sm" data-act="link" data-arg="email|off">${L('Disconnect', '断开')}</button></div>` : `<p class="card-t">${L('Not connected', '未连接')}</p><p class="muted">${L('Let AI turn emailed grocery receipts into a list you check.', '让 AI 把邮件里的买菜小票整理成单子给你核对。')}</p><div class="btn-row"><button class="btn btn-secondary sm" data-act="method" data-arg="email">${L('Connect email', '连接邮箱')}</button></div>`}</div></div></section>
        <section>${secHead(L('Supermarket account', '超市账号'))}<div class="card conn"><span class="row-ic">${ICON.store({ size: 20 })}</span><div>${s.links.account ? `<p class="card-t">${L('Linked', '已关联')}</p><p class="muted">${L('Eat It! reads product names, amounts and purchase dates. Nothing else.', 'Eat It! 只读商品名、数量和购买日期，别的都不读。')}</p><div class="btn-row"><button class="btn btn-secondary sm" data-act="link" data-arg="account|off">${L('Unlink', '取消关联')}</button></div>` : `<p class="card-t">${L('Not linked', '未关联')}</p><p class="muted">${L('Link it to add online orders without typing.', '关联后，网上订单不用打字就能加进来。')}</p><div class="btn-row"><button class="btn btn-secondary sm" data-act="method" data-arg="account">${L('Link an account', '关联账号')}</button></div>`}</div></div></section>
        <section>${secHead(L('Outside the app', 'App 之外'))}<div class="btn-row"><button class="btn btn-secondary" data-act="go" data-arg="widgets">${ICON.grid({ size: 18 })}${L('Widgets', '桌面小组件')}</button><button class="btn btn-secondary" data-act="go" data-arg="lock">${ICON.phone({ size: 18 })}${L('Lock screen', '锁屏')}</button></div></section>
        <section>${secHead(L('Your data', '你的数据'))}<ul class="set">
          ${setRow('download', L('Download a copy', '下载一份'), L('Everything you recorded, as one file.', '你记的所有东西，存成一个文件。'), `<button class="chip-btn" data-act="export">${L('Download', '下载')}</button>`)}
          ${app.store.adapter.canClear === false ? '' : setRow('undo', p.builtin ? L('Start over', '重新开始') : L('Clear everything on this device', '清空这台设备上的数据'), p.builtin ? L('Back to the original fridge, dated from today.', '回到原来的冰箱，日期从今天算。') : L('Your food, places and settings.', '你的食物、存放地方和设置。'), `<button class="chip-btn" data-act="confirm" data-arg="clear">${p.builtin ? L('Start over', '重新开始') : L('Clear', '清空')}</button>`)}
          ${p.builtin || app.store.adapter.canClear === false ? '' : setRow('user', L('Remove this user', '删掉这个用户'), L('Takes them off this device.', '从这台设备上删掉。'), `<button class="chip-btn" data-act="confirm" data-arg="remove">${L('Remove', '删除')}</button>`)}
        </ul>${confirmClear}${store.error ? `<p class="err">${L('Not saved', '没保存上')}: ${esc(store.error.message)}</p>` : ''}</section>
        <p class="phone-only brand-foot">${wordmark('sm')}</p>
      </div>
    </div>
  </div>`;
}

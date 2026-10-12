// Household & settings + account (v0.2 "Sharing & settings" and "Account" on one page),
// plus the user switcher on the phone and the widget and lock-screen previews.

import { ICON, placeIcon, wordmark } from '../icons.js';
import { esc, pageHead, secHead, toggle, aiBadge } from '../ui.js';
import { phoneTitle } from './parts.js';
import { userCard } from './people.js';

const KIND = { cold: 'Cold (fridge)', frozen: 'Frozen (freezer)', room: 'Room temperature' };

const setRow = (icon, title, sub, right) => `<li><span class="row-ic">${ICON[icon]({ size: 20 })}</span><span class="r-main"><b>${title}</b><small>${sub}</small></span>${right}</li>`;

export function householdPage(app) {
  const { store, ui } = app;
  const s = store.state, p = store.persona;
  const st = s.settings;
  const mates = s.house?.mates || [];
  const name = s.profile.name || p.name;
  const house = s.house
    ? `<div class="card"><p class="card-t">${esc(s.house.name)}</p>
        <div class="members"><span class="mem"><span class="avatar av-0">${esc(name[0])}</span><b>${esc(name)}</b><small class="muted">(you)</small></span>${mates.map((m, i) => `<span class="mem"><span class="avatar av-${i + 1}">${esc(m.initial)}</span>${esc(m.name)}</span>`).join('') || '<span class="muted">Waiting for housemates to join.</span>'}</div>
        ${s.house.code ? `<p class="flab">Invite code</p><div class="code-row"><span class="code">${esc(s.house.code)}</span><button class="btn btn-secondary sm" data-act="copy-code" data-arg="${esc(s.house.code)}">Copy</button></div><p class="small">Send this to a housemate. They type it when they set up the app.</p>` : ''}
        ${ui.confirm === 'leave' ? `<div class="confirm-box"><p>Leave this household? Your own food stays with you. Shared items stay with the household.</p><div class="btn-row"><button class="btn btn-danger sm" data-act="house" data-arg="leave">Leave</button><button class="btn btn-quiet sm" data-act="confirm" data-arg="">Cancel</button></div></div>` : `<div class="btn-row"><button class="btn btn-quiet sm" data-act="confirm" data-arg="leave">Leave household</button></div>`}
      </div>`
    : `<div class="card"><p class="card-t">Just you</p><p class="muted">If you share a kitchen, housemates can see shared food and a shared list. Your own food stays private.</p>
        <div class="btn-row wrap"><button class="btn btn-primary sm" data-act="house" data-arg="create">Start a household</button><button class="btn btn-secondary sm" data-act="confirm" data-arg="join">Join with a code</button></div>
        ${ui.confirm === 'join' ? `<div class="addrow"><input id="join-code" type="text" placeholder="EI-4821" autocomplete="off" aria-label="Invite code"><button class="btn btn-primary sm" data-act="house" data-arg="join">Join</button></div>` : ''}</div>`;
  const sharing = mates.length ? `<section>${secHead('What your housemates can see')}<ul class="set">
      ${setRow('fridge', 'Shared food and how much is left', 'Needed for a shared fridge, so it\'s always on.', toggle('noop', '', true, 'Shared food', true))}
      ${setRow('cart', 'The shared list and who\'s getting what', 'Always on.', toggle('noop', '', true, 'Shared list', true))}
      ${setRow('bars', 'How full my shelf is', 'Helps everyone see if there\'s room before a big shop.', toggle('set', 'shareShelf', st.shareShelf, 'Share how full my shelf is'))}
    </ul><p class="flab">Never shown to anyone</p><ul class="never"><li>Your own food</li><li>Who used up shared food</li><li>What you ate or threw out</li></ul></section>
    ${p.shelves ? `<section>${secHead('Fridge shelves')}<div class="card">${p.shelves.map((x) => `<div class="shelf-bar"><span><b>${esc(x.name)}</b><small class="muted">${esc(x.who)}</small></span><div class="bar${x.pct >= 80 ? ' hi' : ''}"><i style="width:${x.pct}%"></i></div><em>about ${x.pct}%</em></div>`).join('')}</div></section>` : ''}` : '';
  const confirmClear = ui.confirm === 'clear'
    ? `<div class="confirm-box"><p>${p.builtin ? `Start ${esc(name)} over with the original fridge, dated from today? Everything recorded since is cleared.` : 'Clear your fridge, places and settings on this device? This can\'t be undone.'}</p><div class="btn-row"><button class="btn btn-danger sm" data-act="reset">${p.builtin ? 'Start over' : 'Clear everything'}</button><button class="btn btn-quiet sm" data-act="confirm" data-arg="">Keep it</button></div></div>`
    : ui.confirm === 'remove'
      ? `<div class="confirm-box"><p>Remove ${esc(name)} and everything they recorded from this device?</p><div class="btn-row"><button class="btn btn-danger sm" data-act="user-remove">Remove user</button><button class="btn btn-quiet sm" data-act="confirm" data-arg="">Keep</button></div></div>` : '';
  return `<div class="page household">
    ${phoneTitle(app, 'Household')}
    <div class="desk-only">${pageHead('Household & settings', `${esc(name)}'s household`, esc(s.house?.name || 'Lives alone'))}</div>
    <section class="phone-only">${userCard(app)}</section>
    <div class="cols2">
      <div class="stack">
        <section>${secHead('Household')}${house}</section>
        ${sharing}
        <section>${secHead('Profile')}<div class="card profile"><span class="avatar av-0 lg">${esc(name[0])}</span><label class="fld"><span>First name</span><input type="text" value="${esc(name)}" data-change="profile-name" autocomplete="off"></label></div><p class="small">Housemates see your first name, never your email.</p></section>
      </div>
      <div class="stack">
        <section>${secHead('Storage places', '<button class="link" data-act="sheet" data-arg="places">Edit</button>')}<ul class="set">${s.places.map((pl) => setRow('fridge', esc(pl.name), `${esc(KIND[pl.kind])} · ${pl.full == null ? 'not measured yet' : `about ${pl.full}% full`}`, `<button class="chip-btn" data-act="sheet" data-arg="measure:${esc(pl.id)}">${ICON.camera({ size: 14 })}Measure</button>`).replace(ICON.fridge({ size: 20 }), placeIcon(pl, { size: 20 }))).join('') || '<li class="muted-row">No storage places yet.</li>'}</ul></section>
        <section>${secHead('Reminders')}<ul class="set">
          ${setRow('bell', 'Morning summary at 8:00', 'What to use today, and where each date comes from.', toggle('set', 'summary', st.summary, 'Morning summary'))}
          ${setRow('moon', 'Quiet hours, 10 pm – 8 am', 'No reminders while you sleep.', toggle('set', 'quiet', st.quiet, 'Quiet hours'))}
          ${setRow('lock', 'Show food names on the lock screen', st.lockNames ? 'Food names show on the lock screen.' : 'Off: the lock screen only says you have food to use today.', toggle('set', 'lockNames', st.lockNames, 'Food names on the lock screen'))}
        </ul></section>
        <section>${secHead('Email receipts')}<div class="card conn"><span class="row-ic">${ICON.mail({ size: 20 })}</span><div>${s.links.email ? `<p class="card-t">Connected ${aiBadge}</p><p class="muted">AI only looks at: ${esc(s.links.senders.join(', '))}.</p><div class="btn-row"><button class="btn btn-secondary sm" data-act="link" data-arg="email|off">Disconnect</button></div>` : `<p class="card-t">Not connected</p><p class="muted">Let AI turn emailed grocery receipts into a list you check.</p><div class="btn-row"><button class="btn btn-secondary sm" data-act="method" data-arg="email">Connect email</button></div>`}</div></div></section>
        <section>${secHead('Supermarket account')}<div class="card conn"><span class="row-ic">${ICON.store({ size: 20 })}</span><div>${s.links.account ? `<p class="card-t">Linked</p><p class="muted">Eat It! reads product names, amounts and purchase dates. Nothing else.</p><div class="btn-row"><button class="btn btn-secondary sm" data-act="link" data-arg="account|off">Unlink</button></div>` : `<p class="card-t">Not linked</p><p class="muted">Link it to add online orders without typing.</p><div class="btn-row"><button class="btn btn-secondary sm" data-act="method" data-arg="account">Link an account</button></div>`}</div></div></section>
        <section>${secHead('Outside the app')}<div class="btn-row"><button class="btn btn-secondary" data-act="go" data-arg="widgets">${ICON.grid({ size: 18 })}Widgets</button><button class="btn btn-secondary" data-act="go" data-arg="lock">${ICON.phone({ size: 18 })}Lock screen</button></div></section>
        <section>${secHead('Your data')}<ul class="set">
          ${setRow('download', 'Download a copy', 'Everything you recorded, as one file.', '<button class="chip-btn" data-act="export">Download</button>')}
          ${app.store.adapter.canClear === false ? '' : setRow('undo', p.builtin ? 'Start over' : 'Clear everything on this device', p.builtin ? 'Back to the original fridge, dated from today.' : 'Your food, places and settings.', `<button class="chip-btn" data-act="confirm" data-arg="clear">${p.builtin ? 'Start over' : 'Clear'}</button>`)}
          ${p.builtin || app.store.adapter.canClear === false ? '' : setRow('user', 'Remove this user', 'Takes them off this device.', '<button class="chip-btn" data-act="confirm" data-arg="remove">Remove</button>')}
        </ul>${confirmClear}${store.error ? `<p class="err">Not saved: ${esc(store.error.message)}</p>` : ''}</section>
        <p class="phone-only brand-foot">${wordmark('sm')}</p>
      </div>
    </div>
  </div>`;
}

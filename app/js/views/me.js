// Tapping the avatar: whose fridge is showing, the two outside-the-app previews, and data.
import { PERSONAS, PERSONA_IDS } from '../seed.js';
import { wordmark } from '../icons.js';
import { esc } from '../ui.js';

export function meSheet(app) {
  const { store, ui } = app;
  const p = store.persona;
  const confirm = ui.sheet.confirm;
  const data = p.demo
    ? `<button class="btn btn-secondary wide" data-act="reset">Reset demo</button>`
    : `<button class="btn btn-secondary wide" data-act="export">Export my data</button>
       ${confirm
        ? `<div class="btn-row"><button class="btn btn-danger" data-act="reset">Clear my fridge</button><button class="btn btn-secondary" data-act="reset-cancel">Keep it</button></div>`
        : `<button class="btn btn-quiet wide" data-act="reset-ask">Clear my fridge</button>`}`;
  return `<div class="sheet-wrap" data-act="close" role="presentation">
    <section class="sheet me" role="dialog" aria-modal="true" aria-label="People and settings" data-stop>
      <span class="handle" aria-hidden="true"></span>
      <div class="me-brand">${wordmark()}</div>
      <div class="me-people" role="radiogroup" aria-label="Whose fridge">
        ${PERSONA_IDS.map((id) => `<button class="person${id === p.id ? ' on' : ''}" role="radio" aria-checked="${id === p.id}" data-act="person" data-arg="${id}"><span class="avatar av-0">${esc(PERSONAS[id].initial)}</span>${esc(PERSONAS[id].name)}</button>`).join('')}
      </div>
      <div class="btn-row">
        <button class="btn btn-secondary" data-act="go" data-arg="widgets">Widgets</button>
        <button class="btn btn-secondary" data-act="go" data-arg="lock">Lock screen</button>
      </div>
      ${p.demo ? '' : `<label class="me-row"><span>Freezer</span><button class="switch${p.freezer ? ' on' : ''}" role="switch" aria-checked="${p.freezer}" aria-label="Freezer" data-act="me-freezer"><i></i></button></label>`}
      ${data}
      ${store.error ? `<p class="me-err">Not saved: ${esc(store.error.message)}</p>` : ''}
    </section>
  </div>`;
}

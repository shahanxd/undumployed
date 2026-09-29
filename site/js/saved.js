// Saved: what you've kept. No accounts, so it lives in this browser, and a link carries it anywhere else.
import { db } from './data.js';
import { esc, icon, oppRow, stateHtml, toast, copyText } from './ui.js';
import { getSaved, addSaved, clearSaved, onSavedChange, storageOk, hashFor, replaceHash } from './state.js';
import { icsForDeadlines, download } from './ics.js';
import { sortItems, DEFAULT } from './filters.js';

let unsub = null;
let shared = null; // ids from a shared link, when you open one

const byDeadline = (ids) => sortItems([...new Set(ids.map((id) => db.byId.get(id)).filter(Boolean))], { ...DEFAULT, closed: true });
const linkFor = (ids) => `${location.origin}${location.pathname}${hashFor('saved', { ids: ids.join(',') })}`;

function sharedHtml() {
  const items = byDeadline(shared);
  const mine = new Set(getSaved());
  const fresh = shared.filter((id) => !mine.has(id) && db.byId.has(id)).length;
  return `
<section class="page container">
  <div class="page-head"><h1>A shared list</h1>
    <p>Someone sent you ${items.length === 1 ? 'one program' : `${items.length} programs`}. Have a look, and keep whichever you like.</p></div>
  <div class="saved-tools">
    ${fresh ? `<button class="btn btn-primary btn-s" type="button" data-act="keep">${icon('i-mark-on')} Save ${fresh === items.length ? 'all of them' : `the ${fresh} you don’t have`}</button>` : '<p class="muted-note">You already have all of these saved.</p>'}
    <a class="btn btn-s btn-quiet" href="#/saved">Go to your own list</a>
  </div>
  ${items.length ? `<ul class="list">${items.map((o) => oppRow(o, { from: 'saved', ids: shared.join(',') })).join('')}</ul>` : stateHtml('This link is empty.', 'The programs in it may have been removed after a check.')}
</section>`;
}

function mineHtml() {
  const ids = getSaved();
  const items = byDeadline(ids);
  const missing = ids.length - items.length;
  const dated = items.filter((o) => o.kind === 'exact');
  const note = storageOk
    ? 'Saved in this browser, so they’ll still be here tomorrow. They won’t follow you to another phone or laptop, and clearing your browsing data wipes them. To move them, copy the link below and open it wherever you like.'
    : 'Your browser isn’t letting this site store anything right now (a private window, maybe), so your saves will disappear when you close the tab. Copy the link below to keep them.';
  return `
<section class="page container">
  <div class="page-head"><h1>Saved</h1><p>${items.length ? `${items.length === 1 ? 'One thing' : `${items.length} things`} you’re keeping an eye on. ` : ''}${note}</p></div>
  ${items.length ? `<div class="saved-tools">
    <button class="btn btn-s" type="button" data-act="link">${icon('i-link')} Copy a link to this list</button>
    <button class="btn btn-s" type="button" data-act="ics" ${dated.length ? '' : 'disabled'}>${icon('i-cal')} Add ${dated.length === 1 ? 'the date' : `${dated.length || ''} dates`} to your calendar</button>
    <button class="btn btn-s" type="button" data-act="text">Copy as text</button>
    <button class="btn btn-s btn-quiet" type="button" data-act="clear">Clear all</button>
  </div>
  <ul class="list">${items.map((o) => oppRow(o, { from: 'saved' })).join('')}</ul>`
    : stateHtml('Nothing saved yet.', 'Tap the bookmark next to anything that catches your eye, and it’ll wait here for you.', '<a class="btn" href="#/browse">Browse opportunities</a>')}
  ${missing > 0 ? `<p class="nodate">${missing === 1 ? 'One saved program is' : `${missing} saved programs are`} no longer in the list. Usually that means it ended or changed name after a check.</p>` : ''}
</section>`;
}

export const savedPage = {
  route: 'saved',
  mount(main, params) {
    const read = (p) => { const raw = p.get('ids'); shared = raw ? raw.split(',').filter(Boolean) : null; };
    read(params);
    const render = () => { main.innerHTML = shared ? sharedHtml() : mineHtml(); };
    render();
    this._render = render;
    this._read = read;
    unsub = onSavedChange(render);

    main.addEventListener('click', async (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      const items = byDeadline(getSaved());
      if (act === 'keep') {
        const n = addSaved(shared.filter((id) => db.byId.has(id)));
        toast(n === 1 ? 'Saved one program to your list.' : `Saved ${n} programs to your list.`);
        replaceHash('#/saved');
      } else if (act === 'link') {
        try { await copyText(linkFor(items.map((o) => o.id))); toast('Link copied. Open it on any device to get this list there.'); } catch { toast('Couldn’t copy that. Try again?'); }
      } else if (act === 'ics') {
        download('undumployed-saved.ics', icsForDeadlines(items.filter((o) => o.kind === 'exact'), 'My undumployed deadlines'));
        toast('Calendar file downloaded. Open it to add the dates.');
      } else if (act === 'text') {
        await copyText(items.map((o) => `- ${o.name}: ${o.deadline}${o.applyUrl ? ` (${o.applyUrl})` : ''}`).join('\n'));
        toast('Copied as a plain list.');
      } else if (act === 'clear') {
        if (window.confirm(`Remove all ${items.length} saved ${items.length === 1 ? 'program' : 'programs'}? This can’t be undone.`)) clearSaved();
      }
    });
  },
  update(params) { this._read?.(params); this._render?.(); },
  unmount() { if (unsub) unsub(); unsub = null; shared = null; },
};

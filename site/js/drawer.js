// The detail panel for one opportunity or event.
import { db, fmtDays } from './data.js';
import { esc, icon, inline, block, plain, CAT_SHORT, toast, copyText } from './ui.js';
import { isSaved, parseHash, hashFor, replaceHash, reducedMotion } from './state.js';
import { icsForDeadlines, download } from './ics.js';
import { REPO_URL } from './config.js';

const drawer = document.getElementById('drawer');
const scrim = document.getElementById('scrim');
let current = null;
let returnFocus = null;
let pushed = false;
let hideTimer = 0;

const issueUrl = (name) => `${REPO_URL}/issues/new?template=fix-entry.yml&title=${encodeURIComponent(`Fix: ${name}`)}`;
const SKIP = new Set(['Deadline', 'Duration', 'Who', 'Stipend', 'Stage', 'Value', 'Prize', 'Funded', 'Cost', 'Student angle', 'Visa', 'Register']);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function deadlineHint(o) {
  if (o.kind === 'exact') return o.days === 0 ? 'Closes today.' : `${cap(fmtDays(o.days))}.`;
  if (o.kind === 'closed') return `That was ${fmtDays(o.days)}. Keep an eye out for the next round.`;
  if (o.kind === 'approx') return 'Our best guess from last year. The date isn’t out yet.';
  if (o.kind === 'rolling') return 'You can apply any time.';
  return 'This round is done, or the next one isn’t announced yet.';
}

const bar = `<div class="d-bar"><span class="d-grab" aria-hidden="true"></span><button class="icon-btn" type="button" data-close aria-label="Close">${icon('i-close')}</button></div>`;
const foot = (src, name) => `<div class="d-foot"><span>Checked by hand in ${esc(db.meta.lastVerified)}</span><a href="${esc(src)}" target="_blank" rel="noopener">See the source</a><a href="${esc(issueUrl(name))}" target="_blank" rel="noopener">Something wrong? Tell us</a></div>`;

function oppHtml(o) {
  const saved = isSaved(o.id);
  // the markdown marks funding with ✅ or ❌; here the words carry it
  const money = String(o.stipend || o.funded || '').replace(/^\s*(?:✅|❌|⚠️)️?\s*/u, '');
  const extra = Object.entries(o.table || {}).filter(([k, v]) => !SKIP.has(k) && plain(v));
  const facts = [
    ['Deadline', `${inline(o.deadline)}<span class="hint">${esc(deadlineHint(o))}</span>${o.unverified ? '<span class="hint is-warn">We couldn’t confirm this on the official site this round, so double-check before you plan around it.</span>' : ''}`],
    o.who && ['Who', inline(o.who)],
    money && ['Money', inline(money)],
    o.duration && ['Duration', inline(o.duration)],
    o.stageText && ['Stage', inline(o.stageText)],
    ...extra.map(([k, v]) => [esc(k), inline(v)]),
  ].filter(Boolean);
  return `${bar}
<div class="d-inner">
  <p class="d-kicker">${esc(CAT_SHORT[o.category] || o.categoryLabel)}</p>
  <h2 class="d-title" id="drawer-title" tabindex="-1">${esc(o.name)}</h2>
  ${o.type || o.location ? `<p class="d-sub">${esc([plain(o.type), plain(o.location)].filter(Boolean).join(' · '))}</p>` : ''}
  <dl class="facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
  <div class="d-actions">
    ${o.applyUrl ? `<a class="btn btn-primary" href="${esc(o.applyUrl)}" target="_blank" rel="noopener">Official page ${icon('i-out')}</a>` : ''}
    <button class="btn" type="button" data-save="${esc(o.id)}" data-name="${esc(o.name)}" aria-pressed="${saved}">${icon(saved ? 'i-mark-on' : 'i-mark')}<span>${saved ? 'Saved' : 'Save'}</span></button>
    ${o.kind === 'exact' ? `<button class="btn" type="button" data-ics>${icon('i-cal')}<span>Add to calendar</span></button>` : ''}
    <button class="btn btn-quiet" type="button" data-copy>${icon('i-link')}<span>Copy link</span></button>
  </div>
  ${o.what ? `<div class="d-section"><h3>What it is</h3>${block(o.what)}</div>` : ''}
  ${o.reality ? `<div class="note"><h3>Reality check</h3>${block(o.reality)}</div>` : ''}
  ${o.prep ? `<div class="d-section"><h3>How to prepare</h3>${block(o.prep)}</div>` : ''}
  ${foot(o.sourceUrl, o.name)}
</div>`;
}

function eventHtml(e) {
  const facts = [
    ['Dates', `${inline(e.dates)}${e.date ? `<span class="hint">${e.past ? 'Already happened.' : `Starts ${esc(fmtDays(e.days))}.`}</span>` : ''}${e.unverified ? '<span class="hint is-warn">The dates aren’t confirmed yet.</span>' : ''}`],
    e.location && ['Where', inline(e.location)],
    e.access && ['Access', inline(e.access)],
    e.cost && ['Cost', inline(e.cost)],
    e.studentAngle && ['For students', inline(e.studentAngle)],
    e.visa && ['Visa', inline(e.visa)],
    e.register && ['Register', inline(e.register)],
  ].filter(Boolean);
  return `${bar}
<div class="d-inner">
  <p class="d-kicker">${esc(e.kindLabel)}</p>
  <h2 class="d-title" id="drawer-title" tabindex="-1">${esc(e.name)}</h2>
  <dl class="facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
  <div class="d-actions">
    ${e.applyUrl ? `<a class="btn btn-primary" href="${esc(e.applyUrl)}" target="_blank" rel="noopener">Official site ${icon('i-out')}</a>` : ''}
    <button class="btn btn-quiet" type="button" data-copy>${icon('i-link')}<span>Copy link</span></button>
  </div>
  ${e.what ? `<div class="d-section"><h3>What it is</h3>${block(e.what)}</div>` : ''}
  ${foot(e.sourceUrl, e.name)}
</div>`;
}

function show() {
  clearTimeout(hideTimer);
  if (drawer.hidden) returnFocus = document.activeElement;
  drawer.hidden = false; scrim.hidden = false;
  drawer.classList.remove('is-scrolled', 'is-dragging');
  drawer.style.transform = '';
  const sbw = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--sbw', `${Math.max(0, sbw)}px`);
  document.documentElement.classList.add('is-locked');
  drawer.scrollTop = 0;
  requestAnimationFrame(() => { drawer.classList.add('is-open'); scrim.classList.add('is-open'); });
  drawer.querySelector('#drawer-title')?.focus({ preventScroll: true });
}

export function openOpportunity(id, didPush) {
  const o = db.byId.get(id);
  if (!o) return false;
  current = { type: 'o', item: o };
  pushed = didPush;
  drawer.innerHTML = oppHtml(o);
  show();
  document.title = `${o.name} · undumployed`;
  return true;
}
export function openEvent(id, didPush) {
  const e = db.evById.get(id);
  if (!e) return false;
  current = { type: 'e', item: e };
  pushed = didPush;
  drawer.innerHTML = eventHtml(e);
  show();
  document.title = `${e.name} · undumployed`;
  return true;
}
export const isOpen = () => !drawer.hidden;

export function closeDrawer() {
  if (drawer.hidden) return;
  drawer.classList.remove('is-open', 'is-dragging'); scrim.classList.remove('is-open');
  document.documentElement.classList.remove('is-locked');
  current = null;
  hideTimer = setTimeout(() => { drawer.hidden = true; scrim.hidden = true; drawer.innerHTML = ''; }, reducedMotion() ? 0 : 320);
  if (returnFocus && document.body.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
  else document.getElementById('main')?.focus({ preventScroll: true });
}

/** Close from inside the panel: step back in history if we came from a click, otherwise rewrite the URL. */
export function requestClose() {
  const { route, params } = parseHash();
  if (route !== 'o' && route !== 'e') { closeDrawer(); return; }
  if (pushed) { history.back(); return; }
  const base = params.get('from') || (route === 'e' ? 'events' : 'browse');
  params.delete('from');
  replaceHash(hashFor(base, params));
}

/** A clean link to what's open: no page state, just the entry. */
function shareLink() {
  const { route, id } = parseHash();
  return `${location.origin}${location.pathname}${hashFor(route, null, id)}`;
}

drawer.addEventListener('click', async (e) => {
  const t = e.target;
  if (t.closest('[data-close]')) { requestClose(); return; }
  if (t.closest('[data-ics]') && current?.type === 'o') {
    const o = current.item;
    download(`${o.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '')}.ics`, icsForDeadlines([o], o.name));
    toast('Calendar file downloaded, with reminders a week and a day before.');
    return;
  }
  if (t.closest('[data-copy]')) {
    try { await copyText(shareLink()); toast('Link copied.'); } catch { toast('Couldn’t copy that. The link is in the address bar.'); }
  }
});
scrim.addEventListener('click', requestClose);

// a hairline under the close bar once the panel scrolls
drawer.addEventListener('scroll', () => drawer.classList.toggle('is-scrolled', drawer.scrollTop > 4), { passive: true });

// on phones the panel is a sheet: drag the top bar down to put it away
let drag = null;
drawer.addEventListener('pointerdown', (e) => {
  if (!window.matchMedia('(max-width: 720px)').matches || !e.target.closest('.d-bar') || e.target.closest('button')) return;
  drag = { y: e.clientY, t: performance.now(), dy: 0 };
  drawer.classList.add('is-dragging');
  drawer.setPointerCapture(e.pointerId);
});
drawer.addEventListener('pointermove', (e) => {
  if (!drag) return;
  drag.dy = Math.max(0, e.clientY - drag.y);
  drawer.style.transform = `translateY(${drag.dy}px)`;
});
const endDrag = () => {
  if (!drag) return;
  const { dy, t } = drag;
  const fast = dy / Math.max(1, performance.now() - t) > 0.6;
  drag = null;
  drawer.classList.remove('is-dragging');
  if (dy > 120 || (fast && dy > 40)) { drawer.style.transform = 'translateY(100%)'; requestClose(); }
  else drawer.style.transform = '';
};
drawer.addEventListener('pointerup', endDrag);
drawer.addEventListener('pointercancel', endDrag);

// keep keyboard focus inside the panel while it's open
drawer.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); requestClose(); return; }
  if (e.key !== 'Tab') return;
  const items = [...drawer.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && (document.activeElement === first || document.activeElement === drawer.querySelector('#drawer-title'))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen() && !drawer.contains(document.activeElement)) requestClose(); });

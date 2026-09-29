// Router and app shell. The URL hash holds all state, so every view can be linked, bookmarked and shared.
import { loadAll, db } from './data.js';
import { parseHash, hashFor, replaceHash, toggleTheme, getTheme, getSaved, onSavedChange, toggleSaved, reducedMotion } from './state.js';
import { landingPage } from './landing.js';
import { browsePage } from './browse.js';
import { deadlinesPage } from './deadlines.js';
import { eventsPage } from './events.js';
import { perksPage } from './perks.js';
import { guidesPage, guidePage } from './guides.js';
import { savedPage } from './saved.js';
import { openOpportunity, openEvent, closeDrawer, isOpen } from './drawer.js';
import { esc, toast, syncSaveButtons, stateHtml, loadingHtml } from './ui.js';

const PAGES = { home: landingPage, browse: browsePage, deadlines: deadlinesPage, events: eventsPage, perks: perksPage, guides: guidesPage, guide: guidePage, saved: savedPage };
const UPDATES_IN_PLACE = new Set(['browse', 'deadlines', 'events', 'perks', 'saved']);
const TITLES = {
  home: 'undumployed · internships, fellowships and scholarships for students',
  browse: 'Opportunities · undumployed', deadlines: 'Deadlines · undumployed', events: 'Events · undumployed',
  perks: 'Perks · undumployed', guides: 'Guides · undumployed', saved: 'Saved · undumployed',
};
const ISSUES = 'https://github.com/shahanxd/undumployed/issues/new/choose';

let main = document.getElementById('main');
const current = { key: null, base: null, page: null };
let lastBase = null;
let nav = 0;

function baseOf(route, params) {
  if (route === 'o') return params.get('from') || 'browse';
  if (route === 'e') return params.get('from') || 'events';
  return route;
}

function setNav(base) {
  document.querySelectorAll('#nav a').forEach((a) => {
    const on = a.dataset.route === base || (a.dataset.route === 'guides' && base === 'guide');
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  document.getElementById('nav').classList.remove('is-open');
  document.getElementById('topbar').classList.remove('is-menu');
  document.getElementById('nav-toggle').setAttribute('aria-expanded', 'false');
}

async function render(base, params, id) {
  const token = ++nav;
  if (current.page?.unmount) current.page.unmount();
  // a fresh <main> each time, so listeners from the last page can't fire on this one
  const fresh = main.cloneNode(false);
  main.replaceWith(fresh);
  main = fresh;
  document.body.classList.toggle('is-home', base === 'home');
  window.scrollTo(0, 0);
  const page = PAGES[base];
  current.page = page || null;
  if (!page) {
    main.innerHTML = `<section class="page container">${stateHtml('This page isn’t here.', 'Maybe it exists in another timeline. More likely the link is old or has a typo.', '<a class="btn" href="#/">Back to the start</a>')}</section>`;
    document.title = 'Not found · undumployed';
    return;
  }
  if (base !== 'home' && !db.loaded) {
    main.innerHTML = loadingHtml();
    try { await loadAll(); } catch (err) {
      if (token !== nav) return;
      main.innerHTML = `<section class="page container">${stateHtml('The list didn’t load.', `It’s probably the connection. Give it another go? <span class="muted-note">(${esc(err.message)})</span>`, '<button class="btn" type="button" onclick="location.reload()">Try again</button>')}</section>`;
      return;
    }
    if (token !== nav) return;
  }
  if (!reducedMotion()) main.classList.add('page-enter');
  document.title = TITLES[base] || 'undumployed';
  await page.mount(main, params, id);
}

async function route() {
  const { route: r, id, params } = parseHash();
  if (r === 'plan') { replaceHash('#/guide/timeline-by-year'); return; }
  if (r === 'calendar') { replaceHash(hashFor('deadlines', params)); return; }
  const isDrawer = r === 'o' || r === 'e';
  const base = baseOf(r, params);
  const baseParams = new URLSearchParams(params);
  baseParams.delete('from');
  const key = base === 'guide' ? `guide/${id}` : `${base}?${baseParams}`;

  if (!isDrawer) closeDrawer();
  setNav(base);
  if (current.key !== key) {
    if (current.base === base && UPDATES_IN_PLACE.has(base) && current.page?.update) current.page.update(baseParams);
    else await render(base, baseParams, id);
    current.key = key;
    current.base = base;
  }
  if (isDrawer) {
    try { await loadAll(); } catch { return; }
    const cameFromPage = lastBase === base;
    const ok = r === 'o' ? openOpportunity(id, cameFromPage) : openEvent(id, cameFromPage);
    if (!ok) { toast('That one isn’t in the list any more.'); replaceHash(hashFor(base, baseParams)); }
  } else {
    lastBase = base;
  }
}

// The game's line appears the first time you save something in a visit. After that, a quiet "Saved."
function savedToast() {
  let first = true;
  try { first = !sessionStorage.getItem('undumployed:chose'); sessionStorage.setItem('undumployed:chose', '1'); } catch { /* fine */ }
  if (first) toast('This action will have consequences.', { choice: true, spoken: 'Saved.' });
  else toast('Saved.', { choice: true });
}

function boot() {
  window.__booted = true; // the fallback message in index.html stands down
  const themeBtn = document.getElementById('theme-toggle');
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
  const themeMeta = Object.assign(document.createElement('meta'), { name: 'theme-color' });
  document.head.appendChild(themeMeta);
  const reflectTheme = () => {
    const storm = getTheme() === 'storm';
    themeBtn.setAttribute('aria-label', storm ? 'Switch to the light golden-hour theme' : 'Switch to the dark storm theme');
    themeBtn.title = storm ? 'Golden hour' : 'Storm';
    themeMeta.content = storm ? '#0f141b' : '#faf7f1';
  };
  reflectTheme();
  themeBtn.addEventListener('click', () => {
    toggleTheme();
    reflectTheme();
    window.dispatchEvent(new Event('themechange'));
  });

  const navEl = document.getElementById('nav');
  const navBtn = document.getElementById('nav-toggle');
  navBtn.addEventListener('click', () => {
    const open = navEl.classList.toggle('is-open');
    document.getElementById('topbar').classList.toggle('is-menu', open);
    navBtn.setAttribute('aria-expanded', String(open));
  });

  const badge = document.getElementById('saved-count');
  const showCount = (ids) => { badge.textContent = ids.length; badge.hidden = !ids.length; };
  showCount(getSaved());
  onSavedChange((ids) => {
    showCount(ids);
    // keep every button honest, including after a save in another tab
    document.querySelectorAll('[data-save]').forEach((b) => {
      const on = ids.includes(b.dataset.save);
      if (b.getAttribute('aria-pressed') !== String(on)) syncSaveButtons(b.dataset.save, on);
    });
  });

  // one handler for every save button on the site
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-save]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const on = toggleSaved(b.dataset.save);
    syncSaveButtons(b.dataset.save, on);
    if (on) {
      savedToast();
      if (!reducedMotion()) { b.classList.remove('is-popping'); void b.offsetWidth; b.classList.add('is-popping'); }
    } else {
      toast('Removed from saved.');
    }
  });

  // "/" jumps to search from anywhere
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isOpen()) return;
    if (/^(input|textarea|select)$/i.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable) return;
    e.preventDefault();
    if (current.base === 'home') { document.getElementById('hero-q')?.focus(); return; }
    if (current.base === 'browse') { browsePage.focusSearch(); return; }
    location.hash = '#/browse';
    const wait = () => (current.base === 'browse' ? browsePage.focusSearch() : requestAnimationFrame(wait));
    requestAnimationFrame(wait);
  });

  window.addEventListener('hashchange', route);
  route();

  loadAll().then(() => {
    document.getElementById('footer-meta').innerHTML = `Every entry was checked by hand in ${esc(db.meta.lastVerified)}. Things change fast, so if something looks off, <a href="${ISSUES}" rel="noopener">tell us</a> and we’ll fix it.`;
  }).catch(() => {});
}

boot();

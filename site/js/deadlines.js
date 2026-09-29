// Deadlines: the next twelve months, month by month.
import { db, TODAY, fmtMonth, monthKey, monthShort } from './data.js';
import { esc, icon, oppRow, stateHtml, toast } from './ui.js';
import { hashFor, replaceHash } from './state.js';
import { icsForDeadlines, download } from './ics.js';

let root = null;
let showExpected = true;
let io = null;

function months() {
  const end = new Date(TODAY.getFullYear() + 1, TODAY.getMonth() + 1, 1);
  const monthStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const items = db.opps.filter((o) => o.date && o.date < end && (
    (o.kind === 'exact' && o.days >= 0) || (showExpected && o.kind === 'approx' && o.date >= monthStart)));
  const map = new Map();
  for (const o of items) {
    const k = monthKey(o.date);
    if (!map.has(k)) map.set(k, { date: new Date(o.date.getFullYear(), o.date.getMonth(), 1), exact: [], approx: [] });
    map.get(k)[o.kind === 'exact' ? 'exact' : 'approx'].push(o);
  }
  const out = [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => ({ key: k, ...v }));
  for (const m of out) { m.exact.sort((a, b) => a.date - b.date || a.name.localeCompare(b.name)); m.approx.sort((a, b) => a.name.localeCompare(b.name)); }
  return out;
}

function render() {
  const ms = months();
  const params = showExpected ? { from: 'deadlines' } : { from: 'deadlines', expected: '0' };
  const bar = root.querySelector('#monthbar');
  const body = root.querySelector('#months');
  if (!ms.length) {
    bar.innerHTML = '';
    body.innerHTML = stateHtml('No dates in the next year.', 'Turn on expected dates, or have a look at the programs that take applications any time.');
    return;
  }
  bar.innerHTML = ms.map((m) => `<a href="#${m.key}" data-month="${m.key}">${esc(monthShort(m.date))}${m.date.getMonth() === 0 || m === ms[0] ? ` ${m.date.getFullYear()}` : ''}<span class="n">${m.exact.length + m.approx.length}</span></a>`).join('');
  body.innerHTML = ms.map((m) => `
<section class="month" id="${m.key}" aria-labelledby="h-${m.key}">
  <div class="list-head"><h2 id="h-${m.key}">${esc(fmtMonth(m.date))}</h2><span class="n">${m.exact.length ? `${m.exact.length} confirmed` : ''}${m.exact.length && m.approx.length ? ' · ' : ''}${m.approx.length ? `${m.approx.length} expected` : ''}</span></div>
  ${m.exact.length ? `<ul class="list">${m.exact.map((o) => oppRow(o, params)).join('')}</ul>` : ''}
  ${m.approx.length ? `<p class="list-sub">Expected this month. The exact dates aren’t out yet.</p><ul class="list">${m.approx.map((o) => oppRow(o, params)).join('')}</ul>` : ''}
</section>`).join('');
  const rolling = db.opps.filter((o) => o.kind === 'rolling').length;
  const later = db.opps.filter((o) => o.kind === 'next' || o.kind === 'watch').length;
  body.insertAdjacentHTML('beforeend', `<p class="nodate">Not on this page: ${rolling} programs you can apply to any time, and ${later} waiting for their next round to be announced. <a href="#/browse?when=rolling">See the any-time ones</a> · <a href="#/browse?when=next">See what’s coming back</a></p>`);

  // highlight the month you're reading
  if (io) io.disconnect();
  io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      bar.querySelectorAll('a').forEach((a) => a.classList.toggle('is-active', a.dataset.month === en.target.id));
      const active = bar.querySelector('.is-active');
      if (active) bar.scrollTo({ left: active.offsetLeft - 16, behavior: 'smooth' });
    }
  }, { rootMargin: '-120px 0px -70% 0px' });
  body.querySelectorAll('.month').forEach((s) => io.observe(s));
}

export const deadlinesPage = {
  route: 'deadlines',
  mount(main, params) {
    root = main;
    showExpected = params.get('expected') !== '0';
    main.innerHTML = `
<section class="page container">
  <div class="page-head page-head-row">
    <div><h1>Deadlines</h1><p>Everything closing in the next twelve months, so nothing sneaks up on you. Confirmed dates come straight from the official sites. Expected ones are our best guess from last year.</p></div>
    <div class="toolbar">
      <label class="check"><input type="checkbox" id="exp" ${showExpected ? 'checked' : ''}> Show expected</label>
      <button class="btn btn-s" type="button" id="ics">${icon('i-download')} Add confirmed dates to your calendar</button>
    </div>
  </div>
  <nav class="monthbar" id="monthbar" aria-label="Months"></nav>
  <div id="months"></div>
</section>`;
    render();
    main.querySelector('#exp').addEventListener('change', (e) => {
      showExpected = e.target.checked;
      replaceHash(hashFor('deadlines', showExpected ? {} : { expected: '0' }));
    });
    main.querySelector('#monthbar').addEventListener('click', (e) => {
      const a = e.target.closest('a[data-month]');
      if (!a) return;
      e.preventDefault();
      document.getElementById(a.dataset.month)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    main.querySelector('#ics').addEventListener('click', () => {
      const items = db.opps.filter((o) => o.kind === 'exact' && o.days >= 0);
      download('undumployed-deadlines.ics', icsForDeadlines(items));
      toast(`${items.length} deadlines saved as a calendar file.`);
    });
  },
  update(params) { showExpected = params.get('expected') !== '0'; const c = root.querySelector('#exp'); if (c) c.checked = showExpected; render(); },
  unmount() { if (io) io.disconnect(); io = null; root = null; },
};

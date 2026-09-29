// Home: the bay, one sentence to find what fits, what's closing soon, and the whole index.
import { wireSparks } from './sparks.js';
import { db, loadAll } from './data.js';
import { esc, icon, oppRow, stateHtml, loadingHtml } from './ui.js';
import { hashFor, go } from './state.js';
import { heroMarkup, mountHero } from './hero.js';

const STAGE_WORDS = [['hs', 'in school'], ['ug', 'an undergrad'], ['pg', 'doing a master’s'], ['phd', 'doing a PhD'], ['grad', 'out of college']];
const FIELD_WORDS = [
  ['', 'anything'], ['cs', 'software'], ['ai', 'AI and data'], ['ee', 'electronics'], ['mech', 'mechanical and aero'],
  ['civil', 'civil and architecture'], ['physics', 'physics'], ['math', 'maths'], ['chem', 'chemistry'], ['bio', 'biology'],
  ['med', 'medicine and health'], ['design', 'design'], ['business', 'business and finance'], ['econ', 'economics'],
  ['policy', 'policy and social science'], ['law', 'law'], ['humanities', 'the humanities'], ['media', 'media and film'], ['edu', 'teaching'],
];
const INDEX = [
  ['Internships', [['research-india', 'Research in India'], ['research-global', 'Research abroad'], ['tech', 'Tech companies'], ['finance', 'Finance, quant and consulting'], ['govt-nontech', 'Government, policy and non-tech']]],
  ['Fellowships and scholarships', [['study-abroad', 'Study abroad'], ['fellowship-india', 'In India'], ['research-fellowship', 'Research grants, forums and travel']]],
  ['Build and compete', [['open-source', 'Paid open source'], ['startup', 'Startup and builder programs'], ['hackathon', 'Hackathons'], ['cp', 'Programming contests'], ['case-research', 'Case, science and other competitions']]],
  ['Communities', [['ambassador', 'Ambassador programs'], ['insider', 'Brand communities']]],
];

const copy = `
<div class="hero-copy container">
  <h1 class="hero-title" id="hero-title">undumployed</h1>
  <p class="hero-lede">everything you wanna apply to. put together.</p>
  <form class="hero-search" id="hero-search" role="search">
    <label class="sr-only" for="hero-q">Search the list</label>
    <div class="search-field">
      ${icon('i-search')}
      <input id="hero-q" type="search" name="q" placeholder="Try “CERN”, “design” or “Delhi”" autocomplete="off" enterkeyhint="search" spellcheck="false">
      <button class="search-go" type="submit" aria-label="Search">${icon('i-arrow')}</button>
    </div>
  </form>
</div>`;

/** Selects that are only as wide as the chosen option (native in newer browsers, measured elsewhere).
    Returns a function that re-measures, or null when the browser does it itself. */
function autosize(select) {
  if (window.CSS && CSS.supports('field-sizing', 'content')) return null;
  const fit = () => {
    const cs = getComputedStyle(select);
    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${cs.font};letter-spacing:${cs.letterSpacing}`;
    probe.textContent = select.options[select.selectedIndex]?.text || '';
    document.body.appendChild(probe);
    const w = probe.getBoundingClientRect().width;
    probe.remove();
    select.style.width = `calc(${Math.ceil(w)}px + 1.15em)`;
  };
  fit();
  select.addEventListener('change', fit);
  return fit;
}

function closingSoon() {
  const soon = db.opps.filter((o) => o.kind === 'exact' && o.days <= 45).sort((a, b) => a.date - b.date);
  if (soon.length >= 6) return soon.slice(0, 8);
  const next = db.opps.filter((o) => o.kind === 'approx' && o.date).sort((a, b) => a.date - b.date);
  return soon.concat(next).slice(0, 8);
}

function restHtml() {
  const byCat = {};
  for (const o of db.opps) for (const c of new Set([o.category, ...(o.alsoIn || [])])) byCat[c] = (byCat[c] || 0) + 1;
  const guides = db.meta.guides.filter((g) => g.slug !== 'contributing').length;
  const link = (href, label, n) => `<li><a href="${esc(href)}"><span class="t">${esc(label)}</span><span class="dots" aria-hidden="true"></span><span class="n">${n}</span></a></li>`;
  const from = { from: 'home' };
  return `
<section class="fit container" aria-labelledby="fit-h">
  <h2 id="fit-h" class="sr-only">Find what fits you</h2>
  <form class="fit-form" id="fit">
    <p class="fit-line">I’m <span class="fit-pick"><select name="stage" aria-label="Where you are">${STAGE_WORDS.map(([v, l]) => `<option value="${v}"${v === 'ug' ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>${icon('i-down')}</span>
    and I’m into <span class="fit-pick"><select name="field" aria-label="What you study">${FIELD_WORDS.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select>${icon('i-down')}</span>.
    <button class="btn btn-primary fit-go" type="submit">Show me</button></p>
  </form>
</section>

<section class="section container" aria-labelledby="soon-h">
  <div class="section-head"><h2 id="soon-h">Closing soon</h2><a class="more-link" href="#/deadlines">All deadlines ${icon('i-arrow')}</a></div>
  <ul class="list">${closingSoon().map((o) => oppRow(o, from)).join('')}</ul>
</section>

<section class="section container" aria-labelledby="idx-h">
  <div class="section-head"><h2 id="idx-h">Everything in the list</h2></div>
  <div class="index">
    ${INDEX.map(([title, cats]) => `<div><h3>${esc(title)}</h3><ul>${cats.map(([id, label]) => link(`#/browse?cat=${id}`, label, byCat[id] || 0)).join('')}</ul></div>`).join('')}
    <div><h3>Also here</h3><ul>
      ${link('#/events', 'Events, conferences and fests', db.events.length)}
      ${link('#/perks', 'Free tools and discounts', db.perks.length)}
      ${link('#/guides', 'Guides for applying', guides)}
    </ul></div>
  </div>
</section>

<section class="section container" aria-labelledby="about-h">
  <div class="section-head"><h2 id="about-h">What’s undumployed</h2></div>
  <div class="about">
    <p class="dedication">Made with <span class="spark spark-love" data-spark="heart">love</span> and <span class="spark spark-coffee" data-spark="bean">coffee</span>, in memory of the one who was always there to guide me.</p>
    <p>An <a href="https://github.com/shahanxd/undumployed" rel="noopener">open-source</a> list of opportunities for all em friends who’re ready to get out there for something better.<br>
      Checked and verified in ${esc(db.meta.lastVerified)}.<br>
      Something off? <a href="https://github.com/shahanxd/undumployed/issues/new/choose" rel="noopener">Open an issue</a> or <a href="#/guide/contributing">fix the file</a>.</p>
  </div>
</section>`;
}

let teardown = [];

export const landingPage = {
  route: 'home',
  async mount(main) {
    main.innerHTML = `${heroMarkup(copy)}<div id="home-rest">${loadingHtml()}</div>`;
    const track = main.querySelector('#hero-track');
    teardown.push(mountHero(track));

    // the bar sits on the sky until the bay scrolls away
    const bar = document.getElementById('topbar');
    const setBar = () => bar.classList.toggle('is-over', window.scrollY < track.offsetHeight - bar.offsetHeight - 8);
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(setBar); };
    setBar();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    teardown.push(() => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); bar.classList.remove('is-over'); });

    main.querySelector('#hero-search').addEventListener('submit', (e) => {
      e.preventDefault();
      const q = main.querySelector('#hero-q').value.trim();
      go(hashFor('browse', q ? { q, sort: 'relevance' } : {}));
    });

    const rest = main.querySelector('#home-rest');
    try {
      await loadAll();
    } catch (err) {
      rest.innerHTML = stateHtml('The list didn’t load.', `Check your connection and try again. (${esc(err.message)})`, '<button class="btn" type="button" onclick="location.reload()">Reload</button>');
      return;
    }
    if (!document.body.contains(rest)) return; // navigated away while loading
    rest.innerHTML = restHtml();
    wireSparks(rest);
    const form = rest.querySelector('#fit');
    const fits = [...form.querySelectorAll('select')].map(autosize).filter(Boolean);
    if (fits.length) {
      const refit = () => fits.forEach((fn) => fn());
      window.addEventListener('resize', refit);
      if (document.fonts) document.fonts.ready.then(refit);
      teardown.push(() => window.removeEventListener('resize', refit));
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const p = { stage: form.stage.value };
      if (form.field.value) p.field = form.field.value;
      go(hashFor('browse', p));
    });
  },
  update() {},
  unmount() { teardown.forEach((fn) => fn()); teardown = []; },
};

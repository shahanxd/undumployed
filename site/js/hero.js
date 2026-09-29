// Arcadia Bay at golden hour, drawn by hand in SVG and CSS.
// Scrolling moves time forward: the sun sets, the lamp comes on, stars, then the storm rolls in.
// Scrolling back up rewinds it. Every layer only changes transform or opacity, so the compositor does the work.
import { getTheme, reducedMotion } from './state.js';

// deterministic randomness, so the scene is the same on every visit
function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const f1 = (n) => n.toFixed(1);

/** A Douglas fir: tiers of drooping branches up to a narrow tip. */
function fir(cx, base, h, w, rnd) {
  const n = Math.max(5, Math.round(h / 22));
  const step = h / (n + 0.7);
  const L = [], LI = [], R = [], RI = [];
  for (let i = 0; i < n; i++) {
    const y = base - i * step;
    const half = (w / 2) * (1 - i / (n + 0.5));
    L.push([cx - half * (0.88 + rnd() * 0.24), y + (rnd() - 0.5) * step * 0.25]);
    LI.push([cx - half * (0.3 + rnd() * 0.14), y - step * (1.1 + rnd() * 0.14)]);
    R.push([cx + half * (0.88 + rnd() * 0.24), y + (rnd() - 0.5) * step * 0.25]);
    RI.push([cx + half * (0.3 + rnd() * 0.14), y - step * (1.1 + rnd() * 0.14)]);
  }
  const pts = [[cx - w * 0.035, base + 40]];
  for (let i = 0; i < n; i++) { pts.push(L[i]); if (i < n - 1) pts.push(LI[i]); }
  pts.push([cx + (rnd() - 0.5) * 1.5, base - h]);
  for (let i = n - 1; i >= 0; i--) { pts.push(R[i]); if (i > 0) pts.push(RI[i - 1]); }
  pts.push([cx + w * 0.035, base + 40]);
  return `M${pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L')}Z`;
}

function starsSvg() {
  const rnd = seeded(11);
  const groups = [[], [], []];
  for (let i = 0; i < 120; i++) {
    const x = rnd() * 1600, y = Math.pow(rnd(), 1.4) * 560;
    const r = 0.45 + Math.pow(rnd(), 3) * 1.4;
    groups[i % 3].push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${r.toFixed(2)}"/>`);
  }
  return `<svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMin slice" fill="#fff">
    <g class="tw">${groups[0].join('')}</g><g class="tw tw-2">${groups[1].join('')}</g><g class="tw tw-3">${groups[2].join('')}</g></svg>`;
}

// Long stratus bands lit from below. They keep clear of the text on the left;
// the low ones pass in front of the sun, the way they do an hour before it sets.
function cloudsSvg(near) {
  const far = [
    'M920 196c120-10 262-12 402-6 84 4 170 0 250 7-102 10-238 12-372 10-112-2-206 2-280-11Z',
    'M1060 282c96-7 204-9 312-5 70 3 140 1 210 7-78 8-178 10-284 9-96-1-176 2-238-11Z',
    'M980 378c96-7 206-9 312-5 70 3 132 1 190 6-70 8-160 10-254 9-96-1-180 2-248-10Z',
  ];
  const low = [
    'M40 548c150-12 318-16 490-10 118 5 200 2 290 10-98 10-236 13-384 11-150-2-290 2-396-11Z',
    'M780 502c110-9 232-12 354-7 72 3 132 1 190 7-66 8-162 11-268 9-100-2-196 1-276-9Z',
    'M300 600c86-6 180-8 272-4 52 2 96 1 136 5-48 6-116 7-188 7-78 0-156 2-220-8Z',
  ];
  const id = near ? 'cl-n' : 'cl-f';
  return `<svg class="${near ? 'near' : 'far'}" viewBox="0 0 1600 640" preserveAspectRatio="xMidYMax slice">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${near ? '#a0648a' : '#6d5a8e'}" stop-opacity="${near ? '.5' : '.45'}"/>
      <stop offset=".55" stop-color="${near ? '#f0977c' : '#c57f98'}" stop-opacity="${near ? '.75' : '.5'}"/>
      <stop offset="1" stop-color="${near ? '#ffdcaa' : '#efb39c'}" stop-opacity="${near ? '.95' : '.65'}"/>
    </linearGradient></defs>
    <g fill="url(#${id})">${(near ? low : far).map((d) => `<path d="${d}"/>`).join('')}</g></svg>`;
}

function stormSvg() {
  // a heavy mass whose underside hangs in soft lobes
  const edge = (y0, amp, seed) => {
    const rnd = seeded(seed);
    let x = 1620;
    let d = `M-20 -20H1620V${y0}`;
    while (x > -20) {
      const nx = Math.max(-20, x - (90 + rnd() * 90));
      const span = x - nx;
      d += `C${f1(x - span * 0.3)} ${f1(y0 + amp * (0.55 + rnd()))} ${f1(x - span * 0.7)} ${f1(y0 + amp * (0.55 + rnd()))} ${f1(nx)} ${f1(y0 + amp * (rnd() * 0.5 - 0.1))}`;
      x = nx;
    }
    return `${d}Z`;
  };
  return `<svg viewBox="0 0 1600 420" preserveAspectRatio="xMidYMin slice">
    <defs><linearGradient id="st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070b14"/><stop offset=".75" stop-color="#151d2e"/><stop offset="1" stop-color="#2a3346"/></linearGradient></defs>
    <path d="${edge(300, 34, 5)}" fill="#1c2436" opacity=".75"/>
    <path d="${edge(236, 40, 9)}" fill="url(#st)"/></svg>`;
}

// The far shore across the bay, on the left. It drops to the water before the sun,
// so the sun sets over open sea.
function shoreSvg() {
  return `<svg viewBox="0 0 1600 120" preserveAspectRatio="none">
    <path fill="rgba(78,58,108,.5)" d="M0 120V40c60-10 130-6 200-14 70-8 130 2 190 12 60 10 110 32 170 54 30 12 50 22 80 28Z"/>
    <path fill="rgba(52,40,80,.74)" d="M0 120V72c60-8 120-2 180-6 70-4 120 8 180 18 50 8 90 22 140 36Z"/></svg>`;
}

function townSvg() {
  // Arcadia Bay at dusk: small warm windows along the near ridge.
  const rnd = seeded(23);
  const dots = [];
  for (let i = 0; i < 64; i++) {
    const x = 10 + Math.pow(rnd(), 1.1) * 460;
    const ridge = 70 + (x / 500) * 44;
    const y = ridge + 4 + rnd() * Math.max(2, 117 - ridge - 4);
    const w = 1.6 + rnd() * 1.8;
    dots.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="1.6" rx=".6" fill="${rnd() > 0.82 ? '#fff2cf' : '#ffcf86'}"/>`);
  }
  return `<svg viewBox="0 0 1600 120" preserveAspectRatio="none">${dots.join('')}</svg>`;
}

function ripplesSvg() {
  const rnd = seeded(31);
  const lines = [];
  for (let k = 1; k <= 46; k++) {
    const y = Math.pow(k / 46, 1.9) * 300;
    const dash = 18 + (y / 300) * 120;
    const gap = 30 + rnd() * 90 + (y / 300) * 160;
    lines.push(`<path d="M0 ${f1(y)}H1600" stroke-dasharray="${f1(dash)} ${f1(gap)}" stroke-dashoffset="${f1(rnd() * 400)}" stroke-width="${f1(0.6 + (y / 300) * 1.4)}"/>`);
  }
  return `<svg class="ripples" viewBox="0 0 1600 300" preserveAspectRatio="none" fill="none" stroke="rgba(255,238,214,.08)">${lines.join('')}</svg>`;
}

// Sunlight on water: short broken flecks in a cone that widens towards you.
function glintsSvgs() {
  const rnd = seeded(47);
  const groups = [[], [], []];
  const rows = 64;
  for (let i = 0; i < rows; i++) {
    const t = Math.pow(i / rows, 1.35);
    const y = t * 296;
    const half = 5 + t * 88;
    const count = t < 0.15 ? 1 : 1 + Math.round(rnd() * 2);
    for (let c = 0; c < count; c++) {
      const w = (3 + t * 42) * (0.35 + rnd() * 0.65);
      const x = 100 + (rnd() * 2 - 1) * half * 0.85 - w / 2;
      const h = 0.8 + t * 2.2;
      const o = (0.95 - t * 0.6) * (0.55 + rnd() * 0.45);
      groups[(i + c) % 3].push(`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(h / 2)}" opacity="${o.toFixed(2)}"/>`);
    }
  }
  return groups.map((g, i) => `<svg class="g${i + 1}" viewBox="0 0 200 300" preserveAspectRatio="none" fill="#ffe7b4">${g.join('')}</svg>`).join('');
}

function cliffSvg() {
  const rnd = seeded(3);
  const trees = [
    [712, 302, 188, 60], [752, 300, 232, 70], [796, 298, 170, 56], [838, 296, 250, 74], [884, 294, 206, 66],
    [560, 304, 120, 40], [528, 306, 92, 32],
  ].map(([x, b, h, w]) => fir(x, b, h, w, rnd));
  const railPosts = [];
  for (let x = 608; x <= 672; x += 8) railPosts.push(`<rect x="${x - 0.8}" y="100" width="1.6" height="12"/>`);
  return `<svg class="cliff" viewBox="0 0 900 760" preserveAspectRatio="xMaxYMax meet">
    <defs><linearGradient id="rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2334"/><stop offset=".45" stop-color="#151c29"/><stop offset="1" stop-color="#10151f"/></linearGradient></defs>
    <g class="sil-3">${trees.slice(0, 5).map((d) => `<path d="${d}"/>`).join('')}</g>
    <g class="sil-2">${trees.slice(5).map((d) => `<path d="${d}"/>`).join('')}</g>
    <g class="tower">
      <path d="M609 304 619 118h42l10 186Z"/>
      <rect x="605" y="111" width="70" height="7" rx="1"/>
      <rect x="605" y="98" width="70" height="2.2" rx="1"/>
      ${railPosts.join('')}
      <rect x="617" y="73" width="46" height="4" rx="1"/>
      <path d="M619 74 640 55 661 74Z"/>
      <rect x="639.2" y="44" width="1.6" height="12"/><circle cx="640" cy="43.5" r="2.4"/>
    </g>
    <rect class="glass" x="624" y="77" width="32" height="22"/>
    <g class="tower"><rect x="630" y="77" width="1.6" height="22"/><rect x="639.2" y="77" width="1.6" height="22"/><rect x="648.4" y="77" width="1.6" height="22"/></g>
    <path class="sil" d="M634 304v-16c0-4 3-7 6-7s6 3 6 7v16Z"/>
    <path fill="url(#rock)" d="M900 760V286c-38-4-74 4-108 2-40-2-72 4-102 8-30 4-64 2-94 4-36 2-68-2-98 2-28 3-52-2-78 4-22 4-40 12-54 26-14 16-20 40-28 68-8 30-20 52-24 86-4 34-18 62-22 98-4 38-22 66-30 106-6 32-14 52-18 70Z"/>
    <path class="sil" d="M188 760c4-20 18-32 34-30 12 2 20 16 22 30ZM142 760c8-10 18-14 28-10 8 4 10 8 12 10Z"/>
    <path class="sil" d="M404 309c4-10 16-12 22-4 6-6 16-2 16 6ZM376 322c3-8 12-10 17-3 5-4 12-1 12 5Z"/>
    <g class="sil">
      <rect x="452" y="285" width="42" height="3" rx="1"/><rect x="454" y="274" width="38" height="3" rx="1"/>
      <rect x="456" y="277" width="2" height="8"/><rect x="488" y="277" width="2" height="8"/>
      <rect x="455" y="288" width="2.2" height="14"/><rect x="489" y="288" width="2.2" height="14"/>
    </g>
    <path class="foam" d="M150 758c16-5 30-5 44-2M198 756c14-4 30-5 46-1M244 757c10-3 20-3 30 0"/>
  </svg>`;
}

// Warm light catching the edges that face the sun. Its own layer, so it can fade at dusk.
function rimSvg() {
  return `<svg class="rim-svg" viewBox="0 0 900 760" preserveAspectRatio="xMaxYMax meet">
    <path class="rim" d="M244 760c4-18 12-38 18-70 8-40 26-68 30-106 4-36 18-64 22-98 4-34 16-56 24-86 8-28 14-52 28-68 14-14 32-22 54-26 26-6 50-1 78-4"/>
    <path class="rim rim-thin" d="M609 304 619 118M605 111h14"/>
  </svg>`;
}

export function heroMarkup(copyHtml) {
  return `
<section class="hero-track" id="hero-track" aria-labelledby="hero-title">
<div class="hero" id="hero">
  <div class="scene" aria-hidden="true">
    <div class="L sky-day" data-k=".55"></div>
    <div class="L sky-night" data-k=".55"></div>
    <div class="L stars-wrap" data-k=".55">${starsSvg()}</div>
    <div class="L sun-wrap" data-k=".5"><div class="sun-glow"></div><div class="sun"></div></div>
    <div class="L clouds-wrap" data-k=".47">${cloudsSvg(false)}${cloudsSvg(true)}</div>
    <div class="L storm-wrap" data-k=".5">${stormSvg()}</div>
    <div class="L shore-wrap" data-k=".4"><div class="haze"></div>${shoreSvg()}</div>
    <div class="L sea-wrap" data-k=".38"><div class="sea sea-day"></div><div class="sea sea-night"></div>${ripplesSvg()}<div class="glints">${glintsSvgs()}</div></div>
    <div class="L cliff-wrap" data-k=".14">${cliffSvg()}${rimSvg()}</div>
    <div class="L tint"></div>
    <div class="L flash"></div>
    <div class="L town-wrap" data-k=".4">${townSvg()}</div>
    <div class="L cliff-lights" data-k=".14"><div class="lamp"></div><div class="beam-wrap"><div class="beam"></div><div class="flare"></div></div></div>
  </div>
  ${copyHtml}
  <div class="scroll-cue" aria-hidden="true"><svg class="ico"><use href="#i-down"/></svg></div>
</div>
</section>`;
}

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

/** Wire up the scroll-driven time of day. Returns a teardown function.
    The bay stays pinned for a stretch of scrolling while time passes (the sun sets, the lamp
    comes on, the beam turns, the town and the stars come out, the storm rolls in). Then it
    scrolls away with a little parallax. Scrolling back up rewinds all of it. */
export function mountHero(track) {
  const hero = track.querySelector('.hero');
  const q = (s) => hero.querySelector(s);
  const layers = [...hero.querySelectorAll('.scene [data-k]')].map((node) => ({ node, k: parseFloat(node.dataset.k) }));
  const el = {
    skyNight: q('.sky-night'), stars: q('.stars-wrap'), sun: q('.sun-wrap'), sunDisc: q('.sun'), clouds: q('.clouds-wrap'),
    storm: q('.storm-wrap'), seaNight: q('.sea-night'), glints: q('.glints'), rim: q('.rim-svg'), flash: q('.flash'),
    tint: q('.tint'), town: q('.town-wrap'), lamp: q('.lamp'), beam: q('.beam-wrap'), copy: q('.hero-copy'),
  };
  const still = reducedMotion();
  let height = 0, pin = 0, sunTravel = 0;
  let visible = true, queued = false, last = -1;
  let lampLit = false, stormArrived = false;
  const measure = () => {
    height = hero.offsetHeight;
    pin = Math.max(0, track.offsetHeight - height);
    sunTravel = (el.sunDisc?.offsetHeight || 80) * 1.9;
  };

  const frame = () => {
    queued = false;
    const y = still ? 0 : Math.max(0, window.scrollY - track.offsetTop);
    const storm = getTheme() === 'storm';
    const key = y + (storm ? 1e7 : 0);
    if (key === last) return;
    last = key;
    // p: how far through the evening we are (0 golden hour, 1 the storm). exit: how far the bay has scrolled away.
    // With reduced motion there's no scrubbing, just one still frame: just after sunset, lamp lit.
    const p = still ? 0.3 : pin > 40 ? clamp(y / pin) : clamp(y / (height * 0.82));
    const exit = pin > 40 ? Math.max(0, y - pin) : y;
    const night = storm ? 0.84 + 0.16 * p : smooth(0.18, 0.62, p);
    const gather = smooth(storm ? 0.3 : 0.55, 1, p);
    hero.classList.toggle('is-moving', y > 8);

    for (const { node, k } of layers) {
      let extra = 0;
      if (node === el.sun) extra = smooth(0, 0.52, p) * sunTravel;          // the sun sinks into the sea
      if (node === el.storm) extra = -(1 - gather) * height * 0.32;          // storm clouds roll down from above
      node.style.transform = `translate3d(0, ${(exit * k + extra).toFixed(1)}px, 0)`;
    }
    el.skyNight.style.opacity = night.toFixed(3);
    el.seaNight.style.opacity = (night * 0.92).toFixed(3);
    el.tint.style.opacity = (night * 0.44 + gather * 0.12).toFixed(3);
    el.stars.style.opacity = (storm ? 1 - gather * 0.6 : smooth(0.4, 0.8, p) * (1 - gather * 0.6)).toFixed(3);
    el.sun.style.opacity = storm ? '0' : (1 - smooth(0.42, 0.6, p)).toFixed(3);
    el.glints.style.opacity = storm ? '0' : (1 - smooth(0.12, 0.48, p)).toFixed(3);
    el.rim.style.opacity = storm ? '0' : (1 - smooth(0.2, 0.5, p)).toFixed(3);
    el.clouds.style.opacity = (1 - night * 0.8).toFixed(3);
    el.town.style.opacity = storm ? '1' : smooth(0.25, 0.55, p).toFixed(3);
    // The lamp glows a little even in daylight, then comes on properly as the light goes.
    const lamp = storm ? 1 : 0.3 + 0.7 * smooth(0.12, 0.38, p);
    el.lamp.style.opacity = lamp.toFixed(3);
    el.beam.style.opacity = (storm ? 0.9 : 0.1 + 0.8 * smooth(0.14, 0.45, p)).toFixed(3);
    el.storm.style.opacity = (gather * 0.92).toFixed(3);
    if (el.copy) {
      const fade = smooth(0.68, 0.96, p);
      el.copy.style.transform = `translate3d(0, ${(exit * 0.28 - fade * 18).toFixed(1)}px, 0)`;
      el.copy.style.opacity = (1 - fade).toFixed(3);
    }
    // little moments, each played once per crossing: the lamp catching, and the storm's first flash
    if (!still && !storm) {
      const lit = p > 0.16;
      if (lit && !lampLit) { el.lamp.classList.remove('is-catching'); void el.lamp.offsetWidth; el.lamp.classList.add('is-catching'); }
      lampLit = lit;
    }
    const arrived = p > 0.9;
    if (!still && arrived && !stormArrived) { el.flash.classList.remove('is-on'); void el.flash.offsetWidth; el.flash.classList.add('is-on'); }
    stormArrived = arrived;
  };
  const request = () => { if (!queued && visible) { queued = true; requestAnimationFrame(frame); } };
  const onResize = () => { measure(); last = -1; request(); };
  const onTheme = () => { last = -1; request(); };

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    hero.classList.toggle('is-idle', !visible);
    if (visible) request();
  });
  io.observe(track);
  if (!still) window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('themechange', onTheme);
  measure();
  lampLit = (Math.max(0, window.scrollY) / (pin || 1)) > 0.16; // no flicker if the page loads already scrolled
  frame();

  return () => {
    io.disconnect();
    window.removeEventListener('scroll', request);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('themechange', onTheme);
  };
}

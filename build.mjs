// Static site builder for Placeholder LLC. No dependencies.
//   node build.mjs
// Reads data/*.json, writes the HTML pages + sitemap.xml into the repo root.
// Header, footer and cards live here once instead of being pasted into every page.

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const v = (p) => createHash('md5').update(readFileSync(new URL(p, import.meta.url))).digest('hex').slice(0, 8);
const V = { fonts: v('./assets/css/fonts.css'), base: v('./assets/css/base.css'), js: v('./assets/js/site.js') };

const SITE = 'https://placeholderllc.name.ng';
const NAME = 'Placeholder LLC';
const TAGLINE = 'Experiments in AI, Art, and Curiosity';
const DESC = 'A small studio experimenting with AI and ideas — inspired by Jean-Michel Basquiat’s creative chaos.';
const YEAR = new Date().getFullYear();
const TODAY = new Date().toISOString().slice(0, 10);

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const experiments = read('./data/experiments.json').experiments;
const now = read('./data/now.json').items;
const people = read('./data/people.json').people;

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- icons ---------- */
const ICON = {
  crown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M3 18l2-10 5 5 4-6 7 11H3z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  curve: '<svg viewBox="0 0 64 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 24c8-16 28-20 44-12"/><path d="M46 8l8 4-5 7"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
};

/* ---------- status handling ---------- */
function statusOf(meta = '') {
  const m = meta.toLowerCase();
  if (m.includes('soon')) return ['soon', 'Coming soon'];
  if (m.includes('building')) return ['building', 'Building now'];
  if (m.includes('collab')) return ['collab', 'Lab · collab'];
  if (m === 'live') return ['live', 'Live'];
  if (m === 'alpha') return ['alpha', 'Alpha'];
  if (m === 'research') return ['research', 'Research'];
  return ['lab', 'Lab'];
}

/* ---------- generative card art (deterministic, one composition per card) ---------- */
function cardArt(title, i) {
  const initial = esc([...title][0] || '?');
  const P = [
    { bg: '#ffd60a', a: '#2f4bf0', b: '#e5322d' },
    { bg: '#2f4bf0', a: '#ffd60a', b: '#fffdf8' },
    { bg: '#bfe8d8', a: '#e5322d', b: '#0c0a09' },
    { bg: '#ffb8d1', a: '#2f4bf0', b: '#ffd60a' },
    { bg: '#e5322d', a: '#ffd60a', b: '#fffdf8' },
    { bg: '#ebe4d3', a: '#0c0a09', b: '#ffd60a' },
    { bg: '#bfe8d8', a: '#2f4bf0', b: '#ffd60a' },
  ][i % 7];
  const k = i % 4;
  const shapes = [
    `<circle class="spin" cx="108" cy="92" r="58" fill="${P.a}" stroke="#0c0a09" stroke-width="3"/>
     <path class="draw" pathLength="1" d="M170 40l22 40-30 8 34 38 18-30 30 16 12-52" fill="none" stroke="${P.b}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<rect class="spin" x="70" y="38" width="120" height="96" fill="${P.a}" stroke="#0c0a09" stroke-width="3" transform="rotate(-9 130 86)"/>
     <path class="draw" pathLength="1" d="M200 140c-40-6-60-40-30-60s70 4 44 30-48-4-30-24" fill="none" stroke="${P.b}" stroke-width="6" stroke-linecap="round"/>`,
    `<path class="spin" d="M60 130c-24-50 26-94 78-86s84 54 40 88-96 22-118-2z" fill="${P.a}" stroke="#0c0a09" stroke-width="3"/>
     <path class="draw" pathLength="1" d="M20 150c40-30 70 10 110-18s70-18 110-50" fill="none" stroke="${P.b}" stroke-width="6" stroke-linecap="round"/>`,
    `<path class="spin" d="M130 30l76 118H54z" fill="${P.a}" stroke="#0c0a09" stroke-width="3" stroke-linejoin="round"/>
     <circle cx="212" cy="56" r="30" fill="${P.b}" stroke="#0c0a09" stroke-width="3"/>
     <path class="draw" pathLength="1" d="M24 160l40-40M44 164l40-40M64 168l40-40" fill="none" stroke="#0c0a09" stroke-width="4" stroke-linecap="round"/>`,
  ][k];
  const marks = `<path class="draw" pathLength="1" d="M262 28l16 16m0-16L262 44" stroke="#0c0a09" stroke-width="4" stroke-linecap="round"/>
    <path d="M24 28l7-14 7 14 8-14 7 14v10H24z" fill="none" stroke="#0c0a09" stroke-width="2.5" stroke-linejoin="round" opacity=".85"/>`;
  return `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" role="img" aria-label="" focusable="false">
    <rect width="320" height="180" fill="${P.bg}"/>
    ${shapes}${marks}
    <text x="236" y="170" font-family="Caveat, cursive" font-weight="700" font-size="120" fill="#0c0a09" opacity=".9" text-anchor="middle" aria-hidden="true">${initial}</text>
  </svg>`;
}

function card(exp, i, { reveal = true } = {}) {
  const [st, label] = statusOf(exp.meta);
  const live = exp.url && exp.url !== '#';
  const Tag = live ? 'a' : 'div';
  const feat = exp.featured ? ' card--feature' : '';
  const attrs = live ? `href="${esc(exp.url)}" target="_blank" rel="noopener"` : 'aria-disabled="true"';
  const foot = live
    ? `<span>Visit ${esc(new URL(exp.url).hostname.replace(/^www\./, ''))}</span>${ICON.up}`
    : '<span>Not yet — watch this space</span>';
  return `<${Tag} class="card${live ? '' : ' card--soon'}${feat}" ${attrs} data-status="${st}" ${reveal ? `data-reveal style="--d:${(i % 3) * 90}ms"` : ''}>
      <span class="card-tape" aria-hidden="true"></span>
      <div class="card-art">${cardArt(exp.title, i)}</div>
      <div class="card-body">
        <div class="card-top"><span class="chip" data-status="${st}">${label}</span></div>
        <h3>${esc(exp.title)}</h3>
        <p>${esc(exp.summary)}</p>
        <div class="card-foot">${foot}</div>
      </div>
    </${Tag}>`;
}


/* ---------- art helpers: seeded randomness, torn paper, paint drips, margin pictograms ---------- */
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// A ragged, torn top edge as a clip-path (bottom stays straight).
function torn(seed, amp = 14) {
  const r = rng(seed); const pts = [];
  for (let x = 0; x < 100; x += 2.2) pts.push(`${x.toFixed(1)}% ${Math.round(r() * amp)}px`);
  return `polygon(${pts.join(',')},100% ${Math.round(r() * amp)}px,100% 100%,0 100%)`;
}

// Paint drips hanging from the bottom edge of the element they follow.
function drips(cls, seed, n = 16) {
  const r = rng(seed); let g = '';
  for (let i = 0; i < n; i++) {
    const x = ((i + 0.25 + r() * 0.5) * 1200) / n, w = 7 + r() * 9, len = 24 + r() * (i % 3 === 0 ? 85 : 42), d = Math.round(r() * 900);
    g += `<g class="drip" style="--d:${d}ms"><rect x="${x.toFixed(1)}" y="-4" width="${w.toFixed(1)}" height="${len.toFixed(1)}" rx="${(w / 2).toFixed(1)}"/><circle cx="${(x + w / 2).toFixed(1)}" cy="${len.toFixed(1)}" r="${(w * 0.78).toFixed(1)}"/></g>`;
  }
  return `<div class="drips ${cls}" aria-hidden="true" data-draw><svg viewBox="0 0 1200 130" focusable="false"><rect x="0" y="-10" width="1200" height="14"/>${g}</svg></div>`;
}

// Hand-drawn pictograms that live in the page margins and draw themselves in on scroll.
const PICTO = {
  halo: ['M24 22a26 9 0 1 0 52 0a26 9 0 1 0-52 0', 'M30 62a20 20 0 1 0 40 0a20 20 0 1 0-40 0', 'M42 57v5M58 57v5', 'M40 72q10 7 20 0', 'M14 12l-6-5M86 12l6-5'],
  eye: ['M6 50q44-44 88 0q-44 44-88 0z', 'M36 50a14 14 0 1 0 28 0a14 14 0 1 0-28 0', 'M50 10v-6M26 20l-4-5M74 20l4-5', 'M48 50h4'],
  teeth: ['M10 40q40-20 80 0v22q-40 20-80 0z', 'M30 38v28M50 36v30M70 38v28', 'M10 51h80'],
  wings: ['M48 74C28 72 12 56 8 30C20 38 30 36 38 30', 'M46 70C30 66 20 54 18 40', 'M44 64C34 60 28 52 26 44', 'M52 74C72 72 88 56 92 30C80 38 70 36 62 30', 'M54 70C70 66 80 54 82 40', 'M56 64C66 60 72 52 74 44'],
  car: ['M8 64h84V52L78 46 68 32H34L24 46 8 52z', 'M26 64a9 9 0 1 0 18 0a9 9 0 1 0-18 0', 'M58 64a9 9 0 1 0 18 0a9 9 0 1 0-18 0', 'M38 36l-6 10h38l-6-10z'],
  bolt: ['M58 4L24 54h22l-8 42 38-56H54z'],
  heart: ['M50 90C20 66 8 46 22 28c10-12 24-6 28 6c4-12 18-18 28-6c14 18 2 38-28 62z', 'M50 34V12M50 12l-10 8M50 12l12 6', 'M34 44q6-8 14-6'],
  spiral: ['M50 50a4 4 0 1 1 8 0a10 10 0 1 1-20 0a18 18 0 1 1 36 0a26 26 0 1 1-52 0'],
  burst: ['M50 8v18M50 74v18M8 50h18M74 50h18M20 20l13 13M67 67l13 13M80 20L67 33M33 67L20 80'],
  arrow: ['M8 70C30 20 60 20 84 40', 'M70 26l16 14-20 6'],
  crown: ['M10 80l6-44 22 24 12-32 12 32 22-24 6 44z'],
};
function pics(list) {
  return list.map(([name, side, top, size, rot, color]) =>
    `<svg class="picto ${side}" data-draw viewBox="0 0 100 100" style="--w:${size}rem;top:${top}%;--r:${rot}deg;color:var(--${color})" aria-hidden="true" focusable="false">${PICTO[name].map((d) => `<path pathLength="1" d="${d}"/>`).join('')}</svg>`
  ).join('');
}
const old = (w) => `<span class="old" aria-hidden="true">${w}</span>`;
const xo = (w) => `<span class="xo">${w}</span>`;

/* ---------- shared chrome ---------- */
const NAV = [['experiments.html', 'Experiments'], ['about.html', 'About'], ['contact.html', 'Contact']];

function layout({ file, title, description = DESC, body, bodyClass = '', noindex = false, jsonld = '', base = '', pictos = '' }) {
  const url = `${SITE}${file === 'index.html' ? '/' : '/' + file}`;
  const full = title === NAME ? `${NAME} — ${TAGLINE}` : `${title} — ${NAME}`;
  const nav = NAV.map(([href, label]) => `<li><a href="${href}"${file === href ? ' aria-current="page"' : ''}>${label}</a></li>`).join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  ${base}
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(full)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="theme-color" content="#f4efe4" />
  ${noindex ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${url}" />`}
  <meta property="og:site_name" content="${NAME}" />
  <meta property="og:title" content="${esc(full)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/assets/img/og/og-image.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="favicon.ico" sizes="48x48" />
  <link rel="apple-touch-icon" href="apple-touch-icon.png" />
  <link rel="manifest" href="site.webmanifest" />
  <link rel="preload" href="assets/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="assets/fonts/caveat-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="assets/css/fonts.css?v=${V.fonts}" />
  <link rel="stylesheet" href="assets/css/base.css?v=${V.base}" />
  <script>document.documentElement.classList.add('js');try{if(sessionStorage.getItem('wipe')){document.documentElement.classList.add('wiping');sessionStorage.removeItem('wipe')}}catch(e){}</script>
  ${jsonld}
</head>
<body class="${bodyClass}">
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><filter id="rough" x="-15%" y="-40%" width="130%" height="180%"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.035" numOctaves="2" seed="4" result="n1"/><feDisplacementMap in="SourceGraphic" in2="n1" scale="3.2" result="d1"/><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="1" seed="9" result="n2"/><feDisplacementMap in="d1" in2="n2" scale="1.4"/></filter></svg>
  <div class="wipe" aria-hidden="true"><i style="--k:0"></i><i style="--k:1"></i><i style="--k:2"></i></div>
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-header">
    <nav class="wrap nav" aria-label="Main">
      <a class="brand" href="index.html" aria-label="${NAME} home"><span class="brand-mark">${ICON.crown}</span>${NAME}<sup class="copy" aria-hidden="true">©</sup></a>
      <ul class="nav-links">${nav}</ul>
    </nav>
  </header>
  <main id="main">
${pictos}
${body}
  </main>
  <footer class="site-footer" style="clip-path:${torn(31, 12)}">
    <div class="wrap footer-inner">
      <p class="footer-big">Every experiment<br />gets a <span>wall.</span></p>
      <div class="footer-meta">
        <span>${NAME} © ${YEAR} — Lagos &amp; Lisbon. All experiments ongoing.</span>
        <span><a href="contact.html">Say hello</a> · <a href="sitemap.xml">Sitemap</a></span>
        <span class="psst" aria-hidden="true">psst… try typing S·A·M·O</span>
      </div>
    </div>
  </footer>
  <script src="assets/js/site.js?v=${V.js}" defer></script>
</body>
</html>
`;
}

const words = (s, start = 0) => s.split(' ').map((w, i) => `<span class="word" style="--i:${start + i}">${esc(w)}</span>`).join(' ');

/* ---------- pages ---------- */
const pages = {};

// Home
{
  const six = experiments.slice(0, 7);
  const ticker = experiments.map((e) => `<span class="marquee-item">${esc(e.title)} <i>✺</i></span>`).join('');
  pages['index.html'] = layout({
    file: 'index.html',
    pictos: pics([['eye', 'r', 33, 5.5, 8, 'red'], ['bolt', 'l', 44, 5, -10, 'blue'], ['heart', 'r', 56, 5.5, 6, 'ink'], ['wings', 'l', 70, 6.5, -4, 'ink'], ['halo', 'r', 84, 5, 10, 'blue']]),
    title: NAME,
    jsonld: `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: NAME, url: SITE, description: DESC })}</script>`,
    body: `
    <section class="hero">
      <div class="hero-art" aria-hidden="true">
        <svg class="blob blob--blue" data-speed="0.12" viewBox="0 0 200 200"><path fill="currentColor" stroke="#0c0a09" stroke-width="3" d="M46 34c32-30 94-24 120 12s20 92-18 120-94 24-120-14S14 64 46 34z"/><path class="draw" pathLength="1" fill="none" stroke="#ffd60a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" d="M52 138l12-66 36 36 28-50 32 80z"/></svg>
        <svg class="blob blob--red" data-speed="-0.08" viewBox="0 0 120 120"><path fill="currentColor" stroke="#0c0a09" stroke-width="3" d="M60 6l12 30 32-6-20 26 24 22-32 4-4 32-22-24-26 18 6-32-30-8 28-16-8-30 28 10z"/></svg>
        <svg class="blob blob--yellow" data-speed="0.18" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="currentColor" stroke="#0c0a09" stroke-width="3"/><path d="M26 54c10 14 38 14 48 0" fill="none" stroke="#0c0a09" stroke-width="4" stroke-linecap="round"/><circle cx="36" cy="38" r="4" fill="#0c0a09"/><circle cx="64" cy="38" r="4" fill="#0c0a09"/></svg>
      </div>
      <div class="wrap hero-inner">
        <p class="label eyebrow" data-reveal>Studio · Lagos <time data-tz="Africa/Lagos"></time> &amp; Lisbon <time data-tz="Europe/Lisbon"></time></p>
        <h1 aria-label="Four people. Infinite experiments.">
          <span class="line" aria-hidden="true">${words('Four people.')}</span>
          <span class="line" aria-hidden="true"><span class="hl">${words('Infinite experiments.', 2)}</span></span>
        </h1>
        <p class="hero-sub">We experiment with AI like <span class="xout">startups</span><span class="rewrite">artists</span> paint walls. Art, AI, and everything in between.</p>
        <div class="hero-actions">
          <a class="btn btn--solid" href="experiments.html">See the experiments ${ICON.arrow}</a>
          <button class="btn toggle" id="toggleLayers" type="button" aria-pressed="false">${ICON.eye}<span>See behind the paint</span></button>
        </div>
        <span class="note note--a" aria-hidden="true">no buzzwords ${ICON.curve}</span>
        <span class="note note--b" aria-hidden="true">draw on this wall</span>
      </div>
    </section>

    <div class="tape-wrap"><div class="marquee" aria-hidden="true"><div class="marquee-track">${ticker}${ticker}${ticker}${ticker}</div></div>${drips('ink', 5, 17)}</div>

    <section class="section" aria-labelledby="experiments-heading">
      <div class="wrap">
        <div class="section-head">
          <h2 id="experiments-heading" data-reveal>${old('Projects')}Experiments<span class="count">(${experiments.length})</span></h2>
          <a class="link-arrow" href="experiments.html">View all</a>
        </div>
        <div class="grid">
${six.map((e, i) => card(e, i)).join('\n')}
        </div>
      </div>
    </section>

    <div class="band-wrap">
    <section class="band" style="clip-path:${torn(11, 16)}" aria-labelledby="philosophy">
      <div class="band-crown" aria-hidden="true">${ICON.crown.replace('stroke-width="2.2"', 'stroke-width="1"')}</div>
      <div class="wrap section">
        <p class="label eyebrow" data-reveal>Philosophy</p>
        <h2 class="quote" id="philosophy" data-reveal style="--d:80ms; margin-top:1rem">“We treat ideas like <em>sketches.</em> Every experiment gets a wall.”</h2>
        <a class="btn" href="about.html" data-reveal style="--d:160ms">Read more ${ICON.arrow}</a>
      </div>
    </section>
    ${drips('blue', 23, 15)}
    </div>

    <section class="section" aria-labelledby="now-heading">
      <div class="wrap">
        <div class="section-head">
          <h2 id="now-heading" data-reveal>${old('Later')}Now</h2>
          <span class="label" style="color:var(--muted)">Updated monthly</span>
        </div>
        <ul class="now" style="padding:0;margin:0">
${now.map((n, i) => `          <li data-reveal style="--d:${i * 100}ms"><span class="label">${esc(n.tag)}</span><span class="hand">${esc(n.text)}</span></li>`).join('\n')}
        </ul>
      </div>
    </section>`,
  });
}

// Experiments
{
  const statuses = [...new Map(experiments.map((e) => statusOf(e.meta))).entries()];
  pages['experiments.html'] = layout({
    file: 'experiments.html',
    pictos: pics([['bolt', 'l', 28, 5, -8, 'red'], ['eye', 'r', 48, 5.5, 6, 'blue'], ['burst', 'l', 72, 5, 0, 'ink']]),
    title: 'Experiments',
    description: 'Explore Placeholder LLC experiments and prototypes.',
    body: `
    <div class="wrap page-head">
      <p class="label eyebrow">The wall</p>
      <h1 style="margin-top:1rem" data-reveal>${old('Portfolio')}Experiments</h1>
      <p>Prototypes, products and half-finished obsessions. Some are live, some are sketches.</p>
    </div>
    <section class="wrap" style="padding-bottom:2rem" aria-label="Experiments">
      <div class="filters" role="group" aria-label="Filter by status" hidden>
        <button class="filter" type="button" data-filter="all" aria-pressed="true">All (${experiments.length})</button>
        ${statuses.map(([k, label]) => `<button class="filter" type="button" data-filter="${k}" aria-pressed="false">${label}</button>`).join('\n        ')}
      </div>
      <div class="grid" id="experiments-list">
${experiments.map((e, i) => card(e, i)).join('\n')}
      </div>
    </section>`,
  });
}

// About
{
  const live = experiments.filter((e) => statusOf(e.meta)[0] === 'live').length;
  const tones = ['var(--yellow)', 'var(--mint)', 'var(--pink)', 'var(--blue)'];
  const principles = [
    ['01', 'Honest imperfection', 'Rough edges are information. We ship the sketch and show the seams.'],
    ['02', 'Controlled chaos', 'Play with structure. Constraints are what make the mess readable.'],
    ['03', 'Intelligent play', 'AI is a medium, like paint. We care about what it makes possible, not the hype.'],
  ];
  pages['about.html'] = layout({
    file: 'about.html',
    pictos: pics([['halo', 'l', 20, 5.5, -6, 'blue'], ['teeth', 'r', 36, 6, 5, 'red'], ['car', 'l', 54, 6.5, -3, 'ink'], ['spiral', 'r', 66, 5, 0, 'blue'], ['crown', 'l', 84, 5.5, -8, 'ink']]),
    title: 'About',
    description: 'About Placeholder LLC — studio philosophy and team.',
    body: `
    <div class="wrap page-head">
      <p class="label eyebrow">Who we are</p>
      <h1 style="margin-top:1rem" data-reveal>${old('Corporate')}About</h1>
      <p>A small studio in Lagos and Lisbon treating ideas like sketches. Every experiment gets a wall.</p>
    </div>
    <section class="wrap" style="padding-bottom:3rem" aria-labelledby="principles-h">
      <h2 id="principles-h" class="sr-only">Principles</h2>
      <div class="principles">
${principles.map(([n, h, p], i) => `        <article class="principle" data-reveal style="--d:${i * 100}ms"><div class="num" aria-hidden="true">${n}</div><h3>${h}</h3><p>${p}</p></article>`).join('\n')}
      </div>
      <div class="stats" aria-label="Studio in numbers">
        <div class="stat" data-reveal><b data-count="${people.length}">${people.length}</b><span>people</span></div>
        <div class="stat" data-reveal style="--d:80ms"><b data-count="${experiments.length}">${experiments.length}</b><span>experiments</span></div>
        <div class="stat" data-reveal style="--d:160ms"><b data-count="${live}">${live}</b><span>live right now</span></div>
        <div class="stat" data-reveal style="--d:240ms"><b>∞</b><span>ideas in the queue</span></div>
      </div>
    </section>
        <section class="wrap section" aria-labelledby="nb-h">
      <div class="section-head"><h2 id="nb-h" data-reveal>${old('Manifesto')}Things we believe</h2></div>
      <div class="canvas-frame" data-reveal>
        <ol class="notebook">
          <li style="--rot:-1deg;--ind:0">IDEAS ARE SKETCHES</li>
          <li style="--rot:.8deg;--ind:2rem">${xo('POLISH')} <span class="nw">SHIP THE ROUGH DRAFT</span></li>
          <li style="--rot:-.6deg;--ind:.5rem">EVERY EXPERIMENT GETS A WALL</li>
          <li style="--rot:1.2deg;--ind:3rem">AI IS PAINT. NOT THE PAINTER.</li>
          <li style="--rot:-1.4deg;--ind:1rem">${xo('HYPE')} <span class="nw">CURIOSITY</span></li>
          <li style="--rot:.5deg;--ind:0">MAKE IT WEIRD ${ICON.arrow.replace('<svg ', '<svg class="inl" ')} THEN MAKE IT WORK</li>
          <li style="--rot:-2deg;--ind:2.5rem"><span class="boxed">NO BUZZWORDS</span></li>
        </ol>
      </div>
    </section>
    <section class="wrap section" aria-labelledby="team-h">
      <div class="section-head"><h2 id="team-h" data-reveal>${old('Staff')}The four</h2></div>
      <div class="team">
${people.map((p, i) => {
  const sub = [p.role, p.bio].filter(Boolean).join(' — ');
  return `        <article class="person" data-reveal style="--d:${i * 90}ms"><div class="avatar" style="--tone:${tones[i % 4]}${i % 4 === 3 ? ';color:#fffdf8' : ''}" aria-hidden="true">${esc([...p.name][0])}</div><h3>${esc(p.name)}</h3>${sub ? `<p>${esc(sub)}</p>` : ''}</article>`;
}).join('\n')}
      </div>
    </section>
    <section class="band" style="clip-path:${torn(17, 16)}" aria-label="Notes">
      <div class="wrap section">
        <p class="quote" data-reveal>Accessible by design. Fast by intention. <em>Always evolving.</em></p>
      </div>
    </section>`,
  });
}

// Contact
pages['contact.html'] = layout({
  file: 'contact.html',
  pictos: pics([['arrow', 'r', 44, 6, 0, 'red'], ['heart', 'l', 30, 5, -6, 'blue']]),
  title: 'Contact',
  description: 'Contact Placeholder LLC for collaboration.',
  body: `
    <div class="wrap page-head">
      <p class="label eyebrow">Say hi</p>
      <h1 style="margin-top:1rem" data-reveal>${old('Enquiries')}Let’s collaborate</h1>
      <p>Send a message. Let’s have a chat.</p>
    </div>
    <div class="wrap contact-grid" style="padding-bottom:2rem">
      <form class="form" action="https://formspree.io/f/xwpwqydj" method="POST" data-reveal>
        <label class="field">Name<input type="text" name="name" autocomplete="name" required /></label>
        <label class="field">Email<input type="email" name="email" autocomplete="email" required /></label>
        <label class="field">Message<textarea name="message" required></textarea></label>
        <input type="hidden" name="_redirect" value="/thanks.html" />
        <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="display:none" aria-hidden="true" />
        <button class="btn btn--solid" type="submit" style="width:fit-content"><span>Send</span>${ICON.send}</button>
      </form>
      <aside data-reveal style="--d:120ms">
        <p class="aside-note">Got a weird idea? Even better.</p>
        <ul style="margin:1.5rem 0 0;padding-left:1.2rem;color:var(--ink-soft);line-height:1.8">
          <li>Collaborations &amp; commissions</li>
          <li>Odd prototypes worth building</li>
          <li>Press &amp; talks</li>
        </ul>
      </aside>
    </div>`,
});

// Thanks
pages['thanks.html'] = layout({
  file: 'thanks.html',
  pictos: pics([['burst', 'r', 30, 5.5, 0, 'red'], ['crown', 'l', 55, 5.5, -8, 'blue']]),
  title: 'Thanks',
  noindex: true,
  body: `
    <div class="wrap center-page"><div>
      <div class="big-mark" aria-hidden="true">${ICON.crown}</div>
      <h1>Thanks for<br />reaching out</h1>
      <p>We got your message. We’ll reply soon.</p>
      <a class="btn" href="index.html">Back to the canvas ${ICON.arrow}</a>
    </div></div>`,
});

// 404
pages['404.html'] = layout({
  file: '404.html',
  pictos: pics([['spiral', 'l', 30, 5.5, 0, 'blue'], ['eye', 'r', 50, 5.5, 8, 'red']]),
  base: '<base href="/" />',
  title: 'Lost in the experiment',
  noindex: true,
  body: `
    <div class="wrap center-page"><div>
      <p class="hand" style="font-size:clamp(6rem,20vw,12rem);color:var(--red);transform:rotate(-4deg)" aria-hidden="true">404</p>
      <h1>Lost in the<br />experiment</h1>
      <p>This page doesn’t exist. Yet.</p>
      <a class="btn" href="index.html">Back to the canvas ${ICON.arrow}</a>
    </div></div>`,
});

/* ---------- write ---------- */
for (const [file, html] of Object.entries(pages)) writeFileSync(new URL(`./${file}`, import.meta.url), html);

const urls = ['', 'about.html', 'experiments.html', 'contact.html'];
writeFileSync(new URL('./sitemap.xml', import.meta.url), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}/${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}
</urlset>
`);

writeFileSync(new URL('./favicon.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="1.5" y="1.5" width="29" height="29" fill="#ffd60a" stroke="#0c0a09" stroke-width="3"/><path d="M7 23l2-11 5 5 3-7 7 13H7z" fill="none" stroke="#0c0a09" stroke-width="2.8" stroke-linejoin="round"/></svg>
`);

console.log(`built ${Object.keys(pages).length} pages`);

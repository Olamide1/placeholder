(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initLayerToggle() {
    const btn = document.getElementById('toggleLayers');
    if (!btn) return;
    let faded = false;
    btn.addEventListener('click', () => {
      faded = !faded;
      document.querySelectorAll('.texture-paper, .texture-brush, .noise-layer').forEach((el) => {
        el.style.transition = 'opacity 200ms ease';
        el.style.opacity = faded ? '0.08' : '';
      });
      btn.setAttribute('aria-pressed', String(faded));
    });
  }

  function initParallax() {
    if (prefersReduced) return;
    const groups = document.querySelectorAll('[data-parallax-group]');
    if (!groups.length) return;
    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      groups.forEach((group) => {
        const rect = group.getBoundingClientRect();
        const offset = (rect.top + scrollY) * 0.0008;
        group.style.transform = `translateY(${Math.sin(offset) * 6}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initRhythmGrid() {
    const grid = document.createElement('div');
    grid.className = 'rhythm-grid absolute inset-0 -z-20';
    document.body.appendChild(grid);
    const onScroll = () => {
      const y = window.scrollY || 0;
      grid.classList.toggle('show', (y % 600) < 220);
    };
    if (!prefersReduced) window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initFlicker() {
    const els = document.querySelectorAll('.flicker');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('on'), Math.random() * 120);
        }
      });
    }, { threshold: 0.1 });
    els.forEach((el) => io.observe(el));
  }

  function addSymbolScatter() {
    const host = document.querySelector('header');
    if (!host) return;
    const symbols = ['AI', 'TEST', '?', 'EXP'];
    symbols.forEach((s, i) => {
      const span = document.createElement('span');
      span.textContent = s;
      span.className = `scatter ${['blue','red','yellow'][i % 3]}`;
      span.style.left = (6 + i * 14) + '%';
      span.style.top = (18 + i * 10) + 'px';
      host.appendChild(span);
    });
  }

  function addBrushShards() {
    const main = document.querySelector('main');
    if (!main) return;
    const layer = document.createElement('div');
    layer.className = 'shards -z-10';
    for (let i = 0; i < 3; i++) {
      const img = document.createElement('img');
      img.src = '/assets/svg/icons/brush-shard.svg';
      img.alt = '';
      img.className = 'shard';
      img.style.left = (i * 30 + 5) + '%';
      img.style.top = (i * 80 + 40) + 'px';
      layer.appendChild(img);
    }
    main.appendChild(layer);
    if (prefersReduced) return;
    const onScroll = () => {
      const y = window.scrollY || 0;
      layer.querySelectorAll('.shard').forEach((el, idx) => {
        el.style.transform = `translateY(${(y * (0.03 + idx * 0.015))}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initSmudgeTrail() {
    if (prefersReduced) return;
    const hero = document.querySelector('header');
    if (!hero) return;
    const dots = [];
    function addDot(x, y) {
      const d = document.createElement('div');
      d.style.position = 'fixed';
      d.style.left = x + 'px';
      d.style.top = y + 'px';
      d.style.width = '6px';
      d.style.height = '6px';
      d.style.borderRadius = '50%';
      d.style.background = 'rgba(12,10,9,0.12)';
      d.style.pointerEvents = 'none';
      d.style.zIndex = '5';
      document.body.appendChild(d);
      dots.push(d);
      setTimeout(() => { d.style.transition = 'opacity 400ms'; d.style.opacity = '0'; }, 40);
      setTimeout(() => d.remove(), 900);
    }
    hero.addEventListener('mousemove', (e) => addDot(e.clientX, e.clientY));
  }

  function tapeifyCards() {
    document.querySelectorAll('#experiments-grid a, #experiments-list a, [data-tape]')
      .forEach((card) => {
        const tl = document.createElement('img');
        tl.src = '/assets/svg/icons/tape.svg'; tl.alt = '';
        tl.className = 'tape tl';
        const tr = document.createElement('img');
        tr.src = '/assets/svg/icons/tape.svg'; tr.alt = '';
        tr.className = 'tape tr';
        card.style.position = 'relative';
        card.appendChild(tl); card.appendChild(tr);
      });
  }
  function briefCrownCursor() {
    let armed = true;
    const handler = () => {
      if (!armed) return;
      document.body.classList.add('crown-cursor');
      setTimeout(() => document.body.classList.remove('crown-cursor'), 800);
      armed = false;
      setTimeout(() => (armed = true), 5000);
    };
    window.addEventListener('scroll', handler, { passive: true });
  }

  async function loadJSON(path) {
    try {
      const res = await fetch(path, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`Failed to load ${path}`);
      return await res.json();
    } catch (e) {
      console.warn(e);
      return null;
    }
  }

  function createExperimentCard(exp) {
    const card = document.createElement('a');
    card.href = exp.url || '#';
    card.className = 'group relative block rounded border border-stone-900 bg-white p-4 shadow-[6px_6px_0_0_#0c0a09] hover:-rotate-1 focus:outline-none focus:ring-2 focus:ring-stone-800';

    const bg = document.createElement('div');
    bg.className = 'absolute inset-0 -z-10 opacity-15 mix-blend-multiply texture-brush';
    card.appendChild(bg);

    const title = document.createElement('h3');
    title.className = 'handwritten text-xl';
    title.textContent = exp.title;
    card.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'mt-2 text-sm text-stone-700';
    desc.textContent = exp.summary || '';
    card.appendChild(desc);

    const metric = document.createElement('div');
    metric.className = 'mt-3 text-xs uppercase text-stone-600';
    metric.textContent = exp.meta || '';
    card.appendChild(metric);

    const doodle = document.createElement('img');
    doodle.alt = '';
    doodle.src = '/assets/svg/icons/question.svg';
    doodle.className = 'absolute right-2 top-2 h-5 w-5 opacity-80 transition-transform group-hover:-rotate-12';
    card.appendChild(doodle);

    return card;
  }

  async function populateExperiments() {
    const grid = document.getElementById('experiments-grid');
    if (!grid) return;
    const data = await loadJSON('/data/experiments.json');
    if (!data || !Array.isArray(data.experiments)) return;
    grid.innerHTML = '';
    data.experiments.slice(0, 6).forEach((exp) => grid.appendChild(createExperimentCard(exp)));
  }

  async function populateNow() {
    const list = document.getElementById('now-list');
    if (!list) return;
    const data = await loadJSON('/data/now.json');
    if (!data || !Array.isArray(data.items)) return;
    list.innerHTML = '';
    data.items.slice(0, 3).forEach((item) => {
      const li = document.createElement('li');
      li.className = 'rounded border border-stone-900 bg-white p-4 shadow-[4px_4px_0_0_#0c0a09]';
      const tag = document.createElement('div');
      tag.className = 'text-xs uppercase text-stone-600';
      tag.textContent = item.tag || '';
      const text = document.createElement('div');
      text.className = 'handwritten mt-1 text-lg';
      text.textContent = item.text || '';
      li.appendChild(tag);
      li.appendChild(text);
      list.appendChild(li);
    });
  }

  function initScribbleReveal() {
    document.querySelectorAll('[data-note]').forEach((el) => {
      el.classList.add('scribble');
    });
  }

  function init() {
    initLayerToggle();
    initParallax();
    initRhythmGrid();
    initFlicker();
    briefCrownCursor();
    populateExperiments();
    populateNow();
    initScribbleReveal();
    addSymbolScatter();
    addBrushShards();
    initSmudgeTrail();
    tapeifyCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();



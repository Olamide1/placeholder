// Placeholder LLC — progressive enhancement. The site is fully readable without this file.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  /* Scroll reveal: one observer, elements animate in once. */
  function reveal() {
    const els = $$('[data-reveal], [data-draw]');
    if (!('IntersectionObserver' in window) || reduced) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((e) => io.observe(e));
  }

  /* Parallax: a single rAF-throttled scroll listener, only on the hero blobs. */
  function parallax() {
    if (reduced) return;
    const blobs = $$('.blob[data-speed]');
    if (!blobs.length) return;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      if (y < 1200) blobs.forEach((b) => { b.style.transform = `translate3d(0, ${y * Number(b.dataset.speed)}px, 0)`; });
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  }

  /* Pointer drift on the hero: blobs lean toward the cursor a few pixels. */
  function pointerDrift() {
    if (reduced || !matchMedia('(hover: hover)').matches) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const blobs = $$('.blob', hero);
    let raf = 0;
    hero.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        blobs.forEach((b, i) => { b.style.rotate = `${x * (8 + i * 4)}deg`; b.style.scale = String(1 + Math.abs(y) * 0.05); });
      });
    });
  }

  /* "See behind the paint": swaps to a pencil-sketch view. Remembered per visitor. */
  function sketchToggle() {
    const btn = document.getElementById('toggleLayers');
    const root = document.documentElement;
    const apply = (on) => {
      root.dataset.sketch = on ? 'on' : 'off';
      if (btn) {
        btn.setAttribute('aria-pressed', String(on));
        btn.querySelector('span').textContent = on ? 'Back to the paint' : 'See behind the paint';
      }
    };
    if (store.get('sketch') === 'on') apply(true);
    btn?.addEventListener('click', () => {
      const on = root.dataset.sketch !== 'on';
      apply(on); store.set('sketch', on ? 'on' : 'off');
    });
  }

  /* Experiments filter (buttons are hidden until JS exists). */
  function filters() {
    const bar = document.querySelector('.filters');
    const list = document.getElementById('experiments-list');
    if (!bar || !list) return;
    bar.hidden = false;
    const cards = $$('.card', list);
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('.filter');
      if (!b) return;
      $$('.filter', bar).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const f = b.dataset.filter;
      cards.forEach((c, i) => {
        const show = f === 'all' || c.dataset.status === f;
        c.hidden = !show;
        if (show) { c.classList.remove('in'); void c.offsetWidth; setTimeout(() => c.classList.add('in'), 40 + i * 30); }
      });
    });
  }

  /* Count-up numbers on the About page. */
  function counters() {
    const els = $$('[data-count]');
    if (!els.length || reduced || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target, end = Number(el.dataset.count), t0 = performance.now(), dur = 900;
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        el.textContent = '0';
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    els.forEach((e) => io.observe(e));
  }

  /* Form: confirm the click did something. */
  function form() {
    const f = document.querySelector('form.form');
    if (!f) return;
    f.addEventListener('submit', () => {
      const b = f.querySelector('button[type="submit"]');
      b.disabled = true;
      b.querySelector('span').textContent = 'Sending…';
    });
  }

  /* Live local times for Lagos and Lisbon. */
  function clocks() {
    const els = $$('time[data-tz]');
    if (!els.length) return;
    const tick = () => els.forEach((el) => {
      try { el.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: el.dataset.tz }).format(new Date()); } catch { /* old browser: stay blank */ }
    });
    tick(); setInterval(tick, 15000);
  }

  /* Draw on the hero wall: drag with a mouse for oil-stick scribbles, click/tap to stamp a crown.
     Marks fade after a few seconds. Touch keeps vertical scrolling and stamps on tap. */
  function scrawl() {
    const hero = document.querySelector('.hero');
    if (!hero || !document.createElement('canvas').getContext) return;
    const cv = document.createElement('canvas');
    cv.className = 'scrawl'; cv.setAttribute('aria-hidden', 'true');
    hero.appendChild(cv);
    const ctx = cv.getContext('2d');
    let W = 0, H = 0;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2), r = hero.getBoundingClientRect();
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(hero); else addEventListener('resize', size);

    const COLORS = ['#0c0a09', '#e5322d', '#2f4bf0', '#ffd60a'];
    const FILLS = ['#ffd60a', '#e5322d', '#2f4bf0', '#bfe8d8', '#ffb8d1'];
    const LIFE = 6500, FADE = 2500;
    const crown = new Path2D('M3 18l2-10 5 5 4-6 7 11H3z');
    const items = [];
    let raf = 0, cur = null, ci = 0, hinted = false, startPt = null;

    const rand = (a, b) => a + Math.random() * (b - a);
    const pt = (e) => { const r = hero.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const hide = () => { if (hinted) return; hinted = true; hero.querySelectorAll('.note--b').forEach((n) => n.classList.add('gone')); };

    function render(now) {
      ctx.clearRect(0, 0, W, H);
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        const age = it === cur ? 0 : now - it.t0;
        const a = age < LIFE ? 1 : 1 - (age - LIFE) / FADE;
        if (a <= 0) { items.splice(i, 1); continue; }
        ctx.globalAlpha = a;
        if (it.type === 'crown') {
          ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot); ctx.scale(it.s, it.s); ctx.translate(-12, -12);
          ctx.fillStyle = it.fill; ctx.strokeStyle = '#0c0a09'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
          ctx.fill(crown); ctx.stroke(crown); ctx.restore();
        } else drawStroke(it);
      }
      ctx.globalAlpha = 1;
      raf = items.length ? requestAnimationFrame(render) : 0;
    }
    function trace(pts, dx, dy) {
      ctx.beginPath(); ctx.moveTo(pts[0].x + dx, pts[0].y + dy);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2 + dx, my = (pts[i].y + pts[i + 1].y) / 2 + dy;
        ctx.quadraticCurveTo(pts[i].x + dx, pts[i].y + dy, mx, my);
      }
      const l = pts[pts.length - 1]; ctx.lineTo(l.x + dx, l.y + dy);
    }
    function drawStroke(s) {
      if (s.pts.length < 2) return;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = s.color; ctx.lineWidth = s.w; trace(s.pts, 0, 0); ctx.stroke();
      // dry-brush streaks: thin gaps cut through the paint
      ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = 1.4;
      s.streaks.forEach((k) => { ctx.setLineDash(k.dash); ctx.globalAlpha *= 0.55; trace(s.pts, 0, k.off); ctx.stroke(); });
      ctx.restore();
    }
    const start = () => { if (!raf) raf = requestAnimationFrame(render); };
    function stamp(p) {
      items.push({ type: 'crown', x: p.x, y: p.y, rot: rand(-0.5, 0.5), s: rand(3.4, 6), fill: FILLS[Math.floor(Math.random() * FILLS.length)], t0: performance.now() });
      hide(); start();
    }

    hero.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('a, button, input, textarea, label')) return;
      const p = pt(e); startPt = p;
      if (e.pointerType === 'touch') return;          // touch: stamp on release, scrolling stays native
      cur = { type: 'stroke', pts: [p], color: COLORS[ci++ % COLORS.length], w: rand(9, 17), t0: performance.now(),
        streaks: Array.from({ length: 4 }, (_, i) => ({ off: (i - 1.5) * 3.2, dash: [rand(10, 60), rand(6, 30)] })) };
      items.push(cur);
      document.body.style.userSelect = 'none';
      try { hero.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      hide(); start();
    });
    hero.addEventListener('pointermove', (e) => {
      if (!cur) return;
      const p = pt(e), l = cur.pts[cur.pts.length - 1];
      if (Math.hypot(p.x - l.x, p.y - l.y) > 3) { cur.pts.push(p); start(); }
    });
    const end = (e) => {
      document.body.style.userSelect = '';
      if (cur) {
        const s = cur; cur = null;
        if (s.pts.length < 3) { items.splice(items.indexOf(s), 1); stamp(pt(e)); }  // a click, not a drag
        else s.t0 = performance.now();
        return;
      }
      if (e.pointerType === 'touch' && startPt && !e.target.closest('a, button')) stamp(pt(e));
      startPt = null;
    };
    hero.addEventListener('pointerup', end);
    hero.addEventListener('pointercancel', () => { document.body.style.userSelect = ''; cur = null; startPt = null; });
  }

  /* Easter egg: type S-A-M-O anywhere. Crowns rain, a tag slaps onto the screen. */
  function samo() {
    let buf = '';
    const colors = ['#ffd60a', '#e5322d', '#2f4bf0', '#bfe8d8', '#ffb8d1'];
    function fire() {
      const box = document.createElement('div');
      box.className = 'samo'; box.setAttribute('role', 'status');
      box.innerHTML = '<div><b>SAMO©</b><span>NEVER THE SAME OLD</span></div>';
      document.body.appendChild(box);
      const made = [box];
      if (!reduced) {
        for (let i = 0; i < 34; i++) {
          const c = document.createElement('div');
          c.className = 'rain';
          c.style.cssText = `left:${Math.random() * 100}vw;--s:${30 + Math.random() * 60}px;--t:${1.8 + Math.random() * 1.8}s;--d:${Math.random() * 1.2}s;--rot:${(Math.random() - .5) * 900}deg;--f:${colors[i % colors.length]}`;
          c.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18l2-10 5 5 4-6 7 11H3z"/></svg>';
          document.body.appendChild(c); made.push(c);
        }
      }
      setTimeout(() => made.forEach((n) => n.parentNode && n.parentNode.removeChild(n)), 5200);
    }
    addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      if (e.target.closest && e.target.closest('input, textarea')) return;
      buf = (buf + e.key.toLowerCase()).slice(-4);
      if (buf === 'samo') { buf = ''; fire(); }
    });
  }

  /* Paint wipe: internal links slide a strip of paint across the screen, the next page wipes it away. */
  function wipe() {
    const w = document.querySelector('.wipe');
    if (!w || reduced) return;
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target || a.hasAttribute('download')) return;
      let u; try { u = new URL(a.href, location.href); } catch { return; }
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search) || !/\.(html?)$|\/$/.test(u.pathname)) return;
      e.preventDefault();
      try { sessionStorage.setItem('wipe', '1'); } catch { /* private mode: just navigate */ }
      w.classList.add('go');
      setTimeout(() => { location.href = a.href; }, 620);
    });
    addEventListener('pageshow', (e) => { if (e.persisted) w.classList.remove('go'); });
  }

  function init() { clocks(); requestAnimationFrame(() => document.querySelector('.hero')?.classList.add('is-drawn')); reveal(); parallax(); pointerDrift(); sketchToggle(); filters(); counters(); form(); scrawl(); samo(); wipe(); }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();

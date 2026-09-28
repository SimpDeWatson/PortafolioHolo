/* page-fx.js — efectos Myth (inicio / tareas / info / login) + Ina (perfil) */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MYTH = {
    gura: { cols: ['#4fc3f7', '#b3e5fc', '#81d4fa'], glyphs: ['🦈', '🫧', '🔱'], rib: '🦈 🫧 🔱 🌊 🐟 🐚' },
    amelia: { cols: ['#f5c542', '#fff3c4', '#ffe082'], glyphs: ['⏰', '🔍', '⚙️'], rib: '⏰ 🔍 ⌛ ⚙️ 🕵️‍♀️ 📜' },
    kiara: { cols: ['#ff8a3d', '#ffcc80', '#ffe082'], glyphs: ['🔥', '🪶', '🐔'], rib: '🔥 🪶 🐔 ☀️ 🎤 ✨' },
    calliope: { cols: ['#ff4d8d', '#ff80ab', '#f8bbd0'], glyphs: ['💀', '🌹', '🖤'], rib: '💀 🌹 ⚰️ 🎤 🌙 🖤' },
  };
  const INA = {
    cols: ['#a374db', '#2dd4bf', '#c4b5fd', '#6b21a8'],
    glyphs: ['🐙', '📖', '✨', '🟣'],
    rib: '🐙 📖 ✨ 🟣 🌀 📜',
  };

  const R = (a, z) => a + Math.random() * (z - a);
  const K = (a) => a[(Math.random() * a.length) | 0];
  const fine = matchMedia('(pointer:fine)').matches;

  let mode = 'myth'; // myth | ina | off
  let host = document.body; // where canvas attaches for login vs body
  const P = [];
  let w = 0, h = 0, dpr = Math.min(devicePixelRatio || 1, 2);
  let cv, g, deco, ribbonEl;
  let lt = 0;

  function ensureLayers() {
    if (cv && cv.isConnected) return;
    deco = document.createElement('div');
    deco.className = 'page-fx-deco';
    deco.setAttribute('aria-hidden', 'true');

    cv = document.createElement('canvas');
    cv.className = 'page-fx-canvas';
    cv.setAttribute('aria-hidden', 'true');
    g = cv.getContext('2d');

    attachTo(document.body);
    rs();
  }

  function attachTo(el) {
    host = el || document.body;
    // move layers
    if (deco.parentNode) deco.parentNode.removeChild(deco);
    if (cv.parentNode) cv.parentNode.removeChild(cv);
    host.appendChild(deco);
    host.appendChild(cv);
  }

  function rs() {
    if (!cv) return;
    w = host === document.body ? innerWidth : host.clientWidth || innerWidth;
    h = host === document.body ? innerHeight : host.clientHeight || innerHeight;
    cv.width = Math.max(1, w * dpr);
    cv.height = Math.max(1, h * dpr);
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', rs);

  function gear(n, a, z) {
    let p = '';
    for (let i = 0; i < n * 4; i++) {
      const t = (i / (n * 4)) * 6.2832;
      const r = i % 4 < 2 ? z : a;
      p += (i ? 'L' : 'M') + (r * Math.cos(t)).toFixed(1) + ' ' + (r * Math.sin(t)).toFixed(1);
    }
    return `<svg viewBox="-100 -100 200 200"><path fill-rule="evenodd" d="${p}ZM-30 0a30 30 0 1 0 60 0a30 30 0 1 0-60 0Z"/></svg>`;
  }

  function setDeco() {
    if (!deco) return;
    deco.className = 'page-fx-deco';
    if (mode === 'ina') {
      deco.classList.add('ina-mode');
      deco.innerHTML = '<i class="fx-ina-glow"></i><i class="fx-ina-ring"></i>';
    } else if (mode === 'myth') {
      const WV =
        '<svg class="fx-waves %c" viewBox="0 0 1440 120" preserveAspectRatio="none"><path d="M0 60Q90 10 180 60T360 60T540 60T720 60T900 60T1080 60T1260 60T1440 60V120H0Z"/></svg>';
      deco.innerHTML =
        WV.replace('%c', 'w1') +
        WV.replace('%c', 'w2') +
        `<div class="fx-gear g1">${gear(12, 78, 96)}</div>` +
        `<div class="fx-gear g2">${gear(9, 78, 96)}</div>` +
        '<i class="fx-flames"></i><i class="fx-vig"></i><i class="fx-scan"></i>';
    } else {
      deco.innerHTML = '';
    }
  }

  function placeRibbon() {
    if (ribbonEl && ribbonEl.isConnected) ribbonEl.remove();
    ribbonEl = null;
    if (mode === 'off') return;
    const active = document.querySelector('.page.active');
    if (!active || mode === 'myth' && document.getElementById('login-screen') && isLoginVisible()) return;

    const target =
      mode === 'ina'
        ? active.querySelector('.perfil-header, .perfil-card, h1, .page-title')
        : active.querySelector('.home-hero, .tareas-header, .info-header, h1, .page-title, .unit-block');

    const text =
      mode === 'ina'
        ? INA.rib
        : [MYTH.gura.rib, MYTH.amelia.rib, MYTH.kiara.rib, MYTH.calliope.rib].join(' · ');

    ribbonEl = document.createElement('div');
    ribbonEl.className = 'page-fx-ribbon';
    ribbonEl.setAttribute('aria-hidden', 'true');
    const s = (text + ' ').repeat(4);
    ribbonEl.innerHTML = `<div>${s}${s}</div>`;

    if (target && target.parentNode) {
      target.parentNode.insertBefore(ribbonEl, target.nextSibling);
    } else if (active) {
      active.prepend(ribbonEl);
    }
  }

  function isLoginVisible() {
    const ls = document.getElementById('login-screen');
    if (!ls) return false;
    if (ls.classList.contains('hidden')) return false;
    const d = getComputedStyle(ls).display;
    return d !== 'none';
  }

  function detectMode() {
    if (isLoginVisible()) return 'myth';
    const active = document.querySelector('.page.active');
    if (!active) return 'myth';
    if (active.id === 'perfil') return 'ina';
    if (['home', 'tareas', 'info', 'informacion'].includes(active.id)) return 'myth';
    return 'off';
  }

  function mk(o) {
    P.push(
      Object.assign(
        {
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          r: 4,
          c: '#fff',
          k: 'dot',
          al: 1,
          life: 1,
          dec: 0,
          ph: R(0, 6.28),
          wf: R(0.01, 0.04),
          sw: 0,
          rot: 0,
          vr: 0,
          gy: 0,
          amb: 0,
          gl: '',
        },
        o
      )
    );
  }

  function amb(init) {
    const x = R(0, w);
    const y0 = init ? R(0, h) : null;

    if (mode === 'ina') {
      const q = Math.random();
      mk({
        amb: 1,
        k: q < 0.35 ? 'glyph' : q < 0.7 ? 'star' : 'bubble',
        gl: K(INA.glyphs),
        x,
        y: y0 ?? h + 20,
        vy: -R(0.25, 0.9),
        r: q < 0.35 ? R(7, 11) : R(2, 6),
        c: K(INA.cols),
        al: R(0.4, 0.9),
        sw: R(0.3, 1),
        vr: R(-0.02, 0.02),
      });
      return;
    }

    // myth mix: cycle talents
    const talents = ['gura', 'amelia', 'kiara', 'calliope'];
    const T = talents[(Math.random() * 4) | 0];
    const cols = MYTH[T].cols;
    if (T === 'gura') {
      mk({ amb: 1, k: 'bubble', x, y: y0 ?? h + 20, vy: -R(0.3, 1.1), r: R(3, 12), c: K(cols), al: R(0.35, 0.8), sw: R(0.3, 0.9) });
    } else if (T === 'amelia') {
      const gl = Math.random() < 0.15;
      mk({ amb: 1, k: gl ? 'glyph' : 'star', gl: K(MYTH.amelia.glyphs), x, y: y0 ?? h + 20, vy: -R(0.12, 0.45), r: gl ? R(6, 9) : R(2, 6), c: K(cols), al: R(0.4, 0.9), sw: 0.3, vr: R(-0.01, 0.01) });
    } else if (T === 'kiara') {
      const f = Math.random() < 0.08;
      mk({ amb: 1, k: f ? 'glyph' : 'ember', gl: '🪶', x, y: y0 ?? h + 20, vy: f ? -R(0.3, 0.7) : -R(0.6, 1.8), r: f ? R(6, 9) : R(1, 4), c: K(cols), al: R(0.5, 1), sw: R(0.4, 1.2) });
    } else {
      const q = Math.random();
      mk({ amb: 1, k: q < 0.55 ? 'petal' : q < 0.95 ? 'star' : 'glyph', gl: '💀', x, y: y0 ?? -20, vy: R(0.5, 1.3), r: q < 0.55 ? R(3, 6) : R(2, 5), c: K(cols), al: R(0.5, 0.9), sw: R(0.5, 1.3), vr: R(-0.03, 0.03) });
    }
  }

  function tr(x, y) {
    if (mode === 'ina') {
      mk({ k: Math.random() < 0.5 ? 'star' : 'bubble', x, y, vx: R(-0.5, 0.5), vy: -R(0.2, 0.8), r: R(2, 5), c: K(INA.cols), al: 0.85, dec: 0.025 });
      return;
    }
    const T = K(['gura', 'amelia', 'kiara', 'calliope']);
    const cols = MYTH[T].cols;
    if (T === 'gura') mk({ k: 'bubble', x, y, vx: R(-0.4, 0.4), vy: -R(0.3, 0.9), r: R(2, 6), c: K(cols), al: 0.8, dec: 0.02 });
    else if (T === 'amelia') mk({ k: 'star', x, y, vx: R(-0.5, 0.5), vy: R(-0.5, 0.5), r: R(2, 5), c: K(cols), dec: 0.03, vr: 0.05 });
    else if (T === 'kiara') mk({ k: 'ember', x, y, vx: R(-0.6, 0.6), vy: -R(0.4, 1.4), r: R(1.5, 3.5), c: K(cols), dec: 0.03 });
    else mk({ k: 'petal', x, y, vx: R(-0.8, 0.8), vy: R(0.2, 1), r: R(2, 4), c: K(cols), dec: 0.025, vr: 0.1 });
  }

  function burst(x, y, n = 16) {
    for (let i = 0; i < n; i++) {
      const t = R(0, 6.283), s = R(1, 4.5);
      const cols = mode === 'ina' ? INA.cols : MYTH[K(['gura', 'amelia', 'kiara', 'calliope'])].cols;
      mk({
        x, y,
        vx: Math.cos(t) * s,
        vy: Math.sin(t) * s,
        k: mode === 'ina' ? (Math.random() < 0.4 ? 'glyph' : 'star') : K(['bubble', 'star', 'ember', 'petal']),
        gl: mode === 'ina' ? K(INA.glyphs) : '',
        r: R(2, 7),
        c: K(cols),
        al: 1,
        dec: R(0.015, 0.035),
        vr: R(-0.15, 0.15),
      });
    }
  }

  function draw(p) {
    const a = p.al * p.life;
    if (a <= 0.02) return;
    g.save();
    g.translate(p.x, p.y);
    g.rotate(p.rot);
    g.globalAlpha = a;
    g.fillStyle = p.c;
    g.strokeStyle = p.c;
    const r = p.r;
    if (p.k === 'bubble') {
      g.beginPath();
      g.arc(0, 0, r, 0, 6.283);
      g.globalAlpha = a * 0.35;
      g.fill();
      g.globalAlpha = a;
      g.lineWidth = 1.2;
      g.stroke();
      g.beginPath();
      g.arc(-r * 0.3, -r * 0.3, r * 0.2, 0, 6.283);
      g.fillStyle = '#fff';
      g.globalAlpha = a * 0.5;
      g.fill();
    } else if (p.k === 'star') {
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 6.283) / 5 - Math.PI / 2;
        const a2 = a1 + 6.283 / 10;
        g.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
        g.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
      }
      g.closePath();
      g.fill();
    } else if (p.k === 'ember') {
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, r);
      grd.addColorStop(0, '#fff3');
      grd.addColorStop(0.4, p.c);
      grd.addColorStop(1, 'transparent');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(0, 0, r * 2, 0, 6.283);
      g.fill();
    } else if (p.k === 'petal') {
      g.beginPath();
      g.ellipse(0, 0, r, r * 0.55, 0, 0, 6.283);
      g.fill();
    } else if (p.k === 'glyph') {
      g.font = r * 2.2 + 'px serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(p.gl || '✨', 0, 0);
    } else {
      g.beginPath();
      g.arc(0, 0, r, 0, 6.283);
      g.fill();
    }
    g.restore();
  }

  function step() {
    if (!g || mode === 'off') {
      requestAnimationFrame(step);
      return;
    }
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.ph += p.wf;
      p.x += p.vx + Math.sin(p.ph) * p.sw;
      p.y += p.vy;
      p.vy += p.gy;
      p.rot += p.vr;
      if (p.dec) p.life -= p.dec;
      const out = p.y < -40 || p.y > h + 40 || p.x < -80 || p.x > w + 80;
      if (p.life <= 0 || out) {
        P.splice(i, 1);
        if (p.amb) amb(0);
        continue;
      }
      draw(p);
    }
    requestAnimationFrame(step);
  }

  function refillAmbient() {
    P.length = 0;
    const n = w < 700 ? 18 : 32;
    for (let i = 0; i < n; i++) amb(1);
  }

  function applyMode(next) {
    const prev = mode;
    mode = next;
    ensureLayers();

    const login = document.getElementById('login-screen');
    if (mode !== 'off' && isLoginVisible() && login) {
      attachTo(login);
    } else {
      attachTo(document.body);
    }

    if (mode === 'off') {
      if (cv) g && g.clearRect(0, 0, w, h);
      if (deco) deco.innerHTML = '';
      if (ribbonEl) { ribbonEl.remove(); ribbonEl = null; }
      P.length = 0;
      return;
    }

    setDeco();
    rs();
    if (prev !== mode || P.length === 0) refillAmbient();
    placeRibbon();
  }

  function sync() {
    applyMode(detectMode());
  }

  // Wrap showPage
  const wrapNav = () => {
    if (typeof window.showPage === 'function' && !window.showPage._pageFx) {
      const orig = window.showPage;
      window.showPage = function (pageId, linkEl) {
        const r = orig.apply(this, arguments);
        setTimeout(sync, 30);
        return r;
      };
      window.showPage._pageFx = true;
    }
    ['hideLoginScreen', 'showLoginScreen', 'enterPortfolio'].forEach((name) => {
      if (typeof window[name] === 'function' && !window[name]._pageFx) {
        const o = window[name];
        window[name] = function () {
          const r = o.apply(this, arguments);
          setTimeout(sync, 40);
          return r;
        };
        window[name]._pageFx = true;
      }
    });
  };

  addEventListener('pointerdown', (e) => {
    if (mode === 'off') return;
    if (e.target.closest('input,textarea,select,button,a')) return;
    burst(e.clientX, e.clientY);
  });
  if (fine) {
    addEventListener('pointermove', (e) => {
      if (mode === 'off') return;
      const n = performance.now();
      if (n - lt > 45) {
        lt = n;
        tr(e.clientX, e.clientY);
      }
    });
  }
  addEventListener('hashchange', () => setTimeout(sync, 40));

  function boot() {
    wrapNav();
    ensureLayers();
    sync();
    requestAnimationFrame(step);
    // re-sync a few times for late login state
    setTimeout(sync, 200);
    setTimeout(sync, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

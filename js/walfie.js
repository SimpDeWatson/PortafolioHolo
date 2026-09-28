/* walfie.js
 * Inicio / Login / Info / Tareas → 5 Myth (Gura, Amelia, Kiara, Calliope, Ina)
 * Semanas → solo el talent de esa semana
 * Perfil → solo Ina
 * Sprites: pose (default) | sunglasses (borde/escalar) | sticker (caer)
 */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const SIZE = 72;
  const SPEED = 1.25;
  const CLIMB = 1.1;

  const CAST = {
    gura: { prefix: 'gura', label: 'Gura' },
    amelia: { prefix: 'watson', label: 'Amelia' },
    watson: { prefix: 'watson', label: 'Amelia' },
    kiara: { prefix: 'kiara', label: 'Kiara' },
    calliope: { prefix: 'calli', label: 'Calliope' },
    calli: { prefix: 'calli', label: 'Calliope' },
    ina: { prefix: 'ina', label: 'Ina' },
  };
  const ALL5 = ['gura', 'amelia', 'kiara', 'calliope', 'ina'];

  function basePath() {
    const inPages = /\/pages\//.test(location.pathname) || /semana\d+\.html/i.test(location.pathname);
    return inPages ? '../img/walfies/' : 'img/walfies/';
  }
  function sprite(prefix, name) {
    return basePath() + prefix + '_' + name + '.png';
  }
  function isLoginVisible() {
    const ls = document.getElementById('login-screen');
    if (!ls || ls.classList.contains('hidden')) return false;
    return getComputedStyle(ls).display !== 'none';
  }

  function detectTalents() {
    // Sin walfies en páginas de semana
    const inWeek = /semana\d+\.html/i.test(location.pathname) || !!document.body.dataset.talent;
    if (inWeek && !document.querySelector('.page.active')) return [];

    if (isLoginVisible()) return ALL5.slice();

    const active = document.querySelector('.page.active');
    if (!active) return ALL5.slice();
    if (active.id === 'perfil') return ['ina'];
    if (['home', 'tareas', 'info', 'informacion'].includes(active.id)) return ALL5.slice();
    return [];
  }

  const layer = document.createElement('div');
  layer.id = 'walfie-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.documentElement.appendChild(layer);

  const agents = [];
  let ctxKey = '';
  let host = document.body;

  function attachHost() {
    const login = document.getElementById('login-screen');
    if (isLoginVisible() && login) {
      if (layer.parentNode !== login) login.appendChild(layer);
      host = login;
      layer.classList.add('on-login');
    } else {
      if (layer.parentNode !== document.body) document.body.appendChild(layer);
      host = document.body;
      layer.classList.remove('on-login');
    }
  }

  function bounds() {
    if (host === document.body) {
      return {
        maxX: Math.max(0, innerWidth - SIZE),
        maxY: Math.max(0, innerHeight - SIZE),
        w: innerWidth,
        h: innerHeight,
      };
    }
    const r = host.getBoundingClientRect();
    return {
      maxX: Math.max(0, r.width - SIZE),
      maxY: Math.max(0, r.height - SIZE),
      w: r.width,
      h: r.height,
    };
  }

  function makeAgent(talent, idx, total) {
    const meta = CAST[talent] || CAST.gura;
    const el = document.createElement('div');
    el.className = 'walfie-agent wf-walk';
    el.title = meta.label;
    el.innerHTML = `
      <img class="wf-img wf-pose" alt="${meta.label}" draggable="false" />
      <img class="wf-img wf-sun" alt="" draggable="false" />
      <img class="wf-img wf-stick" alt="" draggable="false" />
    `;
    const pose = el.querySelector('.wf-pose');
    const sun = el.querySelector('.wf-sun');
    const stick = el.querySelector('.wf-stick');
    pose.src = sprite(meta.prefix, 'pose');
    sun.src = sprite(meta.prefix, 'sunglasses');
    stick.src = sprite(meta.prefix, 'sticker');
    pose.onerror = () => { pose.src = sprite(meta.prefix, 'sticker'); };
    sun.onerror = () => { sun.src = sprite(meta.prefix, 'pose'); };
    layer.appendChild(el);

    const b = bounds();
    const spacing = b.w / (total + 1);
    let x = spacing * (idx + 1) - SIZE / 2 + (Math.random() * 30 - 15);
    let y = b.maxY;
    let dir = Math.random() < 0.5 ? 1 : -1;
    let state = 'walk';
    let climbSide = 0;
    let hangTimer = 0;
    let dragging = false;
    let dragOffX = 0, dragOffY = 0;

    function setVisual() {
      el.classList.remove('wf-walk', 'wf-climb', 'wf-hang', 'wf-drop', 'wf-drag');
      el.classList.add('wf-' + (state === 'drag' ? 'drag' : state));
    }

    function applyT() {
      const face = state === 'climb' ? (climbSide < 0 ? 1 : -1) : dir < 0 ? -1 : 1;
      el.style.transform = `translate(${x}px,${y}px) scaleX(${face})`;
    }

    function onDown(e) {
      if (e.button != null && e.button !== 0) return;
      dragging = true;
      state = 'drag';
      setVisual();
      const pt = e.touches ? e.touches[0] : e;
      const rect = host === document.body ? { left: 0, top: 0 } : host.getBoundingClientRect();
      dragOffX = pt.clientX - rect.left - x;
      dragOffY = pt.clientY - rect.top - y;
      e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      const pt = e.touches ? e.touches[0] : e;
      const rect = host === document.body ? { left: 0, top: 0 } : host.getBoundingClientRect();
      const b2 = bounds();
      x = Math.max(0, Math.min(b2.maxX, pt.clientX - rect.left - dragOffX));
      y = Math.max(0, Math.min(b2.maxY, pt.clientY - rect.top - dragOffY));
      applyT();
      e.preventDefault();
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      const b2 = bounds();
      if (y < 14) {
        y = 0; state = 'hang'; hangTimer = 80 + ((Math.random() * 100) | 0);
      } else if (x <= 2) {
        x = 0; climbSide = -1; state = 'climb';
      } else if (x >= b2.maxX - 2) {
        x = b2.maxX; climbSide = 1; state = 'climb';
      } else if (y < b2.maxY - 10) {
        state = 'drop';
      } else {
        y = b2.maxY; state = 'walk';
      }
      setVisual();
      applyT();
    }

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    setVisual();
    applyT();

    return {
      tick() {
        if (dragging) return;
        const b2 = bounds();

        if (state === 'walk') {
          x += dir * SPEED;
          y = b2.maxY;
          if (x <= 0) { x = 0; climbSide = -1; state = 'climb'; setVisual(); }
          else if (x >= b2.maxX) { x = b2.maxX; climbSide = 1; state = 'climb'; setVisual(); }
          if (Math.random() < 0.0015) dir *= -1;
        } else if (state === 'climb') {
          y -= CLIMB;
          x = climbSide < 0 ? 0 : b2.maxX;
          if (y <= 0) {
            y = 0; state = 'hang'; hangTimer = 70 + ((Math.random() * 110) | 0); setVisual();
          }
        } else if (state === 'hang') {
          y = 0;
          x += dir * SPEED * 0.6;
          if (x <= 0) { x = 0; dir = 1; }
          if (x >= b2.maxX) { x = b2.maxX; dir = -1; }
          hangTimer--;
          if (hangTimer <= 0) { state = 'drop'; setVisual(); }
        } else if (state === 'drop') {
          y += CLIMB * 1.5 + 1;
          if (y >= b2.maxY) {
            y = b2.maxY;
            dir = Math.random() < 0.5 ? 1 : -1;
            state = 'walk';
            setVisual();
          }
        }
        x = Math.max(0, Math.min(b2.maxX, x));
        y = Math.max(0, Math.min(b2.maxY, y));
        applyT();
      },
      el,
    };
  }

  function clearAgents() {
    agents.splice(0).forEach((a) => a.el.remove());
    layer.innerHTML = '';
  }

  function rebuild() {
    const talents = detectTalents();
    const key = (isLoginVisible() ? 'login' : (document.querySelector('.page.active') || {}).id || 'week') + ':' + talents.join(',');
    if (key === ctxKey && agents.length) {
      attachHost();
      return;
    }
    ctxKey = key;
    clearAgents();
    attachHost();
    if (!talents.length) return;
    talents.forEach((t, i) => agents.push(makeAgent(t, i, talents.length)));
  }

  function loop() {
    agents.forEach((a) => a.tick());
    requestAnimationFrame(loop);
  }

  function wrapNav() {
    ['showPage', 'hideLoginScreen', 'showLoginScreen', 'enterPortfolio'].forEach((n) => {
      if (typeof window[n] === 'function' && !window[n]._walfieMyth) {
        const o = window[n];
        window[n] = function () {
          const r = o.apply(this, arguments);
          setTimeout(rebuild, 40);
          return r;
        };
        window[n]._walfieMyth = true;
      }
    });
  }

  addEventListener('hashchange', () => setTimeout(rebuild, 40));
  addEventListener('resize', () => setTimeout(rebuild, 80));

  function boot() {
    wrapNav();
    rebuild();
    requestAnimationFrame(loop);
    setTimeout(rebuild, 300);
    setTimeout(rebuild, 800);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

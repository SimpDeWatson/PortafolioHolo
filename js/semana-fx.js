/* semana-fx.js — efectos Hololive por talent (Gura, Amelia, Kiara, Calliope)
   Lee body[data-talent] y body[data-week]; los colores salen de las variables --w-* */
(() => {
  const b = document.body, T = b.dataset.talent || 'gura', W = +b.dataset.week || 1, V = (W - 1) % 4;
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const fine = matchMedia('(pointer:fine)').matches, cs = getComputedStyle(b), v = n => cs.getPropertyValue(n).trim();
  const A = v('--w-accent'), A2 = v('--w-accent2');
  const R = (a, z) => a + Math.random() * (z - a), K = a => a[Math.random() * a.length | 0];
  const COL = { gura: [A, A2, '#b3e5fc'], amelia: [A, A2, '#fff3c4'], kiara: [A, A2, '#ffe082'], calliope: [A, A2, '#ff80ab'] }[T];
  const RIB = { gura: '🦈 🫧 🔱 🌊 🐟 🐚', amelia: '⏰ 🔍 ⌛ ⚙️ 🕵️‍♀️ 📜', kiara: '🔥 🪶 🐔 ☀️ 🎤 ✨', calliope: '💀 🌹 ⚰️ 🎤 🌙 🖤' }[T].split(' ');

  /* ---- capas decorativas ---- */
  const gear = (n, a, z) => {
    let p = '';
    for (let i = 0; i < n * 4; i++) { const t = i / (n * 4) * 6.2832, r = i % 4 < 2 ? z : a; p += (i ? 'L' : 'M') + (r * Math.cos(t)).toFixed(1) + ' ' + (r * Math.sin(t)).toFixed(1); }
    return `<svg viewBox="-100 -100 200 200"><path fill-rule="evenodd" d="${p}ZM-30 0a30 30 0 1 0 60 0a30 30 0 1 0-60 0Z"/></svg>`;
  };
  const WV = '<svg class="fx-waves %c" viewBox="0 0 1440 120" preserveAspectRatio="none"><path d="M0 60Q90 10 180 60T360 60T540 60T720 60T900 60T1080 60T1260 60T1440 60V120H0Z"/></svg>';
  const DECO = {
    gura: '<i class="fx-rays"></i>' + WV.replace('%c', 'w1') + WV.replace('%c', 'w2'),
    amelia: `<div class="fx-gear g1">${gear(12, 78, 96)}</div><div class="fx-gear g2">${gear(9, 78, 96)}</div>`,
    kiara: '<i class="fx-flames"></i>',
    calliope: '<i class="fx-vig"></i><i class="fx-scan"></i>'
  }[T];
  const d = document.createElement('div'); d.className = 'fx-deco'; d.innerHTML = DECO; b.prepend(d);

  const sb = document.createElement('div'); sb.className = 'fx-scroll'; b.prepend(sb);
  addEventListener('scroll', () => { sb.style.width = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight) * 100 + '%'; }, { passive: true });

  const hd = document.querySelector('.semana-header');
  if (hd) { const r = document.createElement('div'), s = RIB.map(e => `<span>${e}</span>`).join(''); r.className = 'fx-ribbon'; r.innerHTML = `<div>${s + s + s + s}</div>`; hd.after(r); }

  /* ---- canvas de partículas ---- */
  const cv = document.createElement('canvas'); cv.className = 'fx-canvas'; b.append(cv);
  const g = cv.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2); let w, h;
  const rs = () => { w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  addEventListener('resize', rs); rs();

  const P = [], DENS = [1, 1.35, 1.15, 1.7][V], N = Math.round((w < 700 ? 16 : 34) * DENS);
  const mk = o => P.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, r: 4, c: COL[0], k: 'dot', al: 1, life: 1, dec: 0, ph: R(0, 6.28), wf: R(.01, .04), sw: 0, rot: 0, vr: 0, gy: 0, fr: 0 }, o));

  const amb = init => {
    const x = R(0, w), c = K(COL), y0 = init ? R(0, h) : null;
    if (T === 'gura') mk({ amb: 1, k: 'bubble', x, y: y0 ?? h + 20, vy: -R(.3, 1.1), r: R(3, 13), c, al: R(.35, .8), sw: R(.3, .9) });
    else if (T === 'amelia') { const gl = Math.random() < .12; mk({ amb: 1, k: gl ? 'glyph' : 'star', gl: K(['⏳', '⚙️', '⏰']), x, y: y0 ?? h + 20, vy: -R(.12, .45), r: gl ? R(6, 9) : R(2, 6), c, al: R(.4, .9), sw: .3, vr: R(-.01, .01), tw: 1 }); }
    else if (T === 'kiara') { const f = Math.random() < .05; mk({ amb: 1, k: f ? 'glyph' : 'ember', gl: '🪶', x, y: y0 ?? h + 20, vy: f ? -R(.3, .7) : -R(.6, 1.8), r: f ? R(6, 9) : R(1, 4), c, al: R(.5, 1), sw: R(.4, 1.2), vr: R(-.02, .02), tw: 1 }); }
    else { const q = Math.random(); mk({ amb: 1, k: q < .55 ? 'petal' : q < .97 ? 'star' : 'glyph', gl: '💀', x, y: y0 ?? -20, vy: R(.5, 1.3), r: q < .55 ? R(3, 6) : q < .97 ? R(2, 5) : R(6, 8), c, al: R(.5, .9), sw: R(.5, 1.3), vr: R(-.03, .03), tw: 1 }); }
  };
  for (let i = 0; i < N; i++) amb(1);

  /* estela del cursor / de objetos especiales */
  const tr = (x, y) => {
    if (T === 'gura') mk({ k: 'bubble', x, y, vx: R(-.4, .4), vy: -R(.3, .9), r: R(2, 6), c: K(COL), al: .8, dec: .02 });
    else if (T === 'amelia') mk({ k: 'star', x, y, vx: R(-.5, .5), vy: R(-.5, .5), r: R(2, 5), c: K(COL), dec: .03, vr: .05 });
    else if (T === 'kiara') mk({ k: 'ember', x, y, vx: R(-.6, .6), vy: -R(.4, 1.4), r: R(1.5, 3.5), c: K(COL), dec: .03 });
    else mk({ k: 'petal', x, y, vx: R(-.8, .8), vy: R(.2, 1), r: R(2, 4), c: K(COL), dec: .025, vr: .1 });
  };

  /* explosión al hacer clic */
  const burst = (x, y, n = 18) => {
    for (let i = 0; i < n; i++) {
      const t = R(0, 6.283), s = R(1, 5);
      mk(Object.assign({ x, y, vx: Math.cos(t) * s, vy: Math.sin(t) * s, c: K(COL), dec: R(.015, .03), vr: R(-.2, .2) },
        { gura: { k: 'bubble', r: R(3, 9), al: .8, gy: -.04 }, amelia: { k: 'star', r: R(2, 6) }, kiara: { k: 'ember', r: R(1.5, 4), gy: -.05 }, calliope: { k: 'petal', r: R(3, 6), gy: .05 } }[T]));
    }
    if (T === 'amelia') mk({ k: 'ring', x, y, r: 6, gr: 3, c: A, dec: .03 });
    if (T === 'calliope') mk({ k: 'slash', x, y, len: R(120, 220), rot: R(-.9, -.3), c: A, dec: .05 });
  };

  /* evento especial periódico por talent */
  const ev = () => {
    if (T === 'gura') mk({ k: 'glyph', gl: '🦈', x: w + 60, y: R(h * .55, h * .85), vx: -1.7, r: 15, al: .55, keep: 1, trail: 1, ph: 0, wf: 0 });
    else if (T === 'amelia') mk({ k: 'star', x: R(0, w * .6), y: -20, vx: 6, vy: 3.2, r: 5, c: A2, keep: 1, trail: 1 });
    else if (T === 'kiara') for (let i = 0; i < 36; i++) mk({ k: 'ember', x: R(0, w), y: h + 10, vy: -R(3, 7), vx: R(-.6, .6), r: R(1.5, 4), c: K(COL), dec: .012 });
    else {
      mk({ k: 'slash', x: w / 2, y: R(h * .25, h * .6), len: w * .9, rot: -.35, c: A, dec: .02 });
      for (let i = 0; i < 24; i++) mk({ k: 'petal', x: R(0, w), y: -10, vx: R(-1, 1), vy: R(1, 3), r: R(3, 6), c: K(COL), dec: .006, vr: R(-.1, .1) });
    }
  };
  const sched = () => setTimeout(() => { if (!document.hidden) ev(); sched(); }, R(11000, 20000) / (V > 1 ? 1.6 : 1));
  setTimeout(ev, 2500); sched();

  /* ---- dibujo ---- */
  const draw = p => {
    const a = Math.max(0, p.al * p.life * (p.tw ? .65 + .35 * Math.sin(p.ph * 3) : 1)); if (a < .01) return;
    const r = p.r;
    g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = a; g.fillStyle = g.strokeStyle = p.c;
    if (p.k === 'bubble') {
      g.lineWidth = 1.3; g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.stroke();
      g.globalAlpha = a * .15; g.fill();
      g.globalAlpha = a; g.fillStyle = '#fff'; g.beginPath(); g.arc(-r * .35, -r * .35, r * .2, 0, 6.283); g.fill();
    } else if (p.k === 'star') {
      g.beginPath(); for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4, q = i % 2 ? r * .35 : r * 1.6; g.lineTo(q * Math.cos(t), q * Math.sin(t)); } g.closePath(); g.fill();
    } else if (p.k === 'ember') {
      g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.fill();
      g.globalAlpha = a * .25; g.beginPath(); g.arc(0, 0, r * 2.8, 0, 6.283); g.fill();
    } else if (p.k === 'petal') {
      g.beginPath(); g.ellipse(0, 0, r * 1.7, r * .85, 0, 0, 6.283); g.fill();
    } else if (p.k === 'glyph') {
      g.globalCompositeOperation = 'source-over'; g.font = r * 2.4 + 'px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.gl, 0, 0);
    } else if (p.k === 'ring') {
      g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.stroke();
    } else if (p.k === 'slash') {
      g.lineCap = 'round'; g.lineWidth = 10 * p.life; g.globalAlpha = a * .3;
      g.beginPath(); g.moveTo(-p.len / 2, 0); g.lineTo(p.len / 2, 0); g.stroke();
      g.lineWidth = 2; g.strokeStyle = '#fff'; g.globalAlpha = a;
      g.beginPath(); g.moveTo(-p.len / 2, 0); g.lineTo(p.len / 2, 0); g.stroke();
    }
    g.restore();
  };

  const step = () => {
    g.clearRect(0, 0, w, h); g.globalCompositeOperation = 'lighter';
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.ph += p.wf; p.x += p.vx + Math.sin(p.ph) * p.sw; p.y += p.vy; p.vy += p.gy; p.rot += p.vr;
      if (p.dec) p.life -= p.dec;
      if (p.gr) p.r += p.gr;
      if (p.trail && ++p.fr % 4 === 0) tr(p.x, p.y);
      const out = p.keep ? (p.x > w + 140 || p.x < -140 || p.y > h + 140) : (p.y < -40 || p.y > h + 40 || p.x < -80 || p.x > w + 80);
      if (p.life <= 0 || out) { P.splice(i, 1); if (p.amb) amb(0); continue; }
      draw(p);
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);

  /* ---- interacción ---- */
  let lens = null, lt = 0;
  if (T === 'amelia' && fine) { lens = document.createElement('div'); lens.className = 'fx-lens'; b.append(lens); document.documentElement.addEventListener('pointerleave', () => { lens.style.opacity = 0; }); }
  addEventListener('pointerdown', e => { if (!e.target.closest('input,textarea,select')) burst(e.clientX, e.clientY); });
  if (fine) addEventListener('pointermove', e => {
    const n = performance.now();
    if (n - lt > (V ? 35 : 55)) { lt = n; tr(e.clientX, e.clientY); }
    if (lens) { lens.style.transform = `translate(${e.clientX - 75}px,${e.clientY - 75}px)`; lens.style.opacity = 1; }
  });
})();

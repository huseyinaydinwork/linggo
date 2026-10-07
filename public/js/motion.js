// Hareket kiti — tek bir dil: yay fiziği (spring), dokununca esneyen yüzeyler, anlamlı geri bildirim.
// Kural: hareket bir şeyi anlatmalı (nereden nereye gitti, ne oldu). Sürekli dönen süs yok.
import { sfx } from './audio.js';

export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- spring integrator
export function spring({ from = 0, to = 1, stiffness = 260, damping = 20, mass = 1, velocity = 0, onUpdate, onDone }) {
  let x = from, v = velocity, last = performance.now(), raf;
  const step = now => {
    const dt = Math.min(0.032, (now - last) / 1000); last = now;
    const f = -stiffness * (x - to) - damping * v;
    v += (f / mass) * dt; x += v * dt;
    onUpdate(x, v);
    if (Math.abs(v) < 0.02 && Math.abs(x - to) < 0.002) { onUpdate(to, 0); onDone?.(); return; }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

// ---------- draggable toy: drag Pip anywhere, release → springs home with a squash
export function toy(box) {
  const el = box.querySelector('.pip') || box;
  if (!el || reduced()) return () => { };
  el.style.touchAction = 'none'; el.style.cursor = 'grab';
  let sx = 0, sy = 0, dx = 0, dy = 0, dragging = false, stop = null, moved = 0;
  const render = (x, y, s = 1) => { el.style.transform = `translate(${x}px, ${y}px) rotate(${x * 0.08}deg) scale(${s}, ${2 - s})`; };
  const down = e => { dragging = true; moved = 0; stop?.(); el.setPointerCapture?.(e.pointerId); sx = e.clientX - dx; sy = e.clientY - dy; el.style.cursor = 'grabbing'; render(dx, dy, 1.05); };
  const move = e => {
    if (!dragging) return;
    dx = e.clientX - sx; dy = e.clientY - sy;
    const dist = Math.hypot(dx, dy);
    render(dx, dy, 1 + Math.min(0.1, dist / 900));
    if (Math.abs(dist - moved) > 40) { moved = dist; sfx.select((dist / 40) | 0); }
  };
  const up = () => {
    if (!dragging) return; dragging = false; el.style.cursor = 'grab';
    if (Math.hypot(dx, dy) > 30) sfx.pop();
    const x0 = dx, y0 = dy;
    stop = spring({ from: 1, to: 0, stiffness: 240, damping: 13, onUpdate: k => { dx = x0 * k; dy = y0 * k; render(dx, dy, 1 + Math.sin(k * 9) * 0.04 * k); }, onDone: () => { dx = dy = 0; el.style.transform = ''; } });
  };
  el.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  return () => { stop?.(); el.removeEventListener('pointerdown', down); removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
}

// ---------- press feedback: surfaces dip under the finger and spring back
const PRESS = '.squish, .btn, .opt, .chip, .unit, .theme, .card.tap, .wtile, .choice, .mk-item, .ipa-tile, .quest';
export function installSquish() {
  if (reduced()) return;
  addEventListener('pointerdown', e => {
    const t = e.target.closest(PRESS);
    if (!t || t.disabled || t.classList.contains('right') || t.classList.contains('wrong')) return;
    t._stop?.();
    t.style.transition = 'transform .12s cubic-bezier(.3,.7,.4,1)';
    t.style.transform = 'scale(.965)';
    const release = () => {
      removeEventListener('pointerup', release); removeEventListener('pointercancel', release);
      t.style.transition = 'none';
      t._stop = spring({ from: 0.965, to: 1, stiffness: 520, damping: 16, onUpdate: v => { t.style.transform = `scale(${v})`; }, onDone: () => { t.style.transform = ''; t.style.transition = ''; t._stop = null; } });
    };
    addEventListener('pointerup', release); addEventListener('pointercancel', release);
  }, { passive: true });
}

// ---------- pointer tilt for sticker-like cards (desktop only)
export function installTilt() {
  if (reduced() || matchMedia('(pointer: coarse)').matches) return;
  addEventListener('pointermove', e => {
    const t = e.target.closest('.tilt'); if (!t) return;
    const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    t.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    t.onpointerleave = () => { t.style.transform = ''; };
  }, { passive: true });
}

// ---------- ring pulse from an element (sonar)
export function pulse(el, color = 'var(--lime)') {
  if (!el || reduced()) return;
  const r = document.createElement('span');
  r.className = 'sonar'; r.style.setProperty('--c', color);
  el.appendChild(r); setTimeout(() => r.remove(), 900);
}

// ---------- a value travels: "+5" flies from where it was earned to where it is counted
export function flyNumber(fromEl, toEl, text, onArrive) {
  if (!fromEl || !toEl || reduced()) { onArrive?.(); return; }
  const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
  const n = document.createElement('div'); n.className = 'fly-num'; n.textContent = text;
  document.body.appendChild(n);
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
  const t0 = performance.now(), dur = 620;
  const step = t => {
    const k = Math.min(1, (t - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const x = x0 + (x1 - x0) * e, y = y0 + (y1 - y0) * e - Math.sin(k * Math.PI) * 70;
    n.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${1 + Math.sin(k * Math.PI) * 0.35 - k * 0.3})`;
    n.style.opacity = k > 0.9 ? String((1 - k) * 10) : '1';
    if (k < 1) requestAnimationFrame(step); else { n.remove(); onArrive?.(); }
  };
  requestAnimationFrame(step);
}

// ---------- particle burst (DOM, light): leaves/sparks spray out of an element
export function burst(el, { n = 14, colors = ['#D4F65A', '#FF6B45', '#7C6CFF', '#72C4FF', '#FFD166'], spread = 1, shapes = ['dot', 'dot', 'star', 'leaf'] } = {}) {
  if (!el || reduced()) return;
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'fx-pt fx-pt-' + shapes[i % shapes.length];
    p.style.setProperty('--c', colors[i % colors.length]);
    const ang = (i / n) * Math.PI * 2 + Math.random() * 0.5, dist = (60 + Math.random() * 70) * spread;
    p.style.left = cx + 'px'; p.style.top = cy + 'px';
    p.style.setProperty('--dx', Math.cos(ang) * dist + 'px'); p.style.setProperty('--dy', Math.sin(ang) * dist - 30 + 'px');
    p.style.setProperty('--r', (Math.random() * 540 - 270) + 'deg');
    p.style.animationDelay = Math.random() * 60 + 'ms';
    document.body.appendChild(p); setTimeout(() => p.remove(), 1100);
  }
}

// ---------- number ticker with a little overshoot
export function tickTo(el, to, { from = 0, ms = 900 } = {}) {
  if (!el) return;
  if (reduced()) { el.textContent = to; return; }
  const t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

// ---------- bell swing (one-shot, on tap)
export function swing(el) {
  if (!el || reduced()) return;
  el.classList.remove('swing'); void el.offsetWidth; el.classList.add('swing');
  el.addEventListener('animationend', () => el.classList.remove('swing'), { once: true });
}

// ---------- switches & segmented controls react to state changes
function animateSwitch(sw, on) {
  sw._stop?.();
  const from = parseFloat(sw.style.getPropertyValue('--k')) || (on ? 0 : 1);
  on ? sfx.select(3) : sfx.select(0);
  sw._stop = spring({
    from, to: on ? 1 : 0, stiffness: 420, damping: 24,
    onUpdate: (k, v) => { sw.style.setProperty('--k', k.toFixed(3)); sw.style.setProperty('--st', Math.min(1, Math.abs(v) / 14).toFixed(3)); },
    onDone: () => { sw.style.removeProperty('--k'); sw.style.removeProperty('--st'); sw._stop = null; }
  });
}
function syncSeg(seg, animate) {
  const on = seg.querySelector(':scope > button.on');
  let pill = seg.querySelector(':scope > .seg-pill');
  if (!on) { if (pill) pill.style.opacity = '0'; return; }
  if (!pill) { pill = document.createElement('i'); pill.className = 'seg-pill'; pill.setAttribute('aria-hidden', 'true'); seg.prepend(pill); seg.classList.add('has-pill'); animate = false; }
  const x1 = on.offsetLeft, w1 = on.offsetWidth, st = seg._seg;
  if (st && st.x === x1 && st.w === w1 && pill.style.opacity === '1') return;
  const place = (x, w) => { pill.style.width = w + 'px'; pill.style.transform = `translateX(${x}px)`; };
  pill.style.opacity = '1';
  seg._stop?.();
  seg._seg = { x: x1, w: w1 };
  if (!animate || !st || reduced()) { place(x1, w1); return; }
  const x0 = st.x, w0 = st.w;
  sfx.select([...seg.querySelectorAll(':scope > button')].indexOf(on));
  // keep the chosen tab in view on scrollable segs
  if (seg.scrollWidth > seg.clientWidth) seg.scrollTo({ left: x1 - seg.clientWidth / 2 + w1 / 2, behavior: 'smooth' });
  seg._stop = spring({ from: 0, to: 1, stiffness: 380, damping: 28, onUpdate: k => place(x0 + (x1 - x0) * k, w0 + (w1 - w0) * k), onDone: () => { place(x1, w1); seg._stop = null; } });
}

export function installLiveMotion() {
  const SEG = '.seg, .accent-toggle';
  let queued = false, animateNext = false;
  const flush = () => { queued = false; const a = animateNext; animateNext = false; document.querySelectorAll(SEG).forEach(s => syncSeg(s, a)); };
  const schedule = anim => { animateNext ||= anim; if (!queued) { queued = true; requestAnimationFrame(flush); } };
  new MutationObserver(recs => {
    for (const r of recs) {
      const t = r.target;
      if (r.type === 'attributes') {
        if (t.classList?.contains('switch')) {
          const was = /(^|\s)on(\s|$)/.test(r.oldValue || ''), is = t.classList.contains('on');
          if (was !== is && !reduced()) animateSwitch(t, is);
        } else if (t.parentElement?.matches?.(SEG)) schedule(true);
      } else if (r.addedNodes.length) schedule(false);
    }
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  addEventListener('resize', () => document.querySelectorAll(SEG).forEach(s => { s._seg = null; syncSeg(s, false); }));
  addEventListener('pointerdown', e => {
    const b = e.target.closest('.pill.fire, .pill.coin');
    if (b) { swing(b.querySelector('svg') || b); sfx.coin(); }
  }, { passive: true });
}

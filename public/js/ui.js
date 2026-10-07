// Arayüz yardımcıları: ikonlar, toast, alt sayfa (sheet), konfeti, ses efektleri, haptik
import { sfx as _sfx } from './audio.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const sample = (a, n) => shuffle(a).slice(0, n);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const I = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const icon = {
  home: I('<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  words: I('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 13h6"/>'),
  quote: I('<path d="M7 17c-2 0-3-1.5-3-3.5C4 10 6 7 9 6"/><path d="M16 17c-2 0-3-1.5-3-3.5C13 10 15 7 18 6"/>'),
  wave: I('<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2"/>'),
  chart: I('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  back: I('<path d="M15 5l-7 7 7 7"/>'),
  play: I('<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>'),
  pause: I('<path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" stroke="none"/>'),
  mic: I('<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  speaker: I('<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  snail: I('<path d="M3 18h13a4 4 0 0 0 4-4V9"/><circle cx="11" cy="12" r="5"/><path d="M11 12a1.8 1.8 0 1 0 0-.01M20 9l1-3M20 9l-2-2.5"/>'),
  check: I('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  x: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  settings: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  flame: I('<path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 2 1.3 3 2.5 3-1-3 0-6 0-9z" fill="currentColor" stroke="none"/>'),
  bolt: I('<path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none"/>'),
  snow: I('<path d="M12 2v20M4.9 7l14.2 10M4.9 17 19.1 7M9 4l3 2 3-2M9 20l3-2 3 2"/>'),
  book: I('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>'),
  sparkle: I('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor" stroke="none"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill="currentColor" stroke="none"/>'),
  refresh: I('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'),
  target: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'),
  brain: I('<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4z"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  lock: I('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  film: I('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M10 9l5 3-5 3z" fill="currentColor"/>'),
  ear: I('<path d="M7 9a5 5 0 1 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0"/><path d="M10 9a2 2 0 1 1 4 0"/>'),
  chevron: I('<path d="M9 5l7 7-7 7"/>'),
  gift: I('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 3 8 4s-.5 4 4 4zM12 8s1.5-5 4-4 .5 4-4 4z"/>'),
  trophy: I('<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 21h8M9 17h6v4H9z"/>'),
  leaf: I('<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z"/><path d="M5 19 14 10"/>'),
  moon: I('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'),
};

// ---------- brand: app-icon face + wordmark
const LOGO_V = {"dark":{"bg":"#0B160E","ink":"#F4F1E6","pupil":"#F4F1E6","smile":"#C8F53C","star":"#C8F53C"},"cream":{"bg":"#F4F1E6","ink":"#0B160E","pupil":"#0B160E","smile":"#7DBA1E","star":"#7DBA1E"},"lime":{"bg":"#C8F53C","ink":"#0B160E","pupil":"#0B160E","smile":"#0B160E","star":"#0B160E"}};
const logoSvg = ({ bg, ink, pupil, smile, star, rx = 116 }) => `<rect width="512" height="512" rx="${rx}" fill="${bg}"/><g transform="translate(40 34) scale(.86)">` + `<circle cx="178" cy="236" r="68" fill="none" stroke="${ink}" stroke-width="46"/>` + `<circle cx="330" cy="236" r="68" fill="none" stroke="${ink}" stroke-width="46"/>` + `<path d="M398 226 V300" stroke="${ink}" stroke-width="46" stroke-linecap="round"/>` + `<path d="M398 300 C398 380 332 408 262 404 C212 401 172 384 146 352" fill="none" stroke="${smile}" stroke-width="42" stroke-linecap="round"/>` + `<circle cx="192" cy="224" r="17" fill="${pupil}"/><circle cx="344" cy="224" r="17" fill="${pupil}"/>` + `<path d="M428 58 C434 96 444 106 482 112 C444 118 434 128 428 166 C422 128 412 118 374 112 C412 106 422 96 428 58Z" fill="${star}"/></g>`;
// variant: 'dark' (default) | 'cream' | 'lime'
export const logoFace = (s = 26, v = 'dark') => `<svg class="logo-face" width="${s}" height="${s}" viewBox="0 0 512 512" aria-hidden="true">${logoSvg(LOGO_V[v] || LOGO_V.dark)}</svg>`;
export const brandMark = (s = 28) => `${logoFace(s)}<span class="wm">Linggo<i aria-hidden="true">✦</i></span>`;

// ---------- haptics & sound effects live in audio.js
export { sfx, haptic } from './audio.js';

// ---------- toast
export function toast(msg, { icon: ic = '', ms = 2400 } = {}) {
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = 'toast'; el.innerHTML = `${ic ? `<span class="toast-ic">${ic}</span>` : ''}<span>${msg}</span>`;
  root.appendChild(el); _sfx.toast();
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 400); }, ms);
}

// ---------- bottom sheet
export function sheet(html, { onMount, className = '' } = {}) {
  const root = $('#sheet-root');
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-backdrop" data-close></div><div class="sheet ${className}" role="dialog" aria-modal="true"><div class="sheet-grip"></div>${html}</div>`;
  root.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('in'));
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    wrap.classList.remove('in'); document.removeEventListener('keydown', onKey);
    setTimeout(() => wrap.remove(), 350);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  wrap.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  // swipe down to dismiss
  const sh = $('.sheet', wrap); let y0 = null;
  sh.addEventListener('touchstart', e => { if (sh.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
  sh.addEventListener('touchmove', e => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
  sh.addEventListener('touchend', e => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; y0 = null; sh.style.transform = ''; if (dy > 110) close(); });
  onMount?.(sh, close);
  return close;
}

export function confirmSheet({ title, text, ok = 'Evet', cancel = 'Vazgeç', danger = false }) {
  return new Promise(res => {
    let answered = false;
    const close = sheet(`<div class="sheet-body center">
      <h3 class="h3">${title}</h3>${text ? `<p class="muted">${text}</p>` : ''}
      <div class="stack gap-s mt">
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-block" data-ok>${ok}</button>
        <button class="btn btn-ghost btn-block" data-cancel>${cancel}</button>
      </div></div>`, {
      onMount: (el, cl) => {
        el.querySelector('[data-ok]').onclick = () => { answered = true; res(true); cl(); };
        el.querySelector('[data-cancel]').onclick = () => { answered = true; res(false); cl(); };
      }
    });
    // resolve false if dismissed another way
    const iv = setInterval(() => { if (!document.querySelector('.sheet-wrap')) { clearInterval(iv); if (!answered) res(false); } }, 300);
    void close;
  });
}

// ---------- progress ring
export function ring(pct, { size = 120, stroke = 12, color = 'var(--lime)', track = 'var(--track)', label = '' } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - clamp(pct, 0, 1));
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(label)}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${track}" stroke-width="${stroke}" fill="none"/>
    <circle class="ring-bar" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${color}" stroke-width="${stroke}" fill="none" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${off}" style="--c:${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  </svg>`;
}

// ---------- confetti
export function confetti(n = 140) {
  const cv = $('#confetti'); if (!cv) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = cv.getContext('2d'); const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cv.style.display = 'block';
  const cols = ['#D7F75B', '#FF6A3D', '#8B7BFF', '#7CC8FF', '#FFB4D0', '#FFD166', '#141414'];
  const P = Array.from({ length: n }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 80, y: innerHeight * 0.35,
    vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, g: 0.35 + Math.random() * 0.1,
    w: 6 + Math.random() * 8, h: 4 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * 0.4,
    c: cols[(Math.random() * cols.length) | 0], shape: Math.random() < 0.3 ? 'c' : 'r'
  }));
  let f = 0;
  (function loop() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of P) {
      p.vy += p.g; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      if (p.shape === 'c') { ctx.beginPath(); ctx.arc(0, 0, p.w / 2.4, 0, 7); ctx.fill(); } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (++f < 170) requestAnimationFrame(loop); else { ctx.clearRect(0, 0, cv.width, cv.height); cv.style.display = 'none'; }
  })();
}

// Count-up animation for numbers
export function countUp(el, to, ms = 900) {
  if (!el) return; const from = 0, t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

export const greet = () => { const h = new Date().getHours(); return h < 5 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar'; };
export const TR_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
export const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

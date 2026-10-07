// Duyuru çubuğu: panelden seçilen efektle (kayan yazı, daktilo, parıltı, nabız, renkli akış) çizilir.
// Uygulama ana sayfası ve panel önizlemesi aynı kodu kullanır.
import { esc, icon } from './ui.js';

export const ANNOUNCE_FX = [['none', 'Sabit'], ['marquee', 'Kayan yazı'], ['typewriter', 'Daktilo'], ['shine', 'Parıltı'], ['pulse', 'Nabız (dikkat çek)'], ['gradient', 'Renkli akış']];
export const ANNOUNCE_TONES = [['violet', 'Mor'], ['lime', 'Yeşil'], ['coral', 'Mercan'], ['sky', 'Mavi'], ['sun', 'Sarı'], ['ink', 'Koyu']];

const dismissKey = 'pratilange:announce-dismissed';
// a short fingerprint of the text: a new announcement shows again even if the previous one was closed
const fp = t => { let h = 0; for (const c of String(t)) h = (h * 31 + c.codePointAt(0)) | 0; return String(h); };
const isDismissed = t => { try { return localStorage.getItem(dismissKey) === fp(t); } catch { return false; } };

// s: settings object ({ announcement, announceFx, announceTone, announceEmoji, announceLink, announceDismiss })
export function announceHTML(s, { preview = false } = {}) {
  const text = String(s?.announcement || '').trim();
  if (!text || (!preview && s.announceDismiss && isDismissed(text))) return '';
  const fx = ANNOUNCE_FX.some(f => f[0] === s.announceFx) ? s.announceFx : 'none';
  const tone = ANNOUNCE_TONES.some(t => t[0] === s.announceTone) ? s.announceTone : 'violet';
  const emoji = esc(s.announceEmoji || '📣');
  const link = /^#\/[\w\-/]*$/.test(s.announceLink || '') ? s.announceLink : '';
  const dur = Math.max(10, Math.min(40, Math.round(text.length * 0.28))); // marquee speed follows the text length
  const body = fx === 'marquee'
    ? `<span class="an-marq" style="--dur:${dur}s"><span class="an-track"><span>${esc(text)}</span><span aria-hidden="true">${esc(text)}</span></span></span>`
    : fx === 'typewriter' ? `<span class="an-text an-type" data-type="${esc(text)}" aria-label="${esc(text)}">${esc(text)}</span>`
    : `<span class="an-text">${esc(text)}</span>`;
  const tag = link ? 'a' : 'div';
  return `<${tag} class="announce fx-${fx} tone-${tone}${link ? ' has-link' : ''}" ${link ? `href="${link}"` : ''} role="status">
    <span class="an-emoji" aria-hidden="true">${emoji}</span>${body}
    ${link ? `<span class="an-go" aria-hidden="true">${icon.chevron}</span>` : ''}
    ${s.announceDismiss ? `<button class="an-x" data-an-x aria-label="Duyuruyu kapat">${icon.close}</button>` : ''}
  </${tag}>`;
}

// typewriter effect + close button; returns a cleanup function
export function wireAnnounce(root, s, { preview = false } = {}) {
  const bar = root.querySelector('.announce'); if (!bar) return () => { };
  let timer = null;
  const t = bar.querySelector('[data-type]');
  if (t && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const full = [...t.dataset.type]; let i = 0;
    t.textContent = ''; t.classList.add('typing');
    const step = () => { t.textContent = full.slice(0, ++i).join(''); if (i < full.length) timer = setTimeout(step, full[i - 1] === ' ' ? 30 : 42 + Math.random() * 40); else t.classList.remove('typing'); };
    timer = setTimeout(step, 600);
  }
  bar.querySelector('[data-an-x]')?.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    if (!preview) try { localStorage.setItem(dismissKey, fp(s.announcement)); } catch { }
    bar.classList.add('an-out'); setTimeout(() => bar.remove(), 320);
  });
  return () => clearTimeout(timer);
}

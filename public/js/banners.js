// Ana sayfa bannerları: panelden düzenlenen, kaydırmalı kartlar (her biri bir sayfaya götürür)
import { APP } from './content.js';
import { M } from './market.js';
import { pip } from './mascot.js';
import { esc } from './ui.js';
import { reduced } from './motion.js';

// soft background shapes, drawn in the right-hand side of the card
const DECO = {
  bars: () => [22, 44, 66, 90, 118].map((h, i) => `<rect x="${18 + i * 34}" y="${172 - h}" width="24" height="${h}" rx="8" fill="#fff" opacity="${0.06 + i * 0.03}"/>`).join(''),
  bubbles: () => [[40, 40, 26], [120, 30, 16], [160, 90, 30], [70, 120, 20], [150, 150, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".1"/>`).join(''),
  chat: () => `<rect x="30" y="24" width="96" height="40" rx="18" fill="#fff" opacity=".12"/><path d="M52 64 l-8 14 18-14z" fill="#fff" opacity=".12"/><rect x="80" y="78" width="100" height="40" rx="18" fill="#fff" opacity=".08"/><circle cx="58" cy="44" r="4" fill="#fff" opacity=".3"/><circle cx="74" cy="44" r="4" fill="#fff" opacity=".3"/><circle cx="90" cy="44" r="4" fill="#fff" opacity=".3"/>`,
  city: () => [[0, 90, 30], [34, 60, 26], [64, 110, 24], [92, 40, 30], [126, 80, 26], [156, 56, 44]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${172 - y}" rx="4" fill="#fff" opacity=".09"/>`).join('') + `<circle cx="150" cy="30" r="12" fill="#fff" opacity=".18"/>`,
  stars: () => [[30, 30, 8], [90, 20, 5], [150, 44, 10], [60, 100, 6], [170, 120, 5], [120, 90, 4]].map(([x, y, s]) => `<path d="M${x} ${y - s} L${x + s * .3} ${y - s * .3} L${x + s} ${y} L${x + s * .3} ${y + s * .3} L${x} ${y + s} L${x - s * .3} ${y + s * .3} L${x - s} ${y} L${x - s * .3} ${y - s * .3}Z" fill="#fff" opacity=".22"/>`).join(''),
};
const SWOOSH = '<svg class="bn-swoosh" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8 Q50 1 98 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';

const list = () => (APP.settings?.banners || []).filter(b => b.enabled !== false);
const itemOf = id => M.items.find(x => x.id === id);

export function bannersHTML() {
  const B = list(); if (!B.length) return '';
  return `<section class="section banners" aria-label="Öne çıkanlar">
    <div class="bn-track" data-bn-track>${B.map((b, i) => {
      const outfit = Object.fromEntries(Object.entries(b.outfit || {}).map(([sl, id]) => [sl, itemOf(id)]).filter(([, x]) => x));
      const title = esc(b.title || '').replace(/\n/g, '<br>');
      return `<a class="bn tone-${esc(b.tone || 'green')}" href="${esc(b.link || '#/home')}" data-bn="${i}">
        <svg class="bn-deco" viewBox="0 0 200 172" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">${(DECO[b.deco] || DECO.bars)()}</svg>
        <div class="bn-text"><div class="bn-title">${title}</div>${b.accent ? `<div class="bn-accent">${esc(b.accent)}${SWOOSH}</div>` : ''}${b.sub ? `<p class="bn-sub">${esc(b.sub)}</p>` : ''}</div>
        <div class="bn-pip">${pip({ size: 150, outfit, mood: 'happy', pose: i % 2 ? 'wave' : 'idle', color: itemOf(b.color)?.colors?.c1 })}</div>
      </a>`;
    }).join('')}</div>
    ${B.length > 1 ? `<div class="bn-dots" aria-hidden="true">${B.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
  </section>`;
}

// dots follow the scroll; gentle auto-advance that stops once the learner touches the track
export function wireBanners(root) {
  const track = root.querySelector('[data-bn-track]'); if (!track) return () => { };
  const cards = [...track.children], dots = [...root.querySelectorAll('.bn-dots i')];
  let cur = 0, timer = null, touched = false;
  const nearest = () => { const x = track.scrollLeft + track.clientWidth / 2; let best = 0, d = Infinity; cards.forEach((c, i) => { const m = Math.abs(c.offsetLeft + c.offsetWidth / 2 - x); if (m < d) { d = m; best = i; } }); return best; };
  const onScroll = () => { const i = nearest(); if (i !== cur) { cur = i; dots.forEach((d, k) => d.classList.toggle('on', k === i)); } };
  const go = i => track.scrollTo({ left: cards[i].offsetLeft - (track.clientWidth - cards[i].offsetWidth) / 2, behavior: reduced() ? 'auto' : 'smooth' });
  const stop = () => { touched = true; clearInterval(timer); };
  track.addEventListener('scroll', onScroll, { passive: true });
  track.addEventListener('pointerdown', stop, { passive: true });
  if (cards.length > 1 && !reduced()) timer = setInterval(() => { if (!touched && document.visibilityState === 'visible') go((cur + 1) % cards.length); }, 5000);
  return () => { clearInterval(timer); track.removeEventListener('scroll', onScroll); track.removeEventListener('pointerdown', stop); };
}

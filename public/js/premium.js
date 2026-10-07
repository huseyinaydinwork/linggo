// Freemium / Premium: özellik kontrolleri (panelden yönetilen plan matrisi) + Premium ekranı + WhatsApp yedek akışı
import { APP, isPremium, featOn, limitOf } from './content.js';
import { track, dailyCount, dailyHas, activeDaysThisWeek, state, soundSkill } from './store.js';
import { post } from './api.js';
import { icon, esc, toast } from './ui.js';
import { pip } from './mascot.js';

export const WA_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z"/></svg>`;

export const proBadge = (dark = false) => `<span class="pro ${dark ? 'dark' : ''}">${icon.sparkle} Pro</span>`;
export const lockIcon = () => `<span class="lock-ic" aria-label="Premium">${icon.lock}</span>`;
export const tl = n => `${Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

export const canPlayPairs = () => dailyCount('pairs') < limitOf('pairsPerDay');
export const canLearnPattern = () => dailyCount('patterns') < limitOf('patternsPerDay');
export const canLearnSound = () => dailyCount('sounds') < limitOf('soundsPerDay');
// Brand-new items use the daily quota; ones already learned (or already started today) are always free
export const SOUND_LEARNED = 80; // % mastery that counts as "learned"
export const isNewPattern = id => !state().patterns[id] && !dailyHas('patterns', id);
export const isNewSound = id => soundSkill(id) < SOUND_LEARNED && !dailyHas('sounds', id);
export const canStartPattern = id => !isNewPattern(id) || canLearnPattern();
export const canStartSound = id => !isNewSound(id) || canLearnSound();
// Remaining new items today (Infinity = unlimited)
export const dailyLeft = (k, feature) => Math.max(0, limitOf(feature) - dailyCount(k));
export const canWeekly = () => featOn('weekly');
// Reinforcing a week needs a week to reinforce: at least 2 active days
export const WEEKLY_MIN_DAYS = 2;
export const weeklyReady = () => activeDaysThisWeek() >= WEEKLY_MIN_DAYS;
export const premiumPlan = () => APP.plans.find(p => p.id === 'premium') || {};

function waUrl(extra = '') {
  const s = APP.settings || {};
  const text = (s.whatsappText || 'Merhaba! Linggo Premium\'a geçmek istiyorum. Hesabım: {email}').replace('{email}', APP.user?.email || '').replace('{name}', APP.user?.name || '') + extra;
  return `https://wa.me/${s.whatsapp || '905075973367'}?text=${encodeURIComponent(text)}`;
}
export function openWhatsApp(url) { const w = window.open(url, '_blank', 'noopener'); if (!w) location.href = url; }
// Opens WhatsApp immediately (keeps the user gesture for popup blockers) and logs the request
export function requestPremium(from = '') {
  openWhatsApp(waUrl());
  post('/api/premium/request', { from }).catch(() => { });
}

const REASONS = {
  unit: ['Bu ünite Premium\'da', 'Seviyendeki ilk üniteler ücretsiz. Kalan tüm kelimelere Premium ile ulaş.'],
  theme: ['Bu tema Premium\'da', 'Tüm günlük hayat temalarını Premium ile aç.'],
  pattern: ['Bu kalıp Premium\'da', 'Tüm cümle kalıpları, alıştırmaları ve tekrarlarıyla Premium\'da.'],
  lesson: ['Bu ders Premium\'da', 'Pip\'in tüm mini derslerini Premium ile izle.'],
  accent: ['Bu aksan konusu Premium\'da', 'Tüm ABD / İngiliz aksan farklarını Premium ile keşfet.'],
  level: ['Bu içerik başka bir seviyede', 'Diğer seviyelerin içeriği Premium\'da açık. Ya da seviyeni değiştirebilirsin.'],
  pairs: ['Bugünkü ücretsiz oyun hakkın bitti', 'Premium ile ses çiftleri oyununu sınırsız oyna. Yarın yeni bir ücretsiz hakkın olacak.'],
  weekly: ['Haftalık pekiştirme Premium\'da', 'Haftanın kelimelerini karışık bir sınavla kalıcı hâle getir.'],
  item: ['Pro öğe', 'Bu öğe Premium üyelere özel. Premium ile tüm Pro temalar ve kıyafetler senin.'],
  more: ['Günlük sınırına ulaştın', 'Harika tempo! Premium ile günlük yeni kelime sınırı kalkar.'],
  rounds: ['Bugünkü setlerini bitirdin 🎉', 'Premium ile günün kelimelerinden istediğin kadar yeni set al. Yarın yeni setlerin açılır.'],
  patternDaily: ['Bugünkü yeni kalıp hakkını kullandın 🎉', 'Premium ile günde istediğin kadar yeni kalıp öğren. Yarın yeni hakkın açılır. (Öğrendiklerini tekrar etmek her zaman serbest.)'],
  soundDaily: ['Bugünkü yeni ses hakkını kullandın 🎉', 'Premium ile günde istediğin kadar yeni ses alıştırması yap. Yarın yeni hakkın açılır. (Öğrendiklerini tekrar etmek her zaman serbest.)'],
  chest: ['Sandıklar Premium\'da daha dolu', 'Premium üyeler her sandıktan 2× yaprak kazanır; Pro temalar ve kıyafetler de senin olur.'],
  sound: ['Bu ses alıştırması Premium\'da', 'Tüm sesler için sınırsız alıştırma Premium\'da.'],
  feature: ['Bu özellik Premium\'da', 'Premium ile tüm özelliklerin kilidini aç.'],
  general: ['Linggo Premium', 'Tüm içerik, sınırsız pratik.'],
};

// ---------- Premium tour: full-screen, 4 steps — why now → what you get → free vs premium → pick a plan
// Rows of the comparison: only features whose free and premium values differ are shown
const CMP = [
  ['dailyNewMax', '🌱', 'Günlük yeni kelime'], ['dayWordsRounds', '🔁', 'Günlük yeni kelime seti'], ['units', '📚', 'Seviyendeki kelime üniteleri'],
  ['patterns', '🧩', 'Cümle kalıpları'], ['patternsPerDay', '✏️', 'Günde yeni kalıp'], ['soundsPerDay', '🗣️', 'Günde yeni ses alıştırması'],
  ['pairsPerDay', '👂', 'Ses çiftleri oyunu (gün)'], ['lessons', '🎬', 'Pip\'in mini dersleri'], ['themes', '🏷️', 'Günlük hayat temaları'],
  ['accent', '🌍', 'ABD / İngiliz aksan konuları'], ['otherLevels', '🎯', 'Tüm seviyeler (A1–C1)'], ['weekly', '📅', 'Haftalık pekiştirme sınavı'],
  ['coinBonus', '🍃', 'Yaprak kazancı'], ['premiumItems', '✨', 'Pro temalar ve kıyafetler'], ['streakFreezes', '❄️', 'Seri dondurucu'],
  ['advancedStats', '📈', 'Gelişmiş istatistikler'],
];
const fmtFeat = (k, v) => {
  if (typeof v === 'boolean') return v ? '<i class="ok">✓</i>' : '<i class="no">—</i>';
  if (v === -1 || v == null) return '<b class="inf">Sınırsız</b>';
  if (k === 'coinBonus') return `<b>${(v / 100).toLocaleString('tr-TR')}×</b>`;
  return `<b>${v}</b>`;
};
const HIGHLIGHTS = () => [
  ['∞', 'Sınırsız kelime', 'Günlük sınır yok. İstediğin kadar yeni set al, kendi temponda ilerle.', 'var(--lime)'],
  ['🧩', 'Tüm kalıplar ve dersler', `${APP.totals?.patterns || 45} kalıp, tüm mini dersler ve aksan konuları açık.`, 'var(--pink)'],
  ['🗣️', 'Sınırsız telaffuz pratiği', 'Ses alıştırmaları ve ses çiftleri oyunu her gün sınırsız.', 'var(--sun)'],
  ['🎨', '2× yaprak + Pro görünüm', 'Sandıklardan iki kat yaprak, Pro temalar ve kıyafetler senin.', 'var(--sky)'],
];
let tourOpen = null;

export function paywall(from = 'general') {
  if (tourOpen) return;
  const [title, sub] = REASONS[from] || REASONS.general;
  const pp = premiumPlan(), free = isPremium() ? null : APP.features, prem = APP.featuresPremium || {};
  const save = pp.priceMonthly && pp.priceYearly ? Math.round((1 - pp.priceYearly / (pp.priceMonthly * 12)) * 100) : 0;
  const rows = CMP.filter(([k]) => k in prem && (!free || JSON.stringify(free[k]) !== JSON.stringify(prem[k])));
  const perks = APP.settings?.perks || [];
  track('paywall_view', { from });
  const STEPS = 4;
  const wrap = document.createElement('div');
  wrap.className = 'pw-tour'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Linggo Premium');
  wrap.innerHTML = `<div class="pwt-bg" aria-hidden="true"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div>
    <header class="pwt-top">
      <div class="pwt-dots" role="tablist" aria-label="Adımlar">${Array.from({ length: STEPS }, (_, i) => `<button data-dot="${i}" aria-label="${i + 1}. adım"><i></i></button>`).join('')}</div>
      <button class="pwt-x" data-pwt-close aria-label="Kapat">${icon.close}</button>
    </header>
    <div class="pwt-viewport"><div class="pwt-track">
      <section class="pwt-step s-hero">
        ${from !== 'general' ? `<p class="pwt-why">${icon.lock}<span>${esc(title)}</span></p>` : ''}
        <div class="pwt-pip">${pip({ size: 200, mood: 'wow', pose: 'cheer' })}<span class="pwt-crown" aria-hidden="true">👑</span></div>
        <p class="pwt-kicker">${proBadge()} Linggo Premium</p>
        <h2 class="pwt-h">Sınırsız öğren,<br><span>daha hızlı konuş.</span></h2>
        <p class="pwt-p">${esc(from !== 'general' ? sub : 'Tüm içerik, sınırsız pratik ve Pip\'in bütün dersleri. İngilizceni her gün biraz daha ileri taşı.')}</p>
      </section>
      <section class="pwt-step s-what">
        <h2 class="pwt-h sm">Premium'da<br><span>neler açılıyor?</span></h2>
        <div class="pwt-cards">${HIGHLIGHTS().map(([e, t, d, c], i) => `<div class="pwt-card" style="--c:${c};--i:${i}"><span class="pwt-ic">${e}</span><div><b>${t}</b><p>${d}</p></div></div>`).join('')}</div>
      </section>
      <section class="pwt-step s-cmp">
        <h2 class="pwt-h sm">Ücretsiz ve Premium<br><span>arasındaki fark</span></h2>
        <div class="pwt-table" role="table">
          <div class="pwt-tr head" role="row"><span role="columnheader"></span><span role="columnheader">Ücretsiz</span><span role="columnheader" class="pro-col">${proBadge()}</span></div>
          ${rows.map(([k, e, l], i) => `<div class="pwt-tr" role="row" style="--i:${i}"><span role="cell"><em>${e}</em>${l}</span><span role="cell">${free ? fmtFeat(k, free[k]) : '—'}</span><span role="cell" class="pro-col">${fmtFeat(k, prem[k])}</span></div>`).join('')}
        </div>
      </section>
      <section class="pwt-step s-plan">
        <h2 class="pwt-h sm">Planını seç,<br><span>hemen başla.</span></h2>
        ${pp.priceMonthly ? `<div class="pwt-plans" role="radiogroup" aria-label="Plan">
          <button class="pwt-plan on" data-plan="premium-yearly" role="radio" aria-checked="true">${save > 0 ? `<span class="pwt-save">%${save} tasarruf</span>` : ''}<span class="pwt-radio"></span><div><b>Yıllık</b><small>12 ay · ayda ${tl(pp.priceYearly / 12)}</small></div><strong>${tl(pp.priceYearly)}</strong></button>
          <button class="pwt-plan" data-plan="premium-monthly" role="radio" aria-checked="false"><span class="pwt-radio"></span><div><b>Aylık</b><small>İstediğin zaman iptal</small></div><strong>${tl(pp.priceMonthly)}</strong></button>
        </div>` : ''}
        ${perks.length ? `<ul class="pwt-perks">${perks.map(p => `<li>${icon.check}<span>${esc(p)}</span></li>`).join('')}</ul>` : ''}
        <p class="pwt-trust">🔒 Güvenli ödeme · ⏱️ Hemen aktif · ↩️ İstediğin zaman iptal</p>
      </section>
    </div></div>
    <footer class="pwt-foot">
      <button class="btn btn-lime btn-block pwt-next" data-pwt-next></button>
      <div class="pwt-sub">
        <button class="pwt-link" data-pwt-skip>Planları gör</button>
        <button class="pwt-link wa" data-pwt-wa hidden>${WA_ICON}<span>WhatsApp ile aktif et</span></button>
        <button class="pwt-link" data-pwt-close>Şimdilik değil</button>
      </div>
      ${APP.settings?.priceNote ? `<p class="pwt-note" data-pwt-note hidden>${esc(APP.settings.priceNote)}</p>` : ''}
    </footer>`;
  document.body.appendChild(wrap); document.body.classList.add('pwt-open');
  const track_ = wrap.querySelector('.pwt-track'), next = wrap.querySelector('[data-pwt-next]');
  let step = 0, plan = 'premium-yearly';
  const go = i => {
    step = Math.max(0, Math.min(STEPS - 1, i));
    track_.style.transform = `translateX(${-step * 100}%)`;
    wrap.querySelectorAll('.pwt-step').forEach((x, k) => { x.classList.toggle('on', k === step); x.setAttribute('aria-hidden', k !== step); x.inert = k !== step; });
    wrap.querySelectorAll('[data-dot]').forEach((d, k) => { d.classList.toggle('on', k === step); d.classList.toggle('done', k < step); });
    const last = step === STEPS - 1;
    next.innerHTML = last ? `${icon.sparkle} ${plan === 'premium-yearly' ? 'Yıllık planla başla' : 'Aylık planla başla'}` : step === 0 ? `Neler var, görelim ${icon.arrow}` : `Devam ${icon.arrow}`;
    wrap.querySelector('[data-pwt-skip]').hidden = last;
    wrap.querySelector('[data-pwt-wa]').hidden = !last;
    const note = wrap.querySelector('[data-pwt-note]'); if (note) note.hidden = !last;
    track('paywall_step', { from, step });
  };
  const close = () => {
    if (!tourOpen) return; tourOpen = null;
    wrap.classList.add('out'); document.body.classList.remove('pwt-open');
    document.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', close);
    setTimeout(() => wrap.remove(), 380);
  };
  tourOpen = close;
  const onKey = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') go(step + 1); if (e.key === 'ArrowLeft') go(step - 1); };
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', close);
  next.onclick = () => {
    if (step < STEPS - 1) return go(step + 1);
    track('paywall_cta', { from, plan });
    if (pp.priceMonthly) location.hash = '#/checkout/plan/' + plan; else { requestPremium(from); close(); toast('WhatsApp açılıyor… Mesajı göndermen yeterli 💬'); }
  };
  wrap.querySelector('[data-pwt-skip]').onclick = () => go(STEPS - 1);
  wrap.querySelectorAll('[data-pwt-close]').forEach(b => b.onclick = close);
  wrap.querySelectorAll('[data-dot]').forEach(d => d.onclick = () => go(+d.dataset.dot));
  wrap.querySelector('[data-pwt-wa]').onclick = () => { requestPremium(from); close(); toast('WhatsApp açılıyor… Mesajı göndermen yeterli 💬'); };
  wrap.querySelectorAll('[data-plan]').forEach(b => b.onclick = () => {
    plan = b.dataset.plan;
    wrap.querySelectorAll('[data-plan]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    go(step);
  });
  // swipe between steps
  let x0 = null, y0 = 0;
  const vp = wrap.querySelector('.pwt-viewport');
  vp.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  vp.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(step + (dx < 0 ? 1 : -1)); });
  requestAnimationFrame(() => wrap.classList.add('in'));
  go(0);
  next.focus({ preventScroll: true });
}

// Gate helper: returns true if allowed, otherwise opens the paywall
export function need(featureKey, from = 'feature') {
  if (featOn(featureKey)) return true;
  paywall(from); return false;
}
export { isPremium };

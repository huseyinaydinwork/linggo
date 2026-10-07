// Ödüller: günlük görevler + seviye / rozet / seri sandıkları.
// Sandık 3–5 dokunuşta açılır; içerik sunucuda belirlenir (yaprak, XP, bazen eşya).
import { post } from './api.js';
import { state, save, todayKey, levelInfo, addXP, syncNow, track } from './store.js';
import { M, apply as applyMarket, setEquip } from './market.js';
import { APP, isPremium } from './content.js';
import { sfx } from './audio.js';
import { esc, toast, icon } from './ui.js';
import { pip, react } from './mascot.js';
import { themeSwatch, artFor } from './wear.js';
import { burst, tickTo, reduced } from './motion.js';
import { paywall } from './premium.js';
import { BADGES } from './views/progress.js';

// ---------- missions (same deterministic pick as server/rewards.js)
export function missionsFor(date, pool = M.rewards?.missions || []) {
  let h = 2166136261;
  for (const c of date) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const list = [...pool], out = [];
  while (out.length < 3 && list.length) { h = Math.imul(h ^ (h >>> 13), 1103515245) >>> 0; out.push(list.splice(h % list.length, 1)[0]); }
  return out;
}
export function missionValue(m, date = todayKey()) {
  const S = state(), a = S.act?.[date] || {}, xp = S.xp?.[date] || 0, goal = S.profile?.goal || 50;
  return Math.min(m.n, { goal: xp >= goal ? 1 : 0, xp, ok: a.ok || 0, rev: a.rev || 0, nw: a.nw || 0 }[m.metric] || 0);
}
const claimed = () => new Set(M.rewards?.claimed || []);
function base() {
  const S = state();
  if (!S.rewardBase) { S.rewardBase = { lv: levelInfo().lv, ts: Date.now(), st: S.streak?.best || 0 }; save(); }
  return S.rewardBase;
}

// Everything the learner has earned but not opened yet
export function pendingChests() {
  const R = M.rewards; if (!R?.enabled || !APP.user) return [];
  const S = state(), C = claimed(), b = base(), out = [], d = todayKey();
  const ms = missionsFor(d);
  ms.forEach(m => { const k = `m:${d}:${m.id}`; if (missionValue(m, d) >= m.n && !C.has(k)) out.push({ key: k, tier: 'mission', title: 'Görev tamam!', sub: m.t }); });
  if (ms.length && ms.every(m => missionValue(m, d) >= m.n) && !C.has(`d:${d}`)) out.push({ key: `d:${d}`, tier: 'daily', title: 'Günün tüm görevleri!', sub: 'Büyük günlük sandık' });
  const lv = levelInfo().lv;
  for (let n = Math.max(2, b.lv + 1); n <= lv; n++) if (!C.has(`lv:${n}`)) out.push({ key: `lv:${n}`, tier: 'level', title: `Seviye ${n}!`, sub: 'Seviye atladın' });
  for (const [id, ts] of Object.entries(S.badges || {})) if (ts > b.ts && !C.has(`b:${id}`)) { const bd = BADGES.find(x => x.id === id); out.push({ key: `b:${id}`, tier: 'badge', title: bd ? `${bd.e} ${bd.t}` : 'Yeni rozet!', sub: bd?.d || 'Rozet kazandın' }); }
  for (const n of R.streakMilestones || []) if ((S.streak?.best || 0) >= n && n > b.st && !C.has(`st:${n}`)) out.push({ key: `st:${n}`, tier: 'streak', title: `${n} gün seri! 🔥`, sub: 'Seri sandığı' });
  return out;
}

// ---------- chest art (tier colour via --tc)
const CHEST = `<svg class="chest-svg" viewBox="0 0 220 200" aria-hidden="true">
  <ellipse cx="110" cy="188" rx="84" ry="9" fill="rgba(0,0,0,.28)"/>
  <g class="chest-base">
    <path d="M26 96 H194 V170 Q194 182 182 182 H38 Q26 182 26 170Z" fill="var(--tc)" stroke="#141414" stroke-width="5" stroke-linejoin="round"/>
    <path d="M26 118 H194 M26 146 H194" stroke="rgba(0,0,0,.18)" stroke-width="4"/>
    <path d="M30 100 H190" stroke="rgba(255,255,255,.35)" stroke-width="5" stroke-linecap="round"/>
    <rect x="48" y="96" width="18" height="86" fill="#3B2A1A" stroke="#141414" stroke-width="4"/>
    <rect x="154" y="96" width="18" height="86" fill="#3B2A1A" stroke="#141414" stroke-width="4"/>
    <circle cx="57" cy="170" r="3" fill="#FFD166"/><circle cx="163" cy="170" r="3" fill="#FFD166"/>
  </g>
  <g class="chest-glowline"><rect x="30" y="90" width="160" height="10" rx="5" fill="#FFF6C8"/></g>
  <g class="chest-lid">
    <path d="M22 96 Q22 44 110 40 Q198 44 198 96 Z" fill="var(--tc)" stroke="#141414" stroke-width="5" stroke-linejoin="round"/>
    <path d="M44 72 Q110 54 176 72" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="6" stroke-linecap="round"/>
    <path d="M48 96 Q48 50 57 47 L66 46 Q60 60 66 96Z M154 96 Q160 60 154 46 L163 47 Q172 50 172 96Z" fill="#3B2A1A" stroke="#141414" stroke-width="4" stroke-linejoin="round"/>
    <rect x="18" y="90" width="184" height="14" rx="6" fill="#3B2A1A" stroke="#141414" stroke-width="4"/>
  </g>
  <g class="chest-lock"><rect x="94" y="88" width="32" height="38" rx="8" fill="#FFD166" stroke="#141414" stroke-width="4"/><circle cx="110" cy="103" r="5" fill="#141414"/><path d="M110 106 V116" stroke="#141414" stroke-width="4" stroke-linecap="round"/></g>
</svg>`;

let busy = false;
// Open one or more chests in a row; resolves when the learner closes the last one
export async function openChests(list) {
  if (busy || !list?.length) return;
  busy = true;
  try { for (const c of list) { const more = await openChest(c); if (more === 'stop') break; } }
  finally { busy = false; window.dispatchEvent(new CustomEvent('pl:rewards')); }
}

function openChest(c) {
  return new Promise(resolve => {
    const tier = M.rewards?.tiers?.[c.tier] || {};
    const taps = 3 + ((Math.random() * 3) | 0);
    const ov = document.createElement('div');
    ov.className = 'chest-ov'; ov.dataset.tier = c.tier;
    ov.style.setProperty('--tc', tier.color || '#FFD166');
    ov.innerHTML = `<div class="chest-bg"></div><div class="chest-rays"></div>
      <div class="chest-head"><p class="eyebrow">${esc(tier.name || 'Sandık')}</p><h2 class="h2">${esc(c.title)}</h2><p class="small">${esc(c.sub || '')}</p></div>
      <button class="chest" aria-label="Sandığa dokun">${CHEST}</button>
      <div class="chest-hint"><span>Dokun!</span><div class="chest-dots">${'<i></i>'.repeat(taps)}</div></div>
      <div class="chest-loot" aria-live="polite"></div>
      <div class="chest-foot"></div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    sfx.whoosh(true);
    track('chest_view', { key: c.key });

    // claim in the background while the learner taps (server rolls the loot)
    const result = syncNow().then(() => post('/api/rewards/claim', { key: c.key })).then(r => { applyMarket(r.market); return r.reward; }, e => ({ error: e.message || 'Sandık açılamadı.' }));

    const chest = ov.querySelector('.chest'), dots = [...ov.querySelectorAll('.chest-dots i')];
    let n = 0, opened = false;
    chest.onclick = async () => {
      if (opened) return;
      n++;
      dots[n - 1]?.classList.add('on');
      ov.style.setProperty('--p', (n / taps).toFixed(2));
      chest.classList.remove('hit'); void chest.offsetWidth; chest.classList.add('hit');
      sfx.knock(n);
      burst(chest, { n: 5 + n * 2, spread: 0.6 + n * 0.15, colors: ['#FFF6C8', tier.color || '#FFD166', '#fff'], shapes: ['star', 'dot'] });
      if (n < taps) return;
      opened = true;
      ov.querySelector('.chest-hint').classList.add('gone');
      const r = await result;
      if (r.error) { toast(esc(r.error)); close(); return; }
      reveal(r);
    };

    function reveal(r) {
      ov.classList.add('open');
      sfx.burst();
      burst(chest, { n: 34, spread: 1.8, colors: ['#D4F65A', '#6FE0B0', tier.color || '#FFD166', '#FFF6C8', '#FF6B45'], shapes: ['leaf', 'star', 'dot', 'leaf'] });
      if (r.xp > 0) addXP(r.xp);
      const it = r.item ? M.items.find(i => i.id === r.item) : null;
      const loot = ov.querySelector('.chest-loot');
      const cards = [];
      cards.push(`<div class="loot leaf"><span class="loot-ic">🍃</span><b data-n="${r.coins}">0</b><small>yaprak</small></div>`);
      if (r.xp > 0) cards.push(`<div class="loot xp"><span class="loot-ic">⚡</span><b data-n="${r.xp}">0</b><small>XP</small></div>`);
      if (it) cards.push(`<div class="loot item rar-${esc(it.rarity)}"><div class="loot-art">${it.slot === 'theme' ? themeSwatch(it) : it.slot === 'bg' ? `<svg viewBox="0 0 220 220">${artFor(it)}</svg>` : pip({ size: 84, outfit: { [it.slot]: it }, mood: 'wow', pose: 'cheer' })}</div><b>${esc(it.name)}</b><small>Yeni eşya · ${({ common: 'Standart', rare: 'Nadir', epic: 'Epik', legendary: 'Efsane' })[it.rarity] || ''}</small></div>`);
      loot.innerHTML = cards.join('');
      [...loot.children].forEach((el, i) => {
        el.style.animationDelay = (0.35 + i * 0.18) + 's';
        const b = el.querySelector('[data-n]');
        if (b) setTimeout(() => { tickTo(b, +b.dataset.n, { ms: 700 }); for (let k = 0; k < Math.min(6, 1 + (+b.dataset.n / 4 | 0)); k++) setTimeout(() => sfx.coin(k), k * 90); }, 450 + i * 180);
      });
      if (it) setTimeout(() => sfx.sparkle(), 900);
      const upsell = !isPremium() && r.missed > 0
        ? `<button class="chest-upsell" data-pro>✦ Premium üyeler bu sandıktan <b>+${r.missed}</b> yaprak daha alır</button>` : '';
      const foot = ov.querySelector('.chest-foot');
      foot.innerHTML = `${upsell}<div class="row gap-s">${it && it.slot !== 'bg' ? `<button class="btn btn-soft grow" data-wear>${it.slot === 'theme' ? 'Temayı uygula' : 'Hemen giy'}</button>` : ''}<button class="btn btn-lime grow" data-ok>Topla ${icon.arrow}</button></div>`;
      setTimeout(() => foot.classList.add('in'), 700);
      foot.querySelector('[data-ok]').onclick = () => close();
      foot.querySelector('[data-wear]')?.addEventListener('click', () => { setEquip(it.slot, it.id); toast(`${it.name} ${it.slot === 'theme' ? 'uygulandı' : 'giyildi'} ✨`); close(); });
      foot.querySelector('[data-pro]')?.addEventListener('click', () => { close('stop'); setTimeout(() => paywall('chest'), 250); });
      document.querySelectorAll('[data-coins]').forEach(x => x.textContent = x.closest('.coin-pill') ? `🍃 ${M.balance}` : M.balance);
    }
    function close(v) {
      ov.classList.remove('in'); ov.classList.add('out');
      setTimeout(() => { ov.remove(); resolve(v); }, reduced() ? 0 : 320);
    }
  });
}

// ---------- home: daily quests card
export function questsCard() {
  if (!M.rewards?.enabled) return '';
  const d = todayKey(), ms = missionsFor(d), C = claimed();
  if (!ms.length) return '';
  const done = ms.filter(m => missionValue(m, d) >= m.n).length;
  const pending = pendingChests();
  const dailyReady = pending.some(p => p.tier === 'daily'), dailyTaken = C.has(`d:${d}`);
  return `<section class="section quests" data-quests>
    <div class="section-head"><h2 class="h3">Günlük görevler</h2><span class="small faint">${done}/3</span></div>
    <div class="quest-card">
      <div class="quest-list">${ms.map(m => {
        const v = missionValue(m, d), ok = v >= m.n, got = C.has(`m:${d}:${m.id}`);
        return `<div class="quest ${ok ? 'done' : ''} ${ok && !got ? 'ready' : ''}" ${ok && !got ? `data-claim="m:${d}:${m.id}"` : ''}>
          <span class="q-e">${m.e || '⭐'}</span>
          <div class="grow"><b>${esc(m.t)}</b><div class="q-bar"><i style="width:${(v / m.n) * 100}%"></i></div></div>
          <span class="q-state">${got ? icon.check : ok ? '🎁' : `${m.metric === 'goal' ? '' : `${v}/${m.n}`}`}</span></div>`;
      }).join('')}</div>
      <button class="quest-chest ${dailyReady ? 'ready' : ''} ${dailyTaken ? 'taken' : ''}" ${dailyReady ? `data-claim="d:${d}"` : 'disabled'} aria-label="Günlük sandık">
        <span class="qc-art">${CHEST}</span><small>${dailyTaken ? 'Açıldı' : dailyReady ? 'Aç!' : `${3 - done} görev`}</small></button>
    </div>
    ${pending.filter(p => p.tier !== 'mission' && p.tier !== 'daily').length ? `<button class="reward-inbox squish" data-inbox>🎁 <b>${pending.filter(p => p.tier !== 'mission' && p.tier !== 'daily').length} ödül sandığı</b> seni bekliyor <span>${icon.arrow}</span></button>` : ''}
  </section>`;
}
export function wireQuests(root, onDone) {
  root.querySelectorAll('[data-claim]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const key = b.dataset.claim, c = pendingChests().find(p => p.key === key);
    if (c) openChests([c]).then(onDone);
  });
  root.querySelector('[data-inbox]')?.addEventListener('click', () => openChests(pendingChests().filter(p => p.tier !== 'mission' && p.tier !== 'daily')).then(onDone));
}
export { CHEST };
void react;

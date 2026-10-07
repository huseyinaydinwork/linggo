// Bugün: Pip'in karşılaması, seviye ve günlük hedef, görevler + sandıklar, günün kelimeleri/kalıbı/sesi, haftalık pekiştirme
import { state, profile, todayXP, dailyGoal, currentStreak, todayKey, addDays, weekStart, weeklyDone, patternDue, card, isLearned, levelInfo, soundSkill, activeDaysThisWeek, dailyCount, dailyIds } from '../store.js';
import { todaysWords, sessionPreview, roundsInfo, newRound } from '../plan.js';
import { PATTERNS } from '../data/patterns.js';
import { SOUNDS, LESSONS } from '../data/phonetics.js';
import { FREQ } from '../data/words.js';
import { pip, react, pokeable, lookAt } from '../mascot.js';
import { icon, esc, ring, greet, sheet, TR_DAYS, toast, brandMark } from '../ui.js';
import { speak } from '../speech.js';
import { navigate } from '../app.js';
import { APP, isPremium, levelInfo as lvInfo, limitOf } from '../content.js';
import { M } from '../market.js';
import { paywall, proBadge, canWeekly, weeklyReady, WEEKLY_MIN_DAYS, canLearnPattern, canLearnSound, isNewSound, SOUND_LEARNED } from '../premium.js';
import { questsCard, wireQuests, pendingChests, openChests } from '../rewards.js';
import { tickTo, reduced } from '../motion.js';
import { sfx } from '../audio.js';
import { bannersHTML, wireBanners } from '../banners.js';
import { announceHTML, wireAnnounce } from '../announce.js';

const TIPS = [
  { e: '🧠', t: 'Unutmak öğrenmenin parçası', d: 'Bir kelimeyi tam unutmak üzereyken hatırlamak, onu en güçlü şekilde kalıcı hafızaya yazar. Tekrarlarını bu yüzden zamanlıyoruz.' },
  { e: '🎯', t: 'Hatırlamaya çalışmak > tekrar okumak', d: 'Kendini test etmek (retrieval practice), aynı süre boyunca yeniden okumaktan çok daha kalıcı öğrenme sağlar.' },
  { e: '🔀', t: 'Karıştırmak işe yarar', d: 'Farklı alıştırma türlerini ve kelimeleri karıştırmak (interleaving) başta zor gelir ama uzun vadede daha iyi sonuç verir.' },
  { e: '😴', t: 'Uyku bir çalışma seansıdır', d: 'Beyin, gün içinde öğrendiklerini uykuda pekiştirir. Yatmadan önceki kısa bir tekrar çok değerlidir.' },
  { e: '🗣️', t: 'Sesli söyle', d: 'Kelimeleri yüksek sesle söylemek (üretim etkisi) sessizce okumaya göre hatırlamayı artırır.' },
  { e: '🧩', t: 'Kelime değil, kalıp öğren', d: 'Anadili İngilizce olanlar hazır kalıplarla konuşur. "I\'m looking forward to…" gibi parçalar akıcılığın kısayoludur.' },
  { e: '📅', t: 'Alışkanlık zaman alır', d: 'Yeni bir alışkanlığın otomatikleşmesi ortalama 2 ay sürer. Bir günü kaçırmak seriyi bozmaz — sadece ikinciyi kaçırma.' },
];

// ---------- top bar: brand · stat capsule (streak | leaves | chests) · PRO
// flame: lit = practised today, risk = streak alive but not yet today, off = no streak
const FLAME = `<svg class="tb-flame" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="tbFl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF4A2B"/><stop offset=".55" stop-color="#FF8A1F"/><stop offset="1" stop-color="#FFD24A"/></linearGradient></defs>
  <path class="fo" d="M12 1.8c1.2 4.2 5.6 5.8 5.6 11.6a5.6 5.6 0 0 1-11.2 0c0-2.8 1.6-4.4 2.8-5.5.3 2.1 1.4 3.3 2.7 3.3-1.1-3.3 0-6.5.1-9.4z" fill="url(#tbFl)"/>
  <path class="fi" d="M12 12.6c.7 1.8 2.3 2.6 2.3 4.6a2.3 2.3 0 0 1-4.6 0c0-1.2.7-1.9 1.1-2.3.1.9.6 1.4 1.1 1.4-.3-1.3 0-2.5.1-3.7z" fill="#FFF1B8"/></svg>`;
const LEAF = `<svg class="tb-leaf" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="tbLf" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#1FAE62"/><stop offset="1" stop-color="#C8F53C"/></linearGradient></defs>
  <path d="M4.2 19.8C4.2 10.2 10.3 4 20.2 3.8c0 9.9-6.2 16-16 16z" fill="url(#tbLf)"/><path d="M4.8 19.2 14.6 9.4" stroke="#0B3A1C" stroke-width="1.7" stroke-linecap="round" opacity=".5"/></svg>`;
const SPARK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.1 6.1 6.4 2.4-6.4 2.4L12 19.5l-2.1-6.1L3.5 11l6.4-2.4z" fill="currentColor"/><path d="M19.5 15.5l.8 2.1 2.2.9-2.2.8-.8 2.2-.9-2.2-2.1-.8 2.1-.9z" fill="currentColor" opacity=".7"/></svg>`;
const fmtN = n => n >= 10000 ? (n / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + 'B' : n.toLocaleString('tr-TR');

function streakSheet({ streak, best, freezes, flame, weekHTML, xp, goal }) {
  const msg = flame === 'lit' ? ['Bugün serini korudun 🔥', 'Yarın da birkaç dakika ayır, alev büyüsün.']
    : flame === 'risk' ? [`${streak} günlük serin tehlikede!`, 'Bugün tek bir tur pratik serini korur.']
    : ['Yeni bir seri başlat', 'Bugün pratik yap, ilk alevini yak.'];
  sheet(`<div class="sheet-body streak-sheet">
    <div class="ss-hero ${flame}">${FLAME}<b class="num">${streak}</b><span>günlük seri</span></div>
    <h3 class="h2 center">${msg[0]}</h3><p class="muted center">${msg[1]}</p>
    <div class="week">${weekHTML}</div>
    <div class="stats3">
      <div class="stat"><b>${best}</b><span>en uzun seri</span></div>
      <div class="stat"><b>❄️ ${freezes}</b><span>seri dondurucu</span></div>
      <div class="stat"><b>${xp}/${goal}</b><span>bugünkü XP</span></div>
    </div>
    <p class="tiny faint center">Bir gün kaçırırsan dondurucu serini otomatik korur. Her 7 günde bir yenisini kazanırsın (en fazla 2).</p>
    ${flame === 'lit' ? '<button class="btn btn-ghost btn-block" data-close>Harika</button>' : `<button class="btn btn-lime btn-block" data-go-daily>${icon.play}Seriyi korumak için pratik yap</button>`}
  </div>`, { onMount: (sh, close) => { const g = sh.querySelector('[data-go-daily]'); if (g) g.onclick = () => { close(); navigate('/session/daily'); }; } });
}

// ---------- welcome hero: full-screen greeting on the first home visit of the day, then it lifts away to the home page
const SKIES = [ // time-of-day palettes: [from hour, key, label]
  [5, 'dawn', 'Güne güzel bir başlangıç'], [11, 'day', 'Öğlen molasında birkaç dakika'], [17, 'dusk', 'Akşamın sakinliğinde'], [21, 'night', 'Uyumadan önce kısa bir tekrar'],
];
const skyNow = (h = new Date().getHours()) => { let k = SKIES[3]; for (const x of SKIES) if (h >= x[0]) k = x; return h < 5 ? SKIES[3] : k; };
const welcomeKey = () => `pratilange:welcome:${APP.user?.id || 'g'}`;
function shouldWelcome() { try { return localStorage.getItem(welcomeKey()) !== todayKey(); } catch { return false; } }

function welcomeHero({ name, streak, flame, xp, goal, balance, plan, line, words, done }) {
  try { localStorage.setItem(welcomeKey(), todayKey()); } catch { }
  const [, sky, sub] = skyNow();
  const wrap = document.createElement('div');
  wrap.className = `welcome sky-${sky}`;
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Hoş geldin');
  const floaters = words.slice(0, 10).map((w, i) => `<span style="--x:${(i * 37 + 11) % 88 + 4}%;--d:${(i * 1.7) % 9}s;--t:${14 + (i % 4) * 3}s;--s:${0.8 + (i % 3) * 0.18}">${esc(w)}</span>`).join('');
  const stars = sky === 'night' ? Array.from({ length: 26 }, (_, i) => `<i style="--x:${(i * 53) % 100}%;--y:${(i * 29) % 62}%;--d:${(i % 7) * 0.6}s"></i>`).join('') : '';
  wrap.innerHTML = `<div class="wl-sky" aria-hidden="true"><div class="wl-glow g1"></div><div class="wl-glow g2"></div><div class="wl-stars">${stars}</div><div class="wl-words">${floaters}</div></div>
    <div class="wl-in">
      <p class="wl-date">${esc(new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
      <h1 class="wl-title">${greet()},<br><span>${esc(name)}.</span></h1>
      <p class="wl-sub">${sub}</p>
      <div class="wl-pip"><div class="wl-bubble">${line}</div>${pip({ size: 190, mood: 'happy', pose: 'wave' })}<i class="wl-shadow"></i></div>
      <div class="wl-stats">
        <div class="wl-stat fire ${flame}">${FLAME}<b>${streak}</b><span>${flame === 'risk' ? 'bugün koru!' : 'gün seri'}</span></div>
        <div class="wl-stat ring-s">${ring(Math.min(1, xp / goal), { size: 46, stroke: 6, track: 'rgba(255,255,255,.14)', label: 'Günlük hedef' })}<b>${xp}<small>/${goal}</small></b><span>XP hedef</span></div>
        <div class="wl-stat leaf">${LEAF}<b data-wl-coins>${fmtN(balance)}</b><span>yaprak</span></div>
      </div>
      <div class="wl-plan">${plan}</div>
      <button class="btn btn-lime btn-block wl-go" data-wl-go>${icon.play}${done ? 'Bir tur daha' : xp > 0 ? 'Kaldığın yerden devam et' : 'Pratiğe başla'}</button>
      <button class="wl-skip" data-wl-skip><span>Ana sayfaya geç</span>${icon.chevron}</button>
    </div>`;
  document.body.appendChild(wrap);
  document.body.classList.add('welcome-open');
  // the market (leaf balance) may still be loading on app start
  const onMk = () => { const c = wrap.querySelector('[data-wl-coins]'); if (c) c.textContent = fmtN(M.balance); };
  window.addEventListener('pl:market', onMk); onMk();
  const pipEl = wrap.querySelector('.wl-pip .pip');
  pokeable(pipEl);
  setTimeout(() => react(pipEl, 'cheer', { voice: false }), 700);
  requestAnimationFrame(() => wrap.classList.add('in'));
  let gone = false;
  const close = (then) => {
    if (gone) return; gone = true;
    wrap.classList.add('out'); document.body.classList.remove('welcome-open');
    document.removeEventListener('keydown', onKey); window.removeEventListener('pl:market', onMk);
    setTimeout(() => { wrap.remove(); then?.(); }, reduced() ? 0 : 520);
  };
  const onKey = e => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.key === 'Enter' ? close(() => navigate('/session/daily')) : close(); } };
  document.addEventListener('keydown', onKey);
  wrap.querySelector('[data-wl-go]').onclick = () => { sfx.pop?.(); close(() => navigate('/session/daily')); };
  wrap.querySelector('[data-wl-skip]').onclick = () => close();
  // swipe up to reveal the home page
  let y0 = null;
  wrap.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive: true });
  wrap.addEventListener('touchmove', e => { if (y0 == null) return; const dy = Math.min(0, e.touches[0].clientY - y0); wrap.style.transform = `translateY(${dy * 0.6}px)`; }, { passive: true });
  wrap.addEventListener('touchend', e => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; y0 = null; wrap.style.transform = ''; if (dy < -70) close(); });
  wrap.querySelector('[data-wl-go]').focus({ preventScroll: true });
  return () => { if (!gone) { gone = true; wrap.remove(); document.body.classList.remove('welcome-open'); document.removeEventListener('keydown', onKey); } };
}

// ---------- first-screen scene: hills, a winding learning path, sun/moon by the hour — every colour comes from the
// active theme's tokens (--lime, --sun, --coral, --bg…), so a Market theme repaints the scene. Layers drift on scroll.
function heroScene(sky, words) {
  const night = sky === 'night', dusk = sky === 'dusk';
  const stars = night ? Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 67) % 380 + 5}" cy="${(i * 41) % 170 + 12}" r="${i % 3 ? 1 : 1.6}" class="hf-star" style="animation-delay:${(i % 6) * .5}s"/>`).join('') : '';
  const chips = words.slice(0, 6).map((w, i) => `<span style="--x:${[8, 62, 30, 74, 14, 52][i]}%;--y:${[18, 12, 40, 34, 58, 54][i]}%;--d:${i * .9}s">${esc(w)}</span>`).join('');
  return `<div class="hf-art sky-${sky}" aria-hidden="true">
    <div class="hf-words">${chips}</div>
    <svg class="hf-sky" viewBox="0 0 390 360" preserveAspectRatio="xMidYMin meet">
      <defs><filter id="hfBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter></defs>
      <g class="hf-l0">${stars}
        <circle class="hf-glow" cx="${dusk ? 70 : 312}" cy="${dusk ? 316 : 296}" r="54" filter="url(#hfBlur)"/>
        <circle class="hf-sun" cx="${dusk ? 70 : 312}" cy="${dusk ? 316 : 296}" r="24"/>
        ${night ? '<circle class="hf-bite" cx="323" cy="288" r="21"/>' : ''}
        <g class="hf-cloud c1"><ellipse cx="66" cy="200" rx="30" ry="11"/><ellipse cx="86" cy="193" rx="19" ry="12"/></g>
        <g class="hf-cloud c2"><ellipse cx="250" cy="262" rx="24" ry="9"/><ellipse cx="264" cy="257" rx="15" ry="10"/></g>
      </g>
    </svg>
    <svg class="hf-scene" viewBox="0 0 390 420" preserveAspectRatio="xMidYMax meet">
      <g class="hf-l1"><path class="hf-h1" d="M0 296C60 266 120 258 190 276S320 264 390 246V420H0Z"/>
        <g class="hf-tree"><rect x="66" y="268" width="3" height="12" rx="1.5"/><circle cx="67.5" cy="264" r="9"/></g>
        <g class="hf-tree"><rect x="338" y="252" width="3" height="13" rx="1.5"/><circle cx="339.5" cy="247" r="11"/></g>
        <g class="hf-flag"><line x1="252" y1="284" x2="252" y2="252"/><path d="M252 252l20 7-20 7z"/></g></g>
      <g class="hf-l2"><path class="hf-h2" d="M0 338C70 310 150 316 210 334S330 328 390 314V420H0Z"/>
        <path class="hf-road" d="M24 420C80 386 30 364 108 350S204 330 172 312S232 292 252 286"/>
        <circle class="hf-mile" cx="108" cy="350" r="5"/><circle class="hf-mile" cx="172" cy="312" r="4.5"/><circle class="hf-mile done" cx="58" cy="392" r="5.5"/></g>
      <g class="hf-l3"><path class="hf-h3" d="M0 380C90 360 170 372 240 386S350 382 390 374V420H0Z"/></g>
    </svg></div>`;
}

// What Pip says on the home screen: the single most useful nudge right now
function pipLine({ chests, streak, xp, goal, due, done, name }) {
  if (chests) return [`Sandığın var! Açalım mı? 🎁`, 'love'];
  if (done) return [`Bugünkü hedef tamam, ${name}! Harikasın 🎉`, 'cheer'];
  if (streak > 0 && xp === 0) return [`🔥 ${streak} günlük serin var — bugün de koruyalım!`, 'point'];
  if (due > 0) return [`${due} kelime seni özledi 👀 Unutmadan tekrar edelim.`, 'point'];
  if (xp > 0) return [`Hedefe ${goal - xp} XP kaldı. Az kaldı!`, 'ok'];
  return ['Bugün birkaç dakika ayıralım mı? Ben hazırım!', 'poke'];
}

// "Günün kalıbı / sesi" card. Before today's item: the item itself. After it the card keeps showing what you
// learned (✓) and grows a "next up" dock: a preview of the next item, startable in one tap, plus today's quota dots —
// or, once the free quota is used, a live countdown to the next free one.
const DAY_TITLE = { pattern: 'Günün kalıbı', sound: 'Günün sesi' };
// Time left until the free quota resets, as a compact clock ("5:42")
const untilMidnight = () => { const n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0); const min = Math.max(1, Math.ceil((m - n) / 6e4)); return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`; };
function quotaDots(used, limit) {
  if (limit === Infinity) return '<span class="dn-inf" title="Sınırsız">∞</span>';
  const n = Math.min(limit, 5);
  return `<span class="dn-dots" title="Bugün ${Math.min(used, limit)}/${limit} yeni hak kullanıldı">${Array.from({ length: n }, (_, i) => `<i class="${i < used ? 'on' : ''}"></i>`).join('')}</span>`;
}
function dayCard({ kind, st, bg, cls = '', item, next, href, body, preview, doneBody, used, limit }) {
  const title = DAY_TITLE[kind], sm = svg => svg.replace('<svg', '<svg width="14" height="14"');
  const dock = st === 'more' ? `<a class="day-next squish" href="${href(next)}" aria-label="Sıradaki ${kind === 'pattern' ? 'kalıbı' : 'sesi'} başlat">
        <span class="dn-top"><span>Sıradaki</span>${quotaDots(used, limit)}</span>
        <span class="dn-main"><b>${preview(next)}</b><span class="dn-go">${sm(icon.play)}</span></span></a>`
    : st === 'locked' ? `<button class="day-next wait squish" data-pw="${kind}Daily" aria-label="Yeni ücretsiz hak yarın. Premium ile hemen devam et">
        <span class="dn-top"><span>Yeni hak</span>${quotaDots(used, limit)}</span>
        <span class="dn-main"><b>${sm(icon.lock)}<span data-countdown title="Ücretsiz hakkın yenilenmesine kalan süre (sa:dk)">${untilMidnight()}</span></b><span class="dn-go dn-pro">${sm(icon.sparkle)}</span></span></button>`
    : st === 'done' ? `<span class="day-badge ok">${icon.check.replace('<svg', '<svg width="12" height="12"')} Hepsi tamam</span>` : '';
  const target = st === 'done' ? (kind === 'pattern' ? '#/patterns' : '#/sounds') : href(item);
  const got = st === 'more' || st === 'locked';
  return `<div class="card tap tile-color day-card ${cls}" style="background:${bg}" role="link" tabindex="0" data-href="${target}" aria-label="${title}">
    <span class="corner ${got ? 'got' : ''}">${st === 'new' ? icon.arrow : icon.check}</span>
    <p class="eyebrow">${title}</p>
    ${st === 'done' ? doneBody : body(item)}
    ${dock ? `<div class="day-foot">${dock}</div>` : ''}
  </div>`;
}

export function homeView(el) {
  const p = profile(), S = state();
  const xp = todayXP(), goal = dailyGoal(), pct = xp / goal;
  const streak = currentStreak();
  const flame = xp > 0 && streak > 0 ? 'lit' : streak > 0 ? 'risk' : 'off';
  const prev = sessionPreview();
  const dayIdx = Math.floor(Date.now() / 864e5);
  const words = todaysWords();
  const rounds = roundsInfo();
  const learnedToday = words.filter(w => card(w.id)).length;
  const pDue = patternDue();
  const openP = PATTERNS.filter(x => !x.locked);
  const potd = openP.find((x, i) => !S.patterns[x.id] && i >= dayIdx % openP.length) || openP.find(x => !S.patterns[x.id]) || openP[dayIdx % openP.length] || PATTERNS[0];
  const hardSounds = SOUNDS.filter(s => s.hard);
  const sotd = hardSounds.find(s => soundSkill(s.id) < SOUND_LEARNED && hardSounds.indexOf(s) >= dayIdx % hardSounds.length) || hardSounds[dayIdx % hardSounds.length] || SOUNDS[0];
  // Day card states: 'new' (today's item) → after learning one: 'more' (next item, quota left) · 'locked' (quota used) · 'done' (nothing left)
  const pToday = PATTERNS.find(x => x.id === dailyIds('patterns').at(-1));
  const nextPattern = !S.patterns[potd.id] ? potd : openP.find(x => !S.patterns[x.id]);
  const pState = !pToday && !S.patterns[potd.id] ? 'new' : !nextPattern ? 'done' : canLearnPattern() ? 'more' : 'locked';
  const sToday = SOUNDS.find(x => x.id === dailyIds('sounds').at(-1));
  const nextSound = [sotd, ...hardSounds, ...SOUNDS].find(x => isNewSound(x.id));
  const sState = !sToday && soundSkill(sotd.id) < SOUND_LEARNED ? 'new' : !nextSound ? 'done' : canLearnSound() ? 'more' : 'locked';
  const sym = x => x.us && p.accent !== 'uk' ? x.us : x.ipa;
  const openL = LESSONS.filter(l => !l.locked);
  const lesson = openL.find(l => !S.lessons[l.id]) || openL[dayIdx % openL.length] || LESSONS[0];
  const weeklyOpen = canWeekly(), wDays = activeDaysThisWeek(), wReady = weeklyReady();
  const tip = TIPS[dayIdx % TIPS.length];
  const done = xp >= goal;
  const L = levelInfo();
  const chests = pendingChests();
  const [line, mood] = pipLine({ chests: chests.length, streak, xp, goal, due: prev.due, done, name: esc(p.name || '') });

  // week strip
  const ws = weekStart(); const t = todayKey();
  const week = Array.from({ length: 7 }, (_, i) => {
    const k = addDays(ws, i), v = S.xp[k] || 0;
    const cls = k === t ? 'today' : '';
    const st = v >= goal ? 'done' : S.streak.frozen?.includes(k) ? 'frozen' : v > 0 ? 'part' : '';
    return `<div class="week-d ${cls} ${st}" style="--d:${i}"><i>${st === 'done' ? icon.check : st === 'frozen' ? icon.snow : ''}</i><span>${TR_DAYS[i]}</span></div>`;
  }).join('');
  const weekActive = wDays;

  const learnedWords = Object.keys(S.cards).filter(isLearned).slice(-18);
  const marqueeWords = (learnedWords.length >= 6 ? learnedWords : FREQ.slice(0, 18).map(w => w.en));
  const dateStr = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

  const planLine = prev.due + prev.fresh === 0
    ? `<span><i></i>Tekrar yok</span><span>Serbest pratik</span>`
    : `${prev.due ? `<span><i></i>${prev.due} tekrar</span>` : ''}${prev.fresh ? `<span><i style="background:var(--coral)"></i>${prev.fresh} yeni kelime</span>` : ''}<span>~${prev.mins} dk</span>`;

  // today's words card: finished set → next set (plan limit) or upsell
  const wordsTitle = !words.length ? (isPremium() ? 'Tüm kelimeler bitti!' : 'Ücretsiz kelimeleri bitirdin 🎉')
    : rounds.done ? 'Bugünün seti tamam ✓' : `${words.length - learnedToday} yeni kelime`;
  const roundBtn = rounds.canMore ? `<button class="btn btn-sm btn-ink squish" data-round>${icon.refresh} Yeni set al <small>${rounds.max === Infinity ? '' : `${rounds.used}/${rounds.max}`}</small></button>`
    : rounds.limitHit ? `<button class="btn btn-sm btn-ink squish" data-pw="rounds">${icon.lock} Yeni set · Premium</button>` : '';

  el.innerHTML = `
    <header class="topbar home-top" data-top>
      <a class="brand" href="#/home" aria-label="Linggo ana sayfa">${brandMark(30)}</a>
      <div class="tb-right">
        <div class="stat-cap">
          <button class="sc-seg sc-fire ${flame}" data-streak aria-label="Günlük seri: ${streak} gün${flame === 'risk' ? ', bugün henüz korunmadı' : ''}">${FLAME}<b>${streak}</b></button>
          <a class="sc-seg sc-leaf" href="#/market" aria-label="${M.balance} yaprak — Pip Market">${LEAF}<b data-coins>${fmtN(M.balance)}</b></a>
          ${chests.length ? `<button class="sc-seg sc-gift" data-inbox-top aria-label="${chests.length} açılmamış sandık"><span aria-hidden="true">🎁</span><i>${chests.length}</i></button>` : ''}
        </div>
        ${isPremium() ? `<a class="pro-badge" href="#/profile/settings" aria-label="Premium üyesin">${SPARK}<span>PRO</span></a>`
          : `<button class="pro-badge up" data-pw="general" aria-label="Premium'a geç">${SPARK}<span>PRO</span></button>`}
      </div>
    </header>
    <div class="home-first" data-first>
    ${heroScene(skyNow()[1], marqueeWords)}
    ${announceHTML(APP.settings || {})}
    <div class="hh-head">
      <p class="eyebrow">${esc(dateStr)}</p>
      <h1 class="display mt-s">${greet()},<br><span class="serif">${esc(p.name)}.</span></h1>
    </div>
    <section class="home-hi">
      <div class="hh-bubble">${line}</div>
      <div class="hh-lv">
        <a class="lv-track squish" href="#/progress" aria-label="Seviye ${L.lv}, sonraki seviyeye ${L.need - L.into} XP">
          <span class="lv-badge">${L.lv}</span>
          <span class="lv-bar"><i style="--w:${Math.round(L.pct * 100)}%"></i></span>
          <span class="lv-next">🎁 ${L.lv + 1}</span>
        </a>
        <p class="tiny faint lv-cap">${L.into}/${L.need} XP · ${lvInfo() ? `${esc(lvInfo().emoji)} ${esc(lvInfo().cefr)} ${esc(lvInfo().title)}` : ''}</p>
      </div>
      <div class="hh-pip">
        ${pip({ size: 132, mood: mood === 'love' ? 'love' : 'happy', pose: 'wave' })}
      </div>
    </section>
    <button class="scroll-cue" data-cue aria-label="Aşağı kaydır: bugünün planı, görevler ve daha fazlası"><span>Bugünün planı ve fazlası</span>${icon.chevron}</button>
    </div>

    <section class="hero">
      <div class="hero-top">
        <div class="ring-wrap">${ring(pct, { size: 108, stroke: 12, track: 'rgba(255,255,255,.12)', label: 'Günlük hedef' })}
          <div class="ring-label"><div><b data-xp>${reduced() ? xp : 0}</b><span>/ ${goal} XP</span></div></div></div>
        <div class="grow" style="position:relative;z-index:1">
          <p class="eyebrow">Bugünün planı</p>
          <p class="h3" style="margin-top:6px">${done ? 'Hedef tamam! 🎉' : xp > 0 ? `${goal - xp} XP kaldı` : 'Hazırsın.'}</p>
          <p class="small" style="opacity:.65;margin-top:4px">${done ? 'Ekstra pratik, hafızanı daha da güçlendirir.' : `“${esc(p.cue || 'her gün')}” sonra, ${p.minutes || 10} dakika.`}</p>
        </div>
      </div>
      <div class="hero-plan">${planLine}</div>
      <button class="btn btn-lime btn-block" data-go="/session/daily">${icon.play}${done ? 'Bir tur daha' : xp > 0 ? 'Devam et' : 'Pratiğe başla'}</button>
    </section>

    ${bannersHTML()}

    ${questsCard()}

    <section class="section">
      <div class="section-head"><h2 class="h3">Bu hafta</h2><a href="#/progress">${weekActive}/7 gün ${icon.chevron}</a></div>
      <div class="week">${week}</div>
    </section>

    <section class="section">
      <div class="card tap tile-color daywords" style="background:var(--sky)" data-daywords>
        <span class="corner">${icon.arrow}</span>
        <p class="eyebrow">Günün kelimeleri · ${learnedToday}/${words.length}${rounds.used > 1 ? ` · ${rounds.used}. set` : ''}</p>
        <h3 class="h2" style="margin:8px 0 14px">${wordsTitle}</h3>
        <div class="wchips">${words.map(w => `<span class="wchip ${card(w.id) ? 'learned' : ''}">${w.emoji ? w.emoji + ' ' : ''}${esc(w.en)}</span>`).join('')}</div>
        <div class="row gap-s mt" style="align-items:center"><div class="bar grow" style="background:rgba(20,20,20,.12)"><i style="width:${words.length ? learnedToday / words.length * 100 : 100}%;background:#141414"></i></div>${roundBtn}</div>
      </div>
    </section>

    <section class="section bento">
      ${dayCard({ kind: 'pattern', st: pState, bg: 'var(--pink)', used: dailyCount('patterns'), limit: limitOf('patternsPerDay'),
        item: pState === 'new' ? potd : pToday || potd, next: nextPattern,
        href: it => '#/pattern/' + it.id,
        body: it => `<p class="h3" style="margin-top:10px">${esc(it.pattern.split(' + ')[0])}</p><p class="muted small" style="margin-top:6px">${esc(it.tr)}</p>`,
        preview: it => esc(it.pattern.split(' + ')[0]),
        doneBody: '<p class="h3" style="margin-top:10px">Tüm kalıpları bitirdin! 🎉</p><p class="muted small" style="margin-top:6px">Tekrarlarla kalıcı hâle getirmeye devam et.</p>' })}
      ${dayCard({ kind: 'sound', st: sState, bg: 'var(--sun)', cls: 'sotd', used: dailyCount('sounds'), limit: limitOf('soundsPerDay'),
        item: sState === 'new' ? sotd : sToday || sotd, next: nextSound,
        href: it => '#/session/sound/' + it.id,
        body: it => `<p class="ipa" style="font-size:44px;line-height:1.1;margin-top:6px">/${esc(sym(it))}/</p>
          <p class="muted small">${it.words.slice(0, 2).join(' · ')}</p>
          <div class="bar mt-s"><i style="width:${soundSkill(it.id)}%"></i></div>`,
        preview: it => `<span class="ipa">/${esc(sym(it))}/</span><small>${esc(it.words[0])}</small>`,
        doneBody: '<p class="h3" style="margin-top:10px">Tüm sesleri öğrendin! 🎉</p><p class="muted small" style="margin-top:6px">Ara ara tekrar ederek koru.</p>' })}
      <div class="card tap span2 weekly-card ${weeklyDone() ? 'lime' : 'ink'}" ${!weeklyOpen ? 'data-pw="weekly"' : weeklyDone() ? '' : wReady ? 'data-go="/session/weekly"' : 'data-wlock'}>
        <span class="corner">${weeklyDone() ? icon.check : !weeklyOpen ? icon.lock : wReady ? icon.arrow : '📅'}</span>
        <p class="eyebrow" style="${weeklyDone() ? '' : 'color:rgba(243,238,228,.55)'}">Haftalık pekiştirme · +30 XP</p>
        <h3 class="h2" style="margin-top:8px">${weeklyDone() ? 'Bu haftayı mühürledin!' : wReady ? 'Haftanı mühürle' : `${WEEKLY_MIN_DAYS - wDays} gün daha pratik yap`}</h3>
        <p class="small" style="opacity:.7;margin-top:6px">${weeklyDone() ? 'Pazartesi yeni bir sayfa açılıyor. Taze başlangıçlar motivasyonu artırır.' : wReady ? 'Bu hafta öğrendiklerini karışık bir sınavla kalıcı hâle getir.' : `Pekiştirmek için önce bu hafta en az ${WEEKLY_MIN_DAYS} farklı gün çalışmalısın.`}</p>
        ${!weeklyDone() ? `<div class="wk-days">${Array.from({ length: WEEKLY_MIN_DAYS }, (_, i) => `<i class="${i < wDays ? 'on' : ''}"></i>`).join('')}<span>${Math.min(wDays, WEEKLY_MIN_DAYS)}/${WEEKLY_MIN_DAYS} gün</span></div>` : ''}
      </div>
      <a class="card tap tile-color lesson-card" style="background:${lesson.color};min-height:170px" href="#/lesson/${lesson.id}">
        <p class="eyebrow">Mini ders · ${lesson.min} dk</p>
        <p class="h3" style="margin-top:8px;max-width:80%">${esc(lesson.title)}</p>
        <span class="play" style="margin-top:auto">${icon.play}</span>
        ${pip({ size: 96, mouth: 'th', mood: 'happy' })}
      </a>
      <div class="card tap" data-go="${pDue.length ? '/session/patterns' : '/session/review'}">
        <p class="eyebrow">${pDue.length ? 'Kalıp tekrarı' : 'Hızlı pekiştirme'}</p>
        <p class="num" style="font-size:44px;margin-top:8px">${pDue.length || prev.due}</p>
        <p class="muted small">${pDue.length ? 'kalıbın tekrar zamanı' : prev.due ? 'kelime seni bekliyor' : 'zayıf kelimelerini güçlendir'}</p>
      </div>
    </section>

    <section class="section"><a class="card tap mk-promo tilt" href="#/market">
      <div class="mk-promo-pip">${pip({ size: 120, mood: 'happy', pose: 'wave', backdrop: true })}</div>
      <div class="grow"><p class="eyebrow">Pip Market</p><b class="h3" style="display:block;margin-top:6px">Pip'i giydir, temanı seç</b>
      <p class="small muted" style="margin-top:4px">🍃 <b>${M.balance}</b> yaprağın var. Görevler ve sandıklar yaprak kazandırır.</p></div><span class="corner">${icon.arrow}</span></a></section>

    ${isPremium() ? '' : `<section class="section"><button class="upsell" data-pw="general">${pip({ size: 64, mood: 'wow', pose: 'cheer' })}<div class="grow"><div class="row gap-s">${proBadge()}<b style="font-family:var(--f-display);font-size:17px">Premium'a geç</b></div><p style="margin-top:4px">${(APP.totals.words || 1500).toLocaleString('tr-TR')}+ kelime, sınırsız set, 2× yaprak ve tüm Pro temalar.</p></div><span class="corner" style="position:static;background:rgba(255,255,255,.1);width:34px;height:34px;border-radius:12px;display:grid;place-items:center">${icon.arrow}</span></button></section>`}

    <section class="section">
      <a class="card flat tap" href="#/science" style="display:block">
        <div class="row gap"><span style="font-size:30px">${tip.e}</span><div class="grow"><p class="eyebrow">Neden böyle çalışıyoruz?</p><p class="h3" style="margin-top:4px">${tip.t}</p></div></div>
        <p class="muted small mt-s">${tip.d}</p>
        <span class="link mt-s">Linggo'nun bilimi ${icon.chevron}</span>
      </a>
    </section>

    <section class="section marquee" aria-hidden="true"><div class="marquee-in">${[...marqueeWords, ...marqueeWords].map(w => `<span>${esc(w)}</span>`).join('')}</div></section>
  `;

  // Pip greets (visual only on load — sound needs a tap) and can be poked
  const heroPip = el.querySelector('.hh-pip .pip');
  pokeable(heroPip);
  const offLook = lookAt(heroPip);
  const offBanners = wireBanners(el);
  const offAnnounce = wireAnnounce(el, APP.settings || {});
  setTimeout(() => react(heroPip, mood, { voice: false }), 450);
  if (xp > 0) tickTo(el.querySelector('[data-xp]'), xp, { ms: 1100 });

  const redraw = () => { if (el.isConnected) navigate('/home', true); };
  wireQuests(el, redraw);
  el.querySelector('[data-inbox-top]')?.addEventListener('click', () => openChests(pendingChests()).then(redraw));
  el.querySelector('.hh-bubble').onclick = () => { if (chests.length) openChests(chests).then(redraw); else react(heroPip, 'poke'); };
  el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => navigate(b.dataset.go)));
  // first screen = greeting + today's plan; the cue scrolls to everything else and fades once the user scrolls
  const first = el.querySelector('.home-first'), cue = el.querySelector('[data-cue]');
  cue.onclick = () => { const nx = first.nextElementSibling; if (nx) window.scrollTo({ top: nx.getBoundingClientRect().top + scrollY - 14, behavior: reduced() ? 'auto' : 'smooth' }); };
  // only when it clears the tab bar (short phones scroll straight into the content instead)
  const cueFits = () => cue.getBoundingClientRect().bottom + scrollY < innerHeight - 92;
  const onCue = () => cue.classList.toggle('gone', scrollY > 40 || !cueFits());
  requestAnimationFrame(onCue);
  window.addEventListener('scroll', onCue, { passive: true });
  el.querySelectorAll('[data-pw]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); paywall(b.dataset.pw); }));
  el.querySelectorAll('.day-card').forEach(c => {
    const go = e => { if (e.target.closest('.day-next')) return; navigate(c.dataset.href.slice(1)); };
    c.addEventListener('click', go);
    c.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target === c) go(e); });
  });
  const cd = setInterval(() => el.querySelectorAll('[data-countdown]').forEach(x => x.textContent = untilMidnight()), 30000);
  el.querySelector('[data-wlock]')?.addEventListener('click', () => toast(`Bu hafta ${wDays}/${WEEKLY_MIN_DAYS} gün çalıştın. Bir gün daha pratik yapınca açılır 📅`, { icon: '📅' }));
  el.querySelector('[data-round]')?.addEventListener('click', e => {
    e.stopPropagation();
    if (newRound()) { sfx.pop(); toast('Yeni set hazır! 🌱'); navigate('/session/daily'); }
  });
  if (!words.length && !isPremium()) el.querySelector('[data-daywords]').dataset.more = '1';
  el.querySelector('[data-daywords]').onclick = () => {
    if (!words.length) { if (!isPremium()) paywall('more'); else navigate('/words'); return; }
    sheet(`<div class="sheet-body">
      <p class="eyebrow">Günün kelimeleri</p><h3 class="h2">Bugün öğreneceklerin</h3>
      <div class="wlist">${words.map(w => `<div class="witem">${w.emoji ? `<span class="em">${w.emoji}</span>` : `<span class="rk">#${w.rank || ''}</span>`}<div class="grow"><div class="en">${esc(w.en)}</div><div class="tr">${esc(w.tr)}</div></div><button class="spk" data-say="${esc(w.en)}" aria-label="Dinle">${icon.speaker}</button></div>`).join('')}</div>
      <button class="btn btn-primary btn-block" data-start>${icon.play}${rounds.done ? 'Tekrar çalış' : 'Öğrenmeye başla'}</button></div>`, {
      onMount: (sh, close) => {
        sh.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say));
        sh.querySelector('[data-start]').onclick = () => { close(); navigate(rounds.done ? '/session/words/' + words.map(w => encodeURIComponent(w.id)).join(',') : '/session/daily'); };
      }
    });
  };
  const onMk = () => el.querySelectorAll('[data-coins]').forEach(x => { const v = fmtN(M.balance); if (x.textContent !== v) { x.textContent = v; const seg = x.closest('.sc-seg'); seg?.classList.remove('bump'); void seg?.offsetWidth; seg?.classList.add('bump'); } });
  el.querySelector('[data-streak]').onclick = () => streakSheet({ streak, best: S.streak.best, freezes: S.streak.freezes, flame, weekHTML: week, xp, goal });
  const top = el.querySelector('[data-top]');
  // parallax: --p goes 0 → 1 while the first screen scrolls away
  let rafP = 0;
  const onTop = () => {
    top.classList.toggle('stuck', scrollY > 6);
    if (rafP || reduced()) return;
    rafP = requestAnimationFrame(() => { rafP = 0; first.style.setProperty('--p', Math.min(1, Math.max(0, scrollY / Math.max(1, first.offsetHeight))).toFixed(3)); });
  };
  // everything below the first screen rises into view as it is scrolled to
  const below = [...el.children].slice([...el.children].indexOf(first) + 1).filter(x => x.offsetHeight);
  let io = null;
  if (!reduced() && 'IntersectionObserver' in window) {
    below.forEach(x => { x.classList.add('rv'); [...(x.matches('.bento') ? x.children : [])].forEach((c, k) => c.style.setProperty('--k', k)); });
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px', threshold: .08 });
    below.forEach(x => io.observe(x));
  }
  window.addEventListener('scroll', onTop, { passive: true }); onTop();
  window.addEventListener('pl:market', onMk);
  // first home visit of the day → welcome hero
  // (not tied to this view's cleanup: a quick re-render of home must not swallow the greeting)
  if (shouldWelcome()) welcomeHero({ name: p.name || APP.user?.name || '', streak, flame, xp, goal, balance: M.balance, plan: planLine, line, words: marqueeWords, done });
  return () => { offLook(); offBanners(); offAnnounce(); clearInterval(cd); window.removeEventListener('pl:market', onMk); window.removeEventListener('scroll', onCue); window.removeEventListener('scroll', onTop); io?.disconnect(); cancelAnimationFrame(rafP); };
}

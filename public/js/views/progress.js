// İlerleme: seviye, seri, ısı haritası, haftalık rapor, ustalık dağılımı, unutma eğrisi, rozetler (Profil sekmesinin üst kısmı)
import { state, totalXP, levelInfo, currentStreak, dailyGoal, todayKey, addDays, weekStart, masteryCounts, isLearned, dueIds, DAY } from '../store.js';
import { FREQ, CORE } from '../data/words.js';
import { PATTERNS } from '../data/patterns.js';
import { SOUNDS, LESSONS } from '../data/phonetics.js';
import { icon, esc, ring, TR_DAYS, TR_MONTHS, countUp } from '../ui.js';
import { maybeTour } from '../tours.js';
import { APP } from '../content.js';

export const BADGES = [
  { id: 'first', e: '🌱', t: 'İlk adım', d: 'İlk oturumunu tamamladın.' },
  { id: 's3', e: '🔥', t: '3 günlük seri', d: 'Alışkanlık filizleniyor.' },
  { id: 's7', e: '⚡', t: '7 günlük seri', d: 'Bir haftadır her gün!' },
  { id: 's30', e: '🏆', t: '30 günlük seri', d: 'Artık bu bir alışkanlık.' },
  { id: 'w50', e: '📗', t: '50 kelime', d: '50 kelime öğrendin.' },
  { id: 'w100', e: '📘', t: '100 kelime', d: 'Üç haneli kelime hazinesi.' },
  { id: 'w500', e: '📚', t: '500 kelime', d: 'Günlük dilin yarısı cebinde.' },
  { id: 'perfect', e: '💎', t: 'Kusursuz', d: 'Hatasız bir oturum (10+ soru).' },
  { id: 'p10', e: '🧩', t: 'Kalıp ustası', d: '10 cümle kalıbı öğrendin.' },
  { id: 'weekly', e: '📅', t: 'Hafta mühürü', d: 'İlk haftalık pekiştirme.' },
  { id: 'ear', e: '👂', t: 'Keskin kulak', d: 'Ses çiftlerinde %80+ (30 tur).' },
  { id: 'sounds', e: '🗣️', t: 'Fonetik kaşif', d: 'Tüm IPA seslerini dinledin.' },
];

export function progressHTML() {
  const S = state();
  const xpAll = totalXP(), L = levelInfo(xpAll);
  const streak = currentStreak(), goal = dailyGoal();
  const m = masteryCounts();
  const learned = Object.keys(S.cards).filter(isLearned).length;
  const coreLearned = FREQ.filter(w => w.rank <= CORE && isLearned(w.id)).length;
  const t = todayKey();

  // Weekly report: this week vs last week
  const ws = weekStart(), lws = addDays(ws, -7);
  const sumRange = (start, n, f) => Array.from({ length: n }, (_, i) => f(addDays(start, i))).reduce((a, b) => a + b, 0);
  const actOf = k => S.act[k] || { rev: 0, ok: 0, nw: 0, ms: 0 };
  const thisW = { xp: sumRange(ws, 7, k => S.xp[k] || 0), rev: sumRange(ws, 7, k => actOf(k).rev), ok: sumRange(ws, 7, k => actOf(k).ok), nw: sumRange(ws, 7, k => actOf(k).nw), days: sumRange(ws, 7, k => (S.xp[k] ? 1 : 0)) };
  const lastW = { xp: sumRange(lws, 7, k => S.xp[k] || 0), nw: sumRange(lws, 7, k => actOf(k).nw) };
  const acc = thisW.rev ? Math.round(thisW.ok / thisW.rev * 100) : 0;
  const cmp = (a, b) => b === 0 ? '' : `<span class="cmp ${a >= b ? 'up' : 'down'}">${a >= b ? '▲' : '▼'} %${Math.abs(Math.round((a - b) / b * 100))}</span>`;

  // Last 7 days bar chart
  const days7 = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
  const max7 = Math.max(goal, ...days7.map(k => S.xp[k] || 0));
  const bars = days7.map(k => {
    const v = S.xp[k] || 0, d = new Date(k + 'T00:00:00');
    return `<div class="b ${v >= goal ? 'goal' : ''} ${k === t ? 'today' : ''}"><em>${v || ''}</em><i style="height:${Math.max(3, v / max7 * 100)}%"></i><span>${TR_DAYS[(d.getDay() + 6) % 7]}</span></div>`;
  }).join('');

  // Heatmap: 17 weeks
  const weeks = 17, start = addDays(ws, -7 * (weeks - 1));
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const k = addDays(start, i), v = S.xp[k] || 0;
    let c = k > t ? 'fut' : S.streak.frozen?.includes(k) ? 'fz' : v === 0 ? '' : v < goal * 0.5 ? 'l1' : v < goal ? 'l2' : v < goal * 2 ? 'l3' : 'l4';
    cells.push(`<i class="${c}" style="--d:${Math.floor(i / 7) + (i % 7)}" title="${k}: ${v} XP"></i>`);
  }
  const startD = new Date(start + 'T00:00:00');

  // Forgetting curve illustration (with vs without review)
  const curve = () => {
    const W = 320, H = 120, pts = (f) => Array.from({ length: 61 }, (_, i) => { const x = i / 60 * 30; return `${(x / 30 * W).toFixed(1)},${(H - f(x) * (H - 10)).toFixed(1)}`; }).join(' ');
    const noRev = x => Math.exp(-x / 2.2);
    const reviews = [0, 1, 3, 7, 16];
    const withRev = x => { let last = 0, s = 1.2; for (const r of reviews) if (x >= r) { last = r; s = 1.2 * Math.pow(2.4, reviews.indexOf(r)); } return Math.exp(-(x - last) / s); };
    return `<svg class="curve" viewBox="0 0 ${W} ${H + 18}" role="img" aria-label="Unutma eğrisi: tekrarsız hızla düşer, aralıklı tekrarla yüksek kalır">
      <polyline points="${pts(noRev)}" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-dasharray="4 4"/>
      <polyline points="${pts(withRev)}" fill="none" stroke="var(--coral)" stroke-width="3" stroke-linejoin="round"/>
      ${reviews.slice(1).map(r => `<circle cx="${r / 30 * W}" cy="10" r="4" fill="var(--coral)"/>`).join('')}
      <text x="0" y="${H + 16}" font-size="10" fill="var(--ink-3)">1. gün</text><text x="${W - 40}" y="${H + 16}" font-size="10" fill="var(--ink-3)">30. gün</text>
    </svg>`;
  };

  const soundsHeard = Object.keys(S.sounds).length;
  const patLearned = Object.keys(S.patterns).length;
  const lessonsDone = Object.keys(S.lessons).length;
  const totalCards = m.learning + m.young + m.mature || 1;

  return `
    <section class="hero">
      <div class="row gap">
        <div class="ring-wrap">${ring(L.pct, { size: 96, stroke: 11, track: 'rgba(255,255,255,.12)' })}<div class="ring-label"><div><span>Seviye</span><b>${L.lv}</b></div></div></div>
        <div class="grow" style="position:relative;z-index:1">
          <p class="eyebrow">Toplam</p>
          <p class="num" style="font-size:40px;line-height:1"><span data-c="${xpAll}">0</span> <span style="font-size:18px;opacity:.6">XP</span></p>
          <p class="small" style="opacity:.65">Sonraki seviyeye ${L.need - L.into} XP</p>
        </div>
      </div>
      <div class="stats3 mt" style="--card:rgba(255,255,255,.07)">
        <div class="stat" style="box-shadow:none"><b style="color:var(--coral)">🔥${streak}</b><span style="color:inherit;opacity:.6">günlük seri</span></div>
        <div class="stat" style="box-shadow:none"><b>${S.streak.best}</b><span style="color:inherit;opacity:.6">en uzun seri</span></div>
        <div class="stat" style="box-shadow:none"><b>❄️${S.streak.freezes}</b><span style="color:inherit;opacity:.6">dondurucu</span></div>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2 class="h3">Haftalık rapor</h2><span class="small faint">${thisW.days}/7 aktif gün</span></div>
      <div class="bento">
        <div class="card flat"><p class="eyebrow">XP</p><p class="num" style="font-size:32px;margin-top:6px">${thisW.xp}</p>${cmp(thisW.xp, lastW.xp)}</div>
        <div class="card flat"><p class="eyebrow">Yeni kelime</p><p class="num" style="font-size:32px;margin-top:6px">${thisW.nw}</p>${cmp(thisW.nw, lastW.nw)}</div>
        <div class="card flat"><p class="eyebrow">Cevap</p><p class="num" style="font-size:32px;margin-top:6px">${thisW.rev}</p></div>
        <div class="card flat"><p class="eyebrow">Doğruluk</p><p class="num" style="font-size:32px;margin-top:6px">%${acc}</p><p class="tiny faint">${acc >= 85 ? 'İdeal bölge 🎯' : acc >= 70 ? 'Sağlıklı zorluk' : thisW.rev ? 'Tekrarlara odaklan' : ''}</p></div>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2 class="h3">Son 7 gün</h2><span class="small faint">hedef ${goal} XP</span></div>
      <div class="card flat"><div class="chart-bars goal-line" style="--g:${goal / max7 * 128}px">${bars}</div></div>
    </section>

    <section class="section">
      <div class="section-head"><h2 class="h3">Aktivite</h2><span class="small faint">${TR_MONTHS[startD.getMonth()]} – bugün</span></div>
      <div class="card flat"><div class="heat">${cells.join('')}</div>
      <div class="legend mt-s"><span>Az</span><span class="heat-lg">${['', 'l1', 'l2', 'l3', 'l4'].map(c => `<i class="${c}"></i>`).join('')}</span><span>Çok</span><span>❄️ = dondurucu</span></div></div>
    </section>

    <section class="section">
      <div class="section-head"><h2 class="h3">Kelime hafızan</h2><span class="small faint">${learned} öğrenildi</span></div>
      <div class="card flat">
        <div class="stackbar"><i style="width:${m.mature / totalCards * 100}%;background:var(--ok)"></i><i style="width:${m.young / totalCards * 100}%;background:var(--sky)"></i><i style="width:${m.learning / totalCards * 100}%;background:var(--sun)"></i></div>
        <div class="legend mt-s"><span><i class="stage-dot mature"></i>Kalıcı ${m.mature}</span><span><i class="stage-dot young"></i>Pekişiyor ${m.young}</span><span><i class="stage-dot learning"></i>Öğreniliyor ${m.learning}</span><span>⏰ Bekleyen ${dueIds().length}</span></div>
        <div class="divider"></div>
        <div class="row between"><b>En çok kullanılan 1000</b><span class="small muted">${coreLearned}/${CORE}</span></div>
        <div class="bar lime mt-s"><i style="width:${coreLearned / CORE * 100}%"></i></div>
        <div class="row between mt"><b>Cümle kalıpları</b><span class="small muted">${patLearned}/${PATTERNS.length}</span></div>
        <div class="bar mt-s"><i style="width:${patLearned / PATTERNS.length * 100}%;background:var(--pink)"></i></div>
        <div class="row between mt"><b>IPA sesleri</b><span class="small muted">${soundsHeard}/${SOUNDS.length}</span></div>
        <div class="bar mt-s"><i style="width:${soundsHeard / SOUNDS.length * 100}%;background:var(--sun)"></i></div>
        <div class="row between mt"><b>Mini dersler</b><span class="small muted">${lessonsDone}/${LESSONS.length}</span></div>
        <div class="bar mt-s"><i style="width:${lessonsDone / LESSONS.length * 100}%;background:var(--violet)"></i></div>
      </div>
    </section>

    <section class="section">
      <div class="card flat">
        <p class="eyebrow">Neden tekrar ediyoruz?</p>
        <p class="h3" style="margin:6px 0 10px">Unutma eğrisini büküyoruz</p>
        ${curve()}
        <div class="legend mt-s"><span><i style="width:14px;border-top:2px dashed var(--ink-3);display:inline-block"></i>Tekrarsız</span><span><i style="width:14px;height:3px;background:var(--coral);display:inline-block"></i>Aralıklı tekrarla</span></div>
        <p class="muted small mt-s">Her başarılı tekrar, bir sonrakine kadar olan aralığı uzatır: 1 → 3 → 7 → 16 gün… Böylece daha az çalışıp daha çok hatırlarsın.</p>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2 class="h3">Rozetler</h2><span class="small faint">${Object.keys(S.badges).length}/${BADGES.length}</span></div>
      <div class="badges">${BADGES.map(b => `<div class="badge ${S.badges[b.id] ? '' : 'locked'}"><div class="e">${b.e}</div><b>${b.t}</b><span>${b.d}</span></div>`).join('')}</div>
    </section>`;
}
export function wireProgress(el) {
  const c = el.querySelector('[data-c]');
  if (c) countUp(c, +c.dataset.c);
  maybeTour('progress');
}

// Kullanıcı ilerlemesinden özet metrikler + "nerede takıldı" teşhis işaretleri
import { getContent, UNIT_SIZE } from './content.js';

const DAY = 864e5;
const dkey = d => { const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / DAY);

export function summarize(p) {
  if (!p || typeof p !== 'object') return null;
  const now = Date.now(), today = dkey(new Date());
  const cards = p.cards || {}, ids = Object.keys(cards);
  const xpMap = p.xp || {}, act = p.act || {};
  const days = Object.keys(xpMap).filter(k => xpMap[k] > 0).sort();
  let rev7 = 0, ok7 = 0, active7 = 0;
  for (let i = 0; i < 7; i++) {
    const k = dkey(new Date(now - i * DAY));
    if (act[k]) { rev7 += act[k].rev || 0; ok7 += act[k].ok || 0; }
    if (xpMap[k] > 0) active7++;
  }
  const st = p.streak || {};
  let streak = 0;
  if (st.last) { const gap = daysBetween(st.last, today); streak = gap <= 1 || gap - 1 <= (st.freezes || 0) ? st.count || 0 : 0; }
  const learnedSet = new Set(ids.filter(id => (cards[id].i || 0) >= 1));
  // current frequency unit = first unit not fully learned
  let unit = null;
  const freq = getContent('freq') || [];
  for (let i = 0; i < freq.length; i += UNIT_SIZE) {
    const slice = freq.slice(i, i + UNIT_SIZE);
    const l = slice.filter(w => learnedSet.has(w.en.toLowerCase())).length;
    if (l < slice.length) { unit = { n: i / UNIT_SIZE + 1, learned: l, total: slice.length }; break; }
  }
  const hard = ids.filter(id => (cards[id].l || 0) > 0).sort((a, b) => cards[b].l - cards[a].l).slice(0, 8).map(id => [id, cards[id].l]);
  return {
    xp: Object.values(xpMap).reduce((a, b) => a + (b || 0), 0),
    xpToday: xpMap[today] || 0,
    streak, best: st.best || 0, freezes: st.freezes || 0,
    cards: ids.length, learned: learnedSet.size,
    mature: ids.filter(id => (cards[id].i || 0) >= 21).length,
    lapses: ids.reduce((a, id) => a + (cards[id].l || 0), 0),
    due: ids.filter(id => cards[id].d <= now).length,
    rev7, acc7: rev7 ? Math.round(ok7 / rev7 * 100) : null, active7,
    activeDays: days.length, firstDay: days[0] || null, lastDay: days[days.length - 1] || null,
    patterns: Object.keys(p.patterns || {}).length,
    lessons: Object.keys(p.lessons || {}).length,
    sounds: Object.keys(p.sounds || {}).length,
    pairs: p.pairs || { ok: 0, n: 0 },
    badges: Object.keys(p.badges || {}).length,
    weeklies: Object.keys(p.weekly || {}).length,
    tours: Object.keys(p.tours || {}).length,
    onboarded: !!p.profile, intro: !!p.introDone,
    profile: p.profile ? { level: p.profile.level, goal: p.profile.goal, track: p.profile.track, accent: p.profile.accent, cue: p.profile.cue, dailyNew: p.profile.dailyNew } : null,
    unit, hard,
    history: days.slice(-120).map(k => [k, xpMap[k]]),
  };
}

// Diagnostic flags: where is this learner stuck?
export function flags(u, s, extra = {}) {
  const f = [];
  const now = Date.now();
  if (!u.verified) f.push(['warn', 'E-posta doğrulanmadı']);
  if (u.verified && !s?.onboarded) f.push(['warn', 'Kurulumu tamamlamadı']);
  if (s?.onboarded && !s.xp) f.push(['warn', 'Hiç pratik yapmadı']);
  if (s?.due > 60) f.push(['bad', `${s.due} tekrar birikti`]);
  if (s?.acc7 !== null && s?.acc7 < 60 && s?.rev7 >= 20) f.push(['bad', `Düşük doğruluk %${s.acc7}`]);
  if (extra.abandon >= 0.4 && extra.started >= 3) f.push(['bad', `Oturumların %${Math.round(extra.abandon * 100)}'ini yarıda bırakıyor`]);
  if (s?.lastDay) {
    const idle = Math.round((now - new Date(s.lastDay + 'T12:00:00')) / DAY);
    if (idle >= 7) f.push(['bad', `${idle} gündür yok`]); else if (idle >= 3) f.push(['warn', `${idle} gündür yok`]);
  }
  if (s?.unit && s.unit.learned === 0 && s.cards > 60) f.push(['warn', `Ünite ${s.unit.n}'e başlamadı`]);
  if (extra.paywall >= 3 && !extra.premium) f.push(['info', `Premium duvarını ${extra.paywall} kez gördü`]);
  if (extra.requested && !extra.premium) f.push(['hot', 'Premium istedi']);
  if (s?.streak >= 7) f.push(['good', `🔥 ${s.streak} gün seri`]);
  return f;
}

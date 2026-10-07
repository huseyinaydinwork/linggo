// Linggo — kullanıcı durumu: yerel önbellek (localStorage) + sunucu senkronu,
// seri/XP/aktivite takibi, aralıklı tekrar (SM-2 türevi) ve analitik olayları
import { api } from './api.js';

let KEY = 'pratilange:guest';
export const DAY = 864e5;

export function dateKey(d = new Date()) {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export const todayKey = () => dateKey(new Date());
export function daysBetween(a, b) {
  const pa = new Date(a + 'T00:00:00'), pb = new Date(b + 'T00:00:00');
  return Math.round((pb - pa) / DAY);
}
export function addDays(key, n) {
  const d = new Date(key + 'T00:00:00'); d.setDate(d.getDate() + n); return dateKey(d);
}
// Monday-based week start key
export function weekStart(d = new Date()) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return dateKey(x);
}

const defaults = () => ({
  v: 1,
  profile: null,
  cards: {},        // wordId -> { e, i, d, r, l, s, t }
  xp: {},           // dateKey -> xp
  act: {},          // dateKey -> { rev, ok, nw, ms }
  streak: { count: 0, best: 0, last: null, freezes: 1, frozen: [] },
  dayWords: { date: null, ids: [] },
  patterns: {},     // patternId -> { lv, last, due }
  sounds: {},       // soundId -> heard count
  soundSkill: {},   // soundId -> 0..100 mastery from sound practice
  lessons: {},      // lessonId -> ts
  pairs: { ok: 0, n: 0 },
  weekly: {},       // weekStart -> ts completed
  badges: {},
  tours: {},        // module -> ts (first-visit walkthrough seen)
  introDone: 0,     // Pip introduction after sign-up
  daily: { date: null }, // per-day counters (e.g. free pairs games)
  settings: { theme: 'dark', rate: 1, sound: true, haptics: true, trSubs: true },
  _at: 0,           // last local modification (sync clock)
});

const normalize = raw => {
  const s = Object.assign(defaults(), raw || {});
  s.settings = Object.assign(defaults().settings, s.settings || {});
  // brand v5 is night-first: move 'system' users to the signature dark look once (they can switch back)
  if (!s.settings.b5) { if (s.settings.theme === 'auto') s.settings.theme = 'dark'; s.settings.b5 = 1; }
  return s;
};
const readLocal = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };

let S = defaults();
let synced = false;
const subs = new Set();
export const state = () => S;
export const subscribe = f => (subs.add(f), () => subs.delete(f));

// Called after login with the server copy; newest copy wins
export function initStore(user, serverProgress, serverAt = 0) {
  KEY = `pratilange:u:${user.id}`;
  const local = readLocal();
  if (local && (local._at || 0) > serverAt) { S = normalize(local); synced = true; pushNow(); }
  else { S = normalize(serverProgress); S._at = serverAt || 0; synced = true; writeLocal(); }
  subs.forEach(f => f(S));
}
export function clearStore() { S = defaults(); synced = false; KEY = 'pratilange:guest'; }

function writeLocal() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage full / private */ } }

let pushTimer = null, pushing = false, dirty = false;
export function save() {
  S._at = Date.now();
  writeLocal();
  subs.forEach(f => f(S));
  if (!synced) return;
  dirty = true;
  clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, 1800);
}
async function pushNow(keepalive = false) {
  if (!synced || pushing) return;
  pushing = true; dirty = false;
  try { await api('/api/progress', { method: 'PUT', body: { progress: S, at: S._at }, keepalive }); }
  catch (e) {
    if (e.status === 409 && e.data?.progress) { S = normalize(e.data.progress); S._at = e.data.at; writeLocal(); subs.forEach(f => f(S)); }
    else dirty = true; // offline → retry later
  } finally { pushing = false; }
}
export const flush = () => { if (dirty) pushNow(true); flushEvents(true); };
// Wait until the server has our latest progress (rewards are verified against it)
export async function syncNow() {
  clearTimeout(pushTimer);
  for (let i = 0; pushing && i < 50; i++) await new Promise(r => setTimeout(r, 120));
  if (dirty) await pushNow();
}
window.addEventListener('online', () => { if (dirty) pushNow(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
setInterval(() => { if (dirty) pushNow(); }, 30e3);

// ---------- analytics events (batched)
let queue = [];
export function track(type, data) {
  queue.push({ type, data, ts: Date.now() });
  if (queue.length >= 20) flushEvents();
}
async function flushEvents(keepalive = false) {
  if (!queue.length || !synced) return;
  const batch = queue; queue = [];
  try { await api('/api/events', { method: 'POST', body: { events: batch }, keepalive }); }
  catch { queue = batch.concat(queue).slice(-200); }
}
setInterval(flushEvents, 12e3);

// ---------- tours, intro, daily counters
export const tourSeen = m => !!S.tours?.[m];
export function markTour(m) { (S.tours ||= {})[m] = Date.now(); save(); }
export function markIntro() { S.introDone = Date.now(); save(); }
export function dailyCount(k) { return S.daily?.date === todayKey() ? S.daily[k] || 0 : 0; }
// id (optional): remembers which item used today's quota, so reopening it the same day stays free
export function bumpDaily(k, id) {
  if (S.daily?.date !== todayKey()) S.daily = { date: todayKey() };
  if (id != null) { const ids = (S.daily[k + ':ids'] ||= []); if (ids.includes(id)) return; ids.push(id); }
  S.daily[k] = (S.daily[k] || 0) + 1; save();
}
export const dailyIds = k => (S.daily?.date === todayKey() && S.daily[k + ':ids']) || [];
export const dailyHas = (k, id) => dailyIds(k).includes(id);

// ---------- profile
export function setProfile(p) { S.profile = { ...(S.profile || {}), ...p }; save(); }
export const profile = () => S.profile;
export const settings = () => S.settings;
export function setSetting(k, v) { S.settings[k] = v; save(); }
export const accentLang = () => (S.profile?.accent === 'uk' ? 'en-GB' : 'en-US');

// ---------- XP, streak, activity
function act(key = todayKey()) { return (S.act[key] ||= { rev: 0, ok: 0, nw: 0, ms: 0 }); }

export function touchStreak() {
  // Called when the learner earns XP today.
  const t = todayKey(), st = S.streak;
  if (st.last === t) return { changed: false };
  let usedFreeze = false;
  if (!st.last) st.count = 1;
  else {
    const gap = daysBetween(st.last, t);
    if (gap === 1) st.count += 1;
    else if (gap > 1 && gap - 1 <= st.freezes) {
      // Streak freeze covers missed days (prevents the "what-the-hell" effect)
      for (let i = 1; i < gap; i++) st.frozen.push(addDays(st.last, i));
      st.freezes -= gap - 1; st.count += 1; usedFreeze = true;
    } else st.count = 1;
  }
  st.last = t;
  st.best = Math.max(st.best, st.count);
  // Earn a freeze every 7 days (max 2)
  if (st.count % 7 === 0 && st.freezes < 2) st.freezes += 1;
  return { changed: true, usedFreeze, count: st.count };
}

export function currentStreak() {
  const st = S.streak; if (!st.last) return 0;
  const gap = daysBetween(st.last, todayKey());
  if (gap <= 1) return st.count;
  if (gap - 1 <= st.freezes) return st.count; // still rescuable
  return 0;
}

export function addXP(n) {
  const t = todayKey();
  const before = S.xp[t] || 0;
  S.xp[t] = before + n;
  const s = touchStreak();
  save();
  const goal = dailyGoal();
  return { xp: S.xp[t], goalReached: before < goal && S.xp[t] >= goal, streak: s };
}
export const todayXP = () => S.xp[todayKey()] || 0;
export const dailyGoal = () => S.profile?.goal || 50;
export const totalXP = () => Object.values(S.xp).reduce((a, b) => a + b, 0);

export function logAnswer(correct, ms = 0) {
  const a = act(); a.rev++; if (correct) a.ok++; a.ms += Math.min(ms, 30000); save();
}
export function logNewWord() { act().nw++; save(); }

// Level curve: each level needs a bit more XP (goal-gradient friendly: early levels come fast)
export function levelInfo(xp = totalXP()) {
  let lv = 1, need = 100, acc = 0;
  while (xp >= acc + need) { acc += need; lv++; need = Math.round(need * 1.18); }
  return { lv, into: xp - acc, need, pct: (xp - acc) / need };
}

// ---------- Spaced repetition (SM-2 variant with learning steps)
// grade: 0 again · 1 hard · 2 good · 3 easy
export function review(id, grade, now = Date.now()) {
  const c = S.cards[id] ? { ...S.cards[id] } : { e: 2.5, i: 0, r: 0, l: 0, s: now };
  if (grade === 0) {
    c.l++; c.r = 0; c.i = 0; c.e = Math.max(1.3, c.e - 0.2);
    c.d = now + 10 * 60e3;
  } else {
    if (c.r === 0) c.i = [0, 0.4, 1, 3][grade];
    else if (c.r === 1) c.i = [0, 2, 3, 6][grade];
    else c.i = c.i * [0, 1.2, c.e, c.e * 1.3][grade];
    c.e = Math.min(3.2, Math.max(1.3, c.e + [0, -0.15, 0, 0.15][grade]));
    c.i = Math.min(365, c.i);
    c.r++;
    // light fuzz so reviews don't clump on the same day
    const fuzz = c.i >= 3 ? 1 + (Math.random() * 0.1 - 0.05) : 1;
    c.d = now + c.i * fuzz * DAY;
  }
  c.t = now;
  if (!S.cards[id]) logNewWord();
  S.cards[id] = c; save();
  return c;
}
export const card = id => S.cards[id];
export function stageOf(id) {
  const c = S.cards[id];
  if (!c) return 'new';
  if (c.i < 1) return 'learning';
  if (c.i < 21) return 'young';
  return 'mature';
}
export const isLearned = id => (S.cards[id]?.i || 0) >= 1;
export function dueIds(now = Date.now()) {
  return Object.entries(S.cards).filter(([, c]) => c.d <= now).sort((a, b) => a[1].d - b[1].d).map(([id]) => id);
}
export function masteryCounts() {
  const m = { learning: 0, young: 0, mature: 0 };
  for (const id in S.cards) m[stageOf(id)]++;
  return m;
}
// Estimated recall probability now (exponential forgetting curve)
export function retention(id, now = Date.now()) {
  const c = S.cards[id]; if (!c) return 0;
  const stability = Math.max(0.2, c.i || 0.2);
  const elapsed = (now - c.t) / DAY;
  return Math.exp(Math.log(0.9) * elapsed / stability);
}

// ---------- patterns (simple expanding schedule 1 → 3 → 7 → 16 days)
export function patternDone(id) {
  const p = S.patterns[id] || { lv: 0 };
  p.lv = Math.min(4, p.lv + 1); p.last = Date.now();
  p.due = Date.now() + [1, 1, 3, 7, 16][p.lv] * DAY;
  S.patterns[id] = p; save();
}
export const patternDue = () => Object.entries(S.patterns).filter(([, p]) => p.due <= Date.now()).map(([id]) => id);

// ---------- misc
export function markSound(id) { S.sounds[id] = (S.sounds[id] || 0) + 1; save(); }
export function markLesson(id) { S.lessons[id] = Date.now(); save(); }
export function logPair(ok) { S.pairs.n++; if (ok) S.pairs.ok++; save(); }
export function setDayWords(ids, round = 1) { S.dayWords = { date: todayKey(), ids, round }; save(); }
export const dayWordsRound = () => (S.dayWords.date === todayKey() ? S.dayWords.round || 1 : 0);
export const soundSkill = id => S.soundSkill?.[id] || 0;
export function addSoundSkill(id, d) { (S.soundSkill ||= {})[id] = Math.max(0, Math.min(100, (S.soundSkill[id] || 0) + d)); save(); return S.soundSkill[id]; }
export function activeDaysThisWeek() { const ws = weekStart(); let n = 0; for (let i = 0; i < 7; i++) if ((S.xp[addDays(ws, i)] || 0) > 0) n++; return n; }
export function markWeekly() { S.weekly[weekStart()] = Date.now(); save(); }
export const weeklyDone = () => !!S.weekly[weekStart()];

export function awardBadge(id) {
  if (S.badges[id]) return false;
  S.badges[id] = Date.now(); save(); return true;
}

export function resetAll() { S = defaults(); save(); }
export function exportJSON() { return JSON.stringify(S); }
export function importJSON(txt) {
  const data = JSON.parse(txt);
  if (!data || typeof data !== 'object' || !('cards' in data)) throw new Error('Geçersiz dosya');
  S = Object.assign(defaults(), data); save();
}

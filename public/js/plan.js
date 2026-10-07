// Oturum planlayıcı: aralıklı tekrar + yeni kelimeler + serpiştirme (interleaving) + zorluk kademelendirme
import { FREQ, LIFE, THEMES, UNITS, getWord, lookup } from './data/words.js';
import { PATTERNS, getPattern } from './data/patterns.js';
import { MIN_PAIRS, SOUNDS, getSound } from './data/phonetics.js';
import { state, card, dueIds, todayKey, setDayWords, profile, weekStart, patternDue, retention, dayWordsRound, soundSkill } from './store.js';
import { canListen } from './speech.js';
import { levelInfo, limitOf, featOn } from './content.js';
import { shuffle, sample } from './ui.js';

const pick = a => a[(Math.random() * a.length) | 0];
export const trackList = () => (profile()?.track === 'life' ? 'life' : 'freq');
export const trackWords = () => (trackList() === 'life' ? LIFE : FREQ);

export function nextNewWords(n, pool = trackWords()) {
  const S = state();
  let ordered = pool;
  if (pool === FREQ) {
    // level units first, then everything after them, then earlier units (review of basics)
    const units = levelInfo()?.units || [];
    const first = Math.min(...units, 999);
    ordered = [...pool.filter(w => units.includes(w.unit)), ...pool.filter(w => !units.includes(w.unit) && w.unit > first), ...pool.filter(w => w.unit < first)];
  } else if (pool === LIFE) {
    const th = levelInfo()?.themes || [];
    ordered = [...pool.filter(w => th.includes(w.theme)), ...pool.filter(w => !th.includes(w.theme))];
  }
  const out = [], seen = new Set();
  for (const w of ordered) {
    if (out.length >= n) break;
    if (!S.cards[w.id] && !seen.has(w.id)) { seen.add(w.id); out.push(w); }
  }
  return out;
}

// "Günün kelimeleri": fixed per day so the learner sees a stable, finishable set (goal-gradient)
export function todaysWords() {
  const S = state(); const n = Math.min(profile()?.dailyNew || levelInfo()?.dailyNew || 8, limitOf('dailyNewMax')); const list = trackList();
  if (S.dayWords.date === todayKey() && S.dayWords.ids.length) return S.dayWords.ids.map(id => lookup(id, list)).filter(Boolean);
  const ws = nextNewWords(n); setDayWords(ws.map(w => w.id)); return ws;
}
const dayCount = () => Math.min(profile()?.dailyNew || levelInfo()?.dailyNew || 8, limitOf('dailyNewMax'));
// "Günün kelimeleri" sets: when today's set is learned the learner may take another one (limit set per plan in the admin panel)
export function roundsInfo() {
  const words = todaysWords(), done = words.length > 0 && words.every(w => card(w.id));
  const used = Math.max(1, dayWordsRound()), max = limitOf('dayWordsRounds');
  const more = nextNewWords(1).length > 0;
  return { done, used, max, canMore: done && more && used < max, limitHit: done && more && used >= max };
}
export function newRound() {
  const r = roundsInfo(); if (!r.canMore) return false;
  const ws = nextNewWords(dayCount()); if (!ws.length) return false;
  setDayWords(ws.map(w => w.id), r.used + 1); return true;
}

// Desirable difficulty: recognition → recall → production as the memory strengthens
export function exerciseFor(w) {
  const i = card(w.id)?.i || 0;
  const multi = w.en.includes(' ') || w.en.length > 12;
  if (i < 2) return pick(['mcq_en', 'mcq_en', 'listen']);
  const ipa = featOn('ipaDrill') && (w.us || w.uk) && !multi ? ['ipa_read'] : [];
  const speak = canListen && featOn('speech') ? ['speak'] : [];
  if (i < 7) return pick(['mcq_tr', 'listen', 'mcq_en', multi ? 'mcq_tr' : 'type', ...ipa]);
  return pick(multi ? ['mcq_tr', 'listen'] : ['type', 'type', 'mcq_tr', 'listen', ...speak, ...ipa]);
}

export function distractors(w, n = 3, field = 'tr') {
  const pool = w.list === 'life' ? LIFE : FREQ;
  let near = w.pos ? pool.filter(x => x.pos === w.pos) : w.theme ? pool.filter(x => x.theme === w.theme) : pool;
  if (near.length < 12) near = pool;
  const used = new Set([w[field].toLowerCase()]), out = [];
  for (const x of shuffle(near)) {
    if (out.length >= n) break;
    const v = x[field].toLowerCase();
    if (x.id !== w.id && !used.has(v)) { used.add(v); out.push(x); }
  }
  return out;
}

function mix(reviews, news, title, sub) {
  const rv = shuffle(reviews).map(w => ({ type: exerciseFor(w), w, srs: true }));
  const out = []; let pending = null, r = 0;
  // intro A · intro B · test A · review · intro C · test B … (spacing inside the session)
  for (const w of news) {
    out.push({ type: 'intro', w });
    if (pending) out.push(pending);
    pending = { type: 'mcq_en', w, srs: true, isNew: true };
    if (r < rv.length) out.push(rv[r++]);
  }
  if (pending) out.push(pending);
  while (r < rv.length) out.push(rv[r++]);
  // consolidation: one more retrieval of each new word through a different channel (listening)
  for (const w of shuffle(news)) out.push({ type: 'listen', w, srs: false });
  return { title, sub, tasks: out, newIds: news.map(w => w.id) };
}

const dueWords = (limit = 40, filter) => dueIds().map(id => getWord(id)).filter(w => w && (!filter || filter(w))).slice(0, limit);

export function buildPlan(kind, arg) {
  switch (kind) {
    case 'daily': {
      const due = dueWords(30);
      const fresh = todaysWords().filter(w => !card(w.id));
      let n = fresh.length;
      // Protect against overload: many reviews → fewer new words (cognitive load)
      if (due.length > 25) n = Math.min(n, 2); else if (due.length > 15) n = Math.ceil(n / 2);
      return mix(due, fresh.slice(0, n), 'Günlük Pratik', 'Tekrarlar + günün kelimeleri');
    }
    case 'review': {
      let due = dueWords(40);
      if (!due.length) {
        // nothing due → strengthen the weakest memories (lowest predicted recall)
        due = Object.keys(state().cards).map(getWord).filter(Boolean)
          .sort((a, b) => retention(a.id) - retention(b.id)).slice(0, 12);
      }
      return mix(due, [], 'Pekiştirme', 'Unutmak üzere olduğun kelimeler');
    }
    case 'unit': {
      const u = UNITS.find(x => x.id === arg); if (!u) return null;
      const ids = new Set(u.words.map(w => w.id));
      const fresh = nextNewWords(8, u.words);
      return mix(dueWords(15, w => ids.has(w.id)), fresh, `Ünite ${u.n}`, `${u.from}–${u.to}. kelimeler`);
    }
    case 'theme': {
      const t = THEMES.find(x => x.id === arg); if (!t) return null;
      const ids = new Set(t.words.map(w => w.id));
      const fresh = nextNewWords(8, t.words);
      return mix(dueWords(15, w => ids.has(w.id)).map(w => lookup(w.id, 'life')), fresh, t.title, `${t.emoji} Tema`);
    }
    case 'weekly': {
      const ws = weekStart(); const t0 = new Date(ws + 'T00:00:00').getTime();
      const cards = state().cards;
      let ids = Object.keys(cards).filter(id => cards[id].s >= t0);
      if (ids.length < 6) ids = Object.keys(cards).filter(id => cards[id].s >= t0 - 7 * 864e5);
      if (ids.length < 6) ids = Object.keys(cards);
      const ws2 = sample(ids, 20).map(getWord).filter(Boolean);
      const tasks = ws2.map(w => ({ type: pick(w.en.includes(' ') ? ['mcq_tr', 'listen'] : ['type', 'mcq_tr', 'listen']), w, srs: 'fail' }));
      // plus one pattern refresh
      const learnedP = Object.keys(state().patterns);
      const openP = id => { const p = getPattern(id); return p && !p.locked ? p : null; };
      for (const id of sample(learnedP.filter(openP), 2)) tasks.push(...patternTasks(getPattern(id), 1));
      return { title: 'Haftalık Pekiştirme', sub: 'Bu hafta öğrendiklerin', tasks: shuffle(tasks), weekly: true };
    }
    case 'pattern': {
      const p = getPattern(arg); if (!p || p.locked) return null;
      return { title: p.pattern, sub: 'Kalıp pratiği', tasks: patternTasks(p), patternId: p.id };
    }
    case 'patterns': {
      const ids = patternDue().filter(id => { const p = getPattern(id); return p && !p.locked; });
      const tasks = ids.flatMap(id => patternTasks(getPattern(id), 1));
      return { title: 'Kalıp Tekrarı', sub: 'Zamanı gelen kalıplar', tasks: shuffle(tasks), patternIds: ids };
    }
    case 'sound': {
      const s = getSound(arg); if (!s) return null;
      return { title: `/${s.us && profile()?.accent !== 'uk' ? s.us : s.ipa}/ sesi`, sub: 'Ses alıştırması', tasks: soundTasks(s), soundId: s.id };
    }
    case 'pairs': {
      const tasks = sample(MIN_PAIRS, 12).map(p => ({ type: 'pair', p, target: Math.random() < 0.5 ? 0 : 1 }));
      return { title: 'Ses Çiftleri', sub: 'Kulağını eğit', tasks, pairs: true };
    }
    case 'words': {
      const ids = (arg || '').split(',').filter(Boolean);
      const ws = ids.map(id => getWord(id)).filter(Boolean);
      const fresh = ws.filter(w => !card(w.id)), seen = ws.filter(w => card(w.id));
      return mix(seen, fresh, 'Seçili kelimeler', `${ws.length} kelime`);
    }
  }
  return null;
}

// Sound practice: learn (mouth + tip) → hear it → find it → contrast it (minimal pairs) → say it
export function soundTasks(s) {
  const skill = soundSkill(s.id), words = s.words.slice(0, 6);
  const sym = (s.us && profile()?.accent !== 'uk' ? s.us : s.ipa);
  const others = SOUNDS.filter(x => x.id !== s.id && (x.group === s.group || Math.random() < 0.3)).flatMap(x => x.words.slice(0, 3));
  const tasks = [];
  if (skill < 60) tasks.push({ type: 'sound_intro', s });
  for (const w of sample(words, 3)) tasks.push({ type: 'sound_pick', s, target: w, opts: shuffle([w, ...sample(others.filter(o => o !== w), 2)]) });
  for (const w of sample(words, 2)) tasks.push({ type: 'sound_find', s, target: w, opts: shuffle([w, ...sample(others.filter(o => !words.includes(o)), 3)]) });
  const pairs = MIN_PAIRS.filter(p => [s.ipa, s.us, sym].filter(Boolean).some(x => p[1].includes(x) || p[3].includes(x) || p[4].includes(x)));
  for (const p of sample(pairs, 3)) tasks.push({ type: 'pair', p, target: Math.random() < 0.5 ? 0 : 1 });
  for (const w of sample(words, 2)) tasks.push({ type: 'speak_s', e: [w, `/${sym}/ sesine dikkat et`] });
  return tasks;
}

export function patternTasks(p, reps = 0) {
  const ex = p.ex;
  if (reps) { const e = pick(ex); return [{ type: pick(['fill', 'build']), p, e }]; }
  return [
    { type: 'fill', p, e: ex[0] },
    { type: 'build', p, e: ex[0] },
    { type: 'fill', p, e: ex[1] },
    { type: 'build', p, e: ex[1] },
    { type: 'build', p, e: ex[2] },
    { type: 'speak_s', p, e: ex[2] },
  ];
}

export function fillOptions(p) {
  const same = PATTERNS.filter(x => x.id !== p.id && x.cat === p.cat).map(x => x.key);
  const other = shuffle(PATTERNS.filter(x => x.id !== p.id && x.cat !== p.cat).map(x => x.key));
  const opts = [...new Set([...shuffle(same), ...other])].filter(k => k.toLowerCase() !== p.key.toLowerCase()).slice(0, 3);
  return shuffle([p.key, ...opts]);
}

export function sessionPreview() {
  const due = dueIds().length;
  const fresh = todaysWords().filter(w => !card(w.id)).length;
  let n = fresh; if (due > 25) n = Math.min(n, 2); else if (due > 15) n = Math.ceil(n / 2);
  const tasks = Math.min(due, 30) + n * 3;
  return { due, fresh: n, mins: Math.max(1, Math.round(tasks * 0.2)) };
}

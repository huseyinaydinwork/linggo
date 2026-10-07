// Ses motoru: 1) sunucu (Azure/Google/ElevenLabs, önbellekli) → 2) cihazın en iyi sesi (ABD / İngiliz / Türkçe)
// + konuşma tanıma ve benzerlik puanı
import { settings, accentLang } from './store.js';

const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
let voices = [];
const norm = l => (l || '').replace('_', '-').toLowerCase();
function refresh() { if (synth) voices = synth.getVoices(); }
if (synth) { refresh(); synth.addEventListener?.('voiceschanged', refresh); }

// Name hints: natural/neural voices first, then well-known good voices per locale
const PREF = {
  'en-us': ['natural', 'neural', 'google us', 'samantha', 'ava', 'allison', 'aria', 'jenny', 'guy', 'zira', 'premium', 'enhanced'],
  'en-gb': ['natural', 'neural', 'google uk', 'sonia', 'libby', 'ryan', 'daniel', 'serena', 'kate', 'arthur', 'martha', 'hazel', 'george', 'susan', 'premium', 'enhanced'],
  'tr-tr': ['natural', 'neural', 'emel', 'ahmet', 'google', 'yelda', 'tolga', 'filiz', 'premium', 'enhanced'],
};
function score(v, L) {
  const n = v.name.toLowerCase(); let s = 0;
  (PREF[L] || []).forEach((p, i) => { if (n.includes(p)) s += 50 - i; });
  if (n.includes('compact') || n.includes('eloquence')) s -= 30;
  if (!v.localService) s += 3; // cloud voices are usually better
  return s;
}
export function voicesFor(lang) {
  const L = lang.toLowerCase();
  return voices.filter(v => norm(v.lang) === L).sort((a, b) => score(b, L) - score(a, L));
}
export function voiceFor(lang) {
  const chosen = settings().voices?.[lang];
  if (chosen) { const v = voices.find(x => x.name === chosen); if (v) return v; }
  const exact = voicesFor(lang);
  if (exact.length) return exact[0];
  // British/US fallback by name when locale tags are missing (some Android builds)
  if (lang === 'en-GB') return voices.find(v => /uk|brit|england|daniel|serena|kate|libby|sonia/i.test(v.name) && norm(v.lang).startsWith('en')) || null;
  return null;
}
export const hasVoice = lang => voices.some(v => norm(v.lang) === lang.toLowerCase());
export const hasTTS = !!synth;

// ---------- server TTS (high quality) ----------
let serverOff = false;         // becomes true when the server has no TTS provider (204)
let serverAllowed = () => true; // set by app (plan feature hqVoice)
export const setServerAllowed = f => { serverAllowed = f; };
const audio = typeof Audio !== 'undefined' ? new Audio() : null;
const blobs = new Map();
// iOS: unlock the shared <audio> element on the first user gesture so later plays are allowed
if (audio) {
  const unlock = () => {
    audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    audio.play().catch(() => { });
    removeEventListener('pointerdown', unlock, true);
  };
  addEventListener('pointerdown', unlock, true);
}
async function serverAudio(text, lang) {
  const k = lang + '|' + text;
  if (blobs.has(k)) return blobs.get(k);
  const r = await fetch(`/api/tts?l=${encodeURIComponent(lang)}&t=${encodeURIComponent(text)}`, { credentials: 'same-origin' });
  if (r.status === 204) { serverOff = true; return null; }
  if (!r.ok) return null;
  const url = URL.createObjectURL(await r.blob());
  blobs.set(k, url);
  if (blobs.size > 300) { const [first] = blobs.keys(); URL.revokeObjectURL(blobs.get(first)); blobs.delete(first); }
  return url;
}
function playUrl(url, rate, my) {
  return new Promise(res => {
    let done = false; const fin = ok => { if (!done) { done = true; clearTimeout(tm); res(ok && my === seq); } };
    audio.onended = () => fin(true); audio.onerror = () => fin(false);
    audio.src = url; audio.playbackRate = rate; audio.preservesPitch = true;
    const tm = setTimeout(() => fin(true), 20000);
    audio.play().catch(() => fin(false));
  });
}

// ---------- public API ----------
let seq = 0;
export function speak(text, { lang, rate, accent } = {}) {
  lang = lang || (accent ? (accent === 'uk' ? 'en-GB' : 'en-US') : accentLang());
  rate = rate ?? settings().rate ?? 1;
  if (!text) return Promise.resolve(false);
  const my = ++seq;
  synth?.cancel(); audio?.pause();
  return (async () => {
    if (audio && !serverOff && serverAllowed()) {
      try {
        const url = await serverAudio(text, lang);
        if (my !== seq) return false;
        if (url) return playUrl(url, rate, my);
      } catch { }
    }
    return browserSpeak(text, lang, rate, my);
  })();
}
function browserSpeak(text, lang, rate, my) {
  return new Promise(res => {
    if (!synth) return res(false);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const v = voiceFor(lang); if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = rate; u.pitch = 1;
    let done = false;
    const fin = () => { if (!done) { done = true; clearTimeout(tm); res(my === seq); } };
    u.onend = fin; u.onerror = fin;
    const tm = setTimeout(fin, 2500 + text.length * 110 / rate);
    setTimeout(() => { if (my === seq) synth.speak(u); }, 40); // Chrome drops utterances queued right after cancel()
  });
}
// Natural narration: sentence by sentence with short breaths between them
export async function narrate(text, { lang = 'tr-TR', rate = 1, onSentence } = {}) {
  const my = seq + 1;
  const parts = text.match(/[^.!?…]+[.!?…]*\s*/g) || [text];
  for (const [i, p] of parts.entries()) {
    onSentence?.(i);
    const ok = await speak(p.trim(), { lang, rate });
    if (!ok || seq !== my + i) return false;
    await new Promise(r => setTimeout(r, 160));
  }
  return true;
}
export function stopSpeaking() { seq++; synth?.cancel(); try { audio?.pause(); } catch { } }
// Is a good voice available for this language (server or device)?
export const voiceStatus = lang => ({ server: !serverOff && serverAllowed(), device: !!voiceFor(lang) });

// ---------- Speech recognition ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = !!SR && window.isSecureContext;

export function listen(lang = accentLang()) {
  return new Promise((resolve, reject) => {
    if (!canListen) return reject(new Error('unsupported'));
    stopSpeaking();
    const r = new SR();
    r.lang = lang; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
    let got = false;
    r.onresult = e => { got = true; resolve([...e.results[0]].map(a => a.transcript)); };
    r.onerror = e => { if (!got) reject(new Error(e.error || 'error')); };
    r.onend = () => { if (!got) resolve([]); };
    try { r.start(); } catch (err) { reject(err); }
    setTimeout(() => { try { r.stop(); } catch { } }, 7000);
  });
}

const clean = s => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim();
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
export function similarity(a, b) {
  a = clean(a); b = clean(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  return 1 - lev(a, b) / Math.max(a.length, b.length);
}
export function bestMatch(alts, target) {
  let best = { text: alts[0] || '', score: 0 };
  for (const t of alts) { const s = similarity(t, target); if (s > best.score) best = { text: t, score: s }; }
  return best;
}
export { lev as levenshtein };

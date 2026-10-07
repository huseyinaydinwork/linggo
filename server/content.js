// İçerik deposu: veritabanındaki JSON dokümanları + tohumlama/taşıma + plana & seviyeye göre filtreleme + doğrulama
import { q, adminLog } from './db.js';
import * as W from './seed/words.js';
import * as P from './seed/patterns.js';
import * as F from './seed/phonetics.js';
import { IPA } from './seed/ipa.js';
import { FEATURES, DEFAULT_PLANS, DEFAULT_LEVELS, DEFAULT_MARKET, DEFAULT_EMAILS, DEFAULT_VOICE, DEFAULT_REWARDS, DEFAULT_DROPS } from './seed/extras.js';
import { diffContent, summaryText, trimDiff } from './transfer.js';

export { FEATURES };
export const DEFAULT_SETTINGS = {
  whatsapp: '905075973367',
  whatsappText: 'Merhaba! Linggo Premium\'a geçmek istiyorum. Hesabım: {email}',
  priceNote: 'Online ödeme çok yakında. Şimdilik WhatsApp üzerinden hızlıca aktif ediyoruz.',
  announcement: '',
  announceFx: 'none', announceTone: 'violet', announceEmoji: '📣', announceLink: '', announceDismiss: false,
  perks: [
    'En çok kullanılan 1000 kelimenin tamamı + 500\'den fazla bonus kelime',
    'Tüm seviyelerin içeriği ve 16 günlük hayat teması',
    '45 cümle kalıbının tamamı',
    'Tüm Pip mini dersleri ve aksan konuları',
    'Pro temalar ve Pip kıyafetleri, 2× yaprak kazanımı',
  ],
  // Home banners (admin-editable): tone = green | pink | blue | purple | orange | ink · deco = bars | bubbles | chat | city | stars
  banners: [
    { id: 'daily', enabled: true, tone: 'green', title: 'Her gün\nbiraz daha', accent: 'sen.', sub: '', deco: 'bars', link: '#/session/daily', outfit: { hat: 'cap', bag: 'backpack', shoes: 'sneakers' }, color: 'color-ink' },
    { id: 'words', enabled: true, tone: 'pink', title: 'Yeni\nkelimeler,', accent: 'yeni yerler.', sub: '', deco: 'bubbles', link: '#/words', outfit: { hat: 'headphones' }, color: 'color-ink' },
    { id: 'sounds', enabled: true, tone: 'blue', title: 'Dinle.\nKonuş.\nÖğren.', accent: '', sub: 'Tek bir yerde.', deco: 'chat', link: '#/sounds', outfit: { hand: 'phone' }, color: 'color-ink' },
    { id: 'world', enabled: true, tone: 'purple', title: 'Küçük adımlar,\nbüyük', accent: 'dünyalar.', sub: '', deco: 'city', link: '#/market', outfit: { glasses: 'shades', bag: 'backpack' }, color: 'color-ink' },
  ],
};

const ipaOf = en => IPA[en.toLowerCase()] || ['', ''];
const seedData = () => ({
  freq: W.FREQ.map(({ en, tr, pos }) => { const [us, uk] = ipaOf(en); return { en, tr, pos, us, uk }; }),
  themes: W.THEMES.map(t => ({ id: t.id, title: t.title, emoji: t.emoji, color: t.color, words: t.words.map(({ en, tr, emoji, ex, exTr }) => { const [us, uk] = ipaOf(en); return { en, tr, emoji, ex, exTr, us, uk }; }) })),
  patternCats: P.PATTERN_CATS,
  patterns: P.PATTERNS,
  soundGroups: F.SOUND_GROUPS,
  sounds: F.SOUNDS,
  accent: F.ACCENT_TOPICS,
  pairs: F.MIN_PAIRS,
  lessons: F.LESSONS,
  settings: DEFAULT_SETTINGS,
  plans: DEFAULT_PLANS,
  levels: DEFAULT_LEVELS,
  market: DEFAULT_MARKET,
  emails: DEFAULT_EMAILS,
  voice: DEFAULT_VOICE,
});
export const CONTENT_KEYS = Object.keys(seedData());

let cache = new Map();   // key -> parsed json
let version = 0;
const built = new Map(); // `${plan}|${level}` -> client payload

export function seedIfEmpty() {
  const seed = seedData();
  for (const k of CONTENT_KEYS) {
    if (!q.get('SELECT 1 FROM content WHERE key = ?', k)) {
      let v = seed[k];
      // migrate old free limits (v2) into the plan matrix
      if (k === 'plans') {
        const old = q.get("SELECT json FROM content WHERE key = 'settings'");
        const f = old && JSON.parse(old.json).free;
        if (f) { v = structuredClone(v); for (const key of ['units', 'themes', 'patterns', 'lessons', 'accent', 'pairsPerDay', 'weekly']) if (key in f) v.features[key].free = key === 'units' ? Math.min(f[key], 2) : f[key]; }
      }
      q.run('INSERT INTO content (key, json, updated_at) VALUES (?,?,?)', k, JSON.stringify(v), Date.now());
    }
  }
  migrateIpa();
  migrateMarket();
  migrateLessons();
  migrateBrand();
  loadAll();
}
// Pratilange → Linggo in stored content (emails, settings, theme names…); Turkish suffixes follow the vowel-final name
function migrateBrand() {
  for (const { key, json } of q.all("SELECT key, json FROM content WHERE json LIKE '%Pratilange%'")) {
    const out = json
      .replace(/Pratilange(')ın/g, 'Linggo$1nun').replace(/Pratilange(')daki/g, 'Linggo$1daki').replace(/Pratilange(')da/g, 'Linggo$1da')
      .replace(/Pratilange(')a(?![a-zçğıöşü])/g, 'Linggo$1ya').replace(/Pratilange(')ı(?![a-zçğıöşü])/g, 'Linggo$1yu')
      .replace(/Pratilange/g, 'Linggo');
    q.run('UPDATE content SET json = ?, updated_at = ? WHERE key = ?', out, Date.now(), key);
  }
}
// v3 market: reward chests config, droppable items, richer themes (never overwrites themes the admin already re-edited)
function migrateMarket() {
  const row = q.get("SELECT json FROM content WHERE key = 'market'"); if (!row) return;
  const v = JSON.parse(row.json); let changed = false;
  if (!v.rewards) { v.rewards = structuredClone(DEFAULT_REWARDS); for (const it of v.items) if (DEFAULT_DROPS.includes(it.id)) it.drop = true; changed = true; }
  for (const seed of DEFAULT_MARKET.items.filter(i => i.slot === 'theme')) {
    const cur = v.items.find(i => i.id === seed.id);
    if (!cur) { v.items.push(structuredClone(seed)); changed = true; }
    else if ((cur.theme?.v || 0) < 4) { cur.theme = structuredClone(seed.theme); cur.desc = seed.desc; if (['theme-classic', 'theme-night'].includes(seed.id)) cur.name = seed.name; changed = true; }
  }
  // v4 wardrobe: new slots (bottom, bag, hand, face, color), subcategory tags and colour variants
  if ((v.v || 0) < 4) {
    for (const seed of DEFAULT_MARKET.items) {
      const cur = v.items.find(i => i.id === seed.id);
      if (!cur) { const it = structuredClone(seed); if (DEFAULT_DROPS.includes(it.id)) it.drop = true; v.items.push(it); continue; }
      for (const k of ['tag', 'variants', 'face']) if (seed[k] !== undefined && cur[k] === undefined) cur[k] = structuredClone(seed[k]);
      if (!cur.desc && seed.desc) cur.desc = seed.desc;
      if (DEFAULT_DROPS.includes(cur.id) && cur.drop === undefined) cur.drop = true;
    }
    v.v = 4; changed = true;
  }
  if (changed) q.run("UPDATE content SET json = ?, updated_at = ? WHERE key = 'market'", JSON.stringify(v), Date.now());
}
// lessons: add English captions to scenes that still match the original seed text
function migrateLessons() {
  const row = q.get("SELECT json FROM content WHERE key = 'lessons'"); if (!row) return;
  const v = JSON.parse(row.json); let changed = false;
  for (const l of v) {
    const seed = F.LESSONS.find(x => x.id === l.id); if (!seed) continue;
    l.scenes?.forEach((sc, i) => { const ss = seed.scenes[i]; if (!sc.capEn && ss?.capEn && ss.cap === sc.cap) { sc.capEn = ss.capEn; changed = true; } });
  }
  if (changed) q.run("UPDATE content SET json = ?, updated_at = ? WHERE key = 'lessons'", JSON.stringify(v), Date.now());
}
// add IPA to word lists created before IPA existed (never overwrites admin edits)
function migrateIpa() {
  for (const key of ['freq', 'themes']) {
    const row = q.get('SELECT json FROM content WHERE key = ?', key); if (!row) continue;
    const v = JSON.parse(row.json); let changed = false;
    const fill = w => { if (w.us === undefined) { [w.us, w.uk] = ipaOf(w.en); changed = true; } };
    if (key === 'freq') v.forEach(fill); else v.forEach(t => t.words.forEach(fill));
    if (changed) q.run('UPDATE content SET json = ? WHERE key = ?', JSON.stringify(v), key);
  }
}
function loadAll() {
  cache = new Map(q.all('SELECT key, json FROM content').map(r => [r.key, JSON.parse(r.json)]));
  const s = cache.get('settings') || {};
  delete s.free;
  cache.set('settings', { ...DEFAULT_SETTINGS, ...s });
  // forward-compatible plan matrix: new features get their defaults
  const p = cache.get('plans');
  for (const f of FEATURES) if (!p.features[f.key]) p.features[f.key] = DEFAULT_PLANS.features[f.key];
  cache.set('voice', { ...DEFAULT_VOICE, ...cache.get('voice'), voices: { ...DEFAULT_VOICE.voices, ...cache.get('voice')?.voices } });
  version = Date.now(); built.clear();
}
export const getContent = k => cache.get(k);
export const contentVersion = () => version;
export const settings = () => cache.get('settings');
export const PLAN_IDS = ['free', 'premium'];

// Resolved feature values for a plan: { units: 2, weekly: false, ... } (-1 = unlimited)
export function featuresFor(plan) {
  const m = cache.get('plans').features, out = {};
  for (const f of FEATURES) out[f.key] = m[f.key]?.[plan] ?? DEFAULT_PLANS.features[f.key][plan];
  return out;
}
export function levelsList() { return cache.get('levels').levels; }
export function levelById(id) {
  const L = levelsList();
  const legacy = { zero: 'a1', basic: 'a2', mid: 'b1', adv: 'c1' };
  return L.find(l => l.id === (legacy[id] || id)) || L[0];
}

const HISTORY_KEEP = 40; // versions kept per content key
// Writes a content value, keeping the previous version + a readable diff in content_history
function writeContent(key, value, adminId, action, note = '') {
  const prev = cache.get(key);
  const d = diffContent(key, prev, value);
  if (!d.changed && action !== 'reset') return { diff: d, same: true };
  const now = Date.now(), summary = summaryText(d);
  q.run('INSERT INTO content (key, json, updated_at, updated_by) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at, updated_by = excluded.updated_by', key, JSON.stringify(value), now, adminId);
  q.run('INSERT INTO content_history (key, action, prev, diff, summary, note, admin_id, ts) VALUES (?,?,?,?,?,?,?,?)', key, action, JSON.stringify(prev ?? null), JSON.stringify(trimDiff(d)), summary, String(note).slice(0, 200), adminId, now);
  q.run('DELETE FROM content_history WHERE key = ? AND id NOT IN (SELECT id FROM content_history WHERE key = ? ORDER BY id DESC LIMIT ?)', key, key, HISTORY_KEEP);
  adminLog(adminId, { edit: 'content.update', import: 'content.import', reset: 'content.reset', revert: 'content.revert' }[action], key, summary + (note ? ` · ${note}` : ''));
  loadAll();
  return { diff: d };
}
export function setContent(key, value, adminId, { action = 'edit', note = '' } = {}) {
  if (key === 'market') value = sanitizeMarket(value);
  const err = validate(key, value);
  if (err) return err;
  writeContent(key, value, adminId, action, note);
  return null;
}
export function resetContent(key, adminId) {
  const seed = seedData();
  if (!(key in seed)) return 'Bilinmeyen içerik';
  writeContent(key, seed[key], adminId, 'reset');
  return null;
}
export function contentHistory({ key, limit = 80 } = {}) {
  return q.all(`SELECT h.id, h.key, h.action, h.diff, h.summary, h.note, h.ts, u.email admin FROM content_history h LEFT JOIN users u ON u.id = h.admin_id ${key ? 'WHERE h.key = ?' : ''} ORDER BY h.id DESC LIMIT ?`, ...(key ? [key, limit] : [limit]))
    .map(r => ({ ...r, diff: JSON.parse(r.diff || '{}') }));
}
// Restores the version that existed right before history entry #id (the restore is itself logged)
export function revertContent(id, adminId) {
  const h = q.get('SELECT * FROM content_history WHERE id = ?', id);
  if (!h) return 'Kayıt bulunamadı.';
  const prev = JSON.parse(h.prev);
  if (prev == null) return 'Bu kaydın önceki sürümü yok.';
  return setContent(h.key, prev, adminId, { action: 'revert', note: `#${id} öncesine dönüldü` });
}
export function contentMeta() {
  return q.all('SELECT c.key, c.updated_at, u.email AS updated_by FROM content c LEFT JOIN users u ON u.id = c.updated_by');
}

// ---------- client payload (plan + level aware; locked items are teasers without the actual content)
export const UNIT_SIZE = 100, CORE = 1000;

// Items in the learner's level come first; `limit` of them are open. Others are open only if `otherLevels`.
function gate(ids, levelIds, limit, others) {
  const inLevel = new Set(levelIds), open = new Set();
  let n = 0;
  for (const id of levelIds) { if (!ids.includes(id)) continue; if (limit < 0 || n < limit) open.add(id); n++; }
  return id => open.has(id) || (others && !inLevel.has(id));
}

export function clientContent(plan, levelId) {
  const lvl = levelById(levelId);
  const key = `${plan}|${lvl.id}`;
  if (built.has(key)) return built.get(key);
  const s = settings(), feat = featuresFor(plan);
  const L = levelsList();
  const levelsOf = (field, id) => L.filter(l => l[field]?.includes(id)).map(l => l.id);

  const freq = cache.get('freq');
  const nUnits = Math.ceil(freq.length / UNIT_SIZE);
  const unitOpen = gate(Array.from({ length: nUnits }, (_, i) => i + 1), lvl.units || [], feat.units, feat.otherLevels);
  const units = [];
  for (let i = 0; i < freq.length; i += UNIT_SIZE) {
    const n = i / UNIT_SIZE + 1, slice = freq.slice(i, i + UNIT_SIZE);
    const locked = !unitOpen(n);
    units.push({ id: String(n), n, from: i + 1, to: i + slice.length, bonus: i >= CORE, locked, count: slice.length, levels: levelsOf('units', n), words: locked ? [] : slice.map((w, k) => ({ ...w, rank: i + k + 1 })) });
  }
  const T = cache.get('themes');
  const themeOpen = gate(T.map(t => t.id), lvl.themes || [], feat.themes, feat.otherLevels);
  const themes = T.map(t => { const locked = !themeOpen(t.id); return { id: t.id, title: t.title, emoji: t.emoji, color: t.color, locked, count: t.words.length, levels: levelsOf('themes', t.id), words: locked ? [] : t.words }; });
  const PT = cache.get('patterns');
  const patOpen = gate(PT.map(p => p.id), lvl.patterns || [], feat.patterns, feat.otherLevels);
  const patterns = PT.map(p => patOpen(p.id) ? { ...p, levels: levelsOf('patterns', p.id) } : { id: p.id, cat: p.cat, pattern: p.pattern, tr: p.tr, locked: true, levels: levelsOf('patterns', p.id) });
  const LS = cache.get('lessons');
  const lesOpen = gate(LS.map(l => l.id), lvl.lessons || [], feat.lessons, feat.otherLevels);
  const lessons = LS.map(l => lesOpen(l.id) ? { ...l, levels: levelsOf('lessons', l.id) }
    : { id: l.id, title: l.title, sub: l.sub, color: l.color, min: l.min, locked: true, levels: levelsOf('lessons', l.id), scenes: [{ mouth: l.scenes?.[1]?.mouth || 'rest', cap: '' }] });
  const accent = cache.get('accent').map((a, i) => (feat.accent >= 0 && i >= feat.accent)
    ? { id: a.id, title: a.title, sub: a.sub, emoji: a.emoji, locked: true } : a);
  const pl = cache.get('plans');
  const payload = JSON.stringify({
    version, plan, level: lvl.id, units, themes, patterns, lessons, accent,
    patternCats: cache.get('patternCats'), soundGroups: cache.get('soundGroups'), sounds: cache.get('sounds'), pairs: cache.get('pairs'),
    levels: L.map(({ id, cefr, title, emoji, desc, dailyNew, units: u, themes: t, patterns: p, lessons: le }) => ({ id, cefr, title, emoji, desc, dailyNew, units: u, themes: t, patterns: p, lessons: le })),
    features: feat, featuresPremium: featuresFor('premium'),
    plans: pl.plans,
    settings: { whatsapp: s.whatsapp, whatsappText: s.whatsappText, priceNote: s.priceNote, announcement: s.announcement, announceFx: s.announceFx, announceTone: s.announceTone, announceEmoji: s.announceEmoji, announceLink: s.announceLink, announceDismiss: !!s.announceDismiss, perks: s.perks, banners: (s.banners || []).filter(b => b.enabled !== false) },
    totals: { words: freq.length, themes: themes.length, patterns: patterns.length, lessons: lessons.length, accent: accent.length },
  });
  built.set(key, payload);
  return payload;
}

// ---------- SVG sanitizer for custom market art (admin-provided, rendered to learners)
const SVG_TAGS = new Set(['g', 'path', 'circle', 'ellipse', 'rect', 'polygon', 'polyline', 'line', 'defs', 'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask']);
export function sanitizeSvg(src) {
  if (!src) return '';
  let s = String(src).slice(0, 20000);
  s = s.replace(/<\?xml[^>]*>|<!--[\s\S]*?-->|<!DOCTYPE[^>]*>/gi, '');
  s = s.replace(/<\/?svg[^>]*>/gi, '');
  // drop any tag that is not allowlisted (with its content for script/style/foreignObject)
  s = s.replace(/<(script|style|foreignObject|iframe|object|embed)[\s\S]*?<\/\1\s*>/gi, '');
  s = s.replace(/<\/?([a-zA-Z][\w:-]*)([^>]*)>/g, (m, tag, attrs) => {
    if (!SVG_TAGS.has(tag.toLowerCase())) return '';
    const clean = attrs
      .replace(/\s(on\w+|href|xlink:href|style)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/url\(\s*['"]?\s*(?!#)[^)]*\)/gi, 'none');
    return m.startsWith('</') ? `</${tag}>` : `<${tag}${clean}>`;
  });
  return s.trim();
}
function sanitizeMarket(v) {
  if (!v || !Array.isArray(v.items)) return v;
  return { ...v, items: v.items.map(it => it.art === 'custom' ? { ...it, svg: sanitizeSvg(it.svg) } : it) };
}

// ---------- validation
const str = (v, max = 400) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const slug = v => typeof v === 'string' && /^[a-z0-9-]{1,40}$/.test(v);
const MOUTHS = ['rest', 'smile', 'round', 'open', 'wide', 'mid', 'th', 'fv', 'closed'];
const POS = ['', 'n', 'v', 'adj', 'adv', 'prep', 'pron', 'conj', 'det', 'num', 'int'];
const SLOTS = ['hat', 'glasses', 'top', 'bottom', 'shoes', 'bag', 'hand', 'neck', 'gloves', 'face', 'color', 'bg', 'theme'];
function dupes(list, f) { const seen = new Set(), d = []; for (const x of list) { const k = f(x); if (seen.has(k)) d.push(k); seen.add(k); } return d; }
const ipaOk = w => (w.us === undefined || typeof w.us === 'string' && w.us.length <= 80) && (w.uk === undefined || typeof w.uk === 'string' && w.uk.length <= 80);

// pending: values about to be saved together (bulk import), so cross-references between them validate
export function validate(key, v, pending = {}) {
  const arr = Array.isArray(v);
  const cur = k => pending[k] ?? cache.get(k);
  switch (key) {
    case 'freq': {
      if (!arr || !v.length) return 'Liste boş olamaz.';
      for (const [i, w] of v.entries()) {
        if (!str(w?.en, 60) || !str(w?.tr, 120)) return `${i + 1}. satırda kelime veya anlam eksik.`;
        if (w.pos && !POS.includes(w.pos)) return `${i + 1}. satırda geçersiz tür: ${w.pos}`;
        if (!ipaOk(w)) return `${i + 1}. satırda IPA çok uzun.`;
      }
      const d = dupes(v, w => w.en.trim().toLowerCase());
      return d.length ? `Tekrarlanan kelimeler: ${d.slice(0, 10).join(', ')}` : null;
    }
    case 'themes': {
      if (!arr) return 'Dizi bekleniyor.';
      const d = dupes(v, t => t.id); if (d.length) return `Tekrarlanan tema kimliği: ${d.join(', ')}`;
      for (const t of v) {
        if (!slug(t.id) || !str(t.title, 60)) return `Tema kimliği (küçük harf, rakam, tire) ve başlık zorunlu: ${t.id || '?'}`;
        if (!Array.isArray(t.words)) return `${t.title}: kelime listesi yok.`;
        for (const [i, w] of t.words.entries()) if (!str(w?.en, 60) || !str(w?.tr, 120) || !ipaOk(w)) return `${t.title} / ${i + 1}. kelimede İngilizce veya Türkçe eksik.`;
        const dw = dupes(t.words, w => w.en.trim().toLowerCase()); if (dw.length) return `${t.title}: tekrarlanan kelime ${dw.join(', ')}`;
      }
      return null;
    }
    case 'patternCats': {
      if (!arr || !v.length) return 'En az bir kategori gerekli.';
      for (const c of v) if (!slug(c.id) || !str(c.title, 60)) return `Kategori kimliği ve başlığı zorunlu: ${c.id || '?'}`;
      const d = dupes(v, c => c.id); return d.length ? `Tekrarlanan kategori: ${d.join(', ')}` : null;
    }
    case 'patterns': {
      if (!arr) return 'Dizi bekleniyor.';
      const cats = new Set(cur('patternCats').map(c => c.id));
      const d = dupes(v, p => p.id); if (d.length) return `Tekrarlanan kalıp kimliği: ${d.join(', ')}`;
      for (const p of v) {
        if (!slug(p.id)) return `Geçersiz kimlik: ${p.id || '?'} (küçük harf, rakam, tire)`;
        if (!cats.has(p.cat)) return `${p.id}: kategori bulunamadı (${p.cat}).`;
        if (!str(p.pattern, 120) || !str(p.key, 60) || !str(p.tr, 160)) return `${p.id}: kalıp, anahtar ve anlam zorunlu.`;
        if (!Array.isArray(p.ex) || p.ex.length < 3) return `${p.id}: en az 3 örnek gerekli.`;
        for (const e of p.ex) {
          if (!Array.isArray(e) || !str(e[0], 200) || !str(e[1], 200)) return `${p.id}: örneklerde İngilizce ve Türkçe zorunlu.`;
          if (!e[0].toLowerCase().includes(p.key.toLowerCase())) return `${p.id}: "${p.key}" anahtarı şu örnekte geçmiyor → ${e[0]}`;
        }
      }
      return null;
    }
    case 'soundGroups': return arr && v.every(g => slug(g.id) && str(g.title)) ? null : 'Her grupta id ve title olmalı.';
    case 'sounds': {
      if (!arr) return 'Dizi bekleniyor.';
      const groups = new Set(cur('soundGroups').map(g => g.id));
      for (const s of v) {
        if (!str(s.id, 20) || !str(s.ipa, 10) || !groups.has(s.group)) return `Ses kaydında id, ipa ve geçerli group zorunlu: ${s.id || '?'}`;
        if (!Array.isArray(s.words) || !s.words.length) return `${s.id}: örnek kelimeler (words) gerekli.`;
        if (!MOUTHS.includes(s.mouth)) return `${s.id}: mouth şunlardan biri olmalı: ${MOUTHS.join(', ')}`;
        if (!str(s.tip, 600)) return `${s.id}: ipucu (tip) gerekli.`;
      }
      return dupes(v, s => s.id).length ? 'Tekrarlanan ses id.' : null;
    }
    case 'accent': {
      if (!arr) return 'Dizi bekleniyor.';
      for (const a of v) {
        if (!slug(a.id) || !str(a.title) || !str(a.us) || !str(a.uk)) return `Aksan konusunda id, title, us, uk zorunlu: ${a.id || '?'}`;
        if (!Array.isArray(a.words) && !Array.isArray(a.pairs)) return `${a.id}: words veya pairs listesi gerekli.`;
      }
      return null;
    }
    case 'pairs': return arr && v.every(p => Array.isArray(p) && p.length === 5 && p.every(x => str(x, 40))) ? null : 'Her çift 5 metinden oluşmalı: [kelime1, ipa1, kelime2, ipa2, fark].';
    case 'lessons': {
      if (!arr) return 'Dizi bekleniyor.';
      for (const l of v) {
        if (!slug(l.id) || !str(l.title)) return `Derste id ve title zorunlu: ${l.id || '?'}`;
        if (!Array.isArray(l.scenes) || l.scenes.length < 2) return `${l.id}: en az 2 sahne gerekli.`;
        for (const [i, s] of l.scenes.entries()) {
          if (!str(s.cap, 400)) return `${l.id} / sahne ${i + 1}: anlatım (cap) zorunlu.`;
          if (s.capEn !== undefined && s.capEn !== '' && !str(s.capEn, 400)) return `${l.id} / sahne ${i + 1}: İngilizce altyazı çok uzun.`;
          if (s.mouth && !MOUTHS.includes(s.mouth)) return `${l.id} / sahne ${i + 1}: geçersiz mouth.`;
        }
      }
      return dupes(v, l => l.id).length ? 'Tekrarlanan ders id.' : null;
    }
    case 'settings': {
      if (!v || typeof v !== 'object') return 'Nesne bekleniyor.';
      if (!/^\d{8,15}$/.test(String(v.whatsapp || ''))) return 'WhatsApp numarası ülke koduyla, sadece rakam olmalı (ör. 905075973367).';
      if (v.announceFx && !['none', 'marquee', 'typewriter', 'shine', 'pulse', 'gradient'].includes(v.announceFx)) return 'Duyuru efekti geçersiz.';
      if (v.announceTone && !['violet', 'lime', 'coral', 'sky', 'sun', 'ink'].includes(v.announceTone)) return 'Duyuru rengi geçersiz.';
      if (v.announceLink && !/^#\/[\w\-/]*$/.test(v.announceLink)) return 'Duyuru bağlantısı #/ ile başlamalı (ör. #/market).';
      if (String(v.announceEmoji || '').length > 8) return 'Duyuru emojisi çok uzun.';
      if (v.banners !== undefined) {
        if (!Array.isArray(v.banners)) return 'Bannerlar liste olmalı.';
        for (const b of v.banners) {
          if (!str(b.title, 120)) return 'Her bannerın başlığı olmalı.';
          if (!['green', 'pink', 'blue', 'purple', 'orange', 'ink'].includes(b.tone)) return `"${b.title}": renk tonu geçersiz.`;
          if (b.link && !/^#\/[\w\-/]*$/.test(b.link)) return `"${b.title}": bağlantı #/ ile başlamalı (ör. #/market).`;
        }
      }
      return null;
    }
    case 'plans': {
      if (!v?.features || !Array.isArray(v.plans)) return 'Plan yapısı hatalı.';
      for (const f of FEATURES) {
        const x = v.features[f.key]; if (!x) return `Özellik eksik: ${f.label}`;
        for (const p of PLAN_IDS) {
          const val = x[p];
          if (f.type === 'bool' && typeof val !== 'boolean') return `${f.label} (${p}) açık/kapalı olmalı.`;
          if (f.type !== 'bool' && !(Number.isInteger(val) && val >= (f.type === 'limit' ? -1 : 0))) return `${f.label} (${p}) geçerli bir sayı olmalı${f.type === 'limit' ? ' (sınırsız için -1)' : ''}.`;
        }
      }
      const pr = v.plans.find(p => p.id === 'premium');
      if (!pr || !(pr.priceMonthly >= 0) || !(pr.priceYearly >= 0)) return 'Premium fiyatları geçerli olmalı.';
      return null;
    }
    case 'levels': {
      if (!Array.isArray(v?.levels) || !v.levels.length) return 'En az bir seviye gerekli.';
      if (dupes(v.levels, l => l.id).length) return 'Tekrarlanan seviye kimliği.';
      const nUnits = Math.ceil(cur('freq').length / UNIT_SIZE);
      const themeIds = new Set(cur('themes').map(t => t.id)), patIds = new Set(cur('patterns').map(p => p.id)), lesIds = new Set(cur('lessons').map(l => l.id));
      for (const l of v.levels) {
        if (!slug(l.id) || !str(l.title, 40)) return `Seviye kimliği ve adı zorunlu: ${l.id || '?'}`;
        if (!Array.isArray(l.units) || !l.units.length || l.units.some(n => !(Number.isInteger(n) && n >= 1 && n <= nUnits))) return `${l.title}: en az bir geçerli ünite seç (1–${nUnits}).`;
        const bad = (l.themes || []).filter(x => !themeIds.has(x)).concat((l.patterns || []).filter(x => !patIds.has(x)), (l.lessons || []).filter(x => !lesIds.has(x)));
        if (bad.length) return `${l.title}: bulunamayan içerik: ${bad.slice(0, 5).join(', ')}`;
      }
      const pc = v.placement || {};
      if (!(pc.wordsPerLevel >= 1 && pc.wordsPerLevel <= 10) || !(pc.patternsPerLevel >= 0 && pc.patternsPerLevel <= 5) || !(pc.pass >= 30 && pc.pass <= 100)) return 'Seviye testi ayarları geçersiz.';
      return null;
    }
    case 'market': {
      if (!Array.isArray(v?.items)) return 'Öğe listesi bekleniyor.';
      if (dupes(v.items, i => i.id).length) return `Tekrarlanan öğe kimliği: ${dupes(v.items, i => i.id).join(', ')}`;
      for (const it of v.items) {
        if (!slug(it.id) || !str(it.name, 60)) return `Öğede kimlik ve ad zorunlu: ${it.id || '?'}`;
        if (!SLOTS.includes(it.slot)) return `${it.name}: geçersiz yuva.`;
        if (!str(it.art, 40)) return `${it.name}: görsel seçilmeli.`;
        if (it.art === 'custom' && it.slot !== 'theme' && !it.svg) return `${it.name}: özel SVG boş ya da güvenli değil.`;
        const pr = it.price || {};
        if (!['free', 'coins', 'premium', 'paid'].includes(pr.type)) return `${it.name}: fiyat türü geçersiz.`;
        if (pr.type === 'coins' && !(Number.isInteger(pr.coins) && pr.coins > 0)) return `${it.name}: yaprak fiyatı pozitif tam sayı olmalı.`;
        if (pr.type === 'paid' && !(pr.try > 0)) return `${it.name}: TL fiyatı girilmeli.`;
        if (it.slot === 'theme' && (typeof it.theme !== 'object' || typeof it.theme.tokens !== 'object')) return `${it.name}: tema renkleri eksik.`;
      }
      const rw = v.rewards;
      if (rw) {
        const rng = r => Array.isArray(r) && r.length === 2 && r.every(n => Number.isInteger(n) && n >= 0 && n <= 1000) && r[0] <= r[1];
        for (const [k, t] of Object.entries(rw.tiers || {})) {
          if (!rng(t.coins) || !rng(t.xp)) return `Ödül "${t.name || k}": yaprak/XP aralığı geçersiz (en az ≤ en çok, 0–1000).`;
          if (!(t.drop >= 0 && t.drop <= 1)) return `Ödül "${t.name || k}": eşya düşme olasılığı 0–1 arası olmalı.`;
        }
        for (const m of rw.missions || []) if (!slug(m.id) || !str(m.t, 80) || !['goal', 'xp', 'ok', 'rev', 'nw'].includes(m.metric) || !(Number.isInteger(m.n) && m.n >= 1)) return `Görev geçersiz: ${m.t || m.id || '?'}`;
        if ((rw.missions || []).length < 3) return 'Günlük görev havuzunda en az 3 görev olmalı.';
      }
      return null;
    }
    case 'emails': {
      if (!Array.isArray(v?.templates)) return 'Şablon listesi bekleniyor.';
      for (const t of v.templates) {
        if (!slug(t.id) && !/^[a-z_]+$/.test(t.id)) return `Geçersiz şablon kimliği: ${t.id}`;
        if (!str(t.subject, 200) || !str(t.body, 6000)) return `${t.name || t.id}: konu ve içerik zorunlu.`;
        if (t.trigger === 'weekly' && !(t.weekday >= 0 && t.weekday <= 6 && t.hour >= 0 && t.hour <= 23)) return `${t.name}: gün/saat geçersiz.`;
        if (t.trigger === 'inactive' && !(t.days >= 1)) return `${t.name}: gün sayısı geçersiz.`;
      }
      return null;
    }
    case 'voice': {
      if (!['auto', 'azure', 'google', 'elevenlabs', 'off'].includes(v?.provider)) return 'Ses sağlayıcısı geçersiz.';
      return null;
    }
  }
  return 'Bilinmeyen içerik anahtarı.';
}

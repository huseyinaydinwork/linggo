// Toplu içerik aktarımı: tüm içerik ↔ tek bir Excel çalışma kitabı (her içerik bir sayfa, iç içe listeler ayrı alt sayfalarda),
// yüklenen dosyanın mevcut içerikle farkı (eklenen / güncellenen / silinen) ve içerik değişikliklerinin özetleri.
import { FEATURES } from './seed/extras.js';

// kind: text | num | bool | list (a | b | c) | numlist | json.  ro = read-only (exported for context, ignored on import)
// id: identity of a row (used to match file rows with stored rows). parent sheets carry children in `child`.
export const SHEETS = [
  { key: 'patternCats', name: 'Kalıp kategorileri', id: 'id', cols: ['id', 'title', 'emoji', 'color'] },
  { key: 'soundGroups', name: 'Ses grupları', id: 'id', cols: ['id', 'title', 'color'] },
  { key: 'freq', name: 'Kelimeler', id: 'en', ci: true, cols: ['en', 'tr', 'pos', 'us', 'uk'], note: 'Sıra = sıklık sırası (her 100 kelime bir ünite). "en" değişirse üyelerin o kelimedeki ilerlemesi sıfırlanır.' },
  { key: 'themes', name: 'Temalar', id: 'id', cols: ['id', 'title', 'emoji', 'color'],
    child: { field: 'words', name: 'Tema kelimeleri', parent: 'tema', id: 'en', ci: true, cols: ['en', 'tr', 'emoji', 'ex', 'exTr', 'us', 'uk'] } },
  { key: 'patterns', name: 'Kalıplar', id: 'id', cols: ['id', 'cat', 'pattern', 'key', 'tr', 'note'],
    child: { field: 'ex', name: 'Kalıp örnekleri', parent: 'kalıp', tuple: ['en', 'tr'], cols: ['en', 'tr'] } },
  { key: 'sounds', name: 'Sesler', id: 'id', cols: ['id', 'ipa', 'us', 'group', 'mouth', 'to', 'hard', 'words', 'tip'], kinds: { hard: 'bool', words: 'list' } },
  { key: 'accent', name: 'Aksan farkları', id: 'id', cols: ['id', 'title', 'sub', 'emoji', 'us', 'uk', 'words', 'pairs'], kinds: { words: 'list', pairs: 'json' } },
  { key: 'pairs', name: 'Ses çiftleri', tuple: ['kelime1', 'ipa1', 'kelime2', 'ipa2', 'fark'], idOf: p => `${p[0]}/${p[2]}`.toLowerCase(), cols: ['kelime1', 'ipa1', 'kelime2', 'ipa2', 'fark'] },
  { key: 'lessons', name: 'Mini dersler', id: 'id', cols: ['id', 'title', 'sub', 'color', 'min'], kinds: { min: 'num' },
    child: { field: 'scenes', name: 'Ders sahneleri', parent: 'ders', cols: ['cap', 'capEn', 'mouth', 'mood', 'big', 'ipa', 'say', 'accent'] } },
  { key: 'levels', path: 'levels', name: 'Seviyeler', id: 'id', cols: ['id', 'cefr', 'title', 'emoji', 'desc', 'dailyNew', 'units', 'themes', 'patterns', 'lessons'],
    kinds: { dailyNew: 'num', units: 'numlist', themes: 'list', patterns: 'list', lessons: 'list' } },
  { key: 'market', path: 'items', name: 'Market ürünleri', id: 'id', cols: ['id', 'slot', 'name', 'art', 'rarity', 'enabled', 'drop', 'isNew', 'tag', 'desc', 'price', 'colors', 'variants'],
    kinds: { enabled: 'bool', drop: 'bool', isNew: 'bool', price: 'json', colors: 'json', variants: 'list', theme: 'json', face: 'json', svg: 'text' } },
  { key: 'emails', path: 'templates', name: 'E-posta şablonları', id: 'id', cols: ['id', 'name', 'kind', 'enabled', 'subject', 'title', 'body'], kinds: { enabled: 'bool' } },
  { key: 'plans', map: 'features', name: 'Plan özellikleri', id: 'özellik', cols: ['özellik', 'açıklama', 'free', 'premium'], ro: ['açıklama'] },
  { key: 'settings', map: '', name: 'Genel ayarlar', id: 'ayar', cols: ['ayar', 'değer'] },
];
export const SHEET_KEYS = SHEETS.map(s => s.key);
export const LABEL = Object.fromEntries(SHEETS.map(s => [s.key, s.name]));
const KIND_TAG = { list: 'liste: a | b', numlist: 'liste: 1 | 2', json: 'json', bool: 'evet/hayır' };
const LIST_SEP = ' | ';

// ---------- value <-> cell
function kindOf(spec, col, sample) {
  if (spec.kinds?.[col]) return spec.kinds[col];
  const v = sample.find(x => x?.[col] != null && x[col] !== '')?.[col];
  if (typeof v === 'boolean') return 'bool';
  if (typeof v === 'number') return 'num';
  if (Array.isArray(v)) return v.every(x => typeof x === 'string') ? 'list' : v.every(x => typeof x === 'number') ? 'numlist' : 'json';
  if (v && typeof v === 'object') return 'json';
  return 'text';
}
function toCell(v, kind) {
  if (v == null || v === '') return '';
  if (kind === 'list' || kind === 'numlist') return Array.isArray(v) ? v.join(LIST_SEP) : String(v);
  if (kind === 'json') return JSON.stringify(v);
  if (kind === 'bool') return v ? 'evet' : 'hayır';
  if (kind === 'num') return typeof v === 'number' ? v : Number(v);
  return typeof v === 'object' ? JSON.stringify(v) : v;
}
const TRUE = ['evet', 'e', 'true', '1', 'x', 'yes', 'y', 'doğru', 'açık', 'var'];
function fromCell(s, kind, where) {
  s = String(s ?? '').trim();
  if (s === '') return undefined; // empty cell = field not set
  if (kind === 'bool') return TRUE.includes(s.toLocaleLowerCase('tr-TR'));
  if (kind === 'num') { const n = Number(s.replace(',', '.')); if (!Number.isFinite(n)) throw new Error(`${where}: sayı bekleniyor ("${s}")`); return n; }
  if (kind === 'list') return s.split('|').map(x => x.trim()).filter(Boolean);
  if (kind === 'numlist') return s.split(/[|,;]/).map(x => x.trim()).filter(Boolean).map(x => { const n = Number(x); if (!Number.isFinite(n)) throw new Error(`${where}: sayı listesi bekleniyor ("${s}")`); return n; });
  if (kind === 'json') { try { return JSON.parse(s); } catch { throw new Error(`${where}: geçersiz JSON`); } }
  return s;
}
const plainHeader = h => String(h || '').replace(/\s*\[[^\]]*\]\s*$/, '').replace(/\s*\*\s*$/, '').trim(); // "en * [liste: a | b]" → "en"

// the array a sheet edits inside a stored content value
const itemsOf = (spec, v) => spec.map !== undefined
  ? Object.entries(spec.map ? v?.[spec.map] || {} : v || {}).map(([k, x]) => ({ [spec.id]: k, _v: x }))
  : spec.path ? v?.[spec.path] || [] : v || [];
const rowId = (spec, item) => spec.idOf ? spec.idOf(item) : spec.ci ? String(item[spec.id] ?? '').trim().toLowerCase() : String(item[spec.id] ?? '').trim();

// all columns of a sheet: declared first, then any extra field found in the data (so nothing is lost)
function columnsOf(spec, items) {
  if (spec.tuple || spec.map !== undefined) return spec.cols;
  const extra = [...new Set(items.flatMap(x => Object.keys(x || {})))].filter(k => !spec.cols.includes(k) && k !== spec.child?.field && !k.startsWith('_'));
  return [...spec.cols, ...extra];
}

// ---------- export
// Column guide shown in the workbook: [what to write, example, required?, allowed values (array or (getContent) => array)]
const MOUTHS = ['rest', 'smile', 'round', 'open', 'wide', 'mid', 'th', 'fv', 'closed'];
const MOODS = ['idle', 'happy', 'think', 'wow', 'sad', 'sleep', 'love', 'ouch'];
const POS = ['n', 'v', 'adj', 'adv', 'prep', 'pron', 'conj', 'det', 'num', 'int'];
const SLOTS = ['hat', 'glasses', 'top', 'bottom', 'shoes', 'bag', 'hand', 'neck', 'gloves', 'face', 'color', 'bg', 'theme'];
const ID = ['Kimlik: küçük harf, rakam ve tire', 'food', true];
const COLOR = ['Kart rengi (#hex)', '#FF6A3D'];
const IPA_US = ['ABD telaffuzu (IPA, eğik çizgisiz)', 'ˈæpəl'], IPA_UK = ['İngiliz telaffuzu (IPA)', 'ˈæpəl'];
const DOCS = {
  'Kelimeler': { en: ['İngilizce kelime (sıra = sıklık sırası)', 'apple', true], tr: ['Türkçe anlam(lar)', 'elma', true], pos: ['Kelime türü: n isim, v fiil, adj sıfat, adv zarf…', 'n', false, POS], us: IPA_US, uk: IPA_UK },
  'Temalar': { id: ID, title: ['Tema adı', 'Yiyecek & İçecek', true], emoji: ['Tema emojisi', '🍎'], color: COLOR },
  'Tema kelimeleri': { tema: ['Bağlı olduğu temanın kimliği', 'food', true, g => (g('themes') || []).map(t => t.id)], en: ['İngilizce kelime', 'apple', true], tr: ['Türkçe anlam', 'elma', true], emoji: ['Emoji', '🍎'], ex: ['İngilizce örnek cümle', 'I eat an apple every day.'], exTr: ['Örneğin Türkçesi', 'Her gün bir elma yerim.'], us: IPA_US, uk: IPA_UK },
  'Kalıp kategorileri': { id: ID, title: ['Kategori adı', 'Kendini İfade Et', true], emoji: ['Emoji', '🙋'], color: COLOR },
  'Kalıplar': { id: ID, cat: ['Kategori kimliği', 'self', true, g => (g('patternCats') || []).map(c => c.id)], pattern: ['Kalıp formülü (+ isim, V1, V-ing gibi yer tutucularla)', "I'm into + isim / V-ing", true], key: ['Her örnekte geçmesi gereken sabit kısım', "I'm into", true], tr: ['Türkçe anlamı', '…ile ilgileniyorum', true], note: ['Kısa açıklama / ipucu', 'Hobiler için doğal bir ifade.'] },
  'Kalıp örnekleri': { 'kalıp': ['Bağlı olduğu kalıbın kimliği (kalıp başına en az 3 örnek)', 'into', true, g => (g('patterns') || []).map(p => p.id)], en: ['İngilizce örnek ("key" geçmeli)', "I'm into photography.", true], tr: ['Türkçesi', 'Fotoğrafçılıkla ilgileniyorum.', true] },
  'Ses grupları': { id: ID, title: ['Grup adı', 'Kısa ünlüler', true], color: COLOR },
  'Sesler': { id: ['Kimlik', 'ih', true], ipa: ['IPA sembolü (İngiliz)', 'ɪ', true], us: ['ABD sembolü (farklıysa)', ''], group: ['Ses grubu kimliği', 'short', true, g => (g('soundGroups') || []).map(x => x.id)], mouth: ['Pip\'in ağız şekli', 'smile', true, MOUTHS], to: ['Geçiş ağız şekli (çift sesliler)', '', false, MOUTHS], hard: ['Türkler için zor mu?', 'evet'], words: ['Örnek kelimeler', 'ship | sit | big', true], tip: ['Telaffuz ipucu', 'Dudaklarını germe…', true] },
  'Aksan farkları': { id: ID, title: ['Konu', 'R sesi', true], sub: ['Alt başlık', 'Rotiklik'], emoji: ['Emoji', '🌀'], us: ['ABD açıklaması', 'car → /kɑːr/', true], uk: ['İngiliz açıklaması', 'car → /kɑː/', true], words: ['Örnek kelimeler', 'car | water'], pairs: ['Teknik: kelime çiftleri (json)', '[["lift","elevator"]]'] },
  'Ses çiftleri': { kelime1: ['1. kelime', 'ship', true], ipa1: ['1. kelimenin IPA\'sı', 'ʃɪp', true], kelime2: ['2. kelime', 'sheep', true], ipa2: ['2. kelimenin IPA\'sı', 'ʃiːp', true], fark: ['Ayırt edilen sesler', 'ɪ / iː', true] },
  'Mini dersler': { id: ID, title: ['Ders başlığı', 'TH sesi: Dil dışarı!', true], sub: ['Alt başlık', 'θ ve ð'], color: COLOR, min: ['Süre (dakika)', 2] },
  'Ders sahneleri': { ders: ['Bağlı olduğu dersin kimliği (ders başına en az 2 sahne)', 'th', true, g => (g('lessons') || []).map(l => l.id)], cap: ['Türkçe anlatım (altyazı)', 'Merhaba, ben Pip!', true], capEn: ['Pip\'in İngilizce cümlesi (seslendirilir)', "Hi, I'm Pip!"], mouth: ['Ağız şekli', 'rest', false, MOUTHS], mood: ['Pip\'in ruh hâli', 'happy', false, MOODS], big: ['Ekranda büyük gösterilen metin', 'TH'], ipa: ['IPA', 'θ'], say: ['Seslendirilecek örnek', 'think'], accent: ['Aksan', '', false, ['us', 'uk']] },
  'Seviyeler': { id: ['Kimlik', 'a1', true], cefr: ['CEFR', 'A1', true], title: ['Seviye adı', 'Başlangıç', true], emoji: ['Emoji', '🌱'], desc: ['Açıklama', 'Sıfırdan başlıyorum'], dailyNew: ['Günlük yeni kelime', 6], units: ['Ünite numaraları', '1 | 2', true], themes: ['Tema kimlikleri', 'food | home'], patterns: ['Kalıp kimlikleri', 'into | lets'], lessons: ['Ders kimlikleri', 'th | ship'] },
  'Market ürünleri': { id: ID, slot: ['Yuva (şapka, gözlük, tema…)', 'hat', true, SLOTS], name: ['Ürün adı', 'Bere', true], art: ['Görsel anahtarı', 'beanie', true], rarity: ['Nadirlik', 'common', false, ['common', 'rare', 'epic', 'legendary']], enabled: ['Yayında mı?', 'evet'], drop: ['Sandıktan düşebilir mi?', 'hayır'], isNew: ['"Yeni" etiketi', 'hayır'], tag: ['Alt kategori çipi', 'Şapka'], desc: ['Açıklama', 'Kış için sıcacık.'], price: ['Fiyat (json): free / coins / premium / paid', '{"type":"coins","coins":100}', true], colors: ['Renkler (json)', '{"c1":"#FF6B45"}'], variants: ['Renk seçenekleri', '#5FD14A | #E5484D'] },
  'E-posta şablonları': { id: ['Şablon kimliği', 'verify', true], name: ['Panelde görünen ad', 'E-posta doğrulama'], kind: ['Tür', 'system'], enabled: ['Etkin mi?', 'evet'], subject: ['Konu ({name}, {code} kullanılabilir)', '{code} — doğrulama kodun', true], title: ['E-posta başlığı', 'Hoş geldin, {name}!'], body: ['İçerik metni', 'Hesabını etkinleştir…', true] },
  'Plan özellikleri': { 'özellik': ['Özellik anahtarı (değiştirme)', 'pairsPerDay', true], 'açıklama': ['Ne işe yaradığı (salt okunur)', ''], free: ['Ücretsiz plan: sayı (-1 = sınırsız) ya da evet/hayır', 2, true], premium: ['Premium plan', -1, true] },
  'Genel ayarlar': { ayar: ['Ayar anahtarı (değiştirme)', 'whatsapp', true], 'değer': ['Değer', '905075973367', true] },
};
const docOf = (sheet, col) => DOCS[sheet]?.[col] || [];
const hdr = (sheet, col, kind, ro) => col + (docOf(sheet, col)[2] && !ro ? ' *' : '') + (ro ? ' [salt okunur]' : KIND_TAG[kind] ? ` [${KIND_TAG[kind]}]` : '');

function sheetRows(spec, value, empty) {
  const items = itemsOf(spec, value), out = [];
  if (spec.map !== undefined) {
    const labels = Object.fromEntries(FEATURES.map(f => [f.key, `${f.group} · ${f.label}${f.type === 'limit' ? ' (-1 = sınırsız)' : ''}`]));
    out.push({ name: spec.name, plain: spec.cols, kinds: spec.cols.map(() => 'text'), cols: spec.cols.map(c => hdr(spec.name, c, 'text', spec.ro?.includes(c))), rows: empty ? [] : items.map(({ [spec.id]: k, _v: x }) => spec.map
      ? [k, labels[k] || '', toCell(x?.free, typeof x?.free === 'boolean' ? 'bool' : 'num'), toCell(x?.premium, typeof x?.premium === 'boolean' ? 'bool' : 'num')]
      : [k, toCell(x, Array.isArray(x) && x.every(y => typeof y === 'string') ? 'list' : typeof x === 'object' ? 'json' : typeof x === 'boolean' ? 'bool' : 'text')]) });
    return out;
  }
  const cols = columnsOf(spec, items), kinds = cols.map(c => spec.tuple ? 'text' : kindOf(spec, c, items));
  out.push({ name: spec.name, plain: cols, kinds, cols: cols.map((c, i) => hdr(spec.name, c, kinds[i])), rows: empty ? [] : items.map(it => spec.tuple ? cols.map((_, i) => toCell(it[i], 'text')) : cols.map((c, i) => toCell(it[c], kinds[i]))) });
  if (spec.child) {
    const ch = spec.child, kids = items.flatMap(it => (it[ch.field] || []).map(k => [rowId(spec, it), k]));
    const ccols = ch.tuple ? ch.cols : [...ch.cols, ...[...new Set(kids.flatMap(([, k]) => Object.keys(k || {})))].filter(k => !ch.cols.includes(k))];
    const ckinds = ccols.map(c => ch.tuple ? 'text' : kindOf(ch, c, kids.map(([, k]) => k)));
    out.push({ name: ch.name, plain: [ch.parent, ...ccols], kinds: ['text', ...ckinds], cols: [hdr(ch.name, ch.parent, 'text'), ...ccols.map((c, i) => hdr(ch.name, c, ckinds[i]))], rows: empty ? [] : kids.map(([pid, k]) => [pid, ...(ch.tuple ? ccols.map((_, i) => toCell(k[i], 'text')) : ccols.map((c, i) => toCell(k[c], ckinds[i])))]) });
  }
  return out;
}

export function exportSheets(getContent, { keys = SHEET_KEYS, empty = false } = {}) {
  const specs = SHEETS.filter(s => keys.includes(s.key));
  const data = specs.flatMap(s => sheetRows(s, getContent(s.key), empty));
  const all = specs.length === SHEETS.length;
  const title = all ? 'Linggo · tüm içerik şablonu' : `Linggo · ${specs.map(s => s.name).join(' + ')} şablonu`;
  // guide sheet: how-to + one column table per data sheet
  const guide = [], styles = {};
  const push = (row, st) => { if (st != null) styles[guide.length] = st; guide.push(row); };
  push([title, '', '', ''], 5);
  push([`Oluşturulma: ${new Date().toLocaleString('tr-TR')} · ${data.reduce((n, d) => n + d.rows.length, 0)} satır`, '', '', ''], 7);
  push(['', '', '', '']);
  push(['Nasıl kullanılır?', '', '', ''], 6);
  for (const t of [
    '1) İlgili sayfada satırları düzenle, yeni satır ekle ya da sil. Başlık satırına dokunma.',
    '2) Dosyayı .xlsx olarak kaydet (Excel, Google E-Tablolar veya Numbers).',
    '3) Yönetim panelinde aynı içerik sayfasında "Excel yükle"ye bas, farkları gör ve onayla. Onaylamadan hiçbir şey kaydedilmez.',
    'Koyu başlık + yıldız (*) = zorunlu sütun. Yeşil başlık = isteğe bağlı.',
    'Açılır listeli hücrelerde yalnızca listedeki değerler kullanılabilir.',
    'Liste hücreleri: öğeleri dikey çizgiyle ayır → ship | sit | big   ·   Evet/hayır hücreleri: evet ya da hayır',
    'İlk sütun (kimlik) satırı eşleştirir: aynı kimlik = güncelle, yeni kimlik = ekle. "Dosyayla değiştir" modunda dosyada olmayan satırlar silinir.',
    'Her kaydın önceki sürümü saklanır; panelden "Toplu veri & geçmiş" sayfasında tek tıkla geri alınabilir.',
  ]) push([t, '', '', ''], 2);
  for (const d of data) {
    push(['', '', '', '']);
    push([`📄 ${d.name}`, '', '', ''], 6);
    push(['Sütun', 'Ne yazılır?', 'Örnek', 'Zorunlu'], 3);
    d.plain.forEach((c, i) => {
      const [desc, ex, req, en] = docOf(d.name, c);
      const list = typeof en === 'function' ? en(getContent) : en;
      push([c, (desc || (KIND_TAG[d.kinds[i]] ? `Biçim: ${KIND_TAG[d.kinds[i]]}` : '')) + (list?.length ? `  ·  Seçenekler: ${list.slice(0, 14).join(', ')}${list.length > 14 ? '…' : ''}` : ''), ex ?? '', req ? 'evet' : ''], 2);
    });
  }
  const sheetOf = d => {
    const required = new Set(d.plain.map((c, i) => docOf(d.name, c)[2] ? i : -1).filter(i => i >= 0));
    const validations = d.plain.map((c, i) => {
      const en = docOf(d.name, c)[3], list = typeof en === 'function' ? en(getContent) : en;
      if (list?.length && list.join(',').length < 250) return { col: i, list };
      if (d.kinds[i] === 'bool') return { col: i, list: ['evet', 'hayır'] };
      return null;
    }).filter(Boolean);
    return { name: d.name, rows: [d.cols, ...d.rows], required, validations, zebra: true, widths: d.cols.map(c => /tip|note|desc|body|cap|ex\b|exTr|açıklama|değer|price|colors|scenes|pairs|pattern|subject/.test(c) ? 42 : /^(id|en|us|uk|pos|emoji|color|kelime|ipa|min|ms|free|premium|cefr|hard|enabled|drop|isNew)/.test(c) ? 14 : 22) };
  };
  return [{ name: 'Nasıl kullanılır', rows: guide, header: false, wrap: true, rowStyles: styles, widths: [24, 92, 34, 10] }, ...data.map(sheetOf)];
}

// ---------- import: workbook sheets → candidate values
function readRows(sheet, where) {
  const [head = [], ...body] = sheet.rows;
  const cols = head.map(plainHeader);
  const rows = body.map((r, i) => ({ n: i + 2, cells: r })).filter(r => r.cells.some(c => String(c ?? '').trim() !== ''));
  if (!cols.some(Boolean)) throw new Error(`${where}: başlık satırı bulunamadı.`);
  return { cols, rows };
}
const itemFrom = (spec, cols, cells, sample, where) => {
  const o = {};
  cols.forEach((c, i) => { if (!c || spec.ro?.includes(c)) return; const v = fromCell(cells[i], kindOf(spec, c, sample), `${where} · ${c}`); if (v !== undefined) o[c] = v; });
  return o;
};

// mode: 'merge' (update + add; keep rows missing from the file) | 'replace' (file = whole collection)
export function buildCandidates(sheets, getContent, mode) {
  const byName = new Map(sheets.map(s => [s.name.trim().toLocaleLowerCase('tr-TR'), s]));
  const find = n => byName.get(n.toLocaleLowerCase('tr-TR'));
  const out = {}, errors = {}, unknown = sheets.map(s => s.name).filter(n => n !== 'Nasıl kullanılır' && !SHEETS.some(s => s.name === n || s.child?.name === n));
  for (const spec of SHEETS) {
    const sh = find(spec.name), chSh = spec.child && find(spec.child.name);
    if (!sh && !chSh) continue;
    try {
      const cur = getContent(spec.key), curItems = itemsOf(spec, cur);
      let next;
      if (spec.map !== undefined) {
        const { cols, rows } = readRows(sh, spec.name), ki = cols.indexOf(spec.id);
        if (ki < 0) throw new Error(`${spec.name}: "${spec.id}" sütunu yok.`);
        const obj = structuredClone(spec.map ? cur?.[spec.map] || {} : cur || {}), base = structuredClone(obj); // config maps: rows only update keys, never delete
        for (const r of rows) {
          const k = String(r.cells[ki] ?? '').trim(); if (!k) continue;
          const where = `${spec.name} satır ${r.n}`, old = base[k];
          if (spec.map) {
            const cell = c => { const i = cols.indexOf(c); return i < 0 ? undefined : r.cells[i]; };
            const conv = (s, prev) => typeof prev === 'boolean' || /^(evet|hayır|true|false)$/i.test(String(s).trim()) ? fromCell(s, 'bool', where) : fromCell(s, 'num', where);
            obj[k] = { ...(old || {}), ...(cell('free') !== undefined ? { free: conv(cell('free'), old?.free) } : {}), ...(cell('premium') !== undefined ? { premium: conv(cell('premium'), old?.premium) } : {}) };
          } else {
            const vi = cols.indexOf('değer'), s = r.cells[vi];
            obj[k] = Array.isArray(old) && old.every(x => typeof x === 'string') ? fromCell(s, 'list', where) || [] : old && typeof old === 'object' ? fromCell(s, 'json', where) : typeof old === 'boolean' ? fromCell(s, 'bool', where) : typeof old === 'number' ? fromCell(s, 'num', where) : String(s ?? '');
          }
        }
        next = spec.map ? { ...cur, [spec.map]: obj } : obj;
      } else {
        const idOfRow = it => rowId(spec, it);
        let items = curItems.map(x => structuredClone(x));
        if (sh) {
          const { cols, rows } = readRows(sh, spec.name);
          if (!spec.tuple && !cols.includes(spec.id)) throw new Error(`${spec.name}: kimlik sütunu "${spec.id}" bulunamadı.`);
          const fileItems = rows.map(r => spec.tuple ? spec.tuple.map((c, i) => String(r.cells[cols.indexOf(c)] ?? (cols.indexOf(c) < 0 ? r.cells[i] : '') ?? '').trim()) : itemFrom(spec, cols, r.cells, curItems, `${spec.name} satır ${r.n}`));
          const seen = new Set();
          for (const [i, it] of fileItems.entries()) { const id = idOfRow(it); if (!id) throw new Error(`${spec.name} satır ${rows[i].n}: kimlik boş.`); if (seen.has(id)) throw new Error(`${spec.name}: "${id}" iki kez yazılmış (satır ${rows[i].n}).`); seen.add(id); }
          const curMap = new Map(items.map(x => [idOfRow(x), x]));
          // a row keeps the fields the sheet does not show (children, hidden technical fields)
          const merged = fileItems.map(it => { const old = curMap.get(idOfRow(it)); if (spec.tuple || !old) return it; const keep = Object.fromEntries(Object.entries(old).filter(([k]) => !cols.includes(k))); return { ...keep, ...it }; });
          if (mode === 'replace') items = merged;
          else { const fm = new Map(merged.map(x => [idOfRow(x), x])); items = items.map(x => fm.get(idOfRow(x)) || x); for (const x of merged) if (!curMap.has(idOfRow(x))) items.push(x); }
        }
        if (chSh) {
          const ch = spec.child, { cols, rows } = readRows(chSh, ch.name), pi = cols.indexOf(ch.parent);
          if (pi < 0) throw new Error(`${ch.name}: "${ch.parent}" sütunu bulunamadı.`);
          const groups = new Map();
          const sample = curItems.flatMap(x => x[ch.field] || []);
          for (const r of rows) {
            const pid = String(r.cells[pi] ?? '').trim(); const where = `${ch.name} satır ${r.n}`;
            if (!pid) throw new Error(`${where}: "${ch.parent}" boş.`);
            const kid = ch.tuple ? ch.tuple.map(c => String(r.cells[cols.indexOf(c)] ?? '').trim()) : itemFrom(ch, cols.map((c, i) => i === pi ? '' : c), r.cells, sample, where);
            (groups.get(pid) || groups.set(pid, []).get(pid)).push(kid);
          }
          const idx = new Map(items.map(x => [idOfRow(x), x]));
          for (const [pid, kids] of groups) {
            const parent = idx.get(spec.ci ? pid.toLowerCase() : pid);
            if (!parent) { if (mode === 'replace' && sh) continue; throw new Error(`${ch.name}: "${pid}" kimlikli kayıt "${spec.name}" sayfasında yok.`); } // replace: rows of a deleted parent go with it
            parent[ch.field] = kids;
          }
          if (mode === 'replace' && sh) for (const it of items) if (!groups.has(idOfRow(it))) it[ch.field] = [];
        }
        next = spec.path ? { ...cur, [spec.path]: items } : items;
      }
      out[spec.key] = next;
    } catch (e) { errors[spec.key] = e.message; }
  }
  return { values: out, errors, unknown };
}

// ---------- diff (for previews and change logs)
// empty strings / null count as "not set", so a round trip through a spreadsheet is not a change
const stable = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).filter(([, y]) => y !== '' && y != null).sort(([a], [b]) => a.localeCompare(b))) : x);
const labelOf = (spec, it) => spec.tuple ? `${it[0]} / ${it[2]}` : spec.map !== undefined ? it[spec.id] : String(it.title || it.name || it.pattern || it[spec.id] || '');
export function diffContent(key, before, after) {
  const spec = SHEETS.find(s => s.key === key);
  if (!spec) return { changed: stable(before) !== stable(after), added: [], updated: [], removed: [] };
  const a = itemsOf(spec, before), b = itemsOf(spec, after);
  const am = new Map(a.map(x => [rowId(spec, x), x])), bm = new Map(b.map(x => [rowId(spec, x), x]));
  const added = [], updated = [], removed = [];
  for (const [id, x] of bm) {
    const old = am.get(id);
    if (!old) { added.push({ id, label: labelOf(spec, x) }); continue; }
    if (stable(old) === stable(x)) continue;
    const fields = spec.tuple ? spec.tuple.filter((_, i) => old[i] !== x[i]) : spec.map !== undefined ? Object.keys({ ...old._v, ...x._v }).filter(k => stable(old._v?.[k]) !== stable(x._v?.[k])) : [...new Set([...Object.keys(old), ...Object.keys(x)])].filter(k => stable(old[k]) !== stable(x[k]));
    updated.push({ id, label: labelOf(spec, x), fields: spec.map !== undefined && !spec.map ? ['değer'] : fields });
  }
  for (const [id, x] of am) if (!bm.has(id)) removed.push({ id, label: labelOf(spec, x) });
  const order = !added.length && !removed.length && a.length === b.length && a.some((x, i) => rowId(spec, x) !== rowId(spec, b[i]));
  // outside the edited array (e.g. market rewards, level placement settings)
  const rest = v => { if (!spec.path && spec.map === undefined) return null; const o = { ...(v || {}) }; delete o[spec.path || spec.map]; return stable(o); };
  const other = spec.map !== '' && rest(before) !== rest(after);
  return { changed: !!(added.length || updated.length || removed.length || order || other), added, updated, removed, reordered: order, other };
}
export const summaryText = d => [d.added?.length && `+${d.added.length} eklendi`, d.updated?.length && `${d.updated.length} güncellendi`, d.removed?.length && `−${d.removed.length} silindi`, d.reordered && 'sıra değişti', d.other && 'ayarlar değişti'].filter(Boolean).join(' · ') || 'değişiklik yok';
export const trimDiff = (d, n = 60) => ({ ...d, added: d.added.slice(0, n), updated: d.updated.slice(0, n), removed: d.removed.slice(0, n), counts: { added: d.added.length, updated: d.updated.length, removed: d.removed.length } });

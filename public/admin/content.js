// Yönetim paneli — içerik editörleri (kelimeler, temalar, kalıplar, dersler, telaffuz, planlar & ayarlar)
import { api } from '/js/api.js';
import { icon, esc, toast } from '/js/ui.js';
import { pip } from '/js/mascot.js';
import { A, topbar, modal, confirmBox, setLeaveGuard, fmt, fdt } from './admin.js';
import { announceHTML, wireAnnounce, ANNOUNCE_FX, ANNOUNCE_TONES } from '/js/announce.js';

const clone = v => JSON.parse(JSON.stringify(v));
const UP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>`;
const DOWN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>`;
const TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>`;
const PLUS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
const POS = [['', '—'], ['n', 'isim'], ['v', 'fiil'], ['adj', 'sıfat'], ['adv', 'zarf'], ['prep', 'edat'], ['pron', 'zamir'], ['conj', 'bağlaç'], ['det', 'belirleyici'], ['num', 'sayı'], ['int', 'ünlem']];
const MOUTHS = ['rest', 'smile', 'round', 'open', 'wide', 'mid', 'th', 'fv', 'closed'];
const MOODS = ['', 'idle', 'happy', 'think', 'wow', 'sad', 'sleep', 'love', 'ouch'];
const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return false; [arr[i], arr[j]] = [arr[j], arr[i]]; return true; };
const opt = (list, v) => list.map(x => { const [val, l] = Array.isArray(x) ? x : [x, x || '—']; return `<option value="${esc(val)}" ${String(val) === String(v ?? '') ? 'selected' : ''}>${esc(l)}</option>`; }).join('');

async function content(force = false) {
  if (!A.content || force) A.content = (await api('/api/admin/content')).content;
  return A.content;
}
async function save(key, value) {
  await api('/api/admin/content/' + key, { method: 'PUT', body: { value } });
  A.content[key] = clone(value);
  toast('Kaydedildi — üyeler bir sonraki açılışta yeni içeriği görür ✅');
}
async function resetKey(key, label) {
  if (!(await confirmBox({ title: `${label} varsayılana dönsün mü?`, text: 'Yaptığın tüm düzenlemeler silinir ve ilk kurulumdaki içerik geri yüklenir.', ok: 'Varsayılana dön', danger: true }))) return false;
  const r = await api(`/api/admin/content/${key}/reset`, { method: 'POST', body: {} });
  A.content[key] = r.value; toast('Varsayılan içerik geri yüklendi'); return true;
}

// Sticky "unsaved changes" bar
function dirtyBar(el, { onSave, onDiscard }) {
  const bar = document.createElement('div'); bar.className = 'dirty-bar';
  bar.innerHTML = `<span>●</span><b>Kaydedilmemiş değişiklikler</b><span class="muted-note" style="color:rgba(243,238,228,.6)" data-info></span><span class="sp"></span><button class="btn btn-sm btn-ghost" data-discard>Vazgeç</button><button class="btn btn-sm btn-lime" data-save>Kaydet</button>`;
  el.appendChild(bar);
  let dirty = false;
  setLeaveGuard(() => dirty);
  bar.querySelector('[data-discard]').onclick = () => { dirty = false; bar.classList.remove('on'); onDiscard(); };
  bar.querySelector('[data-save]').onclick = async () => {
    const b = bar.querySelector('[data-save]'); b.disabled = true;
    try { await onSave(); dirty = false; bar.classList.remove('on'); }
    catch (e) { modal(`<h3>Kaydedilemedi</h3><p class="form-err mt-s">${esc(e.message)}</p><button class="btn btn-primary btn-block mt" data-x>Tamam</button>`); }
    finally { b.disabled = false; }
  };
  return { mark(info = '') { dirty = true; bar.classList.add('on'); bar.querySelector('[data-info]').textContent = info; }, get dirty() { return dirty; } };
}

function bulkModal({ title, hint, placeholder, positions, onAdd }) {
  modal(`<h3>${title}</h3><p class="muted small">${hint}</p>
    <textarea class="inp code mt-s" style="min-height:220px;width:100%" placeholder="${esc(placeholder)}" data-t></textarea>
    ${positions ? `<label class="lbl mt-s">Nereye eklensin?<select class="sel" data-pos>${positions.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>` : ''}
    <div data-err></div>
    <div class="row gap-s mt"><button class="btn btn-ghost grow" data-x>Vazgeç</button><button class="btn btn-primary grow" data-add>Ekle</button></div>`, (m, close) => {
    m.querySelector('[data-add]').onclick = () => {
      const lines = m.querySelector('[data-t]').value.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const err = onAdd(lines, m.querySelector('[data-pos]')?.value);
      if (err) m.querySelector('[data-err]').innerHTML = `<div class="form-err mt-s">${esc(err)}</div>`; else close();
    };
  });
}

// ======================================================================
// Words (frequency list, managed unit by unit = level by level)
// ======================================================================
async function wordsPage(el, arg) {
  const C = await content();
  if (!A.insights) A.insights = await api('/api/admin/insights').catch(() => null);
  const hard = new Map((A.insights?.words || []).map(r => [r.item.slice(2), r.rate]));
  let list = C.freq.map(w => ({ ...w, _o: w.en }));
  const free = 999; // erişim artık seviye + plan matrisiyle belirlenir
  let unit = 1, q = '';
  if (arg) { const i = list.findIndex(w => w.en.toLowerCase() === arg.toLowerCase()); if (i >= 0) { unit = Math.floor(i / 100) + 1; q = arg; } }

  el.innerHTML = `${topbar('Kelimeler', `En çok kullanılan liste · ${fmt(list.length)} kelime · her 100 kelime bir ünite (seviye). Sıra = sıklık sırası.`,
    `<button class="btn btn-sm btn-soft" data-bulk>${PLUS} Toplu ekle</button><button class="btn btn-sm btn-ghost" data-reset>Varsayılana dön</button>`)}
    <div class="warn-note mb">💡 Bir kelimenin <b>İngilizcesini</b> değiştirmek, üyelerin o kelimedeki ilerlemesini sıfırlar (ilerleme İngilizce kelimeye bağlıdır). Türkçe anlam ve tür serbestçe düzenlenebilir.</div>
    <div class="chips-bar" data-units></div>
    <div class="toolbar"><label class="search">${icon.search}<input data-q placeholder="Tüm listede ara (İngilizce / Türkçe)" value="${esc(q)}"></label><span class="sp"></span><button class="btn btn-sm btn-primary" data-add>${PLUS} Bu üniteye kelime ekle</button></div>
    <section class="panel" style="padding:6px"><div class="tbl-wrap" data-tbl></div></section>`;
  const bar = dirtyBar(el, {
    onSave: async () => { await save('freq', list.map(({ _o, ...w }) => ({ en: w.en.trim(), tr: w.tr.trim(), pos: w.pos || '', us: (w.us || '').trim(), uk: (w.uk || '').trim() }))); list = A.content.freq.map(w => ({ ...w, _o: w.en })); draw(); },
    onDiscard: () => { list = A.content.freq.map(w => ({ ...w, _o: w.en })); draw(); },
  });
  const dupes = () => { const seen = new Map(), d = new Set(); list.forEach(w => { const k = w.en.trim().toLowerCase(); if (seen.has(k)) d.add(k); seen.set(k, 1); }); return d; };
  function draw() {
    const units = Math.ceil(list.length / 100);
    unit = Math.min(unit, units) || 1;
    el.querySelector('[data-units]').innerHTML = Array.from({ length: units }, (_, i) => `<button class="chip ${i + 1 === unit && !q ? 'on' : ''}" data-u="${i + 1}">${i + 1 > free ? icon.lock.replace('<svg', '<svg class="lk"') : ''}Ünite ${i + 1}${i * 100 >= 1000 ? ' · bonus' : ''}</button>`).join('');
    el.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { unit = +b.dataset.u; q = ''; el.querySelector('[data-q]').value = ''; draw(); });
    const d = dupes();
    const rows = q ? list.map((w, i) => [w, i]).filter(([w]) => w.en.toLowerCase().includes(q.toLowerCase()) || w.tr.toLowerCase().includes(q.toLowerCase())).slice(0, 200)
      : list.slice((unit - 1) * 100, unit * 100).map((w, k) => [w, (unit - 1) * 100 + k]);
    el.querySelector('[data-tbl]').innerHTML = rows.length ? `<table class="tbl"><thead><tr><th class="num">#</th><th>İngilizce</th><th>Türkçe anlam</th><th>Tür</th><th>🇺🇸 IPA</th><th>🇬🇧 IPA</th><th>Zorluk</th><th></th></tr></thead><tbody>
      ${rows.map(([w, i]) => `<tr data-i="${i}"><td class="num faint">${i + 1}</td>
        <td><input class="cell-in ${w.en !== w._o ? 'changed' : ''} ${d.has(w.en.trim().toLowerCase()) || !w.en.trim() ? 'bad' : ''}" data-f="en" value="${esc(w.en)}" title="${w._o && w.en !== w._o ? 'Önceki: ' + esc(w._o) : ''}"></td>
        <td><input class="cell-in ${!w.tr.trim() ? 'bad' : ''}" data-f="tr" value="${esc(w.tr)}"></td>
        <td><select class="cell-in" data-f="pos">${opt(POS, w.pos)}</select></td>
        <td><input class="cell-in ipa" style="min-width:110px" data-f="us" value="${esc(w.us || '')}"></td><td><input class="cell-in ipa" style="min-width:110px" data-f="uk" value="${esc(w.uk || '')}"></td>
        <td>${hard.has(w.en.toLowerCase()) ? `<span class="flag ${hard.get(w.en.toLowerCase()) > 50 ? 'bad' : 'warn'}">%${hard.get(w.en.toLowerCase())} hata</span>` : ''}</td>
        <td><div class="row-act"><button class="ib" data-mv="-1" title="Yukarı">${UP}</button><button class="ib" data-mv="1" title="Aşağı">${DOWN}</button><button class="ib del" data-del title="Sil">${TRASH}</button></div></td></tr>`).join('')}</tbody></table>` : '<div class="empty-s">Sonuç yok.</div>';
    el.querySelectorAll('[data-tbl] tr[data-i]').forEach(tr => {
      const i = +tr.dataset.i;
      tr.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener(inp.tagName === 'SELECT' ? 'change' : 'input', () => {
        list[i][inp.dataset.f] = inp.value; bar.mark();
        if (inp.dataset.f === 'en') inp.classList.toggle('changed', inp.value !== list[i]._o);
      }));
      tr.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => { if (move(list, i, +b.dataset.mv)) { bar.mark(); draw(); } });
      tr.querySelector('[data-del]').onclick = () => { list.splice(i, 1); bar.mark(`${list.length} kelime`); draw(); };
    });
  }
  el.querySelector('[data-q]').oninput = e => { q = e.target.value.trim(); draw(); };
  el.querySelector('[data-add]').onclick = () => {
    const at = Math.min(list.length, unit * 100);
    list.splice(at, 0, { en: '', tr: '', pos: '', _o: '' }); q = ''; bar.mark(); draw();
    el.querySelector(`tr[data-i="${at}"] input`)?.focus();
  };
  el.querySelector('[data-bulk]').onclick = () => bulkModal({
    title: 'Toplu kelime ekle', hint: 'Her satıra bir kelime: <b>ingilizce|türkçe anlam|tür|ABD IPA|UK IPA</b> (tür ve IPA isteğe bağlı). Listede zaten olanlar atlanır.',
    placeholder: 'decision|karar|n\nexplain|açıklamak|v', positions: [['unit', `Ünite ${unit} sonuna`], ['end', 'Listenin sonuna']],
    onAdd: (lines, pos) => {
      const have = new Set(list.map(w => w.en.trim().toLowerCase()));
      const add = []; for (const l of lines) { const [en, tr, p, us, uk] = l.split('|').map(s => (s || '').trim()); if (!en || !tr) return `Hatalı satır: "${l}"`; if (!have.has(en.toLowerCase())) { add.push({ en, tr, pos: POS.some(x => x[0] === p) ? p : '', us: us || '', uk: uk || us || '', _o: '' }); have.add(en.toLowerCase()); } }
      list.splice(pos === 'end' ? list.length : Math.min(list.length, unit * 100), 0, ...add); bar.mark(`+${add.length} kelime`); draw(); toast(`${add.length} kelime eklendi (kaydetmeyi unutma)`);
    },
  });
  el.querySelector('[data-reset]').onclick = async () => { if (await resetKey('freq', 'Kelime listesi')) { list = A.content.freq.map(w => ({ ...w, _o: w.en })); draw(); } };
  draw();
}

// ======================================================================
// Themes
// ======================================================================
async function themesPage(el) {
  const C = await content();
  let T = clone(C.themes), sel = 0;
  const free = 999;
  el.innerHTML = `${topbar('Günlük hayat temaları', 'En çok bilinen kelimeler · temalar, emojiler ve örnek cümleler', `<button class="btn btn-sm btn-ghost" data-reset>Varsayılana dön</button>`)}
    <div class="split"><section class="panel"><div class="panel-h"><h2>Temalar</h2><span class="sp"></span><button class="btn btn-xs btn-primary" data-new>${PLUS} Yeni</button></div><div class="list-nav" data-list></div>
      <p class="muted-note mt-s">Hangi temanın hangi seviyede açık olduğunu <a class="link" href="#levels">Seviyeler</a> sayfasından belirle.</p></section>
    <section class="panel" data-ed></section></div>`;
  const bar = dirtyBar(el, { onSave: async () => { await save('themes', T); T = clone(A.content.themes); draw(); }, onDiscard: () => { T = clone(A.content.themes); draw(); } });
  function draw() {
    sel = Math.min(sel, T.length - 1);
    el.querySelector('[data-list]').innerHTML = T.map((t, i) => `<button class="${i === sel ? 'on' : ''}" data-s="${i}"><span style="font-size:20px">${esc(t.emoji)}</span>${esc(t.title)}<small>${i >= free ? '🔒 ' : ''}${t.words.length}</small></button>`).join('');
    el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sel = +b.dataset.s; draw(); });
    const t = T[sel], ed = el.querySelector('[data-ed]');
    if (!t) { ed.innerHTML = '<div class="empty-s">Tema yok.</div>'; return; }
    ed.innerHTML = `<div class="panel-h"><span style="font-size:30px">${esc(t.emoji)}</span><h2>${esc(t.title)}</h2><span class="sp"></span>
        <button class="ib" data-tm="-1" title="Yukarı">${UP}</button><button class="ib" data-tm="1" title="Aşağı">${DOWN}</button><button class="ib del" data-tdel title="Temayı sil">${TRASH}</button></div>
      <div class="form-grid">
        <label class="lbl">Kimlik (URL)<input class="inp" data-m="id" value="${esc(t.id)}"></label>
        <label class="lbl">Başlık<input class="inp" data-m="title" value="${esc(t.title)}"></label>
        <label class="lbl">Emoji<input class="inp" data-m="emoji" value="${esc(t.emoji)}"></label>
        <label class="lbl">Kart rengi<div class="row gap-s"><input type="color" data-m="color" value="${esc(t.color)}" style="width:48px;height:42px;border:0;background:none"><input class="inp grow" data-m="color" value="${esc(t.color)}"></div></label>
      </div>
      <div class="panel-h mt"><h2>Kelimeler (${t.words.length})</h2><span class="sp"></span><button class="btn btn-xs btn-soft" data-bulk>${PLUS} Toplu</button><button class="btn btn-xs btn-primary" data-wadd>${PLUS} Kelime</button></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>İngilizce</th><th>Türkçe</th><th>Emoji</th><th>🇺🇸 IPA</th><th>🇬🇧 IPA</th><th>Örnek cümle</th><th>Çevirisi</th><th></th></tr></thead><tbody>
      ${t.words.map((w, i) => `<tr data-i="${i}"><td><input class="cell-in ${!w.en ? 'bad' : ''}" data-f="en" value="${esc(w.en)}"></td><td><input class="cell-in" data-f="tr" value="${esc(w.tr)}"></td><td><input class="cell-in" style="width:56px" data-f="emoji" value="${esc(w.emoji || '')}"></td><td><input class="cell-in ipa" style="min-width:100px" data-f="us" value="${esc(w.us || '')}"></td><td><input class="cell-in ipa" style="min-width:100px" data-f="uk" value="${esc(w.uk || '')}"></td><td><input class="cell-in" style="min-width:220px" data-f="ex" value="${esc(w.ex || '')}"></td><td><input class="cell-in" style="min-width:200px" data-f="exTr" value="${esc(w.exTr || '')}"></td>
        <td><div class="row-act"><button class="ib" data-mv="-1">${UP}</button><button class="ib" data-mv="1">${DOWN}</button><button class="ib del" data-del>${TRASH}</button></div></td></tr>`).join('')}</tbody></table></div>`;
    ed.querySelectorAll('[data-m]').forEach(inp => inp.addEventListener('input', () => { t[inp.dataset.m] = inp.value.trim(); if (inp.dataset.m === 'color') ed.querySelectorAll('[data-m=color]').forEach(o => { if (o !== inp) o.value = inp.value; }); bar.mark(); if (inp.dataset.m !== 'color') el.querySelector(`[data-s="${sel}"]`).innerHTML = `<span style="font-size:20px">${esc(t.emoji)}</span>${esc(t.title)}<small>${t.words.length}</small>`; }));
    ed.querySelectorAll('tr[data-i]').forEach(tr => {
      const i = +tr.dataset.i;
      tr.querySelectorAll('[data-f]').forEach(inp => inp.oninput = () => { t.words[i][inp.dataset.f] = inp.value; bar.mark(); });
      tr.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => { if (move(t.words, i, +b.dataset.mv)) { bar.mark(); draw(); } });
      tr.querySelector('[data-del]').onclick = () => { t.words.splice(i, 1); bar.mark(); draw(); };
    });
    ed.querySelector('[data-wadd]').onclick = () => { t.words.push({ en: '', tr: '', emoji: '', ex: '', exTr: '' }); bar.mark(); draw(); ed.querySelector('tr:last-child input')?.focus(); };
    ed.querySelector('[data-bulk]').onclick = () => bulkModal({ title: `${t.title} — toplu ekle`, hint: 'Her satıra: <b>ingilizce|türkçe|emoji|örnek cümle|örnek çevirisi</b>', placeholder: 'apple|elma|🍎|I eat an apple every day.|Her gün bir elma yerim.', onAdd: lines => {
      for (const l of lines) { const [en, tr, emoji, ex, exTr] = l.split('|').map(s => (s || '').trim()); if (!en || !tr) return `Hatalı satır: "${l}"`; t.words.push({ en, tr, emoji, ex, exTr }); }
      bar.mark(); draw();
    } });
    ed.querySelectorAll('[data-tm]').forEach(b => b.onclick = () => { if (move(T, sel, +b.dataset.tm)) { sel += +b.dataset.tm; bar.mark(); draw(); } });
    ed.querySelector('[data-tdel]').onclick = async () => { if (await confirmBox({ title: `"${t.title}" silinsin mi?`, text: 'Kaydedene kadar geri alabilirsin.', ok: 'Sil', danger: true })) { T.splice(sel, 1); bar.mark(); draw(); } };
  }
  el.querySelector('[data-new]').onclick = () => { T.push({ id: `tema-${T.length + 1}`, title: 'Yeni tema', emoji: '✨', color: '#D4F65A', words: [] }); sel = T.length - 1; bar.mark(); draw(); };
  el.querySelector('[data-reset]').onclick = async () => { if (await resetKey('themes', 'Temalar')) { T = clone(A.content.themes); draw(); } };
  draw();
}

// ======================================================================
// Patterns
// ======================================================================
async function patternsPage(el, arg) {
  const C = await content();
  let cats = clone(C.patternCats), P = clone(C.patterns), sel = 0, q = arg || '', dirtyCats = false;
  if (arg) { const i = P.findIndex(p => p.pattern === arg || p.id === arg); if (i >= 0) { sel = i; q = ''; } }
  const free = 999;
  el.innerHTML = `${topbar('Cümle kalıpları', `${P.length} kalıp · seviyelere dağılım Seviyeler sayfasında`, `<button class="btn btn-sm btn-soft" data-cats>Kategoriler</button><button class="btn btn-sm btn-ghost" data-reset>Varsayılana dön</button>`)}
    <div class="split"><section class="panel"><div class="panel-h"><h2>Kalıplar</h2><span class="sp"></span><button class="btn btn-xs btn-primary" data-new>${PLUS} Yeni</button></div>
      <label class="search mb" style="height:40px">${icon.search}<input data-q placeholder="Ara" value="${esc(q)}"></label><div class="list-nav" data-list></div></section>
    <section class="panel" data-ed></section></div>`;
  const bar = dirtyBar(el, {
    onSave: async () => { if (dirtyCats) await save('patternCats', cats); await save('patterns', P); dirtyCats = false; cats = clone(A.content.patternCats); P = clone(A.content.patterns); draw(); },
    onDiscard: () => { cats = clone(A.content.patternCats); P = clone(A.content.patterns); dirtyCats = false; draw(); },
  });
  const catOf = id => cats.find(c => c.id === id);
  function draw() {
    sel = Math.max(0, Math.min(sel, P.length - 1));
    const items = P.map((p, i) => [p, i]).filter(([p]) => !q || (p.pattern + p.tr + p.id).toLowerCase().includes(q.toLowerCase()));
    el.querySelector('[data-list]').innerHTML = items.map(([p, i]) => `<button class="${i === sel ? 'on' : ''}" data-s="${i}"><span>${esc(catOf(p.cat)?.emoji || '•')}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.pattern)}</span><small>${i >= free ? '🔒' : i + 1}</small></button>`).join('');
    el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sel = +b.dataset.s; draw(); });
    const p = P[sel], ed = el.querySelector('[data-ed]');
    if (!p) { ed.innerHTML = '<div class="empty-s">Kalıp yok.</div>'; return; }
    const keyOk = e => p.key && e.toLowerCase().includes(p.key.toLowerCase());
    ed.innerHTML = `<div class="panel-h"><h2>${esc(p.pattern)}</h2><span class="sp"></span><span class="muted-note">#${sel + 1} ${sel >= free ? '· Premium' : '· Ücretsiz'}</span>
        <button class="ib" data-pm="-1">${UP}</button><button class="ib" data-pm="1">${DOWN}</button><button class="ib del" data-pdel>${TRASH}</button></div>
      <div class="form-grid">
        <label class="lbl">Kimlik<input class="inp" data-m="id" value="${esc(p.id)}"></label>
        <label class="lbl">Kategori<select class="sel" data-m="cat">${cats.map(c => `<option value="${esc(c.id)}" ${c.id === p.cat ? 'selected' : ''}>${esc(c.emoji)} ${esc(c.title)}</option>`).join('')}</select></label>
        <label class="lbl full">Kalıp formülü <span class="muted-note">(V1, V-ing, isim, cümle gibi boşluklar italik gösterilir)</span><input class="inp" data-m="pattern" value="${esc(p.pattern)}"></label>
        <label class="lbl">Anahtar ifade <span class="muted-note">(boşluk doldurmada gizlenir)</span><input class="inp" data-m="key" value="${esc(p.key)}"></label>
        <label class="lbl">Türkçe anlam<input class="inp" data-m="tr" value="${esc(p.tr)}"></label>
        <label class="lbl full">Kullanım notu<textarea class="inp" data-m="note">${esc(p.note || '')}</textarea></label>
      </div>
      <div class="panel-h mt"><h2>Örnekler</h2><span class="sp"></span><p>her örnekte anahtar ifade geçmeli · en az 3</p><button class="btn btn-xs btn-primary" data-exadd>${PLUS} Örnek</button></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>İngilizce</th><th>Türkçe</th><th></th></tr></thead><tbody>
      ${p.ex.map((e, i) => `<tr data-i="${i}"><td>${keyOk(e[0]) ? '<span class="ok-inline">✓</span>' : '<span class="bad-inline" title="Anahtar ifade geçmiyor">✕</span>'}</td><td><input class="cell-in ${keyOk(e[0]) ? '' : 'bad'}" style="min-width:260px" data-e="0" value="${esc(e[0])}"></td><td><input class="cell-in" style="min-width:220px" data-e="1" value="${esc(e[1])}"></td><td><button class="ib del" data-exdel>${TRASH}</button></td></tr>`).join('')}</tbody></table></div>
      ${p.ex.length < 3 ? '<p class="bad-inline small mt-s">En az 3 örnek gerekli.</p>' : ''}`;
    ed.querySelectorAll('[data-m]').forEach(inp => inp.addEventListener(inp.tagName === 'SELECT' ? 'change' : 'input', () => { p[inp.dataset.m] = inp.value; bar.mark(); if (inp.dataset.m === 'key') ed.querySelectorAll('tr[data-i]').forEach(tr => { const ok = keyOk(p.ex[+tr.dataset.i][0]); tr.querySelector('[data-e="0"]').classList.toggle('bad', !ok); tr.firstElementChild.innerHTML = ok ? '<span class="ok-inline">✓</span>' : '<span class="bad-inline">✕</span>'; }); }));
    ed.querySelectorAll('tr[data-i]').forEach(tr => {
      const i = +tr.dataset.i;
      tr.querySelectorAll('[data-e]').forEach(inp => inp.oninput = () => { p.ex[i][+inp.dataset.e] = inp.value; bar.mark(); if (inp.dataset.e === '0') { const ok = keyOk(inp.value); inp.classList.toggle('bad', !ok); tr.firstElementChild.innerHTML = ok ? '<span class="ok-inline">✓</span>' : '<span class="bad-inline">✕</span>'; } });
      tr.querySelector('[data-exdel]').onclick = () => { p.ex.splice(i, 1); bar.mark(); draw(); };
    });
    ed.querySelector('[data-exadd]').onclick = () => { p.ex.push(['', '']); bar.mark(); draw(); };
    ed.querySelectorAll('[data-pm]').forEach(b => b.onclick = () => { if (move(P, sel, +b.dataset.pm)) { sel += +b.dataset.pm; bar.mark(); draw(); } });
    ed.querySelector('[data-pdel]').onclick = async () => { if (await confirmBox({ title: 'Kalıp silinsin mi?', ok: 'Sil', danger: true })) { P.splice(sel, 1); bar.mark(); draw(); } };
  }
  el.querySelector('[data-q]').oninput = e => { q = e.target.value; draw(); };
  el.querySelector('[data-new]').onclick = () => { P.push({ id: `kalip-${P.length + 1}`, cat: cats[0].id, pattern: "I'm + …", key: '', tr: '', note: '', ex: [['', ''], ['', ''], ['', '']] }); sel = P.length - 1; q = ''; bar.mark(); draw(); };
  el.querySelector('[data-reset]').onclick = async () => { if (await resetKey('patterns', 'Kalıplar')) { P = clone(A.content.patterns); draw(); } };
  el.querySelector('[data-cats]').onclick = () => modal(`<h3>Kategoriler</h3><p class="muted small">Kimlik (küçük harf), başlık, emoji ve renk.</p>
    <div class="tbl-wrap mt-s"><table class="tbl"><tbody>${cats.map((c, i) => `<tr data-i="${i}"><td><input class="cell-in" data-c="id" value="${esc(c.id)}"></td><td><input class="cell-in" data-c="title" value="${esc(c.title)}"></td><td><input class="cell-in" style="width:48px" data-c="emoji" value="${esc(c.emoji)}"></td><td><input type="color" data-c="color" value="${esc(c.color)}" style="width:36px;height:30px;border:0;background:none"></td></tr>`).join('')}</tbody></table></div>
    <div class="row gap-s mt"><button class="btn btn-soft grow" data-cadd>${PLUS} Kategori</button><button class="btn btn-primary grow" data-x>Tamam</button></div>`, (m, close) => {
    m.querySelectorAll('tr[data-i]').forEach(tr => tr.querySelectorAll('[data-c]').forEach(inp => inp.oninput = () => { cats[+tr.dataset.i][inp.dataset.c] = inp.value.trim(); dirtyCats = true; bar.mark('kategoriler'); }));
    m.querySelector('[data-cadd]').onclick = () => { cats.push({ id: `kat-${cats.length + 1}`, title: 'Yeni kategori', emoji: '💡', color: '#72C4FF' }); dirtyCats = true; bar.mark('kategoriler'); close(); el.querySelector('[data-cats]').click(); };
    m.querySelector('[data-x]').addEventListener('click', () => draw());
  });
  draw();
}

// ======================================================================
// Lessons (scene editor)
// ======================================================================
async function lessonsPage(el) {
  const C = await content();
  let L = clone(C.lessons), sel = 0;
  const free = 999;
  el.innerHTML = `${topbar('Mini dersler', 'Pip\'in animasyonlu dersleri · her sahne: ağız şekli + Türkçe anlatım + İngilizce örnek', `<button class="btn btn-sm btn-ghost" data-reset>Varsayılana dön</button>`)}
    <div class="split"><section class="panel"><div class="panel-h"><h2>Dersler</h2><span class="sp"></span><button class="btn btn-xs btn-primary" data-new>${PLUS} Yeni</button></div><div class="list-nav" data-list></div><p class="muted-note mt-s">Derslerin seviyelere dağılımı: <a class="link" href="#levels">Seviyeler</a>.</p></section>
    <section class="panel" data-ed></section></div>`;
  const bar = dirtyBar(el, { onSave: async () => { await save('lessons', L); L = clone(A.content.lessons); draw(); }, onDiscard: () => { L = clone(A.content.lessons); draw(); } });
  function draw() {
    sel = Math.max(0, Math.min(sel, L.length - 1));
    el.querySelector('[data-list]').innerHTML = L.map((l, i) => `<button class="${i === sel ? 'on' : ''}" data-s="${i}"><span style="width:12px;height:12px;border-radius:4px;background:${esc(l.color)}"></span>${esc(l.title)}<small>${i >= free ? '🔒 ' : ''}${l.scenes.length} sahne</small></button>`).join('');
    el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sel = +b.dataset.s; draw(); });
    const l = L[sel], ed = el.querySelector('[data-ed]');
    if (!l) { ed.innerHTML = '<div class="empty-s">Ders yok.</div>'; return; }
    ed.innerHTML = `<div class="panel-h"><h2>${esc(l.title)}</h2><span class="sp"></span><a class="btn btn-xs btn-soft" href="/#/lesson/${esc(l.id)}" target="_blank" rel="noopener">${icon.play} Önizle</a>
        <button class="ib" data-lm="-1">${UP}</button><button class="ib" data-lm="1">${DOWN}</button><button class="ib del" data-ldel>${TRASH}</button></div>
      <div class="form-grid">
        <label class="lbl">Kimlik<input class="inp" data-m="id" value="${esc(l.id)}"></label>
        <label class="lbl">Başlık<input class="inp" data-m="title" value="${esc(l.title)}"></label>
        <label class="lbl">Alt başlık<input class="inp" data-m="sub" value="${esc(l.sub || '')}"></label>
        <label class="lbl">Süre (dk)<input class="inp" type="number" min="1" data-m="min" value="${l.min || 2}"></label>
        <label class="lbl">Renk<input type="color" data-m="color" value="${esc(l.color)}" style="width:100%;height:42px;border:0;background:none"></label>
      </div>
      <div class="panel-h mt"><h2>Sahneler</h2><span class="sp"></span><p>Önizleme için önce kaydet</p><button class="btn btn-xs btn-primary" data-sadd>${PLUS} Sahne</button></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Ağız</th><th>Ruh hâli</th><th>İngilizce anlatım (Pip seslendirir)</th><th>Türkçe altyazı</th><th>Örnek (İngilizce)</th><th>Ekranda büyük yazı</th><th>Aksan</th><th>IPA</th><th></th></tr></thead><tbody>
      ${l.scenes.map((s, i) => `<tr data-i="${i}"><td class="faint">${i + 1}</td>
        <td><select class="cell-in" data-f="mouth">${opt(MOUTHS, s.mouth)}</select></td><td><select class="cell-in" data-f="mood">${opt(MOODS, s.mood)}</select></td>
        <td><textarea class="cell-in ${!s.capEn ? 'bad' : ''}" data-f="capEn" rows="2" style="min-width:260px;height:auto;padding:6px 8px" lang="en">${esc(s.capEn || '')}</textarea></td>
        <td><textarea class="cell-in ${!s.cap ? 'bad' : ''}" data-f="cap" rows="2" style="min-width:260px;height:auto;padding:6px 8px">${esc(s.cap)}</textarea></td>
        <td><input class="cell-in" style="min-width:160px" data-f="say" value="${esc(s.say || '')}"></td><td><input class="cell-in" style="min-width:130px" data-f="big" value="${esc(s.big || '')}"></td>
        <td><select class="cell-in" data-f="accent">${opt([['', 'Üye'], ['us', 'ABD'], ['uk', 'UK']], s.accent)}</select></td>
        <td><input type="checkbox" data-f="ipa" ${s.ipa ? 'checked' : ''}></td>
        <td><div class="row-act"><button class="ib" data-mv="-1">${UP}</button><button class="ib" data-mv="1">${DOWN}</button><button class="ib del" data-del>${TRASH}</button></div></td></tr>`).join('')}</tbody></table></div>`;
    ed.querySelectorAll('[data-m]').forEach(inp => inp.oninput = () => { l[inp.dataset.m] = inp.dataset.m === 'min' ? +inp.value : inp.value; bar.mark(); });
    ed.querySelectorAll('tr[data-i]').forEach(tr => {
      const i = +tr.dataset.i, s = l.scenes[i];
      tr.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener(inp.type === 'checkbox' || inp.tagName === 'SELECT' ? 'change' : 'input', () => {
        const f = inp.dataset.f; const v = inp.type === 'checkbox' ? inp.checked : inp.value;
        if (v === '' || v === false) delete s[f]; else s[f] = v; bar.mark();
      }));
      tr.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => { if (move(l.scenes, i, +b.dataset.mv)) { bar.mark(); draw(); } });
      tr.querySelector('[data-del]').onclick = () => { l.scenes.splice(i, 1); bar.mark(); draw(); };
    });
    ed.querySelector('[data-sadd]').onclick = () => { l.scenes.push({ mouth: 'rest', cap: '' }); bar.mark(); draw(); };
    ed.querySelectorAll('[data-lm]').forEach(b => b.onclick = () => { if (move(L, sel, +b.dataset.lm)) { sel += +b.dataset.lm; bar.mark(); draw(); } });
    ed.querySelector('[data-ldel]').onclick = async () => { if (await confirmBox({ title: 'Ders silinsin mi?', ok: 'Sil', danger: true })) { L.splice(sel, 1); bar.mark(); draw(); } };
  }
  el.querySelector('[data-new]').onclick = () => { L.push({ id: `ders-${L.length + 1}`, title: 'Yeni ders', sub: '', color: '#D4F65A', min: 2, scenes: [{ mouth: 'rest', mood: 'happy', cap: 'Merhaba, ben Pip!', big: '👋' }, { mouth: 'mid', cap: '', say: '' }] }); sel = L.length - 1; bar.mark(); draw(); };
  el.querySelector('[data-reset]').onclick = async () => { if (await resetKey('lessons', 'Dersler')) { L = clone(A.content.lessons); draw(); } };
  draw();
}

// ======================================================================
// Phonetics data (pairs table + JSON editors)
// ======================================================================
async function phoneticsPage(el, arg) {
  const C = await content();
  const TABS = [['pairs', 'Ses çiftleri'], ['sounds', 'IPA sesleri'], ['accent', 'Aksan konuları'], ['soundGroups', 'Ses grupları']];
  let tab = TABS.some(t => t[0] === arg) ? arg : 'pairs';
  el.innerHTML = `${topbar('Telaffuz verisi', 'Ses çiftleri, IPA sesleri, aksan konuları')}<div class="chips-bar">${TABS.map(([k, l]) => `<a class="chip ${k === tab ? 'on' : ''}" href="#phonetics/${k}">${l}</a>`).join('')}</div><div data-body></div>`;
  const body = el.querySelector('[data-body]');
  if (tab === 'pairs') {
    let P = clone(C.pairs);
    body.innerHTML = `<section class="panel"><div class="panel-h"><h2>Minimal çiftler (${P.length})</h2><span class="sp"></span><button class="btn btn-xs btn-ghost" data-reset>Varsayılana dön</button><button class="btn btn-xs btn-primary" data-add>${PLUS} Çift</button></div><div class="tbl-wrap" data-tbl></div></section>`;
    const bar = dirtyBar(el, { onSave: async () => { await save('pairs', P); P = clone(A.content.pairs); draw(); }, onDiscard: () => { P = clone(A.content.pairs); draw(); } });
    const draw = () => {
      body.querySelector('[data-tbl]').innerHTML = `<table class="tbl"><thead><tr><th>Kelime 1</th><th>IPA 1</th><th>Kelime 2</th><th>IPA 2</th><th>Ses farkı</th><th></th></tr></thead><tbody>${P.map((p, i) => `<tr data-i="${i}">${p.map((v, k) => `<td><input class="cell-in ${!v ? 'bad' : ''} ${k % 2 && k < 4 ? 'ipa' : ''}" data-k="${k}" value="${esc(v)}"></td>`).join('')}<td><button class="ib del" data-del>${TRASH}</button></td></tr>`).join('')}</tbody></table>`;
      body.querySelectorAll('tr[data-i]').forEach(tr => { const i = +tr.dataset.i; tr.querySelectorAll('[data-k]').forEach(inp => inp.oninput = () => { P[i][+inp.dataset.k] = inp.value.trim(); bar.mark(); }); tr.querySelector('[data-del]').onclick = () => { P.splice(i, 1); bar.mark(); draw(); }; });
    };
    body.querySelector('[data-add]').onclick = () => { P.push(['', '', '', '', '']); bar.mark(); draw(); };
    body.querySelector('[data-reset]').onclick = async () => { if (await resetKey('pairs', 'Ses çiftleri')) { P = clone(A.content.pairs); draw(); } };
    return draw();
  }
  jsonEditor(el, body, tab, TABS.find(t => t[0] === tab)[1]);
}

function jsonEditor(el, body, key, label) {
  const src = () => JSON.stringify(A.content[key], null, 2);
  body.innerHTML = `<section class="panel"><div class="panel-h"><h2>${label}</h2><span class="sp"></span><span class="muted-note" data-st></span><button class="btn btn-xs btn-soft" data-fmt>Biçimlendir</button><button class="btn btn-xs btn-ghost" data-reset>Varsayılana dön</button></div>
    <p class="muted-note mb">Gelişmiş düzenleme (JSON). Kaydetmeden önce yapı sunucuda doğrulanır; hatalı kayıt yayına alınmaz.</p>
    <textarea class="inp code" spellcheck="false" style="width:100%" data-t>${esc(src())}</textarea></section>`;
  const ta = body.querySelector('[data-t]'), st = body.querySelector('[data-st]');
  const bar = dirtyBar(el, {
    onSave: async () => { let v; try { v = JSON.parse(ta.value); } catch (e) { throw new Error('JSON hatası: ' + e.message); } await save(key, v); ta.value = src(); },
    onDiscard: () => { ta.value = src(); st.textContent = ''; },
  });
  ta.oninput = () => { bar.mark(); try { JSON.parse(ta.value); st.innerHTML = '<span class="ok-inline">✓ Geçerli JSON</span>'; } catch (e) { st.innerHTML = `<span class="bad-inline">✕ ${esc(e.message.slice(0, 60))}</span>`; } };
  ta.onkeydown = e => { if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); } };
  body.querySelector('[data-fmt]').onclick = () => { try { ta.value = JSON.stringify(JSON.parse(ta.value), null, 2); } catch (e) { toast('JSON hatalı: ' + esc(e.message)); } };
  body.querySelector('[data-reset]').onclick = async () => { if (await resetKey(key, label)) ta.value = src(); };
}

// ======================================================================
// Plans & settings
// ======================================================================
async function settingsPage(el) {
  const C = await content();
  let S = clone(C.settings);
  el.innerHTML = `${topbar('Genel ayarlar', 'WhatsApp premium akışı, avantajlar ve uygulama duyurusu. Plan sınırları: <a class="link" href="#plans">Plan özellikleri</a>')}
    <div class="grid2">
      <section class="panel"><div class="panel-h"><h2>Premium (WhatsApp)</h2></div>
        <div class="form-grid">
          <label class="lbl full">WhatsApp numarası <span class="muted-note">(ülke koduyla, sadece rakam)</span><input class="inp" data-s="whatsapp" value="${esc(S.whatsapp)}"></label>
          <label class="lbl full">Hazır mesaj <span class="muted-note">({email} ve {name} otomatik doldurulur)</span><textarea class="inp" data-s="whatsappText">${esc(S.whatsappText)}</textarea></label>
          <label class="lbl full">Fiyat / ödeme notu<textarea class="inp" data-s="priceNote">${esc(S.priceNote)}</textarea></label>
        </div>
        <a class="btn btn-sm btn-soft mt-s" data-test target="_blank" rel="noopener">WhatsApp bağlantısını test et ↗</a>
      </section>
      <section class="panel"><div class="panel-h"><h2>Premium avantajları</h2><span class="sp"></span><p>her satır bir madde</p></div>
        <textarea class="inp" data-perks style="min-height:190px;width:100%">${esc((S.perks || []).join('\n'))}</textarea></section>
    </div>
    <section class="panel mt"><div class="panel-h"><h2>Uygulama duyurusu</h2><span class="sp"></span><p>Tüm üyelerin ana sayfasında görünür · boş bırakırsan gizlenir</p></div>
      <textarea class="inp" style="width:100%" data-s="announcement" placeholder="Ör. 🎉 Yeni mini ders yayında: Bağlantılı konuşma!">${esc(S.announcement || '')}</textarea>
      <div class="form-grid mt-s">
        <label class="lbl">Efekt<select class="sel" data-s="announceFx">${ANNOUNCE_FX.map(([v, l]) => `<option value="${v}" ${(S.announceFx || 'none') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="lbl">Renk<select class="sel" data-s="announceTone">${ANNOUNCE_TONES.map(([v, l]) => `<option value="${v}" ${(S.announceTone || 'violet') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="lbl">Emoji<input class="inp" data-s="announceEmoji" maxlength="8" value="${esc(S.announceEmoji || '📣')}"></label>
        <label class="lbl">Bağlantı <span class="muted-note">(isteğe bağlı, ör. #/market)</span><input class="inp" data-s="announceLink" placeholder="#/lesson/th" value="${esc(S.announceLink || '')}"></label>
        <label class="lbl full row gap-s" style="flex-direction:row;align-items:center"><input type="checkbox" data-an-dismiss ${S.announceDismiss ? 'checked' : ''}> Üyeler kapatabilsin (✕) · metin değişince yeniden görünür</label>
      </div>
      <p class="muted-note mt">Canlı önizleme</p>
      <div class="an-preview" data-an-pv></div></section>
    <section class="panel mt" data-banners></section>
    <section class="panel mt"><div class="panel-h"><h2>Son içerik güncellemeleri</h2></div><div data-meta class="small"></div></section>`;
  const bar = dirtyBar(el, { onSave: async () => { await save('settings', S); S = clone(A.content.settings); }, onDiscard: () => settingsPage(el) });
  const wa = () => { el.querySelector('[data-test]').href = `https://wa.me/${S.whatsapp}?text=${encodeURIComponent((S.whatsappText || '').replace('{email}', A.me.email).replace('{name}', A.me.name))}`; };
  let offPv = () => { };
  const drawPv = () => { const box = el.querySelector('[data-an-pv]'); offPv(); box.innerHTML = announceHTML(S, { preview: true }) || '<p class="muted-note">Duyuru metni boş — ana sayfada gizlenir.</p>'; offPv = wireAnnounce(box, S, { preview: true }); };
  el.querySelectorAll('[data-s]').forEach(i => i.oninput = i.onchange = () => { S[i.dataset.s] = i.value.trim(); bar.mark(); wa(); if (i.dataset.s.startsWith('announce')) drawPv(); });
  el.querySelector('[data-an-dismiss]').onchange = e => { S.announceDismiss = e.target.checked; bar.mark(); drawPv(); };
  drawPv();
  el.querySelector('[data-perks]').oninput = e => { S.perks = e.target.value.split('\n').map(s => s.trim()).filter(Boolean); bar.mark(); };
  // ---------- home banners
  const items = C.market?.items || [];
  const TONES = [['green', 'Yeşil'], ['pink', 'Pembe'], ['blue', 'Mavi'], ['purple', 'Mor'], ['orange', 'Turuncu'], ['ink', 'Siyah']];
  const DECOS = [['bars', 'Yükselen çubuklar'], ['bubbles', 'Baloncuklar'], ['chat', 'Sohbet / telefon'], ['city', 'Şehir silüeti'], ['stars', 'Yıldızlar']];
  const OSLOTS = [['hat', 'Şapka'], ['glasses', 'Gözlük'], ['top', 'Üst'], ['bag', 'Çanta'], ['hand', 'Eşya']];
  const opt = (list, v) => list.map(([k, l]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${l}</option>`).join('');
  const itemOpts = (slot, v) => `<option value="">—</option>` + items.filter(i => i.slot === slot).map(i => `<option value="${esc(i.id)}" ${i.id === v ? 'selected' : ''}>${esc(i.name)}</option>`).join('');
  const TONE_BG = { green: '#1D4E27', pink: '#B41F66', blue: '#0B63B8', purple: '#6B2BD9', orange: '#F06A1E', ink: '#22282A' };
  function drawBanners() {
    const B = (S.banners ||= []);
    const box = el.querySelector('[data-banners]');
    box.innerHTML = `<div class="panel-h"><h2>Ana sayfa bannerları</h2><span class="sp"></span><p>Kaydırmalı; her biri bir sayfaya götürür</p><button class="btn btn-xs btn-primary" data-badd>+ Banner</button></div>
      <div class="stack gap">${B.map((b, i) => `<div class="bn-row" data-bi="${i}" style="display:flex;gap:14px;align-items:flex-start;padding:12px;border-radius:16px;box-shadow:inset 0 0 0 1px var(--line)">
        <div style="flex:none;width:120px;height:120px;border-radius:18px;display:grid;place-items:center;background:${TONE_BG[b.tone] || '#222'}">${pip({ size: 104, outfit: Object.fromEntries(Object.entries(b.outfit || {}).map(([sl, id]) => [sl, items.find(x => x.id === id)]).filter(([, x]) => x)), color: items.find(x => x.id === b.color)?.colors?.c1 || '#1C201D' })}</div>
        <div class="form-grid" style="flex:1">
          <label class="lbl">Başlık <span class="muted-note">(satır için Enter)</span><textarea class="inp" data-bf="title" rows="2">${esc(b.title || '')}</textarea></label>
          <label class="lbl">El yazısı vurgu<input class="inp" data-bf="accent" value="${esc(b.accent || '')}" placeholder="sen."></label>
          <label class="lbl">Alt yazı<input class="inp" data-bf="sub" value="${esc(b.sub || '')}"></label>
          <label class="lbl">Bağlantı<input class="inp" data-bf="link" value="${esc(b.link || '')}" placeholder="#/market"></label>
          <label class="lbl">Renk<select class="sel" data-bf="tone">${opt(TONES, b.tone)}</select></label>
          <label class="lbl">Dekor<select class="sel" data-bf="deco">${opt(DECOS, b.deco)}</select></label>
          <label class="lbl">Pip rengi<select class="sel" data-bf="color">${itemOpts('color', b.color)}</select></label>
          ${OSLOTS.map(([sl, l]) => `<label class="lbl">${l}<select class="sel" data-bo="${sl}">${itemOpts(sl, b.outfit?.[sl])}</select></label>`).join('')}
        </div>
        <div class="stack gap-s"><label class="row gap-s small">Yayında <button class="switch ${b.enabled !== false ? 'on' : ''}" data-ben></button></label>
          <button class="btn btn-xs btn-ghost" data-bmv="-1">↑</button><button class="btn btn-xs btn-ghost" data-bmv="1">↓</button><button class="btn btn-xs btn-ghost" data-bdel>Sil</button></div>
      </div>`).join('') || '<p class="muted-note">Henüz banner yok.</p>'}</div>`;
    box.querySelector('[data-badd]').onclick = () => { B.push({ id: 'b-' + Date.now().toString(36), enabled: true, tone: 'green', title: 'Yeni banner', accent: '', sub: '', deco: 'stars', link: '#/home', outfit: {}, color: 'color-ink' }); bar.mark(); drawBanners(); };
    box.querySelectorAll('[data-bi]').forEach(row => {
      const b = B[+row.dataset.bi];
      row.querySelectorAll('[data-bf]').forEach(x => x.oninput = x.onchange = () => { b[x.dataset.bf] = x.value; bar.mark(); if (x.tagName === 'SELECT') drawBanners(); });
      row.querySelectorAll('[data-bo]').forEach(x => x.onchange = () => { b.outfit ||= {}; if (x.value) b.outfit[x.dataset.bo] = x.value; else delete b.outfit[x.dataset.bo]; bar.mark(); drawBanners(); });
      row.querySelector('[data-ben]').onclick = e => { b.enabled = b.enabled === false; e.currentTarget.classList.toggle('on', b.enabled); bar.mark(); };
      row.querySelectorAll('[data-bmv]').forEach(x => x.onclick = () => { const i = +row.dataset.bi, j = i + +x.dataset.bmv; if (j < 0 || j >= B.length) return; [B[i], B[j]] = [B[j], B[i]]; bar.mark(); drawBanners(); });
      row.querySelector('[data-bdel]').onclick = () => { B.splice(+row.dataset.bi, 1); bar.mark(); drawBanners(); };
    });
  }
  drawBanners();
  const meta = await api('/api/admin/content').then(r => r.meta).catch(() => []);
  const NAMES = { freq: 'Kelimeler', themes: 'Temalar', patternCats: 'Kalıp kategorileri', patterns: 'Kalıplar', soundGroups: 'Ses grupları', sounds: 'IPA sesleri', accent: 'Aksan', pairs: 'Ses çiftleri', lessons: 'Dersler', settings: 'Ayarlar', plans: 'Plan özellikleri', levels: 'Seviyeler', market: 'Pip Market', emails: 'E-postalar', voice: 'Ses' };
  el.querySelector('[data-meta]').innerHTML = meta.sort((a, b) => b.updated_at - a.updated_at).map(m => `<div class="row between" style="padding:7px 0;border-bottom:1px solid var(--line)"><span>${NAMES[m.key] || m.key}</span><span class="faint">${fdt(m.updated_at)}${m.updated_by ? ' · ' + esc(m.updated_by) : ' · ilk kurulum'}</span></div>`).join('');
  wa();
}

export const contentPages = { words: wordsPage, themes: themesPage, patterns: patternsPage, lessons: lessonsPage, phonetics: phoneticsPage, settings: settingsPage };

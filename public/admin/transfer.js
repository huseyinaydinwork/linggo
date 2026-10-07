// Yönetim paneli — toplu veri aktarımı (Excel şablonu indir → düzenle → yükle & önizle → onayla) + içerik değişiklik geçmişi
import { api } from '/js/api.js';
import { icon, esc, toast } from '/js/ui.js';
import { A, topbar, modal, confirmBox, fdt, reloadPage } from './admin.js';

const DL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>`;
const UPL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V9M7 14l5-5 5 5M5 4h14"/></svg>`;
const SHEETS = [['patternCats', 'Kalıp kategorileri'], ['soundGroups', 'Ses grupları'], ['freq', 'Kelimeler'], ['themes', 'Temalar + kelimeleri'], ['patterns', 'Kalıplar + örnekleri'], ['sounds', 'Sesler'], ['accent', 'Aksan farkları'], ['pairs', 'Ses çiftleri'], ['lessons', 'Mini dersler + sahneleri'], ['levels', 'Seviyeler'], ['market', 'Market ürünleri'], ['emails', 'E-posta şablonları'], ['plans', 'Plan özellikleri'], ['settings', 'Genel ayarlar']];
const ACTION = { edit: ['Panelden düzenleme', 'info'], import: ['Toplu içe aktarma', 'hot'], reset: ['Varsayılana dönüş', 'warn'], revert: ['Geri alma', 'good'] };

const chips = d => d ? [
  d.counts?.added ? `<span class="flag good">+${d.counts.added} eklendi</span>` : '',
  d.counts?.updated ? `<span class="flag info">${d.counts.updated} güncellendi</span>` : '',
  d.counts?.removed ? `<span class="flag bad">−${d.counts.removed} silindi</span>` : '',
  d.reordered ? '<span class="flag warn">sıra değişti</span>' : '', d.other ? '<span class="flag warn">ayarlar değişti</span>' : '',
].join('') : '';
function details(d) {
  if (!d) return '';
  const more = (n, shown) => n > shown ? `<span class="muted-note"> +${n - shown} daha</span>` : '';
  const grp = (title, list, n, cls, f) => list?.length ? `<div class="tx-grp"><b class="${cls}">${title}</b><div>${list.map(f).join('')}${more(n, list.length)}</div></div>` : '';
  return grp('Eklenen', d.added, d.counts?.added, 'ok-inline', x => `<span class="tx-it">${esc(x.label || x.id)}</span>`)
    + grp('Güncellenen', d.updated, d.counts?.updated, '', x => `<span class="tx-it">${esc(x.label || x.id)}${x.fields?.length ? `<i>${esc(x.fields.slice(0, 4).join(', '))}${x.fields.length > 4 ? '…' : ''}</i>` : ''}</span>`)
    + grp('Silinen', d.removed, d.counts?.removed, 'bad-inline', x => `<span class="tx-it del">${esc(x.label || x.id)}</span>`);
}
async function download(url, fallbackName) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) { let m = 'İndirilemedi.'; try { m = (await res.json()).error || m; } catch { } throw new Error(m); }
  const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || fallbackName;
  const a = document.createElement('a'); a.href = URL.createObjectURL(await res.blob()); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
const toBase64 = buf => { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };

async function transferPage(el, arg) {
  let pick = new Set(SHEETS.map(s => s[0])), preview = null, mode = 'merge', histKey = arg && arg !== 'history' ? arg : '';
  el.innerHTML = `${topbar('Toplu veri & geçmiş', 'Tüm içeriği tek bir Excel dosyası olarak indir, düzenle ve geri yükle. Her değişiklik kaydedilir ve tek tıkla geri alınabilir.')}
    <div class="tx-steps">
      <div><span>1</span><b>İndir</b><p>Tüm alanlarıyla dolu şablon</p></div>
      <div><span>2</span><b>Düzenle</b><p>Excel, Google E-Tablolar ya da Numbers</p></div>
      <div><span>3</span><b>Yükle & onayla</b><p>Önce farkı gör, sonra kaydet</p></div>
    </div>
    <div class="grid2 eq">
      <section class="panel">
        <div class="panel-h"><h2>${DL} İndir</h2><span class="sp"></span><button class="btn btn-xs btn-ghost" data-all>Tümünü seç</button></div>
        <p class="muted-note">Excel dosyasına girecek içerikler:</p>
        <div class="chips-bar mt-s" data-pick></div>
        <div class="tx-dl">
          <button class="btn btn-primary" data-dl="xlsx">${DL} Excel · dolu şablon</button>
          <button class="btn btn-soft" data-dl="empty">${DL} Boş şablon</button>
          <button class="btn btn-ghost" data-dl="json" title="Market, planlar ve seviyeler dahil her şeyin birebir teknik yedeği">${DL} JSON yedeği</button>
        </div>
        <p class="muted-note mt-s">Dosyada her içerik bir sayfadır; tema kelimeleri, kalıp örnekleri ve ders sahneleri ayrı alt sayfalardadır. İlk sayfa kullanım kılavuzudur.</p>
      </section>
      <section class="panel">
        <div class="panel-h"><h2>${UPL} Yükle</h2></div>
        <label class="tx-drop" data-drop tabindex="0">
          <input type="file" accept=".xlsx,.json,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="sr" data-file>
          <b>Dosyayı buraya bırak ya da seç</b><span>.xlsx (düzenlenmiş şablon) veya .json yedeği · hiçbir şey onaylamadan kaydedilmez</span>
        </label>
        <div data-prev></div>
      </section>
    </div>
    <section class="panel mt">
      <div class="panel-h"><h2>Değişiklik geçmişi</h2><p>Panelden düzenlemeler, içe aktarmalar ve geri almalar · içerik başına son 40 sürüm saklanır</p><span class="sp"></span>
        <select class="sel" data-hk style="max-width:220px"><option value="">Tüm içerikler</option>${SHEETS.map(([k, l]) => `<option value="${k}" ${k === histKey ? 'selected' : ''}>${esc(l)}</option>`).join('')}<option value="voice">Ses ayarları</option></select></div>
      <div data-hist><div class="skel" style="height:120px"></div></div>
    </section>`;

  // ---- download
  const drawPick = () => {
    el.querySelector('[data-pick]').innerHTML = SHEETS.map(([k, l]) => `<button class="chip ${pick.has(k) ? 'on' : ''}" data-k="${k}">${esc(l)}</button>`).join('');
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { pick.has(b.dataset.k) ? pick.delete(b.dataset.k) : pick.add(b.dataset.k); drawPick(); });
    el.querySelector('[data-all]').textContent = pick.size === SHEETS.length ? 'Hiçbirini seçme' : 'Tümünü seç';
  };
  drawPick();
  el.querySelector('[data-all]').onclick = () => { pick = pick.size === SHEETS.length ? new Set() : new Set(SHEETS.map(s => s[0])); drawPick(); };
  el.querySelectorAll('[data-dl]').forEach(b => b.onclick = async () => {
    const t = b.dataset.dl;
    if (t !== 'json' && !pick.size) return toast('En az bir içerik seç');
    const keys = t === 'json' ? '' : [...pick].join(',');
    b.disabled = true;
    try { await download(`/api/admin/transfer/export?format=${t === 'json' ? 'json' : 'xlsx'}${t === 'empty' ? '&empty=1' : ''}${keys ? '&keys=' + keys : ''}`, t === 'json' ? 'linggo-icerik.json' : 'linggo-icerik.xlsx'); toast('İndirildi ✅'); }
    catch (e) { toast(esc(e.message)); } finally { b.disabled = false; }
  });

  // ---- upload + preview
  const drop = el.querySelector('[data-drop]'), input = el.querySelector('[data-file]'), prevEl = el.querySelector('[data-prev]');
  const handle = async file => {
    if (!file) return;
    if (file.size > 18e6) return toast('Dosya çok büyük (en fazla 18 MB)');
    prevEl.innerHTML = '<div class="skel mt" style="height:140px"></div>';
    try {
      preview = await api('/api/admin/transfer/preview', { method: 'POST', body: { name: file.name, data: toBase64(await file.arrayBuffer()) } });
      mode = preview.kind === 'json' ? 'replace' : 'merge';
      drawPreview();
    } catch (e) { prevEl.innerHTML = `<div class="form-err mt">${esc(e.message)}</div>`; }
    input.value = '';
  };
  input.onchange = () => handle(input.files[0]);
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => handle(e.dataTransfer.files[0]));
  drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });

  function drawPreview() {
    const rows = preview.modes[mode] || [];
    const changed = rows.filter(r => r.changed && !r.error), errs = rows.filter(r => r.error);
    const sel = new Set(changed.map(r => r.key));
    prevEl.innerHTML = `<div class="tx-prev">
      <div class="row between"><b class="tx-file">📄 ${esc(preview.name)}</b><button class="btn btn-xs btn-ghost" data-clear>Kapat</button></div>
      ${preview.kind === 'xlsx' ? `<div class="tx-mode" role="radiogroup">
        <button class="${mode === 'merge' ? 'on' : ''}" data-mode="merge"><b>Güncelle + ekle</b><span>Dosyadaki satırlar güncellenir, yeniler eklenir; dosyada olmayanlar olduğu gibi kalır.</span></button>
        <button class="${mode === 'replace' ? 'on' : ''}" data-mode="replace"><b>Dosyayla değiştir</b><span>Seçilen içerik tamamen dosyadaki hâline gelir; dosyada olmayan satırlar silinir.</span></button>
      </div>` : '<p class="warn-note mt-s">JSON yedeği: seçilen içerikler dosyadaki hâliyle birebir değiştirilir.</p>'}
      ${preview.modes.unknown?.length ? `<p class="warn-note mt-s">Tanınmayan sayfalar yok sayıldı: ${preview.modes.unknown.map(esc).join(', ')}</p>` : ''}
      <div class="tx-list">${rows.map(r => `<div class="tx-row ${r.error ? 'err' : r.changed ? '' : 'same'}">
        <label class="tx-h">${r.changed && !r.error ? `<input type="checkbox" data-sel="${r.key}" checked>` : '<span class="tx-dot"></span>'}
          <b>${esc(r.label)}</b><span class="sp"></span>${r.error ? '<span class="flag bad">hata</span>' : r.changed ? chips(r.diff) : '<span class="muted-note">değişiklik yok</span>'}
          ${r.changed && !r.error ? `<button class="ib" data-more title="Ayrıntılar">${icon.chevron}</button>` : ''}</label>
        ${r.error ? `<p class="bad-inline small">${esc(r.error)}</p>` : r.changed ? `<div class="tx-det" hidden>${details(r.diff)}</div>` : ''}
      </div>`).join('') || '<div class="empty-s">Dosyada tanınan içerik sayfası yok.</div>'}</div>
      ${errs.length ? `<p class="small bad-inline mt-s">${errs.length} içerikte hata var; bunlar kaydedilmez. Dosyayı düzeltip tekrar yükleyebilirsin.</p>` : ''}
      <button class="btn btn-lime btn-block mt" data-apply ${changed.length ? '' : 'disabled'}>${changed.length ? `${changed.length} içeriği kaydet` : 'Kaydedilecek değişiklik yok'}</button>
      <p class="muted-note center mt-s">Kaydedilen her içeriğin önceki sürümü aşağıdaki geçmişe eklenir.</p>
    </div>`;
    const btn = prevEl.querySelector('[data-apply]');
    const upd = () => { btn.disabled = !sel.size; btn.textContent = sel.size ? `${sel.size} içeriği kaydet` : 'Kaydedilecek içerik seçilmedi'; };
    prevEl.querySelectorAll('[data-sel]').forEach(c => c.onchange = () => { c.checked ? sel.add(c.dataset.sel) : sel.delete(c.dataset.sel); upd(); });
    prevEl.querySelectorAll('[data-more]').forEach(b => b.onclick = e => { e.preventDefault(); const d = b.closest('.tx-row').querySelector('.tx-det'); d.hidden = !d.hidden; b.classList.toggle('open', !d.hidden); });
    prevEl.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; drawPreview(); });
    prevEl.querySelector('[data-clear]').onclick = () => { preview = null; prevEl.innerHTML = ''; };
    btn.onclick = async () => {
      const del = rows.filter(r => sel.has(r.key)).reduce((n, r) => n + (r.diff?.counts?.removed || 0), 0);
      if (del && !(await confirmBox({ title: `${del} kayıt silinecek`, text: 'Dosyada olmayan satırlar kaldırılacak. İstersen geçmişten geri alabilirsin.', ok: 'Kaydet', danger: true }))) return;
      btn.disabled = true;
      try {
        const r = await api('/api/admin/transfer/apply', { method: 'POST', body: { token: preview.token, mode, keys: [...sel] } });
        A.content = null; // content pages reload fresh data
        preview = null;
        prevEl.innerHTML = `<div class="tx-done"><b>✅ Kaydedildi</b>${r.applied.length ? r.applied.map(a => `<div class="row between small"><span>${esc(a.label)}</span><span class="muted-note">${esc(a.summary)}</span></div>`).join('') : '<p class="muted-note">Değişiklik yoktu.</p>'}<p class="muted-note mt-s">Üyeler yeni içeriği bir sonraki açılışta görür.</p></div>`;
        toast('İçerik güncellendi ✅'); drawHist();
      } catch (e) { btn.disabled = false; modal(`<h3>Kaydedilemedi</h3><p class="form-err mt-s">${esc(e.message)}</p><button class="btn btn-primary btn-block mt" data-x>Tamam</button>`); }
    };
  }

  // ---- history
  async function drawHist() {
    const box = el.querySelector('[data-hist]');
    const d = await api('/api/admin/content-history' + (histKey ? '?key=' + histKey : ''));
    const H = d.history;
    box.innerHTML = H.length ? `<div class="tx-hist">${H.map(h => {
      const [act, cls] = ACTION[h.action] || [h.action, 'info'];
      return `<div class="tx-hrow">
        <div class="tx-hmain"><time>${fdt(h.ts)}</time><b>${esc(d.labels[h.key] || h.key)}</b><span class="flag ${cls}">${act}</span>${chips(h.diff)}
          <span class="sp"></span><span class="muted-note">${esc(h.admin || '—')}</span>
          <button class="ib" data-more title="Ayrıntılar">${icon.chevron}</button></div>
        ${h.note ? `<p class="muted-note">${esc(h.note)}</p>` : ''}
        <div class="tx-det" hidden>${details(h.diff) || '<p class="muted-note">Ayrıntı yok.</p>'}
          <button class="btn btn-xs btn-soft mt-s" data-revert="${h.id}">${icon.refresh} Bu değişiklikten önceki hâline dön</button></div>
      </div>`;
    }).join('')}</div>` : '<div class="empty-s">Henüz içerik değişikliği yok. Panelden yapılan her kayıt ve içe aktarma burada listelenir.</div>';
    box.querySelectorAll('[data-more]').forEach(b => b.onclick = () => { const x = b.closest('.tx-hrow').querySelector('.tx-det'); x.hidden = !x.hidden; b.classList.toggle('open', !x.hidden); });
    box.querySelectorAll('[data-revert]').forEach(b => b.onclick = async () => {
      const h = H.find(x => x.id === +b.dataset.revert);
      if (!(await confirmBox({ title: `${d.labels[h.key] || h.key} geri alınsın mı?`, text: `İçerik ${fdt(h.ts)} tarihli değişiklikten önceki hâline döner. Bu geri alma da geçmişe kaydedilir.`, ok: 'Geri al' }))) return;
      try { await api(`/api/admin/content-history/${h.id}/revert`, { method: 'POST', body: {} }); A.content = null; toast('Önceki sürüm geri yüklendi ✅'); drawHist(); }
      catch (e) { toast(esc(e.message)); }
    });
  }
  el.querySelector('[data-hk]').onchange = e => { histKey = e.target.value; history.replaceState(null, '', '#transfer' + (histKey ? '/' + histKey : '')); drawHist(); };
  drawHist();
}

export const transferPages = { transfer: transferPage };

// ======================================================================
// Per-page Excel: every content page gets "Excel indir" + "Excel yükle" for just its own content
// ======================================================================
export const PAGE_KEYS = {
  words: { keys: ['freq'], label: 'Kelimeler', file: 'kelimeler' },
  themes: { keys: ['themes'], label: 'Günlük hayat temaları', file: 'temalar' },
  patterns: { keys: ['patternCats', 'patterns'], label: 'Cümle kalıpları', file: 'kaliplar' },
  lessons: { keys: ['lessons'], label: 'Mini dersler', file: 'mini-dersler' },
  phonetics: { keys: ['soundGroups', 'sounds', 'accent', 'pairs'], label: 'Telaffuz verisi', file: 'telaffuz' },
  levels: { keys: ['levels'], label: 'Seviyeler', file: 'seviyeler' },
  market: { keys: ['market'], label: 'Pip Market', file: 'market' },
  emails: { keys: ['emails'], label: 'E-posta şablonları', file: 'e-postalar' },
  plans: { keys: ['plans'], label: 'Plan özellikleri', file: 'planlar' },
  settings: { keys: ['settings'], label: 'Genel ayarlar', file: 'ayarlar' },
};
const XL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>`;

export function mountExcel(el, page) {
  const P = PAGE_KEYS[page]; const top = el.querySelector('.top'); if (!P || !top || top.querySelector('.xl-tools')) return;
  const box = document.createElement('div'); box.className = 'xl-tools';
  box.innerHTML = `<button class="btn btn-sm btn-soft" data-xl-dl title="${esc(P.label)} içeriğini tüm alanlarıyla Excel olarak indir">${XL}<span>Excel indir</span></button>
    <button class="btn btn-sm btn-soft" data-xl-up title="Düzenlediğin Excel dosyasını yükle, farkları gör ve onayla">${UPL}<span>Excel yükle</span></button>`;
  const sp = top.querySelector('.sp'); sp ? sp.after(box) : top.appendChild(box);
  box.querySelector('[data-xl-dl]').onclick = async e => {
    const b = e.currentTarget; b.disabled = true;
    try { await download(`/api/admin/transfer/export?format=xlsx&file=${P.file}&keys=${P.keys.join(',')}`, `linggo-${P.file}.xlsx`); toast(`${P.label} Excel'i indirildi ✅`); }
    catch (err) { toast(esc(err.message)); } finally { b.disabled = false; }
  };
  box.querySelector('[data-xl-up]').onclick = () => uploadModal(P);
}

function uploadModal(P) {
  modal(`<div class="xl-modal">
    <h3>${UPL} ${esc(P.label)} · Excel yükle</h3>
    <p class="muted small">Bu sayfadan indirdiğin şablonu doldurup yükle. Dosyadaki diğer içerik sayfaları yok sayılır; hiçbir şey onaylamadan kaydedilmez.</p>
    <label class="tx-drop mt-s" data-drop tabindex="0"><input type="file" accept=".xlsx,.json" class="sr" data-file>
      <b>Dosyayı buraya bırak ya da seç</b><span>.xlsx · Excel, Google E-Tablolar veya Numbers</span></label>
    <div data-prev></div>
    <div class="row gap-s mt" data-foot><button class="btn btn-ghost grow" data-x>Kapat</button>
      <button class="btn btn-soft grow" data-tpl>${XL} Şablonu indir</button></div>
  </div>`, (m, close) => {
    const drop = m.querySelector('[data-drop]'), input = m.querySelector('[data-file]'), prev = m.querySelector('[data-prev]');
    m.querySelector('[data-tpl]').onclick = () => download(`/api/admin/transfer/export?format=xlsx&file=${P.file}&keys=${P.keys.join(',')}`, `linggo-${P.file}.xlsx`).catch(e => toast(esc(e.message)));
    let up = null, mode = 'merge';
    const handle = async file => {
      if (!file) return;
      if (file.size > 18e6) return toast('Dosya çok büyük (en fazla 18 MB)');
      prev.innerHTML = '<div class="skel mt" style="height:120px"></div>';
      try {
        up = await api('/api/admin/transfer/preview', { method: 'POST', body: { name: file.name, data: toBase64(await file.arrayBuffer()), keys: P.keys } });
        mode = up.kind === 'json' ? 'replace' : 'merge'; drop.hidden = true; draw();
      } catch (e) { prev.innerHTML = `<div class="form-err mt-s">${esc(e.message)}</div>`; }
      input.value = '';
    };
    input.onchange = () => handle(input.files[0]);
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => handle(e.dataTransfer.files[0]));
    drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    function draw() {
      const rows = up.modes[mode] || [], changed = rows.filter(r => r.changed && !r.error), errs = rows.filter(r => r.error);
      prev.innerHTML = `<div class="tx-prev">
        <div class="row between"><b class="tx-file">📄 ${esc(up.name)}</b><button class="btn btn-xs btn-ghost" data-other>Başka dosya</button></div>
        ${up.kind === 'xlsx' ? `<div class="tx-mode" role="radiogroup">
          <button class="${mode === 'merge' ? 'on' : ''}" data-mode="merge"><b>Güncelle + ekle</b><span>Dosyadaki satırlar güncellenir, yeniler eklenir; dosyada olmayanlar kalır.</span></button>
          <button class="${mode === 'replace' ? 'on' : ''}" data-mode="replace"><b>Dosyayla değiştir</b><span>İçerik tamamen dosyadaki hâline gelir; dosyada olmayan satırlar silinir.</span></button></div>` : ''}
        <div class="tx-list">${rows.map(r => `<div class="tx-row ${r.error ? 'err' : r.changed ? '' : 'same'}">
          <div class="tx-h"><b>${esc(r.label)}</b><span class="sp"></span>${r.error ? '<span class="flag bad">hata</span>' : r.changed ? chips(r.diff) : '<span class="muted-note">değişiklik yok</span>'}</div>
          ${r.error ? `<p class="bad-inline small">${esc(r.error)}</p>` : r.changed ? `<div class="tx-det">${details(r.diff)}</div>` : ''}</div>`).join('') || `<div class="empty-s">Dosyada ${esc(P.label)} sayfası bulunamadı. Bu sayfadan indirdiğin şablonu kullan.</div>`}</div>
        ${errs.length ? '<p class="small bad-inline mt-s">Hatalı içerik kaydedilmez. Dosyayı düzeltip tekrar yükle.</p>' : ''}
      </div>`;
      const foot = m.querySelector('[data-foot]');
      foot.innerHTML = `<button class="btn btn-ghost grow" data-x>Vazgeç</button><button class="btn btn-lime grow" data-apply ${changed.length && !errs.length ? '' : 'disabled'}>${changed.length ? 'Kaydet' : 'Değişiklik yok'}</button>`;
      prev.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; draw(); });
      prev.querySelector('[data-other]').onclick = () => { up = null; prev.innerHTML = ''; drop.hidden = false; foot.innerHTML = '<button class="btn btn-ghost grow" data-x>Kapat</button>'; };
      foot.querySelector('[data-apply]').onclick = async e => {
        const del = changed.reduce((n, r) => n + (r.diff?.counts?.removed || 0), 0);
        if (del && !(await confirmBox({ title: `${del} kayıt silinecek`, text: 'Dosyada olmayan satırlar kaldırılacak. İstersen "Toplu veri & geçmiş" sayfasından geri alabilirsin.', ok: 'Kaydet', danger: true }))) return;
        e.currentTarget.disabled = true;
        try {
          const r = await api('/api/admin/transfer/apply', { method: 'POST', body: { token: up.token, mode, keys: changed.map(x => x.key) } });
          close(); A.content = null;
          toast(r.applied.length ? `${P.label} güncellendi ✅ ${r.applied.map(a => a.summary).join(' · ')}` : 'Değişiklik yoktu');
          reloadPage();
        } catch (err) { prev.insertAdjacentHTML('beforeend', `<div class="form-err mt-s">${esc(err.message)}</div>`); e.currentTarget.disabled = false; }
      };
    }
  });
}

// Yönetim paneli v3: plan özellikleri, seviyeler, e-postalar, Pip Market, ses, siparişler
import { api, post } from '/js/api.js';
import { icon, esc, toast } from '/js/ui.js';
import { pip } from '/js/mascot.js';
import { ART, themeSwatch, artFor, FONTS, ensureFont } from '/js/wear.js';
import { A, topbar, modal, confirmBox, setLeaveGuard, fmt, fdt } from './admin.js';

const clone = v => JSON.parse(JSON.stringify(v));
const PLUS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
const TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>`;
const UP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>`;
const DOWN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>`;
const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return false; [arr[i], arr[j]] = [arr[j], arr[i]]; return true; };

async function content(force = false) { if (!A.content || force) A.content = (await api('/api/admin/content')).content; return A.content; }
async function save(key, value) { await api('/api/admin/content/' + key, { method: 'PUT', body: { value } }); A.content[key] = clone(value); toast('Kaydedildi — üyeler bir sonraki açılışta görür ✅'); }
async function resetKey(key, label) {
  if (!(await confirmBox({ title: `${label} varsayılana dönsün mü?`, text: 'Tüm düzenlemeler silinir.', ok: 'Varsayılana dön', danger: true }))) return false;
  const r = await api(`/api/admin/content/${key}/reset`, { method: 'POST', body: {} }); A.content[key] = r.value; toast('Varsayılan geri yüklendi'); return true;
}
function dirtyBar(el, { onSave, onDiscard }) {
  const bar = document.createElement('div'); bar.className = 'dirty-bar';
  bar.innerHTML = `<span>●</span><b>Kaydedilmemiş değişiklikler</b><span class="sp"></span><button class="btn btn-sm btn-ghost" data-discard>Vazgeç</button><button class="btn btn-sm btn-lime" data-save>Kaydet</button>`;
  el.appendChild(bar);
  let dirty = false; setLeaveGuard(() => dirty);
  bar.querySelector('[data-discard]').onclick = () => { dirty = false; bar.classList.remove('on'); onDiscard(); };
  bar.querySelector('[data-save]').onclick = async () => {
    try { await onSave(); dirty = false; bar.classList.remove('on'); }
    catch (e) { modal(`<h3>Kaydedilemedi</h3><p class="form-err mt-s">${esc(e.message)}</p><button class="btn btn-primary btn-block mt" data-x>Tamam</button>`); }
  };
  return { mark() { dirty = true; bar.classList.add('on'); } };
}

// ======================================================================
// Plan features matrix
// ======================================================================
async function plansPage(el) {
  const C = await content();
  const { features: F } = await api('/api/admin/features');
  let P = clone(C.plans);
  el.innerHTML = `${topbar('Plan özellikleri', 'Hangi özellik hangi planda açık? Değerler anında üyelere yansır.', `<button class="btn btn-sm btn-ghost" data-reset>Varsayılana dön</button>`)}
    <div class="grid2">
      <section class="panel" style="padding:6px"><div class="tbl-wrap"><table class="tbl" data-tbl></table></div></section>
      <section class="panel"><div class="panel-h"><h2>Planlar ve fiyatlar</h2></div><div data-plans></div>
        <div class="warn-note mt">💡 Sınırlı özelliklerde <b>-1 = sınırsız</b>. İçerik sınırları öğrencinin <b>kendi seviyesindeki</b> içeriğe uygulanır (ör. “2 ünite” = seviyesinin ilk 2 ünitesi).</div></section>
    </div>`;
  const bar = dirtyBar(el, { onSave: async () => { await save('plans', P); P = clone(A.content.plans); draw(); }, onDiscard: () => { P = clone(A.content.plans); draw(); } });
  function cell(f, plan) {
    const v = P.features[f.key][plan];
    if (f.type === 'bool') return `<button class="switch ${v ? 'on' : ''}" data-k="${f.key}" data-p="${plan}" role="switch" aria-checked="${v}"></button>`;
    return `<input class="cell-in" style="width:90px;text-align:right" type="number" min="${f.type === 'limit' ? -1 : 0}" data-k="${f.key}" data-p="${plan}" value="${v}">${f.type === 'limit' && v === -1 ? ' <span class="tag lime">∞</span>' : ''}`;
  }
  function draw() {
    let grp = '';
    el.querySelector('[data-tbl]').innerHTML = `<thead><tr><th>Özellik</th><th>${esc(P.plans[0].name)}</th><th>${esc(P.plans[1].name)}</th></tr></thead><tbody>` + F.map(f => {
      const g = f.group !== grp ? `<tr><td colspan="3" style="background:var(--bg-2)"><b class="small">${esc(f.group)}</b></td></tr>` : ''; grp = f.group;
      return `${g}<tr><td><b style="font-weight:600">${esc(f.label)}</b>${f.hint ? `<br><small class="faint">${esc(f.hint)}</small>` : ''}</td><td>${cell(f, 'free')}</td><td>${cell(f, 'premium')}</td></tr>`;
    }).join('') + '</tbody>';
    el.querySelectorAll('[data-k]').forEach(x => {
      const set = v => { P.features[x.dataset.k][x.dataset.p] = v; bar.mark(); };
      if (x.tagName === 'BUTTON') x.onclick = () => { const v = !x.classList.contains('on'); x.classList.toggle('on', v); set(v); };
      else x.onchange = () => { set(parseInt(x.value, 10)); draw(); };
    });
    el.querySelector('[data-plans]').innerHTML = P.plans.map((p, i) => `<div class="form-grid" style="margin-bottom:14px">
      <label class="lbl">Plan adı<input class="inp" data-pl="${i}" data-f="name" value="${esc(p.name)}"></label>
      <label class="lbl">Kısa açıklama<input class="inp" data-pl="${i}" data-f="tagline" value="${esc(p.tagline || '')}"></label>
      ${p.id === 'premium' ? `<label class="lbl">Aylık fiyat (₺)<input class="inp" type="number" step="0.01" min="0" data-pl="${i}" data-f="priceMonthly" value="${p.priceMonthly}"></label><label class="lbl">Yıllık fiyat (₺)<input class="inp" type="number" step="0.01" min="0" data-pl="${i}" data-f="priceYearly" value="${p.priceYearly}"></label>` : ''}
    </div>`).join('');
    el.querySelectorAll('[data-pl]').forEach(x => x.oninput = () => { const p = P.plans[+x.dataset.pl]; p[x.dataset.f] = x.type === 'number' ? parseFloat(x.value) || 0 : x.value; bar.mark(); });
  }
  el.querySelector('[data-reset]').onclick = async () => { if (await resetKey('plans', 'Plan özellikleri')) { P = clone(A.content.plans); draw(); } };
  draw();
}

// ======================================================================
// Levels + placement test
// ======================================================================
async function levelsPage(el) {
  const C = await content();
  let L = clone(C.levels), sel = 0;
  const nUnits = Math.ceil(C.freq.length / 100);
  el.innerHTML = `${topbar('Seviyeler', 'Öğrenci başlangıçta seviyesini seçer ya da testle belirler; içerikler seviyesine göre gelir.', `<button class="btn btn-sm btn-ghost" data-reset>Varsayılana dön</button>`)}
    <div class="split"><section class="panel"><div class="panel-h"><h2>Seviyeler</h2><span class="sp"></span><button class="btn btn-xs btn-primary" data-new>${PLUS} Yeni</button></div><div class="list-nav" data-list></div>
      <div class="panel-h mt"><h2>Seviye testi</h2></div>
      <div class="form-grid" data-pc></div></section>
    <section class="panel" data-ed></section></div>
    <section class="panel mt" data-rw></section>`;
  const bar = dirtyBar(el, { onSave: async () => { await save('levels', L); L = clone(A.content.levels); draw(); }, onDiscard: () => { L = clone(A.content.levels); draw(); } });
  const chips = (field, items, label) => { const l = L.levels[sel]; return `<div class="panel-h mt"><h2>${label}</h2><span class="sp"></span><p>${(l[field] || []).length} seçili · sıra = öğrenme sırası</p></div>
    <div class="chips-bar">${items.map(([id, t]) => { const on = (l[field] || []).includes(id); const idx = (l[field] || []).indexOf(id); return `<button class="chip ${on ? 'on' : ''}" data-tog="${field}" data-id="${esc(String(id))}">${on ? `<b style="opacity:.7">${idx + 1}.</b> ` : ''}${esc(t)}</button>`; }).join('')}</div>`; };
  function draw() {
    sel = Math.max(0, Math.min(sel, L.levels.length - 1));
    el.querySelector('[data-list]').innerHTML = L.levels.map((l, i) => `<button class="${i === sel ? 'on' : ''}" data-s="${i}"><span style="font-size:20px">${esc(l.emoji)}</span>${esc(l.cefr)} · ${esc(l.title)}<small>${l.units.length} ünite</small></button>`).join('');
    el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sel = +b.dataset.s; draw(); });
    const pc = L.placement;
    el.querySelector('[data-pc]').innerHTML = `<label class="lbl">Seviye başına kelime sorusu<input class="inp" type="number" min="1" max="10" data-pc="wordsPerLevel" value="${pc.wordsPerLevel}"></label>
      <label class="lbl">Seviye başına kalıp sorusu<input class="inp" type="number" min="0" max="5" data-pc="patternsPerLevel" value="${pc.patternsPerLevel}"></label>
      <label class="lbl">Geçme eşiği (%)<input class="inp" type="number" min="30" max="100" data-pc="pass" value="${pc.pass}"></label>
      <p class="muted-note full">Test ${L.levels.length * (pc.wordsPerLevel + pc.patternsPerLevel)} soru. Sorular her seferinde seviyenin ünite ve kalıplarından rastgele seçilir; öğrenci bir seviyede çok zorlanırsa üst seviyeler atlanır.</p>`;
    el.querySelectorAll('input[data-pc]').forEach(x => x.oninput = () => { L.placement[x.dataset.pc] = parseInt(x.value, 10) || 0; bar.mark(); });
    const l = L.levels[sel], ed = el.querySelector('[data-ed]');
    ed.innerHTML = `<div class="panel-h"><span style="font-size:30px">${esc(l.emoji)}</span><h2>${esc(l.cefr)} · ${esc(l.title)}</h2><span class="sp"></span><button class="ib" data-lm="-1">${UP}</button><button class="ib" data-lm="1">${DOWN}</button><button class="ib del" data-ldel>${TRASH}</button></div>
      <div class="form-grid">
        <label class="lbl">Kimlik<input class="inp" data-m="id" value="${esc(l.id)}"></label>
        <label class="lbl">CEFR<input class="inp" data-m="cefr" value="${esc(l.cefr)}"></label>
        <label class="lbl">Ad<input class="inp" data-m="title" value="${esc(l.title)}"></label>
        <label class="lbl">Emoji<input class="inp" data-m="emoji" value="${esc(l.emoji)}"></label>
        <label class="lbl">Günlük yeni kelime (öneri)<input class="inp" type="number" min="1" max="30" data-m="dailyNew" value="${l.dailyNew || 8}"></label>
        <label class="lbl full">Açıklama (seviye seçim ekranında görünür)<input class="inp" data-m="desc" value="${esc(l.desc || '')}"></label>
      </div>
      ${chips('units', Array.from({ length: nUnits }, (_, i) => [i + 1, `Ünite ${i + 1}`]), 'Kelime üniteleri')}
      ${chips('themes', C.themes.map(t => [t.id, `${t.emoji} ${t.title}`]), 'Günlük hayat temaları')}
      ${chips('patterns', C.patterns.map(p => [p.id, p.pattern]), 'Cümle kalıpları')}
      ${chips('lessons', C.lessons.map(x => [x.id, x.title]), 'Mini dersler')}`;
    ed.querySelectorAll('[data-m]').forEach(x => x.oninput = () => { l[x.dataset.m] = x.type === 'number' ? parseInt(x.value, 10) || 1 : x.value.trim(); bar.mark(); });
    ed.querySelectorAll('[data-tog]').forEach(b => b.onclick = () => {
      const f = b.dataset.tog, raw = b.dataset.id, id = f === 'units' ? +raw : raw;
      const arr = l[f] ||= []; const i = arr.indexOf(id);
      if (i >= 0) arr.splice(i, 1); else arr.push(id);
      if (f === 'units') arr.sort((a, b) => a - b);
      bar.mark(); draw();
    });
    ed.querySelectorAll('[data-lm]').forEach(b => b.onclick = () => { if (move(L.levels, sel, +b.dataset.lm)) { sel += +b.dataset.lm; bar.mark(); draw(); } });
    ed.querySelector('[data-ldel]').onclick = async () => { if (L.levels.length > 1 && await confirmBox({ title: 'Seviye silinsin mi?', text: 'Bu seviyedeki üyeler ilk seviyeye düşer.', ok: 'Sil', danger: true })) { L.levels.splice(sel, 1); bar.mark(); draw(); } };
  }
  el.querySelector('[data-new]').onclick = () => { L.levels.push({ id: `seviye-${L.levels.length + 1}`, cefr: '?', title: 'Yeni seviye', emoji: '✨', desc: '', dailyNew: 8, units: [1], themes: [], patterns: [], lessons: [] }); sel = L.levels.length - 1; bar.mark(); draw(); };
  el.querySelector('[data-reset]').onclick = async () => { if (await resetKey('levels', 'Seviyeler')) { L = clone(A.content.levels); draw(); } };
  draw();
}

// ======================================================================
// E-mails: templates, automations, campaigns, log
// ======================================================================
const VARS = ['{name}', '{email}', '{streak}', '{xp}', '{learned}', '{due}', '{level}', '{weekXp}', '{weekWords}', '{inactiveDays}', '{planUntil}', '{days}', '{appUrl}'];
const TRIG = { verified: 'E-posta doğrulanınca', premium_granted: 'Premium verilince', premium_expiring: 'Premium bitmeden önce', inactive: 'Üye X gün pratik yapmayınca', weekly: 'Her hafta belirli gün/saatte' };
const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
async function emailsPage(el, arg) {
  const C = await content();
  let E = clone(C.emails), sel = 0, tab = arg === 'campaign' ? 'campaign' : arg === 'log' ? 'log' : 'templates';
  const info = await api('/api/admin/emails');
  el.innerHTML = `${topbar('E-postalar', `SMTP: ${info.smtp ? '<b class="ok-inline">aktif</b>' : '<b class="bad-inline">ayarlı değil</b> (geliştirme modunda e-postalar konsola yazılır)'} · Pazarlama izni veren üye: <b>${info.consent?.m || 0}</b>/${info.consent?.n || 0}`, `<button class="btn btn-sm btn-soft" data-run>▶ Otomasyonları şimdi çalıştır</button>`)}
    <div class="chips-bar">${[['templates', 'Şablonlar & akışlar'], ['campaign', 'Toplu gönderim'], ['log', 'Gönderim kaydı']].map(([k, l]) => `<a class="chip ${k === tab ? 'on' : ''}" href="#emails/${k}">${l}</a>`).join('')}</div><div data-body></div>`;
  el.querySelector('[data-run]').onclick = async () => { const r = await post('/api/admin/emails/run'); toast(`${r.sent} e-posta gönderildi`); };
  const body = el.querySelector('[data-body]');
  const count = (id, st) => (info.counts.find(c => c.template === id && c.status === st)?.n || 0);

  if (tab === 'templates') {
    body.innerHTML = `<div class="split"><section class="panel"><div class="list-nav" data-list></div><p class="muted-note mt">Son 30 gün gönderim sayıları. Sistem e-postaları (kodlar) her zaman gider; pazarlama e-postaları sadece izin verenlere gider ve abonelikten çıkma bağlantısı içerir.</p></section>
      <section class="panel" data-ed></section></div>`;
    const bar = dirtyBar(el, { onSave: async () => { await save('emails', E); E = clone(A.content.emails); draw(); }, onDiscard: () => { E = clone(A.content.emails); draw(); } });
    let pvTimer;
    function draw() {
      el.querySelector('[data-list]').innerHTML = E.templates.map((t, i) => `<button class="${i === sel ? 'on' : ''}" data-s="${i}"><span>${t.enabled ? '🟢' : '⚪'}</span>${esc(t.name)}<small>${t.kind === 'system' ? 'sistem' : (count(t.id, 'sent') + count(t.id, 'dev')) + ' gönd.'}</small></button>`).join('');
      el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sel = +b.dataset.s; draw(); });
      const t = E.templates[sel], ed = el.querySelector('[data-ed]');
      ed.innerHTML = `<div class="panel-h"><h2>${esc(t.name)}</h2><span class="sp"></span>${t.kind !== 'system' ? `<label class="row gap-s small">Etkin <button class="switch ${t.enabled ? 'on' : ''}" data-en role="switch"></button></label>` : '<span class="tag">Sistem · kod e-postası</span>'}</div>
        ${t.trigger ? `<div class="warn-note mb">⚡ Tetikleyici: <b>${TRIG[t.trigger]}</b>${t.marketing ? ' · <b>pazarlama</b> (izin gerekir)' : ''}</div>` : ''}
        <div class="form-grid">
          ${t.trigger === 'weekly' ? `<label class="lbl">Gün<select class="sel" data-f="weekday">${DAYS.map((d, i) => `<option value="${i}" ${t.weekday === i ? 'selected' : ''}>${d}</option>`).join('')}</select></label><label class="lbl">Saat<input class="inp" type="number" min="0" max="23" data-f="hour" value="${t.hour}"></label>` : ''}
          ${t.trigger === 'inactive' ? `<label class="lbl">Kaç gün pratik yapmayınca?<input class="inp" type="number" min="1" max="60" data-f="days" value="${t.days}"></label>` : ''}
          ${t.trigger === 'premium_expiring' ? `<label class="lbl">Bitişten kaç gün önce?<input class="inp" type="number" min="1" max="30" data-f="daysBefore" value="${t.daysBefore}"></label>` : ''}
          <label class="lbl full">Konu<input class="inp" data-f="subject" value="${esc(t.subject)}"></label>
          <label class="lbl full">Başlık<input class="inp" data-f="title" value="${esc(t.title || '')}"></label>
          <label class="lbl full">İçerik <span class="muted-note">(**kalın**, *italik*, [bağlantı](https://…), "- " madde, boş satırla paragraf${t.trigger === 'weekly' ? ', {{stats}} = haftalık özet kartı' : ''})</span><textarea class="inp" style="min-height:220px" data-f="body">${esc(t.body)}</textarea></label>
          ${t.kind !== 'system' ? `<label class="lbl full">Buton metni (boş bırakılırsa buton yok)<input class="inp" data-f="cta" value="${esc(t.cta || '')}"></label>` : ''}
        </div>
        <p class="muted-note mt-s">Değişkenler: ${VARS.map(v => `<code class="chip" style="height:24px;font-size:11.5px" data-var="${v}">${v}</code>`).join(' ')}${t.kind === 'system' ? ' <code>{code}</code>' : ''}</p>
        <div class="row gap-s mt"><button class="btn btn-sm btn-soft" data-test>✉ Kendime test gönder</button><span class="sp grow"></span><span class="muted-note">Canlı önizleme (senin verilerinle)</span></div>
        <iframe class="mail-pv mt-s" data-pv title="Önizleme"></iframe>`;
      const pv = ed.querySelector('[data-pv]');
      const preview = () => { clearTimeout(pvTimer); pvTimer = setTimeout(async () => { try { const r = await post('/api/admin/emails/preview', { template: t }); pv.srcdoc = r.html; } catch { } }, 250); };
      ed.querySelectorAll('[data-f]').forEach(x => x.oninput = () => { t[x.dataset.f] = x.type === 'number' || x.tagName === 'SELECT' ? parseInt(x.value, 10) : x.value; bar.mark(); preview(); });
      ed.querySelector('[data-en]')?.addEventListener('click', e => { t.enabled = !t.enabled; e.currentTarget.classList.toggle('on', t.enabled); bar.mark(); });
      ed.querySelectorAll('[data-var]').forEach(c => c.onclick = () => { const ta = ed.querySelector('[data-f="body"]'); ta.setRangeText(c.dataset.var, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); ta.focus(); });
      ed.querySelector('[data-test]').onclick = async () => { try { const r = await post('/api/admin/emails/test', { template: t }); toast(r.status === 'dev' ? 'SMTP yok: e-posta sunucu konsoluna yazıldı' : `Gönderildi → ${r.to}`); } catch (e) { toast(esc(e.message)); } };
      preview();
    }
    draw();
  } else if (tab === 'campaign') {
    const c = { subject: '', title: '', body: 'Merhaba {name},\n\n', cta: 'Linggo\'yu aç', segment: 'all' };
    const L = C.levels.levels;
    body.innerHTML = `<div class="grid2"><section class="panel"><div class="panel-h"><h2>Yeni toplu gönderim</h2></div>
      <div class="form-grid">
        <label class="lbl full">Alıcılar<select class="sel" data-f="segment">
          <option value="all">Tüm üyeler (izin verenler)</option><option value="free">Ücretsiz üyeler</option><option value="premium">Premium üyeler</option>
          <option value="active:7">Son 7 günde aktif olanlar</option><option value="inactive:7">7+ gündür pasif olanlar</option><option value="inactive:30">30+ gündür pasif olanlar</option>
          ${L.map(l => `<option value="level:${l.id}">Seviye: ${esc(l.cefr)} · ${esc(l.title)}</option>`).join('')}</select></label>
        <label class="lbl full">Konu<input class="inp" data-f="subject" placeholder="Ör. Yeni mini ders yayında 🎬"></label>
        <label class="lbl full">Başlık<input class="inp" data-f="title"></label>
        <label class="lbl full">İçerik<textarea class="inp" style="min-height:200px" data-f="body">${esc(c.body)}</textarea></label>
        <label class="lbl full">Buton metni<input class="inp" data-f="cta" value="${esc(c.cta)}"></label>
      </div>
      <div class="row gap-s mt"><span class="muted-note grow" data-count></span><button class="btn btn-sm btn-soft" data-test>Kendime test</button><button class="btn btn-sm btn-primary" data-send>Gönder</button></div></section>
      <section class="panel"><div class="panel-h"><h2>Önizleme</h2></div><iframe class="mail-pv" data-pv title="Önizleme"></iframe></section></div>
      <section class="panel mt"><div class="panel-h"><h2>Geçmiş gönderimler</h2></div>${info.campaigns.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tarih</th><th>Konu</th><th>Kitle</th><th>Durum</th><th class="num">Gönderilen</th><th class="num">Hata</th></tr></thead><tbody>${info.campaigns.map(x => `<tr><td>${fdt(x.created_at)}</td><td><b>${esc(x.subject)}</b></td><td>${esc(x.segment)}</td><td>${x.status === 'sent' ? '<span class="flag good">gönderildi</span>' : `<span class="flag warn">${esc(x.status)}</span>`}</td><td class="num">${x.sent}</td><td class="num">${x.failed}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-s">Henüz toplu gönderim yok.</div>'}</section>`;
    const pv = body.querySelector('[data-pv]'); let tm;
    const tpl = () => ({ subject: c.subject || '(konu)', title: c.title || c.subject, body: c.body, cta: c.cta, marketing: true });
    const refresh = async () => {
      clearTimeout(tm); tm = setTimeout(async () => {
        try { pv.srcdoc = (await post('/api/admin/emails/preview', { template: tpl(), marketing: true })).html; } catch { }
        const n = (await api('/api/admin/segment?s=' + encodeURIComponent(c.segment))).count; body.querySelector('[data-count]').textContent = `${n} alıcı (pazarlama izni olan)`;
      }, 250);
    };
    body.querySelectorAll('[data-f]').forEach(x => x.oninput = x.onchange = () => { c[x.dataset.f] = x.value; refresh(); });
    body.querySelector('[data-test]').onclick = async () => { try { const r = await post('/api/admin/emails/test', { template: tpl() }); toast(r.status === 'dev' ? 'SMTP yok: konsola yazıldı' : `Gönderildi → ${r.to}`); } catch (e) { toast(esc(e.message)); } };
    body.querySelector('[data-send]').onclick = async () => {
      if (!c.subject.trim()) return toast('Konu yaz');
      const n = (await api('/api/admin/segment?s=' + encodeURIComponent(c.segment))).count;
      if (!(await confirmBox({ title: `${n} kişiye gönderilsin mi?`, text: 'Toplu gönderim başlatıldıktan sonra durdurulamaz.', ok: 'Gönder' }))) return;
      try { const r = await post('/api/admin/campaigns', c); toast(`Gönderim başladı · ${r.recipients} alıcı`); setTimeout(() => emailsPage(el, 'campaign'), 1500); } catch (e) { toast(esc(e.message)); }
    };
    refresh();
  } else {
    body.innerHTML = `<section class="panel" style="padding:6px">${info.log.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Zaman</th><th>Alıcı</th><th>Şablon</th><th>Konu</th><th>Durum</th></tr></thead><tbody>${info.log.map(l => `<tr><td>${fdt(l.ts)}</td><td>${esc(l.email || '—')}</td><td>${esc(l.template)}</td><td class="small">${esc(l.subject)}</td><td>${l.status === 'sent' ? '<span class="flag good">gönderildi</span>' : l.status === 'dev' ? '<span class="flag info">geliştirme</span>' : `<span class="flag bad" title="${esc(l.error || '')}">${esc(l.status)}</span>`}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-s">Henüz gönderim yok.</div>'}</section>`;
  }
}

// ======================================================================
// Pip Market
// ======================================================================
const SLOTS = [['hat', 'Şapka'], ['glasses', 'Gözlük'], ['top', 'Üst giyim'], ['bottom', 'Alt giyim'], ['shoes', 'Ayakkabı'], ['bag', 'Çanta'], ['hand', 'Eşya'], ['neck', 'Boyun'], ['gloves', 'Eldiven'], ['face', 'İfade'], ['color', 'Renk'], ['bg', 'Arka plan'], ['theme', 'Tema']];
const FACES = [['grin', 'Kocaman gülüş'], ['wink', 'Göz kırpma'], ['sleepy', 'Uykucu'], ['love', 'Aşık'], ['cool', 'Havalı'], ['star', 'Yıldız gözler'], ['happy', 'Mutlu'], ['think', 'Düşünceli']];
const RAR = [['common', 'Standart'], ['rare', 'Nadir'], ['epic', 'Epik'], ['legendary', 'Efsane']];
const TOKENS = [['--bg', 'Arka plan'], ['--bg-2', 'Arka plan 2'], ['--card', 'Kart'], ['--card-2', 'Kart 2'], ['--lime', 'Vurgu'], ['--lime-2', 'Vurgu koyu'], ['--lime-ink', 'Vurgu üstü yazı'], ['--dark-panel', 'Koyu panel'], ['--coral', 'Mercan (vurgu 2)'], ['--violet', 'Mor (vurgu 3)'], ['--sky', 'Kart: gök'], ['--pink', 'Kart: pembe'], ['--sun', 'Kart: güneş'], ['--mint', 'Kart: nane']];
const METRICS = [['goal', 'Günlük hedef'], ['xp', 'XP kazan'], ['ok', 'Doğru cevap'], ['rev', 'Soru cevapla'], ['nw', 'Yeni kelime']];
const TIER_LABEL = { mission: 'Tek görev', daily: 'Günlük (3 görev)', level: 'Seviye atlama', badge: 'Rozet', streak: 'Seri kilometre taşı' };
async function marketPage(el) {
  const C = await content();
  let Mk = clone(C.market), slot = 'hat', sel = null;
  el.innerHTML = `${topbar('Pip Market', `${Mk.items.length} öğe · kıyafetler, arka planlar ve uygulama temaları`, `<button class="btn btn-sm btn-ghost" data-reset>Varsayılana dön</button>`)}
    <div class="chips-bar" data-slots></div>
    <div class="split"><section class="panel"><div class="panel-h"><h2 data-st></h2><span class="sp"></span><button class="btn btn-xs btn-primary" data-new>${PLUS} Yeni öğe</button></div><div class="list-nav" data-list></div>
      <div class="form-grid mt"><label class="lbl">Yeni üyeye hediye yaprak<input class="inp" type="number" min="0" data-wc value="${Mk.welcomeCoins ?? 50}"></label></div></section>
    <section class="panel" data-ed></section></div>
    <section class="panel mt" data-rw></section>`;
  const bar = dirtyBar(el, { onSave: async () => { await save('market', Mk); Mk = clone(A.content.market); draw(); drawRewards(); }, onDiscard: () => { Mk = clone(A.content.market); draw(); drawRewards(); } });
  el.querySelector('[data-wc]').oninput = e => { Mk.welcomeCoins = parseInt(e.target.value, 10) || 0; bar.mark(); };
  const priceTxt = p => p.type === 'coins' ? `🍃${p.coins}` : p.type === 'premium' ? 'Pro' : p.type === 'paid' ? `₺${p.try}` : 'Ücretsiz';
  function preview(it) {
    if (it.slot === 'theme') return themeSwatch(it).replace('class="swatch"', 'class="swatch" style="width:180px;height:180px"');
    if (it.slot === 'bg') return `<svg viewBox="0 0 220 220" width="200" height="200">${artFor(it)}</svg>`;
    if (it.slot === 'color') return pip({ size: 200, outfit: {}, color: it.colors?.c1, mood: 'happy' });
    return `<div style="display:flex;gap:6px;align-items:center">${pip({ size: 200, outfit: { [it.slot]: it }, silhouette: true, mood: 'idle', pose: it.slot === 'gloves' ? 'cheer' : 'idle' })}${pip({ size: 120, outfit: { [it.slot]: it }, mood: 'happy' })}</div>`;
  }
  function draw() {
    el.querySelector('[data-slots]').innerHTML = SLOTS.map(([k, l]) => `<button class="chip ${k === slot ? 'on' : ''}" data-slot="${k}">${l} <b>${Mk.items.filter(i => i.slot === k).length}</b></button>`).join('');
    el.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => { slot = b.dataset.slot; sel = null; draw(); });
    el.querySelector('[data-st]').textContent = SLOTS.find(s => s[0] === slot)[1];
    const items = Mk.items.map((it, i) => [it, i]).filter(([it]) => it.slot === slot);
    if (sel == null && items.length) sel = items[0][1];
    el.querySelector('[data-list]').innerHTML = items.map(([it, i]) => `<button class="${i === sel ? 'on' : ''}" data-s="${i}"><span>${it.enabled === false ? '⚪' : '🟢'}</span>${esc(it.name)}${it.drop ? ' 🎁' : ''}<small>${priceTxt(it.price)}</small></button>`).join('');
    el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sel = +b.dataset.s; draw(); });
    const it = Mk.items[sel], ed = el.querySelector('[data-ed]');
    if (!it || it.slot !== slot) { ed.innerHTML = '<div class="empty-s">Öğe seç ya da yeni öğe ekle.</div>'; return; }
    const arts = Object.keys(['theme', 'face', 'color'].includes(it.slot) ? {} : ART[it.slot] || {});
    ed.innerHTML = `<div class="panel-h"><h2>${esc(it.name)}</h2><span class="sp"></span><label class="row gap-s small">Yayında <button class="switch ${it.enabled !== false ? 'on' : ''}" data-en></button></label><button class="ib del" data-del>${TRASH}</button></div>
      <div class="mk-admin"><div class="mk-admin-pv" data-pv>${preview(it)}</div>
      <div class="form-grid" style="flex:1">
        <label class="lbl">Kimlik<input class="inp" data-f="id" value="${esc(it.id)}"></label>
        <label class="lbl">Ad<input class="inp" data-f="name" value="${esc(it.name)}"></label>
        <label class="lbl">Nadirlik<select class="sel" data-f="rarity">${RAR.map(([v, l]) => `<option value="${v}" ${it.rarity === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        ${!['theme', 'face', 'color'].includes(it.slot) ? `<label class="lbl">Görsel<select class="sel" data-f="art">${arts.map(a => `<option ${it.art === a ? 'selected' : ''}>${a}</option>`).join('')}<option value="custom" ${it.art === 'custom' ? 'selected' : ''}>Özel SVG…</option></select></label>` : ''}
        <label class="lbl full">Açıklama<input class="inp" data-f="desc" value="${esc(it.desc || '')}"></label>
        ${!['theme', 'color', 'face', 'bg'].includes(it.slot) ? `<label class="lbl">Alt kategori <span class="muted-note">(çip: Kep, Bere…)</span><input class="inp" data-f="tag" value="${esc(it.tag || '')}" placeholder="Şapka"></label>
        <label class="lbl">Renk seçenekleri <span class="muted-note">(virgülle #hex)</span><input class="inp" data-variants value="${esc((it.variants || []).join(', '))}" placeholder="#5FD14A, #E5484D"></label>` : ''}
        ${it.slot === 'face' ? `<label class="lbl">Yüz ifadesi<select class="sel" data-f="face">${FACES.map(([v, l]) => `<option value="${v}" ${it.face === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
        <label class="lbl">Fiyat türü<select class="sel" data-price="type">${[['free', 'Ücretsiz'], ['coins', 'Yaprak 🍃'], ['premium', 'Premium üyelere'], ['paid', 'Ücretli (₺)']].map(([v, l]) => `<option value="${v}" ${it.price.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        ${it.price.type === 'coins' ? `<label class="lbl">Yaprak fiyatı<input class="inp" type="number" min="1" data-price="coins" value="${it.price.coins || 100}"></label>` : ''}
        ${it.price.type === 'paid' ? `<label class="lbl">TL fiyatı<input class="inp" type="number" step="0.01" min="0" data-price="try" value="${it.price.try || 19.99}"></label>` : ''}
        <label class="lbl row gap-s" style="flex-direction:row;align-items:center"><input type="checkbox" data-new-flag ${it.isNew ? 'checked' : ''}> “Yeni” etiketi</label>
        <label class="lbl row gap-s" style="flex-direction:row;align-items:center"><input type="checkbox" data-drop ${it.drop ? 'checked' : ''}> 🎁 Ödül sandığından düşebilir</label>
        ${!['theme', 'face'].includes(it.slot) && it.art !== 'custom' ? `<label class="lbl">${it.slot === 'color' ? 'Gövde rengi' : 'Renk 1'}<input type="color" data-col="c1" value="${esc(it.colors?.c1 || '#FF6B45')}" style="width:100%;height:42px;border:0;background:none"></label><label class="lbl">Renk 2<input type="color" data-col="c2" value="${esc(it.colors?.c2 || '#FFD166')}" style="width:100%;height:42px;border:0;background:none"></label>` : ''}
        ${it.art === 'custom' ? `<label class="lbl full">Özel SVG <span class="muted-note">(Pip'in 220×220 koordinatlarında; script ve bağlantılar otomatik temizlenir)</span><textarea class="inp code" style="min-height:160px" data-f="svg">${esc(it.svg || '')}</textarea></label>` : ''}
      </div></div>
      ${it.slot === 'theme' ? `<div class="panel-h mt"><h2>Tema yazı tipleri</h2></div>
        <div class="form-grid">${[['display', 'Başlık fontu', FONTS.display], ['accent', 'El yazısı vurgu fontu', FONTS.accent]].map(([k, l, list]) => `<label class="lbl">${l}<select class="sel" data-font="${k}"><option value="">Varsayılan</option>${list.map(fn => `<option ${it.theme.fonts?.[k] === fn ? 'selected' : ''} style="font-family:'${fn}'">${fn}</option>`).join('')}</select></label>`).join('')}</div>
        <div class="panel-h mt"><h2>Tema renkleri</h2><span class="sp"></span><label class="row gap-s small"><input type="checkbox" data-dark ${it.theme.dark ? 'checked' : ''}> Koyu tema</label></div>
        <div class="form-grid">${TOKENS.map(([k, l]) => `<label class="lbl">${l}<div class="row gap-s"><input type="color" data-tok="${k}" value="${esc((it.theme.tokens[k] || '').startsWith('#') ? it.theme.tokens[k] : '#ffffff')}" style="width:42px;height:42px;border:0;background:none"><input class="inp grow" data-tokt="${k}" value="${esc(it.theme.tokens[k] || '')}" placeholder="varsayılan"></div></label>`).join('')}
        <label class="lbl full">Vurgu gradyanı (--grad-lime)<input class="inp" data-tokt="--grad-lime" value="${esc(it.theme.tokens['--grad-lime'] || '')}" placeholder="linear-gradient(180deg,#…,#…)"></label>
        <label class="lbl full">Koyu panel ışıltısı (--grad-mesh)<input class="inp" data-tokt="--grad-mesh" value="${esc(it.theme.tokens['--grad-mesh'] || '')}" placeholder="radial-gradient(…), radial-gradient(…)"></label>
        <label class="lbl full">Arka plan dokusu (--bg-art) <span class="muted-note">CSS arka plan katmanları: desen, noktalar, degrade</span><input class="inp" data-tokt="--bg-art" value="${esc(it.theme.tokens['--bg-art'] || '')}" placeholder="radial-gradient(rgba(0,0,0,.08) 1px, transparent 1.5px) 0 0 / 18px 18px"></label></div>` : ''}`;
    const repaint = () => { ed.querySelector('[data-pv]').innerHTML = preview(it); };
    ed.querySelectorAll('[data-f]').forEach(x => x.oninput = x.onchange = () => { it[x.dataset.f] = x.value; bar.mark(); if (x.dataset.f === 'art') return draw(); repaint(); if (x.dataset.f === 'name') el.querySelector(`[data-s="${sel}"]`).childNodes[1].textContent = x.value; });
    ed.querySelectorAll('[data-price]').forEach(x => x.onchange = x.oninput = () => { const k = x.dataset.price; it.price = { ...it.price, [k]: k === 'type' ? x.value : parseFloat(x.value) || 0 }; if (k === 'coins') it.price.coins = Math.round(it.price.coins);
      // switching the price type fills a sensible default so the item is never saved without a price
      if (k === 'type') { if (x.value === 'coins' && !(it.price.coins > 0)) it.price.coins = 100; if (x.value === 'paid' && !(it.price.try > 0)) it.price.try = 19.99; }
      bar.mark(); if (k === 'type') draw(); else { const s = el.querySelector(`[data-s="${sel}"] small`); if (s) s.textContent = priceTxt(it.price); } });
    ed.querySelectorAll('[data-col]').forEach(x => x.oninput = () => { it.colors = { ...(it.colors || {}), [x.dataset.col]: x.value }; bar.mark(); repaint(); });
    ed.querySelector('[data-new-flag]').onchange = e => { it.isNew = e.target.checked; bar.mark(); };
    ed.querySelector('[data-variants]')?.addEventListener('input', e => { const v = e.target.value.split(',').map(x => x.trim()).filter(x => /^#[0-9a-f]{6}$/i.test(x)); if (v.length) it.variants = v; else delete it.variants; bar.mark(); });
    ed.querySelectorAll('[data-font]').forEach(x => x.onchange = () => { it.theme.fonts ||= {}; if (x.value) { it.theme.fonts[x.dataset.font] = x.value; ensureFont(x.value); } else delete it.theme.fonts[x.dataset.font]; bar.mark(); repaint(); });
    ed.querySelector('[data-drop]').onchange = e => { it.drop = e.target.checked; bar.mark(); draw(); };
    ed.querySelector('[data-en]').onclick = e => { it.enabled = it.enabled === false; e.currentTarget.classList.toggle('on', it.enabled); bar.mark(); draw(); };
    ed.querySelector('[data-del]').onclick = async () => { if (await confirmBox({ title: `"${it.name}" silinsin mi?`, text: 'Satın almış üyelerin envanterinden de kalkar.', ok: 'Sil', danger: true })) { Mk.items.splice(sel, 1); sel = null; bar.mark(); draw(); } };
    ed.querySelector('[data-dark]')?.addEventListener('change', e => { it.theme.dark = e.target.checked; bar.mark(); repaint(); });
    ed.querySelectorAll('[data-tok]').forEach(x => x.oninput = () => { it.theme.tokens[x.dataset.tok] = x.value; ed.querySelector(`[data-tokt="${x.dataset.tok}"]`).value = x.value; bar.mark(); repaint(); });
    ed.querySelectorAll('[data-tokt]').forEach(x => x.oninput = () => { if (x.value.trim()) it.theme.tokens[x.dataset.tokt] = x.value.trim(); else delete it.theme.tokens[x.dataset.tokt]; bar.mark(); repaint(); });
  }
  el.querySelector('[data-new]').onclick = () => {
    const art = slot === 'theme' ? 'custom-theme' : slot === 'face' ? 'face' : slot === 'color' ? 'color' : Object.keys(ART[slot] || {})[0] || 'custom';
    Mk.items.push({ id: `${slot}-${Date.now().toString(36)}`, slot, name: 'Yeni öğe', art, price: { type: 'coins', coins: 100 }, rarity: 'common', enabled: true, colors: {}, desc: '', isNew: true, ...(slot === 'theme' ? { theme: { dark: false, v: 4, fonts: {}, tokens: {} } } : slot === 'face' ? { face: 'wink' } : slot === 'color' ? { colors: { c1: '#C8F53C' } } : {}) });
    sel = Mk.items.length - 1; bar.mark(); draw();
  };
  el.querySelector('[data-reset]').onclick = async () => { if (await resetKey('market', 'Pip Market')) { Mk = clone(A.content.market); sel = null; draw(); drawRewards(); } };
  function drawRewards() {
    const R = Mk.rewards ||= { enabled: true, tiers: {}, missions: [], streakMilestones: [], rarityWeights: {} };
    const box = el.querySelector('[data-rw]');
    const drops = Mk.items.filter(i => i.drop).length;
    box.innerHTML = `<div class="panel-h"><h2>🎁 Ödül sandıkları & günlük görevler</h2><span class="sp"></span><label class="row gap-s small">Etkin <button class="switch ${R.enabled !== false ? 'on' : ''}" data-rw-en role="switch"></button></label></div>
      <p class="muted-note">Görev, seviye, rozet ve seri sandıkları 3–5 dokunuşla açılır. Premium üyelere yaprak, plan matrisindeki “Yaprak kazanımı (%)” oranıyla çarpılır. Sandıktan düşebilen öğe: <b>${drops}</b> (öğe düzenleyicide 🎁 işaretle).</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Sandık</th><th>Ad</th><th>Renk</th><th>Yaprak (en az–en çok)</th><th>XP (en az–en çok)</th><th>Eşya şansı %</th></tr></thead><tbody>
      ${Object.keys(TIER_LABEL).map(k => { const t = R.tiers[k] ||= { name: TIER_LABEL[k], color: '#FFD166', coins: [5, 10], xp: [0, 0], drop: 0 }; return `<tr>
        <td>${TIER_LABEL[k]}</td><td><input class="inp" data-t="${k}" data-k="name" value="${esc(t.name || '')}"></td>
        <td><input type="color" data-t="${k}" data-k="color" value="${esc(t.color || '#FFD166')}" style="width:40px;height:34px;border:0;background:none"></td>
        <td><div class="row gap-s"><input class="inp" type="number" min="0" data-t="${k}" data-k="coins0" value="${t.coins[0]}" style="width:70px"><input class="inp" type="number" min="0" data-t="${k}" data-k="coins1" value="${t.coins[1]}" style="width:70px"></div></td>
        <td><div class="row gap-s"><input class="inp" type="number" min="0" data-t="${k}" data-k="xp0" value="${t.xp[0]}" style="width:70px"><input class="inp" type="number" min="0" data-t="${k}" data-k="xp1" value="${t.xp[1]}" style="width:70px"></div></td>
        <td><input class="inp" type="number" min="0" max="100" step="1" data-t="${k}" data-k="drop" value="${Math.round((t.drop || 0) * 100)}" style="width:70px"></td></tr>`; }).join('')}
      </tbody></table></div>
      <div class="form-grid mt">
        <label class="lbl">Nadirlik ağırlıkları (standart/nadir/epik/efsane)<input class="inp" data-rar value="${['common', 'rare', 'epic', 'legendary'].map(r => R.rarityWeights?.[r] ?? '').join(', ')}" placeholder="60, 28, 10, 2"></label>
        <label class="lbl">Seri sandığı günleri<input class="inp" data-ms value="${(R.streakMilestones || []).join(', ')}" placeholder="3, 7, 14, 30"></label>
      </div>
      <div class="panel-h mt"><h2>Günlük görev havuzu</h2><span class="sp"></span><button class="btn btn-xs btn-ghost" data-mnew>${PLUS} Görev ekle</button></div>
      <p class="muted-note">Her gün havuzdan 3 görev seçilir; üçü de bitince “Günlük sandık” açılır.</p>
      <div class="stack gap-s">${(R.missions || []).map((m, i) => `<div class="row gap-s" style="align-items:center">
        <input class="inp" data-m="${i}" data-k="e" value="${esc(m.e || '')}" style="width:52px;text-align:center">
        <input class="inp grow" data-m="${i}" data-k="t" value="${esc(m.t)}">
        <select class="sel" data-m="${i}" data-k="metric">${METRICS.map(([v, l]) => `<option value="${v}" ${m.metric === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <input class="inp" type="number" min="1" data-m="${i}" data-k="n" value="${m.n}" style="width:76px">
        <button class="ib del" data-mdel="${i}">${TRASH}</button></div>`).join('')}</div>`;
    box.querySelector('[data-rw-en]').onclick = e => { R.enabled = R.enabled === false; e.currentTarget.classList.toggle('on', R.enabled !== false); bar.mark(); };
    box.querySelectorAll('[data-t]').forEach(x => x.oninput = () => {
      const t = R.tiers[x.dataset.t], k = x.dataset.k, n = parseInt(x.value, 10) || 0;
      if (k === 'name' || k === 'color') t[k] = x.value;
      else if (k === 'drop') t.drop = Math.max(0, Math.min(100, n)) / 100;
      else { const [f, j] = [k.slice(0, -1), +k.slice(-1)]; t[f] = [...t[f]]; t[f][j] = Math.max(0, n); }
      bar.mark();
    });
    box.querySelector('[data-rar]').oninput = e => { const v = e.target.value.split(',').map(x => parseInt(x, 10)); ['common', 'rare', 'epic', 'legendary'].forEach((r, i) => { if (Number.isFinite(v[i])) (R.rarityWeights ||= {})[r] = v[i]; }); bar.mark(); };
    box.querySelector('[data-ms]').oninput = e => { R.streakMilestones = e.target.value.split(',').map(x => parseInt(x, 10)).filter(n => n > 0); bar.mark(); };
    box.querySelectorAll('[data-m]').forEach(x => x.oninput = x.onchange = () => { const m = R.missions[+x.dataset.m], k = x.dataset.k; m[k] = k === 'n' ? Math.max(1, parseInt(x.value, 10) || 1) : x.value; bar.mark(); });
    box.querySelectorAll('[data-mdel]').forEach(b => b.onclick = () => { R.missions.splice(+b.dataset.mdel, 1); bar.mark(); drawRewards(); });
    box.querySelector('[data-mnew]').onclick = () => { R.missions.push({ id: 'm-' + Date.now().toString(36), t: 'Yeni görev', metric: 'ok', n: 10, e: '⭐' }); bar.mark(); drawRewards(); };
  }
  draw(); drawRewards();
}

// ======================================================================
// Voice (TTS)
// ======================================================================
async function voicePage(el) {
  const C = await content();
  let V = clone(C.voice);
  const st = await api('/api/admin/voice');
  const PROV = [['azure', 'Microsoft Azure Speech', 'AZURE_SPEECH_KEY + AZURE_SPEECH_REGION', 'Önerilen · tr-TR-EmelNeural çok doğal · ayda 500 bin karakter ücretsiz'], ['google', 'Google Cloud Text-to-Speech', 'GOOGLE_TTS_KEY', 'WaveNet / Neural2 sesler'], ['elevenlabs', 'ElevenLabs', 'ELEVENLABS_API_KEY', 'En doğal; her dil için ses kimliği gir']];
  const LANGS = [['tr-TR', '🇹🇷 Pip (Türkçe anlatım)', 'Merhaba! Ben Pip. Bugün TH sesini birlikte öğreneceğiz.'], ['en-US', '🇺🇸 Amerikan İngilizcesi', 'The weather is pretty awesome today, isn\'t it?'], ['en-GB', '🇬🇧 İngiliz İngilizcesi', 'Would you like a cup of tea? It\'s rather lovely weather.']];
  el.innerHTML = `${topbar('Ses (seslendirme)', `Etkin sağlayıcı: <b>${st.active || 'yok — üyeler cihaz seslerini kullanıyor'}</b> · Önbellek: ${st.cache.files} dosya, ${(st.cache.bytes / 1048576).toFixed(1)} MB`, `<button class="btn btn-sm btn-ghost" data-clear>Önbelleği temizle</button>`)}
    <div class="grid2"><section class="panel"><div class="panel-h"><h2>Sağlayıcı</h2></div>
      <label class="lbl">Kullanılacak sağlayıcı<select class="sel" data-prov>${[['auto', 'Otomatik (anahtarı olan ilk sağlayıcı)'], ['azure', 'Azure'], ['google', 'Google'], ['elevenlabs', 'ElevenLabs'], ['off', 'Kapalı (sadece cihaz sesleri)']].map(([v, l]) => `<option value="${v}" ${V.provider === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="stack gap-s mt">${PROV.map(([k, n, env, d]) => `<div class="plan-card"><span style="font-size:22px">${st.available[k] ? '✅' : '⚪'}</span><div class="grow"><b>${n}</b><p class="tiny faint">${d}</p><p class="tiny faint">.env: <code>${env}</code></p></div></div>`).join('')}</div>
      <div class="warn-note mt">Üretilen her ses sunucuda saklanır; aynı cümle ikinci kez para harcamaz. Anahtar yoksa uygulama otomatik olarak cihazın en iyi sesine döner.</div></section>
    <section class="panel"><div class="panel-h"><h2>Sesler ve hız</h2></div><div data-voices></div></section></div>`;
  const bar = dirtyBar(el, { onSave: async () => { await save('voice', V); V = clone(A.content.voice); }, onDiscard: () => voicePage(el) });
  el.querySelector('[data-prov]').onchange = e => { V.provider = e.target.value; bar.mark(); };
  el.querySelector('[data-voices]').innerHTML = LANGS.map(([lang, label, sample]) => `<div style="margin-bottom:16px"><b>${label}</b>
    <div class="form-grid mt-s">${['azure', 'google', 'elevenlabs'].map(p => `<label class="lbl">${p}<input class="inp" data-v="${p}" data-l="${lang}" value="${esc(V.voices[p]?.[lang] || '')}"></label>`).join('')}
      <label class="lbl">Hız<input class="inp" type="number" step="0.05" min="0.5" max="1.5" data-r="${lang}" value="${V.rate?.[lang] ?? 1}"></label></div>
    <div class="row gap-s mt-s"><input class="inp grow" data-sample="${lang}" value="${esc(sample)}"><button class="btn btn-sm btn-primary" data-play="${lang}">${icon.speaker} Dinle</button></div></div>`).join('');
  el.querySelectorAll('[data-v]').forEach(x => x.oninput = () => { (V.voices[x.dataset.v] ||= {})[x.dataset.l] = x.value.trim(); bar.mark(); });
  el.querySelectorAll('[data-r]').forEach(x => x.oninput = () => { (V.rate ||= {})[x.dataset.r] = parseFloat(x.value) || 1; bar.mark(); });
  const audio = new Audio();
  el.querySelectorAll('[data-play]').forEach(b => b.onclick = async () => {
    const lang = b.dataset.play, text = el.querySelector(`[data-sample="${lang}"]`).value;
    b.disabled = true;
    try {
      const r = await fetch('/api/admin/voice/test', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Pratilange': '1' }, body: JSON.stringify({ lang, text }) });
      if (!r.ok) { toast(esc((await r.json()).error)); return; }
      audio.src = URL.createObjectURL(await r.blob()); audio.play();
    } finally { b.disabled = false; }
  });
  el.querySelector('[data-clear]').onclick = async () => { if (await confirmBox({ title: 'Ses önbelleği temizlensin mi?', text: 'Sesler bir sonraki kullanımda yeniden üretilir (ücretli sağlayıcılarda maliyet oluşur).', ok: 'Temizle' })) { await post('/api/admin/voice/clear'); toast('Temizlendi'); voicePage(el); } };
}

// ======================================================================
// Orders
// ======================================================================
async function ordersPage(el) {
  const d = await api('/api/admin/orders');
  const ST = { pending: ['warn', 'Bekliyor'], paid: ['good', 'Ödendi'], cancelled: ['bad', 'İptal'] };
  el.innerHTML = `${topbar('Siparişler', 'Ödeme sayfasından oluşturulan siparişler. Online ödeme bağlanana kadar ödemeyi aldığında “Ödendi” işaretle; Premium veya öğe otomatik tanımlanır.')}
    <section class="panel" style="padding:6px">${d.orders.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Tarih</th><th>Üye</th><th>Ürün</th><th class="num">Tutar</th><th>Durum</th><th></th></tr></thead><tbody>
    ${d.orders.map(o => `<tr><td>${o.id}</td><td>${fdt(o.created_at)}</td><td>${esc(o.name || '')}<br><small class="faint">${esc(o.email || '—')}</small></td><td>${o.kind === 'plan' ? (o.ref === 'premium-yearly' ? 'Premium · yıllık' : 'Premium · aylık') : 'Öğe: ' + esc(o.ref)}</td><td class="num">${Number(o.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
      <td><span class="flag ${ST[o.status]?.[0]}">${ST[o.status]?.[1] || esc(o.status)}</span></td>
      <td><div class="row-act">${o.status === 'pending' ? `<button class="btn btn-xs btn-lime" data-paid="${o.id}">Ödendi</button><button class="btn btn-xs btn-soft" data-cancel="${o.id}">İptal</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-s">Henüz sipariş yok.</div>'}</section>`;
  const setSt = async (id, status) => { await post(`/api/admin/orders/${id}`, { status }); toast(status === 'paid' ? 'Ödendi — tanımlandı ✨' : 'İptal edildi'); ordersPage(el); };
  el.querySelectorAll('[data-paid]').forEach(b => b.onclick = async () => { if (await confirmBox({ title: `#${b.dataset.paid} ödendi olarak işaretlensin mi?`, text: 'Üyeye Premium/öğe hemen tanımlanır.', ok: 'Ödendi' })) setSt(b.dataset.paid, 'paid'); });
  el.querySelectorAll('[data-cancel]').forEach(b => b.onclick = () => setSt(b.dataset.cancel, 'cancelled'));
}

export const v3Pages = { plans: plansPage, levels: levelsPage, emails: emailsPage, market: marketPage, voice: voicePage, orders: ordersPage };

// Linggo Yönetim Paneli — kabuk, genel bakış, üyeler, içgörüler, kayıtlar
import { api, post } from '/js/api.js';
import { icon, esc, toast } from '/js/ui.js';
import { pip } from '/js/mascot.js';
import { contentPages } from './content.js';
import { v3Pages } from './admin2.js';
import { transferPages, mountExcel } from './transfer.js';

export const A = { me: null, content: null, insights: null };
const root = document.getElementById('root');
export const fmt = n => (n ?? 0).toLocaleString('tr-TR');
export const fdate = t => t ? new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
export const fdt = t => t ? new Date(t).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
export function ago(t) {
  if (!t) return '—';
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'az önce'; if (s < 3600) return `${Math.floor(s / 60)} dk önce`; if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  const d = Math.floor(s / 86400); return d < 30 ? `${d} gün önce` : fdate(t);
}
const dayAgo = k => k ? ago(new Date(k + 'T12:00:00').getTime()) : '—';
export const planBadge = (plan, role) => role === 'admin' ? '<span class="badge-plan admin">Admin</span>' : `<span class="badge-plan ${plan}">${plan === 'premium' ? 'Premium' : 'Free'}</span>`;
const flagsHTML = f => (f || []).map(([k, t]) => `<span class="flag ${k}">${esc(t)}</span>`).join('');
const initial = u => esc((u.name || u.email || '?').trim().charAt(0).toLocaleUpperCase('tr-TR'));

// ---------- modal / drawer helpers
export function modal(html, onMount) {
  const w = document.createElement('div'); w.className = 'modal-wrap';
  w.innerHTML = `<div class="drawer-bd" data-x></div><div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(w);
  const close = () => w.remove();
  w.addEventListener('click', e => { if (e.target.closest('[data-x]')) close(); });
  onMount?.(w.querySelector('.modal'), close);
  return close;
}
export function confirmBox({ title, text = '', ok = 'Onayla', danger = false, typeToConfirm = '' }) {
  return new Promise(res => {
    modal(`<h3>${title}</h3><p class="muted">${text}</p>
      ${typeToConfirm ? `<label class="lbl" style="margin-top:12px">Onaylamak için <b>${esc(typeToConfirm)}</b> yaz<input class="inp" data-t></label>` : ''}
      <div class="row gap-s mt"><button class="btn btn-ghost grow" data-x>Vazgeç</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'} grow" data-ok ${typeToConfirm ? 'disabled' : ''}>${ok}</button></div>`, (m, close) => {
      const okb = m.querySelector('[data-ok]');
      m.querySelector('[data-t]')?.addEventListener('input', e => okb.disabled = e.target.value.trim() !== typeToConfirm);
      okb.onclick = () => { close(); res(true); };
      m.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', () => res(false)));
    });
  });
}
function drawer(html) {
  const w = document.createElement('div'); w.className = 'drawer-wrap';
  w.innerHTML = `<div class="drawer-bd" data-x></div><aside class="drawer">${html}</aside>`;
  document.body.appendChild(w);
  requestAnimationFrame(() => w.classList.add('in'));
  const close = () => { w.classList.remove('in'); setTimeout(() => w.remove(), 400); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  w.addEventListener('click', e => { if (e.target.closest('[data-x]')) close(); });
  return { el: w.querySelector('.drawer'), close };
}

// ---------- shell & routing
const NAV = [
  ['grp', 'Panel'],
  ['overview', 'Genel bakış', icon.chart],
  ['users', 'Üyeler', icon.words],
  ['insights', 'Takılma analizi', icon.target],
  ['grp', 'İçerik'],
  ['words', 'Kelimeler (üniteler)', icon.book],
  ['levels', 'Seviyeler & test', icon.target],
  ['themes', 'Günlük hayat temaları', icon.sparkle],
  ['patterns', 'Cümle kalıpları', icon.quote],
  ['lessons', 'Mini dersler', icon.film],
  ['phonetics', 'Telaffuz verisi', icon.wave],
  ['market', 'Pip Market & temalar', icon.sparkle],
  ['transfer', 'Toplu veri & geçmiş', icon.refresh],
  ['grp', 'Gelir & iletişim'],
  ['plans', 'Plan özellikleri', icon.lock],
  ['orders', 'Siparişler', icon.bolt],
  ['emails', 'E-postalar', icon.book],
  ['grp', 'Sistem'],
  ['voice', 'Ses (seslendirme)', icon.speaker],
  ['settings', 'Genel ayarlar', icon.settings],
  ['log', 'İşlem kayıtları', icon.refresh],
];
const PAGES = { overview: overviewPage, users: usersPage, insights: insightsPage, log: logPage, ...contentPages, ...v3Pages, ...transferPages };
let requestsCount = 0;
export let leaveGuard = null; // content editors set this when there are unsaved changes
export const setLeaveGuard = f => { leaveGuard = f; };

async function boot() {
  root.innerHTML = `<div class="adm-login"><div class="center">${pip({ size: 100, mood: 'think', pose: 'think' })}<p class="muted mt-s">Yükleniyor…</p></div></div>`;
  try { A.me = (await api('/api/me')).user; }
  catch { return loginScreen(); }
  if (A.me.role !== 'admin') {
    root.innerHTML = `<div class="adm-login"><div class="panel center" style="max-width:420px">${pip({ size: 110, mood: 'sad' })}<h2 class="h2 mt-s">Yetkin yok</h2><p class="muted mt-s">${esc(A.me.email)} hesabı yönetici değil. Sunucuda <code>npm run make-admin -- ${esc(A.me.email)}</code> komutuyla yetki verebilirsin.</p><a class="btn btn-primary mt" href="/">Uygulamaya dön</a></div></div>`;
    return;
  }
  shell();
  addEventListener('hashchange', route);
  addEventListener('beforeunload', e => { if (leaveGuard?.()) { e.preventDefault(); e.returnValue = ''; } });
  route();
}

function loginScreen(needCode = false, email = '') {
  root.innerHTML = `<div class="adm-login"><form novalidate>
    <div class="row gap-s">${pip({ size: 54, mood: 'happy', pose: 'wave' })}<div><b class="h3">Linggo Admin</b><p class="small muted">Yönetici hesabınla giriş yap</p></div></div>
    <div data-err></div>
    ${needCode ? `<label class="lbl">E-postana gelen 6 haneli kod<input class="inp" id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6"></label>`
      : `<label class="lbl">E-posta<input class="inp" id="em" type="email" autocomplete="email" value="${esc(email)}"></label><label class="lbl">Şifre<input class="inp" id="pw" type="password" autocomplete="current-password"></label>`}
    <button class="btn btn-primary btn-block" type="submit">${needCode ? 'Doğrula' : 'Giriş yap'}</button>
    <a class="small muted center" href="/#/forgot">Şifremi unuttum</a></form></div>`;
  const f = root.querySelector('form');
  f.onsubmit = async e => {
    e.preventDefault();
    try {
      if (needCode) { await post('/api/auth/verify', { email, code: f.code.value }); return boot(); }
      const r = await post('/api/auth/login', { email: f.em.value, password: f.pw.value });
      if (r.needVerify) return loginScreen(true, f.em.value);
      boot();
    } catch (err) { f.querySelector('[data-err]').innerHTML = `<div class="form-err">${esc(err.message)}</div>`; }
  };
}

function shell() {
  root.innerHTML = `<div class="adm">
    <nav class="side">
      <a class="brand" href="#overview"><span class="brand-dot" style="background:var(--lime)">${pip({ size: 24, mood: 'happy' })}</span><span>Linggo<small>Yönetim</small></span></a>
      ${NAV.map(n => n[0] === 'grp' ? `<div class="grp">${n[1]}</div>` : `<a class="nav-a" href="#${n[0]}" data-nav="${n[0]}">${n[2]}<span>${n[1]}</span>${n[0] === 'overview' ? '<span class="cnt" data-req hidden></span>' : ''}</a>`).join('')}
      <div class="side-foot"><span>${esc(A.me.email)}</span><a href="/">↗ Uygulamayı aç</a><button data-logout>Çıkış yap</button></div>
    </nav>
    <main class="main" id="page"></main>
  </div>`;
  root.querySelector('[data-logout]').onclick = async () => { await post('/api/auth/logout').catch(() => { }); location.href = '/'; };
}

let currentPage = null;
export const reloadPage = () => { currentPage = null; return route(); };
async function route() {
  const [name, arg] = (location.hash.slice(1) || 'overview').split('/');
  const page = PAGES[name] ? name : 'overview';
  if (currentPage && currentPage !== page && leaveGuard?.()) {
    if (!(await confirmBox({ title: 'Kaydedilmemiş değişiklikler var', text: 'Sayfadan çıkarsan değişikliklerin kaybolacak.', ok: 'Çık', danger: true }))) { history.replaceState(null, '', '#' + currentPage); return; }
  }
  leaveGuard = null; currentPage = page;
  root.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === page));
  const el = document.getElementById('page');
  el.innerHTML = `<div class="skel"></div><div class="skel mt"></div>`;
  try { await PAGES[page](el, arg && decodeURIComponent(arg)); mountExcel(el, page); }
  catch (e) { el.innerHTML = `<div class="panel"><b>Hata:</b> ${esc(e.message)}</div>`; }
  window.scrollTo(0, 0);
}

export function topbar(title, sub = '', actions = '') {
  return `<div class="top"><div><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div><span class="sp"></span>${actions}</div>`;
}

// ---------- Overview
async function overviewPage(el) {
  const d = await api('/api/admin/overview');
  const t = d.totals;
  requestsCount = d.requests.filter(r => r.plan !== 'premium').length;
  const cnt = root.querySelector('[data-req]'); if (cnt) { cnt.hidden = !requestsCount; cnt.textContent = requestsCount; }
  const first = d.funnel[0][1] || 1;
  el.innerHTML = `${topbar(`Merhaba ${esc((A.me.name || '').split(' ')[0])} 👋`, 'Linggo\'nun bugünkü durumu', `<a class="btn btn-soft btn-sm" href="#users">${icon.words} Üyeler</a>`)}
    <div class="kpis">
      <div class="kpi hl"><span>Toplam üye</span><b>${fmt(t.users)}</b><small>+${fmt(t.new7)} son 7 gün</small></div>
      <div class="kpi"><span>Bugün aktif</span><b>${fmt(t.activeToday)}</b><small>pratik yapan</small></div>
      <div class="kpi"><span>Haftalık aktif</span><b>${fmt(t.active7)}</b><small>${t.users ? Math.round(t.active7 / t.users * 100) : 0}% üyelerin</small></div>
      <div class="kpi"><span>Aylık aktif</span><b>${fmt(t.active30)}</b><small>son 30 gün</small></div>
      <div class="kpi"><span>Premium</span><b>${fmt(t.premium)}</b><small>${t.users ? (t.premium / t.users * 100).toFixed(1) : 0}% dönüşüm</small></div>
      <div class="kpi"><span>Öğrenilen kelime</span><b>${fmt(t.wordsLearned)}</b><small>tüm üyeler toplamı</small></div>
    </div>
    <div class="grid2">
      <section class="panel"><div class="panel-h"><h2>Son 30 gün</h2><span class="sp"></span><div class="legend2"><span><i style="background:var(--ink)"></i>Aktif üye</span><span><i style="background:var(--coral)"></i>Yeni kayıt</span></div></div>${chart(d.series)}</section>
      <section class="panel"><div class="panel-h"><h2>Dönüşüm hunisi</h2><span class="sp"></span><p>kayıt → premium</p></div>
        <div class="funnel">${d.funnel.map(([l, n], i) => `<div class="funnel-row"><span>${l}</span><div class="fb"><i style="width:${Math.max(1.5, n / first * 100)}%"></i></div><span><b>${fmt(n)}</b> <small>${i ? Math.round(n / first * 100) + '%' : ''}</small></span></div>`).join('')}</div>
        ${funnelHint(d.funnel)}</section>
    </div>
    <div class="grid2 eq">
      <section class="panel"><div class="panel-h"><h2>Premium istekleri</h2><span class="sp"></span><p>WhatsApp butonuna basanlar</p></div>
        ${d.requests.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Üye</th><th>Son istek</th><th>Durum</th><th></th></tr></thead><tbody>
        ${d.requests.map(r => `<tr><td><div class="u-cell"><span class="avatar">${initial(r)}</span><div><b>${esc(r.name || '—')}</b><small>${esc(r.email)}</small></div></div></td><td>${ago(r.ts)}${r.n > 1 ? ` <small class="faint">(${r.n}×)</small>` : ''}</td><td>${planBadge(r.plan, r.role)}</td>
          <td><div class="row-act">${r.plan === 'premium' ? '' : `<button class="btn btn-xs btn-lime" data-grant="${r.user_id}">+30 gün</button>`}<button class="btn btn-xs btn-soft" data-open="${r.user_id}">Aç</button></div></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-s">Henüz premium isteği yok.</div>'}
      </section>
      <section class="panel"><div class="panel-h"><h2>Yeni üyeler</h2><span class="sp"></span><a class="link" href="#users">Tümü ${icon.chevron}</a></div>
        <div class="tbl-wrap"><table class="tbl"><tbody>${d.recent.map(u => `<tr class="click" data-open="${u.id}"><td><div class="u-cell"><span class="avatar">${initial(u)}</span><div><b>${esc(u.name || '—')}</b><small>${esc(u.email)}</small></div></div></td><td>${ago(u.createdAt)}</td><td>${flagsHTML(u.flags.slice(0, 2))}</td></tr>`).join('') || '<tr><td class="empty-s">Henüz üye yok.</td></tr>'}</tbody></table></div>
      </section>
    </div>`;
  el.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openUser(+b.dataset.open, () => overviewPage(el)));
  el.querySelectorAll('[data-grant]').forEach(b => b.onclick = async () => {
    await post(`/api/admin/users/${b.dataset.grant}/plan`, { plan: 'premium', days: 30, note: 'WhatsApp isteği', notify: true });
    toast('30 günlük Premium verildi ✨'); overviewPage(el);
  });
}

function funnelHint(f) {
  const steps = f.slice(1).map((s, i) => [f[i][0], s[0], f[i][1] ? s[1] / f[i][1] : 1]).filter(x => x[2] < 1);
  if (!steps.length || f[0][1] < 3) return '';
  const worst = steps.sort((a, b) => a[2] - b[2])[0];
  return `<div class="warn-note mt">🔎 En büyük kayıp: <b>${worst[0]}</b> → <b>${worst[1]}</b> adımında (%${Math.round((1 - worst[2]) * 100)} kayıp).</div>`;
}

function chart(series) {
  const W = 640, H = 220, P = 26, n = series.length;
  const max = Math.max(4, ...series.map(s => Math.max(s[1], s[2])));
  const bw = (W - P * 2) / n;
  const y = v => H - P - (v / max) * (H - P * 2);
  const bars = series.map((s, i) => `<rect x="${P + i * bw + bw * .18}" y="${y(s[2])}" width="${bw * .64}" height="${H - P - y(s[2])}" rx="3" fill="var(--ink)" opacity=".85"><title>${s[0]}: ${s[2]} aktif, ${s[1]} kayıt</title></rect>`).join('');
  const line = series.map((s, i) => `${P + i * bw + bw / 2},${y(s[1])}`).join(' ');
  const labels = series.filter((_, i) => i % 5 === 0 || i === n - 1).map(s => { const i = series.indexOf(s); return `<text x="${P + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${s[0].slice(5).split('-').reverse().join('.')}</text>`; }).join('');
  const grid = [0, .5, 1].map(f => `<line x1="${P}" x2="${W - P}" y1="${y(max * f)}" y2="${y(max * f)}" stroke="var(--line)"/><text x="${P - 6}" y="${y(max * f) + 3}" text-anchor="end">${Math.round(max * f)}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="30 günlük aktif üye ve kayıt grafiği">${grid}${bars}<polyline points="${line}" fill="none" stroke="var(--coral)" stroke-width="2.5" stroke-linejoin="round"/>${series.map((s, i) => s[1] ? `<circle cx="${P + i * bw + bw / 2}" cy="${y(s[1])}" r="3.5" fill="var(--coral)"/>` : '').join('')}${labels}</svg>`;
}

// ---------- Users
let usersState = { q: '', plan: '', flag: '' };
async function usersPage(el, arg) {
  if (arg) usersState.flag = arg;
  el.innerHTML = `${topbar('Üyeler', 'Planları yönet, ilerlemeyi izle, takılanları bul')}
    <div class="toolbar">
      <label class="search">${icon.search}<input data-q placeholder="İsim veya e-posta ara" value="${esc(usersState.q)}"></label>
      <select class="sel" data-plan><option value="">Tüm planlar</option><option value="free">Free</option><option value="premium">Premium</option><option value="admin">Admin</option></select>
      <select class="sel" data-flag><option value="">Tüm durumlar</option><option value="attention">⚠ Dikkat gerektiren</option><option value="requested">💬 Premium isteyen</option><option value="unverified">✉ Doğrulanmamış</option></select>
      <span class="sp"></span><span class="muted-note" data-count></span>
    </div>
    <section class="panel" style="padding:6px"><div class="tbl-wrap" data-tbl><div class="skel"></div></div></section>`;
  el.querySelector('[data-plan]').value = usersState.plan; el.querySelector('[data-flag]').value = usersState.flag;
  const load = async () => {
    const p = new URLSearchParams(usersState);
    const d = await api('/api/admin/users?' + p);
    el.querySelector('[data-count]').textContent = `${fmt(d.total)} üye`;
    el.querySelector('[data-tbl]').innerHTML = d.users.length ? `<table class="tbl"><thead><tr><th>Üye</th><th>Plan</th><th>Son aktivite</th><th class="num">XP</th><th class="num">Seri</th><th class="num">Kelime</th><th class="num">Ünite</th><th class="num">Doğruluk</th><th>Durum</th></tr></thead><tbody>
      ${d.users.map(u => `<tr class="click" data-open="${u.id}"><td><div class="u-cell"><span class="avatar">${initial(u)}</span><div><b>${esc(u.name || '—')}</b><small>${esc(u.email)}</small></div></div></td>
        <td>${planBadge(u.plan, u.role)}${u.plan === 'premium' && u.planUntil && u.role !== 'admin' ? `<br><small class="faint">${fdate(u.planUntil)}</small>` : ''}</td>
        <td>${dayAgo(u.lastDay)}</td><td class="num">${fmt(u.xp)}</td><td class="num">${u.streak ? '🔥' + u.streak : '—'}</td><td class="num">${fmt(u.learned)}</td><td class="num">${u.unit || '—'}</td>
        <td class="num">${u.acc7 == null ? '—' : `<span class="${u.acc7 < 60 ? 'bad-inline' : u.acc7 >= 85 ? 'ok-inline' : ''}">%${u.acc7}</span>`}</td><td style="min-width:200px">${flagsHTML(u.flags)}</td></tr>`).join('')}</tbody></table>` : '<div class="empty-s">Bu filtrelerle üye bulunamadı.</div>';
    el.querySelectorAll('[data-open]').forEach(r => r.onclick = () => openUser(+r.dataset.open, load));
  };
  let tm;
  el.querySelector('[data-q]').oninput = e => { clearTimeout(tm); tm = setTimeout(() => { usersState.q = e.target.value; load(); }, 250); };
  el.querySelector('[data-plan]').onchange = e => { usersState.plan = e.target.value; load(); };
  el.querySelector('[data-flag]').onchange = e => { usersState.flag = e.target.value; load(); };
  await load();
}

const EV = {
  register: '📝 Kayıt oldu', verified: '✅ E-postayı doğruladı', login: '🔑 Giriş yaptı', password_reset: '🔐 Şifre sıfırladı', app_open: '📱 Uygulamayı açtı',
  intro_done: '👋 Pip tanıtımını bitirdi', onboarding_done: '🎯 Kurulumu tamamladı', session_start: '▶️ Oturum başlattı', session_end: '🏁 Oturumu bitirdi',
  session_abandon: '⏸️ Oturumu yarıda bıraktı', module_view: '👀 Modül açtı', tour_done: '🎬 Turu izledi', tour_skip: '⏭️ Turu geçti', paywall_view: '🔒 Premium duvarını gördü',
  premium_request: '💬 Premium istedi (WhatsApp)', lesson_done: '🎬 Ders bitirdi',
};
const KIND = { daily: 'Günlük pratik', review: 'Pekiştirme', unit: 'Ünite', theme: 'Tema', weekly: 'Haftalık', pattern: 'Kalıp', patterns: 'Kalıp tekrarı', pairs: 'Ses çiftleri', words: 'Seçili kelimeler' };
function evDetail(e) {
  const d = e.data || {};
  if (e.type === 'session_end') return `${KIND[d.kind] || d.kind} · %${d.acc} doğruluk · ${d.n} cevap · +${d.xp} XP${d.learned ? ` · ${d.learned} yeni kelime` : ''}`;
  if (e.type === 'session_abandon') return `${KIND[d.kind] || d.kind} · ${d.i}/${d.total} görevde çıktı`;
  if (e.type === 'session_start') return `${KIND[d.kind] || d.kind}${d.arg ? ' · ' + esc(d.arg) : ''}`;
  if (e.type === 'paywall_view') return `Kaynak: ${esc(d.from || '—')}`;
  if (e.type === 'tour_done' || e.type === 'tour_skip') return esc(d.m || '');
  if (e.type === 'onboarding_done') return `Seviye ${esc(d.level)} · hedef ${d.goal} XP · ${d.track === 'life' ? 'Günlük hayat' : 'Sıklık'} · ${d.accent === 'uk' ? '🇬🇧' : '🇺🇸'}`;
  return '';
}

async function openUser(id, onChange) {
  const { el, close } = drawer(`<div class="drawer-b"><div class="skel"></div></div>`);
  const load = async (tab = 'sum') => {
    const d = await api('/api/admin/users/' + id);
    const u = d.user, s = d.stats || {};
    el.innerHTML = `<div class="drawer-h">
        <div class="row gap"><span class="avatar" style="width:48px;height:48px;font-size:20px;border-radius:15px">${initial(u)}</span>
          <div class="grow"><b class="h3">${esc(u.name || '—')}</b><p class="small muted">${esc(u.email)} · üye ${fdate(u.createdAt)}</p></div>
          ${planBadge(u.plan, u.role)}<button class="icon-btn" data-x aria-label="Kapat">${icon.close}</button></div>
        <div class="mt-s">${flagsHTML(u.flags) || '<span class="flag good">Sorun görünmüyor</span>'}</div>
        <div class="tabs">${[['sum', 'Özet'], ['plan', 'Plan'], ['pip', 'Pip & market'], ['act', 'Aktivite'], ['mng', 'Yönetim']].map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="drawer-b" data-body></div>`;
    el.querySelector('[data-x]').onclick = close;
    const body = el.querySelector('[data-body]');
    const tabs = {
      sum: () => {
        const hist = s.history || [];
        const days = Array.from({ length: 60 }, (_, i) => { const dt = new Date(Date.now() - (59 - i) * 864e5); const k = dt.toISOString().slice(0, 10); return (hist.find(h => h[0] === k) || [k, 0])[1]; });
        const mx = Math.max(1, ...days);
        return s.xp !== undefined ? `
        <div class="mini-stats">
          <div><b>${fmt(s.xp)}</b><span>toplam XP</span></div><div><b>🔥 ${s.streak}</b><span>seri (en iyi ${s.best})</span></div>
          <div><b>${fmt(s.learned)}</b><span>öğrenilen kelime</span></div><div><b>${fmt(s.mature)}</b><span>kalıcı hafızada</span></div>
          <div><b class="${s.due > 60 ? 'bad-inline' : ''}">${fmt(s.due)}</b><span>bekleyen tekrar</span></div><div><b>${s.acc7 == null ? '—' : '%' + s.acc7}</b><span>7 gün doğruluk</span></div>
          <div><b>${s.activeDays}</b><span>aktif gün</span></div><div><b>${s.patterns}</b><span>kalıp</span></div>
          <div><b>${s.lessons}</b><span>mini ders</span></div><div><b>${s.pairs?.n ? '%' + Math.round(s.pairs.ok / s.pairs.n * 100) : '—'}</b><span>ses çifti başarısı</span></div>
          <div><b>${d.extra.started}</b><span>oturum başlattı</span></div><div><b class="${d.extra.abandon >= .4 ? 'bad-inline' : ''}">%${Math.round(d.extra.abandon * 100)}</b><span>yarıda bırakma</span></div>
        </div>
        <section class="panel mt"><div class="panel-h"><h2>Son 60 gün XP</h2><span class="sp"></span><p>son aktivite: ${dayAgo(s.lastDay)}</p></div><div class="spark">${days.map(v => `<i class="${v ? '' : 'z'}" style="height:${v ? Math.max(8, v / mx * 100) : 4}%" title="${v} XP"></i>`).join('')}</div></section>
        <div class="grid2 eq" style="margin-top:14px">
          <section class="panel"><div class="panel-h"><h2>Nerede?</h2></div>
            ${s.unit ? `<p class="small">Sıklık listesinde <b>Ünite ${s.unit.n}</b> · ${s.unit.learned}/${s.unit.total}</p><div class="bar lime mt-s"><i style="width:${s.unit.learned / s.unit.total * 100}%"></i></div>` : '<p class="small muted">Ünite bilgisi yok.</p>'}
            ${s.profile ? `<div class="divider"></div><p class="small">Seviye: <b>${({ zero: 'Sıfırdan', basic: 'A1–A2', mid: 'B1–B2', adv: 'C1+' })[s.profile.level] || esc(s.profile.level)}</b> · Hedef: <b>${s.profile.goal} XP</b> · Günlük yeni: <b>${s.profile.dailyNew}</b><br>Rota: <b>${s.profile.track === 'life' ? 'Günlük hayat' : 'En çok kullanılan'}</b> · Aksan: <b>${s.profile.accent === 'uk' ? '🇬🇧' : '🇺🇸'}</b><br>Plan: “${esc(s.profile.cue || '')} sonra”</p>` : '<p class="small muted mt-s">Kurulumu tamamlamadı.</p>'}
          </section>
          <section class="panel"><div class="panel-h"><h2>En çok zorlandığı kelimeler</h2></div>
            ${s.hard?.length ? s.hard.map(([w, l]) => `<div class="row between small" style="padding:6px 0;border-bottom:1px solid var(--line)"><b>${esc(w)}</b><span class="bad-inline">${l}× unuttu</span></div>`).join('') : '<p class="small muted">Henüz yok.</p>'}
          </section>
        </div>` : '<div class="empty-s">Bu üyenin henüz ilerleme verisi yok.</div>';
      },
      plan: () => `
        <section class="panel">
          <div class="panel-h"><h2>Mevcut plan</h2><span class="sp"></span>${planBadge(u.plan, u.role)}</div>
          <p class="small">${u.plan === 'premium' ? (u.planUntil ? `Premium <b>${fdate(u.planUntil)}</b> tarihine kadar geçerli.` : 'Süresiz Premium.') : u.planRaw === 'premium' ? 'Premium süresi dolmuş.' : 'Ücretsiz plan.'}${u.planNote ? `<br><span class="muted">Not: ${esc(u.planNote)}</span>` : ''}</p>
        </section>
        <section class="panel mt"><div class="panel-h"><h2>Premium ver / uzat</h2></div>
          <div class="row gap-s wrap">${[[30, '+30 gün'], [90, '+3 ay'], [180, '+6 ay'], [365, '+1 yıl']].map(([dd, l]) => `<button class="btn btn-sm btn-soft" data-days="${dd}">${l}</button>`).join('')}<button class="btn btn-sm btn-soft" data-life>Süresiz</button></div>
          <div class="form-grid mt">
            <label class="lbl">veya bitiş tarihi<input class="inp" type="date" data-until min="${new Date(Date.now() + 864e5).toISOString().slice(0, 10)}"></label>
            <label class="lbl">Not (ödeme, kampanya…)<input class="inp" data-note maxlength="300" placeholder="Ör. WhatsApp · 3 aylık ödeme alındı"></label>
          </div>
          <label class="row gap-s small mt"><input type="checkbox" data-notify checked> Üyeye “Premium aktif” e-postası gönder</label>
          <button class="btn btn-lime mt" data-apply-date>${icon.check} Tarihe kadar Premium ver</button>
        </section>
        ${u.plan === 'premium' && u.role !== 'admin' ? `<section class="panel mt"><div class="panel-h"><h2>Ücretsiz plana al</h2></div><p class="small muted">Premium erişim hemen kapanır; ilerleme silinmez.</p><button class="btn btn-sm btn-danger mt-s" data-free>Ücretsize al</button></section>` : ''}`,
      pip: () => `<section class="panel"><div class="row gap">${pip({ size: 120, outfit: Object.fromEntries(Object.entries(d.pip?.equip || {}).map(([s, id]) => [s, (A.content?.market?.items || []).find(i => i.id === id)]).filter(x => x[1])), backdrop: true })}
          <div class="grow"><p class="eyebrow">Yaprak bakiyesi</p><b class="h1">🍃 ${fmt(d.market.balance)}</b><p class="small muted">${d.market.owned.length} öğeye sahip · seviye: <b>${esc((u.level || '—').toUpperCase())}</b>${d.placement ? ` · test sonucu: <b>${esc(String(d.placement.level).toUpperCase())}</b> (${fdt(d.placement.ts)})` : ''}</p>
          <p class="small muted">E-posta izni: <b>${u.marketing ? 'var' : 'yok'}</b></p></div></div></section>
        <section class="panel mt"><div class="panel-h"><h2>Hediye et</h2></div>
          <div class="form-grid"><label class="lbl">Yaprak ekle (eksi = düş)<input class="inp" type="number" data-gc value="100"></label><div class="lbl" style="justify-content:flex-end"><button class="btn btn-sm btn-lime" data-gcoin>🍃 Yaprak gönder</button></div>
          <label class="lbl full">Öğe hediye et<select class="sel" data-gi>${(A.content?.market?.items || []).filter(i => !d.market.owned.includes(i.id)).map(i => `<option value="${esc(i.id)}">${esc(i.name)} · ${esc(i.slot)}</option>`).join('')}</select></label>
          <div><button class="btn btn-sm btn-primary" data-gitem>🎁 Öğeyi hediye et</button></div></div></section>
        ${d.orders?.length ? `<section class="panel mt"><div class="panel-h"><h2>Siparişleri</h2><span class="sp"></span><a class="link" href="#orders">Tümü</a></div>${d.orders.map(o => `<div class="row between small" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>#${o.id} · ${esc(o.ref)}</span><span>${Number(o.amount).toLocaleString('tr-TR')} ₺ · ${esc(o.status)}</span></div>`).join('')}</section>` : ''}`,
      act: () => `<section class="panel"><div class="tl">${d.events.map(e => `<div class="tl-row"><time>${fdt(e.ts)}</time><div>${EV[e.type] || e.type}${evDetail(e) ? `<br><small class="faint">${evDetail(e)}</small>` : ''}</div></div>`).join('') || '<div class="empty-s">Henüz etkinlik yok.</div>'}</div></section>`,
      mng: () => `
        <section class="panel"><div class="panel-h"><h2>Yönetici notu</h2><span class="sp"></span><p>sadece yöneticiler görür</p></div>
          <textarea class="inp" data-anote style="width:100%" placeholder="Ör. Telefonla görüşüldü, B1 seviyesinde">${esc(u.adminNote || '')}</textarea><button class="btn btn-sm btn-primary mt-s" data-save-note>Notu kaydet</button></section>
        <section class="panel mt"><div class="panel-h"><h2>Hesap</h2></div>
          <div class="form-grid">
            <label class="lbl">E-posta doğrulaması<select class="sel" data-verified><option value="1" ${u.verified ? 'selected' : ''}>Doğrulandı</option><option value="0" ${u.verified ? '' : 'selected'}>Doğrulanmadı</option></select></label>
            <label class="lbl">Rol<select class="sel" data-role><option value="user">Üye</option><option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Yönetici</option></select></label>
          </div>
          <p class="muted-note mt-s">Açık oturum: ${d.sessions}</p>
          <div class="row gap-s wrap mt"><button class="btn btn-sm btn-soft" data-logout-all>Tüm oturumlarını kapat</button><button class="btn btn-sm btn-soft" data-reset-prog>İlerlemesini sıfırla</button><button class="btn btn-sm btn-danger" data-del>Hesabı sil</button></div>
        </section>`,
    };
    body.innerHTML = tabs[tab]();
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => load(b.dataset.tab));
    if (tab === 'pip' && !A.content) { A.content = (await api('/api/admin/content')).content; return load('pip'); }
    body.querySelector('[data-gcoin]')?.addEventListener('click', async () => { await post(`/api/admin/users/${id}/gift`, { coins: +body.querySelector('[data-gc]').value }); toast('Yaprak gönderildi 🍃'); load('pip'); });
    body.querySelector('[data-gitem]')?.addEventListener('click', async () => { const v = body.querySelector('[data-gi]').value; if (!v) return; await post(`/api/admin/users/${id}/gift`, { itemId: v }); toast('Hediye edildi 🎁'); load('pip'); });
    const setPlan = async payload => {
      try { await post(`/api/admin/users/${id}/plan`, { ...payload, note: body.querySelector('[data-note]')?.value || payload.note || '', notify: body.querySelector('[data-notify]')?.checked }); toast('Plan güncellendi ✨'); onChange?.(); load('plan'); }
      catch (e) { toast(esc(e.message)); }
    };
    body.querySelectorAll('[data-days]').forEach(b => b.onclick = () => setPlan({ plan: 'premium', days: +b.dataset.days }));
    body.querySelector('[data-life]')?.addEventListener('click', () => setPlan({ plan: 'premium' }));
    body.querySelector('[data-apply-date]')?.addEventListener('click', () => { const v = body.querySelector('[data-until]').value; if (!v) return toast('Önce bir tarih seç'); setPlan({ plan: 'premium', until: v }); });
    body.querySelector('[data-free]')?.addEventListener('click', async () => { if (await confirmBox({ title: 'Ücretsiz plana alınsın mı?', ok: 'Ücretsize al', danger: true })) setPlan({ plan: 'free' }); });
    const upd = async (b, msg) => { try { await post(`/api/admin/users/${id}/update`, b); toast(msg); onChange?.(); load('mng'); } catch (e) { toast(esc(e.message)); } };
    body.querySelector('[data-save-note]')?.addEventListener('click', () => upd({ note: body.querySelector('[data-anote]').value }, 'Not kaydedildi'));
    body.querySelector('[data-verified]')?.addEventListener('change', e => upd({ verified: e.target.value === '1' }, 'Güncellendi'));
    body.querySelector('[data-role]')?.addEventListener('change', e => upd({ role: e.target.value }, 'Rol güncellendi'));
    body.querySelector('[data-logout-all]')?.addEventListener('click', () => upd({ logoutAll: true }, 'Oturumlar kapatıldı'));
    body.querySelector('[data-reset-prog]')?.addEventListener('click', async () => { if (await confirmBox({ title: 'İlerleme sıfırlansın mı?', text: 'Tüm kelime hafızası, XP ve seri silinir.', ok: 'Sıfırla', danger: true })) upd({ resetProgress: true }, 'İlerleme sıfırlandı'); });
    body.querySelector('[data-del]')?.addEventListener('click', async () => {
      if (!(await confirmBox({ title: 'Hesap kalıcı olarak silinsin mi?', text: 'Bu işlem geri alınamaz.', ok: 'Sil', danger: true, typeToConfirm: u.email }))) return;
      try { await post(`/api/admin/users/${id}/delete`); toast('Hesap silindi'); close(); onChange?.(); } catch (e) { toast(esc(e.message)); }
    });
  };
  load();
}

// ---------- Insights
async function insightsPage(el) {
  const d = await api('/api/admin/insights');
  A.insights = d;
  const hardTbl = (rows, label, link) => rows.length ? `<div class="tbl-wrap" style="max-height:420px"><table class="tbl"><thead><tr><th>${label}</th><th>Hata oranı</th><th class="num">Deneme</th><th></th></tr></thead><tbody>
    ${rows.map(r => { const name = r.item.split(':').slice(1).join(':'); return `<tr><td><b>${esc(name)}</b></td><td><div class="rate"><i><b style="width:${r.rate}%"></b></i><span>%${r.rate}</span></div></td><td class="num">${r.ok + r.wrong}</td><td>${link ? `<a class="link" href="#${link}/${encodeURIComponent(name)}">Düzenle</a>` : ''}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty-s">Yeterli veri yok (en az 5 deneme gerekir).</div>';
  const maxU = Math.max(1, ...Object.values(d.stuckUnits));
  el.innerHTML = `${topbar('Takılma analizi', 'Üyeler nerede zorlanıyor, nerede bırakıyor?')}
    <div class="grid2">
      <section class="panel"><div class="panel-h"><h2>Dikkat gerektiren üyeler</h2><span class="sp"></span><a class="link" href="#users/attention">Tümü ${icon.chevron}</a></div>
        ${d.attention.length ? `<div class="tbl-wrap" style="max-height:420px"><table class="tbl"><tbody>${d.attention.map(u => `<tr class="click" data-open="${u.id}"><td><div class="u-cell"><span class="avatar">${initial(u)}</span><div><b>${esc(u.name || '—')}</b><small>${esc(u.email)}</small></div></div></td><td>${flagsHTML(u.flags)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-s">Şu an dikkat gerektiren üye yok 🎉</div>'}</section>
      <section class="panel"><div class="panel-h"><h2>Üyeler hangi ünitede?</h2><span class="sp"></span><p>sıklık listesi</p></div>
        ${Object.keys(d.stuckUnits).length ? `<div class="funnel">${Object.entries(d.stuckUnits).sort((a, b) => a[0] - b[0]).map(([u, n]) => `<div class="funnel-row" style="grid-template-columns:70px 1fr 40px"><span>Ünite ${u}</span><div class="fb"><i style="width:${n / maxU * 100}%"></i></div><b>${n}</b></div>`).join('')}</div><p class="muted-note mt-s">Bir ünitede yığılma varsa o ünitenin kelimelerini kolaylaştırmayı veya bölmeyi düşün.</p>` : '<div class="empty-s">Veri yok.</div>'}</section>
    </div>
    <section class="panel mt"><div class="panel-h"><h2>Oturum tamamlama</h2><span class="sp"></span><p>son 60 gün</p></div>
      ${d.sessions.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Oturum türü</th><th class="num">Başlatılan</th><th class="num">Tamamlanan</th><th class="num">Yarıda</th><th>Tamamlama</th><th class="num">Ort. bırakma noktası</th></tr></thead><tbody>
      ${d.sessions.sort((a, b) => b.start - a.start).map(s => { const c = s.start ? Math.round(s.end / s.start * 100) : 0; return `<tr><td><b>${KIND[s.kind] || esc(s.kind)}</b></td><td class="num">${s.start}</td><td class="num">${s.end}</td><td class="num">${s.abandon || 0}</td><td><div class="rate"><i><b style="width:${c}%;background:${c < 60 ? 'var(--no)' : 'var(--ok)'}"></b></i><span>%${c}</span></div></td><td class="num">${s.at != null ? '%' + s.at : '—'}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty-s">Henüz oturum verisi yok.</div>'}
    </section>
    <div class="grid2 eq">
      <section class="panel"><div class="panel-h"><h2>En zor kelimeler</h2><span class="sp"></span><p>tüm üyeler</p></div>${hardTbl(d.words, 'Kelime', 'words')}</section>
      <section class="panel"><div class="panel-h"><h2>En zor kalıplar</h2></div>${hardTbl(d.patterns, 'Kalıp', 'patterns')}<div class="panel-h mt"><h2>En zor ses çiftleri</h2></div>${hardTbl(d.pairs, 'Çift', '')}</section>
    </div>
    <div class="grid2 eq">
      <section class="panel"><div class="panel-h"><h2>Premium duvarı</h2><span class="sp"></span><p>son 30 gün</p></div>
        <p class="small">Premium isteyen üye: <b>${d.requests30}</b></p>
        ${d.paywall.length ? d.paywall.map(p => `<div class="row between small" style="padding:7px 0;border-bottom:1px solid var(--line)"><span>${esc(p.src || '—')}</span><b>${p.n}</b></div>`).join('') : '<p class="small muted mt-s">Henüz görüntülenme yok.</p>'}</section>
      <section class="panel"><div class="panel-h"><h2>Tanıtım turları</h2></div>
        ${['words', 'patterns', 'sounds', 'progress', 'session'].map(m => { const done = d.tours.find(t => t.m === m && t.type === 'tour_done')?.n || 0, skip = d.tours.find(t => t.m === m && t.type === 'tour_skip')?.n || 0; return `<div class="row between small" style="padding:7px 0;border-bottom:1px solid var(--line)"><span>${m}</span><span>✅ ${done} · ⏭️ ${skip}</span></div>`; }).join('')}</section>
    </div>`;
  el.querySelectorAll('[data-open]').forEach(r => r.onclick = () => openUser(+r.dataset.open, () => insightsPage(el)));
}

// ---------- Log
async function logPage(el) {
  const d = await api('/api/admin/log');
  const L = { 'plan.set': 'Plan değiştirildi', 'user.update': 'Üye güncellendi', 'user.delete': 'Üye silindi', 'content.update': 'İçerik güncellendi', 'content.reset': 'İçerik varsayılana döndü', 'content.import': 'Toplu içe aktarma', 'content.revert': 'İçerik geri alındı', 'content.export': 'İçerik indirildi' };
  el.innerHTML = `${topbar('İşlem kayıtları', 'Yöneticilerin yaptığı son 200 işlem')}
    <section class="panel" style="padding:6px">${d.log.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Zaman</th><th>Yönetici</th><th>İşlem</th><th>Hedef</th><th>Detay</th></tr></thead><tbody>
    ${d.log.map(l => `<tr><td>${fdt(l.ts)}</td><td>${esc(l.admin || '—')}</td><td><b>${L[l.action] || esc(l.action)}</b></td><td>${esc(l.target || '')}</td><td class="small faint" style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(l.detail || '')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-s">Henüz kayıt yok.</div>'}</section>`;
}

boot();

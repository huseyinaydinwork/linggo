// Üyelik ekranları: giriş, kayıt, e-posta kodu doğrulama, şifremi unuttum / sıfırla
import { post } from '../api.js';
import { pip as pip0 } from '../mascot.js';
import { look } from '../wear.js';
// logged-out pages: Pip wears his signature look
const pip = (o = {}) => pip0({ outfit: look('hat', 'glasses', 'top', 'bag', 'shoes'), ...o });
import { icon, esc, toast, brandMark } from '../ui.js';
import { navigate, onAuthed } from '../app.js';

const mem = {
  get email() { try { return sessionStorage.getItem('pl_email') || ''; } catch { return ''; } },
  set email(v) { try { sessionStorage.setItem('pl_email', v); } catch { } },
};
const QUOTES = [
  ['Günde 10 dakika, yılda 60 saat. Küçük adımlar büyük dil becerisine dönüşür.', 'Pip'],
  ['Hatırlamaya çalışmak, tekrar okumaktan çok daha güçlü bir öğrenmedir.', 'Öğrenme bilimi'],
  ['Hata yapmaktan korkma. Beynin neyi güçlendireceğine hatalarla karar verir.', 'Pip'],
];

function shell(el, inner, { mood = 'happy', pose = 'wave' } = {}) {
  document.body.classList.add('wide');
  const [q, a] = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  el.innerHTML = `<div class="auth">
    <div class="auth-main">
      <div class="row between"><a class="brand" href="#/">${brandMark()}</a><a class="link small muted" href="#/">${icon.back.replace('<svg', '<svg width="14" height="14"')} Ana sayfa</a></div>
      <form class="auth-form" novalidate>${inner}</form>
      <p class="tiny faint center">Devam ederek kullanım koşullarını ve gizlilik politikasını kabul etmiş olursun.</p>
    </div>
    <aside class="auth-art">${pip({ size: 280, mood, pose })}<blockquote>“${q}”</blockquote><p style="opacity:.6;margin-top:12px">— ${a}</p></aside>
  </div>`;
  return el.querySelector('form');
}
function busy(btn, on, label) {
  btn.disabled = on;
  if (on) { btn.dataset.l = btn.innerHTML; btn.innerHTML = `<span class="spin"></span>${label || ''}`; }
  else if (btn.dataset.l) btn.innerHTML = btn.dataset.l;
}
function showErr(form, msg, kind = 'err') {
  let e = form.querySelector('[data-msg]');
  if (!e) {
    e = document.createElement('div'); e.dataset.msg = '';
    const slot = form.querySelector('[data-msg-slot]');
    if (slot) slot.after(e); else form.prepend(e);
  }
  e.className = kind === 'ok' ? 'form-ok' : kind === 'note' ? 'form-note' : 'form-err';
  e.innerHTML = msg;
  if (!msg) e.remove();
}
const devNote = code => code ? `<div class="form-note">🛠 Geliştirme modu (SMTP ayarlı değil): kodun <b>${esc(code)}</b></div>` : '';
const pwField = (id, label, auto) => `<div class="field"><label for="${id}">${label}</label><div class="pw-wrap"><input class="input" id="${id}" type="password" autocomplete="${auto}" required minlength="8"><button type="button" data-eye="${id}">Göster</button></div></div>`;
function wireEyes(form) {
  form.querySelectorAll('[data-eye]').forEach(b => b.onclick = () => { const i = form.querySelector('#' + b.dataset.eye); i.type = i.type === 'password' ? 'text' : 'password'; b.textContent = i.type === 'password' ? 'Göster' : 'Gizle'; });
}
function strength(pw) {
  let s = 0; if (pw.length >= 8) s++; if (/\d/.test(pw) && /[a-zA-Zçğıöşü]/i.test(pw)) s++; if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++; if (pw.length >= 12 || /[^\w\s]/.test(pw)) s++;
  return pw ? Math.max(1, s) : 0;
}

// ---------- 6-digit code input
function codeInput(container, onComplete) {
  container.innerHTML = Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" autocomplete="${i === 0 ? 'one-time-code' : 'off'}" aria-label="Kod hanesi ${i + 1}">`).join('');
  const ins = [...container.querySelectorAll('input')];
  const val = () => ins.map(i => i.value).join('');
  const fill = str => { const d = str.replace(/\D/g, '').slice(0, 6).split(''); ins.forEach((i, k) => { i.value = d[k] || ''; i.classList.toggle('filled', !!i.value); }); (ins[Math.min(d.length, 5)]).focus(); if (d.length === 6) onComplete(val()); };
  ins.forEach((inp, k) => {
    inp.addEventListener('input', () => {
      const v = inp.value.replace(/\D/g, '');
      if (v.length > 1) return fill(v);
      inp.value = v; inp.classList.toggle('filled', !!v);
      if (v && k < 5) ins[k + 1].focus();
      if (val().length === 6) onComplete(val());
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && k > 0) { ins[k - 1].value = ''; ins[k - 1].classList.remove('filled'); ins[k - 1].focus(); }
      if (e.key === 'ArrowLeft' && k > 0) ins[k - 1].focus();
      if (e.key === 'ArrowRight' && k < 5) ins[k + 1].focus();
    });
    inp.addEventListener('paste', e => { e.preventDefault(); fill(e.clipboardData.getData('text')); });
  });
  setTimeout(() => ins[0].focus(), 200);
  return { value: val, clear: () => { ins.forEach(i => { i.value = ''; i.classList.remove('filled'); }); ins[0].focus(); }, shake: () => { container.classList.remove('shake'); void container.offsetWidth; container.classList.add('shake'); } };
}

function resendTimer(btn, secs = 55) {
  let t = secs; btn.disabled = true;
  const tick = () => { btn.textContent = t > 0 ? `Yeni kod (${t} sn)` : 'Yeni kod gönder'; if (t-- <= 0) { clearInterval(iv); btn.disabled = false; } };
  const iv = setInterval(tick, 1000); tick();
  return () => clearInterval(iv);
}

// ---------- views
export function loginView(el) {
  const f = shell(el, `
    <div><p class="eyebrow">Tekrar hoş geldin</p><h1 class="h1" style="margin-top:8px">Giriş yap</h1></div>
    <span data-msg-slot></span>
    <div class="field"><label for="em">E-posta</label><input class="input" id="em" type="email" autocomplete="email" required value="${esc(mem.email)}"></div>
    ${pwField('pw', 'Şifre', 'current-password')}
    <div class="row between"><span></span><a class="link-btn small" href="#/forgot">Şifremi unuttum</a></div>
    <button class="btn btn-primary btn-block" type="submit">Giriş yap ${icon.arrow}</button>
    <div class="divider-t">veya</div>
    <a class="btn btn-soft btn-block" href="#/register">Yeni hesap oluştur</a>`, { mood: 'happy', pose: 'wave' });
  wireEyes(f);
  setTimeout(() => f.querySelector(mem.email ? '#pw' : '#em').focus(), 200);
  f.onsubmit = async e => {
    e.preventDefault();
    const btn = f.querySelector('[type=submit]'), email = f.em.value.trim();
    mem.email = email;
    busy(btn, true);
    try {
      const r = await post('/api/auth/login', { email, password: f.pw.value });
      if (r.needVerify) { sessionStorage.setItem('pl_dev', r.devCode || ''); toast('Hesabını doğrulamak için e-postana bir kod gönderdik ✉️'); return navigate('/verify'); }
      await onAuthed(r.user);
    } catch (err) { showErr(f, esc(err.message)); busy(btn, false); }
  };
}

export function registerView(el) {
  const f = shell(el, `
    <div><p class="eyebrow">Ücretsiz başla</p><h1 class="h1" style="margin-top:8px">Hesap oluştur</h1><p class="muted small" style="margin-top:8px">Kredi kartı gerekmez. İlerlemen tüm cihazlarında senkronize olur.</p></div>
    <span data-msg-slot></span>
    <div class="field"><label for="nm">Adın</label><input class="input" id="nm" autocomplete="given-name" required maxlength="40"></div>
    <div class="field"><label for="em">E-posta</label><input class="input" id="em" type="email" autocomplete="email" required value="${esc(mem.email)}"></div>
    ${pwField('pw', 'Şifre', 'new-password')}
    <div class="pw-meter" data-s="0"><i></i><i></i><i></i><i></i></div>
    <p class="tiny faint" style="margin-top:-6px">En az 8 karakter, en az bir harf ve bir rakam.</p>
    <label class="consent"><input type="checkbox" id="mk"><span>Haftalık gündem, öğrenme ipuçları ve kampanya e-postaları almak istiyorum. <small>(İsteğe bağlı · istediğin zaman kapatabilirsin)</small></span></label>
    <button class="btn btn-primary btn-block" type="submit">Hesabımı oluştur ${icon.arrow}</button>
    <p class="small muted center">Zaten hesabın var mı? <a class="link-btn" href="#/login">Giriş yap</a></p>`, { mood: 'wow', pose: 'cheer' });
  wireEyes(f);
  setTimeout(() => f.nm.focus(), 200);
  const meter = f.querySelector('.pw-meter');
  f.pw.oninput = () => meter.dataset.s = strength(f.pw.value);
  f.onsubmit = async e => {
    e.preventDefault();
    const btn = f.querySelector('[type=submit]'), email = f.em.value.trim();
    if (!f.nm.value.trim()) return showErr(f, 'Adını yaz.');
    mem.email = email;
    busy(btn, true);
    try {
      const r = await post('/api/auth/register', { name: f.nm.value.trim(), email, password: f.pw.value, marketing: f.mk.checked });
      sessionStorage.setItem('pl_dev', r.devCode || '');
      navigate('/verify');
    } catch (err) { showErr(f, esc(err.message) + (err.status === 409 ? ' <a class="link-btn" href="#/login">Giriş yap →</a>' : '')); busy(btn, false); }
  };
}

export function verifyView(el) {
  const email = mem.email;
  if (!email) return navigate('/register');
  const dev = sessionStorage.getItem('pl_dev');
  const f = shell(el, `
    <div style="font-size:44px">✉️</div>
    <div><h1 class="h1">E-postanı doğrula</h1><p class="muted" style="margin-top:10px"><b>${esc(email)}</b> adresine 6 haneli bir kod gönderdik. Spam klasörünü de kontrol etmeyi unutma.</p></div>
    <span data-msg-slot></span>${devNote(dev)}
    <div class="code-in" data-code></div>
    <button class="btn btn-primary btn-block" type="submit">Doğrula ${icon.check}</button>
    <div class="row between small"><button type="button" class="link-btn" data-resend>Yeni kod gönder</button><a class="link-btn" href="#/register">E-postayı değiştir</a></div>`, { mood: 'think', pose: 'point' });
  let stop = resendTimer(f.querySelector('[data-resend]'));
  const submit = async code => {
    const btn = f.querySelector('[type=submit]'); busy(btn, true);
    try { const r = await post('/api/auth/verify', { email, code }); sessionStorage.removeItem('pl_dev'); toast('Hesabın doğrulandı 🎉'); await onAuthed(r.user, true); }
    catch (err) { showErr(f, esc(err.message)); ci.shake(); ci.clear(); busy(btn, false); }
  };
  const ci = codeInput(f.querySelector('[data-code]'), submit);
  f.onsubmit = e => { e.preventDefault(); if (ci.value().length === 6) submit(ci.value()); else { showErr(f, '6 haneli kodu gir.'); ci.shake(); } };
  f.querySelector('[data-resend]').onclick = async () => {
    try { const r = await post('/api/auth/resend', { email, purpose: 'verify' }); showErr(f, 'Yeni kod gönderildi.' + (r.devCode ? ` (Geliştirme: <b>${esc(r.devCode)}</b>)` : ''), 'ok'); stop(); stop = resendTimer(f.querySelector('[data-resend]')); }
    catch (err) { showErr(f, esc(err.message)); if (err.data?.wait) { stop(); stop = resendTimer(f.querySelector('[data-resend]'), err.data.wait); } }
  };
  return () => stop();
}

export function forgotView(el) {
  let step = 1, stop = () => { };
  const draw = (dev) => {
    stop();
    const f = step === 1 ? shell(el, `
      <div style="font-size:44px">🔑</div>
      <div><h1 class="h1">Şifreni mi unuttun?</h1><p class="muted" style="margin-top:10px">Sorun değil. E-postanı yaz, sana bir sıfırlama kodu gönderelim.</p></div>
      <span data-msg-slot></span>
      <div class="field"><label for="em">E-posta</label><input class="input" id="em" type="email" autocomplete="email" required value="${esc(mem.email)}"></div>
      <button class="btn btn-primary btn-block" type="submit">Kod gönder ${icon.arrow}</button>
      <p class="small muted center"><a class="link-btn" href="#/login">Girişe dön</a></p>`, { mood: 'think', pose: 'think' })
      : shell(el, `
      <div style="font-size:44px">🔐</div>
      <div><h1 class="h1">Yeni şifre belirle</h1><p class="muted" style="margin-top:10px">Bu e-postaya kayıtlı bir hesap varsa <b>${esc(mem.email)}</b> adresine kod gönderdik.</p></div>
      <span data-msg-slot></span>${devNote(dev)}
      <div class="field"><label>Doğrulama kodu</label><div class="code-in" data-code></div></div>
      ${pwField('pw', 'Yeni şifre', 'new-password')}
      <div class="pw-meter" data-s="0"><i></i><i></i><i></i><i></i></div>
      <button class="btn btn-primary btn-block" type="submit">Şifremi güncelle ${icon.check}</button>
      <div class="row between small"><button type="button" class="link-btn" data-resend>Yeni kod gönder</button><button type="button" class="link-btn" data-back>E-postayı değiştir</button></div>`, { mood: 'happy', pose: 'hold' });
    wireEyes(f);
    if (step === 1) {
      setTimeout(() => f.em.focus(), 200);
      f.onsubmit = async e => {
        e.preventDefault();
        const btn = f.querySelector('[type=submit]'); mem.email = f.em.value.trim();
        busy(btn, true);
        try { const r = await post('/api/auth/forgot', { email: mem.email }); step = 2; draw(r.devCode); }
        catch (err) { showErr(f, esc(err.message)); busy(btn, false); }
      };
    } else {
      const ci = codeInput(f.querySelector('[data-code]'), () => f.pw.focus());
      const meter = f.querySelector('.pw-meter'); f.pw.oninput = () => meter.dataset.s = strength(f.pw.value);
      stop = resendTimer(f.querySelector('[data-resend]'));
      f.querySelector('[data-back]').onclick = () => { step = 1; draw(); };
      f.querySelector('[data-resend]').onclick = async () => {
        try { const r = await post('/api/auth/forgot', { email: mem.email }); showErr(f, 'Yeni kod gönderildi.' + (r.devCode ? ` (Geliştirme: <b>${esc(r.devCode)}</b>)` : ''), 'ok'); stop(); stop = resendTimer(f.querySelector('[data-resend]')); }
        catch (err) { showErr(f, esc(err.message)); }
      };
      f.onsubmit = async e => {
        e.preventDefault();
        if (ci.value().length !== 6) { ci.shake(); return showErr(f, '6 haneli kodu gir.'); }
        const btn = f.querySelector('[type=submit]'); busy(btn, true);
        try { const r = await post('/api/auth/reset', { email: mem.email, code: ci.value(), password: f.pw.value }); toast('Şifren güncellendi 🔐'); await onAuthed(r.user); }
        catch (err) { showErr(f, esc(err.message)); busy(btn, false); if (/kod/i.test(err.message)) { ci.shake(); ci.clear(); } }
      };
    }
  };
  draw();
  return () => stop();
}

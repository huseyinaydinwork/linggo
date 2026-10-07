// Linggo — uygulama kabuğu: açılış, oturum, içerik yükleme, yönlendirici, sekme çubuğu, tema
import { state, profile, subscribe, dueIds, patternDue, initStore, clearStore, flush, track, save } from './store.js';
import { api, post } from './api.js';
import { APP, loadContent, featOn } from './content.js';
import { setServerAllowed } from './speech.js';
import { loadMarket } from './market.js';
import { installSquish, installTilt, installLiveMotion } from './motion.js';
import { placementView } from './views/placement.js';
import { marketView } from './views/market.js';
import { checkoutView } from './views/checkout.js';
import { icon, $, toast, esc } from './ui.js';
import { pip } from './mascot.js';
import { homeView } from './views/home.js';
import { wordsView, listView } from './views/words.js';
import { patternsView, patternView } from './views/patterns.js';
import { soundsView, lessonView } from './views/sounds.js';
import { profileView, scienceView } from './views/profile.js';
import { onboardingView } from './views/onboarding.js';
import { sessionView } from './views/session.js';
import { introView } from './views/intro.js';
import { landingView } from './views/landing.js';
import { loginView, registerView, verifyView, forgotView } from './views/auth.js';

const TABS = [
  { path: '/home', label: 'Bugün', ic: icon.home, re: /^\/(home|market|checkout)/ },
  { path: '/words', label: 'Kelimeler', ic: icon.words, re: /^\/(words|list)/ },
  { path: '/patterns', label: 'Kalıplar', ic: icon.quote, re: /^\/pattern/ },
  { path: '/sounds', label: 'Telaffuz', ic: icon.wave, re: /^\/sounds/ },
  { path: '/profile', label: 'Profil', avatar: true, re: /^\/(profile|progress|science)/ },
];

// [regex, view factory, mode]  mode: 'public' (logged-out), 'full' (no tab bar), '' (app)
const ROUTES = [
  [/^\/$/, () => landingView, 'public'],
  [/^\/login$/, () => loginView, 'public'],
  [/^\/register$/, () => registerView, 'public'],
  [/^\/verify$/, () => verifyView, 'public'],
  [/^\/forgot$/, () => forgotView, 'public'],
  [/^\/intro$/, () => introView, 'full'],
  [/^\/welcome$/, () => onboardingView, 'full'],
  [/^\/home$/, () => homeView],
  [/^\/words(?:\/(level|learned|freq|life))?$/, m => el => wordsView(el, { tab: m[1] })],
  [/^\/placement(?:\/(onboarding))?$/, m => el => placementView(el, { from: m[1] }), 'full'],
  [/^\/market$/, () => marketView],
  [/^\/checkout\/(plan|item)\/([\w-]+)$/, m => el => checkoutView(el, { kind: m[1], ref: m[2] })],
  [/^\/list\/(freq|life)\/([\w-]+)$/, m => el => listView(el, { list: m[1], id: m[2] })],
  [/^\/patterns$/, () => patternsView],
  [/^\/pattern\/([\w-]+)$/, m => el => patternView(el, { id: m[1] })],
  [/^\/sounds(?:\/(\w+))?$/, m => el => soundsView(el, { tab: m[1] })],
  [/^\/lesson\/([\w-]+)$/, m => el => lessonView(el, { id: m[1] }), 'full'],
  [/^\/progress$/, () => el => profileView(el, { section: 'progress' })],
  [/^\/profile(?:\/(settings))?$/, m => el => profileView(el, { section: m[1] })],
  [/^\/science$/, () => scienceView],
  [/^\/session\/(\w+)(?:\/([^/]+))?$/, m => el => sessionView(el, { kind: m[1], arg: m[2] && decodeURIComponent(m[2]) }), 'full'],
];

const view = $('#view'), tabbar = $('#tabbar');
let cleanup = null, current = null, booted = false;

export function navigate(path, force = false) {
  const target = '#' + path;
  if (location.hash === target) { if (force) render(); return; }
  location.hash = target;
}

function applyTheme() {
  const t0 = state().settings.theme, mode = document.documentElement.dataset.appMode;
  // a market theme only defines colours for its own mode, so it decides light/dark
  const t = mode || t0;
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = t;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0D0D0E' : '#F4F0E8');
}

function renderTabs(path) {
  const due = dueIds().length + patternDue().length;
  tabbar.innerHTML = TABS.map(t => {
    const on = t.re.test(path);
    const ic = t.avatar ? `<i class="tab-av" aria-hidden="true">${esc((profile()?.name || APP.user?.name || '?').trim().charAt(0).toLocaleUpperCase('tr-TR'))}</i>` : t.ic;
    return `<a class="tab ${on ? 'on' : ''}" href="#${t.path}" aria-current="${on ? 'page' : 'false'}">${ic}<span>${t.label}</span>${t.path === '/home' && due > 0 && !on ? '<i class="dot"></i>' : ''}</a>`;
  }).join('');
}

// Where should a logged-in user be right now?
function gate(path) {
  if (!APP.user) return ROUTES.some(([re, , m]) => m === 'public' && re.test(path)) ? null : '/';
  if (['/', '/login', '/register', '/verify', '/forgot'].includes(path)) return state().introDone ? (profile() ? '/home' : '/welcome') : '/intro';
  if (!state().introDone && path !== '/intro') return '/intro';
  if (state().introDone && !profile() && !['/welcome', '/intro', '/placement/onboarding'].includes(path)) return '/welcome';
  return null;
}

function render() {
  if (!booted) return;
  const path = location.hash.replace(/^#/, '') || '/';
  const redirect = gate(path);
  if (redirect && redirect !== path) { navigate(redirect); return; }
  let match = null, mode = '';
  for (const [re, fn, m] of ROUTES) { const r = path.match(re); if (r) { match = fn(r); mode = m || ''; break; } }
  if (!match) { navigate(APP.user ? '/home' : '/'); return; }

  try { cleanup?.(); } catch { }
  cleanup = null;
  // a sheet belongs to the page that opened it
  document.querySelectorAll('#sheet-root > .sheet-wrap').forEach(n => n.remove());
  const doSwap = () => {
    document.body.classList.toggle('wide', mode === 'public');
    view.className = 'view' + (mode ? ' full' : '');
    view.innerHTML = '';
    cleanup = match(view) || null;
    [...view.children].forEach((c, i) => c.style.setProperty('--i', i));
    view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter');
    tabbar.classList.toggle('hide', !!mode);
    if (!mode) renderTabs(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  if (document.startViewTransition && current !== null && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const vt = document.startViewTransition(doSwap);
    [vt.ready, vt.finished, vt.updateCallbackDone].forEach(p => p?.catch(() => { }));
  } else doSwap();
  current = path;
}

function splash(msg = '') {
  tabbar.classList.add('hide');
  view.className = 'view full';
  const word = [...'Linggo'].map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join('');
  view.innerHTML = `<div class="splash"><div class="splash-drop">${pip({ size: 120, mood: 'happy', pose: 'wave' })}</div><i class="splash-shadow"></i><b class="h3 splash-word" aria-label="Linggo">${word}</b>${msg ? `<p class="muted small splash-msg">${msg}</p>` : ''}<div class="splash-dots" aria-hidden="true"><i></i><i></i><i></i></div></div>`;
}

// ---------- session lifecycle
async function boot() {
  splash();
  try {
    const me = await api('/api/me');
    APP.user = me.user;
    initStore(me.user, me.progress, me.progressAt);
    APP.userLevel = profile()?.level;
    await loadContent();
    loadMarket();
    track('app_open', { plan: APP.plan });
  } catch (e) {
    APP.user = null; clearStore();
    if (e.status !== 401) {
      // offline with no session info: show a retry screen
      if (e.status === 0) { view.innerHTML = `<div class="splash">${pip({ size: 120, mood: 'sad' })}<b class="h3">Bağlantı yok</b><p class="muted small">İnternetini kontrol edip tekrar dene.</p><button class="btn btn-primary mt" data-retry>Tekrar dene</button></div>`; view.querySelector('[data-retry]').onclick = () => location.reload(); return; }
    }
  }
  booted = true;
  applyTheme();
  render();
}

// Called by auth views after login / verification
export async function onAuthed(user, fresh = false) {
  APP.user = user;
  booted = false;
  splash(fresh ? 'Hesabın hazırlanıyor…' : 'Hoş geldin!');
  const me = await api('/api/me');
  APP.user = me.user;
  initStore(me.user, me.progress, me.progressAt);
  APP.userLevel = profile()?.level;
  await loadContent();
  loadMarket();
  track('app_open', { plan: APP.plan, login: true });
  booted = true;
  applyTheme();
  current = null;
  navigate(state().introDone ? (profile() ? '/home' : '/welcome') : '/intro', true);
}

export async function logout() {
  flush();
  try { await post('/api/auth/logout'); } catch { }
  APP.user = null; clearStore();
  toast('Çıkış yapıldı. Görüşmek üzere 👋');
  navigate('/', true);
}

// Refresh plan/content (e.g. after admin grants Premium) without reloading
export async function refreshAccount() {
  try {
    const me = await api('/api/me');
    const changed = me.user.plan !== APP.plan;
    APP.user = me.user;
    await loadContent();
    loadMarket();
    return changed;
  } catch { return false; }
}

window.addEventListener('hashchange', render);
window.addEventListener('pl:wardrobe', applyTheme);
setServerAllowed(() => featOn('hqVoice'));
installSquish(); installTilt(); installLiveMotion();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
subscribe(applyTheme);
document.addEventListener('visibilitychange', async () => {
  if (document.hidden || !APP.user) return;
  if (current && !current.startsWith('/session') && current !== '/intro' && current !== '/welcome') {
    if (await refreshAccount()) { toast('Planın güncellendi ✨'); render(); } else renderTabs(current);
  }
});
boot();

if ('serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}
void save;

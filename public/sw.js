// Linggo service worker: app shell offline-first, fonts cached at runtime
const VERSION = 'pratilange-v17';
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./css/styles.css",
  "./js/api.js",
  "./js/audio.js",
  "./js/banners.js",
  "./js/announce.js",
  "./js/rewards.js",
  "./js/app.js",
  "./js/content.js",
  "./js/ipa.js",
  "./js/market.js",
  "./js/mascot.js",
  "./js/motion.js",
  "./js/plan.js",
  "./js/premium.js",
  "./js/speech.js",
  "./js/store.js",
  "./js/tours.js",
  "./js/ui.js",
  "./js/wear.js",
  "./js/data/patterns.js",
  "./js/data/phonetics.js",
  "./js/data/words.js",
  "./js/views/auth.js",
  "./js/views/checkout.js",
  "./js/views/home.js",
  "./js/views/intro.js",
  "./js/views/landing.js",
  "./js/views/market.js",
  "./js/views/onboarding.js",
  "./js/views/patterns.js",
  "./js/views/placement.js",
  "./js/views/profile.js",
  "./js/views/progress.js",
  "./js/views/session.js",
  "./js/views/sounds.js",
  "./js/views/words.js"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Network-first for our own files (fresh updates), falling back to cache offline
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) return;
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  // Cache-first for Google Fonts
  if (url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
    })));
  }
});

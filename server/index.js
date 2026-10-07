// Linggo sunucusu: API + statik dosyalar
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { config } from './config.js';
import { housekeeping } from './db.js';
import { seedIfEmpty } from './content.js';
import { HttpError, send, cookies } from './http.js';
import { sessionUser, COOKIE } from './auth.js';
import { mailEnabled, runAutomations, unsubToken } from './mail.js';
import { q } from './db.js';
import { activeProvider } from './tts.js';
import { routes } from './api.js';
import { adminRoutes } from './admin.js';

seedIfEmpty();
housekeeping();
setInterval(housekeeping, 6 * 3600e3).unref();
// e-posta otomasyonları (haftalık gündem, seni özledik, premium bitiyor) — 10 dakikada bir kontrol
setInterval(() => runAutomations().catch(e => console.error('Automations:', e.message)), 10 * 60e3).unref();
setTimeout(() => runAutomations().catch(() => { }), 20e3).unref();

const ALL = [...routes, ...adminRoutes];
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};
const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(self)',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; media-src 'self' blob: data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

async function handleApi(req, res, pathname) {
  // CSRF guard: state-changing requests must carry our custom header (cannot be sent cross-site without CORS)
  if (req.method !== 'GET' && req.headers['x-pratilange'] !== '1') throw new HttpError(403, 'Geçersiz istek.');
  const token = cookies(req)[COOKIE];
  const user = token ? sessionUser(token) : null;
  for (const [method, re, fn, guard] of ALL) {
    if (method !== req.method) continue;
    const m = pathname.match(re); if (!m) continue;
    if (guard === 'user' && !user) throw new HttpError(401, 'Oturum süresi doldu. Lütfen tekrar giriş yap.');
    if (guard === 'admin' && user?.role !== 'admin') throw new HttpError(user ? 403 : 401, 'Yetkin yok.');
    return fn(req, res, { user, token }, m);
  }
  throw new HttpError(404, 'Bulunamadı.');
}

function serveStatic(req, res, pathname) {
  let rel = pathname === '/' ? '/index.html' : pathname === '/admin' || pathname === '/admin/' ? '/admin.html' : pathname;
  let file = path.normalize(path.join(config.publicDir, rel));
  if (!file.startsWith(config.publicDir + path.sep)) { res.writeHead(403); return res.end(); }
  if (path.basename(file).startsWith('.')) { res.writeHead(404); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      // unknown non-asset paths fall back to the app shell
      if (!path.extname(pathname)) { file = path.join(config.publicDir, 'index.html'); st = fs.statSync(file); }
      else { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    }
    const etag = `"${st.size.toString(36)}-${st.mtimeMs.toString(36)}"`;
    const headers = { ...SECURITY, 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', ETag: etag, 'Cache-Control': file.endsWith('sw.js') ? 'no-cache, no-store' : 'no-cache' };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

function unsubscribe(req, res) {
  const u = new URL(req.url, 'http://x');
  const id = Number(u.searchParams.get('u')), t = u.searchParams.get('t') || '';
  const ok = id && t.length === 32 && t === unsubToken(id);
  if (ok) q.run('UPDATE users SET marketing = 0 WHERE id = ?', id);
  res.writeHead(ok ? 200 : 400, { ...SECURITY, 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Linggo</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#F4F0E8;font-family:system-ui,sans-serif;color:#141414"><div style="max-width:420px;padding:32px;background:#FFFDF8;border-radius:28px;text-align:center"><div style="font-size:48px">${ok ? '🌱' : '🤔'}</div><h1 style="font-size:24px">${ok ? 'Aboneliğin iptal edildi' : 'Bağlantı geçersiz'}</h1><p style="color:#55514A">${ok ? 'Artık gündem ve kampanya e-postaları almayacaksın. Hesap ve güvenlik e-postaları gelmeye devam eder. İstersen uygulamadaki Ayarlar bölümünden tekrar açabilirsin.' : 'Bu bağlantı geçersiz ya da süresi dolmuş.'}</p><a href="/" style="display:inline-block;margin-top:12px;background:#141414;color:#F4F0E8;padding:12px 20px;border-radius:14px;text-decoration:none;font-weight:700">Linggo'ya dön</a></div></body></html>`);
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  try {
    if (pathname.startsWith('/api/')) return await handleApi(req, res, pathname);
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    if (pathname === '/healthz') return send(res, 200, { ok: true });
    if (pathname === '/u/unsub') return unsubscribe(req, res);
    serveStatic(req, res, decodeURIComponent(pathname));
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message, ...(e.extra || {}) });
    console.error(e);
    if (!res.headersSent) send(res, 500, { error: 'Sunucu hatası. Lütfen tekrar dene.' });
  }
});

server.listen(config.port, config.host, () => {
  console.log(`\n  🌱 Linggo hazır → ${config.appUrl}`);
  console.log(`     Yönetim paneli  → ${config.appUrl}/admin`);
  if (!config.isProd) for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) console.log(`     Telefon (aynı ağ) → http://${a.address}:${config.port}`);
  console.log(`     E-posta: ${mailEnabled() ? 'SMTP aktif' : 'SMTP yok → kodlar konsola yazılır (geliştirme modu)'}`);
  console.log(`     Ses: ${activeProvider() ? activeProvider() + ' (yüksek kalite)' : 'sunucu TTS yok → tarayıcı sesleri kullanılır'}`);
  if (!config.adminEmails.length) console.log('     ⚠ ADMIN_EMAILS tanımlı değil. Yönetici atamak için: npm run make-admin -- eposta@ornek.com');
  console.log('');
});

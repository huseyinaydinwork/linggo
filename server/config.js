// Ortam değişkenleri (.env dosyası da okunur)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Minimal .env loader (no dependency)
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

const env = process.env;
const isProd = env.NODE_ENV === 'production';

export const config = {
  isProd,
  port: Number(env.PORT) || 5173,
  host: env.HOST || '0.0.0.0',
  appUrl: (env.APP_URL || `http://localhost:${Number(env.PORT) || 5173}`).replace(/\/$/, ''),
  dbPath: path.resolve(ROOT, env.DB_PATH || 'data/pratilange.db'),
  publicDir: path.join(ROOT, 'public'),
  // Secret used to hash verification codes; set a long random value in production
  secret: env.APP_SECRET || (isProd ? '' : 'dev-secret-change-me'),
  cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE === '1' : isProd,
  trustProxy: env.TRUST_PROXY === '1',
  adminEmails: (env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
  smtp: {
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT) || 587,
    secure: env.SMTP_SECURE === '1' || Number(env.SMTP_PORT) === 465,
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.MAIL_FROM || 'Linggo <no-reply@pratilange.com>',
  },
  // In development without SMTP, the API returns the code so the flow can be tested
  // EXPOSE_DEV_CODES=1 also works in production — temporary, for a test launch before SMTP is set up
  exposeDevCodes: env.EXPOSE_DEV_CODES === '1' || (!isProd && env.EXPOSE_DEV_CODES !== '0'),
};

if (isProd && config.exposeDevCodes) console.warn('\n  ⚠ EXPOSE_DEV_CODES açık: doğrulama kodları ekranda gösteriliyor. SMTP ayarlanınca kapat.\n');
if (isProd && !config.secret) {
  console.error('\n  ✖ APP_SECRET ortam değişkeni production için zorunludur.\n');
  process.exit(1);
}

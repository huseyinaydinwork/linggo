// Kimlik doğrulama: scrypt şifreleme, çerez oturumları, e-posta kodları, istek sınırlama
import crypto from 'node:crypto';
import { q } from './db.js';
import { config } from './config.js';

const SESSION_DAYS = 60;
const CODE_TTL = 15 * 60e3;
const CODE_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN = 55e3;
export const COOKIE = 'pl_sid';

// ---------- passwords (scrypt, per-user salt)
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `s1$${salt.toString('base64')}$${hash.toString('base64')}`;
}
export function checkPassword(pw, stored) {
  try {
    const [, s, h] = stored.split('$');
    const hash = crypto.scryptSync(pw, Buffer.from(s, 'base64'), 64, { N: 16384, r: 8, p: 1 });
    const ref = Buffer.from(h, 'base64');
    return ref.length === hash.length && crypto.timingSafeEqual(ref, hash);
  } catch { return false; }
}
export function passwordProblem(pw) {
  if (typeof pw !== 'string' || pw.length < 8) return 'Şifre en az 8 karakter olmalı.';
  if (pw.length > 200) return 'Şifre çok uzun.';
  if (!/[a-zA-ZğüşöçıİĞÜŞÖÇ]/.test(pw) || !/\d/.test(pw)) return 'Şifre en az bir harf ve bir rakam içermeli.';
  return null;
}
export const normEmail = e => String(e || '').trim().toLowerCase();
export const validEmail = e => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e);

// ---------- sessions
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
export function createSession(userId, ua = '') {
  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  q.run('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, ua) VALUES (?,?,?,?,?)', sha(token), userId, now, now + SESSION_DAYS * 864e5, String(ua).slice(0, 200));
  return token;
}
export function sessionUser(token) {
  if (!token) return null;
  const row = q.get(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`, sha(token), Date.now());
  return row || null;
}
export function destroySession(token) { if (token) q.run('DELETE FROM sessions WHERE token_hash = ?', sha(token)); }
export function destroyUserSessions(userId, exceptToken) {
  if (exceptToken) q.run('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?', userId, sha(exceptToken));
  else q.run('DELETE FROM sessions WHERE user_id = ?', userId);
}
export function sessionCookie(token, clear = false) {
  const parts = [`${COOKIE}=${clear ? '' : token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${clear ? 0 : SESSION_DAYS * 86400}`];
  if (config.cookieSecure) parts.push('Secure');
  return parts.join('; ');
}

// ---------- one-time codes (hashed, expiring, attempt-limited)
const codeHash = (userId, purpose, code) => crypto.createHmac('sha256', config.secret).update(`${userId}:${purpose}:${code}`).digest('hex');

export function issueCode(userId, purpose) {
  const last = q.get('SELECT created_at FROM codes WHERE user_id = ? AND purpose = ? ORDER BY id DESC LIMIT 1', userId, purpose);
  if (last && Date.now() - last.created_at < RESEND_COOLDOWN) {
    return { error: 'Yeni kod için lütfen biraz bekle.', wait: Math.ceil((RESEND_COOLDOWN - (Date.now() - last.created_at)) / 1000) };
  }
  const hourCount = q.get('SELECT COUNT(*) n FROM codes WHERE user_id = ? AND created_at > ?', userId, Date.now() - 3600e3).n;
  if (hourCount >= 8) return { error: 'Çok fazla kod istendi. Lütfen bir saat sonra tekrar dene.' };
  const code = String(crypto.randomInt(0, 1e6)).padStart(6, '0');
  q.run('DELETE FROM codes WHERE user_id = ? AND purpose = ?', userId, purpose);
  q.run('INSERT INTO codes (user_id, purpose, code_hash, expires_at, created_at) VALUES (?,?,?,?,?)', userId, purpose, codeHash(userId, purpose, code), Date.now() + CODE_TTL, Date.now());
  return { code };
}

export function consumeCode(userId, purpose, code) {
  const row = q.get('SELECT * FROM codes WHERE user_id = ? AND purpose = ? ORDER BY id DESC LIMIT 1', userId, purpose);
  if (!row) return 'Geçerli bir kod yok. Yeni kod iste.';
  if (row.expires_at < Date.now()) return 'Kodun süresi doldu. Yeni kod iste.';
  if (row.attempts >= CODE_MAX_ATTEMPTS) return 'Çok fazla hatalı deneme. Yeni kod iste.';
  const given = String(code || '').replace(/\D/g, '');
  const ok = given.length === 6 && crypto.timingSafeEqual(Buffer.from(codeHash(userId, purpose, given)), Buffer.from(row.code_hash));
  if (!ok) {
    q.run('UPDATE codes SET attempts = attempts + 1 WHERE id = ?', row.id);
    const left = CODE_MAX_ATTEMPTS - row.attempts - 1;
    return left > 0 ? `Kod hatalı. ${left} deneme hakkın kaldı.` : 'Çok fazla hatalı deneme. Yeni kod iste.';
  }
  q.run('DELETE FROM codes WHERE user_id = ? AND purpose = ?', userId, purpose);
  return null;
}

// ---------- in-memory rate limiter (per key, sliding window)
const buckets = new Map();
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter(t => now - t < windowMs);
  if (arr.length >= max) { buckets.set(key, arr); return false; }
  arr.push(now); buckets.set(key, arr);
  return true;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of buckets) if (!v.some(t => now - t < 3600e3)) buckets.delete(k); }, 600e3).unref();

// ---------- plan helpers
export function effectivePlan(u) {
  if (!u) return 'free';
  if (u.role === 'admin') return 'premium';
  if (u.plan === 'premium' && (!u.plan_until || u.plan_until > Date.now())) return 'premium';
  return 'free';
}
export function publicUser(u) {
  return {
    id: u.id, email: u.email, name: u.name, verified: !!u.verified, role: u.role,
    plan: effectivePlan(u), planUntil: u.plan === 'premium' ? u.plan_until : null, createdAt: u.created_at, marketing: !!u.marketing,
  };
}

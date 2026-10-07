// Kullanıcı API'si: kayıt / doğrulama / giriş / şifre sıfırlama / hesap / ilerleme / olaylar / içerik
import { q, tx } from './db.js';
import { config } from './config.js';
import { fail, readJson, send, clientIp } from './http.js';
import {
  hashPassword, checkPassword, passwordProblem, normEmail, validEmail, createSession, destroySession, destroyUserSessions,
  sessionCookie, issueCode, consumeCode, rateLimit, publicUser, effectivePlan,
} from './auth.js';
import fs from 'node:fs';
import { sendMail, sendTemplate, unsubToken } from './mail.js';
import { clientContent, contentVersion, settings, getContent, featuresFor, levelById, levelsList, UNIT_SIZE } from './content.js';
import { synth, activeProvider, LANGS } from './tts.js';
import { summarize } from './stats.js';
import { claim, rewardsState } from './rewards.js';

const DUMMY_HASH = hashPassword('dummy-password-1');
const limit = (key, max, win, msg = 'Çok fazla deneme. Lütfen biraz sonra tekrar dene.') => { if (!rateLimit(key, max, win)) fail(429, msg); };
const findUser = email => q.get('SELECT * FROM users WHERE email = ?', normEmail(email));
const dev = code => (config.exposeDevCodes ? { devCode: code } : {});

function login(res, req, user) {
  // auto-admin needs a real mailbox check: while codes are shown on screen anyone could "verify" an unregistered admin address
  const codesOnScreen = config.isProd && config.exposeDevCodes;
  if (!codesOnScreen && config.adminEmails.includes(user.email.toLowerCase()) && user.role !== 'admin') {
    q.run("UPDATE users SET role = 'admin' WHERE id = ?", user.id); user.role = 'admin';
  }
  const token = createSession(user.id, req.headers['user-agent']);
  q.run('UPDATE users SET last_seen = ? WHERE id = ?', Date.now(), user.id);
  res.setHeader('Set-Cookie', sessionCookie(token));
  return publicUser(user);
}
function logEvent(userId, type, data) {
  q.run('INSERT INTO events (user_id, type, data, ts) VALUES (?,?,?,?)', userId, type, data ? JSON.stringify(data) : null, Date.now());
}

async function sendCode(user, purpose) {
  const r = issueCode(user.id, purpose);
  if (r.error) return r;
  try { await sendMail(user.email, purpose, user.name, r.code); }
  catch (e) { console.error('Mail error:', e.message); fail(502, 'E-posta gönderilemedi. Lütfen biraz sonra tekrar dene.'); }
  // in production only sign-up codes may be shown on screen (temporary no-SMTP launch); a reset code on screen would let anyone take over any account
  return { sent: true, ...(purpose === 'verify' || !config.isProd ? dev(r.code) : {}) };
}

export const routes = [
  ['POST', /^\/api\/auth\/register$/, async (req, res) => {
    limit('reg:' + clientIp(req), 15, 3600e3);
    const b = await readJson(req);
    const email = normEmail(b.email), name = String(b.name || '').trim().slice(0, 40);
    if (!validEmail(email)) fail(400, 'Geçerli bir e-posta adresi gir.');
    if (!name) fail(400, 'Adını yaz.');
    const pp = passwordProblem(b.password); if (pp) fail(400, pp);
    let user = findUser(email);
    if (user?.verified) fail(409, 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.');
    const marketing = b.marketing ? 1 : 0;
    if (user) q.run('UPDATE users SET name = ?, pass_hash = ?, marketing = ? WHERE id = ?', name, hashPassword(b.password), marketing, user.id);
    else {
      const role = config.adminEmails.includes(email) ? 'admin' : 'user';
      const r = q.run('INSERT INTO users (email, name, pass_hash, role, created_at, marketing, coins_earned) VALUES (?,?,?,?,?,?,?)', email, name, hashPassword(b.password), role, Date.now(), marketing, getContent('market')?.welcomeCoins ?? 50);
      logEvent(Number(r.lastInsertRowid), 'register', null);
    }
    user = findUser(email);
    const c = await sendCode(user, 'verify');
    send(res, 200, { ok: true, needVerify: true, email, ...(c.error ? { notice: c.error } : {}), ...(c.devCode ? { devCode: c.devCode } : {}) });
  }],

  ['POST', /^\/api\/auth\/verify$/, async (req, res) => {
    limit('ver:' + clientIp(req), 30, 900e3);
    const b = await readJson(req);
    const user = findUser(b.email);
    if (!user) fail(400, 'Kod hatalı veya süresi dolmuş.');
    const err = consumeCode(user.id, 'verify', b.code); if (err) fail(400, err);
    q.run('UPDATE users SET verified = 1 WHERE id = ?', user.id); user.verified = 1;
    logEvent(user.id, 'verified', null);
    sendTemplate(user, 'welcome').catch(e => console.error('Mail error:', e.message));
    send(res, 200, { ok: true, user: login(res, req, user) });
  }],

  ['POST', /^\/api\/auth\/resend$/, async (req, res) => {
    limit('res:' + clientIp(req), 12, 3600e3);
    const b = await readJson(req);
    const purpose = b.purpose === 'reset' ? 'reset' : 'verify';
    const user = findUser(b.email);
    if (!user || (purpose === 'verify' && user.verified)) return send(res, 200, { ok: true });
    const c = await sendCode(user, purpose);
    if (c.error) fail(429, c.error, { wait: c.wait });
    send(res, 200, { ok: true, ...(c.devCode ? { devCode: c.devCode } : {}) });
  }],

  ['POST', /^\/api\/auth\/login$/, async (req, res) => {
    const b = await readJson(req);
    const email = normEmail(b.email);
    limit('login:' + clientIp(req), 30, 900e3);
    limit('login:' + email, 10, 900e3, 'Bu hesap için çok fazla deneme yapıldı. 15 dakika sonra tekrar dene.');
    const user = findUser(email);
    const ok = checkPassword(String(b.password || ''), user?.pass_hash || DUMMY_HASH);
    if (!user || !ok) fail(401, 'E-posta veya şifre hatalı.');
    if (!user.verified) {
      const c = await sendCode(user, 'verify');
      return send(res, 200, { ok: true, needVerify: true, email, ...(c.devCode ? { devCode: c.devCode } : {}), ...(c.error ? { notice: 'Sana daha önce bir kod gönderdik; e-postanı kontrol et.' } : {}) });
    }
    logEvent(user.id, 'login', null);
    send(res, 200, { ok: true, user: login(res, req, user) });
  }],

  ['POST', /^\/api\/auth\/forgot$/, async (req, res) => {
    limit('forgot:' + clientIp(req), 10, 3600e3);
    const b = await readJson(req);
    const user = findUser(b.email);
    let extra = {};
    if (user) { const c = await sendCode(user, 'reset'); if (c.error) fail(429, c.error, { wait: c.wait }); extra = c.devCode ? { devCode: c.devCode } : {}; }
    // same answer whether or not the account exists (no account enumeration)
    send(res, 200, { ok: true, ...extra });
  }],

  ['POST', /^\/api\/auth\/reset$/, async (req, res) => {
    limit('reset:' + clientIp(req), 20, 900e3);
    const b = await readJson(req);
    const user = findUser(b.email);
    if (!user) fail(400, 'Kod hatalı veya süresi dolmuş.');
    const pp = passwordProblem(b.password); if (pp) fail(400, pp);
    const err = consumeCode(user.id, 'reset', b.code); if (err) fail(400, err);
    q.run('UPDATE users SET pass_hash = ?, verified = 1 WHERE id = ?', hashPassword(b.password), user.id);
    destroyUserSessions(user.id);
    logEvent(user.id, 'password_reset', null);
    user.verified = 1;
    send(res, 200, { ok: true, user: login(res, req, user) });
  }],

  ['POST', /^\/api\/auth\/logout$/, async (req, res, ctx) => {
    destroySession(ctx.token);
    send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', true) });
  }],

  ['GET', /^\/api\/me$/, async (req, res, ctx) => {
    const u = ctx.user; if (!u) fail(401, 'Oturum yok.');
    if (!u.last_seen || Date.now() - u.last_seen > 300e3) q.run('UPDATE users SET last_seen = ? WHERE id = ?', Date.now(), u.id);
    send(res, 200, { user: publicUser(u), progress: u.progress ? JSON.parse(u.progress) : null, progressAt: u.progress_at, contentVersion: contentVersion() });
  }, 'user'],

  ['PUT', /^\/api\/progress$/, async (req, res, ctx) => {
    const b = await readJson(req, 4e6);
    const at = Number(b.at) || Date.now();
    if (!b.progress || typeof b.progress !== 'object') fail(400, 'İlerleme verisi yok.');
    const cur = q.get('SELECT progress_at FROM users WHERE id = ?', ctx.user.id);
    if (cur.progress_at > at + 1000) {
      const u = q.get('SELECT progress, progress_at FROM users WHERE id = ?', ctx.user.id);
      return send(res, 409, { stale: true, progress: JSON.parse(u.progress), at: u.progress_at });
    }
    const stats = summarize(b.progress);
    // yaprak (coin) kazanımı: yeni XP × plan bonusu
    const cur2 = q.get('SELECT xp_seen, coins_earned FROM users WHERE id = ?', ctx.user.id);
    const gained = Math.max(0, (stats?.xp || 0) - cur2.xp_seen);
    const bonus = featuresFor(effectivePlan(ctx.user)).coinBonus / 100;
    q.run('UPDATE users SET xp_seen = ?, coins_earned = coins_earned + ?, level = ? WHERE id = ?', Math.max(cur2.xp_seen, stats?.xp || 0), gained / 10 * bonus, levelById(b.progress.profile?.level).id, ctx.user.id);
    const name = String(b.progress.profile?.name || '').trim().slice(0, 40);
    q.run('UPDATE users SET progress = ?, progress_at = ?, stats = ?, last_seen = ?, name = CASE WHEN ? != \'\' THEN ? ELSE name END WHERE id = ?',
      JSON.stringify(b.progress), at, JSON.stringify(stats), Date.now(), name, name, ctx.user.id);
    send(res, 200, { ok: true, at });
  }, 'user'],

  ['POST', /^\/api\/events$/, async (req, res, ctx) => {
    const b = await readJson(req, 5e5);
    const list = Array.isArray(b.events) ? b.events.slice(0, 100) : [];
    const ALLOWED = new Set(['session_start', 'session_end', 'session_abandon', 'module_view', 'tour_done', 'tour_skip', 'paywall_view', 'intro_done', 'onboarding_done', 'lesson_done', 'app_open', 'placement_done', 'market_view', 'checkout_view', 'ipa_view']);
    tx(() => {
      for (const e of list) {
        if (!ALLOWED.has(e.type)) continue;
        const data = e.data && typeof e.data === 'object' ? e.data : null;
        let stored = data;
        if (e.type === 'session_end' && Array.isArray(data?.answers)) {
          // aggregate per-item correctness for "hardest content" insights
          for (const a of data.answers.slice(0, 300)) {
            if (!Array.isArray(a) || typeof a[0] !== 'string') continue;
            const item = a[0].slice(0, 80), okv = a[1] ? 1 : 0, kind = item.split(':')[0];
            q.run('INSERT INTO item_stats (item, kind, ok, wrong) VALUES (?,?,?,?) ON CONFLICT(item) DO UPDATE SET ok = ok + excluded.ok, wrong = wrong + excluded.wrong', item, kind, okv, 1 - okv);
          }
          stored = { ...data, answers: undefined };
        }
        const ts = Math.min(Date.now(), Number(e.ts) || Date.now());
        q.run('INSERT INTO events (user_id, type, data, ts) VALUES (?,?,?,?)', ctx.user.id, e.type, stored ? JSON.stringify(stored).slice(0, 2000) : null, ts);
      }
    });
    send(res, 200, { ok: true });
  }, 'user'],

  ['GET', /^\/api\/public$/, async (req, res) => {
    const s = settings();
    const c = JSON.parse(clientContent('premium', 'a1'));
    const pl = getContent('plans');
    send(res, 200, { free: featuresFor('free'), premium: featuresFor('premium'), plans: pl.plans, levels: c.levels, perks: s.perks, priceNote: s.priceNote, totals: c.totals, sounds: c.sounds.length, pairs: c.pairs.length, lessons: c.lessons.length, themes: c.themes.length },
      { 'Cache-Control': 'public, max-age=300' });
  }],

  ['GET', /^\/api\/content$/, async (req, res, ctx) => {
    const plan = effectivePlan(ctx.user);
    const lv = levelById(new URL(req.url, 'http://x').searchParams.get('level') || ctx.user.level).id;
    const etag = `"c${contentVersion()}-${plan}-${lv}"`;
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, { ETag: etag }); return res.end(); }
    send(res, 200, clientContent(plan, lv), { ETag: etag, 'Cache-Control': 'private, no-cache' });
  }, 'user'],

  ['POST', /^\/api\/premium\/request$/, async (req, res, ctx) => {
    const b = await readJson(req).catch(() => ({}));
    logEvent(ctx.user.id, 'premium_request', { from: String(b.from || '').slice(0, 40) });
    const s = settings();
    const text = (s.whatsappText || '').replace('{email}', ctx.user.email).replace('{name}', ctx.user.name);
    send(res, 200, { ok: true, url: `https://wa.me/${s.whatsapp}?text=${encodeURIComponent(text)}` });
  }, 'user'],

  ['POST', /^\/api\/account\/password$/, async (req, res, ctx) => {
    limit('pw:' + ctx.user.id, 8, 900e3);
    const b = await readJson(req);
    if (!checkPassword(String(b.current || ''), ctx.user.pass_hash)) fail(400, 'Mevcut şifre hatalı.');
    const pp = passwordProblem(b.next); if (pp) fail(400, pp);
    q.run('UPDATE users SET pass_hash = ? WHERE id = ?', hashPassword(b.next), ctx.user.id);
    destroyUserSessions(ctx.user.id, ctx.token);
    send(res, 200, { ok: true });
  }, 'user'],

  ['POST', /^\/api\/account\/delete$/, async (req, res, ctx) => {
    const b = await readJson(req);
    if (!checkPassword(String(b.password || ''), ctx.user.pass_hash)) fail(400, 'Şifre hatalı.');
    q.run('DELETE FROM users WHERE id = ?', ctx.user.id);
    send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', true) });
  }, 'user'],

  // ---------- seviye testi: her seviyeden kelime + kalıp soruları (sunucu tam içeriği bilir)
  ['GET', /^\/api\/placement$/, async (req, res, ctx) => {
    const L = getContent('levels'), freq = getContent('freq'), PT = getContent('patterns');
    const pick = (a, n) => [...a].sort(() => Math.random() - 0.5).slice(0, n);
    const qs = [];
    for (const lvl of L.levels) {
      const pool = lvl.units.flatMap(n => freq.slice((n - 1) * UNIT_SIZE, n * UNIT_SIZE)).filter(w => !/\s/.test(w.en));
      for (const w of pick(pool, L.placement.wordsPerLevel)) {
        const wrong = pick(freq.filter(x => x.tr !== w.tr && x.pos === w.pos), 3).map(x => x.tr);
        const options = pick([w.tr, ...wrong], 4);
        qs.push({ level: lvl.id, type: 'word', prompt: w.en, us: w.us, uk: w.uk, options, answer: options.indexOf(w.tr) });
      }
      for (const p of pick(PT.filter(x => lvl.patterns.includes(x.id)), L.placement.patternsPerLevel)) {
        const [en, tr] = p.ex[Math.floor(Math.random() * p.ex.length)];
        const i = en.toLowerCase().indexOf(p.key.toLowerCase());
        const others = pick(PT.filter(x => x.id !== p.id && x.key.toLowerCase() !== p.key.toLowerCase()), 3).map(x => x.key);
        const options = pick([p.key, ...others], 4);
        qs.push({ level: lvl.id, type: 'pattern', prompt: en.slice(0, i) + '____' + en.slice(i + p.key.length), tr, options, answer: options.indexOf(p.key) });
      }
    }
    send(res, 200, { pass: L.placement.pass, levels: L.levels.map(l => ({ id: l.id, cefr: l.cefr, title: l.title, emoji: l.emoji })), questions: qs });
  }, 'user'],

  // ---------- yüksek kaliteli ses (sunucu TTS + önbellek). 204 → istemci tarayıcı sesine döner
  ['GET', /^\/api\/tts$/, async (req, res, ctx) => {
    const u = new URL(req.url, 'http://x');
    const text = (u.searchParams.get('t') || '').trim().slice(0, 400), lang = u.searchParams.get('l') || 'en-US';
    if (!text || !LANGS.includes(lang)) fail(400, 'Geçersiz istek.');
    const isAdmin = ctx.user.role === 'admin';
    if (!isAdmin && !featuresFor(effectivePlan(ctx.user)).hqVoice) { res.writeHead(204); return res.end(); }
    if (!activeProvider()) { res.writeHead(204); return res.end(); }
    limit('tts:' + ctx.user.id, isAdmin ? 2000 : 600, 3600e3, 'Çok fazla ses isteği.');
    let out;
    try { out = await synth(text, lang); }
    catch (e) { console.error('TTS:', e.message); res.writeHead(204); return res.end(); }
    if (!out) { res.writeHead(204); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=31536000, immutable' });
    fs.createReadStream(out.file).pipe(res);
  }, 'user'],

  // ---------- Pip Market
  ['GET', /^\/api\/market$/, async (req, res, ctx) => send(res, 200, marketState(ctx.user)), 'user'],
  ['POST', /^\/api\/market\/buy$/, async (req, res, ctx) => {
    const b = await readJson(req);
    const it = getContent('market').items.find(i => i.id === b.id && i.enabled !== false);
    if (!it) fail(404, 'Öğe bulunamadı.');
    const st = marketState(ctx.user);
    if (st.owned.includes(it.id)) return send(res, 200, st);
    const pr = it.price || {};
    if (pr.type === 'premium') fail(402, 'Bu öğe Premium üyelere özel.', { need: 'premium' });
    if (pr.type === 'paid') fail(402, 'Bu öğe ücretli; ödeme sayfasına yönlendiriliyorsun.', { need: 'checkout' });
    if (pr.type === 'coins' && st.balance < pr.coins) fail(400, `Yeterli yaprağın yok (${st.balance}/${pr.coins}).`);
    q.run('INSERT INTO purchases (user_id, item_id, source, coins, ts) VALUES (?,?,?,?,?)', ctx.user.id, it.id, pr.type === 'coins' ? 'coins' : 'free', pr.type === 'coins' ? pr.coins : 0, Date.now());
    logEvent(ctx.user.id, 'market_buy', { id: it.id, coins: pr.coins || 0 });
    send(res, 200, marketState(ctx.user));
  }, 'user'],

  // ---------- ödül sandıkları
  ['POST', /^\/api\/rewards\/claim$/, async (req, res, ctx) => {
    limit('rw:' + ctx.user.id, 120, 3600e3);
    const b = await readJson(req);
    const st = marketState(ctx.user);
    const r = claim(ctx.user, String(b.key || ''), st.owned);
    if (r.error) fail(400, r.error);
    if (!r.already) logEvent(ctx.user.id, 'reward_claim', { key: r.reward.key, coins: r.reward.coins, item: r.reward.item });
    send(res, 200, { reward: r.reward, market: marketState(ctx.user) });
  }, 'user'],

  // ---------- ödeme hazırlığı: sipariş oluşturur; sağlayıcı bağlanınca buradan yönlendirilecek
  ['POST', /^\/api\/checkout$/, async (req, res, ctx) => {
    limit('co:' + ctx.user.id, 20, 3600e3);
    const b = await readJson(req);
    const pl = getContent('plans').plans.find(p => p.id === 'premium');
    let amount, ref, title;
    if (b.kind === 'plan') {
      if (!['premium-monthly', 'premium-yearly'].includes(b.ref)) fail(400, 'Geçersiz plan.');
      amount = b.ref === 'premium-yearly' ? pl.priceYearly : pl.priceMonthly; ref = b.ref; title = `Premium (${b.ref === 'premium-yearly' ? 'yıllık' : 'aylık'})`;
    } else if (b.kind === 'item') {
      const it = getContent('market').items.find(i => i.id === b.ref && i.price?.type === 'paid');
      if (!it) fail(404, 'Öğe bulunamadı.');
      amount = it.price.try; ref = it.id; title = it.name;
    } else fail(400, 'Geçersiz sipariş.');
    const r = q.run('INSERT INTO orders (user_id, kind, ref, amount, currency, created_at, updated_at) VALUES (?,?,?,?,?,?,?)', ctx.user.id, b.kind, ref, amount, 'TRY', Date.now(), Date.now());
    const id = Number(r.lastInsertRowid);
    logEvent(ctx.user.id, 'checkout', { kind: b.kind, ref, amount });
    const s = settings();
    const text = `Merhaba! Linggo siparişim #${id}: ${title} — ${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺. Hesabım: ${ctx.user.email}`;
    // PAYMENT_PROVIDER henüz bağlı değil → manuel (WhatsApp) akış
    send(res, 200, { order: { id, title, amount, currency: 'TRY', status: 'pending' }, provider: process.env.PAYMENT_PROVIDER || null, whatsappUrl: `https://wa.me/${s.whatsapp}?text=${encodeURIComponent(text)}` });
  }, 'user'],

  ['POST', /^\/api\/account\/marketing$/, async (req, res, ctx) => {
    const b = await readJson(req);
    q.run('UPDATE users SET marketing = ? WHERE id = ?', b.on ? 1 : 0, ctx.user.id);
    send(res, 200, { ok: true, marketing: !!b.on });
  }, 'user'],
];

export function marketState(u) {
  const plan = effectivePlan(u), feat = featuresFor(plan);
  const rows = q.all('SELECT item_id, coins FROM purchases WHERE user_id = ?', u.id);
  const fresh = q.get('SELECT coins_earned FROM users WHERE id = ?', u.id);
  const spent = rows.reduce((a, r) => a + r.coins, 0);
  const items = getContent('market').items.filter(i => i.enabled !== false);
  const owned = new Set(rows.filter(r => r.item_id !== '_coins').map(r => r.item_id));
  for (const i of items) {
    if (i.price?.type === 'free') owned.add(i.id);
    if (i.price?.type === 'premium' && feat.premiumItems) owned.add(i.id);
  }
  return { items, owned: [...owned], balance: Math.max(0, Math.floor((fresh?.coins_earned || 0) - spent)), plan, rewards: rewardsState(u.id) };
}

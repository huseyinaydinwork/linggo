// Yönetici API'si: panel özeti, kullanıcılar, planlar, takılma analizleri, içerik yönetimi
import { q, adminLog } from './db.js';
import { fail, readJson, send } from './http.js';
import { effectivePlan, destroyUserSessions } from './auth.js';
import fs from 'node:fs';
import { sendTemplate, template, renderTemplate, varsFor, runAutomations, segmentUsers, sendCampaign, deliverRendered, mailEnabled } from './mail.js';
import { synth, availableProviders, activeProvider, cacheStats, clearCache, LANGS } from './tts.js';
import { marketState } from './api.js';
import { summarize, flags } from './stats.js';
import { CONTENT_KEYS, getContent, setContent, resetContent, contentMeta, clientContent, FEATURES, validate, contentHistory, revertContent } from './content.js';
import { SHEETS, SHEET_KEYS, LABEL, exportSheets, buildCandidates, diffContent, summaryText, trimDiff } from './transfer.js';
import { writeXlsx, readXlsx } from './xlsx.js';
import crypto from 'node:crypto';

// Uploaded workbooks waiting for confirmation (preview → apply), kept briefly in memory
const uploads = new Map();
const UPLOAD_TTL = 30 * 60e3;
const sweepUploads = () => { for (const [k, u] of uploads) if (Date.now() - u.at > UPLOAD_TTL) uploads.delete(k); };
function parseUpload(name, buf) {
  if (/\.json$/i.test(name) || buf[0] === 0x7B) {
    let j; try { j = JSON.parse(buf.toString('utf8')); } catch { fail(400, 'JSON dosyası okunamadı.'); }
    const c = j?.content && typeof j.content === 'object' ? j.content : j;
    const values = Object.fromEntries(Object.entries(c || {}).filter(([k]) => CONTENT_KEYS.includes(k)));
    if (!Object.keys(values).length) fail(400, 'Dosyada tanınan içerik yok.');
    return { kind: 'json', values };
  }
  if (buf.readUInt32LE(0) !== 0x04034b50) fail(400, 'Desteklenen dosyalar: .xlsx (Excel / Google E-Tablolar / Numbers) veya .json');
  try { return { kind: 'xlsx', sheets: readXlsx(buf) }; } catch (e) { fail(400, 'Excel dosyası okunamadı: ' + e.message); }
}
// Candidate values for an upload + per-key validation (cross-references checked against the other pending values)
function candidates(up, mode) {
  const r = up.kind === 'json' ? { values: up.values, errors: {}, unknown: [] } : buildCandidates(up.sheets, getContent, mode);
  if (up.only?.length) { // uploaded from a single content page: other sheets in the file are ignored
    for (const k of Object.keys(r.values)) if (!up.only.includes(k)) delete r.values[k];
    for (const k of Object.keys(r.errors)) if (!up.only.includes(k)) delete r.errors[k];
  }
  const invalid = {};
  for (const [k, v] of Object.entries(r.values)) { const e = validate(k, v, r.values); if (e) invalid[k] = e; }
  return { ...r, errors: { ...r.errors, ...invalid } };
}
const keyOrder = k => { const i = SHEET_KEYS.indexOf(k); return i < 0 ? 99 : i; };
const LABELS = { ...LABEL, voice: 'Ses ayarları' };

const DAY = 864e5;
const dkey = t => { const d = new Date(t), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
const parse = s => { try { return s ? JSON.parse(s) : null; } catch { return null; } };

// Per-user event aggregates used by diagnostics
function eventAgg(userId) {
  const rows = q.all(`SELECT user_id, type, COUNT(*) n FROM events WHERE type IN ('session_start','session_end','session_abandon','paywall_view','premium_request') ${userId ? 'AND user_id = ?' : ''} GROUP BY user_id, type`, ...(userId ? [userId] : []));
  const m = new Map();
  for (const r of rows) { const o = m.get(r.user_id) || {}; o[r.type] = r.n; m.set(r.user_id, o); }
  return m;
}
function extraFor(agg = {}, u) {
  const premium = u ? effectivePlan(u) === 'premium' : false;
  const started = agg.session_start || 0, ended = agg.session_end || 0;
  return { started, premium, abandon: started ? Math.max(0, (started - ended) / started) : 0, paywall: agg.paywall_view || 0, requested: !!agg.premium_request };
}
function row(u, agg) {
  const s = parse(u.stats);
  return {
    id: u.id, email: u.email, name: u.name, verified: !!u.verified, role: u.role, plan: effectivePlan(u), planRaw: u.plan, planUntil: u.plan_until,
    createdAt: u.created_at, lastSeen: u.last_seen,
    xp: s?.xp || 0, streak: s?.streak || 0, learned: s?.learned || 0, due: s?.due || 0, acc7: s?.acc7 ?? null, lastDay: s?.lastDay || null,
    unit: s?.unit?.n || null, patterns: s?.patterns || 0, onboarded: !!s?.onboarded, level: u.level || null, marketing: !!u.marketing,
    flags: flags(u, s, extraFor(agg, u)),
  };
}

export const adminRoutes = [
  ['GET', /^\/api\/admin\/overview$/, async (req, res) => {
    const users = q.all('SELECT * FROM users');
    const now = Date.now(), today = dkey(now);
    const S = users.map(u => ({ u, s: parse(u.stats) }));
    const within = (d, n) => d && (now - new Date(d + 'T12:00:00')) / DAY <= n;
    const totals = {
      users: users.length,
      verified: users.filter(u => u.verified).length,
      premium: users.filter(u => effectivePlan(u) === 'premium' && u.role !== 'admin').length,
      new7: users.filter(u => now - u.created_at < 7 * DAY).length,
      activeToday: S.filter(x => x.s?.lastDay === today).length,
      active7: S.filter(x => within(x.s?.lastDay, 7)).length,
      active30: S.filter(x => within(x.s?.lastDay, 30)).length,
      wordsLearned: S.reduce((a, x) => a + (x.s?.learned || 0), 0),
    };
    const funnel = [
      ['Kayıt oldu', users.length],
      ['E-postayı doğruladı', totals.verified],
      ['Kurulumu bitirdi', S.filter(x => x.s?.onboarded).length],
      ['İlk pratiği yaptı', S.filter(x => x.s?.xp > 0).length],
      ['2+ gün geri geldi', S.filter(x => x.s?.activeDays >= 2).length],
      ['7 günlük seri yaptı', S.filter(x => x.s?.best >= 7).length],
      ['Premium', totals.premium],
    ];
    // 30-day series: signups + active learners (from session events)
    const since = now - 29 * DAY;
    const signups = {}, active = {};
    for (const u of users) if (u.created_at >= since) signups[dkey(u.created_at)] = (signups[dkey(u.created_at)] || 0) + 1;
    for (const r of q.all("SELECT user_id, ts FROM events WHERE type IN ('session_end','session_start','app_open') AND ts >= ?", since)) {
      const k = dkey(r.ts); (active[k] ||= new Set()).add(r.user_id);
    }
    const series = Array.from({ length: 30 }, (_, i) => { const k = dkey(since + i * DAY); return [k, signups[k] || 0, active[k]?.size || 0]; });
    const requests = q.all(`SELECT e.user_id, MAX(e.ts) ts, COUNT(*) n, u.email, u.name, u.plan, u.plan_until, u.role FROM events e JOIN users u ON u.id = e.user_id
      WHERE e.type = 'premium_request' GROUP BY e.user_id ORDER BY ts DESC LIMIT 30`).map(r => ({ ...r, plan: effectivePlan(r) }));
    const recent = users.sort((a, b) => b.created_at - a.created_at).slice(0, 8).map(u => row(u, {}));
    send(res, 200, { totals, funnel, series, requests, recent });
  }],

  ['GET', /^\/api\/admin\/insights$/, async (req, res) => {
    const hard = kind => q.all(`SELECT item, ok, wrong, ROUND(100.0 * wrong / (ok + wrong)) rate FROM item_stats WHERE kind = ? AND ok + wrong >= 5 ORDER BY 1.0 * wrong / (ok + wrong) DESC, wrong DESC LIMIT 25`, kind);
    const kinds = q.all(`SELECT json_extract(data,'$.kind') kind, type, COUNT(*) n FROM events WHERE type IN ('session_start','session_end','session_abandon') AND ts > ? GROUP BY kind, type`, Date.now() - 60 * DAY);
    const byKind = {};
    for (const r of kinds) { const o = byKind[r.kind || '?'] ||= { kind: r.kind || '?', start: 0, end: 0, abandon: 0 }; o[r.type.replace('session_', '')] = r.n; }
    const abandonAt = q.all(`SELECT json_extract(data,'$.kind') kind, AVG(1.0 * json_extract(data,'$.i') / json_extract(data,'$.total')) at FROM events WHERE type = 'session_abandon' AND json_extract(data,'$.total') > 0 GROUP BY kind`);
    for (const a of abandonAt) if (byKind[a.kind]) byKind[a.kind].at = Math.round(a.at * 100);
    const modules = q.all(`SELECT json_extract(data,'$.m') m, COUNT(*) n, COUNT(DISTINCT user_id) users FROM events WHERE type = 'module_view' AND ts > ? GROUP BY m ORDER BY n DESC`, Date.now() - 30 * DAY);
    const tours = q.all(`SELECT json_extract(data,'$.m') m, type, COUNT(*) n FROM events WHERE type IN ('tour_done','tour_skip') GROUP BY m, type`);
    const paywall = q.all(`SELECT json_extract(data,'$.from') src, COUNT(*) n FROM events WHERE type = 'paywall_view' AND ts > ? GROUP BY src ORDER BY n DESC`, Date.now() - 30 * DAY);
    const requests30 = q.get(`SELECT COUNT(DISTINCT user_id) n FROM events WHERE type = 'premium_request' AND ts > ?`, Date.now() - 30 * DAY).n;
    // learners needing attention
    const agg = eventAgg();
    const users = q.all('SELECT * FROM users WHERE role != ?', 'admin').map(u => row(u, agg.get(u.id)));
    const attention = users.filter(u => u.flags.some(f => f[0] === 'bad' || f[0] === 'hot')).sort((a, b) => b.flags.length - a.flags.length).slice(0, 30);
    const stuckUnits = {};
    for (const u of users) if (u.unit) stuckUnits[u.unit] = (stuckUnits[u.unit] || 0) + 1;
    send(res, 200, { words: hard('w'), patterns: hard('p'), pairs: hard('pair'), sessions: Object.values(byKind), modules, tours, paywall, requests30, attention, stuckUnits });
  }],

  ['GET', /^\/api\/admin\/users$/, async (req, res) => {
    const u = new URL(req.url, 'http://x');
    const s = (u.searchParams.get('q') || '').trim().toLowerCase();
    const plan = u.searchParams.get('plan') || '';
    const flag = u.searchParams.get('flag') || '';
    const agg = eventAgg();
    let rows = q.all('SELECT * FROM users ORDER BY created_at DESC').map(x => row(x, agg.get(x.id)));
    if (s) rows = rows.filter(r => r.email.toLowerCase().includes(s) || r.name.toLowerCase().includes(s));
    if (plan) rows = rows.filter(r => (plan === 'admin' ? r.role === 'admin' : r.plan === plan && r.role !== 'admin'));
    if (flag === 'attention') rows = rows.filter(r => r.flags.some(f => f[0] === 'bad'));
    if (flag === 'requested') rows = rows.filter(r => r.flags.some(f => f[0] === 'hot'));
    if (flag === 'unverified') rows = rows.filter(r => !r.verified);
    send(res, 200, { users: rows.slice(0, 500), total: rows.length });
  }],

  ['GET', /^\/api\/admin\/users\/(\d+)$/, async (req, res, ctx, m) => {
    const u = q.get('SELECT * FROM users WHERE id = ?', +m[1]); if (!u) fail(404, 'Kullanıcı bulunamadı.');
    const progress = parse(u.progress);
    const s = summarize(progress);
    const agg = eventAgg(u.id).get(u.id) || {};
    const events = q.all('SELECT type, data, ts FROM events WHERE user_id = ? ORDER BY ts DESC LIMIT 150', u.id).map(e => ({ ...e, data: parse(e.data) }));
    const sessions = q.get('SELECT COUNT(*) n FROM sessions WHERE user_id = ? AND expires_at > ?', u.id, Date.now()).n;
    const market = marketState(u);
    const placement = q.get("SELECT data, ts FROM events WHERE user_id = ? AND type = 'placement_done' ORDER BY ts DESC LIMIT 1", u.id);
    const orders = q.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', u.id);
    send(res, 200, { user: { ...row(u, agg), adminNote: u.admin_note, planNote: u.plan_note }, stats: s, extra: extraFor(agg, u), events, sessions, settings: progress?.settings || null, market: { balance: market.balance, owned: market.owned }, placement: placement ? { ...parse(placement.data), ts: placement.ts } : null, orders, pip: progress?.pip || null });
  }],

  ['POST', /^\/api\/admin\/users\/(\d+)\/plan$/, async (req, res, ctx, m) => {
    const b = await readJson(req);
    const u = q.get('SELECT * FROM users WHERE id = ?', +m[1]); if (!u) fail(404, 'Kullanıcı bulunamadı.');
    let until = null;
    if (b.plan === 'premium') {
      if (b.until) until = new Date(b.until + 'T23:59:59').getTime();
      else if (b.days) until = Math.max(Date.now(), u.plan === 'premium' && u.plan_until ? u.plan_until : 0) + Number(b.days) * DAY;
      if (until !== null && !(until > Date.now())) fail(400, 'Bitiş tarihi gelecekte olmalı.');
    } else if (b.plan !== 'free') fail(400, 'Geçersiz plan.');
    q.run('UPDATE users SET plan = ?, plan_until = ?, plan_note = ? WHERE id = ?', b.plan, until, String(b.note || '').slice(0, 300), u.id);
    adminLog(ctx.user.id, 'plan.set', u.email, { plan: b.plan, until, note: b.note });
    if (b.plan === 'premium' && b.notify) sendTemplate({ ...u, plan: 'premium', plan_until: until }, 'premium', { force: true }).catch(e => console.error('Mail error:', e.message));
    send(res, 200, { ok: true, plan: b.plan, until });
  }],

  ['POST', /^\/api\/admin\/users\/(\d+)\/update$/, async (req, res, ctx, m) => {
    const b = await readJson(req);
    const u = q.get('SELECT * FROM users WHERE id = ?', +m[1]); if (!u) fail(404, 'Kullanıcı bulunamadı.');
    if ('note' in b) q.run('UPDATE users SET admin_note = ? WHERE id = ?', String(b.note).slice(0, 2000), u.id);
    if ('verified' in b) q.run('UPDATE users SET verified = ? WHERE id = ?', b.verified ? 1 : 0, u.id);
    if ('role' in b) {
      if (!['user', 'admin'].includes(b.role)) fail(400, 'Geçersiz rol.');
      if (u.id === ctx.user.id && b.role !== 'admin') fail(400, 'Kendi yöneticiliğini kaldıramazsın.');
      q.run('UPDATE users SET role = ? WHERE id = ?', b.role, u.id);
    }
    if (b.logoutAll) destroyUserSessions(u.id);
    if (b.resetProgress) q.run('UPDATE users SET progress = NULL, progress_at = ?, stats = NULL WHERE id = ?', Date.now(), u.id);
    adminLog(ctx.user.id, 'user.update', u.email, b);
    send(res, 200, { ok: true });
  }],

  ['POST', /^\/api\/admin\/users\/(\d+)\/delete$/, async (req, res, ctx, m) => {
    const u = q.get('SELECT * FROM users WHERE id = ?', +m[1]); if (!u) fail(404, 'Kullanıcı bulunamadı.');
    if (u.id === ctx.user.id) fail(400, 'Kendi hesabını buradan silemezsin.');
    q.run('DELETE FROM users WHERE id = ?', u.id);
    adminLog(ctx.user.id, 'user.delete', u.email);
    send(res, 200, { ok: true });
  }],

  ['GET', /^\/api\/admin\/content$/, async (req, res) => {
    const out = {}; for (const k of CONTENT_KEYS) out[k] = getContent(k);
    send(res, 200, { content: out, meta: contentMeta() });
  }],

  ['PUT', /^\/api\/admin\/content\/(\w+)$/, async (req, res, ctx, m) => {
    if (!CONTENT_KEYS.includes(m[1])) fail(404, 'Bilinmeyen içerik.');
    const b = await readJson(req, 8e6);
    const err = setContent(m[1], b.value, ctx.user.id);
    if (err) fail(400, err);
    send(res, 200, { ok: true });
  }],

  ['POST', /^\/api\/admin\/content\/(\w+)\/reset$/, async (req, res, ctx, m) => {
    const err = resetContent(m[1], ctx.user.id); if (err) fail(400, err);
    send(res, 200, { ok: true, value: getContent(m[1]) });
  }],

  // ---------- bulk transfer: download all content as an editable workbook, upload it back
  ['GET', /^\/api\/admin\/transfer\/export$/, async (req, res, ctx) => {
    const u = new URL(req.url, 'http://x');
    const format = u.searchParams.get('format') === 'json' ? 'json' : 'xlsx', empty = u.searchParams.get('empty') === '1';
    const keys = (u.searchParams.get('keys') || '').split(',').filter(k => (format === 'json' ? CONTENT_KEYS : SHEET_KEYS).includes(k));
    const day = new Date().toISOString().slice(0, 10);
    if (format === 'json') {
      const content = Object.fromEntries((keys.length ? keys : CONTENT_KEYS).map(k => [k, getContent(k)]));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="linggo-icerik-${day}.json"`, 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify({ app: 'linggo', exportedAt: new Date().toISOString(), content }, null, 2));
    }
    const buf = writeXlsx(exportSheets(getContent, { keys: keys.length ? keys : SHEET_KEYS, empty }));
    adminLog(ctx.user.id, 'content.export', empty ? 'boş şablon' : 'excel', (keys.length ? keys : SHEET_KEYS).map(k => LABEL[k]).join(', '));
    res.writeHead(200, { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="linggo-${(u.searchParams.get('file') || '').replace(/[^a-z0-9-]/g, '').slice(0, 30) || (empty ? 'sablon' : 'icerik')}-${day}.xlsx"`, 'Cache-Control': 'no-store', 'Content-Length': buf.length });
    res.end(buf);
  }],

  ['POST', /^\/api\/admin\/transfer\/preview$/, async (req, res, ctx) => {
    sweepUploads();
    const b = await readJson(req, 25e6);
    const buf = Buffer.from(String(b.data || ''), 'base64');
    if (!buf.length) fail(400, 'Dosya boş.');
    const only = Array.isArray(b.keys) ? b.keys.filter(k => CONTENT_KEYS.includes(k)) : [];
    const up = { ...parseUpload(String(b.name || ''), buf), name: String(b.name || 'dosya').slice(0, 120), at: Date.now(), admin: ctx.user.id, only };
    const token = crypto.randomBytes(12).toString('hex');
    uploads.set(token, up);
    const modes = {};
    for (const mode of up.kind === 'json' ? ['replace'] : ['merge', 'replace']) {
      const c = candidates(up, mode);
      const keys = [...new Set([...Object.keys(c.values), ...Object.keys(c.errors)])].sort((a, b) => keyOrder(a) - keyOrder(b));
      modes[mode] = keys.map(k => {
        const d = c.values[k] !== undefined && !c.errors[k] ? diffContent(k, getContent(k), c.values[k]) : null;
        return { key: k, label: LABELS[k] || k, error: c.errors[k] || null, diff: d && trimDiff(d, 40), summary: d ? summaryText(d) : '', changed: !!d?.changed };
      });
      modes.unknown = c.unknown;
    }
    send(res, 200, { token, name: up.name, kind: up.kind, modes });
  }],

  ['POST', /^\/api\/admin\/transfer\/apply$/, async (req, res, ctx) => {
    const b = await readJson(req);
    const up = uploads.get(String(b.token || ''));
    if (!up) fail(410, 'Yükleme zaman aşımına uğradı; dosyayı tekrar yükle.');
    const mode = up.kind === 'json' ? 'replace' : b.mode === 'replace' ? 'replace' : 'merge';
    const c = candidates(up, mode);
    const want = (Array.isArray(b.keys) ? b.keys : Object.keys(c.values)).filter(k => c.values[k] !== undefined).sort((a, b) => keyOrder(a) - keyOrder(b));
    const bad = want.filter(k => c.errors[k]);
    if (bad.length) fail(400, `${LABELS[bad[0]] || bad[0]}: ${c.errors[bad[0]]}`);
    const applied = [];
    for (const k of want) {
      const before = getContent(k), d = diffContent(k, before, c.values[k]);
      if (!d.changed) continue;
      const err = setContent(k, c.values[k], ctx.user.id, { action: 'import', note: `${up.name} · ${mode === 'replace' ? 'dosyayla değiştir' : 'güncelle + ekle'}` });
      if (err) fail(400, `${LABELS[k] || k}: ${err} (önceki ${applied.length} içerik kaydedildi)`);
      applied.push({ key: k, label: LABELS[k] || k, summary: summaryText(d) });
    }
    uploads.delete(String(b.token));
    send(res, 200, { ok: true, applied });
  }],

  ['GET', /^\/api\/admin\/content-history$/, async (req, res) => {
    const u = new URL(req.url, 'http://x'), key = u.searchParams.get('key') || '';
    send(res, 200, { history: contentHistory({ key: CONTENT_KEYS.includes(key) ? key : '', limit: 120 }), labels: LABELS });
  }],
  ['POST', /^\/api\/admin\/content-history\/(\d+)\/revert$/, async (req, res, ctx, m) => {
    const err = revertContent(+m[1], ctx.user.id); if (err) fail(400, err);
    send(res, 200, { ok: true });
  }],

  ['GET', /^\/api\/admin\/preview\/(free|premium)$/, async (req, res, ctx, m) => send(res, 200, clientContent(m[1]))],

  // ---------- plan feature registry
  ['GET', /^\/api\/admin\/features$/, async (req, res) => send(res, 200, { features: FEATURES })],

  // ---------- e-posta
  ['GET', /^\/api\/admin\/emails$/, async (req, res) => {
    const counts = q.all("SELECT template, status, COUNT(*) n FROM email_log WHERE ts > ? GROUP BY template, status", Date.now() - 30 * 864e5);
    const log = q.all('SELECT l.*, u.email FROM email_log l LEFT JOIN users u ON u.id = l.user_id ORDER BY l.ts DESC LIMIT 120');
    const campaigns = q.all('SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 50');
    const consent = q.get('SELECT SUM(marketing) m, COUNT(*) n FROM users WHERE verified = 1');
    send(res, 200, { counts, log, campaigns, smtp: mailEnabled(), consent });
  }],
  ['POST', /^\/api\/admin\/emails\/preview$/, async (req, res, ctx) => {
    const b = await readJson(req, 2e5);
    const t = b.template || template(b.id); if (!t) fail(404, 'Şablon bulunamadı.');
    const me = q.get('SELECT * FROM users WHERE id = ?', ctx.user.id);
    const r = renderTemplate(t, varsFor(me), { code: t.kind === 'system' ? '482913' : '', marketing: t.marketing || b.marketing, userId: me.id });
    send(res, 200, { subject: r.subject, html: r.html });
  }],
  ['POST', /^\/api\/admin\/emails\/test$/, async (req, res, ctx) => {
    const b = await readJson(req, 2e5);
    const t = b.template || template(b.id); if (!t) fail(404, 'Şablon bulunamadı.');
    const me = q.get('SELECT * FROM users WHERE id = ?', ctx.user.id);
    const r = renderTemplate(t, varsFor(me), { code: t.kind === 'system' ? '482913' : '', marketing: !!t.marketing, userId: me.id });
    try { const st = await deliverRendered(me.email, r); send(res, 200, { ok: true, status: st, to: me.email }); }
    catch (e) { fail(502, 'Gönderilemedi: ' + e.message); }
  }],
  ['POST', /^\/api\/admin\/emails\/run$/, async (req, res, ctx) => {
    const n = await runAutomations(); adminLog(ctx.user.id, 'emails.run', '', `${n} e-posta`);
    send(res, 200, { ok: true, sent: n });
  }],
  ['GET', /^\/api\/admin\/segment$/, async (req, res) => {
    send(res, 200, { count: segmentUsers(new URL(req.url, 'http://x').searchParams.get('s') || 'all').length });
  }],
  ['POST', /^\/api\/admin\/campaigns$/, async (req, res, ctx) => {
    const b = await readJson(req, 2e5);
    if (!String(b.subject || '').trim() || !String(b.body || '').trim()) fail(400, 'Konu ve içerik zorunlu.');
    const r = q.run('INSERT INTO campaigns (subject, title, body, cta, segment, created_by, created_at) VALUES (?,?,?,?,?,?,?)',
      String(b.subject).slice(0, 200), String(b.title || '').slice(0, 200), String(b.body).slice(0, 8000), String(b.cta || '').slice(0, 60), String(b.segment || 'all'), ctx.user.id, Date.now());
    const id = Number(r.lastInsertRowid);
    adminLog(ctx.user.id, 'campaign.send', String(id), b.subject);
    sendCampaign(id).catch(e => console.error('Campaign', e));
    send(res, 200, { ok: true, id, recipients: segmentUsers(b.segment || 'all').length });
  }],

  // ---------- ses (TTS)
  ['GET', /^\/api\/admin\/voice$/, async (req, res) => send(res, 200, { available: availableProviders(), active: activeProvider(), cache: cacheStats() })],
  ['POST', /^\/api\/admin\/voice\/test$/, async (req, res) => {
    const b = await readJson(req);
    if (!LANGS.includes(b.lang)) fail(400, 'Dil geçersiz.');
    let out;
    try { out = await synth(String(b.text || '').slice(0, 300) || 'Merhaba!', b.lang); }
    catch (e) { fail(502, e.message); }
    if (!out) fail(409, 'Etkin bir ses sağlayıcısı yok. .env dosyasına anahtar ekle.');
    res.writeHead(200, { 'Content-Type': 'audio/mpeg' }); fs.createReadStream(out.file).pipe(res);
  }],
  ['POST', /^\/api\/admin\/voice\/clear$/, async (req, res, ctx) => { clearCache(); adminLog(ctx.user.id, 'voice.clear'); send(res, 200, { ok: true }); }],

  // ---------- siparişler (ödeme hazırlığı)
  ['GET', /^\/api\/admin\/orders$/, async (req, res) => {
    send(res, 200, { orders: q.all('SELECT o.*, u.email, u.name FROM orders o LEFT JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 300') });
  }],
  ['POST', /^\/api\/admin\/orders\/(\d+)$/, async (req, res, ctx, m) => {
    const b = await readJson(req);
    const o = q.get('SELECT * FROM orders WHERE id = ?', +m[1]); if (!o) fail(404, 'Sipariş bulunamadı.');
    if (!['paid', 'cancelled', 'pending'].includes(b.status)) fail(400, 'Geçersiz durum.');
    q.run('UPDATE orders SET status = ?, note = ?, updated_at = ? WHERE id = ?', b.status, String(b.note || o.note).slice(0, 300), Date.now(), o.id);
    if (b.status === 'paid' && o.status !== 'paid' && o.user_id) {
      const u = q.get('SELECT * FROM users WHERE id = ?', o.user_id);
      if (o.kind === 'plan') {
        const days = o.ref === 'premium-yearly' ? 365 : 30;
        const until = Math.max(Date.now(), u.plan === 'premium' && u.plan_until ? u.plan_until : 0) + days * DAY;
        q.run("UPDATE users SET plan = 'premium', plan_until = ?, plan_note = ? WHERE id = ?", until, `Sipariş #${o.id}`, u.id);
        sendTemplate({ ...u, plan: 'premium', plan_until: until }, 'premium').catch(() => { });
      } else if (!q.get('SELECT 1 FROM purchases WHERE user_id = ? AND item_id = ?', u.id, o.ref)) {
        q.run('INSERT INTO purchases (user_id, item_id, source, coins, ts) VALUES (?,?,?,?,?)', u.id, o.ref, 'paid', 0, Date.now());
      }
    }
    adminLog(ctx.user.id, 'order.status', `#${o.id}`, b.status);
    send(res, 200, { ok: true });
  }],

  // ---------- hediye öğe / yaprak
  ['POST', /^\/api\/admin\/users\/(\d+)\/gift$/, async (req, res, ctx, m) => {
    const b = await readJson(req);
    const u = q.get('SELECT * FROM users WHERE id = ?', +m[1]); if (!u) fail(404, 'Kullanıcı bulunamadı.');
    if (b.coins) {
      const n = Math.trunc(Number(b.coins)); if (!n || Math.abs(n) > 100000) fail(400, 'Geçersiz miktar.');
      q.run('INSERT INTO purchases (user_id, item_id, source, coins, ts) VALUES (?,?,?,?,?)', u.id, '_coins', 'grant', -n, Date.now());
      adminLog(ctx.user.id, 'gift.coins', u.email, String(n));
    } else {
      const it = getContent('market').items.find(i => i.id === b.itemId); if (!it) fail(404, 'Öğe bulunamadı.');
      if (!q.get('SELECT 1 FROM purchases WHERE user_id = ? AND item_id = ?', u.id, it.id)) q.run('INSERT INTO purchases (user_id, item_id, source, coins, ts) VALUES (?,?,?,?,?)', u.id, it.id, 'gift', 0, Date.now());
      adminLog(ctx.user.id, 'gift.item', u.email, it.id);
    }
    send(res, 200, { ok: true, market: marketState(q.get('SELECT * FROM users WHERE id = ?', u.id)) });
  }],

  ['GET', /^\/api\/admin\/log$/, async (req, res) => {
    send(res, 200, { log: q.all('SELECT l.*, u.email admin FROM admin_log l LEFT JOIN users u ON u.id = l.admin_id ORDER BY l.ts DESC LIMIT 200') });
  }],
].map(r => [...r, 'admin']);

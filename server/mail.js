// E-posta: SMTP gönderimi, panelden düzenlenen şablonların işlenmesi, otomatik akışlar, kampanyalar, abonelik iptali
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { config } from './config.js';
import { q } from './db.js';
import { getContent } from './content.js';

let transport = null;
if (config.smtp.host) {
  transport = nodemailer.createTransport({
    host: config.smtp.host, port: config.smtp.port, secure: config.smtp.secure,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
}
export const mailEnabled = () => !!transport;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const unsubToken = id => crypto.createHmac('sha256', config.secret).update('unsub:' + id).digest('hex').slice(0, 32);
export const unsubUrl = id => `${config.appUrl}/u/unsub?u=${id}&t=${unsubToken(id)}`;

// Tiny markdown-ish → HTML (paragraphs, **bold**, *italic*, [text](url), "- " lists)
function md(text, vars) {
  const inline = s => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" style="color:#141414;font-weight:700">$1</a>');
  return text.split(/\n{2,}/).map(block => {
    if (block.trim() === '{{stats}}') return vars.__stats || '';
    const lines = block.split('\n');
    if (lines.every(l => /^\s*-\s+/.test(l))) return `<ul style="margin:0 0 16px;padding-left:20px">${lines.map(l => `<li style="margin:4px 0">${inline(l.replace(/^\s*-\s+/, ''))}</li>`).join('')}</ul>`;
    return `<p style="margin:0 0 16px">${lines.map(inline).join('<br>')}</p>`;
  }).join('');
}
const fill = (s, vars) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

function layout({ preheader, title, bodyHtml, code, cta, unsub }) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#F4F0E8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#141414">
<span style="display:none;opacity:0;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F0E8;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#FFFDF8;border-radius:28px;overflow:hidden">
<tr><td style="background:#141414;padding:24px 28px">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="width:38px;height:38px;background:#D4F65A;border-radius:12px;text-align:center;font-size:20px">🌱</td>
    <td style="padding-left:12px;color:#F2EDE4;font-size:20px;font-weight:800;letter-spacing:-.5px">Linggo</td>
  </tr></table>
</td></tr>
<tr><td style="padding:32px 28px 8px">
  <h1 style="margin:0 0 14px;font-size:26px;line-height:1.15;letter-spacing:-.6px">${esc(title)}</h1>
  <div style="font-size:15.5px;line-height:1.6;color:#55514A">${bodyHtml}</div>
  ${code ? `<div style="margin:22px 0 8px;padding:22px;background:#D4F65A;border-radius:20px;text-align:center">
    <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#1A2300;opacity:.7;margin-bottom:6px">Kodun</div>
    <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#141414;font-family:Menlo,Consolas,monospace">${esc(code)}</div></div>
  <p style="font-size:13px;color:#8F887D;margin:8px 0 0">Kod 15 dakika geçerlidir. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.</p>` : ''}
  ${cta ? `<p style="margin:24px 0 8px"><a href="${esc(config.appUrl)}" style="display:inline-block;background:#141414;color:#F4F0E8;padding:14px 24px;border-radius:14px;text-decoration:none;font-weight:700">${esc(cta)} →</a></p>` : ''}
</td></tr>
<tr><td style="padding:24px 28px 30px;font-size:12px;color:#8F887D;border-top:1px solid #EEE6D8">Linggo · İngilizceyi bilimle öğren<br><a href="${esc(config.appUrl)}" style="color:#55514A">${esc(config.appUrl.replace(/^https?:\/\//, ''))}</a>
${unsub ? `<br><br><a href="${esc(unsub)}" style="color:#8F887D">${esc(getContent('emails')?.sender?.unsubscribeText || 'Abonelikten çık')}</a>` : ''}</td></tr>
</table></td></tr></table></body></html>`;
}

function statsBlock(v) {
  const cell = (n, l) => `<td style="padding:14px;background:#F4F0E8;border-radius:16px;text-align:center"><div style="font-size:26px;font-weight:800;color:#141414">${esc(n)}</div><div style="font-size:12px;color:#8F887D">${esc(l)}</div></td>`;
  return `<table role="presentation" width="100%" cellspacing="6" style="margin:0 0 16px"><tr>${cell(v.weekXp, 'XP')}${cell(v.weekWords, 'yeni kelime')}${cell('🔥 ' + v.streak, 'seri')}${cell(v.learned, 'toplam kelime')}</tr></table>`;
}

// Variables available in templates
export function varsFor(u, extra = {}) {
  let s = {}; try { s = JSON.parse(u.stats || '{}') || {}; } catch { }
  let p = {}; try { p = JSON.parse(u.progress || '{}') || {}; } catch { }
  const day = 864e5, now = Date.now();
  let weekXp = 0, weekWords = 0;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now - i * day); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    weekXp += p.xp?.[k] || 0; weekWords += p.act?.[k]?.nw || 0;
  }
  const inactiveDays = s.lastDay ? Math.max(0, Math.round((now - new Date(s.lastDay + 'T12:00:00')) / day)) : 0;
  const planUntil = u.plan_until ? new Date(u.plan_until).toLocaleDateString('tr-TR') : '';
  return {
    name: (u.name || '').split(' ')[0] || 'merhaba', email: u.email, appUrl: config.appUrl,
    streak: s.streak || 0, xp: s.xp || 0, learned: s.learned || 0, due: s.due || 0, level: (u.level || '').toUpperCase(),
    weekXp, weekWords, inactiveDays, planUntil, planUntilText: planUntil ? ` (${planUntil} tarihine kadar)` : '',
    days: u.plan_until ? Math.max(0, Math.ceil((u.plan_until - now) / day)) : 0,
    ...extra,
  };
}

export function renderTemplate(t, vars, { code, marketing, userId } = {}) {
  const v = { ...vars, code: code || '' };
  v.__stats = statsBlock(v);
  const subject = fill(t.subject, v);
  const title = fill(t.title || t.subject, v);
  const bodyHtml = md(fill(t.body, v), v);
  const text = `${title}\n\n${fill(t.body, v).replace('{{stats}}', `XP: ${v.weekXp} · Yeni kelime: ${v.weekWords} · Seri: ${v.streak}`)}${code ? `\n\nKodun: ${code}` : ''}\n\n${config.appUrl}`;
  const unsub = marketing && userId ? unsubUrl(userId) : null;
  return { subject, html: layout({ preheader: code ? `Kodun: ${code}` : subject, title, bodyHtml, code, cta: t.cta ? fill(t.cta, v) : '', unsub }), text, unsub };
}
export const template = id => getContent('emails')?.templates.find(t => t.id === id);

async function deliver(to, r) {
  if (!transport) { console.log(`\n  ✉  [DEV e-posta → ${to}] ${r.subject}\n`); return 'dev'; }
  await transport.sendMail({
    from: config.smtp.from, to, subject: r.subject, html: r.html, text: r.text,
    headers: r.unsub ? { 'List-Unsubscribe': `<${r.unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : undefined,
  });
  return 'sent';
}
const log = (userId, tpl, ref, subject, status, error = null) =>
  q.run('INSERT INTO email_log (user_id, template, ref, subject, status, error, ts) VALUES (?,?,?,?,?,?,?)', userId, tpl, ref, subject, status, error, Date.now());

// Send a template to a user. System (code) mails always go; marketing mails need consent.
export async function sendTemplate(user, id, { code, ref = '', extra = {}, force = false } = {}) {
  const t = template(id);
  if (!t || (!t.enabled && !force)) return 'disabled';
  if (t.marketing && !user.marketing && !force) return 'no-consent';
  const r = renderTemplate(t, varsFor(user, extra), { code, marketing: t.marketing, userId: user.id });
  try { const st = await deliver(user.email, r); log(user.id, id, ref, r.subject, st); return st; }
  catch (e) { log(user.id, id, ref, r.subject, 'failed', e.message); if (code) throw e; return 'failed'; }
}

// Back-compat helper used by auth flows
export async function sendMail(to, kind, name, code) {
  const user = q.get('SELECT * FROM users WHERE email = ?', to) || { id: null, email: to, name };
  return sendTemplate(user, kind, { code, force: true });
}

// ---------- automations (run by the scheduler)
const sentBefore = (uid, tpl, ref) => !!q.get('SELECT 1 FROM email_log WHERE user_id = ? AND template = ? AND ref = ? AND status IN (\'sent\',\'dev\')', uid, tpl, ref);
const isoWeek = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() + 3 - (x.getDay() + 6) % 7); const w1 = new Date(x.getFullYear(), 0, 4); return `${x.getFullYear()}-W${1 + Math.round(((x - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7)}`; };

export async function runAutomations(now = new Date()) {
  const T = Object.fromEntries((getContent('emails')?.templates || []).map(t => [t.id, t]));
  let sent = 0; const MAX = 300;
  const users = q.all('SELECT * FROM users WHERE verified = 1');
  const lastDayOf = u => { try { return JSON.parse(u.stats || '{}')?.lastDay || null; } catch { return null; } };

  // premium expiring
  const pe = T.premium_expiring;
  if (pe?.enabled) for (const u of users) {
    if (sent >= MAX) break;
    if (u.plan !== 'premium' || !u.plan_until || u.role === 'admin') continue;
    const left = (u.plan_until - now) / 864e5;
    if (left > 0 && left <= (pe.daysBefore || 3) && !sentBefore(u.id, 'premium_expiring', String(u.plan_until))) {
      await sendTemplate(u, 'premium_expiring', { ref: String(u.plan_until) }); sent++;
    }
  }
  // inactivity reminder: once per inactivity streak
  const ia = T.inactive;
  if (ia?.enabled) for (const u of users) {
    if (sent >= MAX) break;
    const ld = lastDayOf(u); if (!ld || !u.marketing) continue;
    const idle = Math.round((now - new Date(ld + 'T12:00:00')) / 864e5);
    if (idle >= (ia.days || 3) && idle <= 60 && !sentBefore(u.id, 'inactive', ld)) { await sendTemplate(u, 'inactive', { ref: ld }); sent++; }
  }
  // weekly digest at configured weekday/hour
  const dg = T.digest;
  if (dg?.enabled && now.getDay() === dg.weekday && now.getHours() === dg.hour) {
    const wk = isoWeek(now);
    for (const u of users) {
      if (sent >= MAX) break;
      const ld = lastDayOf(u); if (!u.marketing || !ld) continue;
      if ((now - new Date(ld + 'T12:00:00')) / 864e5 > 30) continue;
      if (!sentBefore(u.id, 'digest', wk)) { await sendTemplate(u, 'digest', { ref: wk }); sent++; }
    }
  }
  return sent;
}

// ---------- campaigns
export function segmentUsers(segment) {
  const all = q.all('SELECT * FROM users WHERE verified = 1 AND marketing = 1');
  const plan = u => (u.role === 'admin' || (u.plan === 'premium' && (!u.plan_until || u.plan_until > Date.now()))) ? 'premium' : 'free';
  const idle = u => { try { const ld = JSON.parse(u.stats || '{}')?.lastDay; return ld ? (Date.now() - new Date(ld + 'T12:00:00')) / 864e5 : 999; } catch { return 999; } };
  const [kind, arg] = String(segment).split(':');
  if (kind === 'all') return all;
  if (kind === 'free' || kind === 'premium') return all.filter(u => plan(u) === kind);
  if (kind === 'inactive') return all.filter(u => idle(u) >= Number(arg || 7));
  if (kind === 'active') return all.filter(u => idle(u) <= Number(arg || 7));
  if (kind === 'level') return all.filter(u => u.level === arg);
  return [];
}
export async function sendCampaign(id) {
  const c = q.get('SELECT * FROM campaigns WHERE id = ?', id); if (!c) return;
  q.run("UPDATE campaigns SET status = 'sending' WHERE id = ?", id);
  const t = { subject: c.subject, title: c.title, body: c.body, cta: c.cta, marketing: true };
  let ok = 0, bad = 0;
  for (const u of segmentUsers(c.segment)) {
    const r = renderTemplate(t, varsFor(u), { marketing: true, userId: u.id });
    try { const st = await deliver(u.email, r); log(u.id, 'campaign', String(id), r.subject, st); ok++; }
    catch (e) { log(u.id, 'campaign', String(id), r.subject, 'failed', e.message); bad++; }
    await new Promise(r => setTimeout(r, transport ? 120 : 0));
  }
  q.run("UPDATE campaigns SET status = 'sent', sent = ?, failed = ?, sent_at = ? WHERE id = ?", ok, bad, Date.now(), id);
}
export { deliver as deliverRendered };

// Ödül sandıkları: günlük görevler, seviye atlama, rozet ve seri kilometre taşları.
// Uygunluk sunucuda, kullanıcının kayıtlı ilerlemesinden doğrulanır; her anahtar bir kez açılır.
import { q, tx } from './db.js';
import { getContent, featuresFor } from './content.js';
import { effectivePlan } from './auth.js';

const DAY = 864e5;
const dkey = d => { const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };

// Same curve as the client (store.js levelInfo)
export function levelOf(xp) {
  let lv = 1, need = 100, acc = 0;
  while (xp >= acc + need) { acc += need; lv++; need = Math.round(need * 1.18); }
  return lv;
}
const totalXP = p => Object.values(p?.xp || {}).reduce((a, b) => a + (b || 0), 0);

// Deterministic daily selection (mirrors public/js/rewards.js)
export function missionsFor(date, pool) {
  let h = 2166136261;
  for (const c of date) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const list = [...pool], out = [];
  while (out.length < 3 && list.length) { h = Math.imul(h ^ (h >>> 13), 1103515245) >>> 0; out.push(list.splice(h % list.length, 1)[0]); }
  return out;
}
export function metric(p, date, m) {
  const a = p?.act?.[date] || {}, xp = p?.xp?.[date] || 0, goal = p?.profile?.goal || 50;
  const v = { goal: xp >= goal ? 1 : 0, xp, ok: a.ok || 0, rev: a.rev || 0, nw: a.nw || 0 }[m.metric] || 0;
  return Math.min(v, m.n);
}

export const cfg = () => getContent('market')?.rewards || {};

// What a key means, and whether this progress has earned it → { tier } | null
function eligible(key, p) {
  const C = cfg(), missions = C.missions || [];
  let m;
  if ((m = key.match(/^m:(\d{4}-\d{2}-\d{2}):([\w-]+)$/))) {
    if (!okDate(m[1])) return null;
    const mi = missionsFor(m[1], missions).find(x => x.id === m[2]);
    return mi && metric(p, m[1], mi) >= mi.n ? { tier: 'mission', label: mi.t } : null;
  }
  if ((m = key.match(/^d:(\d{4}-\d{2}-\d{2})$/))) {
    if (!okDate(m[1])) return null;
    const ms = missionsFor(m[1], missions);
    return ms.length && ms.every(x => metric(p, m[1], x) >= x.n) ? { tier: 'daily', label: 'Günün tüm görevleri' } : null;
  }
  if ((m = key.match(/^lv:(\d{1,3})$/))) { const n = +m[1]; return n >= 2 && levelOf(totalXP(p)) >= n ? { tier: 'level', label: `Seviye ${n}` } : null; }
  if ((m = key.match(/^b:([\w-]{1,24})$/))) return p?.badges?.[m[1]] ? { tier: 'badge', label: 'Yeni rozet' } : null;
  if ((m = key.match(/^st:(\d{1,4})$/))) { const n = +m[1]; return (C.streakMilestones || []).includes(n) && (p?.streak?.best || 0) >= n ? { tier: 'streak', label: `${n} günlük seri` } : null; }
  return null;
}
// client and server may sit in different timezones: accept yesterday/today/tomorrow
function okDate(d) { const t = Date.now(); return [-1, 0, 1].some(k => dkey(new Date(t + k * DAY)) === d); }

const rint = ([a, b] = [0, 0]) => Math.round(a + Math.random() * Math.max(0, b - a));

function rollItem(user, chance, owned) {
  if (!(Math.random() < chance)) return null;
  const W = cfg().rarityWeights || { common: 60, rare: 28, epic: 10, legendary: 2 };
  const pool = getContent('market').items.filter(i => i.drop && i.enabled !== false && !owned.has(i.id));
  if (!pool.length) return null;
  const tot = pool.reduce((a, i) => a + (W[i.rarity] ?? 10), 0);
  let r = Math.random() * tot;
  for (const i of pool) { r -= W[i.rarity] ?? 10; if (r <= 0) return i; }
  return pool[pool.length - 1];
}

export function claimedKeys(userId) { return q.all('SELECT key FROM rewards WHERE user_id = ?', userId).map(r => r.key); }

export function claim(user, key, ownedIds) {
  const C = cfg();
  if (C.enabled === false) return { error: 'Ödüller şu an kapalı.' };
  if (typeof key !== 'string' || key.length > 60) return { error: 'Geçersiz ödül.' };
  const prev = q.get('SELECT * FROM rewards WHERE user_id = ? AND key = ?', user.id, key);
  if (prev) return { reward: fmt(prev), already: true };
  const row = q.get('SELECT progress FROM users WHERE id = ?', user.id);
  const p = row?.progress ? JSON.parse(row.progress) : null;
  const e = eligible(key, p);
  if (!e) return { error: 'Bu sandık henüz açılamaz.' };
  const tier = C.tiers?.[e.tier] || { coins: [5, 10], xp: [0, 0], drop: 0 };
  const plan = effectivePlan(user), bonus = (featuresFor(plan).coinBonus ?? 100) / 100, premBonus = (featuresFor('premium').coinBonus ?? 100) / 100;
  const base = rint(tier.coins);
  const coins = Math.round(base * bonus);
  const xp = rint(tier.xp);
  const item = rollItem(user, tier.drop || 0, new Set(ownedIds));
  const missed = plan === 'premium' ? 0 : Math.max(0, Math.round(base * premBonus) - coins);
  return tx(() => {
    if (coins > 0) q.run('INSERT INTO purchases (user_id, item_id, source, coins, ts) VALUES (?,?,?,?,?)', user.id, '_coins', 'reward', -coins, Date.now());
    if (item) q.run('INSERT INTO purchases (user_id, item_id, source, coins, ts) VALUES (?,?,?,?,?)', user.id, item.id, 'gift', 0, Date.now());
    q.run('INSERT INTO rewards (user_id, key, tier, coins, xp, item_id, missed, ts) VALUES (?,?,?,?,?,?,?,?)', user.id, key, e.tier, coins, xp, item?.id || null, missed, Date.now());
    return { reward: { key, tier: e.tier, name: tier.name || 'Sandık', label: e.label, coins, xp, item: item?.id || null, missed } };
  });
}
function fmt(r) { return { key: r.key, tier: r.tier, name: cfg().tiers?.[r.tier]?.name || 'Sandık', coins: r.coins, xp: r.xp, item: r.item_id, missed: r.missed || 0 }; }

// Public, per-user rewards state (sent with the market)
export function rewardsState(userId) {
  const C = cfg();
  return {
    enabled: C.enabled !== false,
    missions: C.missions || [],
    streakMilestones: C.streakMilestones || [],
    tiers: Object.fromEntries(Object.entries(C.tiers || {}).map(([k, t]) => [k, { name: t.name, color: t.color }])),
    claimed: claimedKeys(userId),
  };
}

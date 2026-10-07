// Uygulama içeriği ve oturum bilgisi: /api/content → veri depolarını doldurur
import { api } from './api.js';
import { hydrateWords } from './data/words.js';
import { hydratePatterns } from './data/patterns.js';
import { hydratePhonetics } from './data/phonetics.js';

export const APP = { user: null, plan: 'free', level: 'a1', levels: [], features: {}, featuresPremium: {}, plans: [], settings: {}, totals: {}, version: 0 };
export const isPremium = () => APP.plan === 'premium';
export const isAdmin = () => APP.user?.role === 'admin';
// Feature value for the current plan: booleans, or limits where -1 = unlimited
export const feat = k => APP.features?.[k];
export const featOn = k => !!APP.features?.[k];
export const limitOf = k => { const v = APP.features?.[k]; return v === -1 || v == null ? Infinity : v; };
export const levelInfo = (id = APP.level) => APP.levels.find(l => l.id === id) || APP.levels[0];
export const inMyLevel = (item, field) => !item.levels?.length ? false : item.levels.includes(APP.level);

function apply(c) {
  hydrateWords(c); hydratePatterns(c); hydratePhonetics(c);
  Object.assign(APP, { plan: c.plan, level: c.level, levels: c.levels || [], features: c.features || {}, featuresPremium: c.featuresPremium || {}, plans: c.plans || [], settings: c.settings || {}, totals: c.totals || {}, version: c.version });
}

export async function loadContent(level) {
  const lv = level || APP.userLevel || '';
  const key = `pratilange:content:${APP.user?.id}:${lv}`;
  try {
    const c = await api('/api/content' + (lv ? `?level=${encodeURIComponent(lv)}` : ''));
    apply(c);
    try { localStorage.setItem(key, JSON.stringify(c)); } catch { }
  } catch (e) {
    // offline → last cached copy
    const cached = (() => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } })();
    if (!cached) throw e;
    apply(cached);
  }
}

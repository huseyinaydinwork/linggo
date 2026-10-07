// Pip Market durumu: öğeler, sahip olunanlar, yaprak bakiyesi, giyili kıyafet ve uygulama teması
import { api, post } from './api.js';
import { state, save, subscribe } from './store.js';
import { APP } from './content.js';
import { setWardrobe, applyThemeItem, itemById } from './wear.js';

export const M = { items: [], owned: new Set(), balance: 0, loaded: false, rewards: null };
const cacheKey = () => `pratilange:market:${APP.user?.id}`;

export const equip = () => (state().pip ||= { equip: {} }).equip;
function sync() {
  setWardrobe(M.items, equip());
  const mode = applyThemeItem(itemById(equip().theme));
  document.documentElement.dataset.appMode = mode || '';
  window.dispatchEvent(new CustomEvent('pl:wardrobe'));
}
export function apply(d) {
  M.items = d.items || []; M.owned = new Set(d.owned || []); M.balance = d.balance || 0; M.rewards = d.rewards || M.rewards; M.loaded = true;
  try { localStorage.setItem(cacheKey(), JSON.stringify({ items: M.items, owned: [...M.owned], balance: M.balance, rewards: M.rewards })); } catch { }
  window.dispatchEvent(new CustomEvent('pl:market'));
  // drop equipped items the learner no longer owns (e.g. Premium expired)
  const eq = equip();
  for (const [slot, id] of Object.entries(eq)) if (!M.owned.has(id)) delete eq[slot];
  sync();
}
export async function loadMarket() {
  try { const c = JSON.parse(localStorage.getItem(cacheKey()) || 'null'); if (c) { M.items = c.items; M.owned = new Set(c.owned); M.balance = c.balance; M.rewards = c.rewards || null; sync(); } } catch { }
  try { apply(await api('/api/market')); } catch { }
}
export async function buy(id) { apply(await post('/api/market/buy', { id })); }
export function setEquip(slot, id) {
  const eq = equip();
  if (id) eq[slot] = id; else delete eq[slot];
  save(); sync();
}
// when progress arrives from another device, re-apply outfit/theme
subscribe(() => { if (M.loaded) sync(); });

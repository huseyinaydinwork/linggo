// Pip Market ekranı: dene, satın al, giy · temalar
import { M, loadMarket, buy, setEquip, equip } from '../market.js';
import { pip, setMood, setPose } from '../mascot.js';
import { ART, artFor, themeSwatch, currentOutfit } from '../wear.js';
import { icon, esc, sfx, confetti, toast } from '../ui.js';
import { navigate } from '../app.js';
import { isPremium } from '../content.js';
import { paywall, tl } from '../premium.js';
import { track } from '../store.js';
import { toy } from '../motion.js';

const SLOTS = [['hat', '🎩', 'Şapka'], ['glasses', '👓', 'Gözlük'], ['top', '👕', 'Kıyafet'], ['neck', '🧣', 'Aksesuar'], ['gloves', '🧤', 'Eldiven'], ['shoes', '👟', 'Ayakkabı'], ['bg', '🖼️', 'Arka plan'], ['theme', '🎨', 'Tema']];
const RARITY = { common: ['Standart', 'var(--line-2)'], rare: ['Nadir', '#72C4FF'], epic: ['Epik', '#B9A8FF'], legendary: ['Efsane', '#FFD166'] };
let slot = 'hat';

export function marketView(el) {
  let preview = null; // item id being tried on
  let offToy = () => { };
  track('market_view');
  el.innerHTML = `
    <div class="back-row"><button class="icon-btn" data-back aria-label="Geri">${icon.back}</button><p class="eyebrow grow">Pip Market</p><span class="coin-pill" data-coins>🍃 …</span></div>
    <section class="mk-stage" data-stage><div class="mk-pip" data-pip></div><p class="mk-hint">Pip'i sürükle, bırak 👆</p></section>
    <div class="seg mt" role="tablist">${SLOTS.map(([k, e, l]) => `<button data-slot="${k}">${e} ${l}</button>`).join('')}</div>
    <div class="mk-grid mt" data-grid></div>
    <div class="mk-bar" data-bar></div>
    <p class="tiny faint center mt">🍃 Yaprak: her 10 XP = 1 yaprak${isPremium() ? ' · Premium ile 2× kazanırsın' : ''}. Pratik yaptıkça kazanırsın.</p>`;
  const grid = el.querySelector('[data-grid]'), bar = el.querySelector('[data-bar]'), pipBox = el.querySelector('[data-pip]');
  el.querySelector('[data-back]').onclick = () => history.length > 1 ? history.back() : navigate('/home');

  const outfitWith = () => { const o = currentOutfit(); if (preview) { const it = M.items.find(i => i.id === preview); if (it && it.slot !== 'theme') o[it.slot] = it; } return o; };
  function drawPip(mood = 'happy', pose = 'idle') {
    pipBox.innerHTML = pip({ size: 230, outfit: outfitWith(), backdrop: true, mood, pose });
    offToy(); offToy = toy(pipBox);
  }
  function thumb(it) {
    if (it.slot === 'theme') return themeSwatch(it);
    if (it.slot === 'bg') return `<svg viewBox="0 0 220 220" class="mk-thumb">${artFor(it)}</svg>`;
    return pip({ size: 92, outfit: { [it.slot]: it }, mood: 'idle', pose: 'idle', cls: 'mk-mini' });
  }
  const priceTag = it => {
    if (M.owned.has(it.id)) return equip()[it.slot] === it.id ? `<span class="mk-price on">✓ ${it.slot === 'theme' ? 'Aktif' : 'Giyili'}</span>` : '<span class="mk-price own">Sende</span>';
    const p = it.price || {};
    return p.type === 'coins' ? `<span class="mk-price">🍃 ${p.coins}</span>` : p.type === 'premium' ? '<span class="mk-price pro">✦ Pro</span>' : p.type === 'paid' ? `<span class="mk-price paid">${tl(p.try)}</span>` : '<span class="mk-price">Ücretsiz</span>';
  };
  function drawGrid() {
    el.querySelectorAll('[data-slot]').forEach(b => b.classList.toggle('on', b.dataset.slot === slot));
    el.querySelector('[data-coins]').textContent = `🍃 ${M.balance}`;
    const items = M.items.filter(i => i.slot === slot);
    grid.innerHTML = items.map(it => `<button class="mk-item squish ${preview === it.id ? 'sel' : ''} ${M.owned.has(it.id) ? '' : 'locked'}" data-id="${esc(it.id)}" style="--rar:${RARITY[it.rarity]?.[1] || 'var(--line-2)'}">
      ${it.isNew ? '<span class="mk-new">Yeni</span>' : ''}<div class="mk-art">${thumb(it)}</div><b>${esc(it.name)}</b>${priceTag(it)}</button>`).join('') || '<p class="muted center">Bu kategoride henüz öğe yok.</p>';
    grid.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { sfx.tap(); select(b.dataset.id); });
  }
  function drawBar() {
    const it = M.items.find(i => i.id === preview);
    if (!it) { bar.classList.remove('in'); return; }
    const owned = M.owned.has(it.id), on = equip()[it.slot] === it.id, p = it.price || {};
    let btn;
    if (owned) btn = on ? `<button class="btn btn-soft squish" data-act="off">Çıkar</button>` : `<button class="btn btn-primary squish" data-act="wear">${it.slot === 'theme' ? 'Uygula' : 'Giy'}</button>`;
    else if (p.type === 'coins') btn = M.balance >= p.coins ? `<button class="btn btn-lime squish" data-act="buy">🍃 ${p.coins} ile al</button>` : `<button class="btn btn-soft" disabled>🍃 ${p.coins - M.balance} eksik</button>`;
    else if (p.type === 'premium') btn = `<button class="btn btn-lime squish" data-act="pro">✦ Premium ile aç</button>`;
    else if (p.type === 'paid') btn = `<button class="btn btn-primary squish" data-act="pay">${tl(p.try)} · Satın al</button>`;
    else btn = `<button class="btn btn-lime squish" data-act="buy">Ücretsiz al</button>`;
    bar.innerHTML = `<div class="grow"><b>${esc(it.name)}</b><span class="tiny" style="color:${RARITY[it.rarity]?.[1]}">● ${RARITY[it.rarity]?.[0] || ''}</span>${it.desc ? `<p class="tiny faint">${esc(it.desc)}</p>` : ''}</div>${btn}`;
    bar.classList.add('in');
    bar.querySelector('[data-act]')?.addEventListener('click', e => act(it, e.currentTarget.dataset.act));
  }
  function select(id) {
    preview = preview === id ? null : id;
    const it = M.items.find(i => i.id === id);
    drawGrid(); drawBar();
    if (it?.slot === 'theme' && preview) { toast(`“${it.name}” teması: uygulamak için ${M.owned.has(it.id) ? '“Uygula”ya' : 'satın alıp “Uygula”ya'} dokun`); }
    drawPip(preview ? 'wow' : 'happy', preview ? 'cheer' : 'idle');
    setTimeout(() => { const s = pipBox.querySelector('.pip'); setMood(s, 'happy'); setPose(s, 'idle'); }, 1400);
  }
  async function act(it, a) {
    if (a === 'pro') return paywall('item');
    if (a === 'pay') return navigate('/checkout/item/' + encodeURIComponent(it.id));
    if (a === 'buy') {
      try { await buy(it.id); setEquip(it.slot, it.id); sfx.done(); confetti(); toast(`${it.name} artık senin! 🎉`); }
      catch (e) { if (e.data?.need === 'checkout') return navigate('/checkout/item/' + encodeURIComponent(it.id)); if (e.data?.need === 'premium') return paywall('item'); return toast(esc(e.message)); }
    }
    if (a === 'wear') { setEquip(it.slot, it.id); sfx.ok(); }
    if (a === 'off') { setEquip(it.slot, null); sfx.tap(); }
    preview = null; drawGrid(); drawBar(); drawPip('wow', 'cheer');
  }
  el.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => { slot = b.dataset.slot; preview = null; drawGrid(); drawBar(); drawPip(); });
  drawPip(); drawGrid();
  if (!M.loaded) loadMarket().then(() => { if (el.isConnected) { drawGrid(); drawPip(); } });
  else loadMarket().then(() => { if (el.isConnected) drawGrid(); });
  return () => offToy();
}
void ART;

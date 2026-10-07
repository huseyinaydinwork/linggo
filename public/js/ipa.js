// IPA (fonetik alfabe) yardımcıları: kelimenin telaffuzunu göster, seslere ayır, her sesi öğret
import { SOUNDS } from './data/phonetics.js';
import { profile, track } from './store.js';
import { esc, sheet, icon } from './ui.js';
import { pip, setMouth } from './mascot.js';
import { speak } from './speech.js';

export const isUK = () => profile()?.accent === 'uk';
export const ipaFor = w => (w ? (isUK() ? w.uk || w.us : w.us || w.uk) || '' : '');

// symbol → sound id (plus a few symbols that only appear in dictionary transcriptions)
const EXTRA = { 'ɝː': 'er', 'ɝ': 'er', 'ɚ': 'schwa', 'i': 'ee', 'ɛ': 'eh', 'ɡ': 'g', 'ɹ': 'r', 'ɾ': 't', 'ɑ': 'o', 'oʊ': 'oh', 'əʊ': 'oh', 'ɪr': 'ear', 'ɛr': 'air', 'ʊr': 'ure' };
function symbolMap() {
  const m = new Map(Object.entries(EXTRA));
  for (const s of SOUNDS) { m.set(s.ipa, s.id); if (s.us) m.set(s.us, s.id); }
  return m;
}
export function tokenize(ipa) {
  const map = symbolMap();
  const syms = [...map.keys()].sort((a, b) => b.length - a.length);
  const out = []; let i = 0, stress = '';
  while (i < ipa.length) {
    const ch = ipa[i];
    if (ch === 'ˈ' || ch === 'ˌ') { stress = ch; i++; continue; }
    if (ch === ' ') { out.push({ sym: ' ', gap: true }); i++; continue; }
    const hit = syms.find(s => ipa.startsWith(s, i));
    if (hit) { out.push({ sym: hit, id: map.get(hit), stress }); stress = ''; i += hit.length; }
    else { out.push({ sym: ch, stress }); stress = ''; i++; }
  }
  return out;
}

export function ipaChip(w, cls = '') {
  const t = ipaFor(w); if (!t) return '';
  return `<button class="ipa-chip ${cls}" data-ipa="${esc(w.id || w.en)}" aria-label="Telaffuzu öğren: /${esc(t)}/"><span class="ipa">/${esc(t)}/</span><i>${icon.chevron}</i></button>`;
}

// Delegated handler: any [data-ipa] button opens the teaching sheet for that word
export function wireIpa(root, getWordById) {
  root.querySelectorAll('[data-ipa]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const w = getWordById(b.dataset.ipa); if (w) ipaSheet(w);
  }));
}

export function ipaSheet(w) {
  const ipa = ipaFor(w); if (!ipa) return;
  const toks = tokenize(ipa);
  const byId = new Map(SOUNDS.map(s => [s.id, s]));
  track('ipa_view', { w: w.id || w.en });
  const hasStress = /ˈ/.test(ipa);
  sheet(`<div class="sheet-body">
    <div class="row gap between"><div><p class="eyebrow">Telaffuz · ${isUK() ? '🇬🇧 İngiliz' : '🇺🇸 Amerikan'}</p>
      <h3 class="display" style="font-size:40px">${esc(w.en)}</h3>
      <p class="ipa" style="font-size:26px;color:var(--ink-2)">/${esc(ipa)}/</p></div>
      ${pip({ size: 92, mood: 'happy', mouth: 'rest', cls: 'ipa-pip' })}</div>
    <div class="row gap-s"><button class="btn btn-primary grow" data-say>${icon.speaker} Dinle</button><button class="btn btn-soft" data-slow>${icon.snail} Yavaş</button><button class="btn btn-soft" data-step>Ses ses</button></div>
    <p class="small muted">Her sese dokun: Pip ağız şeklini göstersin, örnek kelimeyi dinle.</p>
    <div class="ipa-tokens">${toks.map((t, i) => t.gap ? '<span class="ipa-gap"></span>' : `<button class="ipa-tok ${t.stress ? 'stressed' : ''}" data-i="${i}">
        ${t.stress ? `<em>${t.stress === 'ˈ' ? 'vurgu' : 'yan vurgu'}</em>` : ''}<b class="ipa">${esc(t.sym)}</b><small>${esc(byId.get(t.id)?.words[0] || '')}</small></button>`).join('')}</div>
    <div class="card flat" data-detail><p class="small muted">Bir sese dokun.</p></div>
    <div class="ipa-legend small">
      ${hasStress ? '<span><b class="ipa">ˈ</b> ardından gelen hece <b>vurgulu</b> söylenir</span>' : ''}
      ${/ː/.test(ipa) ? '<span><b class="ipa">ː</b> önceki ses <b>uzun</b></span>' : ''}
      <span><b>/ /</b> arası telaffuzdur, yazılış değil</span>
    </div>
    <a class="btn btn-ghost btn-block" href="#/sounds/ipa" data-close>Tüm IPA seslerini keşfet</a>
  </div>`, {
    onMount: (sh) => {
      const svg = sh.querySelector('.ipa-pip'), detail = sh.querySelector('[data-detail]');
      sh.querySelector('[data-say]').onclick = () => speak(w.en);
      sh.querySelector('[data-slow]').onclick = () => speak(w.en, { rate: 0.55 });
      const show = i => {
        const t = toks[i], s = byId.get(t.id);
        sh.querySelectorAll('.ipa-tok').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
        setMouth(svg, s?.mouth || 'mid');
        detail.innerHTML = s ? `<div class="row gap"><span class="ipa" style="font-size:40px;line-height:1">/${esc(t.sym)}/</span><div class="grow"><b>${esc(s.words.join(' · '))}</b>${s.hard ? ' <span class="tag hard">Türkçede yok</span>' : ''}<p class="small muted" style="margin-top:4px">${esc(s.tip)}</p></div><button class="spk-sm" data-ex="${esc(s.words[0])}">${icon.speaker}</button></div>`
          : `<p class="small">/${esc(t.sym)}/ sesi</p>`;
        detail.querySelector('[data-ex]')?.addEventListener('click', e => speak(e.currentTarget.dataset.ex));
        if (s) speak(s.words[0]);
      };
      sh.querySelectorAll('.ipa-tok').forEach(b => b.onclick = () => show(+b.dataset.i));
      sh.querySelector('[data-step]').onclick = async () => {
        const idx = toks.map((t, i) => t.gap ? -1 : i).filter(i => i >= 0);
        for (const i of idx) { if (!sh.isConnected) return; const s = byId.get(toks[i].id); sh.querySelectorAll('.ipa-tok').forEach(b => b.classList.toggle('on', +b.dataset.i === i)); setMouth(svg, s?.mouth || 'mid'); await new Promise(r => setTimeout(r, 650)); }
        setMouth(svg, 'rest'); await speak(w.en);
      };
      setTimeout(() => speak(w.en), 250);
    }
  });
}

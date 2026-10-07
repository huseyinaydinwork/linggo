// Pip v3 — Linggo'nun filiz fasulyesi. Büyük gözler, hareketli kaşlar, zıplayan yaprak perçemi,
// duygu baloncukları (kalp, yıldız, ter damlası, soru işareti) ve kendi "cik-cik" sesi.
// mood: idle | happy | think | wow | sad | sleep | love | ouch
// pose: idle | wave | cheer | point | think | hold
// mouth: rest | smile | round | open | wide | mid | th | fv | closed
// Koordinatlar 220×220; kıyafet kütüphanesi (wear.js) aynı çapaları kullanır.

import { currentOutfit, artFor } from './wear.js';
import { pipVoice } from './audio.js';

let uid = 0;
const K = '#141414';
const BODY = 'M110 46 C158 46 186 82 189 126 C192 172 160 201 110 201 C60 201 28 172 31 126 C34 82 62 46 110 46Z';

// outfit: undefined → the learner's equipped outfit · false → plain Pip · object → {slot: item}
// backdrop: true → draw the equipped background behind Pip
export function pip({ mood = 'idle', mouth = 'rest', pose = 'idle', size = 160, cls = '', outfit, backdrop = false } = {}) {
  const u = `p${++uid}`;
  const o = outfit === false ? {} : outfit || currentOutfit();
  const g0 = o.gloves ? artFor(o.gloves) : null;
  const glove = g0 && typeof g0 === 'object' ? g0 : null;
  const arm = (side) => {
    const l = side === 'l', x = l ? 8 : 170, rot = l ? -35 : 35, cx = l ? 46 : 174;
    return `<g class="pip-arm pip-arm-${side}"><g transform="rotate(${rot} ${cx} 132)">
      <rect x="${x}" y="122" width="44" height="21" rx="10.5" fill="url(#${u}a)" stroke="${K}" stroke-width="3.4"/>
      ${glove ? glove[side] : `<circle cx="${l ? 14 : 206}" cy="132.5" r="11" fill="url(#${u}a)" stroke="${K}" stroke-width="3.4"/><path d="M${l ? 9 : 211} 126 q${l ? -4 : 4} 2 ${l ? -3 : 3} 6" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>`}
    </g></g>`;
  };
  return `<svg class="pip ${cls}" data-mood="${mood}" data-mouth="${mouth}" data-pose="${pose}" width="${size}" height="${size}" viewBox="0 0 220 220" role="img" aria-label="Pip">
  <defs>
    <radialGradient id="${u}b" cx="34%" cy="26%" r="82%">
      <stop offset="0" stop-color="#F7FFC9"/><stop offset=".3" stop-color="#D9F85C"/><stop offset=".66" stop-color="#9FE04A"/><stop offset="1" stop-color="#4DBE78"/>
    </radialGradient>
    <linearGradient id="${u}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C8F25A"/><stop offset="1" stop-color="#7FD160"/></linearGradient>
    <radialGradient id="${u}y" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#FFFFF4"/><stop offset="1" stop-color="#E4F9C4"/></radialGradient>
    <linearGradient id="${u}l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9FFD9"/><stop offset=".55" stop-color="#5FD99A"/><stop offset="1" stop-color="#2AA56F"/></linearGradient>
    <radialGradient id="${u}i" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#7FF2D6"/><stop offset=".45" stop-color="#1FA89A"/><stop offset=".8" stop-color="#0B4D57"/><stop offset="1" stop-color="#062A31"/></radialGradient>
    <radialGradient id="${u}c" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FF7FA3" stop-opacity=".95"/><stop offset="1" stop-color="#FF7FA3" stop-opacity="0"/></radialGradient>
    <radialGradient id="${u}s" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".24"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <clipPath id="${u}k"><path d="${BODY}"/></clipPath>
  </defs>
  ${backdrop && o.bg ? `<g class="pip-bg">${artFor(o.bg)}</g>` : ''}
  <ellipse class="pip-shadow" cx="110" cy="207" rx="60" ry="7.5" fill="url(#${u}s)"/>
  <g class="pip-float"><g class="pip-squash">
    ${o.top ? artFor(o.top, 'back') : ''}
    <g class="pip-feet">
      <path d="M66 196 C66 184 100 184 100 196 C100 206 66 206 66 196Z" fill="#4DBE78" stroke="${K}" stroke-width="3.4"/>
      <path d="M120 196 C120 184 154 184 154 196 C154 206 120 206 120 196Z" fill="#4DBE78" stroke="${K}" stroke-width="3.4"/>
    </g>
    ${o.shoes ? `<g class="wear-shoes">${artFor(o.shoes)}</g>` : ''}
    <g class="pip-sprout">
      <path d="M110 50 C108 38 112 28 120 20" fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round"/>
      <g class="pip-leaf-r"><path d="M119 22 C124 2 152 -4 166 8 C154 26 134 30 119 22Z" fill="url(#${u}l)" stroke="${K}" stroke-width="3.2" stroke-linejoin="round"/><path d="M123 20 C135 14 148 10 160 9" fill="none" stroke="#1E7A52" stroke-width="1.8" stroke-linecap="round" opacity=".55"/></g>
      <g class="pip-leaf-l"><path d="M113 30 C104 18 84 18 78 28 C88 38 104 38 113 30Z" fill="url(#${u}l)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/></g>
      <path d="M110 50 C98 44 96 32 104 30 C110 29 110 36 105 37" fill="none" stroke="#141414" stroke-width="2.6" stroke-linecap="round"/><circle class="pip-bud" cx="121" cy="19" r="4.5" fill="#FF8FB0" stroke="${K}" stroke-width="2.4"/>
    </g>
    <path class="pip-body" d="${BODY}" fill="url(#${u}b)" stroke="${K}" stroke-width="4"/>
    <path d="M110 128 C146 128 166 148 166 170 C166 191 142 199 110 199 C78 199 54 191 54 170 C54 148 74 128 110 128Z" fill="url(#${u}y)" opacity=".9"/>
    <path d="M58 88 C66 70 80 60 96 56" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".55"/>
    <circle cx="56" cy="102" r="4" fill="#fff" opacity=".6"/>
    <g class="pip-freckles" fill="#5E9E2E" opacity=".5"><circle cx="58" cy="128" r="2"/><circle cx="66" cy="133" r="2"/><circle cx="154" cy="133" r="2"/><circle cx="162" cy="128" r="2"/></g>
    ${o.top ? `<g clip-path="url(#${u}k)" class="wear-top">${artFor(o.top)}</g><path d="${BODY}" fill="none" stroke="${K}" stroke-width="4"/>` : ''}
    ${o.neck ? `<g class="wear-neck">${artFor(o.neck)}</g>` : ''}
    ${arm('l')}${arm('r')}
    <g class="pip-face">
      <g class="pip-eyes">
        <g class="pip-eye"><ellipse cx="82" cy="104" rx="20" ry="23" fill="#fff" stroke="${K}" stroke-width="3.2"/><g class="pip-iris"><circle cx="84" cy="108" r="14" fill="url(#${u}i)"/><circle cx="84" cy="109" r="6" fill="#06161A"/><circle cx="89" cy="102" r="4.6" fill="#fff"/><circle cx="79" cy="113" r="2" fill="#fff" opacity=".85"/></g></g>
        <g class="pip-eye"><ellipse cx="138" cy="104" rx="20" ry="23" fill="#fff" stroke="${K}" stroke-width="3.2"/><g class="pip-iris"><circle cx="140" cy="108" r="14" fill="url(#${u}i)"/><circle cx="140" cy="109" r="6" fill="#06161A"/><circle cx="145" cy="102" r="4.6" fill="#fff"/><circle cx="135" cy="113" r="2" fill="#fff" opacity=".85"/></g></g>
      </g>
      <g class="pip-happy-eyes"><path d="M65 110 Q82 90 99 110"/><path d="M121 110 Q138 90 155 110"/></g>
      <g class="pip-sleep-eyes"><path d="M67 106 Q82 117 97 106"/><path d="M123 106 Q138 117 153 106"/></g>
      <g class="pip-ouch-eyes"><path d="M70 96 L94 106 L70 116"/><path d="M150 96 L126 106 L150 116"/></g>
      <g class="pip-love-eyes"><path d="M82 120 C62 106 68 88 82 98 C96 88 102 106 82 120Z"/><path d="M138 120 C118 106 124 88 138 98 C152 88 158 106 138 120Z"/></g>
      <g class="pip-brows"><path class="b1" d="M66 76 Q80 69 95 74"/><path class="b2" d="M125 74 Q140 69 154 76"/></g>
      ${o.glasses ? `<g class="wear-glasses">${artFor(o.glasses)}</g>` : ''}
      <ellipse cx="58" cy="138" rx="15" ry="9" fill="url(#${u}c)"/>
      <ellipse cx="162" cy="138" rx="15" ry="9" fill="url(#${u}c)"/>
      <g class="pip-mouth" transform="translate(10 8)">
        <g class="m m-rest"><path d="M86 133 Q100 150 114 133 Q100 138 86 133Z" class="m-in"/><rect x="95" y="134" width="10" height="5" rx="1.5" fill="#fff"/></g>
        <g class="m m-smile"><path d="M79 132 Q100 160 121 132 Q100 140 79 132Z" class="m-in"/><path d="M84 133 Q100 138 116 133 L114 137 Q100 141 86 137Z" fill="#fff"/><path d="M92 148 Q100 153 108 148" fill="#FF7A8A"/></g>
        <g class="m m-round"><ellipse cx="100" cy="142" rx="10" ry="12" class="m-lip"/><ellipse cx="100" cy="142" rx="5" ry="6.5" class="m-in"/></g>
        <g class="m m-open"><path d="M84 132 Q100 128 116 132 Q118 160 100 160 Q82 160 84 132Z" class="m-in"/><ellipse cx="100" cy="152" rx="10" ry="5" class="m-tongue"/><rect x="92" y="131" width="16" height="6" rx="2" fill="#fff"/></g>
        <g class="m m-wide"><path d="M76 134 Q100 130 124 134 Q120 160 100 160 Q80 160 76 134Z" class="m-in"/><rect x="86" y="133" width="28" height="6" rx="2" fill="#fff"/><ellipse cx="100" cy="153" rx="12" ry="4.5" class="m-tongue"/></g>
        <g class="m m-mid"><ellipse cx="100" cy="141" rx="11" ry="8.5" class="m-in"/><ellipse cx="100" cy="146" rx="7" ry="3" class="m-tongue"/></g>
        <g class="m m-th"><ellipse cx="100" cy="141" rx="15" ry="9" class="m-in"/><rect x="88" y="133" width="24" height="5" rx="2" fill="#fff"/><rect x="88" y="145" width="24" height="4" rx="2" fill="#fff"/><path d="M89 141 Q100 136 111 141 Q111 151 100 152 Q89 151 89 141Z" class="m-tongue m-tongue-out"/></g>
        <g class="m m-fv"><path d="M84 140 Q100 150 116 140 Q100 146 84 140Z" class="m-lip"/><rect x="88" y="133" width="24" height="8" rx="3" fill="#fff" stroke="${K}" stroke-width="1.5"/></g>
        <g class="m m-closed"><path d="M86 139 Q100 144 114 139" class="m-line m-thick"/></g>
      </g>
    </g>
    ${o.hat ? `<g class="wear-hat">${artFor(o.hat)}</g>` : ''}
  </g></g>
  <g class="pip-fx">
    <g class="pip-zz"><text x="166" y="60">z</text><text x="182" y="40">z</text></g>
    <g class="pip-spark"><path d="M188 66 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" fill="#FFD166" stroke="${K}" stroke-width="2"/><path d="M28 56 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#FF8FAE" stroke="${K}" stroke-width="2"/></g>
    <g class="pip-emote e-heart"><path d="M184 58 C164 44 170 26 184 36 C198 26 204 44 184 58Z" fill="#FF4F7B" stroke="${K}" stroke-width="2.6"/></g>
    <g class="pip-emote e-sweat"><path d="M180 58 C172 70 172 78 180 80 C188 78 188 70 180 58Z" fill="#8FD3FF" stroke="${K}" stroke-width="2.4"/></g>
    <g class="pip-emote e-q"><text x="178" y="56" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="40" fill="#7C6CFF" stroke="${K}" stroke-width="2">?</text></g>
    <g class="pip-emote e-bang"><text x="182" y="56" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="40" fill="#FF6B45" stroke="${K}" stroke-width="2">!</text></g>
    <g class="pip-emote e-note"><path d="M178 60 V32 L198 28 V54" fill="none" stroke="${K}" stroke-width="3.2"/><ellipse cx="174" cy="60" rx="6" ry="5" fill="#141414"/><ellipse cx="194" cy="55" rx="6" ry="5" fill="#141414"/></g>
  </g>
</svg>`;
}

export function setMouth(svg, mouth) { if (svg) svg.dataset.mouth = mouth; }
export function setMood(svg, mood) { if (svg) svg.dataset.mood = mood; }
export function setPose(svg, pose) { if (svg) svg.dataset.pose = pose; }

// Talking animation: flap between shapes while audio plays
export function talk(svg, shapes = ['mid', 'rest', 'open', 'rest', 'smile', 'rest']) {
  let i = 0, alive = true;
  const iv = setInterval(() => { if (!alive) return; setMouth(svg, shapes[i++ % shapes.length]); }, 130);
  return (end = 'rest') => { alive = false; clearInterval(iv); setMouth(svg, end); };
}

// Pupils follow the pointer; returns cleanup
export function lookAt(svg) {
  if (!svg || matchMedia('(pointer: coarse)').matches) return () => { };
  const irises = svg.querySelectorAll('.pip-iris');
  const on = e => {
    const r = svg.getBoundingClientRect();
    const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 300));
    const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / 300));
    irises.forEach(i => i.style.transform = `translate(${dx * 4}px, ${dy * 4}px)`);
  };
  addEventListener('pointermove', on);
  return () => removeEventListener('pointermove', on);
}

// ---------- reactions: a short acted beat (body motion + face + emote + voice), then back to rest
const REACT = {
  ok: { act: 'hop', mood: 'happy', emote: 'spark', voice: 'happy', pose: 'cheer', ms: 900 },
  no: { act: 'wobble', mood: 'ouch', emote: 'sweat', voice: 'ouch', pose: 'hold', ms: 1000 },
  combo: { act: 'flip', mood: 'wow', emote: 'spark', voice: 'wow', pose: 'cheer', ms: 1100 },
  cheer: { act: 'jump', mood: 'wow', emote: 'spark', voice: 'wow', pose: 'cheer', ms: 1300 },
  love: { act: 'hop', mood: 'love', emote: 'heart', voice: 'giggle', pose: 'hold', ms: 1200 },
  poke: { act: 'squish', mood: 'happy', emote: 'note', voice: 'giggle', pose: 'wave', ms: 900 },
  think: { act: 'tilt', mood: 'think', emote: 'q', voice: 'think', pose: 'think', ms: 1300 },
  point: { act: 'lean', mood: 'happy', emote: 'bang', voice: 'happy', pose: 'point', ms: 1400 },
  sad: { act: 'droop', mood: 'sad', emote: 'sweat', voice: 'sad', pose: 'idle', ms: 1300 },
};
export function react(svg, kind = 'ok', { voice = true, rest } = {}) {
  if (!svg) return;
  const r = REACT[kind] || REACT.ok;
  const prev = rest || { mood: svg.dataset.restMood || svg.dataset.mood, pose: svg.dataset.restPose || svg.dataset.pose };
  svg.dataset.restMood = prev.mood; svg.dataset.restPose = prev.pose;
  clearTimeout(svg._rt);
  svg.dataset.act = ''; void svg.getBoundingClientRect();
  svg.dataset.act = r.act; svg.dataset.mood = r.mood; svg.dataset.pose = r.pose; svg.dataset.emote = r.emote;
  if (voice) pipVoice(r.voice);
  svg._rt = setTimeout(() => { svg.dataset.act = ''; svg.dataset.emote = ''; svg.dataset.mood = prev.mood; svg.dataset.pose = prev.pose; }, r.ms);
}

// Make any Pip pokeable: tap → a random playful reaction (+ his voice)
export function pokeable(svg) {
  if (!svg || svg._poke) return;
  svg._poke = true; svg.style.cursor = 'pointer';
  let n = 0;
  svg.addEventListener('click', e => { e.stopPropagation(); n++; react(svg, n % 5 === 0 ? 'love' : n % 3 === 0 ? 'cheer' : 'poke'); });
}

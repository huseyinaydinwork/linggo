// Pip Market çizim kütüphanesi (Pip v4) — 220×220 koordinatlarında kıyafet parçaları
// Çapalar: kafa üstü y≈40 (şapka siperi y≈62), gözler (91,95)/(131,93), gövde 38–182 × 40–186,
// ağız ≈ (113,135), göğüs y≈150–165, eller (36,152)/(184,152), bacaklar 80–98 / 122–140, ayaklar (89,199)/(131,199)
// Yuvalar: hat, glasses, top, bottom, shoes, bag, hand, neck, gloves, face, color, bg, theme

const K = '#0E110F', S = `stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const col = (c, k, d) => (c && c[k]) || d;
const hl = (d, o = .35) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="${o}"/>`;
const leaf = (x, y) => `<path d="M${x} ${y} C${x + 2} ${y - 12} ${x + 10} ${y - 20} ${x + 22} ${y - 22} C${x + 20} ${y - 10} ${x + 12} ${y - 2} ${x} ${y}Z" fill="#8EDC3A" ${S}/><path d="M${x} ${y} C${x + 6} ${y - 8} ${x + 12} ${y - 14} ${x + 18} ${y - 18}" fill="none" stroke="#2E7D3A" stroke-width="1.6"/>`;

export const ART = {
  hat: {
    fedora: c => `<path d="M72 60 C70 30 86 16 110 18 C134 16 150 30 148 60 Z" fill="${col(c, 'c1', '#9A6A3E')}" ${S}/><path d="M92 24 C100 30 120 30 128 24" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="4" stroke-linecap="round"/><rect x="71" y="46" width="78" height="12" fill="${col(c, 'c2', '#4A2E18')}" ${S}/><path d="M34 64 C46 54 174 54 186 64 C176 74 44 74 34 64Z" fill="${col(c, 'c1', '#9A6A3E')}" ${S}/>${hl('M82 36 C84 28 92 24 100 22', .3)}${leaf(128, 20)}`,
    beanie: c => `<path d="M62 64 C60 24 160 24 158 64 Z" fill="${col(c, 'c1', '#FF6B5A')}" ${S}/><rect x="56" y="54" width="108" height="18" rx="9" fill="${col(c, 'c2', '#FFD24A')}" ${S}/><circle cx="110" cy="22" r="11" fill="${col(c, 'c2', '#FFD24A')}" ${S}/>${hl('M78 40 C84 32 94 28 104 27')}`,
    cap: c => `<path d="M60 66 C58 26 162 26 160 66 Z" fill="${col(c, 'c1', '#5FD14A')}" ${S}/><path d="M104 64 C80 58 40 58 22 70 C40 78 86 76 104 72Z" fill="${col(c, 'c2', col(c, 'c1', '#5FD14A'))}" ${S}/><circle cx="110" cy="30" r="5" fill="${col(c, 'c1', '#5FD14A')}" ${S}/><path d="M110 32 L110 64" stroke="${K}" stroke-width="2" opacity=".3"/>${hl('M126 36 C136 40 144 48 148 56')}`,
    bucket: c => `<path d="M70 58 C68 30 152 30 150 58 Z" fill="${col(c, 'c1', '#3F7DDB')}" ${S}/><path d="M50 72 C56 54 164 54 170 72 C150 80 70 80 50 72Z" fill="${col(c, 'c1', '#3F7DDB')}" ${S}/><path d="M70 56 C94 62 126 62 150 56" fill="none" stroke="${col(c, 'c2', '#FFFFFF')}" stroke-width="5"/>`,
    beret: c => `<path d="M58 62 C48 34 92 20 124 26 C160 32 172 52 160 64 C140 70 80 70 58 62Z" fill="${col(c, 'c1', '#D9384A')}" ${S}/><path d="M112 24 L114 14" stroke="${K}" stroke-width="4" stroke-linecap="round"/>`,
    party: c => `<path d="M84 60 L112 -2 L138 60 Z" fill="${col(c, 'c1', '#FF6FB5')}" ${S}/><path d="M98 32 L126 38 M92 48 L132 54 M104 16 L120 20" stroke="${col(c, 'c2', '#4FB3FF')}" stroke-width="5" stroke-linecap="round"/><circle cx="112" cy="0" r="8" fill="${col(c, 'c2', '#4FB3FF')}" ${S}/>`,
    headphones: c => `<path d="M40 104 C36 26 184 26 180 104" fill="none" stroke="${K}" stroke-width="15" stroke-linecap="round"/><path d="M40 104 C36 26 184 26 180 104" fill="none" stroke="${col(c, 'c1', '#1C201D')}" stroke-width="9" stroke-linecap="round"/><rect x="22" y="84" width="28" height="48" rx="13" fill="${col(c, 'c2', '#FFB23F')}" ${S}/><rect x="170" y="82" width="28" height="48" rx="13" fill="${col(c, 'c2', '#FFB23F')}" ${S}/>`,
    flowers: () => `<path d="M58 60 C80 44 140 44 162 60" fill="none" stroke="#45C98F" stroke-width="6" stroke-linecap="round"/>${[[62, 56, '#FFB3CF'], [86, 46, '#FFD24A'], [110, 42, '#FF6B5A'], [134, 46, '#B9A8FF'], [158, 56, '#72C4FF']].map(([x, y, f]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-8" rx="6" ry="8" fill="${f}" stroke="${K}" stroke-width="2" transform="rotate(${a})"/>`).join('')}<circle r="5" fill="#FFF3B0" stroke="${K}" stroke-width="2"/></g>`).join('')}`,
    grad: () => `<path d="M82 46 L82 64 C98 72 122 72 138 64 L138 46 Z" fill="#1D1D20" ${S}/><path d="M48 40 L110 18 L172 40 L110 62 Z" fill="#26262B" ${S}/><path d="M110 40 L160 48 L160 72" fill="none" stroke="#FFD24A" stroke-width="3"/><circle cx="160" cy="76" r="6" fill="#FFD24A" ${S}/>`,
    tophat: c => `<rect x="76" y="0" width="68" height="60" rx="8" fill="${col(c, 'c1', '#1D1D20')}" ${S}/><rect x="76" y="40" width="68" height="12" fill="${col(c, 'c2', '#FF6B5A')}" ${S}/><ellipse cx="110" cy="60" rx="56" ry="11" fill="${col(c, 'c1', '#1D1D20')}" ${S}/>`,
    crown: () => `<path d="M66 62 L70 22 L90 42 L110 10 L130 42 L150 22 L154 62 Z" fill="#FFD24A" ${S}/><circle cx="110" cy="46" r="6" fill="#E5484D" ${S}/><circle cx="84" cy="52" r="4.5" fill="#4FB3FF" ${S}/><circle cx="136" cy="52" r="4.5" fill="#5BE3A8" ${S}/>`,
    cowboy: c => `<path d="M72 58 C68 22 92 12 110 24 C128 12 152 22 148 58 Z" fill="${col(c, 'c1', '#B07A45')}" ${S}/><path d="M26 62 C50 78 170 78 194 62 C184 54 150 58 110 58 C70 58 36 54 26 62 Z" fill="${col(c, 'c1', '#B07A45')}" ${S}/><path d="M74 52 C98 58 122 58 146 52" stroke="#5A3A1E" stroke-width="7" fill="none"/>`,
    wizard: c => `<path d="M66 60 L126 -12 L154 60 Z" fill="${col(c, 'c1', '#4B3FB5')}" ${S}/><ellipse cx="110" cy="60" rx="58" ry="11" fill="${col(c, 'c1', '#4B3FB5')}" ${S}/>${[[112, 24], [132, 40], [98, 46]].map(([x, y]) => `<path d="M${x} ${y - 7} l2.2 5 5.3.6-4 3.6 1.2 5.2-4.7-2.7-4.7 2.7 1.2-5.2-4-3.6 5.3-.6z" fill="${col(c, 'c2', '#FFD24A')}"/>`).join('')}`,
    santa: c => `<path d="M62 62 C60 24 120 10 150 30 C168 42 176 62 184 80" fill="${col(c, 'c1', '#E5484D')}" ${S}/><circle cx="184" cy="84" r="11" fill="#FFFFFF" ${S}/><rect x="54" y="52" width="112" height="18" rx="9" fill="#FFFFFF" ${S}/>`,
    pilot: c => `<path d="M58 70 C54 24 166 24 162 70 L162 84 L150 84 L150 66 C130 58 90 58 70 66 L70 84 L58 84 Z" fill="${col(c, 'c1', '#7A4B2A')}" ${S}/><rect x="72" y="42" width="30" height="20" rx="10" fill="#9FD6FF" ${S}/><rect x="118" y="42" width="30" height="20" rx="10" fill="#9FD6FF" ${S}/><path d="M102 52 L118 52" stroke="${K}" stroke-width="4"/>`,
  },
  glasses: {
    shades: c => `<path d="M64 80 L110 80 L106 108 C104 116 72 116 70 108 Z M112 78 L158 78 L154 106 C152 114 120 114 118 106 Z" fill="${col(c, 'c1', '#0B0B0D')}" ${S}/><path d="M110 82 L112 82" stroke="${K}" stroke-width="5"/><path d="M64 82 L44 78 M158 80 L178 76" stroke="${K}" stroke-width="4" stroke-linecap="round"/><path d="M74 86 L88 86 M122 84 L136 84" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".45"/>`,
    sun: c => `<g stroke="${K}" stroke-width="3.5"><rect x="66" y="78" width="46" height="36" rx="16" fill="${col(c, 'c1', '#1B1B22')}"/><rect x="110" y="76" width="46" height="36" rx="16" fill="${col(c, 'c1', '#1B1B22')}"/></g><path d="M66 90 L46 86 M156 88 L176 84" stroke="${K}" stroke-width="4" stroke-linecap="round"/><path d="M74 88 L88 88 M118 86 L132 86" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>`,
    round: c => `<g fill="rgba(255,255,255,.15)" stroke="${col(c, 'c1', '#0E110F')}" stroke-width="4.5"><circle cx="91" cy="95" r="23"/><circle cx="131" cy="93" r="23"/></g><path d="M68 92 L48 86 M154 90 L174 84" fill="none" stroke="${col(c, 'c1', '#0E110F')}" stroke-width="4" stroke-linecap="round"/>`,
    heart: c => `${[[91, 95], [131, 93]].map(([x, y]) => `<path d="M${x} ${y + 22} C${x - 32} ${y + 2} ${x - 22} ${y - 22} ${x} ${y - 8} C${x + 22} ${y - 22} ${x + 32} ${y + 2} ${x} ${y + 22} Z" fill="${col(c, 'c1', '#FF4F7B')}" fill-opacity=".9" ${S}/>`).join('')}`,
    star: c => `${[[91, 95], [131, 93]].map(([x, y]) => `<path d="M${x} ${y - 22} l8 16 18 3 -13 12 3 18 -16 -9 -16 9 3 -18 -13 -12 18 -3z" fill="${col(c, 'c1', '#FFD24A')}" fill-opacity=".92" ${S}/>`).join('')}`,
    sport: c => `<path d="M58 88 C80 74 142 72 164 84 C160 104 146 112 130 110 C120 108 116 100 111 100 C106 100 102 110 90 112 C74 114 62 104 58 88Z" fill="${col(c, 'c1', '#2F7BFF')}" ${S}/><path d="M72 88 C92 82 130 80 150 86" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".5" fill="none"/>`,
    cat: c => `${[[91, 95], [131, 93]].map(([x, y]) => `<path d="M${x - 24} ${y - 8} C${x - 10} ${y - 16} ${x + 18} ${y - 18} ${x + 24} ${y - 12} C${x + 22} ${y + 10} ${x + 10} ${y + 18} ${x} ${y + 18} C${x - 14} ${y + 18} ${x - 22} ${y + 6} ${x - 24} ${y - 8}Z" fill="${col(c, 'c1', '#FF6FB5')}" fill-opacity=".85" ${S}/>`).join('')}`,
    professor: c => `<path d="M68 96 L112 96 M110 94 L154 94" stroke="${col(c, 'c1', '#6B3E1E')}" stroke-width="6" stroke-linecap="round"/><path d="M70 96 C70 116 110 116 110 96 M112 94 C112 114 152 114 152 94" fill="rgba(255,255,255,.18)" stroke="${K}" stroke-width="2.5"/>`,
    vr: c => `<rect x="58" y="72" width="104" height="46" rx="18" fill="${col(c, 'c1', '#F1F1F4')}" ${S}/><rect x="66" y="80" width="88" height="30" rx="12" fill="#1B1B22"/><path d="M58 94 L40 90 M162 94 L180 90" stroke="${K}" stroke-width="6" stroke-linecap="round"/>`,
    ski: c => `<path d="M40 92 L180 88" stroke="${col(c, 'c2', '#1C201D')}" stroke-width="12" stroke-linecap="round"/><rect x="60" y="72" width="100" height="42" rx="20" fill="url(#skiG)" ${S}/><defs><linearGradient id="skiG" x1="0" x2="1"><stop offset="0" stop-color="${col(c, 'c1', '#FF9A3D')}"/><stop offset="1" stop-color="#B26CFF"/></linearGradient></defs>`,
  },
  top: {
    hoodie: c => `<rect x="0" y="146" width="220" height="80" fill="${col(c, 'c1', '#16181A')}"/><path d="M58 150 C80 166 140 166 162 150" fill="none" stroke="${col(c, 'c2', '#2A2E30')}" stroke-width="12" stroke-linecap="round"/><path d="M100 160 L98 180 M120 160 L122 180" stroke="#E9E9E9" stroke-width="3" stroke-linecap="round"/><path d="M80 176 L140 176 L134 190 L86 190 Z" fill="rgba(255,255,255,.06)" ${S}/><path d="M24 146 L196 146" stroke="${K}" stroke-width="3"/>`,
    tee: c => `<rect x="0" y="148" width="220" height="80" fill="${col(c, 'c1', '#4FB3FF')}"/><path d="M88 148 Q110 166 132 148" fill="none" ${S}/><path d="M22 150 L198 150" stroke="${K}" stroke-width="3"/>`,
    stripes: c => `<rect x="0" y="146" width="220" height="80" fill="${col(c, 'c2', '#FFF1E6')}"/>${[154, 170, 186].map(y => `<rect x="0" y="${y}" width="220" height="8" fill="${col(c, 'c1', '#FF6B5A')}"/>`).join('')}<path d="M20 146 L200 146" stroke="${K}" stroke-width="3"/>`,
    sweat: c => `<rect x="0" y="146" width="220" height="80" fill="${col(c, 'c1', '#8B6CFF')}"/><path d="M84 146 Q110 162 136 146" fill="none" stroke="${col(c, 'c2', '#FFFFFF')}" stroke-width="5"/><text x="110" y="180" text-anchor="middle" font-family="Nunito, Arial" font-weight="900" font-size="15" fill="${col(c, 'c2', '#FFFFFF')}">EN</text><path d="M20 146 L200 146" stroke="${K}" stroke-width="3"/>`,
    jacket: c => `<rect x="0" y="144" width="220" height="80" fill="${col(c, 'c1', '#2F5D46')}"/><path d="M110 150 L110 190" stroke="${K}" stroke-width="3"/><path d="M92 144 L110 162 L128 144" fill="#EDE7D8" ${S}/><circle cx="104" cy="172" r="2.5" fill="${K}"/><circle cx="104" cy="182" r="2.5" fill="${K}"/><rect x="70" y="170" width="22" height="10" rx="2" fill="rgba(0,0,0,.18)"/><path d="M20 144 L200 144" stroke="${K}" stroke-width="3"/>`,
    jersey: c => `<rect x="0" y="146" width="220" height="80" fill="${col(c, 'c1', '#E5484D')}"/><path d="M92 146 L110 166 L128 146" fill="none" stroke="${col(c, 'c2', '#FFFFFF')}" stroke-width="6"/><text x="110" y="190" text-anchor="middle" font-family="Nunito, Arial" font-weight="900" font-size="22" fill="${col(c, 'c2', '#FFFFFF')}" stroke="${K}" stroke-width="1.2">10</text><path d="M20 146 L200 146" stroke="${K}" stroke-width="3"/>`,
    raincoat: c => `<rect x="0" y="142" width="220" height="80" fill="${col(c, 'c1', '#FFD24A')}"/><path d="M110 146 L110 192" stroke="${K}" stroke-width="3"/>${[156, 170, 184].map(y => `<rect x="106" y="${y}" width="8" height="4" rx="2" fill="${K}"/>`).join('')}<path d="M60 142 C80 156 140 156 160 142" fill="none" stroke="${K}" stroke-width="3"/><path d="M20 142 L200 142" stroke="${K}" stroke-width="3"/>`,
    space: () => `<rect x="0" y="142" width="220" height="80" fill="#F2F4F7"/><rect x="92" y="160" width="36" height="22" rx="5" fill="#C9D2DE" ${S}/><circle cx="102" cy="171" r="3.5" fill="#E5484D"/><circle cx="114" cy="171" r="3.5" fill="#5BE3A8"/><path d="M54 146 C80 162 140 162 166 146" fill="none" stroke="#FF8A3D" stroke-width="7"/><path d="M20 142 L200 142" stroke="${K}" stroke-width="3"/>`,
    suit: c => `<rect x="0" y="144" width="220" height="80" fill="${col(c, 'c1', '#262A33')}"/><path d="M92 144 L110 196 L128 144 Z" fill="#FFFFFF" ${S}/><path d="M104 150 L110 160 L116 150 L113 178 L110 184 L107 178 Z" fill="${col(c, 'c2', '#E5484D')}" ${S}/><path d="M92 144 L102 172 M128 144 L118 172" stroke="${K}" stroke-width="3"/><path d="M20 144 L200 144" stroke="${K}" stroke-width="3"/>`,
    tux: () => `<rect x="0" y="146" width="220" height="80" fill="#1D1D20"/><path d="M88 146 L110 204 L132 146 Z" fill="#FFFFFF" ${S}/><path d="M98 150 L110 158 L98 166 Z M122 150 L110 158 L122 166 Z" fill="#E5484D" ${S}/><path d="M20 146 L200 146" stroke="${K}" stroke-width="3"/>`,
    cape: c => `<path d="M60 148 Q110 164 160 148" fill="none" stroke="${col(c, 'c2', '#FFD24A')}" stroke-width="7"/><circle cx="64" cy="148" r="7" fill="${col(c, 'c2', '#FFD24A')}" ${S}/><circle cx="156" cy="148" r="7" fill="${col(c, 'c2', '#FFD24A')}" ${S}/>`,
  },
  bottom: {
    jeans: c => `<rect x="0" y="168" width="220" height="40" fill="${col(c, 'c1', '#3C6FB5')}"/><path d="M20 168 L200 168" stroke="${K}" stroke-width="3"/><path d="M110 170 L110 190" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-dasharray="3 3"/>`,
    shorts: c => `<rect x="0" y="168" width="220" height="40" fill="${col(c, 'c1', '#C9A36B')}"/><path d="M20 168 L200 168" stroke="${K}" stroke-width="3"/>`,
    joggers: c => `<rect x="0" y="168" width="220" height="40" fill="${col(c, 'c1', '#2B2F33')}"/><path d="M20 168 L200 168" stroke="${K}" stroke-width="3"/><path d="M40 170 L40 190 M180 170 L180 190" stroke="${col(c, 'c2', '#C8F53C')}" stroke-width="4"/>`,
    skirt: c => `<path d="M34 164 L186 164 L196 196 L24 196 Z" fill="${col(c, 'c1', '#FF6FB5')}"/><path d="M20 164 L200 164" stroke="${K}" stroke-width="3"/>`,
  },
  shoes: {
    sneakers: c => [89, 131].map(x => `<path d="M${x - 17} 200 C${x - 17} 186 ${x + 14} 184 ${x + 18} 196 L${x + 19} 205 L${x - 18} 205 Z" fill="${col(c, 'c1', '#F4F1E6')}" ${S}/><rect x="${x - 19}" y="201" width="38" height="7" rx="3.5" fill="${col(c, 'c2', '#C8F53C')}" ${S}/><path d="M${x - 6} 190 L${x + 6} 193" stroke="${K}" stroke-width="2"/>`).join(''),
    rain: c => [89, 131].map(x => `<path d="M${x - 14} 178 L${x + 11} 178 L${x + 13} 196 C${x + 22} 196 ${x + 22} 207 ${x + 13} 207 L${x - 16} 207 Z" fill="${col(c, 'c1', '#FFD24A')}" ${S}/>`).join(''),
    boots: c => [89, 131].map(x => `<path d="M${x - 14} 180 L${x + 10} 180 L${x + 12} 195 C${x + 22} 195 ${x + 22} 207 ${x + 13} 207 L${x - 16} 207 Z" fill="${col(c, 'c1', '#8A5A34')}" ${S}/><rect x="${x - 16}" y="203" width="32" height="5" rx="2" fill="#3A2416"/>`).join(''),
    gold: () => [89, 131].map(x => `<path d="M${x - 17} 200 C${x - 17} 186 ${x + 14} 184 ${x + 18} 196 L${x + 19} 205 L${x - 18} 205 Z" fill="#FFD24A" ${S}/>${hl(`M${x - 8} 192 L${x} 190`, .7)}`).join(''),
    slippers: c => [89, 131].map(x => `<ellipse cx="${x}" cy="202" rx="18" ry="8" fill="${col(c, 'c1', '#FFB3CF')}" ${S}/><circle cx="${x + 8}" cy="196" r="5" fill="#FFFFFF" ${S}/>`).join(''),
  },
  bag: {
    backpack: c => `<path d="M150 88 C160 110 164 140 160 176" fill="none" stroke="${col(c, 'c2', '#2A2E30')}" stroke-width="9" stroke-linecap="round"/><path d="M150 88 C160 110 164 140 160 176" fill="none" stroke="${K}" stroke-width="2" opacity=".4"/>`,
    sling: c => `<path d="M62 84 L156 160" stroke="${col(c, 'c1', '#C9803A')}" stroke-width="8" stroke-linecap="round"/><rect x="140" y="150" width="40" height="30" rx="8" fill="${col(c, 'c1', '#C9803A')}" ${S}/><path d="M140 162 L180 162" stroke="${K}" stroke-width="2.5"/>`,
    satchel: c => `<path d="M160 88 L70 164" stroke="${col(c, 'c1', '#6B3E1E')}" stroke-width="7" stroke-linecap="round"/><rect x="36" y="150" width="50" height="38" rx="8" fill="${col(c, 'c1', '#6B3E1E')}" ${S}/><path d="M36 162 L86 162 L86 172 L36 172" fill="rgba(255,255,255,.12)"/>`,
  },
  hand: {
    book: c => `<g transform="rotate(-12 186 170)"><rect x="168" y="152" width="36" height="44" rx="4" fill="${col(c, 'c1', '#E5484D')}" ${S}/><rect x="172" y="152" width="4" height="44" fill="rgba(0,0,0,.25)"/><text x="190" y="178" text-anchor="middle" font-family="Nunito, Arial" font-weight="900" font-size="13" fill="#fff">EN</text></g>`,
    laptop: c => `<g transform="rotate(-8 186 170)"><rect x="162" y="148" width="48" height="32" rx="4" fill="${col(c, 'c1', '#C9CDD4')}" ${S}/><rect x="167" y="153" width="38" height="22" rx="2" fill="#20303A"/><circle cx="186" cy="164" r="4" fill="${col(c, 'c2', '#C8F53C')}"/><rect x="156" y="180" width="60" height="7" rx="3" fill="${col(c, 'c1', '#C9CDD4')}" ${S}/></g>`,
    coffee: c => `<path d="M174 150 L200 150 L196 186 L178 186 Z" fill="${col(c, 'c1', '#F4F1E6')}" ${S}/><rect x="172" y="144" width="30" height="8" rx="3" fill="${col(c, 'c2', '#6B3E1E')}" ${S}/><rect x="176" y="162" width="22" height="12" fill="${col(c, 'c2', '#6B3E1E')}"/><path d="M182 138 C178 132 186 128 182 122 M192 138 C188 132 196 128 192 122" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7" stroke-linecap="round"/>`,
    phone: c => `<g transform="rotate(-10 186 170)"><rect x="174" y="146" width="26" height="46" rx="6" fill="${col(c, 'c1', '#1C201D')}" ${S}/><rect x="177" y="151" width="20" height="34" rx="3" fill="#7FD6FF"/></g>`,
    camera: c => `<rect x="164" y="152" width="44" height="30" rx="6" fill="${col(c, 'c1', '#2B2F33')}" ${S}/><circle cx="186" cy="167" r="10" fill="#1B1B22" stroke="#9FB0C0" stroke-width="3"/><rect x="194" y="146" width="10" height="7" rx="2" fill="${col(c, 'c1', '#2B2F33')}" ${S}/>`,
    tablet: c => `<rect x="160" y="140" width="46" height="58" rx="7" fill="${col(c, 'c1', '#FF6FB5')}" ${S}/><rect x="165" y="146" width="36" height="46" rx="3" fill="#EAF6FF"/><path d="M170 158 L194 158 M170 166 L188 166 M170 174 L192 174" stroke="#8B6CFF" stroke-width="3" stroke-linecap="round"/>`,
  },
  neck: {
    bowtie: c => `<path d="M90 152 L108 160 L90 168 Z M132 152 L114 160 L132 168 Z" fill="${col(c, 'c1', '#E5484D')}" ${S}/><circle cx="111" cy="160" r="5.5" fill="${col(c, 'c1', '#E5484D')}" ${S}/>`,
    scarf: c => `<path d="M48 148 C80 164 140 164 172 148 L174 162 C140 180 80 180 46 162 Z" fill="${col(c, 'c1', '#FFD24A')}" ${S}/><path d="M66 158 L72 170 M90 162 L94 174 M128 162 L124 174 M152 158 L146 170" stroke="${col(c, 'c2', '#FF6B5A')}" stroke-width="5"/><path d="M134 166 L146 198 L128 198 L122 170 Z" fill="${col(c, 'c1', '#FFD24A')}" ${S}/>`,
    necklace: c => `<path d="M72 146 C86 170 136 170 150 146" fill="none" stroke="${col(c, 'c1', '#FFD24A')}" stroke-width="3.5"/><path d="M111 164 l8 10 -8 10 -8 -10z" fill="#4FB3FF" ${S}/>`,
    medal: () => `<path d="M94 146 L106 168 M128 146 L116 168" stroke="#E5484D" stroke-width="8"/><circle cx="111" cy="178" r="12" fill="#FFD24A" ${S}/><path d="M111 170 l2.5 5 5.5.6-4 3.8 1 5.4-5-2.6-5 2.6 1-5.4-4-3.8 5.5-.6z" fill="#E8A700"/>`,
  },
  gloves: {
    cartoon: () => ({ l: `<circle cx="37" cy="153" r="13" fill="#FFFFFF" ${S}/>`, r: `<circle cx="183" cy="153" r="13" fill="#FFFFFF" ${S}/>` }),
    mitten: c => ({ l: `<ellipse cx="37" cy="153" rx="14" ry="12" fill="${col(c, 'c1', '#FF6B5A')}" ${S}/><rect x="30" y="138" width="16" height="8" rx="3" fill="#FFF1E6" ${S}/>`, r: `<ellipse cx="183" cy="153" rx="14" ry="12" fill="${col(c, 'c1', '#FF6B5A')}" ${S}/><rect x="174" y="138" width="16" height="8" rx="3" fill="#FFF1E6" ${S}/>` }),
    boxing: c => ({ l: `<circle cx="36" cy="154" r="17" fill="${col(c, 'c1', '#E5484D')}" ${S}/>${hl('M28 146 C32 142 38 142 42 146', .6)}`, r: `<circle cx="184" cy="154" r="17" fill="${col(c, 'c1', '#E5484D')}" ${S}/>${hl('M178 146 C182 142 188 142 192 146', .6)}` }),
  },
  face: {}, color: {},
  // drawn behind the body
  back: {
    cape: c => `<path d="M58 124 C20 166 30 212 110 214 C190 212 200 166 162 124 Z" fill="${col(c, 'c1', '#E5484D')}" ${S}/>`,
    backpack: c => `<rect x="146" y="92" width="52" height="82" rx="18" fill="${col(c, 'c1', '#1B1E20')}" ${S}/><rect x="166" y="130" width="30" height="32" rx="9" fill="${col(c, 'c2', '#2A2E30')}" ${S}/><path d="M170 140 L192 140" stroke="${K}" stroke-width="2.5"/>`,
    jeans: c => [89, 131].map(x => `<rect x="${x - 11}" y="166" width="22" height="30" rx="4" fill="${col(c, 'c1', '#3C6FB5')}" ${S}/>`).join(''),
    shorts: c => [89, 131].map(x => `<rect x="${x - 12}" y="166" width="24" height="14" rx="4" fill="${col(c, 'c1', '#C9A36B')}" ${S}/>`).join(''),
    joggers: c => [89, 131].map(x => `<rect x="${x - 11}" y="166" width="22" height="30" rx="5" fill="${col(c, 'c1', '#2B2F33')}" ${S}/><rect x="${x - 11}" y="190" width="22" height="6" rx="3" fill="${col(c, 'c2', '#C8F53C')}"/>`).join(''),
    skirt: () => '',
  },
  bg: {
    sunny: () => `<rect width="220" height="220" rx="44" fill="#BFE7FF"/><circle cx="178" cy="44" r="22" fill="#FFD166"/><ellipse cx="50" cy="60" rx="30" ry="12" fill="#fff" opacity=".85"/><rect y="170" width="220" height="50" fill="#9EE08A"/>`,
    confetti: () => `<rect width="220" height="220" rx="44" fill="#FFF3E0"/>${Array.from({ length: 34 }, (_, i) => `<rect x="${(i * 53) % 210}" y="${(i * 37) % 210}" width="8" height="5" rx="2" fill="${['#FF6B45', '#7C6CFF', '#72C4FF', '#FFB3CF', '#FFD166', '#6FE0B0'][i % 6]}" transform="rotate(${(i * 47) % 180} ${(i * 53) % 210} ${(i * 37) % 210})"/>`).join('')}`,
    night: () => `<rect width="220" height="220" rx="44" fill="#1C2046"/>${Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 61) % 214}" cy="${(i * 29) % 150}" r="${i % 3 ? 1.4 : 2.4}" fill="#fff" opacity=".85"/>`).join('')}<path d="M180 30 A22 22 0 1 0 196 62 A18 18 0 1 1 180 30 Z" fill="#FFE9A8"/><rect y="182" width="220" height="38" fill="#141736"/>`,
    beach: () => `<rect width="220" height="220" rx="44" fill="#A7E3FF"/><circle cx="170" cy="50" r="20" fill="#FFD166"/><rect y="132" width="220" height="40" fill="#39B6E0"/><path d="M0 142 Q30 136 60 142 T120 142 T180 142 T240 142" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/><rect y="170" width="220" height="50" fill="#F5D59A"/>`,
    library: () => `<rect width="220" height="220" rx="44" fill="#6B4430"/>${[20, 80, 140].map(y => `<rect x="0" y="${y + 44}" width="220" height="8" fill="#4A2E20"/>${Array.from({ length: 13 }, (_, i) => `<rect x="${6 + i * 16}" y="${y + (i % 3) * 4}" width="12" height="${44 - (i % 3) * 4}" rx="2" fill="${['#E5484D', '#FFD166', '#72C4FF', '#6FE0B0', '#B9A8FF'][i % 5]}"/>`).join('')}`).join('')}`,
    london: () => `<rect width="220" height="220" rx="44" fill="#CFD8E3"/><rect x="150" y="30" width="30" height="160" fill="#8A7A5A"/><path d="M146 30 L165 4 L184 30 Z" fill="#6A5A3A"/><circle cx="165" cy="58" r="11" fill="#F5F0DC" stroke="#3A2E1A" stroke-width="2"/><rect x="10" y="150" width="90" height="40" rx="8" fill="#D62828"/><rect x="16" y="156" width="78" height="12" fill="#FFE8B0"/><circle cx="30" cy="192" r="7" fill="#1D1D20"/><circle cx="82" cy="192" r="7" fill="#1D1D20"/><rect y="194" width="220" height="26" fill="#8C95A0"/>`,
    nyc: () => `<rect width="220" height="220" rx="44" fill="#FFCFA0"/>${[[0, 110, 34], [30, 70, 28], [56, 130, 30], [84, 40, 26], [108, 96, 32], [138, 60, 26], [162, 120, 30], [190, 86, 30]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${220 - y}" fill="#3A3150"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${x + 6}" y="${y + 10 + i * 16}" width="4" height="6" fill="#FFD166" opacity=".8"/>`).join('')}`).join('')}<path d="M97 40 L97 20 L100 10 L103 20 L103 40" fill="#3A3150"/>`,
  },
};

// The signature look (brand visuals: splash, landing, banners)
export const SIGNATURE = {
  hat: { slot: 'hat', art: 'fedora', colors: {} },
  glasses: { slot: 'glasses', art: 'shades', colors: {} },
  top: { slot: 'top', art: 'hoodie', colors: {} },
  bag: { slot: 'bag', art: 'backpack', colors: {} },
  shoes: { slot: 'shoes', art: 'sneakers', colors: {} },
};
export const look = (...parts) => Object.fromEntries(parts.map(p => typeof p === 'string' ? [SIGNATURE[p].slot, SIGNATURE[p]] : [p.slot, p]));

// ---------- current outfit (set from the market module)
let ITEMS = new Map(), EQUIP = {}, TINT = {};
export function setWardrobe(items, equip, tint) { ITEMS = new Map((items || []).map(i => [i.id, i])); EQUIP = { ...(equip || {}) }; TINT = { ...(tint || {}) }; }
export const equipped = () => EQUIP;
export const itemById = id => ITEMS.get(id);
// an item as the learner wears it (their chosen colour variant applied)
export const tinted = (it, c1 = TINT[it?.id]) => it && c1 ? { ...it, colors: { ...(it.colors || {}), c1 } } : it;
export function currentOutfit() {
  const o = {};
  for (const [slot, id] of Object.entries(EQUIP)) { const it = ITEMS.get(id); if (it && it.slot === slot) o[slot] = tinted(it); }
  return o;
}

// SVG snippet for an item in its slot (custom SVG from the admin panel is already sanitized server-side)
export function artFor(item, part) {
  if (!item) return '';
  if (item.art === 'custom') return part === 'front' || part === undefined ? (item.svg || '') : '';
  const lib = part === 'back' ? ART.back : ART[item.slot];
  const f = lib?.[item.art];
  return f ? f(item.colors || {}) : '';
}

// ---------- fonts a theme may use (Google Fonts, loaded on demand)
export const FONTS = {
  display: ['Nunito', 'Fredoka', 'Baloo 2', 'Bricolage Grotesque', 'Outfit', 'Space Grotesk', 'Righteous', 'Playfair Display'],
  accent: ['Caveat', 'Kalam', 'Pacifico', 'Gochi Hand', 'Shadows Into Light', 'Instrument Serif'],
};
const WEIGHTS = { 'Nunito': '600;800;900', 'Fredoka': '500;600;700', 'Baloo 2': '600;700;800', 'Bricolage Grotesque': '600;800', 'Outfit': '600;800', 'Space Grotesk': '600;700', 'Righteous': '400', 'Playfair Display': '700;900', 'Caveat': '600;700', 'Kalam': '700', 'Pacifico': '400', 'Gochi Hand': '400', 'Shadows Into Light': '400', 'Instrument Serif': '400' };
const loaded = new Set(['Nunito', 'Caveat', 'Inter']);
export function ensureFont(f) {
  if (!f || loaded.has(f) || !WEIGHTS[f]) return;
  loaded.add(f);
  const l = document.createElement('link'); l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@${WEIGHTS[f]}&display=swap`;
  document.head.appendChild(l);
}
const stack = (f, kind) => kind === 'accent' ? `'${f}', 'Caveat', cursive` : `'${f}', 'Nunito', ui-rounded, system-ui, sans-serif`;

// Themes: CSS variables (+ fonts) applied to <html>
const THEME_KEYS = ['--bg', '--bg-2', '--card', '--card-2', '--lime', '--lime-2', '--lime-ink', '--grad-lime', '--dark-panel', '--grad-mesh', '--bg-art', '--coral', '--violet', '--sky', '--pink', '--sun', '--mint', '--line', '--track', '--f-display', '--f-accent', '--accent-ink'];
export function applyThemeItem(item) {
  const root = document.documentElement;
  THEME_KEYS.forEach(k => root.style.removeProperty(k));
  root.removeAttribute('data-app-theme');
  if (!item?.theme) return null;
  for (const [k, v] of Object.entries(item.theme.tokens || {})) if (THEME_KEYS.includes(k)) root.style.setProperty(k, v);
  const fo = item.theme.fonts || {};
  if (fo.display) { ensureFont(fo.display); root.style.setProperty('--f-display', stack(fo.display, 'display')); }
  if (fo.accent) { ensureFont(fo.accent); root.style.setProperty('--f-accent', stack(fo.accent, 'accent')); }
  root.dataset.appTheme = item.id;
  return item.theme.dark ? 'dark' : 'light';
}
export function themeSwatch(item) {
  const t = item.theme?.tokens || {}, dark = item.theme?.dark !== false && !t['--bg'] ? true : item.theme?.dark;
  const bg = t['--bg'] || (dark ? '#08110B' : '#F4F1E6'), card = t['--card'] || (dark ? '#111E15' : '#FFFDF6'), acc = t['--grad-lime'] || 'linear-gradient(180deg,#DDFF7A,#B9EC2A)', panel = t['--dark-panel'] || '#0F1D14';
  const art = t['--bg-art'] ? `${t['--bg-art']}, ` : '', mesh = t['--grad-mesh'] ? `${t['--grad-mesh']}, ` : '';
  const fo = item.theme?.fonts || {};
  if (fo.display) ensureFont(fo.display); if (fo.accent) ensureFont(fo.accent);
  const ink = dark ? '#F4F1E6' : '#0F1A12';
  return `<div class="swatch" style="background:${art}${bg};color:${ink}"><b class="sw-type" style="font-family:${stack(fo.display || 'Nunito', 'display')}">Aa</b><i class="sw-acc" style="font-family:${stack(fo.accent || 'Caveat', 'accent')};color:${t['--lime'] || '#C8F53C'}">sen.</i><i class="sw-card" style="background:${card}"></i><i class="sw-btn" style="background:${acc}"></i><i class="sw-panel" style="background:${mesh}${panel}"></i></div>`;
}

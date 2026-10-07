// Cümle kalıpları: kategori listesi + kalıp detay sayfası
import { PATTERNS, PATTERN_CATS, getPattern } from '../data/patterns.js';
import { state, patternDue } from '../store.js';
import { icon, esc } from '../ui.js';
import { speak } from '../speech.js';
import { navigate } from '../app.js';
import { paywall, lockIcon, canStartPattern, dailyLeft } from '../premium.js';
import { maybeTour } from '../tours.js';
import { APP } from '../content.js';

const lvBars = lv => `<span class="lv" aria-label="Seviye ${lv}/4">${[1, 2, 3, 4].map(i => `<i class="${i <= lv ? 'on' : ''}"></i>`).join('')}</span>`;

export function patternsView(el) {
  const S = state();
  const learned = Object.keys(S.patterns).length;
  const due = patternDue();
  const next = PATTERNS.find(p => !p.locked && !S.patterns[p.id]);
  const nextOk = next && canStartPattern(next.id), left = dailyLeft('patterns', 'patternsPerDay');

  el.innerHTML = `
    <header class="topbar"><h1 class="h1">Kalıplar</h1><a class="icon-btn" href="#/profile/settings" aria-label="Ayarlar">${icon.settings}</a></header>
    <p class="muted">Akıcı konuşanlar kelime kelime değil, <b>hazır kalıplarla</b> konuşur. ${PATTERNS.length} kalıbı öğren, cümle kurmak refleks olsun.</p>
    <div class="stats3 mt">
      <div class="stat"><b>${learned}</b><span>/ ${PATTERNS.length} öğrenildi</span></div>
      <div class="stat"><b>${due.length}</b><span>tekrar zamanı</span></div>
      <div class="stat"><b>${Object.values(S.patterns).filter(p => p.lv >= 4).length}</b><span>ustalaşıldı</span></div>
    </div>
    ${due.length ? `<button class="btn btn-primary btn-block mt" data-go="/session/patterns">${icon.refresh}${due.length} kalıbı tekrar et</button>` : ''}
    ${next ? `<div class="card tap tile-color mt" style="background:var(--lime)" data-open="${next.id}">
      <span class="corner">${icon.arrow}</span>
      <p class="eyebrow">Sıradaki kalıp</p>
      <p class="formula" style="font-size:26px;margin-top:8px">${fmt(next.pattern)}</p>
      <p class="muted small mt-s">${esc(next.tr)}</p>
      <div class="row gap-s mt-s" style="align-items:center;flex-wrap:wrap">
        ${nextOk ? `<button class="btn btn-sm btn-ink squish" data-quick="${next.id}">${icon.play} Hemen pratik yap</button>`
          : `<button class="btn btn-sm btn-ink squish" data-pw-daily>${icon.lock} Yarın · Premium</button>`}
        ${left !== Infinity ? `<span class="tiny" style="color:rgba(20,20,20,.6)">Bugün kalan yeni kalıp: <b>${left}</b></span>` : ''}
      </div></div>` : ''}
    ${PATTERN_CATS.map(c => {
      const ps = PATTERNS.filter(p => p.cat === c.id);
      const done = ps.filter(p => S.patterns[p.id]).length;
      return `<section class="pcat">
        <div class="pcat-head"><span class="sq" style="background:${c.color}">${c.emoji}</span><div class="grow"><b class="h3">${c.title}</b></div><span class="small faint">${done}/${ps.length}</span></div>
        <div class="plist">${ps.map(p => p.locked
          ? `<button class="pitem locked" data-pw style="text-align:left"><div class="grow"><div class="pt">${esc(p.pattern)}</div><div class="pm">${esc(p.tr)}</div></div>${lockIcon()}</button>`
          : `<a class="pitem" href="#/pattern/${p.id}"><div class="grow"><div class="pt">${esc(p.pattern)}${p.levels?.includes(APP.level) ? ' <span class="tag lime">Seviyen</span>' : ''}</div><div class="pm">${esc(p.tr)}</div></div>${lvBars(S.patterns[p.id]?.lv || 0)}</a>`).join('')}</div>
      </section>`;
    }).join('')}`;
  el.querySelector('[data-go]')?.addEventListener('click', e => navigate(e.currentTarget.dataset.go));
  el.querySelector('[data-open]')?.addEventListener('click', e => { if (e.target.closest('[data-quick]')) return; navigate('/pattern/' + e.currentTarget.dataset.open); });
  el.querySelector('[data-quick]')?.addEventListener('click', e => { e.stopPropagation(); navigate('/session/pattern/' + e.currentTarget.dataset.quick); });
  el.querySelectorAll('[data-pw]').forEach(b => b.onclick = () => paywall('pattern'));
  el.querySelector('[data-pw-daily]')?.addEventListener('click', e => { e.stopPropagation(); paywall('patternDaily'); });
  maybeTour('patterns');
}

// Highlight the slots (the variable parts) of a pattern formula
function fmt(pattern) {
  return esc(pattern).replace(/(\+ ?)?(V1|V-ing|V3|isim|sıfat|süre|cümle|düz cümle|soru|geçmiş|X|Y|…)/g, (m, plus, slot) => `${plus || ''}<span class="slot">${slot}</span>`);
}

export function patternView(el, { id }) {
  const p = getPattern(id); if (!p) { navigate('/patterns'); return; }
  if (p.locked) { navigate('/patterns'); setTimeout(() => paywall('pattern'), 300); return; }
  const cat = PATTERN_CATS.find(c => c.id === p.cat);
  const st = state().patterns[p.id];
  const i = PATTERNS.indexOf(p);
  const prev = PATTERNS.slice(0, i).reverse().find(x => !x.locked), next = PATTERNS.slice(i + 1).find(x => !x.locked);
  const mark = en => { const k = en.toLowerCase().indexOf(p.key.toLowerCase()); return k < 0 ? esc(en) : `${esc(en.slice(0, k))}<mark>${esc(en.slice(k, k + p.key.length))}</mark>${esc(en.slice(k + p.key.length))}`; };

  el.innerHTML = `
    <div class="back-row"><button class="icon-btn" data-back aria-label="Geri">${icon.back}</button><p class="eyebrow grow">${cat.emoji} ${cat.title}</p>${lvBars(st?.lv || 0)}</div>
    <section class="card tile-color" style="background:${cat.color}">
      <p class="eyebrow">Kalıp</p>
      <h1 class="formula" style="margin-top:10px">${fmt(p.pattern)}</h1>
      <p class="serif" style="font-size:24px;margin-top:10px">${esc(p.tr)}</p>
    </section>
    <div class="note mt">${icon.sparkle}<span>${esc(p.note)}</span></div>
    <section class="section">
      <div class="section-head"><h2 class="h3">Örnekler</h2><button class="link" data-all>${icon.play.replace('<svg', '<svg width="14" height="14"')} Hepsini dinle</button></div>
      <div class="card flat" style="padding:4px 16px">
        ${p.ex.map(([en, tr]) => `<div class="exrow"><div class="grow"><div class="en">${mark(en)}</div><div class="tr">${esc(tr)}</div></div><button class="spk-sm" data-say="${esc(en)}" aria-label="Dinle">${icon.speaker}</button></div>`).join('')}
      </div>
    </section>
    <div class="memo mt">${icon.brain}<span><b>Gölgeleme (shadowing):</b> Her örneği dinle, hemen ardından aynı ritim ve tonlamayla tekrarla. Sonra kendi hayatından bir cümle kur.</span></div>
    ${canStartPattern(p.id) ? `<button class="btn btn-primary btn-block mt" data-practice>${icon.play}${st ? 'Tekrar pratik yap' : 'Pratik yap'} · 6 alıştırma</button>`
      : `<button class="btn btn-soft btn-block mt" data-practice>${icon.lock}Bugünkü yeni kalıp hakkın bitti · Premium</button>
        <p class="tiny faint center mt-s">Örnekleri dinleyip gölgeleyebilirsin; alıştırması yarın açılır.</p>`}
    <div class="row gap-s mt">
      ${prev ? `<a class="btn btn-soft btn-sm grow" href="#/pattern/${prev.id}">${icon.back} Önceki</a>` : ''}
      ${next ? `<a class="btn btn-soft btn-sm grow" href="#/pattern/${next.id}">Sonraki ${icon.arrow}</a>` : ''}
    </div>`;

  el.querySelector('[data-back]').onclick = () => navigate('/patterns');
  el.querySelectorAll('[data-say]').forEach(b => b.onclick = async () => { b.classList.add('playing'); await speak(b.dataset.say); b.classList.remove('playing'); });
  let playingAll = false;
  el.querySelector('[data-all]').onclick = async () => {
    if (playingAll) return; playingAll = true;
    for (const [en] of p.ex) { if (!el.isConnected) break; await speak(en); await new Promise(r => setTimeout(r, 900)); } // pause = time to shadow
    playingAll = false;
  };
  el.querySelector('[data-practice]').onclick = () => canStartPattern(p.id) ? navigate('/session/pattern/' + p.id) : paywall('patternDaily');
}

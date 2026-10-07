// Telaffuz: IPA fonetik alfabe, ABD/İngiliz aksan farkları, minimal çiftler ve Pip'in animasyonlu mini dersleri
import { SOUNDS, SOUND_GROUPS, getSound, ACCENT_TOPICS, MIN_PAIRS, LESSONS } from '../data/phonetics.js';
import { state, profile, setProfile, markSound, markLesson, addXP, settings, setSetting, soundSkill } from '../store.js';
import { icon, esc, sheet, toast, sfx, confetti } from '../ui.js';
import { speak, stopSpeaking, hasVoice, hasTTS } from '../speech.js';
import { pip, setMouth, setMood, setPose, talk, react, pokeable } from '../mascot.js';
import { navigate } from '../app.js';
import { isPremium } from '../content.js';
import { paywall, lockIcon, proBadge, canPlayPairs, canLearnSound, canStartSound, isNewSound, dailyLeft, SOUND_LEARNED as LEARNED } from '../premium.js';
import { limitOf } from '../content.js';
import { maybeTour } from '../tours.js';
import { dailyCount } from '../store.js';

let lastTab = 'ipa';
const TABS = [['ipa', 'Fonetik alfabe'], ['accent', 'Aksanlar'], ['pairs', 'Ses çiftleri'], ['lessons', 'Mini dersler']];

export function soundsView(el, { tab }) {
  let cur = tab && TABS.some(t => t[0] === tab) ? tab : lastTab;
  // quick start: the next hard sound; once today's free quota is used, continue a sound already started today
  const pool = SOUNDS.filter(s => soundSkill(s.id) < LEARNED);
  const weakSound = (!canLearnSound() && pool.find(s => !isNewSound(s.id))) || pool.find(s => s.hard) || pool[0];
  const quickOk = weakSound && canStartSound(weakSound.id), left = dailyLeft('sounds', 'soundsPerDay');
  const sym = x => esc(profile().accent !== 'uk' && x.us ? x.us : x.ipa);
  const quickLabel = !weakSound ? `${icon.check}Tüm sesleri öğrendin — ses çiftleri oyna`
    : quickOk ? `${icon.play}<span>${isNewSound(weakSound.id) ? 'Alıştırmaya başla' : 'Alıştırmaya devam et'} · <span class="ipa">/${sym(weakSound)}/</span></span>`
    : `${icon.lock}Yeni ses hakkın yarın yenilenir`;
  el.innerHTML = `
    <header class="topbar"><h1 class="h1">Telaffuz</h1><a class="icon-btn" href="#/profile/settings" aria-label="Ayarlar">${icon.settings}</a></header>
    <button class="btn ${quickOk || !weakSound ? 'btn-lime' : 'btn-soft'} btn-block mt squish" data-quickstart>${quickLabel}</button>
    ${left !== Infinity && weakSound ? `<p class="tiny faint center mt-s">Bugün kalan yeni ses hakkın: <b>${left}</b> · Öğrendiğin sesleri tekrar etmek her zaman serbest</p>` : ''}
    <div class="accent-toggle mt" role="radiogroup" aria-label="Aksan">
      <button data-acc="us" class="${profile().accent !== 'uk' ? 'on' : ''}">🇺🇸 Amerikan</button>
      <button data-acc="uk" class="${profile().accent === 'uk' ? 'on' : ''}">🇬🇧 İngiliz</button>
    </div>
    <div class="seg mt" role="tablist">${TABS.map(([id, t]) => `<button data-tab="${id}" class="${id === cur ? 'on' : ''}">${t}</button>`).join('')}</div>
    <div id="sbody" class="mt"></div>`;
  const body = el.querySelector('#sbody');

  el.querySelector('[data-quickstart]')?.addEventListener('click', () => {
    if (!weakSound) { navigate('/sounds/pairs'); return; }
    if (quickOk) navigate('/session/sound/' + weakSound.id);
    else paywall('soundDaily');
  });
  el.querySelectorAll('[data-acc]').forEach(b => b.onclick = () => {
    setProfile({ accent: b.dataset.acc });
    el.querySelectorAll('[data-acc]').forEach(x => x.classList.toggle('on', x === b));
    sfx.tap(); draw(cur);
    speak(b.dataset.acc === 'uk' ? 'Lovely! British English it is.' : 'Awesome! American English it is.');
  });
  el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { cur = b.dataset.tab; draw(cur); });

  function draw(t) {
    lastTab = t;
    history.replaceState(null, '', '#/sounds/' + t);
    el.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    body.innerHTML = '';
    body.classList.remove('enter'); void body.offsetWidth; body.classList.add('enter');
    ({ ipa: drawIPA, accent: drawAccent, pairs: drawPairs, lessons: drawLessons })[t](body);
  }
  draw(cur);
  maybeTour('sounds');
}

function ttsWarn() {
  if (!hasTTS) return `<div class="note">${icon.speaker}<span>Tarayıcın sesli okumayı desteklemiyor. Chrome veya Safari'nin güncel sürümünü dene.</span></div>`;
  const lang = profile().accent === 'uk' ? 'en-GB' : 'en-US';
  if (speechSynthesis.getVoices().length && !hasVoice(lang)) return `<div class="note">${icon.speaker}<span>Cihazında ${lang === 'en-GB' ? 'İngiliz' : 'Amerikan'} İngilizcesi sesi bulunamadı; varsayılan İngilizce ses kullanılacak. Cihaz ayarlarından dil sesi indirebilirsin.</span></div>`;
  return '';
}

// ---------- IPA
const ring = pct => `<svg class="skill-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--track)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="${pct >= LEARNED ? 'var(--ok)' : 'var(--lime-2)'}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(pct / 100) * 94.2} 94.2" transform="rotate(-90 18 18)"/></svg>`;
function drawIPA(body) {
  const S = state(); const us = profile().accent !== 'uk';
  const learned = SOUNDS.filter(x => soundSkill(x.id) >= LEARNED).length;
  const avg = Math.round(SOUNDS.reduce((a, x) => a + soundSkill(x.id), 0) / Math.max(1, SOUNDS.length));
  body.innerHTML = `
    ${ttsWarn()}
    <div class="card flat ipa-head">
      <div class="row gap"><div class="ipa-head-pip">${pip({ size: 84, mouth: 'th', mood: 'happy' })}</div><div class="grow">
        <p class="h3">Fonetik alfabe (IPA)</p>
        <p class="muted small">Bir sese dokun: dinle, ağız şeklini gör ve <b>alıştırmasını</b> yap. Her ses %${LEARNED}'de “öğrenildi” sayılır.</p></div></div>
      <div class="row gap-s mt-s"><div class="bar grow"><i style="width:${avg}%"></i></div><span class="tiny faint">${learned}/${SOUNDS.length} öğrenildi</span></div>
      <p class="tiny faint mt-s"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--coral)"></span> Türkçe konuşanlar için zor sesler</p>
    </div>
    ${SOUND_GROUPS.map(g => `<div class="section-head section"><h3 class="h3">${g.title}</h3><span class="tag" style="background:${g.color};color:#141414">${SOUNDS.filter(s => s.group === g.id).length}</span></div>
      <div class="ipa-grid">${SOUNDS.filter(s => s.group === g.id).map(s => { const k = soundSkill(s.id); return `<button class="ipa-tile ${s.hard ? 'hard' : ''} ${S.sounds[s.id] ? 'heard' : ''} ${k >= LEARNED ? 'mastered' : ''}" data-s="${s.id}" aria-label="${esc(s.ipa)} sesi, örnek ${esc(s.words[0])}, ustalık yüzde ${k}">
        ${k ? ring(k) : ''}<span class="sym ipa">${esc(us && s.us ? s.us : s.ipa)}</span><span class="ex">${esc(s.words[0])}</span>${k ? `<span class="pct">%${k}</span>` : ''}</button>`; }).join('')}</div>`).join('')}`;
  pokeable(body.querySelector('.ipa-head .pip'));
  body.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { b.classList.add('heard'); soundSheet(getSound(b.dataset.s)); });
}

function soundSheet(s) {
  const us = profile().accent !== 'uk', sym = us && s.us ? s.us : s.ipa, k = soundSkill(s.id);
  markSound(s.id);
  sheet(`<div class="sheet-body sound-sheet">
    <div class="snd-hero">
      <div class="snd-hero-pip">${pip({ size: 132, mouth: s.mouth, mood: 'happy' })}</div>
      <div class="grow">
        <div class="sound-big ipa">/${esc(sym)}/</div>
        ${s.us ? `<p class="small faint">🇬🇧 /${esc(s.ipa)}/ · 🇺🇸 /${esc(s.us)}/</p>` : ''}
        ${s.hard ? '<span class="tag hard">Türkçede yok / zor</span>' : ''}
        <div class="snd-skill mt-s"><div class="row between tiny"><span>Ustalık</span><b>%${k}</b></div><div class="bar"><i style="width:${k}%"></i></div></div>
      </div>
    </div>
    ${canStartSound(s.id) ? `<button class="btn btn-lime btn-block snd-go squish" data-practice>${icon.target} ${k ? (k >= LEARNED ? 'Tekrar et' : 'Alıştırmaya devam et') : 'Bu sesi öğren'} <small>~2 dk</small></button>`
      : `<button class="btn btn-soft btn-block snd-go squish" data-practice>${icon.lock} Bugünkü yeni ses hakkın bitti <small>Premium</small></button>`}
    <div class="snd-actions">
      <button class="snd-act squish" data-act="listen"><span>🔊</span><b>Dinle</b><small>Örnek kelimeler</small></button>
      <button class="snd-act squish" data-act="mouth"><span>👄</span><b>Ağız şekli</b><small>Pip göstersin</small></button>
      <button class="snd-act squish" data-act="shadow"><span>🎙️</span><b>Gölgele</b><small>Dinle & tekrarla</small></button>
      <button class="snd-act squish" data-act="compare"><span>🌍</span><b>Aksanlar</b><small>İkisini karşılaştır</small></button>
    </div>
    <p class="snd-tip-card">${esc(s.tip)}</p>
    <div class="ex-words">${s.words.map(w => `<button data-w="${esc(w)}">${icon.speaker}${esc(w)}</button>`).join('')}</div>
  </div>`, {
    onMount: (sh, close) => {
      const svg = sh.querySelector('.pip');
      pokeable(svg);
      const say = async (w, opts = {}) => { setMouth(svg, s.mouth); setMood(svg, 'idle'); await speak(w, opts); if (s.to) { setMouth(svg, s.to); await new Promise(r => setTimeout(r, 300)); } setMouth(svg, s.mouth); };
      sh.querySelectorAll('[data-w]').forEach(b => b.onclick = () => say(b.dataset.w));
      sh.querySelector('[data-practice]').onclick = () => { close(); if (canStartSound(s.id)) navigate('/session/sound/' + s.id); else setTimeout(() => paywall('soundDaily'), 250); };
      sh.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
        const a = b.dataset.act;
        if (a === 'listen') { for (const w of s.words.slice(0, 3)) { if (!sh.isConnected) break; await say(w); await new Promise(r => setTimeout(r, 250)); } }
        if (a === 'mouth') { react(svg, 'point', { voice: false }); setMouth(svg, s.mouth); setPose(svg, 'point'); sh.querySelector('.snd-tip-card').classList.add('flash'); setTimeout(() => sh.querySelector('.snd-tip-card')?.classList.remove('flash'), 1200); }
        if (a === 'compare') { await say(s.words.slice(0, 2).join('. '), { accent: 'us' }); await new Promise(r => setTimeout(r, 300)); await say(s.words.slice(0, 2).join('. '), { accent: 'uk' }); }
        if (a === 'shadow') {
          b.disabled = true; const label = b.querySelector('small');
          for (const w of s.words.slice(0, 3)) {
            if (!sh.isConnected) break;
            label.textContent = `Dinle: ${w}`; await say(w);
            label.textContent = `Şimdi sen: ${w}`; setMood(svg, 'think');
            await new Promise(r => setTimeout(r, 1600));
          }
          if (sh.isConnected) { react(svg, 'cheer'); label.textContent = 'Harika! 👏'; addXP(2); setTimeout(() => { b.disabled = false; label.textContent = 'Dinle & tekrarla'; }, 1500); }
        }
      });
      setTimeout(() => say(s.words[0]), 350);
    }
  });
}

// ---------- Accent
function drawAccent(body) {
  const gbOK = !speechSynthesis?.getVoices().length || hasVoice('en-GB');
  body.innerHTML = `
    ${gbOK ? '' : `<div class="note mb">${icon.speaker}<span>Cihazında İngiliz aksanlı ses bulunamadı; 🇬🇧 butonları varsayılan sesle çalabilir.</span></div>`}
    <p class="muted mb">İki aksan da doğrudur. Farkları bilmek, dinlediğini anlamanı kolaylaştırır. Her kelimede iki aksanı arka arkaya dinle.</p>
    <div class="stack gap">${ACCENT_TOPICS.map(t => t.locked ? `
      <button class="card flat locked row gap" data-pw="accent" style="text-align:left;width:100%"><span style="font-size:28px">${t.emoji}</span><div class="grow"><b class="h3">${esc(t.title)}</b><p class="small faint">${esc(t.sub)}</p></div>${lockIcon()}</button>` : `
      <details class="card flat" ${t.id === 'r' ? 'open' : ''}>
        <summary class="row gap" style="list-style:none;cursor:pointer"><span style="font-size:28px">${t.emoji}</span><div class="grow"><b class="h3">${esc(t.title)}</b><p class="small faint">${esc(t.sub)}</p></div>${icon.chevron.replace('<svg', '<svg width="18" height="18"')}</summary>
        <div class="stack gap-s mt">
          <div class="vs"><div class="side"><b>🇺🇸 ABD</b>${esc(t.us)}</div><div class="side"><b>🇬🇧 İngiltere</b>${esc(t.uk)}</div></div>
          <div class="acc-words">${t.pairs
      ? t.pairs.map(([a, b, tr]) => `<div class="acc-row"><div class="w">${esc(tr)}</div><button data-say="${esc(a)}" data-a="us">🇺🇸 ${esc(a)}</button><button data-say="${esc(b)}" data-a="uk">🇬🇧 ${esc(b)}</button></div>`).join('')
      : t.words.map(w => `<div class="acc-row"><div class="w">${esc(w)}</div><button data-say="${esc(w)}" data-a="us">🇺🇸</button><button data-say="${esc(w)}" data-a="uk">🇬🇧</button><button data-both="${esc(w)}" aria-label="İkisini de dinle">${icon.play.replace('<svg', '<svg width="12" height="12"')}</button></div>`).join('')}
          </div>
        </div>
      </details>`).join('')}</div>`;
  body.querySelectorAll('[data-pw]').forEach(b => b.onclick = () => paywall(b.dataset.pw));
  body.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say, { accent: b.dataset.a }));
  body.querySelectorAll('[data-both]').forEach(b => b.onclick = async () => { await speak(b.dataset.both, { accent: 'us' }); await new Promise(r => setTimeout(r, 250)); await speak(b.dataset.both, { accent: 'uk' }); });
}

// ---------- Minimal pairs
function drawPairs(body) {
  const P = state().pairs; const acc = P.n ? Math.round(P.ok / P.n * 100) : null;
  body.innerHTML = `
    <div class="card ink">
      <div class="row gap"><div class="grow">
        <p class="eyebrow" style="color:rgba(243,238,228,.55)">Kulak eğitimi</p>
        <h3 class="h2" style="margin-top:6px">Ses çiftleri oyunu</h3>
        <p class="small" style="opacity:.7;margin-top:6px">ship mi sheep mi? Duyduğunu seç. Farklı seslerle yapılan bu “ayırt etme” eğitimi, hem anlamayı hem telaffuzu geliştirir.</p>
      </div>${pip({ size: 84, mouth: 'smile', mood: 'happy' })}</div>
      ${limitOf('pairsPerDay') === Infinity ? '' : `<p class="tiny" style="opacity:.6;margin-top:8px">Planında günde ${limitOf('pairsPerDay')} oyun · bugün kalan: ${Math.max(0, limitOf('pairsPerDay') - dailyCount('pairs'))}</p>`}
      <div class="row gap mt"><button class="btn btn-lime grow" data-start>${canPlayPairs() ? icon.play : icon.lock}12 tur oyna</button>${acc !== null ? `<div class="center"><b class="num" style="font-size:24px">%${acc}</b><p class="tiny" style="opacity:.6">${P.n} tur</p></div>` : ''}</div>
    </div>
    <div class="section-head section"><h3 class="h3">Tüm çiftler</h3><span class="small faint">${MIN_PAIRS.length}</span></div>
    <div class="wlist">${MIN_PAIRS.map(([a, ai, b, bi, d]) => `<div class="witem" style="gap:8px">
      <button class="chip" data-say="${esc(a)}">${esc(a)} <span class="ipa faint small">/${esc(ai)}/</span></button>
      <span class="faint small">vs</span>
      <button class="chip" data-say="${esc(b)}">${esc(b)} <span class="ipa faint small">/${esc(bi)}/</span></button>
      <span class="grow"></span><span class="tag ipa">${esc(d)}</span></div>`).join('')}</div>`;
  body.querySelector('[data-start]').onclick = () => canPlayPairs() ? navigate('/session/pairs') : paywall('pairs');
  body.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say));
}

// ---------- Lessons
function drawLessons(body) {
  const S = state();
  body.innerHTML = `
    <p class="muted mb">Pip'le kısa, animasyonlu dersler: Pip İngilizce anlatır, altyazılar hem İngilizce hem Türkçe. Ağız şeklini gör, örneği tekrar et.</p>
    <div class="lessons">${LESSONS.map(l => `<a class="lesson-card ${l.locked ? 'locked' : ''}" style="background:${l.color}" ${l.locked ? 'data-pw="lesson" role="button" tabindex="0"' : `href="#/lesson/${l.id}"`}>
      ${S.lessons[l.id] ? `<span class="done-badge tag" style="background:#141414;color:var(--lime)">✓ İzlendi</span>` : ''}
      <span class="play">${l.locked ? icon.lock : icon.play}</span>${l.locked ? `<span class="done-badge">${proBadge(true)}</span>` : ''}
      <b class="h3" style="margin-top:12px;max-width:85%">${esc(l.title)}</b>
      <span class="small ipa" style="opacity:.65;margin-top:4px">${esc(l.sub)} · ${l.min} dk</span>
      ${pip({ size: 84, mouth: l.scenes[1]?.mouth || l.scenes[0]?.mouth || 'rest', mood: l.locked ? 'sleep' : 'idle' })}
    </a>`).join('')}</div>`;
  body.querySelectorAll('[data-pw]').forEach(b => b.onclick = e => { e.preventDefault(); paywall('lesson'); });
}

// ---------- Lesson player ("video"): Pip always speaks English; subtitles EN (karaoke) + TR
export function lessonView(el, { id }) {
  const L = LESSONS.find(l => l.id === id); if (!L) { navigate('/sounds/lessons'); return; }
  if (L.locked) { navigate('/sounds/lessons'); setTimeout(() => paywall('lesson'), 300); return; }
  const scenes = L.scenes;
  let idx = 0, playing = false, token = 0, stopTalk = null, karaoke = null;
  const trOn = () => settings().trSubs !== false;

  el.innerHTML = `<div class="player">
    <div class="player-bars">${scenes.map(() => '<i><b></b></i>').join('')}</div>
    <div class="player-top"><button class="icon-btn" data-x aria-label="Kapat">${icon.close}</button><div class="grow"><b style="font-family:var(--f-display)">${esc(L.title)}</b><p class="tiny faint">Pip ile mini ders · ${L.min} dk · 🇬🇧 İngilizce anlatım</p></div>
      <button class="cc-btn ${trOn() ? 'on' : ''}" data-cc aria-label="Türkçe altyazı" title="Türkçe altyazı">TR</button></div>
    <div class="player-stage" data-stage>
      <div class="blob" style="background:${L.color}"></div>
      <div class="player-pip">${pip({ size: 230, mood: 'happy', pose: 'wave' })}</div>
      <div class="player-big" data-big></div>
      <div class="subs ${trOn() ? '' : 'no-tr'}"><p class="sub-en" data-en lang="en"></p><p class="sub-tr" data-tr></p></div>
    </div>
    <div class="player-ctrl">
      <button class="icon-btn" data-prev aria-label="Önceki sahne">${icon.back}</button>
      <button class="icon-btn" data-replay aria-label="Örneği tekrar dinle">${icon.speaker}</button>
      <button class="play-btn" data-play aria-label="Oynat/Duraklat">${icon.play}</button>
      <button class="icon-btn" data-slow aria-label="Yavaş dinle">${icon.snail}</button>
      <button class="icon-btn" data-next aria-label="Sonraki sahne">${icon.chevron}</button>
    </div></div>`;

  const svg = el.querySelector('.pip'), big = el.querySelector('[data-big]'), en = el.querySelector('[data-en]'), tr = el.querySelector('[data-tr]');
  const bars = [...el.querySelectorAll('.player-bars i')], playBtn = el.querySelector('[data-play]');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const setBars = (i, frac) => bars.forEach((b, k) => { const x = b.querySelector('b'); x.style.transition = k === i ? 'width .5s' : 'none'; x.style.width = k < i ? '100%' : k === i ? frac * 100 + '%' : '0'; });
  const words = t => String(t || '').split(/\s+/).filter(Boolean);

  function show(i) {
    const sc = scenes[i];
    setMood(svg, sc.mood || 'happy'); setMouth(svg, sc.mouth || 'rest'); setPose(svg, i === 0 ? 'wave' : 'idle');
    big.className = 'player-big' + (sc.ipa ? ' ipa' : '');
    big.textContent = sc.big || '';
    big.style.animation = 'none'; void big.offsetWidth; big.style.animation = '';
    const enText = sc.capEn || '';
    en.innerHTML = words(enText).map((w, k) => `<span class="w" style="--k:${k}">${esc(w)} </span>`).join('');
    en.hidden = !enText;
    tr.textContent = sc.cap || '';
    tr.style.animation = 'none'; void tr.offsetWidth; tr.style.animation = '';
    setBars(i, 0);
  }
  // highlight EN words as Pip speaks them (estimated from text length)
  function runKaraoke(rate = 1) {
    clearInterval(karaoke);
    const ws = [...en.querySelectorAll('.w')]; if (!ws.length) return;
    const total = ws.reduce((a, w) => a + w.textContent.length, 0), msPerChar = 62 / rate;
    let k = 0, acc = 0; const t0 = performance.now();
    ws.forEach(w => w.classList.remove('on'));
    karaoke = setInterval(() => {
      const el = performance.now() - t0;
      while (k < ws.length && acc <= el / msPerChar) { ws[k].classList.add('on'); acc += ws[k].textContent.length; k++; }
      if (k >= ws.length || acc > total) clearInterval(karaoke);
    }, 50);
  }

  async function run(i) {
    const my = ++token; idx = i; show(i);
    const sc = scenes[i];
    if (!playing) return;
    if (i > 0) react(svg, sc.say ? 'point' : 'poke', { voice: false });
    await wait(250); if (my !== token) return;
    if (sc.capEn) {
      stopTalk = talk(svg); runKaraoke();
      await speak(sc.capEn, { accent: sc.accent, rate: 0.95 });
      stopTalk?.(sc.mouth || 'rest'); stopTalk = null;
      en.querySelectorAll('.w').forEach(w => w.classList.add('on'));
    } else await wait(Math.max(2400, (sc.cap || '').length * 55));
    if (my !== token) return;
    setBars(i, 0.6);
    if (sc.say) {
      await wait(300); if (my !== token) return;
      big.classList.add('say'); setMouth(svg, sc.mouth);
      await speak(sc.say, { accent: sc.accent });
      big.classList.remove('say');
      if (my !== token) return;
      await wait(500);
    }
    if (my !== token) return;
    setBars(i, 1);
    await wait(600);
    if (my !== token) return;
    if (i + 1 < scenes.length) run(i + 1); else end();
  }

  function setPlaying(v) {
    playing = v; playBtn.innerHTML = v ? icon.pause : icon.play;
    if (!v) { token++; clearInterval(karaoke); stopSpeaking(); stopTalk?.(scenes[idx].mouth || 'rest'); stopTalk = null; }
  }
  function go(i) { i = Math.max(0, Math.min(scenes.length - 1, i)); clearInterval(karaoke); stopSpeaking(); stopTalk?.(); stopTalk = null; token++; if (playing) run(i); else { idx = i; show(i); } }

  function end() {
    setPlaying(false);
    const first = !state().lessons[L.id];
    markLesson(L.id); if (first) addXP(15);
    react(svg, 'cheer'); sfx.done(); confetti();
    bars.forEach(b => b.querySelector('b').style.width = '100%');
    big.textContent = 'Lesson complete!';
    en.innerHTML = '<span class="w on">Great job! Now practise what you learned.</span>'; en.hidden = false;
    tr.innerHTML = `${first ? '<b>+15 XP</b> · ' : ''}Ders tamam! Şimdi öğrendiğini pratiğe dök.`;
    el.querySelector('.player-ctrl').innerHTML = `<div class="stack gap-s" style="width:100%">
      <button class="btn btn-primary btn-block" data-pairs>${icon.ear} Ses çiftleri oyunu</button>
      <div class="row gap-s"><button class="btn btn-soft grow" data-again>${icon.refresh} Tekrar izle</button><button class="btn btn-soft grow" data-close>Bitir</button></div></div>`;
    el.querySelector('[data-pairs]').onclick = () => navigate('/session/pairs');
    el.querySelector('[data-again]').onclick = () => navigate('/lesson/' + L.id, true);
    el.querySelector('[data-close]').onclick = () => navigate('/sounds/lessons');
  }

  playBtn.onclick = () => { if (playing) setPlaying(false); else { setPlaying(true); run(idx); } };
  el.querySelector('[data-prev]').onclick = () => go(idx - 1);
  el.querySelector('[data-next]').onclick = () => go(idx + 1);
  el.querySelector('[data-replay]').onclick = () => { const sc = scenes[idx]; if (sc.say) { setMouth(svg, sc.mouth); speak(sc.say, { accent: sc.accent }); } };
  el.querySelector('[data-slow]').onclick = () => { const sc = scenes[idx]; const t = sc.say || sc.capEn; if (t) { setMouth(svg, sc.mouth); if (!sc.say) runKaraoke(0.6); speak(t, { accent: sc.accent, rate: 0.6 }); } };
  el.querySelector('[data-x]').onclick = () => navigate('/sounds/lessons');
  el.querySelector('[data-cc]').onclick = e => {
    setSetting('trSubs', !trOn());
    e.currentTarget.classList.toggle('on', trOn());
    el.querySelector('.subs').classList.toggle('no-tr', !trOn());
  };
  svg.addEventListener('click', e => { e.stopPropagation(); react(svg, 'poke'); });
  // Stories-style tap zones
  el.querySelector('[data-stage]').addEventListener('click', e => {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left, w = e.currentTarget.offsetWidth;
    if (x < w * 0.28) go(idx - 1); else if (x > w * 0.72) go(idx + 1); else playBtn.click();
  });

  show(0);
  // autoplay needs a user gesture on iOS; the tap that opened the lesson usually counts
  setPlaying(true); run(0);
  return () => { token++; clearInterval(karaoke); stopSpeaking(); stopTalk?.(); };
}

// Alıştırma motoru: tanıtım, çoktan seçmeli, dinleme, yazma, konuşma, cümle kurma, boşluk doldurma, ses çiftleri
import { buildPlan, distractors, fillOptions } from '../plan.js';
import { review, addXP, logAnswer, card, patternDone, markWeekly, logPair, awardBadge, todayXP, dailyGoal, currentStreak, state, isLearned, track, bumpDaily, levelInfo } from '../store.js';
import { pendingChests, openChests } from '../rewards.js';
import { addSoundSkill, soundSkill, profile, activeDaysThisWeek } from '../store.js';
import { pip as pipSvg, setMouth } from '../mascot.js';
import { maybeTour } from '../tours.js';
import { canPlayPairs, canWeekly, isNewPattern, isNewSound, canLearnPattern, canLearnSound, paywall, weeklyReady, WEEKLY_MIN_DAYS } from '../premium.js';
import { speak, stopSpeaking, listen, canListen, bestMatch, levenshtein } from '../speech.js';
import { icon, esc, shuffle, sfx, confetti, ring, toast, confirmSheet, $, countUp } from '../ui.js';
import { pip, react } from '../mascot.js';
import { flyNumber } from '../motion.js';
import { POS_TR, getWord } from '../data/words.js';
import { ipaFor, ipaChip, wireIpa } from '../ipa.js';
import { navigate } from '../app.js';
import { BADGES } from './progress.js';
import { getSound as getSnd } from '../data/phonetics.js';

const OK_MSG = ['Harika!', 'Süper!', 'Tam isabet!', 'Mükemmel!', 'Bravo!', 'Aynen böyle!', 'Çok iyi!'];
const NO_MSG = ['Neredeyse!', 'Olsun, tekrar göreceğiz.', 'Hata = öğrenme fırsatı.', 'Bir dahakine!'];
const pick = a => a[(Math.random() * a.length) | 0];
const normalize = s => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' -]/g, '').replace(/\s+/g, ' ').trim();

const COACH = {
  start: ['Hadi başlayalım! 💪', 'Isınma turu başlıyor!', 'Beynin hazır mı? Başlıyoruz!'],
  half: ['Yarıladık! Böyle devam 🙌', 'Yolun yarısı bitti!', 'Harika gidiyorsun, yarıdayız!'],
  combo: ['Seri yakaladın! 🔥', 'Durdurulamazsın!', 'Bu bir kombo! ⚡'],
  wrong: ['Hatalar beynin en iyi öğretmeni 🧠', 'Sorun değil, birazdan tekrar soracağım.', 'Bunu birlikte güçlendireceğiz.', 'Takılman normal — tam öğrenme anı!'],
  speak: ['Yüksek sesle söyle, çekinme! 🎤', 'Sesli söylemek hatırlamayı güçlendirir.'],
  last: ['Son görev! 🏁', 'Bitiş çizgisi göründü!'],
};

export function sessionView(el, { kind, arg }) {
  // premium gates
  if (kind === 'weekly' && !canWeekly()) { navigate('/home'); setTimeout(() => paywall('weekly'), 300); return; }
  if (kind === 'weekly' && !weeklyReady()) { navigate('/home'); setTimeout(() => toast(`Haftalık pekiştirme için bu hafta en az ${WEEKLY_MIN_DAYS} gün pratik yapmalısın (şu an ${activeDaysThisWeek()}).`, { icon: '📅', ms: 3200 }), 300); return; }
  if (kind === 'pairs' && !canPlayPairs()) { navigate('/sounds/pairs'); setTimeout(() => paywall('pairs'), 300); return; }
  // learning a brand-new pattern/sound counts against the daily free limit; repeating a learned one (or one started today) stays free
  const newPattern = kind === 'pattern' && isNewPattern(arg);
  const newSound = kind === 'sound' && isNewSound(arg);
  if (newPattern && !canLearnPattern()) { navigate('/patterns'); setTimeout(() => paywall('patternDaily'), 300); return; }
  if (newSound && !canLearnSound()) { navigate('/sounds'); setTimeout(() => paywall('soundDaily'), 300); return; }
  const plan = buildPlan(kind, arg);
  document.body.classList.add('in-session');

  if (!plan || !plan.tasks.length) {
    el.innerHTML = `<div class="session"><header class="s-top"><button class="icon-btn" data-x aria-label="Kapat">${icon.close}</button></header>
      <div class="s-stage"><div class="empty" style="margin:auto">
        ${pip({ mood: 'sleep', size: 150 })}
        <h2 class="h2">Şimdilik her şey yolunda!</h2>
        <p class="muted">${kind === 'weekly' ? 'Haftalık pekiştirme için önce birkaç kelime öğrenmelisin.' : kind === 'patterns' ? 'Tekrar zamanı gelen kalıp yok. Yeni bir kalıp öğrenmeye ne dersin?' : 'Tekrar zamanı gelen kelime yok. Beynin şu an dinleniyor — bu da öğrenmenin bir parçası.'}</p>
        <button class="btn btn-primary mt" data-home>Ana sayfaya dön</button>
      </div></div></div>`;
    el.querySelector('[data-x]').onclick = el.querySelector('[data-home]').onclick = () => navigate('/home');
    return () => document.body.classList.remove('in-session');
  }

  const lv0 = levelInfo().lv;
  const S = { tasks: plan.tasks.map(t => ({ ...t })), i: 0, xp: 0, ok: 0, n: 0, combo: 0, best: 0, t0: Date.now(), learned: new Set(), locked: false, qStart: 0, xpGoalHit: false, answers: [], finished: false, coachAt: -9, halfSaid: false };
  if (kind === 'pairs') bumpDaily('pairs');
  track('session_start', { kind, arg: arg ? String(arg).slice(0, 40) : undefined, total: S.tasks.length });

  el.innerHTML = `<div class="session">
    <header class="s-top">
      <button class="icon-btn" data-x aria-label="Oturumu kapat">${icon.close}</button>
      <div class="s-progress" role="progressbar" aria-label="İlerleme"><i></i></div>
      <span class="s-xp">${icon.bolt}<b>0</b></span>
    </header>
    <div class="s-pip" aria-live="polite"><div class="s-pip-char">${pip({ size: 96, mood: 'happy', pose: 'wave' })}</div><div class="s-bubble"><span></span></div></div>
    <section class="s-stage"></section>
    <footer class="s-foot"></footer>
  </div>`;
  const stage = $('.s-stage', el), foot = $('.s-foot', el), bar = $('.s-progress i', el), xpEl = $('.s-xp b', el);
  const dock = $('.s-pip', el), coachPip = dock.querySelector('.pip'), bubble = dock.querySelector('.s-bubble'), bubbleTxt = bubble.querySelector('span');
  coachPip.addEventListener('click', () => react(coachPip, 'poke'));
  // Pip's speech bubble: the task instruction, or a reaction line that pops in
  function say(text, tone = '') {
    bubble.className = 's-bubble ' + tone;
    bubbleTxt.textContent = text;
    bubble.style.animation = 'none'; void bubble.offsetWidth; bubble.style.animation = '';
  }
  // Pip comments now and then (novelty keeps it meaningful), always reacts to answers
  function coach(key, { kind = 'ok', force = false } = {}) {
    if (!force && S.i - S.coachAt < 3) return;
    S.coachAt = S.i;
    say(pick(COACH[key]), 'hot');
    react(coachPip, kind);
  }
  const hideCoach = () => { };
  const itemKey = t => t.w ? 'w:' + t.w.id : t.p && t.type !== 'pair' ? 'p:' + t.p.id : t.type === 'pair' ? 'pair:' + t.p[0] + '-' + t.p[2] : null;

  $('[data-x]', el).onclick = async () => {
    const left = S.tasks.length - S.i;
    if (S.i === 0 || left <= 0) return navigate('/home');
    stopSpeaking();
    const leave = await confirmSheet({ title: `Sadece ${left} görev kaldı!`, text: 'Bitirmeye çok yakınsın. Kazandığın XP zaten kaydedildi.', ok: 'Devam et 💪', cancel: 'Yine de çık' });
    if (!leave) navigate('/home');
  };
  const abandon = () => { if (!S.finished && S.i > 0) track('session_abandon', { kind, i: S.i, total: S.tasks.length, acc: S.n ? Math.round(S.ok / S.n * 100) : null }); };

  const onKey = e => {
    if (e.target.tagName === 'INPUT') { if (e.key === 'Enter') foot.querySelector('.btn-primary:not([disabled])')?.click(); return; }
    if (e.key === 'Enter' || e.key === ' ') { const b = foot.querySelector('.btn-primary:not([disabled])'); if (b) { e.preventDefault(); b.click(); } }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4) stage.querySelectorAll('.opt')[n - 1]?.click();
  };
  document.addEventListener('keydown', onKey);

  const progress = () => { bar.style.width = `${(S.i / S.tasks.length) * 100}%`; };
  const gain = (n, from) => {
    S.xp += n;
    if (from) flyNumber(from, xpEl.parentElement, '+' + n, () => { xpEl.textContent = S.xp; xpEl.parentElement.classList.remove('bump'); void xpEl.offsetWidth; xpEl.parentElement.classList.add('bump'); });
    else xpEl.textContent = S.xp;
    const r = addXP(n);
    if (r.goalReached && !S.xpGoalHit) { S.xpGoalHit = true; toast('Günlük hedefe ulaştın! 🎯', { icon: '🔥' }); }
    if (r.streak?.usedFreeze) toast('Seri dondurucu serini kurtardı ❄️');
  };

  function next() {
    stopSpeaking();
    S.locked = false;
    progress();
    if (S.i >= S.tasks.length) return finish();
    const t = S.tasks[S.i];
    foot.className = 's-foot'; foot.innerHTML = '';
    stage.innerHTML = '';
    const q = document.createElement('div'); q.className = 'q'; stage.appendChild(q);
    S.qStart = performance.now();
    (R[t.type] || R.mcq_en)(t, q);
    // Pip reads the instruction out of the task and points at it
    const k = q.querySelector('.q-kicker');
    say(k ? k.textContent : '', k?.classList.contains('new') ? 'new' : '');
    if (S.i === 0) setTimeout(() => coach('start', { kind: 'cheer', force: true }), 350);
    else if (!S.halfSaid && S.i >= S.tasks.length / 2 && S.tasks.length > 8) { S.halfSaid = true; coach('half', { kind: 'cheer' }); }
    else if (S.i === S.tasks.length - 1 && S.tasks.length > 5) coach('last', { kind: 'point', force: true });
    else if ((t.type === 'speak' || t.type === 'speak_s') && Math.random() < 0.6) coach('speak', { kind: 'point' });
    else react(coachPip, t.type === 'intro' ? 'love' : 'point', { voice: t.type === 'intro' });
  }

  // ---------- feedback
  function feedback(ok, { title, sub = '', onNext } = {}) {
    foot.className = 's-foot ' + (ok ? 'ok' : 'no');
    foot.innerHTML = `<div class="fb"><div class="fb-head"><span class="fb-ic">${ok ? icon.check : icon.x}</span>
      <div class="grow"><div class="fb-t">${title || (ok ? pick(OK_MSG) : pick(NO_MSG))}</div>${sub ? `<div class="fb-sub">${sub}</div>` : ''}</div></div>
      <button class="btn btn-primary btn-block" data-next>Devam ${icon.arrow}</button></div>`;
    const b = foot.querySelector('[data-next]');
    b.onclick = () => { if (onNext) onNext(); S.i++; next(); };
    setTimeout(() => b.focus({ preventScroll: true }), 50);
  }

  function resolve(t, ok, { sub, title, grade } = {}) {
    if (S.locked) return; S.locked = true;
    const ms = performance.now() - S.qStart;
    S.n++;
    if (ok) {
      S.ok++; S.combo++; S.best = Math.max(S.best, S.combo);
      if (S.combo >= 3 && S.combo % 2 === 1) { sfx.combo(S.combo); coach('combo', { kind: 'combo', force: true }); }
      else { sfx.ok(); say(pick(OK_MSG), 'ok'); react(coachPip, 'ok'); }
    } else {
      S.combo = 0; sfx.no();
      if (Math.random() < 0.5) coach('wrong', { kind: 'no', force: true }); else { say(pick(NO_MSG), 'no'); react(coachPip, 'no'); }
    }
    const ik = itemKey(t); if (ik && !t.retry) S.answers.push([ik, ok ? 1 : 0]);
    logAnswer(ok, ms);
    if (plan.soundId && t.type !== 'sound_intro') S.skill = addSoundSkill(plan.soundId, ok ? 4 : -1);

    // SRS scheduling on the first attempt only
    if (t.w && t.srs && !t.retry) {
      if (t.srs === 'fail') { if (!ok) review(t.w.id, 0); }
      else {
        const g = !ok ? 0 : grade ?? (ms < 2500 && !t.isNew ? 3 : ms < 9000 ? 2 : 1);
        const c = review(t.w.id, g);
        if (ok && t.isNew && c.i >= 1) S.learned.add(t.w.id);
      }
    }
    if (t.type === 'pair') logPair(ok);

    // XP: effort-based, never negative (no punishment → safer to try)
    if (ok) {
      let x = t.retry ? 2 : t.type === 'build' ? 8 : t.type === 'pair' ? 3 : 5;
      if (S.combo >= 5 && S.combo % 5 === 0) { x += 5; toast(`${S.combo} doğru üst üste! +5 bonus`, { icon: '🔥', ms: 1600 }); }
      gain(x, document.querySelector('.opt.right, .type-in.right, .build-target, .mic') || stage);
    } else {
      // re-queue a gentler variant a few steps later (retrieval with feedback)
      const copy = { ...t, retry: true, srs: false };
      if (t.w && t.type !== 'intro') copy.type = t.type === 'type' || t.type === 'speak' ? 'mcq_tr' : t.type;
      S.tasks.splice(Math.min(S.tasks.length, S.i + 3), 0, copy);
    }
    feedback(ok, { sub, title });
  }

  // ---------- renderers
  const spkBtn = (text, cls = '') => `<button class="spk-big ${cls}" data-say="${esc(text)}" aria-label="Dinle">${icon.speaker}</button>`;
  const slowBtn = text => `<button class="spk-big slow" data-slow="${esc(text)}" aria-label="Yavaş dinle">${icon.snail}</button>`;
  function wireSpeak(root) {
    root.querySelectorAll('[data-say]').forEach(b => b.onclick = async () => { b.classList.add('playing'); await speak(b.dataset.say); b.classList.remove('playing'); });
    root.querySelectorAll('[data-slow]').forEach(b => b.onclick = () => speak(b.dataset.slow, { rate: 0.6 }));
  }
  const kicker = (txt, isNew) => `<div class="q-kicker ${isNew ? 'new' : ''}"><i></i>${txt}</div>`;

  function options(q, t, opts, correct, render, after) {
    const box = document.createElement('div'); box.className = 'options';
    box.innerHTML = opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${i + 1}</span><span>${render(o)}</span></button>`).join('');
    q.appendChild(box);
    box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      if (S.locked) return;
      const o = opts[+b.dataset.i]; const ok = o === correct;
      b.classList.add(ok ? 'right' : 'wrong');
      box.querySelectorAll('.opt').forEach(x => { if (opts[+x.dataset.i] === correct) x.classList.add('right'); else if (x !== b) x.classList.add('dim'); });
      after?.(ok);
      resolve(t, ok, { sub: `<b>${esc(t.w?.en ?? '')}</b>${ipaFor(t.w) ? ` <span class="ipa faint">/${esc(ipaFor(t.w))}/</span>` : ''} = ${esc(t.w?.tr ?? '')}` });
    });
  }

  // choose-one among plain strings (sound drills)
  function choose(q, t, opts, correct, { render = o => esc(o), sub = '', hear = true } = {}) {
    const box = document.createElement('div'); box.className = 'options';
    box.innerHTML = opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${i + 1}</span><span class="grow">${render(o)}</span>${hear ? `<span class="opt-hear" data-hear="${esc(o)}" aria-label="Dinle">${icon.speaker}</span>` : ''}</button>`).join('');
    q.appendChild(box);
    box.querySelectorAll('[data-hear]').forEach(h => h.onclick = e => { e.stopPropagation(); speak(h.dataset.hear); });
    box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      if (S.locked) return;
      const o = opts[+b.dataset.i], ok = o === correct;
      b.classList.add(ok ? 'right' : 'wrong');
      box.querySelectorAll('.opt').forEach(x => { if (opts[+x.dataset.i] === correct) x.classList.add('right'); else if (x !== b) x.classList.add('dim'); });
      speak(correct);
      resolve(t, ok, { sub });
    });
  }
  const symOf = s => (s.us && profile()?.accent !== 'uk' ? s.us : s.ipa);

  const R = {
    sound_intro(t, q) {
      const s = t.s, sym = symOf(s);
      q.innerHTML = `${kicker(`Yeni ses: /${sym}/ — önce ağız şekline bak`, true)}
        <div class="snd-intro">
          <div class="snd-pip">${pipSvg({ size: 150, mouth: s.mouth, mood: 'happy' })}</div>
          <div class="snd-sym ipa">/${esc(sym)}/</div>
          ${s.hard ? '<span class="tag hard">Türkçede yok / zor</span>' : ''}
          <p class="snd-tip">${esc(s.tip)}</p>
          <div class="ex-words">${s.words.slice(0, 5).map(w => `<button data-w="${esc(w)}">${icon.speaker}${esc(w)}</button>`).join('')}</div>
        </div>`;
      const svg = q.querySelector('.pip');
      const say = async w => { setMouth(svg, s.mouth); await speak(w); if (s.to) { setMouth(svg, s.to); await new Promise(r => setTimeout(r, 300)); } setMouth(svg, s.mouth); };
      q.querySelectorAll('[data-w]').forEach(b => b.onclick = () => say(b.dataset.w));
      setTimeout(() => say(s.words[0]), 400);
      foot.innerHTML = `<button class="btn btn-primary btn-block" data-next>Anladım, deneyelim ${icon.arrow}</button>`;
      foot.querySelector('[data-next]').onclick = () => { gain(1); S.i++; next(); };
    },
    sound_pick(t, q) {
      const sym = symOf(t.s);
      q.innerHTML = `${kicker('Dinle: hangi kelimeyi duydun?')}
        <div class="listen-hero">${spkBtn(t.target)}${slowBtn(t.target)}</div>
        <p class="center faint small">Odak: <span class="ipa">/${esc(sym)}/</span></p>`;
      wireSpeak(q); setTimeout(() => speak(t.target), 250);
      choose(q, t, t.opts, t.target, { hear: false, render: o => `<b style="font-family:var(--f-display);font-size:18px">${esc(o)}</b>`, sub: `<b>${esc(t.target)}</b> · <span class="ipa">/${esc(sym)}/</span> sesi` });
    },
    sound_find(t, q) {
      const sym = symOf(t.s);
      q.innerHTML = `${kicker(`Hangi kelimede /${sym}/ sesi var?`)}
        <div class="ipa-hero"><span class="ipa">/${esc(sym)}/</span><small>İpucu: kelimelere dokunmadan önce 🔊 ile dinleyebilirsin</small></div>`;
      choose(q, t, t.opts, t.target, { render: o => `<b style="font-family:var(--f-display);font-size:18px">${esc(o)}</b>`, sub: `<b>${esc(t.target)}</b> kelimesinde <span class="ipa">/${esc(sym)}/</span> var` });
    },
    intro(t, q) {
      const w = t.w;
      q.innerHTML = `${kicker('Yeni kelime', true)}
        <div class="intro">
          ${w.rank ? `<span class="tag rank">#${w.rank}</span>` : ''}
          ${w.emoji ? `<div class="emoji">${w.emoji}</div>` : ''}
          <div class="row gap-s between"><div class="word">${esc(w.en)}</div></div>
          <div class="tr">${esc(w.tr)}</div>
          <div class="row gap-s mt-s wrap">${ipaChip(w)}${w.pos ? `<span class="tag">${POS_TR[w.pos] || w.pos}</span>` : ''}</div>
          <div class="row gap-s mt">${spkBtn(w.en)}${slowBtn(w.en)}</div>
          ${w.ex ? `<div class="ex"><div class="row gap-s"><div class="grow"><p>${esc(w.ex)}</p><p class="muted small">${esc(w.exTr)}</p></div><button class="spk-sm" data-say="${esc(w.ex)}">${icon.speaker}</button></div></div>` : ''}
        </div>
        <div class="memo">${icon.brain}<span>Kelimeyi <b>yüksek sesle iki kez</b> söyle. Sesli üretim, sessiz okumaya göre hatırlamayı güçlendirir.</span></div>`;
      wireSpeak(q); wireIpa(q, () => w);
      speak(w.en);
      foot.innerHTML = `<button class="btn btn-primary btn-block" data-next>Anladım ${icon.arrow}</button>`;
      foot.querySelector('[data-next]').onclick = () => { gain(1); S.i++; next(); };
    },
    mcq_en(t, q) {
      const w = t.w;
      q.innerHTML = `${kicker(t.isNew ? 'Yeni kelime · Anlamı neydi?' : 'Anlamını seç', t.isNew)}
        <div class="prompt"><div class="grow"><div class="prompt-word">${esc(w.en)}</div></div>${spkBtn(w.en)}</div>`;
      wireSpeak(q); speak(w.en);
      const opts = shuffle([w, ...distractors(w, 3, 'tr')]);
      options(q, t, opts, w, o => esc(o.tr));
    },
    mcq_tr(t, q) {
      const w = t.w;
      q.innerHTML = `${kicker('İngilizcesini seç')}
        <div class="prompt"><div class="grow">${w.emoji ? `<div style="font-size:44px">${w.emoji}</div>` : ''}<div class="prompt-tr">${esc(w.tr)}</div></div></div>`;
      const opts = shuffle([w, ...distractors(w, 3, 'en')]);
      options(q, t, opts, w, o => `<b style="font-family:var(--f-display);font-size:18px">${esc(o.en)}</b>`, () => speak(w.en));
    },
    ipa_read(t, q) {
      const w = t.w, ipa = ipaFor(w);
      if (!ipa) return R.mcq_en(t, q);
      q.innerHTML = `${kicker('IPA\'yı oku · Bu telaffuz hangi kelime?')}
        <div class="ipa-hero"><span class="ipa">/${esc(ipa)}/</span><small>İpucu: ˈ vurgulu heceyi, ː uzun sesi gösterir</small></div>`;
      const opts = shuffle([w, ...distractors(w, 3, 'en')]);
      options(q, t, opts, w, o => `<b style="font-family:var(--f-display);font-size:18px">${esc(o.en)}</b>`, () => speak(w.en));
    },
    listen(t, q) {
      const w = t.w;
      q.innerHTML = `${kicker('Dinle ve anlamını seç')}
        <div class="listen-hero">${spkBtn(w.en)}${slowBtn(w.en)}</div>`;
      wireSpeak(q);
      setTimeout(() => speak(w.en), 250);
      const opts = shuffle([w, ...distractors(w, 3, 'tr')]);
      options(q, t, opts, w, o => esc(o.tr));
    },
    type(t, q) {
      const w = t.w;
      const slots = [...w.en].map((ch, i) => ch === ' ' ? '<i class="gap"></i>' : i === 0 ? `<b>${esc(ch)}</b>` : '<i></i>').join('');
      q.innerHTML = `${kicker('İngilizcesini yaz')}
        <div class="prompt"><div class="grow">${w.emoji ? `<div style="font-size:44px">${w.emoji}</div>` : ''}<div class="prompt-tr">${esc(w.tr)}</div></div></div>
        <div class="hint-slots" aria-hidden="true">${slots}</div>
        <input class="type-in" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="text" aria-label="Cevabın" placeholder="Yaz…">`;
      const inp = q.querySelector('input');
      setTimeout(() => inp.focus(), 80);
      foot.innerHTML = `<div class="row gap-s"><button class="btn btn-ghost" data-skip>Bilmiyorum</button><button class="btn btn-primary grow" data-check disabled>Kontrol et</button></div>`;
      const chk = foot.querySelector('[data-check]');
      inp.oninput = () => chk.disabled = !inp.value.trim();
      chk.onclick = () => {
        const a = normalize(inp.value), target = normalize(w.en);
        const d = levenshtein(a, target);
        const ok = d === 0 || (d === 1 && target.length >= 5);
        inp.classList.add(ok ? 'right' : 'wrong'); inp.disabled = true;
        speak(w.en);
        resolve(t, ok, { grade: d === 0 ? undefined : 1, sub: d === 1 && ok ? `Küçük bir yazım hatası — doğrusu: <b>${esc(w.en)}</b>` : `Doğrusu: <b>${esc(w.en)}</b>` });
      };
      foot.querySelector('[data-skip]').onclick = () => { inp.value = w.en; inp.classList.add('wrong'); inp.disabled = true; speak(w.en); resolve(t, false, { sub: `Doğrusu: <b>${esc(w.en)}</b>` }); };
    },
    speak(t, q) { speakTask(t, q, t.w.en, t.w.tr, 'Kelimeyi söyle'); },
    speak_s(t, q) { speakTask(t, q, t.e[0], t.e[1], 'Cümleyi yüksek sesle söyle'); },
    fill(t, q) {
      const [en, tr] = t.e, key = t.p.key;
      const idx = en.toLowerCase().indexOf(key.toLowerCase());
      const shown = idx < 0 ? esc(en) : `${esc(en.slice(0, idx))}<span class="blank">&nbsp;</span>${esc(en.slice(idx + key.length))}`;
      q.innerHTML = `${kicker('Boşluğu doldur')}
        <div class="fill-sent">${shown}</div><p class="muted">${esc(tr)}</p>`;
      const opts = fillOptions(t.p);
      const box = document.createElement('div'); box.className = 'options'; box.style.marginTop = 'auto';
      box.innerHTML = opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`).join('');
      q.appendChild(box);
      box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
        if (S.locked) return;
        const o = opts[+b.dataset.i], ok = o === key;
        b.classList.add(ok ? 'right' : 'wrong');
        box.querySelectorAll('.opt').forEach(x => { if (opts[+x.dataset.i] === key) x.classList.add('right'); else if (x !== b) x.classList.add('dim'); });
        const blank = q.querySelector('.blank'); if (blank) blank.textContent = en.slice(idx, idx + key.length);
        speak(en);
        resolve(t, ok, { sub: `<b>${esc(t.p.pattern)}</b> — ${esc(t.p.tr)}` });
      });
    },
    build(t, q) {
      const [en, tr] = t.e;
      const words = en.split(' ');
      const order = shuffle(words.map((w, i) => ({ w, i })));
      q.innerHTML = `${kicker('Cümleyi kur')}
        <div class="build-tr">${esc(tr)}</div>
        <div class="build-target" aria-label="Cevap alanı"></div>
        <div class="build-bank">${order.map((o, k) => `<button class="wtile" data-k="${k}" style="animation-delay:${k * 30}ms">${esc(o.w)}</button>`).join('')}</div>`;
      const target = q.querySelector('.build-target'), bank = q.querySelector('.build-bank');
      const placed = [];
      foot.innerHTML = `<button class="btn btn-primary btn-block" data-check disabled>Kontrol et</button>`;
      const chk = foot.querySelector('[data-check]');
      const sync = () => { chk.disabled = placed.length !== words.length; };
      bank.querySelectorAll('.wtile').forEach(b => b.onclick = () => {
        if (S.locked || b.classList.contains('ghost')) return;
        sfx.tap();
        const k = +b.dataset.k; placed.push(k); b.classList.add('ghost');
        const tb = document.createElement('button'); tb.className = 'wtile placed'; tb.textContent = order[k].w; tb.dataset.k = k;
        tb.onclick = () => { if (S.locked) return; sfx.tap(); placed.splice(placed.indexOf(k), 1); tb.remove(); b.classList.remove('ghost'); sync(); };
        target.appendChild(tb); sync();
      });
      chk.onclick = () => {
        const ans = placed.map(k => order[k].w).join(' ');
        const ok = normalize(ans) === normalize(en);
        target.style.animation = ok ? 'pop .4s var(--spring)' : 'shake .45s';
        speak(en);
        resolve(t, ok, { sub: ok ? esc(en) : `Doğrusu: <b>${esc(en)}</b>` });
      };
    },
    pair(t, q) {
      const p = t.p; const words = [[p[0], p[1]], [p[2], p[3]]]; const target = words[t.target][0];
      q.innerHTML = `${kicker('Hangisini duydun?')}
        <div class="listen-hero">${spkBtn(target)}${slowBtn(target)}</div>
        <p class="center faint small">Ses farkı: <span class="ipa">${esc(p[4])}</span></p>`;
      wireSpeak(q); setTimeout(() => speak(target), 250);
      const box = document.createElement('div'); box.className = 'options two';
      box.innerHTML = words.map(([w, ipa], i) => `<button class="opt big" data-i="${i}"><span class="w">${esc(w)}</span><span class="ipa">/${esc(ipa)}/</span></button>`).join('');
      q.appendChild(box);
      box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
        if (S.locked) return;
        const i = +b.dataset.i, ok = i === t.target;
        b.classList.add(ok ? 'right' : 'wrong');
        box.querySelectorAll('.opt').forEach(x => { if (+x.dataset.i === t.target) x.classList.add('right'); });
        resolve(t, ok, { sub: `Duyduğun: <b>${esc(target)}</b> <span class="ipa">/${esc(words[t.target][1])}/</span>` });
        // contrastive replay
        setTimeout(async () => { await speak(words[0][0]); await speak(words[1][0]); }, 350);
      });
    },
  };

  function speakTask(t, q, text, tr, label) {
    q.innerHTML = `${kicker(label)}
      <div class="prompt"><div class="grow"><div class="prompt-word" style="font-size:${text.length > 16 ? 28 : 40}px">${esc(text)}</div><p class="muted mt-s">${esc(tr)}</p></div>${spkBtn(text)}</div>
      <div class="mic-wrap">
        ${canListen ? `<button class="mic" aria-label="Konuş">${icon.mic}</button><div class="heard">Mikrofona dokun ve söyle</div>` :
        `<div class="bubble" style="max-width:320px">Önce <b>yüksek sesle söyle</b>, sonra 🔊 ile dinleyip karşılaştır. Dürüst ol — bu senin için!</div>`}
      </div>`;
    wireSpeak(q);
    if (canListen) {
      const mic = q.querySelector('.mic'), heard = q.querySelector('.heard');
      let tries = 0;
      mic.onclick = async () => {
        if (S.locked || mic.classList.contains('rec')) return;
        mic.classList.add('rec'); heard.textContent = 'Dinliyorum…';
        try {
          const alts = await listen();
          mic.classList.remove('rec');
          const m = bestMatch(alts, text); tries++;
          const pct = Math.round(m.score * 100);
          heard.innerHTML = alts.length ? `Duyduğum: “${esc(m.text)}” · <b>%${pct}</b>` : 'Bir şey duyamadım, tekrar dene.';
          if (m.score >= 0.75) resolve(t, true, { title: pct > 92 ? 'Kusursuz telaffuz!' : 'Anlaşılır ve net!', sub: `Benzerlik %${pct}` });
          else if (tries >= 3) resolve(t, false, { sub: `Dinle ve gölgele (shadowing): <b>${esc(text)}</b>` });
          else if (alts.length) { heard.innerHTML += '<br>Bir daha dene — önce 🔊 ile dinle.'; }
        } catch (err) {
          mic.classList.remove('rec');
          heard.textContent = err.message === 'not-allowed' ? 'Mikrofon izni gerekli.' : 'Konuşma tanıma şu an kullanılamıyor.';
        }
      };
      foot.innerHTML = `<button class="btn btn-ghost btn-block" data-skip>Şu an konuşamıyorum</button>`;
      foot.querySelector('[data-skip]').onclick = () => { S.i++; next(); };
    } else {
      foot.innerHTML = `<div class="row gap-s"><button class="btn btn-ghost grow" data-no>Tekrar çalışmalıyım</button><button class="btn btn-primary grow" data-ok>Doğru söyledim</button></div>`;
      foot.querySelector('[data-ok]').onclick = () => resolve(t, true, { title: 'Harika!', sub: 'Gölgeleme (shadowing) telaffuzu hızla geliştirir.' });
      foot.querySelector('[data-no]').onclick = () => resolve(t, false, { title: 'Dürüstlüğün için teşekkürler', sub: 'Bunu yakında tekrar göreceğiz.' });
    }
  }

  // ---------- finish
  function finish() {
    stopSpeaking(); hideCoach(); S.finished = true;
    bar.style.width = '100%';
    const mins = Math.max(1, Math.round((Date.now() - S.t0) / 60000));
    const acc = S.n ? Math.round((S.ok / S.n) * 100) : 100;
    gain(10); // completion bonus
    if (plan.patternId) patternDone(plan.patternId);
    plan.patternIds?.forEach(patternDone);
    if (newPattern) bumpDaily('patterns', arg);
    if (newSound) bumpDaily('sounds', arg);
    if (plan.weekly) { markWeekly(); gain(30); }
    track('session_end', { kind, acc, n: S.n, xp: S.xp, ms: Date.now() - S.t0, learned: S.learned.size, answers: S.answers });
    const newBadges = checkBadges({ acc, n: S.n });
    const xpToday = todayXP(), goal = dailyGoal(), streak = currentStreak();
    const learned = [...S.learned];
    const lv1 = levelInfo().lv, chests = pendingChests();
    dock.classList.add('out');

    foot.className = 's-foot';
    stage.innerHTML = `<div class="end">
      ${pip({ mood: 'wow', pose: 'cheer', size: 150 })}
      <p class="eyebrow mt">${esc(plan.title)} · tamamlandı</p>
      <h1 class="display" style="margin-top:6px">${acc >= 90 ? 'Muhteşem!' : acc >= 70 ? 'Harika iş!' : 'Güzel çaba!'}</h1>
      <p class="muted mt-s">${acc >= 90 ? 'Bu hızla gidersen kalıcı hafızan çok güçlenecek.' : 'Hatalar, beynin neyi güçlendireceğini seçtiği anlardır.'}</p>
      <div class="end-grid">
        <div class="end-stat lime"><b data-c="${S.xp}">0</b><span>XP kazandın</span></div>
        <div class="end-stat"><b>%${acc}</b><span>doğruluk</span></div>
        <div class="end-stat"><b>${learned.length || mins}</b><span>${learned.length ? 'yeni kelime' : 'dakika'}</span></div>
      </div>
      <div class="card flat mt" style="width:100%;text-align:left">
        <div class="row gap">
          <div class="ring-wrap">${ring(xpToday / goal, { size: 72, stroke: 9 })}<div class="ring-label"><b style="font-size:16px">${Math.min(100, Math.round(xpToday / goal * 100))}%</b></div></div>
          <div class="grow"><b class="h3">${xpToday >= goal ? 'Günlük hedef tamam!' : `Hedefe ${goal - xpToday} XP kaldı`}</b>
          <p class="muted small">🔥 ${streak} günlük seri${S.best >= 5 ? ` · en uzun kombo ${S.best}` : ''}</p></div>
        </div>
      </div>
      ${plan.soundId ? `<div class="card flat mt snd-end"><div class="row between"><b>/${esc(symOf(getSnd(plan.soundId)))}/ ustalığın</b><b class="num">%${soundSkill(plan.soundId)}</b></div><div class="bar mt-s"><i style="width:${soundSkill(plan.soundId)}%"></i></div><p class="tiny faint mt-s">${soundSkill(plan.soundId) >= 80 ? 'Bu sesi öğrendin! Ara ara tekrar et.' : 'Birkaç tur daha ile %80\'e ulaş — o zaman bu ses “öğrenildi” sayılır.'}</p></div>` : ''}
      ${lv1 > lv0 ? `<div class="lvup mt"><span class="lvup-n">${lv1}</span><div><b class="h3">Seviye atladın!</b><p class="small">Seviye ${lv1} · seni bir sandık bekliyor 🎁</p></div></div>` : ''}
      ${learned.length ? `<div class="wchips mt" style="justify-content:center">${learned.map(id => `<span class="wchip learned">${esc(id)}</span>`).join('')}</div>` : ''}
      ${newBadges.map(b => `<div class="card lime mt" style="width:100%"><div class="row gap"><span style="font-size:34px">${b.e}</span><div style="text-align:left"><b class="h3">Yeni rozet: ${b.t}</b><p class="small">${b.d}</p></div></div></div>`).join('')}
    </div>`;
    countUp(stage.querySelector('[data-c]'), S.xp);
    foot.innerHTML = chests.length
      ? `<div class="row gap-s"><button class="btn btn-ghost" data-done>Sonra</button><button class="btn btn-lime grow chest-cta" data-chest>🎁 ${chests.length > 1 ? chests.length + ' sandık aç' : 'Sandığı aç'}</button></div>`
      : `<div class="row gap-s">${kind === 'daily' || kind === 'review' ? `<button class="btn btn-ghost" data-more>+ Biraz daha</button>` : ''}<button class="btn btn-primary grow" data-done>Bitir</button></div>`;
    foot.querySelector('[data-chest]')?.addEventListener('click', () => openChests(chests).then(() => navigate('/home')));
    foot.querySelector('[data-done]').onclick = () => navigate('/home');
    foot.querySelector('[data-more]')?.addEventListener('click', () => navigate('/session/review', true));
    if (lv1 > lv0) { sfx.levelUp(); confetti(200); } else { sfx.done(); confetti(); }
    const endPip = stage.querySelector('.end .pip'); setTimeout(() => react(endPip, 'cheer'), 500);
  }

  maybeTour('session').then(shown => { if (!el.isConnected) return; S.qStart = performance.now(); if (shown && S.tasks[0]?.type === 'intro') speak(S.tasks[0].w.en); });
  next();
  return () => { abandon(); hideCoach(); stopSpeaking(); document.removeEventListener('keydown', onKey); document.body.classList.remove('in-session'); };
}

export function checkBadges({ acc = 0, n = 0 } = {}) {
  const S = state();
  const learned = Object.keys(S.cards).filter(isLearned).length;
  const got = [];
  const tryB = (id, cond) => { if (cond && awardBadge(id)) got.push(BADGES.find(b => b.id === id)); };
  tryB('first', true);
  tryB('perfect', acc === 100 && n >= 10);
  tryB('w50', learned >= 50);
  tryB('w100', learned >= 100);
  tryB('w500', learned >= 500);
  tryB('s3', currentStreak() >= 3);
  tryB('s7', currentStreak() >= 7);
  tryB('s30', currentStreak() >= 30);
  tryB('p10', Object.keys(S.patterns).length >= 10);
  tryB('weekly', Object.keys(S.weekly).length >= 1);
  tryB('ear', S.pairs.n >= 30 && S.pairs.ok / S.pairs.n >= 0.8);
  tryB('sounds', Object.keys(S.sounds).length >= 44);
  return got.filter(Boolean);
}

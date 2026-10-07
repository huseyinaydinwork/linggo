// Seviye belirleme testi: her seviyeden kelime + kalıp soruları → önerilen seviye
import { api } from '../api.js';
import { setProfile, profile, track, state, save } from '../store.js';
import { APP, loadContent, featOn } from '../content.js';
import { pip, setMood, setPose } from '../mascot.js';
import { icon, esc, sfx, confetti, toast } from '../ui.js';
import { speak } from '../speech.js';
import { navigate } from '../app.js';
import { paywall } from '../premium.js';

export function placementView(el, { from }) {
  const onboarding = from === 'onboarding';
  if (!onboarding && state().placement && !featOn('placementRetest')) { navigate('/profile'); setTimeout(() => paywall('feature'), 300); return; }
  let data = null, i = 0, answers = [], stopped = new Set();

  const exit = () => navigate(onboarding ? '/welcome' : '/profile');
  el.innerHTML = `<div class="session placement">
    <header class="s-top"><button class="icon-btn" data-x aria-label="Kapat">${icon.close}</button><div class="s-progress"><i></i></div><span class="s-xp" data-n></span></header>
    <section class="s-stage" data-stage></section><footer class="s-foot" data-foot></footer></div>`;
  el.querySelector('[data-x]').onclick = exit;
  const stage = el.querySelector('[data-stage]'), foot = el.querySelector('[data-foot]'), bar = el.querySelector('.s-progress i'), counter = el.querySelector('[data-n]');

  function intro() {
    stage.innerHTML = `<div class="q" style="align-items:center;text-align:center;justify-content:center">
      ${pip({ size: 170, mood: 'think', pose: 'think' })}
      <h1 class="h1 mt">Seviyeni birlikte <span class="serif">bulalım</span></h1>
      <p class="muted mt-s" style="max-width:340px">Her seviyeden birkaç kelime ve cümle kalıbı soracağım. Yaklaşık 2 dakika sürer.</p>
      <div class="card flat mt" style="text-align:left;max-width:360px"><p class="small">💡 Bilmediğin soruda <b>“Bilmiyorum”</b>a bas — tahmin etmek sonucu yanıltır. Sonunda sana en uygun seviyeyi önereceğim.</p></div></div>`;
    foot.innerHTML = `<button class="btn btn-primary btn-block squish" data-go disabled><span class="spin"></span></button>`;
    api('/api/placement').then(d => {
      data = d;
      const b = foot.querySelector('[data-go]'); b.disabled = false; b.innerHTML = `Teste başla ${icon.arrow}`;
      b.onclick = () => { sfx.tap(); ask(); };
    }).catch(e => { foot.innerHTML = `<div class="form-err">${esc(e.message)}</div>`; });
  }

  function ask() {
    // skip questions of levels above a level that was clearly too hard
    while (i < data.questions.length && stopped.has(data.questions[i].level)) i++;
    if (i >= data.questions.length) return result();
    const q = data.questions[i];
    bar.style.width = `${i / data.questions.length * 100}%`;
    counter.textContent = `${i + 1}/${data.questions.length}`;
    const lvl = data.levels.find(l => l.id === q.level);
    stage.innerHTML = `<div class="q">
      <div class="q-kicker"><i></i>${q.type === 'word' ? 'Bu kelimenin anlamı ne?' : 'Boşluğa ne gelmeli?'} <span class="tag" style="margin-left:6px">${esc(lvl?.cefr || '')}</span></div>
      ${q.type === 'word' ? `<div class="prompt"><div class="grow"><div class="prompt-word">${esc(q.prompt)}</div>${q.us ? `<p class="ipa faint" style="font-size:18px;margin-top:6px">/${esc(profile()?.accent === 'uk' ? q.uk || q.us : q.us)}/</p>` : ''}</div><button class="spk-big" data-say>${icon.speaker}</button></div>`
        : `<div class="fill-sent">${esc(q.prompt).replace('____', '<span class="blank">&nbsp;</span>')}</div><p class="muted">${esc(q.tr)}</p>`}
      <div class="options" style="margin-top:auto">${q.options.map((o, k) => `<button class="opt squish" data-k="${k}"><span class="k">${k + 1}</span><span>${esc(o)}</span></button>`).join('')}</div></div>`;
    stage.querySelector('[data-say]')?.addEventListener('click', () => speak(q.prompt));
    if (q.type === 'word') speak(q.prompt);
    foot.innerHTML = `<button class="btn btn-ghost btn-block squish" data-idk>🤷 Bilmiyorum</button>`;
    const answer = k => {
      const ok = k === q.answer;
      answers.push({ level: q.level, ok });
      ok ? sfx.tap() : null;
      stage.querySelectorAll('.opt').forEach(b => { b.disabled = true; if (+b.dataset.k === k) b.classList.add('sel'); });
      // early stop: a level with ≤ 1 correct out of its first 3 answers stops higher levels
      const lvAns = answers.filter(a => a.level === q.level);
      if (lvAns.length >= 3 && lvAns.filter(a => a.ok).length <= 1) {
        const idx = data.levels.findIndex(l => l.id === q.level);
        data.levels.slice(idx + 1).forEach(l => stopped.add(l.id));
      }
      i++; setTimeout(ask, 260);
    };
    stage.querySelectorAll('.opt').forEach(b => b.onclick = () => answer(+b.dataset.k));
    foot.querySelector('[data-idk]').onclick = () => answer(-1);
  }

  function result() {
    bar.style.width = '100%'; counter.textContent = '';
    const scores = data.levels.map(l => {
      const a = answers.filter(x => x.level === l.id);
      return { ...l, n: a.length, pct: a.length ? Math.round(a.filter(x => x.ok).length / a.length * 100) : 0 };
    });
    // recommended level = the first level the learner has not yet mastered (or the top level if all passed)
    const firstFail = scores.findIndex(s => !(s.n && s.pct >= data.pass));
    const rec = scores[firstFail < 0 ? scores.length - 1 : firstFail];
    const full = APP.levels.find(l => l.id === rec.id) || rec;
    track('placement_done', { level: rec.id, scores: Object.fromEntries(scores.map(s => [s.id, s.pct])) });
    state().placement = { level: rec.id, ts: Date.now(), scores: scores.map(s => [s.id, s.pct]) }; save();
    stage.innerHTML = `<div class="end">
      ${pip({ size: 150, mood: 'wow', pose: 'cheer' })}
      <p class="eyebrow mt">Önerilen seviyen</p>
      <h1 class="display" style="margin-top:6px">${esc(full.emoji || '')} ${esc(full.cefr)} · <span class="serif">${esc(full.title)}</span></h1>
      <p class="muted mt-s">${esc(full.desc || '')}</p>
      <div class="card flat mt" style="width:100%;text-align:left">
        ${scores.map(s => `<div class="row gap-s" style="margin:8px 0"><span class="tag" style="width:40px;justify-content:center">${esc(s.cefr)}</span><div class="bar grow"><i style="width:${s.pct}%;background:${s.pct >= data.pass ? 'var(--ok)' : 'var(--coral)'}"></i></div><b class="small" style="width:52px;text-align:right">${s.n ? '%' + s.pct : '—'}</b></div>`).join('')}
        <p class="tiny faint mt-s">Geçme eşiği %${data.pass}. Seviyeni her zaman profilden değiştirebilirsin.</p>
      </div></div>`;
    foot.innerHTML = `<div class="stack gap-s"><button class="btn btn-primary btn-block squish" data-ok>${icon.check} ${esc(full.cefr)} ile devam et</button><button class="btn btn-ghost btn-block" data-other>Farklı bir seviye seçeyim</button></div>`;
    sfx.done(); confetti();
    foot.querySelector('[data-ok]').onclick = async () => {
      if (onboarding) { sessionStorage.setItem('pl_placement', rec.id); return navigate('/welcome'); }
      setProfile({ level: rec.id }); APP.userLevel = rec.id;
      state().dayWords = { date: null, ids: [] }; save();
      await loadContent(rec.id).catch(() => { });
      toast(`Seviyen ${full.cefr} olarak güncellendi 🎯`); navigate('/home');
    };
    foot.querySelector('[data-other]').onclick = exit;
  }
  intro();
  void setMood; void setPose;
}

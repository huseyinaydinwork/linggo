// Hesap oluşturulduktan sonra Pip'in tanıtımı (daktilo efektli konuşma + poz/ruh hâli animasyonları)
import { markIntro, track } from '../store.js';
import { APP } from '../content.js';
import { pip, setMood, setPose, talk } from '../mascot.js';
import { icon, esc, sfx } from '../ui.js';
import { navigate } from '../app.js';

export function introView(el) {
  const name = (APP.user?.name || '').split(' ')[0];
  const S = [
    { mood: 'happy', pose: 'wave', title: `Merhaba${name ? ', ' + esc(name) : ''}! 👋`, say: 'Ben Pip. İngilizce yolculuğunda koçun ve pratik arkadaşın olacağım.', props: [], bg: ['#D4F65A', '#7C6CFF'] },
    { mood: 'idle', pose: 'point', title: 'Her gün, birkaç dakika', say: 'Uzun ve seyrek değil; kısa ve her gün. Beynin en iyi böyle öğrenir.', props: ['⏱️ 5–20 dk', '🔥 Günlük seri', '🎯 Kişisel hedef'], bg: ['#FFCF5C', '#72C4FF'] },
    { mood: 'think', pose: 'think', title: 'Bilimle öğreniyoruz', say: 'Unutmak üzereyken hatırlatırım, seni nazikçe test ederim ve sesli söyletirim.', props: ['🧠 Aralıklı tekrar', '🎯 Hatırlama pratiği', '🗣️ Sesli üretim'], bg: ['#7C6CFF', '#FFB3CF'] },
    { mood: 'happy', pose: 'cheer', title: 'Seni neler bekliyor?', say: 'Kelimeler, kalıplar, telaffuz ve benim mini derslerim. Hepsi tek bir yerde.', props: ['📈 1000+ kelime', '🧩 Cümle kalıpları', '👄 IPA & aksan', '🎬 Mini dersler'], bg: ['#6FE0B0', '#D4F65A'] },
    { mood: 'wow', pose: 'cheer', title: 'Hadi seni tanıyayım!', say: 'Birkaç kısa soruyla planını kişiselleştireceğim. Sadece bir dakika sürer.', props: [], bg: ['#FF6B45', '#D4F65A'] },
  ];
  let i = 0, typing = null, stopTalk = null, x0 = null;

  el.innerHTML = `<div class="intro-v">
    <div class="intro-bg"><i style="width:340px;height:340px;left:-120px;top:-60px"></i><i style="width:300px;height:300px;right:-120px;bottom:80px"></i></div>
    <div class="row between" style="position:relative;z-index:1;padding:calc(16px + var(--safe-t)) 20px 0"><span class="eyebrow">Linggo</span><button class="link-btn small" data-skip>Geç</button></div>
    <div class="intro-stage">
      ${pip({ size: 210, mood: 'happy', pose: 'wave' })}
      <h1 class="intro-title" data-title></h1>
      <div class="intro-bubble"><span data-say></span><span class="caret"></span></div>
      <div class="intro-props" data-props></div>
    </div>
    <div class="intro-foot"><div class="dots">${S.map(() => '<i></i>').join('')}</div><button class="btn btn-primary btn-block" data-next></button></div>
  </div>`;
  const svg = el.querySelector('.pip'), title = el.querySelector('[data-title]'), say = el.querySelector('[data-say]'), props = el.querySelector('[data-props]');
  const blobs = el.querySelectorAll('.intro-bg i'), btn = el.querySelector('[data-next]');

  function draw() {
    const s = S[i];
    clearInterval(typing); stopTalk?.();
    setMood(svg, s.mood); setPose(svg, s.pose);
    svg.style.transform = 'scale(.9)'; requestAnimationFrame(() => { svg.style.transform = ''; });
    title.innerHTML = s.title; title.style.animation = 'none'; void title.offsetWidth; title.style.animation = 'rise .5s var(--ease) both';
    blobs[0].style.background = s.bg[0]; blobs[1].style.background = s.bg[1];
    props.innerHTML = s.props.map((p, k) => `<span style="animation-delay:${0.5 + k * 0.12}s">${esc(p)}</span>`).join('');
    el.querySelectorAll('.dots i').forEach((d, k) => d.classList.toggle('on', k === i));
    btn.innerHTML = i === S.length - 1 ? `Başlayalım ${icon.arrow}` : `Devam ${icon.arrow}`;
    // typewriter + talking mouth
    let n = 0; say.textContent = '';
    stopTalk = talk(svg);
    typing = setInterval(() => {
      n += 2; say.textContent = s.say.slice(0, n);
      if (n >= s.say.length) { clearInterval(typing); stopTalk?.(s.mood === 'wow' ? 'smile' : 'rest'); stopTalk = null; }
    }, 28);
  }
  const finish = skipped => { clearInterval(typing); stopTalk?.(); markIntro(); track('intro_done', { skipped, step: i + 1 }); navigate('/welcome'); };
  const next = () => {
    sfx.tap();
    // first tap completes the typing, second advances
    if (typing && say.textContent.length < S[i].say.length) { clearInterval(typing); typing = null; say.textContent = S[i].say; stopTalk?.('rest'); stopTalk = null; return; }
    if (i < S.length - 1) { i++; draw(); } else finish(false);
  };
  btn.onclick = next;
  el.querySelector('[data-skip]').onclick = () => finish(true);
  const stage = el.querySelector('.intro-v');
  stage.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (dx < -60) next(); else if (dx > 60 && i > 0) { i--; draw(); } });
  const onKey = e => { if (e.key === 'Enter' || e.key === 'ArrowRight') next(); };
  document.addEventListener('keydown', onKey);
  draw();
  return () => { clearInterval(typing); stopTalk?.(); document.removeEventListener('keydown', onKey); };
}

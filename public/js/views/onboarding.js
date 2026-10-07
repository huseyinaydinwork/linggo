// Karşılama akışı: kişiselleştirme + uygulama niyeti (implementation intention) + bağlılık jesti
import { setProfile, track } from '../store.js';
import { APP, loadContent } from '../content.js';
import { pip } from '../mascot.js';
import { icon, esc, sfx, confetti, toast } from '../ui.js';
import { speak } from '../speech.js';
import { navigate } from '../app.js';

// Seviyeler yönetim panelinden gelir (APP.levels)
const GOALS = [
  { xp: 20, n: 5, em: '☕', t: 'Rahat', s: '5 dk / gün', min: 5 },
  { xp: 50, n: 8, em: '🚶', t: 'Düzenli', s: '10 dk / gün · önerilen', min: 10 },
  { xp: 80, n: 12, em: '🏃', t: 'Ciddi', s: '15 dk / gün', min: 15 },
  { xp: 120, n: 15, em: '🚀', t: 'Yoğun', s: '20+ dk / gün', min: 20 },
];
const CUES = ['sabah kahvemi içtikten', 'işe/okula giderken', 'öğle yemeğinden', 'akşam yemeğinden', 'dişlerimi fırçaladıktan'];

export function onboardingView(el) {
  // draft survives a detour to the placement test
  const saved = (() => { try { return JSON.parse(sessionStorage.getItem('pl_ob') || 'null'); } catch { return null; } })();
  const d = saved?.d || { name: (APP.user?.name || '').trim(), level: APP.levels[0]?.id || 'a1', goal: 50, accent: 'us', track: 'freq', cue: CUES[0] };
  let step = saved?.step || 1; const TOTAL = 7;
  const tested = sessionStorage.getItem('pl_placement');
  if (tested) { d.level = tested; step = 2; sessionStorage.removeItem('pl_placement'); }
  const persist = () => { try { sessionStorage.setItem('pl_ob', JSON.stringify({ d, step })); } catch { } };

  const choice = (on, em, t, s, attrs, side = '') => `<button class="choice ${on ? 'on' : ''}" ${attrs}><span class="em">${em}</span><span><b>${t}</b><span>${s}</span></span>${side ? `<span class="side">${side}</span>` : ''}</button>`;

  function body() {
    switch (step) {
      case 0: return `
        <div class="welcome-art">
          <div class="orbit">
            <span style="top:6%;left:4%;animation-delay:-1s">hello 👋</span>
            <span style="top:16%;right:0;animation-delay:-2s" class="ipa">/θɪŋk/</span>
            <span style="bottom:20%;left:0;animation-delay:-3s">I'm into…</span>
            <span style="bottom:8%;right:6%;animation-delay:-.5s">🔥 7</span>
          </div>
          ${pip({ mood: 'happy', size: 210 })}
        </div>
        <p class="eyebrow">Linggo</p>
        <h1 class="display mt-s">İngilizceyi <span class="serif">bilimle</span> öğren.</h1>
        <p class="muted mt">Aralıklı tekrar, sesli pratik ve küçük günlük alışkanlıklar. Günde birkaç dakika, kalıcı sonuçlar.</p>`;
      case 1: return `
        <div class="pip-row">${pip({ mood: 'happy', pose: 'wave', size: 90 })}<div class="bubble">Sana nasıl hitap etmemi istersin?</div></div>
        <h2 class="h1 mt-l">Adın ne?</h2>
        <input class="text-in mt" id="nm" maxlength="24" placeholder="Adını yaz" value="${esc(d.name)}" autocomplete="given-name">`;
      case 2: return `
        <h2 class="h1">İngilizcen şu an <span class="serif">nasıl?</span></h2>
        <p class="muted mt-s">İçeriklerin seviyene göre hazırlanır. Sonra her zaman değiştirebilirsin.</p>
        ${tested ? `<div class="form-ok mt">Testine göre önerilen seviye seçildi 🎯</div>` : ''}
        <div class="stack gap-s mt">${APP.levels.map(l => choice(d.level === l.id, l.emoji, `${l.title} <span class="tag">${l.cefr}</span>`, l.desc, `data-level="${l.id}"`)).join('')}</div>
        <button class="choice squish mt-s" data-test style="border:2px dashed var(--line-2);background:transparent"><span class="em">🧪</span><span><b>Seviyemi bilmiyorum</b><span>2 dakikalık kısa bir testle belirleyelim</span></span><span class="side">${icon.arrow}</span></button>`;
      case 3: return `
        <h2 class="h1">Öğrenme <span class="serif">yolun</span></h2>
        <p class="muted mt-s">İki yol da açık kalır; ana rotanı seç.</p>
        <div class="stack gap-s mt">
          ${choice(d.track === 'freq', '📈', 'En çok kullanılan 1000', 'Sıklığa göre sıralı. İlk 1000 kelime, günlük metinlerin büyük kısmını kapsar — en verimli yol.', 'data-track="freq"')}
          ${choice(d.track === 'life', '🧺', 'En çok bilinen günlük kelimeler', '16 tema, emoji ve örnek cümlelerle. Somut ve görsel başlangıç.', 'data-track="life"')}
        </div>`;
      case 4: return `
        <h2 class="h1">Günlük <span class="serif">hedefin</span></h2>
        <p class="muted mt-s">Küçük ve tutarlı adımlar, uzun ama seyrek çalışmalardan daha etkilidir.</p>
        <div class="stack gap-s mt">${GOALS.map(g => choice(d.goal === g.xp, g.em, g.t, g.s, `data-goal="${g.xp}"`, `${g.xp} XP`)).join('')}</div>`;
      case 5: return `
        <h2 class="h1">Hangi <span class="serif">aksan?</span></h2>
        <p class="muted mt-s">Telaffuz dersleri ve seslendirmeler bu aksanla yapılır. Dinleyip seç!</p>
        <div class="stack gap-s mt">
          ${choice(d.accent === 'us', '🇺🇸', 'Amerikan İngilizcesi', 'Film, dizi, teknoloji dünyasında yaygın.', 'data-accent="us"', `<span class="spk-sm" data-hear="us">${icon.speaker}</span>`)}
          ${choice(d.accent === 'uk', '🇬🇧', 'İngiliz İngilizcesi', 'Avrupa ve akademide yaygın, "Received Pronunciation".', 'data-accent="uk"', `<span class="spk-sm" data-hear="uk">${icon.speaker}</span>`)}
        </div>
        <p class="faint small mt">İpucu: Birini seçip tutarlı olmak, ikisini karıştırmaktan daha iyidir.</p>`;
      case 6: {
        const g = GOALS.find(x => x.xp === d.goal);
        return `
        <div class="pip-row">${pip({ mood: 'think', pose: 'think', size: 80 })}<div class="bubble">Araştırmalar, <b>ne zaman ve nerede</b> çalışacağını önceden planlayanların alışkanlığı çok daha sık sürdürdüğünü gösteriyor.</div></div>
        <p class="eyebrow mt-l">Planın</p>
        <p class="intent mt-s">Her gün
          <select id="cue" aria-label="Tetikleyici">${CUES.map(c => `<option ${c === d.cue ? 'selected' : ''}>${c}</option>`).join('')}</select>
          sonra ${g.min} dakika İngilizce pratik yapacağım.</p>
        <p class="faint small mt">“Eğer X olursa, Y yapacağım” — uygulama niyeti (Gollwitzer, 1999).</p>`;
      }
    }
  }

  function foot() {
    if (step === 0) return `<button class="btn btn-primary btn-block" data-next>Hadi başlayalım ${icon.arrow}</button>`;
    if (step === 6) return `<button class="btn btn-primary btn-block hold" data-hold><span class="fill"></span><span>Basılı tut: Söz veriyorum</span></button>`;
    return `<div class="row gap-s">${step > 1 ? `<button class="icon-btn" data-back aria-label="Geri">${icon.back}</button>` : ''}<button class="btn btn-primary grow" data-next ${step === 1 && !d.name.trim() ? 'disabled' : ''}>Devam ${icon.arrow}</button></div>`;
  }

  function draw() {
    el.innerHTML = `<div class="ob">
      ${step > 0 ? `<div class="ob-steps">${Array.from({ length: TOTAL - 1 }, (_, i) => `<i class="${i < step ? 'on' : ''}"></i>`).join('')}</div>` : ''}
      <div class="ob-body">${body()}</div>
      <div class="ob-foot">${foot()}</div></div>`;
    bind();
  }

  function bind() {
    const nx = el.querySelector('[data-next]');
    nx && (nx.onclick = () => { sfx.tap(); step++; draw(); });
    el.querySelector('[data-back]')?.addEventListener('click', () => { step--; draw(); });
    const nm = el.querySelector('#nm');
    if (nm) {
      setTimeout(() => nm.focus(), 250);
      nm.oninput = () => { d.name = nm.value; nx.disabled = !d.name.trim(); };
      nm.onkeydown = e => { if (e.key === 'Enter' && d.name.trim()) nx.click(); };
    }
    el.querySelectorAll('[data-level]').forEach(b => b.onclick = () => { d.level = b.dataset.level; sfx.tap(); draw(); });
    el.querySelector('[data-test]')?.addEventListener('click', () => { persist(); navigate('/placement/onboarding'); });
    el.querySelectorAll('[data-track]').forEach(b => b.onclick = () => { d.track = b.dataset.track; sfx.tap(); draw(); });
    el.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => { d.goal = +b.dataset.goal; sfx.tap(); draw(); });
    el.querySelectorAll('[data-accent]').forEach(b => b.onclick = e => {
      d.accent = b.dataset.accent; sfx.tap();
      if (!e.target.closest('[data-hear]')) draw();
    });
    el.querySelectorAll('[data-hear]').forEach(s => s.addEventListener('click', e => {
      e.stopPropagation();
      const a = s.dataset.hear;
      speak(a === 'uk' ? 'Hello! Would you like a cup of tea? The weather is rather lovely today.' : 'Hi there! Do you wanna grab a coffee? The weather is pretty awesome today.', { accent: a });
    }));
    const cue = el.querySelector('#cue'); cue && (cue.onchange = () => d.cue = cue.value);

    const hold = el.querySelector('[data-hold]');
    if (hold) {
      let tm;
      const start = e => { e.preventDefault(); hold.classList.add('holding'); navigator.vibrate?.(20); tm = setTimeout(commit, 1200); };
      const stop = () => { hold.classList.remove('holding'); clearTimeout(tm); };
      hold.addEventListener('pointerdown', start);
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => hold.addEventListener(ev, stop));
      hold.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { if (!hold.classList.contains('holding')) start(e); } });
      hold.addEventListener('keyup', stop);
      hold.addEventListener('contextmenu', e => e.preventDefault());
    }
  }

  function commit() {
    const g = GOALS.find(x => x.xp === d.goal);
    sessionStorage.removeItem('pl_ob');
    APP.userLevel = d.level;
    loadContent(d.level).catch(() => { });
    setProfile({ name: d.name.trim(), level: d.level, goal: g.xp, dailyNew: g.n, minutes: g.min, accent: d.accent, track: d.track, cue: d.cue, createdAt: Date.now() });
    track('onboarding_done', { level: d.level, goal: g.xp, track: d.track, accent: d.accent });
    sfx.done(); confetti();
    setTimeout(() => { navigate('/home'); toast(`Planın hazır, ${esc(d.name.trim())}! İlk pratiğin seni bekliyor.`, { icon: '🌱' }); }, 500);
  }

  draw();
}

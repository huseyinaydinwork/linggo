// Modül tanıtım turları: bir modüle ilk girişte 3–5 adımlık hareketli (motion design) anlatım
import { tourSeen, markTour, track } from './store.js';
import { pip } from './mascot.js';
import { icon, ring, sfx } from './ui.js';

const bars = hs => `<div class="a-bars">${hs.map((h, i) => `<i style="--h:${h}%;--d:${i}"></i>`).join('')}</div>`;
const curve = () => `<svg class="a-curve" viewBox="0 0 290 160" aria-hidden="true">
  <path d="M10 20 C40 90 70 130 280 148" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="2.5" stroke-dasharray="5 6"/>
  <path class="draw" d="M10 20 C24 50 34 62 46 66 L46 20 C66 44 82 54 98 56 L98 20 C128 36 150 44 170 46 L170 20 C210 30 250 34 280 36" fill="none" stroke="#D4F65A" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
  ${[46, 98, 170].map((x, i) => `<circle cx="${x}" cy="20" r="6" fill="#FF6B45" style="animation-delay:${0.6 + i * 0.5}s"/>`).join('')}
  <text x="10" y="156" fill="rgba(255,255,255,.5)" font-size="11">Bugün</text><text x="236" y="156" fill="rgba(255,255,255,.5)" font-size="11">30 gün</text>
</svg>`;

const TOURS = {
  words: { pose: 'point', steps: [
    { art: () => bars([30, 45, 60, 70, 78, 84, 88, 91, 94, 96]), t: 'En verimli 1000 kelime', d: 'Kelimeler kullanım sıklığına göre sıralı. İlk üniteler bile günlük konuşmanın çok büyük kısmını kapsar — en az emekle en çok anlama.' },
    { art: () => `<div class="a-stages">${[['Yeni', '#EDE7DB'], ['Öğre-<br>niliyor', '#FFCF5C'], ['Peki-<br>şiyor', '#72C4FF'], ['Kalıcı', '#D4F65A']].map(([t, c], i) => `${i ? `<em style="--d:${i}"></em>` : ''}<span style="background:${c};--d:${i}">${t}</span>`).join('')}</div>`, t: 'Her kelime 4 aşamadan geçer', d: 'Listede her kelimenin yanındaki renkli nokta, hafızandaki yerini gösterir. Hedef: hepsini yeşile, yani kalıcı hafızaya taşımak.' },
    { art: curve, t: 'Tam unutacakken hatırlatırız', d: 'Aralıklı tekrar algoritması, her kelimeyi unutmak üzere olduğun anda geri getirir. Böylece daha az tekrarla daha çok hatırlarsın.' },
    { art: () => `<div class="a-chips">${['hello', 'time', 'people', 'water', 'friend', 'good'].map((w, i) => `<span style="left:${[10, 110, 180, 30, 120, 60][i]}px;top:${[14, 6, 50, 80, 96, 132][i] - 10}px;--d:${i};--x:${(i - 3) * 30}px">${w}</span>`).join('')}</div>`, t: 'Her gün küçük bir paket', d: '"Günün kelimeleri" her sabah hazır. Ünitelere dokunarak kendi hızında da ilerleyebilirsin.' },
  ] },
  patterns: { pose: 'wave', steps: [
    { art: () => `<div class="a-slot">I'm into <span class="sw"><b>photography.<br>cooking.<br>jazz.<br>photography.</b></span></div>`, t: 'Kalıp = hazır cümle iskeleti', d: 'Anadili İngilizce olanlar kelime kelime değil, kalıplarla konuşur. Bir kalıbı öğren, boşluğa istediğini koy.' },
    { art: () => `<div class="a-wave">${Array.from({ length: 22 }, (_, i) => `<i style="--d:${i}"></i>`).join('')}</div>`, t: 'Dinle ve gölgele', d: 'Örnekleri dinle, hemen ardından aynı ritimle tekrar et. Gölgeleme (shadowing), akıcılığın en hızlı yoludur.' },
    { art: () => `<div class="a-tiles"><div class="r1">${["I'd", 'like', 'to', 'pay'].map((w, i) => `<span style="--d:${i}">${w}</span>`).join('')}</div></div>`, t: 'Kur, doldur, söyle', d: 'Her kalıpta 6 alıştırma: boşluk doldurma, kelime karolarıyla cümle kurma ve sesli söyleme.' },
    { art: () => `<div class="a-ring">${ring(0.75, { size: 150, stroke: 14, track: 'rgba(255,255,255,.12)' })}<b>3/4</b></div>`, t: 'Seviye çubukları', d: 'Her pratik kalıbı bir seviye yükseltir ve bir sonraki tekrarı 1 → 3 → 7 → 16 gün sonraya planlar.' },
  ] },
  sounds: { pose: 'wave', steps: [
    { art: () => `<div class="a-morph"><div>${['though', 'through', 'tough'].map((w, i) => `<span style="--d:${i}">${w}</span>`).join('')}</div><div class="ipa">${['/ðəʊ/', '/θruː/', '/tʌf/'].map((w, i) => `<span style="--d:${i + 3}">${w}</span>`).join('')}</div></div>`, t: 'Yazılış ≠ okunuş', d: 'İngilizcede aynı harfler farklı okunabilir. Fonetik alfabe (IPA) her sesi tek bir sembolle gösterir.' },
    { art: () => `<div style="display:flex;gap:6px">${['smile', 'round', 'th', 'wide'].map(m => pip({ size: 66, mouth: m, mood: 'idle' })).join('')}</div>`, t: 'Pip ağzını gösterir', d: 'Bir sese dokun: Pip o sesin ağız şeklini gösterir, örnek kelimeleri seslendirir. Aynaya bakıp taklit et!' },
    { art: () => `<div class="a-toggle"><i></i><span>🇺🇸 ABD</span><span>🇬🇧 UK</span></div>`, t: 'Aksanını seç', d: 'Amerikan ya da İngiliz aksanı arasında geçiş yap; tüm seslendirmeler ve IPA gösterimi buna göre değişir.' },
    { art: () => `<div class="a-flip"><div style="background:#72C4FF">ship<small>/ʃɪp/</small></div><div style="background:#FFB3CF">sheep<small>/ʃiːp/</small></div></div>`, t: 'Kulağını eğit', d: 'Ses çiftleri oyununda duyduğunu seç. Türk öğrencilerin en çok karıştırdığı 24 ses çiftine odaklanır.' },
    { art: () => `<div class="a-icons"><span style="--d:0">🎬</span><span style="--d:1">👄</span><span style="--d:2">🔁</span></div>`, t: 'Pip\'le mini dersler', d: 'Hikâye formatında kısa animasyonlu dersler: Türkçe anlatım, ağız animasyonu ve İngilizce örnek bir arada.' },
  ] },
  progress: { pose: 'cheer', steps: [
    { art: () => `<div class="a-ring">${ring(0.82, { size: 150, stroke: 14, track: 'rgba(255,255,255,.12)' })}<b>82%</b></div>`, t: 'Günlük hedef halkası', d: 'Her doğru cevap XP kazandırır. Halkayı kapatınca günlük hedefin tamam — küçük ama her gün.' },
    { art: () => `<div class="a-icons"><span style="--d:0">🔥</span><span style="--d:1">❄️</span><span style="--d:2">🏆</span></div>`, t: 'Seri ve dondurucu', d: 'Her gün pratik yaptıkça serin büyür. Bir gün kaçırırsan seri dondurucu seni korur; her 7 günde bir yenisini kazanırsın.' },
    { art: () => `<div class="a-heat">${Array.from({ length: 60 }, (_, i) => `<i style="--d:${i};--c:${['#3A4A10', '#8DB62A', '#D4F65A', '#9ACD1E', 'rgba(255,255,255,.1)'][(i * 7 + i % 3) % 5]}"></i>`).join('')}</div>`, t: 'Isı haritası & haftalık rapor', d: 'Her gün bir kare. Haftalık raporun bu haftayı geçen haftayla karşılaştırır.' },
    { art: curve, t: 'Hafızanı gör', d: 'Kaç kelimenin kalıcı hafızada olduğunu ve unutma eğrisini nasıl büktüğümüzü burada izlersin.' },
  ] },
  session: { pose: 'cheer', steps: [
    { art: () => `<div class="a-flip"><div style="background:#F3EEE4">apple<small>🍎</small></div><div style="background:#D4F65A">elma<small>?</small></div></div>`, t: 'Önce tanı, sonra hatırla', d: 'Yeni kelimeyi tanıtırız, birkaç adım sonra sorarız. Hatırlamaya çalışmak, tekrar okumaktan çok daha kalıcıdır.' },
    { art: () => `<div class="a-retry"><div>kahve</div><div class="w">lezzetli</div><div class="r">elma</div></div>`, t: 'Hata = öğrenme fırsatı', d: 'Can kaybı ya da ceza yok. Yanlış cevaplanan kelime birkaç adım sonra tekrar gelir; beynin onu böyle güçlendirir.' },
    { art: () => `<div class="a-combo">${icon.bolt}<b>+5</b></div>`, t: 'Kombo ve XP', d: 'Üst üste doğru cevaplar bonus XP getirir. Hızlı ve doğru cevaplar kelimeyi daha ileri bir tarihe planlar.' },
    { art: () => `<div class="a-mic">${icon.mic}</div>`, t: 'Sesli söyle', d: 'Kelimeleri yüksek sesle tekrar et. Konuşma alıştırmalarında mikrofonla telaffuzunu da ölçeriz.' },
  ] },
};

// Show tour once per module; resolves when closed
export function maybeTour(m) {
  if (tourSeen(m) || !TOURS[m]) return Promise.resolve(false);
  return runTour(m);
}

export function runTour(m) {
  const T = TOURS[m];
  return new Promise(resolve => {
    let i = 0, x0 = null;
    const wrap = document.createElement('div');
    wrap.className = 'tour-wrap';
    wrap.innerHTML = `<div class="tour-bd"></div><div class="tour" role="dialog" aria-modal="true" aria-label="Nasıl çalışır">
      <div class="tour-top"><span class="eyebrow">Nasıl çalışır · <span data-n></span></span><button class="skip" data-skip>Geç</button></div>
      <div class="tour-art" data-art></div>
      <div class="tour-body" data-body></div>
      <div class="tour-foot"><div class="dots">${T.steps.map(() => '<i></i>').join('')}</div>
        <button class="icon-btn" data-prev aria-label="Geri">${icon.back}</button>
        <button class="btn btn-primary" data-next></button></div></div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('in'));
    const art = wrap.querySelector('[data-art]'), body = wrap.querySelector('[data-body]');
    const draw = () => {
      const s = T.steps[i];
      art.innerHTML = `<div class="art">${s.art()}</div>${pip({ size: 96, mood: i === T.steps.length - 1 ? 'wow' : 'happy', pose: i === 0 ? T.pose : i === T.steps.length - 1 ? 'cheer' : 'idle' })}`;
      body.innerHTML = `<h3>${s.t}</h3><p>${s.d}</p>`;
      wrap.querySelector('[data-n]').textContent = `${i + 1}/${T.steps.length}`;
      wrap.querySelectorAll('.dots i').forEach((d, k) => d.classList.toggle('on', k === i));
      wrap.querySelector('[data-prev]').style.visibility = i ? 'visible' : 'hidden';
      wrap.querySelector('[data-next]').innerHTML = i === T.steps.length - 1 ? `Başlayalım ${icon.arrow}` : `İleri ${icon.arrow}`;
    };
    const close = done => {
      markTour(m); track(done ? 'tour_done' : 'tour_skip', { m, step: i + 1 });
      wrap.classList.remove('in'); document.removeEventListener('keydown', onKey);
      setTimeout(() => { wrap.remove(); resolve(true); }, 450);
    };
    const next = () => { sfx.tap(); if (i < T.steps.length - 1) { i++; draw(); } else close(true); };
    const prev = () => { if (i > 0) { i--; draw(); } };
    const onKey = e => { if (e.key === 'ArrowRight' || e.key === 'Enter') next(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'Escape') close(false); };
    document.addEventListener('keydown', onKey);
    wrap.querySelector('[data-next]').onclick = next;
    wrap.querySelector('[data-prev]').onclick = prev;
    wrap.querySelector('[data-skip]').onclick = () => close(false);
    const t = wrap.querySelector('.tour');
    t.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    t.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (dx < -50) next(); else if (dx > 50) prev(); });
    draw();
  });
}

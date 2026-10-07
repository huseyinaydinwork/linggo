// Tanıtım sayfası (giriş yapmamış ziyaretçiler)
import { api } from '../api.js';
import { pip as pip0, lookAt } from '../mascot.js';
import { look } from '../wear.js';
// logged-out pages: Pip wears his signature look
const pip = (o = {}) => pip0({ outfit: look('hat', 'glasses', 'top', 'bag', 'shoes'), ...o });
import { icon, esc, brandMark } from '../ui.js';

const fmt = n => (n || 0).toLocaleString('tr-TR');

export function landingView(el) {
  document.body.classList.add('wide');
  el.innerHTML = page({ free: { units: 3, themes: 4, patterns: 12, lessons: 3, accent: 3, pairsPerDay: 1 }, perks: [], totals: { words: 1519, patterns: 45, lessons: 8, themes: 16 }, sounds: 44, pairs: 24 });
  wire(el);
  let off = () => { };
  api('/api/public').then(p => { if (!el.isConnected) return; el.innerHTML = page(p); off(); off = wire(el); }).catch(() => { });
  return () => { off(); document.body.classList.remove('wide'); };
}

function wire(el) {
  el.querySelectorAll('[data-scroll]').forEach(b => b.onclick = () => el.querySelector('#' + b.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  el.querySelectorAll('.reveal').forEach(n => io.observe(n));
  const off = lookAt(el.querySelector('.lp-stage .pip'));
  return () => { io.disconnect(); off(); };
}

const check = t => `<li>${icon.check}<span>${t}</span></li>`;
const no = t => `<li class="no">${icon.x}<span>${t}</span></li>`;

function page(p) {
  const f = p.free, T = p.totals;
  return `<div class="lp">
  <nav class="lp-nav"><div class="lp-wrap">
    <a class="brand" href="#/">${brandMark()}</a>
    <div class="lp-links"><button data-scroll="features">Özellikler</button><button data-scroll="how">Nasıl çalışır</button><button data-scroll="science">Bilim</button><button data-scroll="pricing">Fiyatlar</button><button data-scroll="faq">SSS</button></div>
    <span class="sp"></span>
    <a class="btn btn-ghost btn-sm hide-sm" href="#/login">Giriş yap</a>
    <a class="btn btn-primary btn-sm" href="#/register">Ücretsiz başla</a>
  </div></nav>

  <header class="lp-hero"><div class="lp-wrap lp-hero-grid">
    <div>
      <span class="lp-kicker"><b>YENİ</b> Bilimsel İngilizce koçun cebinde</span>
      <h1 class="lp-title">İngilizceyi <span class="hl">kalıcı</span> öğrenmenin <span class="serif">bilimsel</span> yolu.</h1>
      <p class="lp-sub">Aralıklı tekrar, sesli pratik ve maskotumuz Pip'le günde 10 dakika. En çok kullanılan kelimeler, gündelik cümle kalıpları, IPA ve aksan eğitimi — hepsi tek uygulamada.</p>
      <div class="lp-cta"><a class="btn btn-lime" href="#/register">Ücretsiz başla ${icon.arrow}</a><button class="btn btn-soft" data-scroll="how">${icon.play} Nasıl çalışır?</button></div>
      <div class="lp-proof"><span>${icon.check} Kredi kartı gerekmez</span><span>${icon.check} Mobil tarayıcıda çalışır</span><span>${icon.check} Türkçe konuşanlar için tasarlandı</span></div>
    </div>
    <div class="lp-stage">
      <div class="phone"><div class="phone-notch"></div><div class="phone-in">
        <div class="row between"><span style="font:700 12px var(--f-body);color:#8F887D">🔥 12 · ⚡ 45 XP</span><span style="width:120px;height:10px;border-radius:9px;background:rgba(18,18,18,.07);overflow:hidden;display:block"><i style="display:block;width:64%;height:100%;background:linear-gradient(180deg,#E4FF84,#BDE932);border-radius:9px"></i></span></div>
        <p style="margin-top:22px;font:650 12px var(--f-body);color:#55514A">● Yeni kelime · Anlamı neydi?</p>
        <div class="mini-q">apple</div>
        <div class="mini-opt">kahve</div><div class="mini-opt ok">elma</div><div class="mini-opt">lezzetli</div><div class="mini-opt">pirinç</div>
        <div style="margin-top:16px;padding:12px;border-radius:14px;background:#DCF6C6;color:#17A058;font:800 16px var(--f-display);animation:rise .5s 1.6s both">✓ Harika! apple = elma</div>
      </div></div>
      <div class="float-chip" style="top:8%;left:-2%;animation-delay:-1s"><span class="ic" style="background:#FFE3DC">🔥</span><span>12 günlük seri<small>Bir gün kaçırsan da dondurucu var</small></span></div>
      <div class="float-chip" style="top:40%;right:-4%;animation-delay:-2.4s"><span class="ic" style="background:#E4FF84">🧠</span><span>Sonraki tekrar: 3 gün<small>Tam unutacakken</small></span></div>
      <div class="float-chip" style="bottom:12%;left:-6%;animation-delay:-3.2s"><span class="ic ipa" style="background:#FFF1C9;font-size:13px">/θ/</span><span>think<small>Dil dişlerin arasında</small></span></div>
      <div style="position:absolute;right:2%;bottom:-2%;z-index:4">${pip({ size: 150, mood: 'happy', pose: 'wave' })}</div>
    </div>
  </div></header>

  <section class="lp-wrap reveal"><div class="lp-sci" style="grid-template-columns:repeat(4,1fr)">
    ${[[fmt(T.words) + '+', 'kelime, sıklık sırasına göre'], [fmt(T.patterns), 'gündelik cümle kalıbı'], [fmt(p.sounds), 'IPA sesi + ABD/UK aksan'], [fmt(T.lessons), 'Pip\'le animasyonlu ders']].map(([n, t]) => `<div><span class="lp-num" style="font-size:44px">${n}</span><p style="margin-top:6px">${t}</p></div>`).join('')}
  </div></section>

  <section class="lp-sec" id="features"><div class="lp-wrap">
    <div class="lp-sec-head reveal"><p class="eyebrow">Özellikler</p><h2 class="lp-h2">Kelimeden konuşmaya, <span class="serif">uçtan uca.</span></h2><p class="lp-lead">Her modül tek bir soruya cevap verir: bunu yarın da hatırlayacak mısın?</p></div>
    <div class="lp-bento">
      <article class="lp-card dark c4 reveal"><p class="eyebrow" style="color:rgba(243,238,228,.5)">Aralıklı tekrar motoru</p><h3 style="margin-top:8px">Tam unutacakken hatırlatır.</h3><p>Her kelimenin kendi hafıza kartı var. Cevabının doğruluğu ve hızına göre bir sonraki tekrar günü hesaplanır.</p>
        <svg viewBox="0 0 600 150" style="width:100%;margin-top:auto" aria-hidden="true"><path d="M0 20 C80 100 160 130 600 140" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="2" stroke-dasharray="5 6"/><path d="M0 20 C30 60 50 70 80 72 L80 20 C130 50 160 58 200 60 L200 20 C280 36 330 42 380 44 L380 20 C470 28 540 30 600 32" fill="none" stroke="#D4F65A" stroke-width="4" stroke-linejoin="round"/>${[80, 200, 380].map(x => `<circle cx="${x}" cy="20" r="7" fill="#FF6B45"/>`).join('')}</svg></article>
      <article class="lp-card tone c2 reveal" style="background:var(--grad-lime)"><p class="eyebrow">Kelimeler</p><h3 style="margin-top:8px">En çok kullanılan 1000</h3><p>Sıklığa göre üniteler + 16 temada günlük hayat kelimeleri, emoji ve örnek cümlelerle.</p><span class="lp-num">1000</span></article>
      <article class="lp-card tone c2 reveal" style="background:var(--pink)"><p class="eyebrow">Kalıplar</p><h3 style="margin-top:8px">“I'm looking forward to…”</h3><p>${fmt(T.patterns)} hazır kalıp: boşluk doldur, cümle kur, sesli söyle.</p></article>
      <article class="lp-card tone c2 reveal" style="background:var(--sun)"><p class="eyebrow">Telaffuz</p><h3 style="margin-top:8px">IPA & aksan</h3><p>Pip ağız şeklini gösterir. ABD ya da İngiliz aksanını seç.</p><span class="lp-num ipa" style="font-weight:500">/θɪŋk/</span></article>
      <article class="lp-card tone c2 reveal" style="background:var(--sky)"><p class="eyebrow">Mini dersler</p><h3 style="margin-top:8px">Pip anlatıyor</h3><p>Hikâye formatında animasyonlu dersler: TH, schwa, V/W…</p><span class="art-corner">${pip({ size: 120, mouth: 'th', mood: 'happy' })}</span></article>
      <article class="lp-card c3 reveal"><p class="eyebrow">Konuşma</p><h3 style="margin-top:8px">Sesli söyle, ölçelim.</h3><p>Konuşma tanıma ile telaffuzuna anında geri bildirim; gölgeleme turlarıyla ritim ve tonlama.</p><div class="a-wave" style="margin-top:auto;height:60px">${Array.from({ length: 34 }, (_, i) => `<i style="--d:${i};background:var(--ink)"></i>`).join('')}</div></article>
      <article class="lp-card c3 reveal"><p class="eyebrow">Alışkanlık</p><h3 style="margin-top:8px">Günlük hedef, seri, haftalık mühür.</h3><p>Küçük hedefler, görünür ilerleme ve seri dondurucu. Tek bir kaçırılan gün motivasyonunu yıkmaz.</p><div style="display:flex;gap:6px;margin-top:auto">${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d, i) => `<span style="flex:1;aspect-ratio:1;border-radius:12px;display:grid;place-items:center;font:700 11px var(--f-body);background:${i < 5 ? 'var(--grad-lime)' : i === 5 ? 'var(--sky)' : 'var(--track)'};color:#121212">${i < 5 ? '✓' : i === 5 ? '❄' : d}</span>`).join('')}</div></article>
    </div>
  </div></section>

  <section class="lp-sec" id="how"><div class="lp-wrap">
    <div class="lp-sec-head c reveal"><p class="eyebrow">Nasıl çalışır</p><h2 class="lp-h2">Günde 10 dakika. <span class="serif">Üç adım.</span></h2></div>
    <div class="lp-steps">
      <div class="lp-step reveal"><h3>Planını kur</h3><p>Seviyeni, hedefini ve aksanını seç. “Her gün sabah kahvemden sonra 10 dakika” gibi bir plan yap; Pip seni hatırlatır.</p></div>
      <div class="lp-step reveal"><h3>Pratik yap</h3><p>Günlük oturum; tekrar zamanı gelen kelimeleri ve günün yeni kelimelerini karışık alıştırmalarla getirir.</p></div>
      <div class="lp-step reveal"><h3>Kalıcı hâle getir</h3><p>Haftalık pekiştirme, kalıplar ve sesli pratikle öğrendiklerin kısa süreli hafızadan kalıcı hafızaya geçer.</p></div>
    </div>
  </div></section>

  <section class="lp-sec" id="science"><div class="lp-wrap">
    <div class="lp-sec-head reveal"><p class="eyebrow">Bilim</p><h2 class="lp-h2">Sihir yok, <span class="serif">bilim var.</span></h2><p class="lp-lead">Her özellik, öğrenme bilimi ve davranış bilimindeki sağlam bulgulara dayanır.</p></div>
    <div class="lp-sci">
      ${[['📈', 'Aralıklı tekrar', 'Artan aralıklarla tekrar, toplu çalışmadan çok daha kalıcıdır.'], ['🎯', 'Hatırlama pratiği', 'Kendini test etmek, yeniden okumaktan güçlü bir öğrenme olayıdır.'], ['🔀', 'Serpiştirme', 'Karışık alıştırmalar ayırt etmeyi ve transferi güçlendirir.'], ['🖼️', 'Çift kodlama', 'Görsel + sözel bilgi iki ayrı yoldan hafızaya yazılır.'], ['🗣️', 'Üretim etkisi', 'Sesli söylemek, sessiz okumaya göre hatırlamayı artırır.'], ['👂', 'Fonetik eğitim', 'Ses ayrımlarını kulağın öğrenince telaffuz da gelişir.'], ['📅', 'Uygulama niyeti', '“X olunca Y yapacağım” planı alışkanlığı sürdürmeyi kolaylaştırır.'], ['🌱', 'Ceza yok', 'Hata, geri bildirimle birleşince en güçlü öğrenme anıdır.']].map(([e, t, d]) => `<div class="reveal"><i>${e}</i><b>${t}</b><p>${d}</p></div>`).join('')}
    </div>
  </div></section>

  <section class="lp-sec" id="pricing"><div class="lp-wrap">
    <div class="lp-sec-head c reveal"><p class="eyebrow">Fiyatlar</p><h2 class="lp-h2">Ücretsiz başla. <span class="serif">Hazır olunca</span> yüksel.</h2></div>
    <div class="lp-price">
      <div class="plan reveal"><h3>Ücretsiz</h3><div class="price">0 ₺ <small>/ sonsuza dek</small></div><p class="muted">Temelleri öğren, alışkanlığını kur.</p>
        <ul>${check(`Seviyene özel ${f.units < 0 ? "tüm" : f.units} ünite (${f.units < 0 ? "sınırsız" : fmt(f.units * 100)} kelime) + IPA telaffuz`)}${check(`Seviyendeki ${f.themes < 0 ? "tüm" : f.themes} tema, ${f.patterns < 0 ? "tüm" : f.patterns} cümle kalıbı`)}${check(`Tüm ${fmt(p.sounds)} IPA sesi ve seviye testi`)}${check(`${f.lessons < 0 ? "Tüm" : f.lessons} mini ders · ${f.accent < 0 ? "tüm" : f.accent} aksan konusu`)}${check(`Günde ${f.pairsPerDay < 0 ? "sınırsız" : f.pairsPerDay} ses çifti oyunu`)}${check("Pip Market: yaprak kazan, Pip'i giydir")}${f.weekly ? check("Haftalık pekiştirme") : no("Haftalık pekiştirme")}${f.otherLevels ? check("Tüm seviyelerin içeriği") : no("Diğer seviyelerin içeriği")}</ul>
        <a class="btn btn-soft btn-block" href="#/register">Ücretsiz başla</a></div>
      <div class="plan pro-plan reveal"><div class="row between"><h3>Premium</h3><span class="pro">${icon.sparkle} En popüler</span></div><div class="price">Pro <small>· esnek planlar</small></div><p class="muted">Tüm içerik, sınırsız pratik.</p>
        <ul>${(p.perks?.length ? p.perks : ['Tüm kelimeler, temalar, kalıplar ve dersler', 'Sınırsız ses çifti oyunu', 'Haftalık pekiştirme']).map(x => check(esc(x))).join('')}</ul>
        <p class="small" style="opacity:.6">${esc(p.priceNote || '')}</p>
        <a class="btn btn-lime btn-block" href="#/register">Hesap oluştur, Premium'a geç</a></div>
    </div>
  </div></section>

  <section class="lp-sec" id="faq"><div class="lp-wrap">
    <div class="lp-sec-head c reveal"><p class="eyebrow">SSS</p><h2 class="lp-h2">Aklındaki sorular</h2></div>
    <div class="faq">
      ${[['Uygulama indirmem gerekiyor mu?', 'Hayır. Linggo mobil tarayıcıda çalışır. İstersen tarayıcı menüsünden “Ana ekrana ekle” diyerek uygulama gibi kullanabilirsin.'],
    ['Hangi seviyeye uygun?', 'Sıfırdan başlayanlardan orta-ileri seviyeye kadar. Başlangıçta seviyeni seçersin; kelime listesinde başlangıç noktan buna göre ayarlanır.'],
    ['Günde ne kadar zaman ayırmalıyım?', 'Hedefini sen seçersin: 5, 10, 15 ya da 20+ dakika. Araştırmalar kısa ama düzenli çalışmanın uzun ve seyrek çalışmadan daha etkili olduğunu gösteriyor.'],
    ["Premium'a nasıl geçerim?", "Uygulama içindeki “Premium'a geç” butonuyla bize WhatsApp'tan yazman yeterli; hesabın hızla aktif edilir. Online ödeme çok yakında."],
    ['İlerlemem kaybolur mu?', 'Hayır. İlerlemen hesabına kaydedilir ve tüm cihazlarında senkronize olur.']].map(([q, a]) => `<details class="reveal"><summary>${q}</summary><p>${a}</p></details>`).join('')}
    </div>
  </div></section>

  <div class="lp-wrap"><section class="lp-final reveal">
    <div style="display:flex;justify-content:center">${pip({ size: 140, mood: 'wow', pose: 'cheer' })}</div>
    <h2 class="lp-h2" style="margin-top:10px">Bugün başla, <span class="serif">yarın hatırla.</span></h2>
    <p style="opacity:.7;margin-top:12px">İlk oturumun 5 dakika sürer.</p>
    <div class="lp-cta" style="justify-content:center"><a class="btn btn-lime" href="#/register">Ücretsiz hesap oluştur ${icon.arrow}</a></div>
  </section>
  <footer class="lp-foot"><span>© ${new Date().getFullYear()} Linggo · İngilizceyi bilimle öğren</span><span><a href="#/login">Giriş</a> · <a href="#/register">Kayıt</a></span></footer></div>
</div>`;
}

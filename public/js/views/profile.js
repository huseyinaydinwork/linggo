// Profil sekmesi: kimlik kartı → ilerleme (üstte) → tüm ayarlar (aşağıda) + "Linggo'nun bilimi" sayfası
import { state, save, profile, setProfile, settings, setSetting, exportJSON, importJSON, resetAll, levelInfo, totalXP, currentStreak } from '../store.js';
import { icon, esc, toast, confirmSheet } from '../ui.js';
import { speak, canListen, hasVoice, voicesFor, voiceFor } from '../speech.js';
import { loadContent, levelInfo as lvInfo, featOn } from '../content.js';
import { M } from '../market.js';
import { pip } from '../mascot.js';
import { navigate, logout } from '../app.js';
import { APP, isPremium, isAdmin } from '../content.js';
import { post } from '../api.js';
import { paywall, proBadge } from '../premium.js';
import { sheet } from '../ui.js';
import { progressHTML, wireProgress } from './progress.js';

export function profileView(el, { section } = {}) {
  const p = profile(), st = settings();
  const sel = (key, opts, val) => `<select class="set-select" data-p="${key}">${opts.map(([v, t]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  const sw = (key, on) => `<button class="switch ${on ? 'on' : ''}" data-s="${key}" role="switch" aria-checked="${on}"></button>`;

  const lv = lvInfo();
  el.innerHTML = `
    <header class="topbar"><h1 class="h1">Profil</h1><button class="icon-btn" data-jump="settings" aria-label="Ayarlara in">${icon.settings}</button></header>
    <section class="card lime prof-id">
      <div class="row gap">${pip({ size: 84, mood: 'happy' })}
        <div class="grow"><input class="text-in" style="font-size:28px;height:44px;border-color:var(--lime-ink)" value="${esc(p.name)}" data-name aria-label="Adın" maxlength="24">
        <p class="small" style="margin-top:6px">${lv ? `${esc(lv.emoji)} ${esc(lv.cefr)} ${esc(lv.title)} · ` : ''}${isPremium() ? 'Premium' : 'Ücretsiz plan'}</p></div>
      </div>
      <p class="small mt" style="opacity:.75">Planın: “Her gün <b>${esc(p.cue || '')}</b> sonra ${p.minutes || 10} dakika.”</p>
    </section>
    <div class="prof-jump" role="tablist" aria-label="Profil bölümleri">
      <button data-jump="progress" class="on">📈 İlerleme</button><button data-jump="settings">⚙️ Ayarlar</button>
    </div>

    <div id="progress" class="prof-sec">${progressHTML()}</div>

    <div id="settings" class="prof-sec prof-settings">
    <div class="section-head section"><h2 class="h2">Ayarlar</h2></div>
    <p class="eyebrow mb">Hesap</p>
    <div class="set-group">
      <div class="set-row"><div class="l"><b>${esc(APP.user?.email || '')}</b><span>${APP.user?.verified ? '✅ E-posta doğrulandı' : 'Doğrulanmadı'}</span></div></div>
      <div class="set-row"><div class="l"><b>Plan: ${isPremium() ? 'Premium' : 'Ücretsiz'}</b><span>${isPremium() ? (APP.user?.planUntil ? new Date(APP.user.planUntil).toLocaleDateString('tr-TR') + ' tarihine kadar' : (APP.user?.role === 'admin' ? 'Yönetici hesabı' : 'Süresiz')) : 'Temel içerik açık'}</span></div>${isPremium() ? proBadge() : '<button class="btn btn-xs btn-primary" data-pro>Premium’a geç</button>'}</div>
      ${isAdmin() ? '<a class="set-row" href="/admin"><div class="l"><b>🛠 Yönetim paneli</b><span>Üyeler, planlar, içerik ve analizler</span></div></a>' : ''}
      <button class="set-row" style="width:100%;text-align:left" data-pw-change><div class="l"><b>Şifreyi değiştir</b><span>Diğer cihazlardaki oturumlar kapanır</span></div></button>
      <div class="set-row"><div class="l"><b>Gündem ve ipucu e-postaları</b><span>Haftalık özet, hatırlatmalar ve kampanyalar</span></div><button class="switch ${APP.user?.marketing ? 'on' : ''}" data-mkt role="switch" aria-checked="${!!APP.user?.marketing}"></button></div>
      <button class="set-row" style="width:100%;text-align:left" data-logout><div class="l"><b>Çıkış yap</b></div></button>
    </div>

    <p class="eyebrow section mb">Öğrenme</p>
    <div class="set-group">
      <div class="set-row"><div class="l"><b>Aksan</b><span>Seslendirme ve IPA gösterimi</span></div>${sel('accent', [['us', '🇺🇸 Amerikan'], ['uk', '🇬🇧 İngiliz']], p.accent)}</div>
      <div class="set-row"><div class="l"><b>Günlük hedef</b><span>XP cinsinden</span></div>${sel('goal', [[20, '20 · Rahat'], [50, '50 · Düzenli'], [80, '80 · Ciddi'], [120, '120 · Yoğun']], p.goal)}</div>
      <div class="set-row"><div class="l"><b>Günlük yeni kelime</b><span>Az ama düzenli daha kalıcıdır</span></div>${sel('dailyNew', [[3, '3'], [5, '5'], [8, '8'], [10, '10'], [12, '12'], [15, '15'], [20, '20']], p.dailyNew)}</div>
      <div class="set-row"><div class="l"><b>Ana rota</b><span>Günün kelimeleri buradan gelir</span></div>${sel('track', [['freq', 'En çok kullanılan'], ['life', 'Günlük hayat']], p.track)}</div>
      <div class="set-row"><div class="l"><b>Seviye</b><span>İçerikler seviyene göre gelir</span></div>${sel('level', APP.levels.map(l => [l.id, `${l.cefr} · ${l.title}`]), lvInfo()?.id)}</div>
      <a class="set-row" href="#/placement"><div class="l"><b>🧪 Seviye testini çöz</b><span>${state().placement ? `Son sonuç: ${String(state().placement.level).toUpperCase()}` : '2 dakikada seviyeni belirle'}${!featOn('placementRetest') && state().placement ? ' · Premium' : ''}</span></div>${icon.chevron.replace('<svg', '<svg width="18" height="18"')}</a>
      <div class="set-row"><div class="l"><b>Tetikleyici</b><span>Uygulama niyetin</span></div>${sel('cue', [['sabah kahvemi içtikten', 'Sabah kahvesi'], ['işe/okula giderken', 'Yolda'], ['öğle yemeğinden', 'Öğle yemeği'], ['akşam yemeğinden', 'Akşam yemeği'], ['dişlerimi fırçaladıktan', 'Yatmadan önce']], p.cue)}</div>
    </div>

    <p class="eyebrow section mb">Deneyim</p>
    <div class="set-group">
      <a class="set-row" href="#/market"><div class="l"><b>🎨 Pip Market & temalar</b><span>🍃 ${M.balance} yaprak · Pip'i giydir, uygulama temasını değiştir</span></div>${icon.chevron.replace('<svg', '<svg width="18" height="18"')}</a>
      <div class="set-row"><div class="l"><b>Aydınlık / karanlık</b></div><select class="set-select" data-set="theme">${[['auto', 'Sistem'], ['light', 'Açık'], ['dark', 'Koyu']].map(([v, t]) => `<option value="${v}" ${st.theme === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="set-row"><div class="l"><b>Konuşma hızı</b><span>Seslendirme temposu</span></div><select class="set-select" data-set="rate">${[[0.75, 'Yavaş'], [0.9, 'Rahat'], [1, 'Normal'], [1.1, 'Hızlı']].map(([v, t]) => `<option value="${v}" ${st.rate == v ? 'selected' : ''}>${t}</option>`).join('')}</select><button class="spk-sm" data-test aria-label="Test et">${icon.speaker}</button></div>
      <div class="set-row"><div class="l"><b>Ses efektleri</b></div>${sw('sound', st.sound)}</div>
      <div class="set-row"><div class="l"><b>Titreşim</b><span>Destekleyen cihazlarda</span></div>${sw('haptics', st.haptics)}</div>
      <div class="set-row"><div class="l"><b>Derslerde Türkçe altyazı</b><span>Pip her zaman İngilizce konuşur; altında Türkçe çeviri</span></div>${sw('trSubs', st.trSubs !== false)}</div>
    </div>
    <p class="eyebrow section mb">Sesler</p>
    <div class="set-group">
      ${[['en-US', '🇺🇸 Amerikan İngilizcesi', 'The weather is pretty awesome today.'], ['en-GB', '🇬🇧 İngiliz İngilizcesi', 'Would you like a cup of tea?']].map(([lang, label, sample]) => {
        const vs = voicesFor(lang), cur = voiceFor(lang);
        return `<div class="set-row"><div class="l"><b>${label}</b><span>${vs.length ? 'Cihaz sesi seç' : 'Cihazda bu dilde ses yok — sunucu sesi varsa o kullanılır'}</span></div>
          ${vs.length ? `<select class="set-select" data-voice="${lang}"><option value="">Otomatik (en iyisi)</option>${vs.map(v => `<option value="${esc(v.name)}" ${st.voices?.[lang] === v.name ? 'selected' : ''}>${esc(v.name.replace(/Microsoft |Google |\(.*?\)|Online|Natural/g, '').trim() || v.name)}</option>`).join('')}</select>` : ''}
          <button class="spk-sm" data-vtest="${lang}" data-sample="${esc(sample)}" aria-label="Dinle">${icon.speaker}</button></div>`;
      }).join('')}
    </div>
    <p class="tiny faint mt-s">İpucu: En doğal sesler için Chrome'da “Google” ya da Edge'de “Natural” sesleri seç. iPhone'da Ayarlar → Erişilebilirlik → Seslendirilen İçerik → Sesler bölümünden “Gelişmiş” sesleri indirebilirsin.</p>
    <p class="tiny faint mt-s">Konuşma tanıma: ${canListen ? '✅ kullanılabilir' : '⚠️ bu tarayıcıda/bağlantıda kullanılamıyor (HTTPS + Chrome/Safari gerekir). Konuşma alıştırmaları öz-değerlendirme ile çalışır.'}</p>

    <p class="eyebrow section mb">Hakkında</p>
    <div class="set-group">
      <a class="set-row" href="#/science"><div class="l"><b>🧠 Linggo'nun bilimi</b><span>Kullandığımız öğrenme yöntemleri</span></div>${icon.chevron.replace('<svg', '<svg width="18" height="18"')}</a>
      <button class="set-row" style="width:100%;text-align:left" data-export><div class="l"><b>İlerlemeyi dışa aktar</b><span>JSON yedeği indir</span></div>${icon.arrow.replace('<svg', '<svg width="18" height="18"')}</button>
      <label class="set-row" style="cursor:pointer"><div class="l"><b>Yedekten geri yükle</b><span>Başka cihazdan taşı</span></div><input type="file" accept="application/json" data-import class="sr">${icon.refresh.replace('<svg', '<svg width="18" height="18"')}</label>
      <button class="set-row" style="width:100%;text-align:left;color:var(--no)" data-reset><div class="l"><b>Tüm ilerlemeyi sıfırla</b><span style="color:inherit;opacity:.7">Hesabın kalır, ilerlemen silinir</span></div></button>
      <button class="set-row" style="width:100%;text-align:left;color:var(--no)" data-delete><div class="l"><b>Hesabımı sil</b><span style="color:inherit;opacity:.7">Tüm verilerinle birlikte kalıcı olarak</span></div></button>
    </div>
    <p class="tiny faint center mt">Linggo · İlerlemen hesabına kaydedilir ve cihazların arasında senkronize olur.</p>
    </div>`;

  wireProgress(el);
  // İlerleme / Ayarlar jump pills follow the scroll position
  const secs = ['progress', 'settings'].map(id => el.querySelector('#' + id));
  const pills = el.querySelectorAll('.prof-jump [data-jump]');
  const jump = id => { const t = el.querySelector('#' + id); window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - (id === 'progress' ? 72 : 58), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  el.querySelectorAll('[data-jump]').forEach(b => b.onclick = () => jump(b.dataset.jump));
  const onScroll = () => { const cur = secs[1].getBoundingClientRect().top < innerHeight * 0.45 ? 'settings' : 'progress'; pills.forEach(b => b.classList.toggle('on', b.dataset.jump === cur)); };
  window.addEventListener('scroll', onScroll, { passive: true });
  if (section === 'settings') requestAnimationFrame(() => requestAnimationFrame(() => jump('settings')));
  el.querySelector('[data-pro]')?.addEventListener('click', () => paywall('general'));
  el.querySelector('[data-logout]').onclick = () => logout();
  el.querySelector('[data-pw-change]').onclick = () => passwordSheet();
  el.querySelector('[data-delete]').onclick = () => deleteSheet();
  const nm = el.querySelector('[data-name]');
  nm.onchange = () => { if (nm.value.trim()) { setProfile({ name: nm.value.trim() }); toast('İsmin güncellendi'); } };
  el.querySelectorAll('[data-p]').forEach(s => s.onchange = () => {
    const k = s.dataset.p; let v = s.value;
    if (['goal', 'dailyNew'].includes(k)) v = +v;
    const patch = { [k]: v };
    if (k === 'goal') patch.minutes = { 20: 5, 50: 10, 80: 15, 120: 20 }[v];
    setProfile(patch);
    if (k === 'dailyNew' || k === 'track' || k === 'level') { state().dayWords = { date: null, ids: [] }; save(); }
    if (k === 'level') { APP.userLevel = v; loadContent(v).then(() => toast(`Seviyen ${lvInfo(v)?.cefr} olarak güncellendi 🎯`)).catch(() => { }); return; }
    toast('Kaydedildi');
    if (k === 'accent') speak(v === 'uk' ? 'Brilliant, British it is.' : 'Great, American it is.');
  });
  el.querySelectorAll('[data-set]').forEach(s => s.onchange = () => { setSetting(s.dataset.set, s.dataset.set === 'rate' ? +s.value : s.value); });
  el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const k = b.dataset.s, v = !settings()[k]; setSetting(k, v); b.classList.toggle('on', v); b.setAttribute('aria-checked', v); });
  el.querySelector('[data-test]').onclick = () => speak('The more you practice, the better you get.');
  el.querySelectorAll('[data-voice]').forEach(s => s.onchange = () => { const v = { ...(settings().voices || {}) }; if (s.value) v[s.dataset.voice] = s.value; else delete v[s.dataset.voice]; setSetting('voices', v); speak(s.closest('.set-row').querySelector('[data-vtest]').dataset.sample, { lang: s.dataset.voice }); });
  el.querySelectorAll('[data-vtest]').forEach(b => b.onclick = () => speak(b.dataset.sample, { lang: b.dataset.vtest }));
  el.querySelector('[data-mkt]').onclick = async e => { const b = e.currentTarget, on = !b.classList.contains('on'); try { await post('/api/account/marketing', { on }); APP.user.marketing = on; b.classList.toggle('on', on); toast(on ? 'E-posta bildirimleri açıldı 📬' : 'E-posta bildirimleri kapatıldı'); } catch (err) { toast(esc(err.message)); } };
  el.querySelector('[data-export]').onclick = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pratilange-yedek-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  el.querySelector('[data-import]').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { importJSON(await f.text()); toast('Yedek geri yüklendi ✅'); navigate('/home'); } catch (err) { toast('Dosya okunamadı: ' + esc(err.message)); }
  };
  el.querySelector('[data-reset]').onclick = async () => {
    if (await confirmSheet({ title: 'Her şeyi sıfırla?', text: 'Tüm kelimeler, seri ve XP silinecek. Bu işlem geri alınamaz.', ok: 'Evet, sıfırla', danger: true })) { resetAll(); navigate('/intro'); }
  };
  return () => window.removeEventListener('scroll', onScroll);
}

const SCIENCE = [
  { e: '📈', c: 'var(--coral)', t: 'Aralıklı tekrar', p: 'Ebbinghaus\'un unutma eğrisinden bu yana biliyoruz: bilgi zamanla hızla silinir. Tekrarları artan aralıklarla (1 → 3 → 7 → 16 gün…) yapmak, aynı sürede toplu çalışmaya göre çok daha kalıcı öğrenme sağlar.', app: 'Her kelimenin kendi hafıza kartı var. Cevabının doğruluğu ve hızına göre bir sonraki tekrar tarihi hesaplanır (SM-2 türevi algoritma).', r: 'Ebbinghaus (1885); Cepeda vd. (2006), Psychological Bulletin' },
  { e: '🎯', c: 'var(--lime)', t: 'Hatırlama pratiği (test etkisi)', p: 'Bilgiyi hafızadan çağırmaya çalışmak, onu tekrar okumaktan daha güçlü bir öğrenme olayıdır. Kısa, düşük riskli testler uzun vadeli hatırlamayı belirgin şekilde artırır.', app: 'Kelimeyi gösterdikten hemen sonra ve oturum içinde birkaç adım sonra tekrar sorarız; ezberletmek yerine hatırlatırız.', r: 'Roediger & Karpicke (2006), Psychological Science' },
  { e: '🪜', c: 'var(--sky)', t: 'İstenen zorluklar', p: 'Biraz zorlanarak öğrenilen bilgi daha kalıcıdır. Kolaydan zora doğru ilerleyen görevler, beyni tam doğru miktarda zorlar.', app: 'Yeni kelimede tanıma (çoktan seçmeli) → dinleyerek anlama → yazarak hatırlama → sesli üretim sırasıyla ilerleriz.', r: 'Bjork (1994); Bjork & Bjork (2011)' },
  { e: '🔀', c: 'var(--violet)', t: 'Serpiştirme (interleaving)', p: 'Farklı öğeleri ve görev türlerini karıştırmak, bloklar hâlinde çalışmaktan daha iyi ayırt etme ve transfer sağlar.', app: 'Yeni kelimeler, tekrarlar ve farklı alıştırma türleri oturum içinde karışık gelir.', r: 'Rohrer & Taylor (2007); Kornell & Bjork (2008)' },
  { e: '🖼️', c: 'var(--pink)', t: 'Çift kodlama', p: 'Sözel bilgi görsel bir ipucuyla birleştiğinde hafızada iki ayrı yoldan kodlanır ve daha kolay geri çağrılır.', app: 'Günlük hayat kelimeleri emojilerle, telaffuz dersleri Pip\'in ağız animasyonlarıyla desteklenir.', r: 'Paivio (1971, 1986)' },
  { e: '🗣️', c: 'var(--sun)', t: 'Üretim etkisi & gölgeleme', p: 'Kelimeleri yüksek sesle söylemek sessiz okumaya göre hatırlamayı artırır. Dinlediğini hemen taklit etmek (shadowing) telaffuz ve ritmi geliştirir.', app: 'Her yeni kelimede sesli tekrar hatırlatması, konuşma alıştırmaları ve gölgeleme turları.', r: 'MacLeod vd. (2010); Hamada (2016)' },
  { e: '👂', c: 'var(--mint)', t: 'Yüksek çeşitlilikte fonetik eğitim', p: 'Anadilde olmayan ses ayrımlarını (ship/sheep gibi) kulağın ayırt etmeyi öğrenmesi, telaffuzun da gelişmesine yardım eder.', app: 'Ses çiftleri oyunu, Türkçe konuşanların en çok zorlandığı 24 karşıtlığa odaklanır; cevaptan sonra iki ses art arda çalınır.', r: 'Logan, Lively & Pisoni (1991); Thomson (2018)' },
  { e: '📊', c: 'var(--coral)', t: 'Sıklık temelli kelime seçimi', p: 'En sık kullanılan 1000 kelime ailesi, günlük metin ve konuşmaların büyük çoğunluğunu kapsar. En sık kelimelerden başlamak en yüksek getiriyi sağlar.', app: '"En çok kullanılan 1000" listesi sıklık sırasına göre ünitelere bölünmüştür.', r: 'Nation (2006); Nation & Waring (1997)' },
  { e: '🧩', c: 'var(--lime)', t: 'Kalıplar (sözcüksel yaklaşım)', p: 'Akıcı konuşma büyük ölçüde ezberlenmiş hazır kalıplara dayanır. Kalıp öğrenmek, cümleyi sıfırdan kurma yükünü azaltır.', app: '45 yüksek frekanslı kalıp; boşluk doldurma, cümle kurma ve sesli üretimle pekiştirilir.', r: 'Lewis (1993); Wray (2002)' },
  { e: '📅', c: 'var(--sky)', t: 'Uygulama niyeti & alışkanlık', p: '"X olunca Y yapacağım" şeklinde plan yapanlar hedeflerini çok daha sık gerçekleştirir. Alışkanlıkların otomatikleşmesi ortalama ~66 gün sürer ve tek bir kaçırılan gün süreci bozmaz.', app: 'Başlangıçta tetikleyicini seçip "söz veriyorsun". Seri dondurucular, tek bir kaçırılan günün motivasyonunu yıkmasını önler.', r: 'Gollwitzer (1999); Lally vd. (2010)' },
  { e: '🏁', c: 'var(--pink)', t: 'Hedef gradyanı & küçük kazanımlar', p: 'İnsanlar hedefe yaklaştıkça daha çok çaba gösterir. Görünür ilerleme ve ulaşılabilir günlük hedefler motivasyonu sürdürür.', app: 'Günlük hedef halkası, "sadece N görev kaldı" hatırlatmaları, haftalık mühür ve seviye ilerlemesi.', r: 'Hull (1932); Kivetz, Urminsky & Zheng (2006)' },
  { e: '🌱', c: 'var(--mint)', t: 'Ceza yok, gelişim var', p: 'Hataları cezalandırmak kaygıyı artırır ve denemeyi azaltır. Hatalar, geri bildirimle birleştiğinde öğrenmenin en güçlü anlarıdır.', app: 'Can/kalp sistemi yok; yanlış cevap XP kaybettirmez, sadece o öğeyi birkaç adım sonra tekrar getirir.', r: 'Metcalfe (2017), Annual Review of Psychology' },
];

export function scienceView(el) {
  el.innerHTML = `
    <div class="back-row"><button class="icon-btn" data-back aria-label="Geri">${icon.back}</button><p class="eyebrow">Linggo'nun bilimi</p></div>
    <h1 class="display">Sihir yok,<br><span class="serif">bilim var.</span></h1>
    <p class="muted mt">Linggo'daki her özellik, öğrenme bilimi ve davranış bilimindeki sağlam bulgulara dayanır. İşte nasıl çalıştığı:</p>
    <div class="sci mt-l">${SCIENCE.map(s => `<article class="sci-card">
      <div class="h"><span class="sq" style="background:${s.c}">${s.e}</span><b class="h3">${s.t}</b></div>
      <p>${s.p}</p>
      <div class="in-app"><b>Linggo'da:</b> ${s.app}</div>
      <p class="ref">${s.r}</p></article>`).join('')}</div>
    <div class="card ink mt-l center"><p class="h3">Kısacası:</p><p style="opacity:.8;margin-top:6px">Az ama her gün. Hatırlamaya çalış. Sesli söyle. Hata yapmaktan korkma.</p>
      <button class="btn btn-lime mt" data-go>${icon.play}Pratiğe başla</button></div>`;
  el.querySelector('[data-back]').onclick = () => history.length > 1 ? history.back() : navigate('/home');
  el.querySelector('[data-go]').onclick = () => navigate('/session/daily');
}

function passwordSheet() {
  sheet(`<form class="sheet-body" novalidate>
    <h3 class="h2">Şifreyi değiştir</h3>
    <div class="field"><label for="cur">Mevcut şifre</label><input class="input" id="cur" type="password" autocomplete="current-password"></div>
    <div class="field"><label for="nw">Yeni şifre</label><input class="input" id="nw" type="password" autocomplete="new-password"></div>
    <p class="tiny faint">En az 8 karakter, en az bir harf ve bir rakam.</p>
    <div data-err></div>
    <button class="btn btn-primary btn-block" type="submit">Güncelle</button></form>`, {
    onMount: (sh, close) => {
      const f = sh.querySelector('form');
      f.onsubmit = async e => {
        e.preventDefault();
        try { await post('/api/account/password', { current: f.cur.value, next: f.nw.value }); close(); toast('Şifren güncellendi 🔐'); }
        catch (err) { sh.querySelector('[data-err]').innerHTML = `<div class="form-err">${esc(err.message)}</div>`; }
      };
    }
  });
}
function deleteSheet() {
  sheet(`<form class="sheet-body" novalidate>
    <h3 class="h2">Hesabını sil</h3>
    <p class="muted">Hesabın, ilerlemen ve tüm verilerin kalıcı olarak silinir. Bu işlem geri alınamaz.</p>
    <div class="field"><label for="pw">Onaylamak için şifreni yaz</label><input class="input" id="pw" type="password" autocomplete="current-password"></div>
    <div data-err></div>
    <button class="btn btn-danger btn-block" type="submit">Hesabımı kalıcı olarak sil</button>
    <button class="btn btn-ghost btn-block" type="button" data-close>Vazgeç</button></form>`, {
    onMount: (sh, close) => {
      const f = sh.querySelector('form');
      f.onsubmit = async e => {
        e.preventDefault();
        try { await post('/api/account/delete', { password: f.pw.value }); close(); try { localStorage.clear(); } catch { } location.href = '/'; }
        catch (err) { sh.querySelector('[data-err]').innerHTML = `<div class="form-err">${esc(err.message)}</div>`; }
      };
    }
  });
}

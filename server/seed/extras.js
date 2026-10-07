// Varsayılan: plan özellikleri, seviyeler, Pip Market, e-posta şablonları, ses ayarları

// ---------- Plan feature registry (labels/types live in code; values are editable in the admin panel)
// type: 'limit' (sayı, -1 = sınırsız) | 'bool' | 'number'
export const FEATURES = [
  { key: 'units', group: 'İçerik', label: 'Seviyendeki açık ünite sayısı', hint: 'Her ünite 100 kelime', type: 'limit' },
  { key: 'themes', group: 'İçerik', label: 'Seviyendeki açık tema sayısı', type: 'limit' },
  { key: 'patterns', group: 'İçerik', label: 'Seviyendeki açık kalıp sayısı', type: 'limit' },
  { key: 'lessons', group: 'İçerik', label: 'Seviyendeki açık mini ders sayısı', type: 'limit' },
  { key: 'accent', group: 'İçerik', label: 'Açık aksan konusu', type: 'limit' },
  { key: 'otherLevels', group: 'İçerik', label: 'Diğer seviyelerin içeriği', hint: 'Kapalıysa sadece kendi seviyesini görür', type: 'bool' },
  { key: 'dailyNewMax', group: 'Pratik', label: 'Günlük en fazla yeni kelime', type: 'limit' },
  { key: 'dayWordsRounds', group: 'Pratik', label: 'Günün kelimeleri: günde kaç set', hint: 'Bir set bitince yeni set alma hakkı (-1 = sınırsız)', type: 'limit' },
  { key: 'patternsPerDay', group: 'Pratik', label: 'Günde kaç yeni kalıp öğrenilebilir', hint: 'Zaten öğrenilmiş kalıpları tekrar etmek bu sınıra girmez (-1 = sınırsız)', type: 'limit' },
  { key: 'soundsPerDay', group: 'Pratik', label: 'Günde kaç yeni ses alıştırması', hint: 'Zaten öğrenilmiş (%80+) sesleri tekrar etmek bu sınıra girmez (-1 = sınırsız)', type: 'limit' },
  { key: 'pairsPerDay', group: 'Pratik', label: 'Günlük ses çifti oyunu', type: 'limit' },
  { key: 'weekly', group: 'Pratik', label: 'Haftalık pekiştirme', type: 'bool' },
  { key: 'speech', group: 'Pratik', label: 'Mikrofonla telaffuz puanlama', type: 'bool' },
  { key: 'ipaDrill', group: 'Pratik', label: 'IPA okuma alıştırmaları', type: 'bool' },
  { key: 'placementRetest', group: 'Pratik', label: 'Seviye testini tekrar çözme', type: 'bool' },
  { key: 'hqVoice', group: 'Deneyim', label: 'Yapay zekâ ile yüksek kaliteli seslendirme', hint: 'Sunucu ses servisi ayarlıysa', type: 'bool' },
  { key: 'advancedStats', group: 'Deneyim', label: 'Gelişmiş ilerleme raporu (ısı haritası, haftalık karşılaştırma)', type: 'bool' },
  { key: 'streakFreezes', group: 'Deneyim', label: 'Biriktirilebilir seri dondurucu', type: 'limit' },
  { key: 'coinBonus', group: 'Pip Market', label: 'Yaprak kazanımı (%)', hint: 'Her 10 XP = 1 yaprak × bu oran', type: 'number' },
  { key: 'premiumItems', group: 'Pip Market', label: 'Pro market öğeleri (tema, kıyafet)', type: 'bool' },
];

export const DEFAULT_PLANS = {
  plans: [
    { id: 'free', name: 'Ücretsiz', tagline: 'Temelleri öğren, alışkanlığını kur.' },
    { id: 'premium', name: 'Premium', tagline: 'Tüm içerik, sınırsız pratik.', priceMonthly: 149.99, priceYearly: 999.99, currency: 'TRY' },
  ],
  features: {
    units: { free: 2, premium: -1 }, themes: { free: 3, premium: -1 }, patterns: { free: 8, premium: -1 }, lessons: { free: 3, premium: -1 },
    accent: { free: 3, premium: -1 }, otherLevels: { free: false, premium: true }, dailyNewMax: { free: 10, premium: -1 }, dayWordsRounds: { free: 2, premium: -1 },
    patternsPerDay: { free: 2, premium: -1 }, soundsPerDay: { free: 2, premium: -1 },
    pairsPerDay: { free: 1, premium: -1 }, weekly: { free: false, premium: true }, speech: { free: true, premium: true },
    ipaDrill: { free: true, premium: true }, placementRetest: { free: true, premium: true }, hqVoice: { free: true, premium: true },
    advancedStats: { free: true, premium: true }, streakFreezes: { free: 1, premium: 3 }, coinBonus: { free: 100, premium: 200 },
    premiumItems: { free: false, premium: true },
  },
};

// ---------- Levels (CEFR) — which content belongs to which level
export const DEFAULT_LEVELS = {
  levels: [
    { id: 'a1', cefr: 'A1', title: 'Başlangıç', emoji: '🌱', desc: 'Sıfırdan başlıyorum, birkaç kelime biliyorum.', dailyNew: 6,
      units: [1, 2], themes: ['food', 'home', 'body', 'colors', 'people', 'actions', 'time'],
      patterns: ['couldyou', 'idlike', 'lets', 'goingto', 'should', 'haveto', 'cantwait', 'depends', 'howabout', 'into'],
      lessons: ['th', 'ship', 'vw', 'ae'] },
    { id: 'a2', cefr: 'A2', title: 'Temel', emoji: '🌿', desc: 'Basit cümleleri anlıyor, kendimi kısaca ifade edebiliyorum.', dailyNew: 8,
      units: [3, 4], themes: ['feel', 'city', 'clothes', 'animals', 'shopping', 'nature'],
      patterns: ['usedto', 'notgood', 'okayif', 'mindif', 'whydontwe', 'thinkingof', 'haveyouever', 'donthaveto', 'prefer', 'whatslike'],
      lessons: ['schwa', 'flap', 'th', 'ship'] },
    { id: 'b1', cefr: 'B1', title: 'Orta', emoji: '🌳', desc: 'Konuşabiliyorum ama takılıyorum, kelime dağarcığım sınırlı.', dailyNew: 10,
      units: [5, 6, 7], themes: ['travel', 'work', 'health'],
      patterns: ['usedto-be', 'wouldmind', 'lookingforward', 'dontthink', 'opinion', 'seemslike', 'notsure', 'ivebeen', 'ittakes', 'hadbetter', 'feellike', 'sorrytohear'],
      lessons: ['stress', 'linking', 'schwa'] },
    { id: 'b2', cefr: 'B2', title: 'Orta-üstü', emoji: '🏞️', desc: 'Rahat konuşuyorum; akıcılık ve doğallık istiyorum.', dailyNew: 12,
      units: [8, 9, 10], themes: ['travel', 'work', 'health'],
      patterns: ['thingis', 'beensince', 'bythetime', 'ifiwereyou', 'idrather', 'themore', 'notas', 'whatmean', 'howlong', 'happentoknow', 'howcome', 'nowonder', 'nouse'],
      lessons: ['linking', 'stress', 'flap'] },
    { id: 'c1', cefr: 'C1', title: 'İleri', emoji: '🏔️', desc: 'İleri seviyedeyim; nüans, aksan ve zengin kelime istiyorum.', dailyNew: 15,
      units: [11, 12, 13, 14, 15, 16], themes: ['work', 'travel'],
      patterns: ['bythetime', 'themore', 'nowonder', 'nouse', 'howcome', 'happentoknow', 'ifiwereyou'],
      lessons: ['linking', 'stress'] },
  ],
  placement: { wordsPerLevel: 4, patternsPerLevel: 1, pass: 70 },
};

// ---------- Pip Market
// slot: hat | glasses | top | neck | gloves | shoes | bg | theme
// price.type: free | coins | premium | paid
const I = (id, slot, name, art, price, extra = {}) => ({ id, slot, name, art, price, rarity: 'common', enabled: true, colors: {}, desc: '', ...extra });
const free = { type: 'free' }, pro = { type: 'premium' };
const coins = n => ({ type: 'coins', coins: n });
const paid = (tl, n = 0) => ({ type: 'paid', try: tl, coins: n });
const V = ['#5FD14A', '#E5484D', '#3F7DDB', '#8B6CFF', '#1C201D', '#F4F1E6'];
// Reward chests (Ödüller): coins/xp ranges per chest tier, item drop chance, daily missions
export const DEFAULT_REWARDS = {
  enabled: true,
  tiers: {
    mission: { name: 'Görev sandığı', color: '#6FE0B0', coins: [3, 8], xp: [3, 6], drop: 0.03 },
    daily: { name: 'Günlük sandık', color: '#72C4FF', coins: [8, 16], xp: [8, 15], drop: 0.10 },
    level: { name: 'Seviye sandığı', color: '#FFD166', coins: [12, 28], xp: [0, 0], drop: 0.18 },
    badge: { name: 'Rozet sandığı', color: '#B9A8FF', coins: [8, 20], xp: [5, 12], drop: 0.12 },
    streak: { name: 'Seri sandığı', color: '#FF6B45', coins: [10, 24], xp: [0, 0], drop: 0.2 },
  },
  rarityWeights: { common: 60, rare: 28, epic: 10, legendary: 2 },
  streakMilestones: [3, 7, 14, 30, 60, 100, 200, 365],
  missions: [
    { id: 'goal', t: 'Günlük hedefini tamamla', metric: 'goal', n: 1, e: '🎯' },
    { id: 'ok10', t: '10 doğru cevap ver', metric: 'ok', n: 10, e: '✅' },
    { id: 'ok25', t: '25 doğru cevap ver', metric: 'ok', n: 25, e: '💪' },
    { id: 'rev20', t: '20 soru cevapla', metric: 'rev', n: 20, e: '🧠' },
    { id: 'nw3', t: '3 yeni kelime öğren', metric: 'nw', n: 3, e: '🌱' },
    { id: 'nw6', t: '6 yeni kelime öğren', metric: 'nw', n: 6, e: '🌿' },
    { id: 'xp30', t: '30 XP kazan', metric: 'xp', n: 30, e: '⚡' },
    { id: 'xp60', t: '60 XP kazan', metric: 'xp', n: 60, e: '🔥' },
  ],
};

export const DEFAULT_MARKET = {
  items: [
    // --- Kıyafet · Şapka (tag = alt kategori, variants = renk seçenekleri)
    I('fedora', 'hat', 'Kaşif şapkası', 'fedora', free, { tag: 'Şapka', desc: 'Pip\'in imza şapkası. Her yolculuğa hazır.', variants: ['#9A6A3E', '#5A4632', '#C9A36B', '#1C201D', '#2F5D46'] }),
    I('cap', 'hat', 'Kep', 'cap', coins(60), { tag: 'Kep', desc: 'Her yolculuğa hazır.', colors: { c1: '#5FD14A' }, variants: V }),
    I('beanie', 'hat', 'Bere', 'beanie', free, { tag: 'Bere', colors: { c1: '#FF6B5A', c2: '#FFD24A' }, variants: V }),
    I('beret', 'hat', 'Fransız beresi', 'beret', coins(90), { tag: 'Bere', desc: 'Bonjour! Biraz Paris havası.', variants: V }),
    I('bucket', 'hat', 'Balıkçı şapkası', 'bucket', coins(100), { tag: 'Şapka', variants: V }),
    I('pilot', 'hat', 'Pilot şapkası', 'pilot', coins(180), { tag: 'Şapka', rarity: 'rare', desc: 'Yeni ülkelere uçuş başlasın.' }),
    I('party', 'hat', 'Parti şapkası', 'party', coins(80), { tag: 'Özel', colors: { c1: '#FF6FB5', c2: '#4FB3FF' }, rarity: 'rare' }),
    I('headphones', 'hat', 'Kulaklık', 'headphones', coins(150), { tag: 'Özel', desc: 'Öğrenirken daha keyifli.', colors: { c1: '#1C201D', c2: '#FFB23F' }, rarity: 'rare', variants: ['#FFB23F', '#C8F53C', '#FF6FB5', '#4FB3FF', '#F4F1E6'] }),
    I('flowers', 'hat', 'Çiçek tacı', 'flowers', coins(120), { tag: 'Özel', rarity: 'rare' }),
    I('santa', 'hat', 'Noel şapkası', 'santa', coins(150), { tag: 'Özel', rarity: 'rare' }),
    I('grad', 'hat', 'Mezuniyet kepi', 'grad', coins(250), { tag: 'Özel', rarity: 'epic', desc: 'C1 yolcuları için.' }),
    I('tophat', 'hat', 'Silindir şapka', 'tophat', coins(300), { tag: 'Şapka', colors: { c1: '#1D1D20', c2: '#FF6B5A' }, rarity: 'epic' }),
    I('crown', 'hat', 'Taç', 'crown', pro, { tag: 'Özel', rarity: 'legendary' }),
    I('cowboy', 'hat', 'Kovboy şapkası', 'cowboy', pro, { tag: 'Şapka', colors: { c1: '#B07A45' }, rarity: 'epic' }),
    I('wizard', 'hat', 'Büyücü şapkası', 'wizard', paid(29.99), { tag: 'Özel', colors: { c1: '#4B3FB5', c2: '#FFD24A' }, rarity: 'legendary' }),
    // --- Kıyafet · Gözlük
    I('shades', 'glasses', 'Siyah gözlük', 'shades', free, { tag: 'Moda', desc: 'Daha odaklı bir sen.', variants: ['#0B0B0D', '#6B3E1E', '#2F5D46', '#8B6CFF', '#E5484D'] }),
    I('round', 'glasses', 'Yuvarlak gözlük', 'round', free, { tag: 'Gözlük', colors: { c1: '#0E110F' }, variants: ['#0E110F', '#C9A36B', '#E5484D', '#3F7DDB'] }),
    I('professor', 'glasses', 'Profesör gözlüğü', 'professor', coins(130), { tag: 'Gözlük', desc: 'Gramer kuralları artık korkutmuyor.' }),
    I('sun', 'glasses', 'Güneş gözlüğü', 'sun', coins(100), { tag: 'Moda', colors: { c1: '#1B1B22' }, rarity: 'rare', variants: ['#1B1B22', '#3F7DDB', '#E5484D', '#5FD14A'] }),
    I('cat', 'glasses', 'Pembe gözlük', 'cat', coins(120), { tag: 'Moda', rarity: 'rare', variants: ['#FF6FB5', '#8B6CFF', '#FFD24A', '#4FB3FF'] }),
    I('heart', 'glasses', 'Kalp gözlük', 'heart', coins(140), { tag: 'Moda', colors: { c1: '#FF4F7B' }, rarity: 'rare' }),
    I('sport', 'glasses', 'Spor gözlük', 'sport', coins(150), { tag: 'Diğer', rarity: 'rare', variants: ['#2F7BFF', '#FF6B5A', '#C8F53C', '#1C201D'] }),
    I('ski', 'glasses', 'Kar gözlüğü', 'ski', coins(200), { tag: 'Diğer', rarity: 'epic' }),
    I('vr', 'glasses', 'VR gözlük', 'vr', coins(260), { tag: 'Diğer', rarity: 'epic', desc: 'Sanal gerçeklikte İngilizce.' }),
    I('star', 'glasses', 'Yıldız gözlük', 'star', pro, { tag: 'Moda', colors: { c1: '#FFD24A' }, rarity: 'epic' }),
    // --- Kıyafet · Üst giyim
    I('hoodie-black', 'top', 'Hoodie', 'hoodie', free, { tag: 'Hoodie', desc: 'Rahat, her zaman.', colors: { c1: '#16181A' }, variants: ['#16181A', '#F4F1E6', '#8B6CFF', '#3F7DDB', '#E5484D', '#5FD14A'] }),
    I('tee', 'top', 'T-shirt', 'tee', free, { tag: 'T-shirt', colors: { c1: '#4FB3FF' }, variants: V }),
    I('stripes', 'top', 'Çizgili kazak', 'stripes', coins(160), { tag: 'T-shirt', colors: { c1: '#FF6B5A', c2: '#FFF1E6' }, rarity: 'rare' }),
    I('hoodie', 'top', 'Mor kapüşonlu', 'hoodie', coins(180), { tag: 'Hoodie', colors: { c1: '#8B6CFF' }, rarity: 'rare' }),
    I('sweat', 'top', 'Sweatshirt', 'sweat', coins(150), { tag: 'Hoodie', variants: V }),
    I('jacket', 'top', 'Ceket', 'jacket', coins(200), { tag: 'Ceket', variants: ['#2F5D46', '#6B3E1E', '#262A33', '#3F7DDB'] }),
    I('raincoat', 'top', 'Yağmurluk', 'raincoat', coins(170), { tag: 'Ceket', variants: ['#FFD24A', '#FF6B5A', '#4FB3FF', '#5FD14A'] }),
    I('jersey', 'top', 'Forma', 'jersey', coins(200), { tag: 'T-shirt', colors: { c1: '#E5484D', c2: '#FFFFFF' }, rarity: 'rare', variants: ['#E5484D', '#FFD24A', '#3F7DDB', '#16181A'] }),
    I('suit', 'top', 'Takım elbise', 'suit', coins(320), { tag: 'Ceket', rarity: 'epic', desc: 'İş İngilizcesi için hazır.' }),
    I('tux', 'top', 'Smokin', 'tux', pro, { tag: 'Özel', rarity: 'epic' }),
    I('space', 'top', 'Uzay kıyafeti', 'space', coins(400), { tag: 'Özel', rarity: 'legendary', desc: 'Dilin sınırı yok, uzayın da.' }),
    I('cape', 'top', 'Süper pelerin', 'cape', paid(39.99), { tag: 'Özel', colors: { c1: '#E5484D', c2: '#FFD24A' }, rarity: 'legendary' }),
    // --- Kıyafet · Alt giyim
    I('joggers', 'bottom', 'Eşofman altı', 'joggers', free, { tag: 'Pantolon', colors: { c1: '#2B2F33' }, variants: ['#2B2F33', '#8B6CFF', '#3F7DDB', '#F4F1E6'] }),
    I('jeans', 'bottom', 'Kot pantolon', 'jeans', coins(80), { tag: 'Pantolon', variants: ['#3C6FB5', '#1C2B4A', '#8FB3E0'] }),
    I('shorts', 'bottom', 'Şort', 'shorts', coins(60), { tag: 'Şort', variants: ['#C9A36B', '#5FD14A', '#FF6B5A', '#16181A'] }),
    I('skirt', 'bottom', 'Etek', 'skirt', coins(90), { tag: 'Diğer', variants: ['#FF6FB5', '#8B6CFF', '#FFD24A', '#16181A'] }),
    // --- Kıyafet · Ayakkabı
    I('sneakers', 'shoes', 'Spor ayakkabı', 'sneakers', free, { tag: 'Spor', colors: { c1: '#F4F1E6', c2: '#C8F53C' }, variants: ['#F4F1E6', '#16181A', '#FF6B5A', '#4FB3FF'] }),
    I('slippers', 'shoes', 'Tavşan terlik', 'slippers', coins(70), { tag: 'Diğer', variants: ['#FFB3CF', '#F4F1E6', '#B9A8FF'] }),
    I('rain', 'shoes', 'Yağmur çizmesi', 'rain', coins(100), { tag: 'Bot', colors: { c1: '#FFD24A' }, variants: ['#FFD24A', '#E5484D', '#5FD14A'] }),
    I('boots', 'shoes', 'Bot', 'boots', coins(120), { tag: 'Bot', colors: { c1: '#8A5A34' }, rarity: 'rare' }),
    I('goldshoes', 'shoes', 'Altın ayakkabı', 'gold', pro, { tag: 'Spor', rarity: 'legendary' }),
    // --- Aksesuar · Çanta, eşya, boyun, eldiven
    I('backpack', 'bag', 'Sırt çantası', 'backpack', free, { tag: 'Çanta', desc: 'Kelimelerin hepsi içinde.', colors: { c1: '#1B1E20' }, variants: ['#1B1E20', '#6B3E1E', '#2F5D46', '#E5484D', '#8B6CFF'] }),
    I('sling', 'bag', 'Omuz çantası', 'sling', coins(120), { tag: 'Çanta', variants: ['#C9803A', '#16181A', '#FF6FB5'] }),
    I('satchel', 'bag', 'Atlas çanta', 'satchel', coins(140), { tag: 'Çanta', rarity: 'rare' }),
    I('book', 'hand', 'Kitap', 'book', free, { tag: 'Eşya', desc: 'Her gün bir sayfa.', variants: ['#E5484D', '#3F7DDB', '#5FD14A', '#FFD24A'] }),
    I('coffee', 'hand', 'Kahve', 'coffee', coins(60), { tag: 'Eşya', desc: 'Sabah kahvesi + 10 dakika İngilizce.' }),
    I('phone', 'hand', 'Telefon', 'phone', coins(90), { tag: 'Eşya', variants: ['#1C201D', '#F4F1E6', '#FF6FB5'] }),
    I('tablet', 'hand', 'Tablet', 'tablet', coins(180), { tag: 'Eşya', rarity: 'rare', variants: ['#FF6FB5', '#8B6CFF', '#4FB3FF'] }),
    I('laptop', 'hand', 'Laptop', 'laptop', coins(150), { tag: 'Eşya', rarity: 'rare' }),
    I('camera', 'hand', 'Kamera', 'camera', coins(200), { tag: 'Eşya', rarity: 'epic', desc: 'Yeni yerler, yeni kelimeler.' }),
    I('bowtie', 'neck', 'Papyon', 'bowtie', coins(70), { tag: 'Boyun', colors: { c1: '#E5484D' }, variants: V }),
    I('scarf', 'neck', 'Atkı', 'scarf', coins(90), { tag: 'Boyun', colors: { c1: '#FFD24A', c2: '#FF6B5A' }, variants: ['#FFD24A', '#E5484D', '#4FB3FF', '#5FD14A'] }),
    I('necklace', 'neck', 'Kolye', 'necklace', coins(110), { tag: 'Boyun', colors: { c1: '#FFD24A' }, rarity: 'rare' }),
    I('medal', 'neck', 'Altın madalya', 'medal', pro, { tag: 'Boyun', rarity: 'epic' }),
    I('cartoon', 'gloves', 'Beyaz eldiven', 'cartoon', free, { tag: 'Eldiven' }),
    I('mitten', 'gloves', 'Yün eldiven', 'mitten', coins(80), { tag: 'Eldiven', colors: { c1: '#FF6B5A' }, variants: V }),
    I('boxing', 'gloves', 'Boks eldiveni', 'boxing', coins(220), { tag: 'Eldiven', colors: { c1: '#E5484D' }, rarity: 'epic' }),
    // --- İfade (Pip'in varsayılan yüzü)
    I('face-grin', 'face', 'Kocaman gülüş', 'face', free, { face: 'grin', desc: 'Her derse gülümseyerek.' }),
    I('face-wink', 'face', 'Göz kırpma', 'face', free, { face: 'wink', desc: 'Anladın sen onu 😉' }),
    I('face-sleepy', 'face', 'Uykucu', 'face', coins(60), { face: 'sleepy', desc: 'Pazartesi sabahı modu.' }),
    I('face-love', 'face', 'Aşık', 'face', coins(100), { face: 'love', desc: 'İngilizceye âşık.' }),
    I('face-cool', 'face', 'Havalı bakış', 'face', coins(150), { face: 'cool', rarity: 'rare' }),
    I('face-star', 'face', 'Yıldız gözler', 'face', coins(200), { face: 'star', rarity: 'epic', desc: 'Hedefini tutturmuş gibi.' }),
    // --- Renk (gövde)
    I('color-lime', 'color', 'Neon lime', 'color', free, { colors: { c1: '#C8F53C' }, desc: 'Pip\'in orijinal rengi.' }),
    I('color-ink', 'color', 'Gece siyahı', 'color', free, { colors: { c1: '#1C201D' }, desc: 'Karanlıkta parlayan gözler.' }),
    I('color-cream', 'color', 'Krem', 'color', coins(120), { colors: { c1: '#F4F1E6' } }),
    I('color-blue', 'color', 'Okyanus mavisi', 'color', coins(150), { colors: { c1: '#4FB3FF' }, rarity: 'rare' }),
    I('color-purple', 'color', 'Lavanta', 'color', coins(150), { colors: { c1: '#8B6CFF' }, rarity: 'rare' }),
    I('color-pink', 'color', 'Şeker pembe', 'color', coins(150), { colors: { c1: '#FF6FB5' }, rarity: 'rare' }),
    I('color-orange', 'color', 'Mandalina', 'color', coins(150), { colors: { c1: '#FF8A3D' }, rarity: 'rare' }),
    I('color-red', 'color', 'Kiraz', 'color', coins(150), { colors: { c1: '#F0454B' }, rarity: 'rare' }),
    I('color-yellow', 'color', 'Güneş sarısı', 'color', coins(150), { colors: { c1: '#FFD24A' }, rarity: 'rare' }),
    I('color-gold', 'color', 'Altın', 'color', pro, { colors: { c1: '#E8B83A' }, rarity: 'legendary' }),
    // --- Arka plan
    I('bg-sunny', 'bg', 'Güneşli gün', 'sunny', free),
    I('bg-confetti', 'bg', 'Konfeti', 'confetti', coins(180), { rarity: 'rare' }),
    I('bg-night', 'bg', 'Yıldızlı gece', 'night', coins(150), { rarity: 'rare' }),
    I('bg-beach', 'bg', 'Sahil', 'beach', coins(200), { rarity: 'rare' }),
    I('bg-library', 'bg', 'Kütüphane', 'library', pro, { rarity: 'epic' }),
    I('bg-london', 'bg', 'Londra', 'london', paid(24.99), { rarity: 'legendary' }),
    I('bg-nyc', 'bg', 'New York', 'nyc', paid(24.99), { rarity: 'legendary' }),
    // Themes: every theme owns its accents, tile colors, card tones, a background texture (--bg-art) and a glowing hero panel (--grad-mesh)
    I('theme-classic', 'theme', 'Krem', 'classic', free, { desc: 'Açık mod: krem zemin, orman yeşili yazı, lime vurgu.', theme: { dark: false, v: 4, fonts: { display: 'Nunito', accent: 'Caveat' }, tokens: {} } }),
    I('theme-night', 'theme', 'Linggo gece', 'night', free, { desc: 'İmza tema: gece yeşili, neon lime.', theme: { dark: true, v: 4, fonts: { display: 'Nunito', accent: 'Caveat' }, tokens: {} } }),
    I('theme-ocean', 'theme', 'Okyanus', 'ocean', coins(200), { rarity: 'rare', desc: 'Serin maviler, köpük beyazı kartlar.', theme: { dark: false, v: 4, fonts: { display: 'Outfit', accent: 'Caveat' }, tokens: {
      '--bg': '#E4F2F5', '--bg-2': '#D3E8ED', '--card': '#FBFEFF', '--card-2': '#EEF7F9', '--line': 'rgba(8, 52, 66, .09)', '--track': 'rgba(8, 52, 66, .08)',
      '--lime': '#4FD6E3', '--lime-2': '#1FB3C6', '--lime-ink': '#02262D', '--grad-lime': 'linear-gradient(180deg,#A8F0F7 0%,#56D8E6 55%,#1FB3C6 100%)',
      '--coral': '#FF7A6B', '--violet': '#5B7CFF', '--sky': '#8FDDF0', '--pink': '#FFC2D4', '--sun': '#FFE08A', '--mint': '#7FE8C4',
      '--dark-panel': '#0B2533', '--grad-mesh': 'radial-gradient(60% 80% at 100% 0%, rgba(79,214,227,.55), transparent 60%), radial-gradient(50% 70% at 0% 100%, rgba(91,124,255,.35), transparent 60%)',
      '--bg-art': 'radial-gradient(90% 50% at 15% -10%, rgba(79,214,227,.28), transparent 60%), radial-gradient(70% 45% at 110% 40%, rgba(91,124,255,.12), transparent 60%)' } } }),
    I('theme-matcha', 'theme', 'Matcha', 'matcha', coins(200), { rarity: 'rare', desc: 'Yeşil çay dinginliği, noktalı kağıt.', theme: { dark: false, v: 4, fonts: { display: 'Fredoka', accent: 'Kalam' }, tokens: {
      '--bg': '#EDEFDF', '--bg-2': '#E0E5CD', '--card': '#FBFCF4', '--card-2': '#F2F5E6', '--line': 'rgba(40, 56, 14, .09)', '--track': 'rgba(40, 56, 14, .08)',
      '--lime': '#A9C96B', '--lime-2': '#7FA93C', '--lime-ink': '#172305', '--grad-lime': 'linear-gradient(180deg,#D4EBA0 0%,#A9C96B 55%,#7FA93C 100%)',
      '--coral': '#E88A5A', '--violet': '#7E8C5A', '--sky': '#BFDCC4', '--pink': '#F2C9B8', '--sun': '#EBDA8C', '--mint': '#9ED6A6',
      '--dark-panel': '#1D2812', '--grad-mesh': 'radial-gradient(60% 80% at 100% 0%, rgba(169,201,107,.5), transparent 60%), radial-gradient(50% 70% at 0% 100%, rgba(232,138,90,.22), transparent 60%)',
      '--bg-art': 'radial-gradient(rgba(60,80,20,.09) 1.2px, transparent 1.6px) 0 0 / 18px 18px' } } }),
    I('theme-retro', 'theme', 'Retro', 'retro', coins(300), { rarity: 'epic', desc: '70\'ler posteri: turuncu, hardal, çizgili zemin.', theme: { dark: false, v: 4, fonts: { display: 'Righteous', accent: 'Pacifico' }, tokens: {
      '--bg': '#F5E4C8', '--bg-2': '#EBD4AE', '--card': '#FFF6E6', '--card-2': '#FAEBD2', '--line': 'rgba(74, 38, 8, .1)', '--track': 'rgba(74, 38, 8, .09)',
      '--lime': '#FF9F43', '--lime-2': '#EE7A22', '--lime-ink': '#351400', '--grad-lime': 'linear-gradient(180deg,#FFC98A 0%,#FF9F43 55%,#EE7A22 100%)',
      '--coral': '#D9482F', '--violet': '#2F6E9E', '--sky': '#8CC7D6', '--pink': '#F4A9A0', '--sun': '#F2C14E', '--mint': '#9BC9A3',
      '--dark-panel': '#3A2214', '--grad-mesh': 'radial-gradient(60% 80% at 100% 0%, rgba(255,159,67,.55), transparent 60%), radial-gradient(50% 70% at 0% 100%, rgba(217,72,47,.35), transparent 60%)',
      '--bg-art': 'repeating-linear-gradient(135deg, rgba(160,90,20,.055) 0 14px, transparent 14px 28px)' } } }),
    I('theme-sunset', 'theme', 'Gün batımı', 'sunset', pro, { rarity: 'epic', desc: 'Şeftaliden pembeye akan gökyüzü.', theme: { dark: false, v: 4, fonts: { display: 'Playfair Display', accent: 'Instrument Serif' }, tokens: {
      '--bg': '#FFEFE8', '--bg-2': '#FBDDD2', '--card': '#FFFAF7', '--card-2': '#FFF0EA', '--line': 'rgba(90, 20, 10, .08)', '--track': 'rgba(90, 20, 10, .07)',
      '--lime': '#FF8A65', '--lime-2': '#F4511E', '--lime-ink': '#3B0A00', '--grad-lime': 'linear-gradient(135deg,#FFC3A6 0%,#FF8A65 50%,#FF5E8A 100%)',
      '--coral': '#FF5E8A', '--violet': '#9B6BFF', '--sky': '#FFC9B5', '--pink': '#FFB3CF', '--sun': '#FFD48A', '--mint': '#FFB8A0',
      '--dark-panel': '#2B1320', '--grad-mesh': 'radial-gradient(60% 80% at 100% 0%, rgba(255,138,101,.6), transparent 60%), radial-gradient(50% 70% at 0% 100%, rgba(255,94,138,.45), transparent 60%)',
      '--bg-art': 'linear-gradient(180deg, #FFE0CF 0%, #FFF3EC 38%, #FFEFF4 100%)' } } }),
    I('theme-lavender', 'theme', 'Lavanta', 'lavender', pro, { rarity: 'epic', desc: 'Lila tonları ve yumuşak ışıltı.', theme: { dark: false, v: 4, fonts: { display: 'Baloo 2', accent: 'Kalam' }, tokens: {
      '--bg': '#F1EEFA', '--bg-2': '#E4DDF5', '--card': '#FDFCFF', '--card-2': '#F5F2FD', '--line': 'rgba(40, 20, 90, .08)', '--track': 'rgba(40, 20, 90, .07)',
      '--lime': '#B9A8FF', '--lime-2': '#8E77F5', '--lime-ink': '#1B0F4A', '--grad-lime': 'linear-gradient(180deg,#DCD3FF 0%,#B9A8FF 55%,#8E77F5 100%)',
      '--coral': '#FF8AB3', '--violet': '#7C6CFF', '--sky': '#B8D2FF', '--pink': '#F6C6E8', '--sun': '#FFE3A3', '--mint': '#B6EAD7',
      '--dark-panel': '#1E1636', '--grad-mesh': 'radial-gradient(60% 80% at 100% 0%, rgba(185,168,255,.6), transparent 60%), radial-gradient(50% 70% at 0% 100%, rgba(255,138,179,.3), transparent 60%)',
      '--bg-art': 'radial-gradient(rgba(124,108,255,.13) 1.3px, transparent 1.8px) 0 0 / 22px 22px, radial-gradient(80% 50% at 90% -10%, rgba(185,168,255,.35), transparent 60%)' } } }),
    I('theme-candy', 'theme', 'Şeker', 'candy', coins(250), { rarity: 'epic', desc: 'Pamuk şeker pembesi, puantiyeli.', theme: { dark: false, v: 4, fonts: { display: 'Fredoka', accent: 'Gochi Hand' }, tokens: {
      '--bg': '#FFEFF6', '--bg-2': '#FCDDEA', '--card': '#FFFBFD', '--card-2': '#FFF0F6', '--line': 'rgba(110, 10, 60, .08)', '--track': 'rgba(110, 10, 60, .07)',
      '--lime': '#FF7AB6', '--lime-2': '#F0468F', '--lime-ink': '#3D0020', '--grad-lime': 'linear-gradient(135deg,#FFC2DE 0%,#FF7AB6 55%,#FFA36B 100%)',
      '--coral': '#FF6B6B', '--violet': '#A06BFF', '--sky': '#9EE6FF', '--pink': '#FFC2DE', '--sun': '#FFE66D', '--mint': '#8FF0C8',
      '--dark-panel': '#3B1030', '--grad-mesh': 'radial-gradient(60% 80% at 100% 0%, rgba(255,122,182,.6), transparent 60%), radial-gradient(50% 70% at 0% 100%, rgba(158,230,255,.35), transparent 60%)',
      '--bg-art': 'radial-gradient(rgba(255,122,182,.16) 3px, transparent 3.5px) 0 0 / 34px 34px, radial-gradient(rgba(158,230,255,.22) 3px, transparent 3.5px) 17px 17px / 34px 34px' } } }),
    I('theme-forest', 'theme', 'Orman', 'forest', coins(350), { rarity: 'epic', desc: 'Gece ormanı: koyu yeşil, ateş böceği ışıkları.', theme: { dark: true, v: 4, fonts: { display: 'Nunito', accent: 'Caveat' }, tokens: {
      '--bg': '#0D1812', '--bg-2': '#132219', '--card': '#15251C', '--card-2': '#1B2E23', '--line': 'rgba(200, 255, 210, .08)', '--track': 'rgba(200, 255, 210, .08)',
      '--lime': '#8EE07A', '--lime-2': '#5CC456', '--lime-ink': '#08200A', '--grad-lime': 'linear-gradient(180deg,#C2F5A8 0%,#8EE07A 55%,#5CC456 100%)',
      '--coral': '#FF9E5E', '--violet': '#7FB3A0', '--sky': '#3E7A66', '--pink': '#8A5E4E', '--sun': '#C9A948', '--mint': '#4FA37A',
      '--dark-panel': '#0A140E', '--grad-mesh': 'radial-gradient(60% 80% at 100% 0%, rgba(142,224,122,.35), transparent 60%), radial-gradient(50% 70% at 0% 100%, rgba(255,210,110,.18), transparent 60%)',
      '--bg-art': 'radial-gradient(circle at 12% 18%, rgba(255,230,120,.16) 0 2px, transparent 3px), radial-gradient(circle at 78% 34%, rgba(255,230,120,.12) 0 2px, transparent 3px), radial-gradient(circle at 42% 72%, rgba(255,230,120,.12) 0 2px, transparent 3px), radial-gradient(90% 60% at 50% -10%, rgba(142,224,122,.12), transparent 60%)' } } }),
    I('theme-neon', 'theme', 'Neon gece', 'neon', paid(19.99), { rarity: 'legendary', desc: 'Sentetik dalga: neon ızgara, parlayan vurgular.', theme: { dark: true, v: 4, fonts: { display: 'Space Grotesk', accent: 'Shadows Into Light' }, tokens: {
      '--bg': '#07070C', '--bg-2': '#11111B', '--card': '#14141F', '--card-2': '#1B1B29', '--line': 'rgba(57, 255, 176, .1)', '--track': 'rgba(57, 255, 176, .09)',
      '--lime': '#39FFB0', '--lime-2': '#00E0FF', '--lime-ink': '#00140C', '--grad-lime': 'linear-gradient(135deg,#39FFB0 0%,#00E0FF 100%)',
      '--coral': '#FF3DAE', '--violet': '#8B5CFF', '--sky': '#0F5E73', '--pink': '#6E1F55', '--sun': '#6B5A12', '--mint': '#0D6B4E',
      '--dark-panel': '#10101A', '--grad-mesh': 'radial-gradient(60% 80% at 100% 0%, rgba(0,224,255,.45), transparent 60%), radial-gradient(50% 70% at 0% 100%, rgba(255,61,174,.4), transparent 60%)',
      '--bg-art': 'linear-gradient(rgba(57,255,176,.05) 1px, transparent 1px) 0 0 / 28px 28px, linear-gradient(90deg, rgba(57,255,176,.05) 1px, transparent 1px) 0 0 / 28px 28px, radial-gradient(80% 50% at 50% 110%, rgba(255,61,174,.18), transparent 60%)' } } }),
    I('theme-aurora', 'theme', 'Kutup ışıkları', 'aurora', pro, { rarity: 'legendary', desc: 'Gökyüzünde dans eden yeşil ve mor perdeler.', theme: { dark: true, v: 4, fonts: { display: 'Outfit', accent: 'Pacifico' }, tokens: {
      '--bg': '#080D1C', '--bg-2': '#0F1629', '--card': '#121A30', '--card-2': '#18223B', '--line': 'rgba(180, 220, 255, .09)', '--track': 'rgba(180, 220, 255, .09)',
      '--lime': '#7CF5D9', '--lime-2': '#48C9E8', '--lime-ink': '#021F1A', '--grad-lime': 'linear-gradient(135deg,#7CF5D9 0%,#8FA8FF 100%)',
      '--coral': '#FF8FB1', '--violet': '#A78BFF', '--sky': '#1E4D6B', '--pink': '#5A2C5E', '--sun': '#5E5320', '--mint': '#12584A',
      '--dark-panel': '#0B1224', '--grad-mesh': 'radial-gradient(60% 80% at 100% 0%, rgba(124,245,217,.45), transparent 60%), radial-gradient(50% 70% at 0% 100%, rgba(167,139,255,.45), transparent 60%)',
      '--bg-art': 'radial-gradient(60% 35% at 20% 0%, rgba(124,245,217,.22), transparent 70%), radial-gradient(50% 30% at 85% 5%, rgba(167,139,255,.22), transparent 70%)' } } }),
  ],
  welcomeCoins: 50,
  rewards: DEFAULT_REWARDS,
};
// items that can fall out of reward chests (admin can toggle per item)
export const SIGNATURE_LOOK = { hat: 'fedora', glasses: 'shades', top: 'hoodie-black', bottom: 'joggers', bag: 'backpack', shoes: 'sneakers', color: 'color-lime' };
export const DEFAULT_DROPS = ['cap', 'party', 'flowers', 'headphones', 'sun', 'heart', 'stripes', 'hoodie', 'bowtie', 'scarf', 'necklace', 'mitten', 'rain', 'boots', 'bg-night', 'bg-confetti', 'bg-beach', 'theme-candy', 'beret', 'bucket', 'sweat', 'jacket', 'raincoat', 'jeans', 'shorts', 'slippers', 'sling', 'coffee', 'phone', 'face-sleepy', 'face-love', 'color-cream', 'color-blue', 'color-pink'];
for (const it of DEFAULT_MARKET.items) if (DEFAULT_DROPS.includes(it.id)) it.drop = true;

// ---------- E-mail templates & automations
// body: basit biçim — paragraflar, **kalın**, [bağlantı](url), "- " madde, {değişken}; {{stats}} bloğu özet kartı ekler
export const DEFAULT_EMAILS = {
  templates: [
    { id: 'verify', name: 'E-posta doğrulama kodu', kind: 'system', enabled: true, subject: '{code} — Linggo doğrulama kodun',
      title: 'Hoş geldin, {name}! 🌱', body: 'Hesabını etkinleştirmek için aşağıdaki kodu uygulamaya gir. Pip seni bekliyor!' },
    { id: 'reset', name: 'Şifre sıfırlama kodu', kind: 'system', enabled: true, subject: '{code} — Linggo şifre sıfırlama kodun',
      title: 'Şifreni sıfırla', body: 'Merhaba {name}, şifreni yenilemek için aşağıdaki kodu kullan.' },
    { id: 'welcome', name: 'Hoş geldin', kind: 'auto', trigger: 'verified', enabled: true, subject: 'Linggo\'ya hoş geldin, {name}! 👋',
      title: 'Aramıza hoş geldin! 🎉', cta: 'İlk pratiğime başla',
      body: 'Merhaba {name},\n\nHesabın hazır. Linggo\'da her gün **birkaç dakika** ile İngilizceni kalıcı hâle getireceğiz.\n\n- Aralıklı tekrar ile unutmadan öğren\n- Cümle kalıplarıyla akıcı konuş\n- Pip\'le telaffuzunu geliştir\n\nİpucu: Başlangıçta seçtiğin saatte kısa bir hatırlatma kur. Küçük ama her gün!' },
    { id: 'premium', name: 'Premium aktif', kind: 'auto', trigger: 'premium_granted', enabled: true, subject: 'Linggo Premium hesabında aktif ✨',
      title: 'Premium aktif! ✨', cta: 'Linggo\'yu aç',
      body: 'Merhaba {name}, Premium erişimin açıldı{planUntilText}.\n\nTüm üniteler, temalar, kalıplar ve Pro market öğeleri artık senin. İyi çalışmalar!' },
    { id: 'premium_expiring', name: 'Premium bitmek üzere', kind: 'auto', trigger: 'premium_expiring', daysBefore: 3, enabled: true,
      subject: 'Premium üyeliğin {days} gün içinde bitiyor', title: 'Premium\'un bitmek üzere ⏳', cta: 'Premium\'u uzat',
      body: 'Merhaba {name},\n\nPremium erişimin **{planUntil}** tarihinde sona eriyor. Kesintisiz devam etmek için uygulamadan Premium\'u uzatabilirsin.' },
    { id: 'inactive', name: 'Seni özledik', kind: 'auto', trigger: 'inactive', days: 3, marketing: true, enabled: true,
      subject: 'Pip seni özledi, {name} 🥺', title: 'Kelimelerin seni bekliyor', cta: '5 dakikalık tekrar yap',
      body: 'Merhaba {name},\n\n{inactiveDays} gündür görüşemedik. Şu an **{due}** kelimen tekrar zamanında — tam unutmak üzereyken hatırlamak, öğrenmenin en güçlü anı.\n\nSadece 5 dakika ayır; serini yeniden başlat!' },
    { id: 'digest', name: 'Haftalık gündem', kind: 'auto', trigger: 'weekly', weekday: 1, hour: 9, marketing: true, enabled: true,
      subject: 'Haftalık gündemin: {weekWords} yeni kelime, {weekXp} XP 📈', title: 'Haftanın özeti', cta: 'Bu haftaya başla',
      body: 'Merhaba {name}, işte geçen haftan:\n\n{{stats}}\n\n**Bu haftanın gündemi**\n\n- Yeni mini ders: Bağlantılı konuşma\n- Haftanın kalıbı: *I\'m looking forward to…*\n\nKüçük adımlarla devam! 🌱' },
  ],
  sender: { unsubscribeText: 'Bu e-postaları almak istemiyorsan aboneliğini buradan iptal edebilirsin.' },
};

// ---------- Voice (TTS)
export const DEFAULT_VOICE = {
  provider: 'auto', // auto | azure | google | elevenlabs | off
  voices: {
    azure: { 'tr-TR': 'tr-TR-EmelNeural', 'en-US': 'en-US-JennyNeural', 'en-GB': 'en-GB-SoniaNeural' },
    google: { 'tr-TR': 'tr-TR-Wavenet-D', 'en-US': 'en-US-Neural2-F', 'en-GB': 'en-GB-Neural2-A' },
    elevenlabs: { 'tr-TR': '', 'en-US': '', 'en-GB': '' },
  },
  rate: { 'tr-TR': 1.0, 'en-US': 0.95, 'en-GB': 0.95 },
};

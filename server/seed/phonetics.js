// Fonetik alfabe (IPA), aksan farkları, minimal çiftler ve Pip'in animasyonlu mini dersleri.
// mouth: Pip'in ağız şekli → rest | smile | round | open | wide | mid | th | fv | closed

export const SOUND_GROUPS = [
  { id: 'short', title: 'Kısa ünlüler', color: '#D7F75B' },
  { id: 'long', title: 'Uzun ünlüler', color: '#7CC8FF' },
  { id: 'diph', title: 'Çift ünlüler', color: '#FFB4D0' },
  { id: 'cons', title: 'Ünsüzler', color: '#FFD166' },
];

export const SOUNDS = [
  // short vowels
  { id: 'ih', ipa: 'ɪ', group: 'short', words: ['ship', 'sit', 'big'], mouth: 'smile', hard: true, tip: 'Türkçe "i"den daha gevşek ve kısa; "i" ile "ı" arası bir ses. Dudaklarını germe.' },
  { id: 'eh', ipa: 'e', us: 'ɛ', group: 'short', words: ['bed', 'red', 'head'], mouth: 'mid', tip: 'Türkçe "e"ye çok yakın. Rahat, kısa bir "e".' },
  { id: 'ae', ipa: 'æ', group: 'short', words: ['cat', 'man', 'black'], mouth: 'wide', hard: true, tip: '"e" der gibi başla, çeneni aşağı indir: "e" ile "a" arası. Türkçede yok — "bad" ile "bed"i ayıran ses bu!' },
  { id: 'uh', ipa: 'ʌ', group: 'short', words: ['cup', 'love', 'sun'], mouth: 'mid', hard: true, tip: 'Kısa ve rahat bir "a"; "ı" ile "a" arası. Çene hafif açık, dudaklar nötr.' },
  { id: 'uu', ipa: 'ʊ', group: 'short', words: ['put', 'book', 'good'], mouth: 'round', tip: 'Kısa bir "u"; dudaklar hafifçe yuvarlak ama gevşek.' },
  { id: 'o', ipa: 'ɒ', us: 'ɑ', group: 'short', words: ['hot', 'stop', 'job'], mouth: 'open', tip: 'İngiliz: kısa, yuvarlak bir "o". Amerikan: ağız açık, geniş bir "a" (hot ≈ "haat").' },
  { id: 'schwa', ipa: 'ə', group: 'short', words: ['about', 'banana', 'teacher'], mouth: 'mid', hard: true, tip: 'İngilizcenin EN SIK sesi! Vurgusuz hecelerde duyulan kısa, tembel bir "ı". "banana" = bə-NA-nə.' },
  // long vowels
  { id: 'ee', ipa: 'iː', group: 'long', words: ['see', 'sheep', 'eat'], mouth: 'smile', tip: 'Uzun ve gergin bir "i"; dudaklar gülümser gibi yana gerilir.' },
  { id: 'aa', ipa: 'ɑː', group: 'long', words: ['car', 'father', 'start'], mouth: 'open', tip: 'Ağız geniş açık, derin ve uzun bir "a". Amerikan aksanında "car" kelimesinde r de duyulur.' },
  { id: 'aw', ipa: 'ɔː', group: 'long', words: ['door', 'saw', 'walk'], mouth: 'round', tip: 'Dudaklar yuvarlak, uzun bir "o". Amerikan aksanında çoğu zaman "a"ya yaklaşır.' },
  { id: 'oo', ipa: 'uː', group: 'long', words: ['food', 'blue', 'two'], mouth: 'round', tip: 'Dudakları öne doğru büz; uzun bir "u".' },
  { id: 'er', ipa: 'ɜː', us: 'ɝ', group: 'long', words: ['bird', 'work', 'learn'], mouth: 'mid', hard: true, tip: 'Türkçe "ö"ye benzer ama dudaklar yuvarlanmaz. Amerikan aksanında r sesiyle kaynaşır: "bɝd".' },
  // diphthongs
  { id: 'ay', ipa: 'eɪ', group: 'diph', words: ['day', 'name', 'rain'], mouth: 'mid', to: 'smile', tip: '"e"den "i"ye kayar: "ey". "name" = "neym".' },
  { id: 'ai', ipa: 'aɪ', group: 'diph', words: ['my', 'time', 'nice'], mouth: 'open', to: 'smile', tip: '"a"dan "i"ye kayar: "ay". "time" = "taym".' },
  { id: 'oy', ipa: 'ɔɪ', group: 'diph', words: ['boy', 'toy', 'coin'], mouth: 'round', to: 'smile', tip: '"o"dan "i"ye kayar: "oy".' },
  { id: 'ow', ipa: 'aʊ', group: 'diph', words: ['now', 'house', 'out'], mouth: 'open', to: 'round', tip: '"a"dan "u"ya kayar: "au". "house" = "haus".' },
  { id: 'oh', ipa: 'əʊ', us: 'oʊ', group: 'diph', words: ['go', 'home', 'know'], mouth: 'mid', to: 'round', hard: true, tip: 'Asla düz bir "o" değil! İngiliz: "ıu" (gəʊ); Amerikan: "ou" (goʊ).' },
  { id: 'ear', ipa: 'ɪə', us: 'ɪr', group: 'diph', words: ['near', 'here', 'beer'], mouth: 'smile', to: 'mid', tip: 'İngiliz: "iı" diye kayar. Amerikan: sonunda r duyulur: "nɪr".' },
  { id: 'air', ipa: 'eə', us: 'ɛr', group: 'diph', words: ['hair', 'where', 'care'], mouth: 'mid', tip: 'İngiliz: uzun bir "eı". Amerikan: "er" — r net duyulur.' },
  { id: 'ure', ipa: 'ʊə', us: 'ʊr', group: 'diph', words: ['tour', 'pure', 'sure'], mouth: 'round', tip: 'Giderek nadirleşiyor; birçok İngiliz "sure"ü /ʃɔː/ der.' },
  // consonants
  { id: 'p', ipa: 'p', group: 'cons', words: ['pen', 'happy', 'stop'], mouth: 'closed', tip: 'Türkçe "p" gibi, ama vurgulu hece başında hafif bir nefes patlaması (pʰ) ile.' },
  { id: 'b', ipa: 'b', group: 'cons', words: ['bad', 'baby', 'job'], mouth: 'closed', tip: 'Türkçe "b" ile aynı. Kelime sonunda da net söyle: "job" ≠ "jop".' },
  { id: 't', ipa: 't', group: 'cons', words: ['tea', 'water', 'cat'], mouth: 'mid', tip: 'Dil ucu dişlerin arkasındaki damakta. Amerikan: iki ünlü arasında "d"ye döner (water ≈ "wadır").' },
  { id: 'd', ipa: 'd', group: 'cons', words: ['day', 'lady', 'bed'], mouth: 'mid', tip: 'Türkçe "d"ye yakın; dil ucu biraz daha geride.' },
  { id: 'k', ipa: 'k', group: 'cons', words: ['key', 'cat', 'back'], mouth: 'mid', tip: 'Hece başında nefesli (kʰ). "c", "k", "ck" hepsi bu ses olabilir.' },
  { id: 'g', ipa: 'g', group: 'cons', words: ['go', 'bigger', 'bag'], mouth: 'mid', tip: 'Türkçe "g" ile aynı. Sonda da net: "bag" ≠ "bak".' },
  { id: 'f', ipa: 'f', group: 'cons', words: ['fish', 'phone', 'laugh'], mouth: 'fv', tip: 'Üst dişler alt dudağa hafifçe değer, nefes çıkar. "ph" ve "gh" de bu sesi verebilir.' },
  { id: 'v', ipa: 'v', group: 'cons', words: ['very', 'river', 'love'], mouth: 'fv', hard: true, tip: 'Üst dişler alt dudakta ve SES TELLERİ TİTRER. "w" ile karıştırma: "vest" ≠ "west".' },
  { id: 'th', ipa: 'θ', group: 'cons', words: ['think', 'three', 'bath'], mouth: 'th', hard: true, tip: 'Dil ucunu dişlerinin arasına koy ve üfle — ses tellerin titremez. "s" ya da "t" DEĞİL!' },
  { id: 'dh', ipa: 'ð', group: 'cons', words: ['this', 'mother', 'the'], mouth: 'th', hard: true, tip: 'Aynı pozisyon (dil dişlerin arasında) ama ses tellerin titrer. "d" ya da "z" DEĞİL!' },
  { id: 's', ipa: 's', group: 'cons', words: ['see', 'city', 'bus'], mouth: 'smile', tip: 'Türkçe "s" ile aynı.' },
  { id: 'z', ipa: 'z', group: 'cons', words: ['zoo', 'rose', 'is'], mouth: 'smile', tip: 'Türkçe "z". Çoğul -s eki çoğu zaman /z/ okunur: "dogs" = dɒgz.' },
  { id: 'sh', ipa: 'ʃ', group: 'cons', words: ['she', 'fish', 'nation'], mouth: 'round', tip: 'Türkçe "ş". "-tion" eki /ʃən/ okunur.' },
  { id: 'zh', ipa: 'ʒ', group: 'cons', words: ['vision', 'measure', 'beige'], mouth: 'round', tip: 'Türkçe "j" (garaj, bej). Ayrı bir harfi yok; genelde "s" ile yazılır.' },
  { id: 'h', ipa: 'h', group: 'cons', words: ['hat', 'who', 'behind'], mouth: 'open', tip: 'Hafif bir nefes. "hour", "honest" gibi kelimelerde okunmaz!' },
  { id: 'ch', ipa: 'tʃ', group: 'cons', words: ['chair', 'teacher', 'watch'], mouth: 'round', tip: 'Türkçe "ç".' },
  { id: 'j', ipa: 'dʒ', group: 'cons', words: ['job', 'magic', 'age'], mouth: 'round', tip: 'Türkçe "c". "j", "g", "dge" ile yazılabilir.' },
  { id: 'm', ipa: 'm', group: 'cons', words: ['man', 'summer', 'time'], mouth: 'closed', tip: 'Türkçe "m" ile aynı.' },
  { id: 'n', ipa: 'n', group: 'cons', words: ['no', 'dinner', 'sun'], mouth: 'mid', tip: 'Türkçe "n" ile aynı.' },
  { id: 'ng', ipa: 'ŋ', group: 'cons', words: ['sing', 'long', 'thinking'], mouth: 'open', hard: true, tip: 'Dilin arkası yumuşak damağa değer, ses burundan çıkar. Sonuna "g" ekleme: "sing" = sɪŋ, "sing-g" değil.' },
  { id: 'l', ipa: 'l', group: 'cons', words: ['leg', 'hello', 'feel'], mouth: 'mid', tip: 'Kelime başında açık l; sonda "kalın l" (dark L): "feel", "milk" — Türkçe "kalın l"ye benzer.' },
  { id: 'r', ipa: 'r', group: 'cons', words: ['red', 'sorry', 'right'], mouth: 'round', hard: true, tip: 'Dil hiçbir yere DEĞMEZ; ucu hafifçe geriye kıvrılır, dudaklar biraz yuvarlanır. Türkçe gibi titretme!' },
  { id: 'w', ipa: 'w', group: 'cons', words: ['we', 'what', 'window'], mouth: 'round', hard: true, tip: 'Dudaklar "u" der gibi yuvarlak başlar ve hızla açılır. Dişler dudağa DEĞMEZ — "v"den farkı bu.' },
  { id: 'y', ipa: 'j', group: 'cons', words: ['yes', 'you', 'year'], mouth: 'smile', tip: 'Türkçe "y". IPA\'da "j" ile yazılır — kafa karıştırmasın!' },
];

export const getSound = id => SOUNDS.find(s => s.id === id);

export const ACCENT_TOPICS = [
  { id: 'r', title: 'R sesi', sub: 'Rotiklik', emoji: '🌀', us: 'Ünlüden sonra gelen r okunur: car → /kɑːr/.', uk: 'Ünlüden sonraki r okunmaz, önceki ünlü uzar: car → /kɑː/.', words: ['car', 'water', 'bird', 'hard', 'teacher', 'four', 'here', 'park'] },
  { id: 'flap', title: 'Amerikan T\'si', sub: 'Flap T', emoji: '🥁', us: 'İki ünlü arasındaki t, hızlı bir "d"ye dönüşür: water → "wadır".', uk: 't net ve keskin söylenir; gündelikte gırtlaktan durak (ʔ) da duyulabilir: wa\'er.', words: ['water', 'better', 'city', 'little', 'party', 'matter', 'bottle', 'computer'] },
  { id: 'bath', title: 'BATH ünlüsü', sub: 'æ ↔ ɑː', emoji: '🛁', us: 'Kısa, geniş /æ/: bath → /bæθ/.', uk: 'Uzun, derin /ɑː/: bath → /bɑːθ/.', words: ['bath', 'dance', "can't", 'fast', 'ask', 'half', 'after', 'class'] },
  { id: 'lot', title: 'LOT ünlüsü', sub: 'ɑ ↔ ɒ', emoji: '🔥', us: 'Açık bir "a": hot → /hɑt/.', uk: 'Kısa, yuvarlak bir "o": hot → /hɒt/.', words: ['hot', 'stop', 'dog', 'coffee', 'not', 'job', 'problem', 'shop'] },
  { id: 'goat', title: 'GOAT ünlüsü', sub: 'oʊ ↔ əʊ', emoji: '🐐', us: '"ou" ile başlar: go → /goʊ/.', uk: '"ıu" gibi merkezden başlar: go → /gəʊ/.', words: ['go', 'home', 'no', 'phone', 'know', 'road', 'boat', 'open'] },
  { id: 'ary', title: '-ary / -ory sonları', sub: 'Hece sayısı', emoji: '📚', us: 'Son hece tam söylenir: secretary → SEK-rə-te-ri.', uk: 'Son hece yutulur: secretary → SEK-rə-tri.', words: ['secretary', 'dictionary', 'library', 'laboratory', 'necessary', 'territory'] },
  { id: 'stress', title: 'Vurgu & ünlü farkları', sub: 'Aynı kelime, farklı ses', emoji: '🎯', us: 'Örn. garage → gə-RAHJ, tomato → tə-MAY-toh.', uk: 'Örn. garage → GA-rij, tomato → tə-MAH-toh.', words: ['garage', 'schedule', 'tomato', 'either', 'vitamin', 'advertisement'] },
  { id: 'vocab', title: 'Kelime farkları', sub: 'US ↔ UK sözlük', emoji: '🗂️', us: 'Amerikan İngilizcesi', uk: 'İngiliz İngilizcesi', pairs: [['apartment', 'flat', 'daire'], ['truck', 'lorry', 'kamyon'], ['elevator', 'lift', 'asansör'], ['cookie', 'biscuit', 'bisküvi'], ['vacation', 'holiday', 'tatil'], ['subway', 'underground', 'metro'], ['fall', 'autumn', 'sonbahar'], ['candy', 'sweets', 'şeker'], ['pants', 'trousers', 'pantolon'], ['gas', 'petrol', 'benzin'], ['line', 'queue', 'kuyruk'], ['cell phone', 'mobile phone', 'cep telefonu'], ['check', 'bill', 'hesap'], ['movie', 'film', 'film']] },
];

// Türk öğrenenler için kritik minimal çiftler (HVPT — yüksek çeşitlilikte fonetik eğitim)
export const MIN_PAIRS = [
  ['ship', 'ʃɪp', 'sheep', 'ʃiːp', 'ɪ / iː'],
  ['live', 'lɪv', 'leave', 'liːv', 'ɪ / iː'],
  ['bit', 'bɪt', 'beat', 'biːt', 'ɪ / iː'],
  ['full', 'fʊl', 'fool', 'fuːl', 'ʊ / uː'],
  ['pull', 'pʊl', 'pool', 'puːl', 'ʊ / uː'],
  ['bed', 'bed', 'bad', 'bæd', 'e / æ'],
  ['men', 'men', 'man', 'mæn', 'e / æ'],
  ['cat', 'kæt', 'cut', 'kʌt', 'æ / ʌ'],
  ['cap', 'kæp', 'cup', 'kʌp', 'æ / ʌ'],
  ['hat', 'hæt', 'hut', 'hʌt', 'æ / ʌ'],
  ['think', 'θɪŋk', 'sink', 'sɪŋk', 'θ / s'],
  ['three', 'θriː', 'tree', 'triː', 'θ / t'],
  ['thank', 'θæŋk', 'tank', 'tæŋk', 'θ / t'],
  ['they', 'ðeɪ', 'day', 'deɪ', 'ð / d'],
  ['then', 'ðen', 'den', 'den', 'ð / d'],
  ['vest', 'vest', 'west', 'west', 'v / w'],
  ['vine', 'vaɪn', 'wine', 'waɪn', 'v / w'],
  ['sing', 'sɪŋ', 'sin', 'sɪn', 'ŋ / n'],
  ['thing', 'θɪŋ', 'thin', 'θɪn', 'ŋ / n'],
  ['watch', 'wɒtʃ', 'wash', 'wɒʃ', 'tʃ / ʃ'],
  ['chip', 'tʃɪp', 'ship', 'ʃɪp', 'tʃ / ʃ'],
  ['walk', 'wɔːk', 'work', 'wɜːk', 'ɔː / ɜː'],
  ['law', 'lɔː', 'low', 'ləʊ', 'ɔː / əʊ'],
  ['light', 'laɪt', 'right', 'raɪt', 'l / r'],
];

// Pip'in "video" mini dersleri: sahneler, ağız animasyonu + Türkçe anlatım + İngilizce örnek sesle senkron oynatılır.
export const LESSONS = [
  {
    id: 'th', title: 'TH sesi: Dil dışarı!', sub: 'θ ve ð', color: '#D7F75B', min: 2, scenes: [
      { mouth: 'rest', mood: 'happy', capEn: "Hi, I'm Pip! Today we'll crack the sound Turkish speakers find hardest: TH.", cap: 'Merhaba, ben Pip! Bugün Türklerin en çok zorlandığı sesi çözeceğiz: TH.', big: 'TH' },
      { mouth: 'th', capEn: "Put the tip of your tongue gently between your upper and lower teeth. Don't be shy, let it peek out!", cap: 'Dilinin ucunu üst ve alt dişlerinin arasına hafifçe koy. Utanma, biraz dışarıda görünsün!', big: 'θ', ipa: true },
      { mouth: 'th', capEn: "Now just blow. Your voice stays off. This is the voiceless TH.", cap: 'Şimdi sadece üfle. Ses tellerin titremesin. Bu, sessiz TH.', say: 'think', big: 'think' },
      { mouth: 'th', capEn: "Same position, but this time turn your voice on. This is the voiced TH.", cap: 'Aynı pozisyon, ama bu kez sesini titret. Bu da sesli TH.', say: 'this', big: 'this' },
      { mouth: 'smile', mood: 'think', capEn: "Careful: think, not sink! If your tongue doesn't touch your teeth, it slides into an S.", cap: 'Dikkat: think, "sink" değil! Dil dişlere değmezse s sesine kayar.', say: 'think. sink.', big: 'think ≠ sink' },
      { mouth: 'th', capEn: "Let's practise together. Say each word after me!", cap: 'Birlikte tekrar edelim. Her kelimeden sonra sen de söyle!', say: 'three. thank you. mother. weather.', big: 'three · thank you · mother · weather' },
      { mouth: 'rest', mood: 'wow', capEn: "Great! Try it in the mirror for one minute every day. That's how muscle memory grows.", cap: 'Harika! Her gün bir dakika ayna karşısında dene. Kas hafızası böyle oluşur.', big: '👏' },
    ]
  },
  {
    id: 'schwa', title: 'Schwa: Gizli yıldız', sub: 'ə', color: '#7CC8FF', min: 2, scenes: [
      { mouth: 'rest', mood: 'happy', capEn: "Do you know the most common sound in English? Not a, not e… a lazy, short sound: the schwa!", cap: 'İngilizcenin en sık sesi hangisi biliyor musun? Ne a, ne e… Tembel ve kısa bir "ı": schwa!', big: 'ə', ipa: true },
      { mouth: 'mid', capEn: "Relax your mouth, drop your jaw a little and make a short sound.", cap: 'Ağzını rahat bırak, çeneni hafif aç ve kısa bir ses çıkar.', say: 'uh', big: 'ə' },
      { mouth: 'mid', capEn: "In unstressed syllables, almost every vowel becomes a schwa. Like banana: bə-NA-nə.", cap: 'Vurgusuz hecelerde hemen her ünlü schwa olur. Mesela banana: bə-NA-nə.', say: 'banana', big: 'bə·NA·nə' },
      { mouth: 'mid', capEn: "About: the first syllable is a schwa. ə-BOUT.", cap: 'About, ilk hece schwa: ə-BAUT.', say: 'about', big: 'ə·BOUT' },
      { mouth: 'mid', capEn: "Teacher: TEE-chə. The -er at the end becomes a schwa.", cap: 'Teacher: TEE-çır. Sondaki -er schwa olur.', say: 'teacher', big: 'TEA·chə(r)' },
      { mouth: 'mid', mood: 'think', capEn: "Little words turn into schwa in a sentence too: a cup of tea.", cap: 'Küçük kelimeler de cümlede schwa olur: "a cup of tea" → ə kʌp əv tiː.', say: 'a cup of tea', big: 'ə cup əv tea' },
      { mouth: 'rest', mood: 'wow', capEn: "Use the schwa and you'll instantly sound more natural and fluent!", cap: 'Schwa\'yı kullanınca konuşman anında daha doğal ve akıcı duyulur!', big: '✨' },
    ]
  },
  {
    id: 'ship', title: 'Ship mi, sheep mi?', sub: 'ɪ ve iː', color: '#FFB4D0', min: 2, scenes: [
      { mouth: 'rest', mood: 'happy', capEn: "Do you want a ship or a sheep? The difference between these two sounds really matters!", cap: 'Bir gemi mi istiyorsun, bir koyun mu? Bu iki ses arasındaki fark çok önemli!', big: '🚢 / 🐑' },
      { mouth: 'smile', capEn: "Long ee: stretch your lips like a smile and hold the sound.", cap: 'Uzun i: dudaklarını gülümser gibi yana ger ve sesi uzat.', say: 'sheep', big: 'sheep /iː/' },
      { mouth: 'mid', capEn: "Short i: lips relaxed, the sound is short and loose.", cap: 'Kısa ı: dudaklar rahat, ses kısa ve gevşek. "i" ile "ı" arası.', say: 'ship', big: 'ship /ɪ/' },
      { mouth: 'smile', capEn: "Compare: leave, live.", cap: 'Karşılaştır: leave, live.', say: 'leave. live.', big: 'leave · live' },
      { mouth: 'smile', capEn: "One more: beat, bit.", cap: 'Bir tane daha: beat, bit.', say: 'beat. bit.', big: 'beat · bit' },
      { mouth: 'rest', mood: 'wow', capEn: "Now test your ears in the Sound Pairs game!", cap: 'Şimdi Ses Çiftleri oyununda kulağını test et!', big: '🎧' },
    ]
  },
  {
    id: 'vw', title: 'V ile W farkı', sub: 'v ve w', color: '#FFD166', min: 2, scenes: [
      { mouth: 'rest', mood: 'happy', capEn: "Turkish has one v. English has two different sounds: v and w.", cap: 'Türkçede tek bir "v" var, İngilizcede iki farklı ses: v ve w.', big: 'V ≠ W' },
      { mouth: 'fv', capEn: "V: your upper teeth touch your bottom lip and the sound buzzes.", cap: 'V: Üst dişlerin alt dudağına değer ve ses titrer.', say: 'very', big: 'very' },
      { mouth: 'round', capEn: "W: your teeth do NOT touch your lip. Start with round lips, like saying oo, then open.", cap: 'W: Dişler dudağa DEĞMEZ. Dudaklar "u" der gibi yuvarlak başlar ve açılır.', say: 'we', big: 'we' },
      { mouth: 'fv', capEn: "Compare: vest, west.", cap: 'Karşılaştır: vest, west.', say: 'vest. west.', big: 'vest · west' },
      { mouth: 'round', capEn: "A sentence: We visit Wales every winter.", cap: 'Bir cümle: We visit Wales every winter.', say: 'We visit Wales every winter.', big: 'We visit Wales every winter.' },
      { mouth: 'rest', mood: 'wow', capEn: "Tip: when you say w in the mirror, you shouldn't see your teeth!", cap: 'İpucu: w\'yi söylerken aynada dişlerin görünmemeli!', big: '🪞' },
    ]
  },
  {
    id: 'flap', title: 'Amerikan T\'si', sub: 'water → wadır', color: '#8B7BFF', min: 2, scenes: [
      { mouth: 'rest', mood: 'happy', capEn: "Why do Americans say water like 'wadder'? Because of the flap T!", cap: 'Amerikalılar neden "water"ı "wadır" gibi söylüyor? Çünkü flap T!', big: 'water' },
      { mouth: 'mid', capEn: "A t between two vowels becomes a soft, quick d as your tongue taps the roof of your mouth.", cap: 'İki ünlü arasındaki t, dilin damağa çok hızlı dokunmasıyla yumuşak bir "d"ye dönüşür.', big: 't → ɾ', ipa: true },
      { mouth: 'mid', capEn: "Listen: water, better, city.", cap: 'Dinle: water, better, city.', say: 'water. better. city.', accent: 'us', big: 'water · better · city' },
      { mouth: 'mid', capEn: "In a British accent, the t stays clear.", cap: 'İngiliz aksanında ise t net söylenir.', say: 'water. better. city.', accent: 'uk', big: 'UK: water · better · city' },
      { mouth: 'rest', mood: 'wow', capEn: "Whichever accent you choose, being consistent matters most!", cap: 'Hangi aksanı seçersen seç, tutarlı olmak en önemlisi!', big: '🇺🇸 🇬🇧' },
    ]
  },
  {
    id: 'ae', title: 'Cat sesi', sub: 'æ', color: '#FF6A3D', min: 2, scenes: [
      { mouth: 'rest', mood: 'happy', capEn: "Are bad and bed the same? No! The difference is a sound Turkish doesn't have: æ.", cap: 'Bad ile bed aynı mı? Hayır! Aradaki fark Türkçede olmayan bir ses: æ.', big: 'æ', ipa: true },
      { mouth: 'mid', capEn: "First, say a Turkish e.", cap: 'Önce Türkçe bir "e" söyle.', say: 'bed', big: 'bed /e/' },
      { mouth: 'wide', capEn: "Now drop your jaw and open your mouth wide: between e and a.", cap: 'Şimdi çeneni aşağı indir, ağzını genişlet: "e" ile "a" arası.', say: 'bad', big: 'bad /æ/' },
      { mouth: 'wide', capEn: "Repeat: cat, man, black, happy.", cap: 'Tekrar et: cat, man, black, happy.', say: 'cat. man. black. happy.', big: 'cat · man · black · happy' },
      { mouth: 'rest', mood: 'wow', capEn: "Super! Now 'I'm sad' and 'I'm said' won't get mixed up.", cap: 'Süper! Artık "I\'m sad" ile "I\'m said" karışmayacak.', big: '😸' },
    ]
  },
  {
    id: 'stress', title: 'Kelime vurgusu', sub: 'PHO-to-graph', color: '#7EE3B8', min: 2, scenes: [
      { mouth: 'rest', mood: 'happy', capEn: "In Turkish, stress usually falls at the end. In English it moves, and it can change the meaning!", cap: 'Türkçede vurgu genelde sondadır. İngilizcede ise yer değiştirir ve anlamı etkiler!', big: 'STRESS' },
      { mouth: 'open', capEn: "PHO-to-graph: stress on the first syllable.", cap: 'PHO-to-graph: vurgu ilk hecede.', say: 'photograph', big: 'PHO·to·graph' },
      { mouth: 'open', capEn: "pho-TO-gra-pher: the stress jumps to the second syllable.", cap: 'pho-TO-gra-pher: vurgu ikinci heceye kayar.', say: 'photographer', big: 'pho·TO·gra·pher' },
      { mouth: 'open', capEn: "pho-to-GRA-phic: now it's the third!", cap: 'pho-to-GRA-phic: bu kez üçüncü hece!', say: 'photographic', big: 'pho·to·GRA·phic' },
      { mouth: 'mid', mood: 'think', capEn: "Unstressed syllables get shorter and turn into schwa. Stress is the key to being understood.", cap: 'Vurgusuz heceler kısalır ve schwa olur. Vurgu, anlaşılırlığın anahtarıdır.', big: 'DA·da·da' },
      { mouth: 'rest', mood: 'wow', capEn: "When you learn a new word, learn its stress too!", cap: 'Yeni bir kelime öğrenirken vurgusunu da öğren!', big: '🎯' },
    ]
  },
  {
    id: 'linking', title: 'Bağlantılı konuşma', sub: 'an apple → a-napple', color: '#C9A7FF', min: 2, scenes: [
      { mouth: 'rest', mood: 'happy', capEn: "Native speakers don't say words one by one. They link them together!", cap: 'Anadili İngilizce olanlar kelimeleri tek tek söylemez; birbirine bağlar!', big: 'linking' },
      { mouth: 'mid', capEn: "A word ending in a consonant sticks to one starting with a vowel: an apple → a-napple.", cap: 'Ünsüzle biten kelime, ünlüyle başlayana yapışır: an apple → ə-næpl.', say: 'an apple', big: 'a·napple' },
      { mouth: 'mid', capEn: "Turn it off → tur-ni-toff.", cap: 'Turn it off → tɜː-nɪ-tɒf.', say: 'turn it off', big: 'tur·ni·toff' },
      { mouth: 'mid', capEn: "Check it out → che-ki-tout.", cap: 'Check it out → che-ki-taut.', say: 'check it out', big: 'che·ki·tout' },
      { mouth: 'round', capEn: "Between two vowels, a hidden w or y appears: go out → go-w-out.", cap: 'Ünlü + ünlü arasında gizli bir w veya y belirir: go out → go-w-out.', say: 'go out', big: 'go(w)out' },
      { mouth: 'rest', mood: 'wow', capEn: "Once you notice this, understanding what you hear gets much easier!", cap: 'Bunu fark edince dinlediğini çok daha kolay anlayacaksın!', big: '🔗' },
    ]
  },
];

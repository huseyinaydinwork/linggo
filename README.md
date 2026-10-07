# Linggo 🌱

Bilimsel öğrenme yöntemlerine dayanan, mobil öncelikli İngilizce öğrenme platformu.
Üyelik, e-posta doğrulama, freemium / premium planlar, yönetim paneli ve içerik yönetimi dahil.

- **Sunucu:** Node.js 22.13+ (tek bağımlılık: `nodemailer`), veritabanı SQLite (Node'un yerleşik `node:sqlite` modülü)
- **Ön yüz:** Derleme adımı olmayan vanilla JS modülleri, PWA
- **Adresler:** `/` uygulama ve tanıtım sayfası · `/admin` yönetim paneli · `/healthz` sağlık kontrolü

## Yerelde çalıştırma

```bash
npm install
npm start
```

Uygulama `http://localhost:5173` adresinde, panel `http://localhost:5173/admin` adresinde açılır.
SMTP ayarlanmamışsa geliştirme modunda doğrulama kodu hem ekranda hem sunucu konsolunda gösterilir.

## Sunucuya kurulum

### 1. Ortam değişkenleri
`.env.example` dosyasını `.env` olarak kopyala ve doldur. En önemlileri:

| Değişken | Açıklama |
|---|---|
| `APP_SECRET` | Uzun, rastgele bir değer (`openssl rand -hex 32`). Production'da zorunlu. |
| `APP_URL` | Sitenin adresi, ör. `https://pratilange.com` |
| `ADMIN_EMAILS` | Bu e-postalarla giriş yapan hesaplar otomatik yönetici olur |
| `SMTP_*`, `MAIL_FROM` | Doğrulama, şifre sıfırlama ve bilgilendirme e-postaları için SMTP bilgileri |
| `AZURE_SPEECH_KEY` / `GOOGLE_TTS_KEY` / `ELEVENLABS_API_KEY` | Yüksek kaliteli seslendirme (isteğe bağlı, biri yeterli) |
| `PAYMENT_PROVIDER` | Online ödeme bağlandığında (boşken WhatsApp akışı) |
| `TRUST_PROXY=1`, `COOKIE_SECURE=1` | HTTPS reverse proxy arkasında çalışırken |

> Production'da (`NODE_ENV=production`) doğrulama kodları asla ekranda gösterilmez; SMTP'nin çalışıyor olması gerekir.

### 2a. VPS (PM2 + Caddy/nginx)
```bash
git clone … && cd pratilange
npm ci --omit=dev
cp .env.example .env   # doldur
npx pm2 start "npm start" --name pratilange && npx pm2 save
```
HTTPS için Caddy örneği (`/etc/caddy/Caddyfile`):
```
pratilange.com {
  reverse_proxy 127.0.0.1:5173
}
```

### 2b. Docker
```bash
docker build -t pratilange .
docker run -d --name pratilange -p 5173:5173 --env-file .env -v pratilange-data:/app/data pratilange
```

### 3. Yönetici hesabı
Siteye `ADMIN_EMAILS` içindeki e-postayla kayıt ol; hesap otomatik yönetici olur. Alternatif olarak:
```bash
npm run make-admin -- eposta@ornek.com
```

### 4. Yedekleme
Tüm veriler `data/pratilange.db` dosyasındadır (WAL modunda). Düzenli yedek al:
```bash
sqlite3 data/pratilange.db ".backup 'yedek-$(date +%F).db'"
```

## Planlar, seviyeler ve premium

- **Plan özellikleri** (panel → Plan özellikleri): Her özellik için Ücretsiz / Premium değeri ayrı ayarlanır:
  - Açık ünite, tema, kalıp, ders ve aksan sayısı (öğrencinin **kendi seviyesindeki** içerik üzerinden)
  - Diğer seviyelere erişim
  - Günlük yeni kelime ve ses çifti sınırı
  - Haftalık pekiştirme, mikrofonla puanlama, IPA alıştırmaları, yüksek kaliteli ses
  - Seri dondurucu, yaprak kazanım oranı, Pro market öğeleri

  `-1` = sınırsız. Premium aylık/yıllık fiyatları da buradan.
- **Seviyeler** (panel → Seviyeler & test): A1–C1 (eklenebilir/silinebilir). Her seviyeye hangi ünitelerin, temaların, kalıpların ve derslerin ait olduğu seçilir; sıra = öğrenme sırası. Günün kelimeleri öğrencinin seviyesinden gelir.
- **Seviye testi:** Kayıtta "Seviyemi bilmiyorum" ile ya da profilden çözülür. Her seviyeden kelime + kalıp soruları sorulur (sayılar ve geçme eşiği panelden). Zorlanılan seviyede test erken biter ve ilk geçilemeyen seviye önerilir.
- **Premium'a geçiş:** Premium ekranında yıllık/aylık plan seçilir → ödeme sayfası (sipariş oluşturulur). Online ödeme bağlanana kadar sipariş WhatsApp ile tamamlanır. Panelde **Siparişler** sayfasından "Ödendi" işaretlenince Premium ya da öğe otomatik tanımlanır. WhatsApp isteği, üye detayından elle Premium verme ve `npm run grant -- eposta@ornek.com 30` hâlâ geçerli.
- Kilitli içerik sunucu tarafında filtrelenir; ücretsiz üyeye kilitli ünitelerin kelimeleri hiç gönderilmez.
- **Online ödeme bağlamak için:** `PAYMENT_PROVIDER` ayarlandığında `POST /api/checkout` yanıtına `redirectUrl` eklemek yeterli; istemci bu adrese yönlendirir. Sipariş tablosu (`orders`) ve "ödendi" akışı hazır.

## Pip Market

- **Öğeler:** Şapka, gözlük, kıyafet, aksesuar, eldiven, ayakkabı, arka plan ve **uygulama temaları**. Her öğe ücretsiz, yaprakla, Premium'a özel ya da ücretli olabilir.
- **Yaprak 🍃:** Her 10 XP = 1 yaprak × plandaki kazanım oranı. Yeni üyeye hoş geldin yaprağı verilir. Bakiye sunucuda tutulur.
- **Panelden yönetim:**
  - Öğe ekleme ve düzenleme: canlı Pip önizlemesi, renkler, nadirlik, fiyat, "yeni" etiketi, yayında/kapalı
  - **Özel SVG** yükleme (script ve bağlantılar otomatik temizlenir)
  - Tema renk editörü
  - Üyeye öğe veya yaprak hediye etme

## Fonetik (IPA)

- 1600+ kelimenin ABD ve İngiliz IPA telaffuzu:
  - ABD: [CMU Pronouncing Dictionary](https://github.com/cmusphinx/cmudict) (npm `cmu-pronouncing-dictionary`, ISC)
  - UK: [Britfone](https://github.com/JoseLlarena/Britfone) (MIT, © 2017 Jose Llarena)
  - Panelde kelime tablosundan düzenlenebilir.
- Kelime kartlarında IPA'ya dokununca kelime seslere ayrılır; her ses Pip'in ağız şekli, ipucu ve örnek kelimeyle öğretilir. "IPA'yı oku" alıştırması seviye ilerledikçe gelir.

## Ses kalitesi

- **Yüksek kaliteli ses:** `.env` içine Azure / Google / ElevenLabs anahtarı eklenirse Pip'in Türkçe anlatımı ve ABD/UK İngilizcesi yapay zekâ sesleriyle üretilir. Sesler sunucuda önbelleklenir; aynı cümle ikinci kez ücret doğurmaz. Ses adları, hız ve deneme dinlemesi panel → Ses sayfasında.
- **Anahtar yoksa:** Cihazın en iyi sesi otomatik seçilir ("Natural", "Google" ve Enhanced sesler öncelikli). Üye profilinden her dil için ses seçebilir.

## E-postalar

Panel → E-postalar sayfasında:

- **Şablonlar:** Doğrulama ve şifre kodu, hoş geldin, Premium aktif, Premium bitiyor, seni özledik, haftalık gündem. Her birinin konu, başlık, içerik ve buton metni düzenlenir.
- **Değişkenler ve önizleme:** `{name}`, `{streak}`, `{due}`, `{weekXp}` gibi değişkenler, canlı önizleme ve kendine test gönderimi.
- **Otomasyonlar:** 10 dakikada bir çalışır; gün, saat ve gün sayısı ayarlanabilir.
- **Toplu gönderim:** Seviye, plan veya aktifliğe göre seçilen kitleye kampanya gönderilir.
- **İzin:** Pazarlama e-postaları yalnızca kayıtta izin veren üyelere gider ve abonelikten çıkma bağlantısı (`/u/unsub`) içerir.

## Yönetim paneli (`/admin`)

| Sayfa | İçerik |
|---|---|
| Genel bakış | Üye, aktiflik ve premium sayıları, 30 günlük grafik, dönüşüm hunisi, premium istekleri |
| Üyeler | Filtreler, takılma etiketleri; üye detayı: özet, plan, **Pip & market** (bakiye, seviye, test sonucu, hediye), aktivite, yönetim |
| Takılma analizi | Dikkat gerektiren üyeler, ünite dağılımı, oturum tamamlama, en zor kelime/kalıp/ses çiftleri |
| Kelimeler | Ünite bazlı tablo: İngilizce, Türkçe, tür, ABD/UK IPA, toplu ekleme |
| Seviyeler & test | Seviye içerik dağılımı ve seviye testi ayarları |
| Temalar · Kalıplar · Mini dersler · Telaffuz verisi | İçerik editörleri |
| Pip Market & temalar | Öğe ve tema editörü |
| Plan özellikleri | Ücretsiz / Premium özellik matrisi ve fiyatlar |
| Siparişler | Ödeme sayfasından gelen siparişler, "Ödendi" ile otomatik tanımlama |
| E-postalar | Şablonlar, otomasyonlar, toplu gönderim, gönderim kaydı |
| Ses | TTS sağlayıcısı, ses adları, hız, test, önbellek |
| Genel ayarlar · İşlem kayıtları | WhatsApp, avantajlar, duyuru · yönetici işlemleri |

Her içerik kaydı sunucuda doğrulanır; hatalı içerik yayına alınmaz. "Varsayılana dön" ile ilk kurulum içeriğine dönülebilir.

> Bir kelimenin **İngilizcesini** değiştirmek, üyelerin o kelimedeki ilerlemesini sıfırlar (ilerleme İngilizce kelimeye bağlıdır).

## Güvenlik

- Şifreler scrypt ile tuzlanarak saklanır; oturumlar HttpOnly + SameSite çerezleri, veritabanında hash'li token
- Doğrulama kodları: 6 hane, 15 dakika geçerli, en fazla 5 deneme, HMAC ile hash'lenmiş, yeniden gönderme bekleme süresi
- Giriş, kayıt ve kod uçlarında istek sınırlama; şifremi unuttum hesap varlığını sızdırmaz
- Değiştirici isteklerde özel başlık zorunlu (CSRF koruması), sıkı Content-Security-Policy ve güvenlik başlıkları
- Üye kendi hesabını silebilir; şifre değişince diğer oturumlar kapanır

## Proje yapısı

```
server/
  index.js      HTTP sunucusu, yönlendirme, statik dosyalar, güvenlik başlıkları
  api.js        üyelik, hesap, ilerleme senkronu, olaylar, içerik, premium isteği
  admin.js      yönetim API'si ve analizler
  auth.js       şifre, oturum, kod, istek sınırlama, plan
  content.js    içerik deposu, plana göre filtreleme, doğrulama
  stats.js      ilerleme özeti ve takılma teşhisleri
  mail.js       e-posta şablonları (SMTP)
  db.js         SQLite şeması
  seed/         ilk kurulum içeriği (kelimeler, kalıplar, fonetik, dersler)
  cli.js        make-admin, grant
public/
  index.html · admin.html · sw.js · manifest.webmanifest
  css/styles.css        tasarım sistemi
  js/                   uygulama (app, store, content, premium, tours, mascot, speech…)
  js/views/             ekranlar (landing, auth, intro, home, words, patterns, sounds, session…)
  admin/                yönetim paneli
```

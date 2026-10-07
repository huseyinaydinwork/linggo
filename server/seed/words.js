// Linggo — Kelime verisi
// 1) FREQ: İngilizcede en çok kullanılan ~1000 kelime (kullanım sıklığına göre sıralı; genel korpus listelerinden derlenmiştir)
// 2) LIFE: En çok bilinen günlük hayat kelimeleri (temalara göre, emoji + örnek cümle ile — çift kodlama / dual coding)

const FREQ_RAW = `
the|belirli tanımlık (bu/şu)|det
be|olmak|v
and|ve|conj
of|-in/-ın (aitlik)|prep
a|bir|det
to|-e/-a, -mek için|prep
in|içinde, -de|prep
have|sahip olmak|v
it|o (cansız)|pron
I|ben|pron
that|şu, o; ki|det
for|için|prep
you|sen, siz|pron
he|o (erkek)|pron
with|ile, birlikte|prep
on|üzerinde|prep
do|yapmak|v
say|söylemek|v
this|bu|det
they|onlar|pron
at|-de/-da (yer, zaman)|prep
but|ama|conj
we|biz|pron
his|onun (erkek)|det
from|-den/-dan|prep
not|değil|adv
by|tarafından, yanında|prep
she|o (kadın)|pron
or|veya|conj
as|gibi, olarak|conj
what|ne|pron
go|gitmek|v
their|onların|det
can|-ebilmek|v
who|kim|pron
get|almak, elde etmek|v
if|eğer|conj
would|-erdi (koşul/rica)|v
her|onun, onu (kadın)|det
all|hepsi, tüm|det
my|benim|det
make|yapmak, üretmek|v
about|hakkında|prep
know|bilmek|v
will|-ecek (gelecek)|v
up|yukarı|adv
one|bir|num
time|zaman|n
there|orada|adv
year|yıl|n
so|öyle, bu yüzden|adv
think|düşünmek|v
when|ne zaman, -dığında|adv
which|hangi|det
them|onları|pron
some|biraz, bazı|det
me|beni, bana|pron
people|insanlar|n
take|almak, götürmek|v
out|dışarı|adv
into|içine|prep
just|sadece, az önce|adv
see|görmek|v
him|onu (erkek)|pron
your|senin|det
come|gelmek|v
could|-ebilirdi|v
now|şimdi|adv
than|-den (daha)|conj
like|gibi; sevmek|prep
other|diğer|adj
how|nasıl|adv
then|sonra, o zaman|adv
its|onun (cansız)|det
our|bizim|det
two|iki|num
more|daha fazla|adv
these|bunlar|det
want|istemek|v
way|yol, yöntem|n
look|bakmak|v
first|ilk, önce|adj
also|ayrıca|adv
new|yeni|adj
because|çünkü|conj
day|gün|n
use|kullanmak|v
no|hayır, hiç|det
man|adam|n
find|bulmak|v
here|burada|adv
thing|şey|n
give|vermek|v
many|birçok|det
well|iyi; peki|adv
only|sadece|adv
those|şunlar|det
tell|anlatmak, söylemek|v
very|çok|adv
even|bile|adv
back|geri; sırt|adv
any|herhangi|det
good|iyi|adj
woman|kadın|n
through|içinden, boyunca|prep
us|bizi, bize|pron
life|hayat|n
child|çocuk|n
work|çalışmak; iş|v
down|aşağı|adv
may|-ebilir|v
after|sonra|prep
should|-meli|v
call|aramak, çağırmak|v
world|dünya|n
over|üzerinde; bitmiş|prep
school|okul|n
still|hâlâ|adv
try|denemek|v
last|son; sürmek|adj
ask|sormak|v
need|ihtiyaç duymak|v
too|de/da; fazla|adv
feel|hissetmek|v
three|üç|num
state|durum; eyalet|n
never|asla|adv
become|olmak (dönüşmek)|v
between|arasında|prep
high|yüksek|adj
really|gerçekten|adv
something|bir şey|pron
most|en çok|adv
another|başka bir|det
much|çok (sayılamayan)|det
family|aile|n
own|kendi|adj
leave|ayrılmak, bırakmak|v
put|koymak|v
old|eski, yaşlı|adj
while|-iken|conj
mean|anlamına gelmek|v
keep|tutmak, saklamak|v
student|öğrenci|n
why|neden|adv
let|izin vermek|v
great|harika, büyük|adj
same|aynı|adj
big|büyük|adj
group|grup|n
begin|başlamak|v
seem|görünmek|v
country|ülke|n
help|yardım etmek|v
talk|konuşmak|v
where|nerede|adv
turn|dönmek, çevirmek|v
problem|sorun|n
every|her|det
start|başlamak|v
hand|el|n
might|-ebilir (olasılık)|v
show|göstermek|v
part|parça, bölüm|n
against|karşı|prep
place|yer|n
such|öyle, böyle|det
again|tekrar|adv
few|az, birkaç|det
case|durum, vaka|n
week|hafta|n
company|şirket|n
system|sistem|n
each|her bir|det
right|doğru; sağ|adj
program|program|n
hear|duymak|v
question|soru|n
during|sırasında|prep
play|oynamak|v
government|hükümet|n
run|koşmak; yönetmek|v
small|küçük|adj
number|sayı|n
off|kapalı; -den uzak|adv
always|her zaman|adv
move|hareket etmek, taşınmak|v
night|gece|n
live|yaşamak|v
point|nokta; işaret etmek|n
believe|inanmak|v
hold|tutmak|v
today|bugün|adv
bring|getirmek|v
happen|olmak (meydana gelmek)|v
next|sonraki|adj
without|-sız, olmadan|prep
before|önce|prep
large|geniş, büyük|adj
million|milyon|num
must|-meli (zorunluluk)|v
home|ev|n
under|altında|prep
water|su|n
room|oda|n
write|yazmak|v
mother|anne|n
area|alan, bölge|n
national|ulusal|adj
money|para|n
story|hikâye|n
young|genç|adj
fact|gerçek, olgu|n
month|ay|n
different|farklı|adj
lot|çok, bir sürü|n
study|ders çalışmak|v
book|kitap|n
eye|göz|n
job|iş|n
word|kelime|n
though|gerçi, -e rağmen|conj
business|iş, ticaret|n
issue|mesele, konu|n
side|taraf|n
kind|tür; nazik|n
four|dört|num
head|baş, kafa|n
far|uzak|adv
black|siyah|adj
long|uzun|adj
both|her ikisi|det
little|küçük, az|adj
house|ev|n
yes|evet|adv
since|-den beri|prep
provide|sağlamak|v
service|hizmet|n
around|etrafında|prep
friend|arkadaş|n
important|önemli|adj
father|baba|n
sit|oturmak|v
away|uzakta|adv
until|-e kadar|prep
power|güç|n
hour|saat (süre)|n
game|oyun|n
often|sık sık|adv
yet|henüz|adv
line|çizgi, sıra|n
political|siyasi|adj
end|son; bitirmek|n
among|arasında (çok)|prep
ever|hiç, şimdiye kadar|adv
stand|ayakta durmak|v
bad|kötü|adj
lose|kaybetmek|v
however|ancak|adv
member|üye|n
pay|ödemek|v
law|kanun|n
meet|tanışmak, buluşmak|v
car|araba|n
city|şehir|n
almost|neredeyse|adv
include|içermek|v
continue|devam etmek|v
set|koymak, ayarlamak|v
later|daha sonra|adv
community|topluluk|n
name|isim|n
five|beş|num
once|bir kez|adv
white|beyaz|adj
least|en az|adv
president|başkan|n
learn|öğrenmek|v
real|gerçek|adj
change|değiştirmek|v
team|takım|n
minute|dakika|n
best|en iyi|adj
several|birkaç|det
idea|fikir|n
kid|çocuk|n
body|vücut|n
information|bilgi|n
nothing|hiçbir şey|pron
ago|önce (zaman)|adv
lead|liderlik etmek|v
social|sosyal|adj
understand|anlamak|v
whether|-ip -mediği|conj
watch|izlemek|v
together|birlikte|adv
follow|takip etmek|v
parent|ebeveyn|n
stop|durmak|v
face|yüz|n
anything|herhangi bir şey|pron
create|yaratmak|v
public|kamu, halk|adj
already|zaten|adv
speak|konuşmak|v
others|diğerleri|pron
read|okumak|v
level|seviye|n
allow|izin vermek|v
add|eklemek|v
office|ofis|n
spend|harcamak|v
door|kapı|n
health|sağlık|n
person|kişi|n
art|sanat|n
sure|emin|adj
war|savaş|n
history|tarih|n
party|parti|n
within|içinde|prep
grow|büyümek|v
result|sonuç|n
open|açmak; açık|v
morning|sabah|n
walk|yürümek|v
reason|sebep|n
low|düşük|adj
win|kazanmak|v
research|araştırma|n
girl|kız|n
guy|adam, tip|n
early|erken|adv
food|yiyecek|n
moment|an|n
himself|kendisi (erkek)|pron
air|hava|n
teacher|öğretmen|n
force|güç; zorlamak|n
offer|teklif etmek|v
enough|yeterli|adj
education|eğitim|n
across|karşısında|prep
although|-e rağmen|conj
remember|hatırlamak|v
foot|ayak|n
second|ikinci; saniye|adj
boy|erkek çocuk|n
maybe|belki|adv
toward|-e doğru|prep
able|-ebilen, yetenekli|adj
age|yaş|n
policy|politika|n
everything|her şey|pron
love|sevmek; aşk|v
process|süreç|n
music|müzik|n
including|dahil|prep
consider|göz önüne almak|v
appear|görünmek|v
actually|aslında|adv
buy|satın almak|v
probably|muhtemelen|adv
human|insan|n
wait|beklemek|v
serve|hizmet etmek|v
market|pazar|n
die|ölmek|v
send|göndermek|v
expect|beklemek, ummak|v
sense|his, anlam|n
build|inşa etmek|v
stay|kalmak|v
fall|düşmek|v
oh|ah, oh|int
nation|millet|n
plan|plan|n
cut|kesmek|v
college|üniversite|n
interest|ilgi|n
death|ölüm|n
course|kurs, ders|n
someone|birisi|pron
experience|deneyim|n
behind|arkasında|prep
reach|ulaşmak|v
local|yerel|adj
kill|öldürmek|v
six|altı|num
remain|kalmak|v
effect|etki|n
yeah|evet (gündelik)|int
suggest|önermek|v
class|sınıf|n
control|kontrol|n
raise|kaldırmak, yetiştirmek|v
care|önemsemek; bakım|v
perhaps|belki|adv
late|geç|adj
hard|zor; sert|adj
field|alan, tarla|n
else|başka|adv
pass|geçmek|v
former|eski, önceki|adj
sell|satmak|v
major|büyük, önemli|adj
sometimes|bazen|adv
require|gerektirmek|v
along|boyunca|prep
development|gelişme|n
themselves|kendileri|pron
report|rapor|n
role|rol|n
better|daha iyi|adj
economic|ekonomik|adj
effort|çaba|n
decide|karar vermek|v
rate|oran|n
strong|güçlü|adj
possible|mümkün|adj
heart|kalp|n
leader|lider|n
light|ışık; hafif|n
voice|ses|n
wife|eş (kadın)|n
whole|bütün|adj
police|polis|n
mind|zihin|n
finally|sonunda|adv
pull|çekmek|v
return|geri dönmek|v
free|özgür, ücretsiz|adj
military|askeri|adj
price|fiyat|n
less|daha az|adv
according|-e göre|prep
decision|karar|n
explain|açıklamak|v
son|oğul|n
hope|ummak|v
develop|geliştirmek|v
view|görüş, manzara|n
relationship|ilişki|n
carry|taşımak|v
town|kasaba|n
road|yol|n
drive|araba sürmek|v
arm|kol|n
true|doğru|adj
break|kırmak|v
difference|fark|n
thank|teşekkür etmek|v
receive|almak (teslim)|v
value|değer|n
international|uluslararası|adj
building|bina|n
action|eylem|n
full|dolu|adj
model|model|n
join|katılmak|v
season|mevsim|n
society|toplum|n
tax|vergi|n
director|müdür, yönetmen|n
position|konum, pozisyon|n
player|oyuncu|n
agree|aynı fikirde olmak|v
especially|özellikle|adv
record|kayıt|n
pick|seçmek|v
wear|giymek|v
paper|kâğıt|n
special|özel|adj
space|uzay, boşluk|n
ground|zemin|n
form|form, biçim|n
support|desteklemek|v
event|etkinlik, olay|n
official|resmi|adj
whose|kimin|det
matter|mesele; önemli olmak|n
everyone|herkes|pron
center|merkez|n
couple|çift|n
site|site, alan|n
project|proje|n
hit|vurmak|v
base|temel|n
activity|etkinlik|n
star|yıldız|n
table|masa|n
court|mahkeme; kort|n
produce|üretmek|v
eat|yemek|v
teach|öğretmek|v
oil|yağ, petrol|n
half|yarım|n
situation|durum|n
easy|kolay|adj
cost|maliyet; mal olmak|n
industry|sanayi|n
figure|rakam; şekil|n
street|sokak|n
image|görüntü|n
itself|kendisi (cansız)|pron
phone|telefon|n
either|ikisinden biri|det
data|veri|n
cover|kaplamak, örtmek|v
quite|oldukça|adv
picture|resim|n
clear|açık, net|adj
practice|pratik|n
piece|parça|n
land|kara, arazi|n
recent|yakın zamanlı|adj
describe|tanımlamak|v
product|ürün|n
doctor|doktor|n
wall|duvar|n
patient|hasta; sabırlı|n
worker|işçi|n
news|haber|n
test|test|n
movie|film|n
certain|kesin, belirli|adj
north|kuzey|n
personal|kişisel|adj
simply|basitçe|adv
third|üçüncü|adj
technology|teknoloji|n
catch|yakalamak|v
step|adım|n
baby|bebek|n
computer|bilgisayar|n
type|tür; yazmak|n
attention|dikkat|n
draw|çizmek|v
film|film|n
tree|ağaç|n
source|kaynak|n
red|kırmızı|adj
nearly|neredeyse|adv
organization|kuruluş|n
choose|seçmek|v
cause|neden olmak|v
hair|saç|n
century|yüzyıl|n
evidence|kanıt|n
window|pencere|n
difficult|zor|adj
listen|dinlemek|v
soon|yakında|adv
culture|kültür|n
billion|milyar|num
chance|şans|n
brother|erkek kardeş|n
energy|enerji|n
period|dönem|n
summer|yaz|n
realize|fark etmek|v
hundred|yüz (sayı)|num
available|mevcut, uygun|adj
plant|bitki|n
likely|muhtemel|adj
opportunity|fırsat|n
term|terim; dönem|n
short|kısa|adj
letter|mektup; harf|n
condition|koşul|n
choice|seçim|n
single|tek; bekâr|adj
rule|kural|n
daughter|kız evlat|n
south|güney|n
husband|koca|n
floor|zemin, kat|n
campaign|kampanya|n
material|malzeme|n
population|nüfus|n
economy|ekonomi|n
medical|tıbbi|adj
hospital|hastane|n
close|kapatmak; yakın|v
thousand|bin|num
risk|risk|n
current|mevcut, güncel|adj
fire|ateş|n
future|gelecek|n
wrong|yanlış|adj
involve|içermek, dahil etmek|v
defense|savunma|n
anyone|herhangi biri|pron
increase|artırmak|v
security|güvenlik|n
bank|banka|n
myself|kendim|pron
certainly|kesinlikle|adv
west|batı|n
sport|spor|n
board|tahta; kurul|n
seek|aramak (peşinde)|v
per|başına|prep
subject|konu|n
officer|memur|n
private|özel|adj
rest|dinlenmek; kalan|n
behavior|davranış|n
deal|anlaşma|n
performance|performans|n
fight|kavga etmek|v
throw|atmak, fırlatmak|v
top|üst, tepe|n
quickly|hızlıca|adv
past|geçmiş|n
goal|hedef|n
bed|yatak|n
order|sipariş; sıra|n
author|yazar|n
fill|doldurmak|v
represent|temsil etmek|v
focus|odaklanmak|v
foreign|yabancı|adj
drop|düşürmek|v
blood|kan|n
upon|üzerine|prep
agency|ajans|n
push|itmek|v
nature|doğa|n
color|renk|n
recently|son zamanlarda|adv
store|mağaza|n
reduce|azaltmak|v
sound|ses|n
note|not|n
fine|iyi, güzel|adj
near|yakın|prep
movement|hareket|n
page|sayfa|n
enter|girmek|v
share|paylaşmak|v
common|yaygın|adj
poor|fakir|adj
natural|doğal|adj
race|yarış; ırk|n
concern|endişe|n
series|dizi|n
significant|önemli, anlamlı|adj
similar|benzer|adj
hot|sıcak|adj
language|dil|n
usually|genellikle|adv
response|yanıt|n
dead|ölü|adj
rise|yükselmek|v
animal|hayvan|n
factor|etken|n
decade|on yıl|n
article|makale|n
shoot|ateş etmek; çekmek|v
east|doğu|n
save|kurtarmak; biriktirmek|v
seven|yedi|num
artist|sanatçı|n
scene|sahne|n
stock|stok; hisse|n
career|kariyer|n
despite|-e rağmen|prep
central|merkezi|adj
eight|sekiz|num
thus|böylece|adv
treatment|tedavi|n
beyond|ötesinde|prep
happy|mutlu|adj
exactly|tam olarak|adv
protect|korumak|v
approach|yaklaşım|n
lie|yalan; uzanmak|v
size|boyut|n
dog|köpek|n
fund|fon|n
serious|ciddi|adj
occur|meydana gelmek|v
media|medya|n
ready|hazır|adj
sign|işaret; imzalamak|n
thought|düşünce|n
list|liste|n
individual|birey|n
simple|basit|adj
quality|kalite|n
pressure|baskı|n
accept|kabul etmek|v
answer|cevap|n
resource|kaynak|n
identify|belirlemek|v
left|sol|adj
meeting|toplantı|n
determine|belirlemek|v
prepare|hazırlamak|v
disease|hastalık|n
whatever|her ne|pron
success|başarı|n
argue|tartışmak|v
cup|fincan|n
particularly|özellikle|adv
amount|miktar|n
ability|yetenek|n
staff|personel|n
recognize|tanımak|v
indicate|belirtmek|v
character|karakter|n
growth|büyüme|n
loss|kayıp|n
degree|derece|n
wonder|merak etmek|v
attack|saldırı|n
herself|kendisi (kadın)|pron
region|bölge|n
television|televizyon|n
box|kutu|n
training|eğitim|n
pretty|güzel; oldukça|adj
trade|ticaret|n
election|seçim (oylama)|n
everybody|herkes|pron
physical|fiziksel|adj
lay|yatırmak, sermek|v
general|genel|adj
feeling|duygu|n
standard|standart|n
bill|fatura|n
message|mesaj|n
fail|başarısız olmak|v
outside|dışarıda|adv
arrive|varmak|v
analysis|analiz|n
benefit|fayda|n
forward|ileri|adv
lawyer|avukat|n
present|şimdiki; hediye|adj
section|bölüm|n
environmental|çevresel|adj
glass|bardak, cam|n
skill|beceri|n
sister|kız kardeş|n
professor|profesör|n
operation|operasyon|n
financial|mali|adj
crime|suç|n
stage|aşama; sahne|n
ok|tamam|int
compare|karşılaştırmak|v
authority|otorite|n
miss|özlemek; kaçırmak|v
design|tasarım|n
sort|tür; sıralamak|n
act|davranmak|v
ten|on|num
knowledge|bilgi|n
gun|silah|n
station|istasyon|n
blue|mavi|adj
strategy|strateji|n
clearly|açıkça|adv
discuss|tartışmak, konuşmak|v
indeed|gerçekten|adv
truth|gerçek, doğruluk|n
song|şarkı|n
example|örnek|n
democratic|demokratik|adj
check|kontrol etmek|v
environment|çevre|n
leg|bacak|n
dark|karanlık|adj
various|çeşitli|adj
rather|oldukça; -den ziyade|adv
laugh|gülmek|v
guess|tahmin etmek|v
executive|yönetici|n
prove|kanıtlamak|v
hang|asmak|v
entire|tüm|adj
rock|kaya|n
forget|unutmak|v
claim|iddia etmek|v
remove|kaldırmak|v
manager|yönetici|n
enjoy|zevk almak|v
network|ağ|n
legal|yasal|adj
religious|dini|adj
cold|soğuk|adj
final|son|adj
main|ana|adj
science|bilim|n
green|yeşil|adj
memory|hafıza|n
card|kart|n
above|yukarıda|prep
seat|koltuk|n
cell|hücre|n
establish|kurmak|v
nice|güzel, hoş|adj
trial|deneme; dava|n
expert|uzman|n
spring|ilkbahar|n
firm|firma; sağlam|n
radio|radyo|n
visit|ziyaret etmek|v
management|yönetim|n
avoid|kaçınmak|v
imagine|hayal etmek|v
tonight|bu gece|adv
huge|devasa|adj
ball|top|n
finish|bitirmek|v
yourself|kendin|pron
theory|teori|n
impact|etki|n
respond|yanıt vermek|v
statement|ifade, beyan|n
maintain|sürdürmek|v
charge|ücret; şarj|n
popular|popüler|adj
traditional|geleneksel|adj
onto|üzerine|prep
reveal|ortaya çıkarmak|v
direction|yön|n
weapon|silah|n
employee|çalışan|n
cultural|kültürel|adj
contain|içermek|v
peace|barış|n
pain|ağrı|n
apply|başvurmak|v
measure|ölçmek|v
wide|geniş|adj
shake|sallamak|v
fly|uçmak|v
interview|mülakat|n
manage|yönetmek|v
chair|sandalye|n
fish|balık|n
particular|belirli|adj
camera|kamera|n
structure|yapı|n
politics|siyaset|n
perform|gerçekleştirmek|v
bit|biraz, parça|n
weight|ağırlık|n
suddenly|aniden|adv
discover|keşfetmek|v
candidate|aday|n
production|üretim|n
treat|davranmak; ikram|v
trip|gezi|n
evening|akşam|n
affect|etkilemek|v
inside|içeride|adv
conference|konferans|n
unit|birim|n
style|stil|n
adult|yetişkin|n
worry|endişelenmek|v
range|aralık|n
mention|bahsetmek|v
deep|derin|adj
edge|kenar|n
specific|belirli|adj
writer|yazar|n
trouble|sorun, dert|n
necessary|gerekli|adj
throughout|boyunca|prep
challenge|zorluk|n
fear|korku|n
shoulder|omuz|n
institution|kurum|n
middle|orta|n
sea|deniz|n
dream|rüya; hayal|n
bar|bar; çubuk|n
beautiful|güzel|adj
property|mülk|n
instead|yerine|adv
improve|geliştirmek|v
stuff|şey(ler)|n
detail|ayrıntı|n
method|yöntem|n
somebody|birisi|pron
magazine|dergi|n
hotel|otel|n
soldier|asker|n
reflect|yansıtmak|v
heavy|ağır|adj
bag|çanta|n
heat|ısı|n
marriage|evlilik|n
tough|zor, sert|adj
sing|şarkı söylemek|v
surface|yüzey|n
purpose|amaç|n
exist|var olmak|v
pattern|kalıp, desen|n
whom|kimi|pron
skin|cilt|n
agent|ajan, temsilci|n
owner|sahip|n
machine|makine|n
gas|gaz; benzin|n
ahead|ileride|adv
generation|nesil|n
commercial|ticari|adj
address|adres|n
cancer|kanser|n
item|öğe|n
reality|gerçeklik|n
coach|antrenör|n
yard|avlu|n
beat|yenmek; vuruş|v
violence|şiddet|n
total|toplam|adj
tend|eğiliminde olmak|v
investment|yatırım|n
discussion|tartışma|n
finger|parmak|n
garden|bahçe|n
notice|fark etmek|v
collection|koleksiyon|n
modern|modern|adj
task|görev|n
partner|ortak|n
positive|olumlu|adj
civil|sivil|adj
kitchen|mutfak|n
consumer|tüketici|n
shot|atış|n
budget|bütçe|n
wish|dilemek|v
painting|tablo|n
scientist|bilim insanı|n
safe|güvenli|adj
agreement|anlaşma|n
capital|başkent; sermaye|n
mouth|ağız|n
nor|ne de|conj
victim|kurban|n
newspaper|gazete|n
threat|tehdit|n
responsibility|sorumluluk|n
smile|gülümsemek|v
score|skor|n
account|hesap|n
interesting|ilginç|adj
audience|seyirci|n
rich|zengin|adj
dinner|akşam yemeği|n
vote|oy|n
western|batılı|adj
relate|ilişkilendirmek|v
travel|seyahat etmek|v
debate|tartışma|n
prevent|önlemek|v
citizen|vatandaş|n
majority|çoğunluk|n
none|hiçbiri|pron
front|ön|n
born|doğmuş|adj
admit|itiraf etmek|v
senior|kıdemli|adj
assume|varsaymak|v
wind|rüzgâr|n
key|anahtar|n
professional|profesyonel|adj
mission|görev|n
fast|hızlı|adj
alone|yalnız|adj
customer|müşteri|n
suffer|acı çekmek|v
speech|konuşma|n
successful|başarılı|adj
option|seçenek|n
participant|katılımcı|n
southern|güneyli|adj
fresh|taze|adj
eventually|sonunda|adv
forest|orman|n
video|video|n
global|küresel|adj
reform|reform|n
access|erişim|n
restaurant|restoran|n
judge|yargıç|n
publish|yayımlamak|v
relation|ilişki|n
release|serbest bırakmak|v
bird|kuş|n
opinion|fikir|n
credit|kredi|n
critical|kritik|adj
corner|köşe|n
concerned|endişeli|adj
recall|hatırlamak|v
version|sürüm|n
stare|dik dik bakmak|v
safety|güvenlik|n
effective|etkili|adj
neighborhood|mahalle|n
original|orijinal|adj
income|gelir|n
directly|doğrudan|adv
hurt|incitmek|v
species|tür|n
immediately|hemen|adv
track|iz, parkur|n
basic|temel|adj
strike|grev; vurmak|n
sky|gökyüzü|n
freedom|özgürlük|n
absolutely|kesinlikle|adv
plane|uçak|n
nobody|hiç kimse|pron
achieve|başarmak|v
object|nesne|n
attitude|tutum|n
labor|emek|n
refer|atıfta bulunmak|v
concept|kavram|n
client|müşteri|n
powerful|güçlü|adj
perfect|mükemmel|adj
nine|dokuz|num
therefore|bu nedenle|adv
conduct|yürütmek|v
announce|duyurmak|v
conversation|sohbet|n
examine|incelemek|v
touch|dokunmak|v
please|lütfen|adv
attend|katılmak|v
completely|tamamen|adv
variety|çeşitlilik|n
sleep|uyumak|v
investigation|soruşturma|n
nuclear|nükleer|adj
researcher|araştırmacı|n
press|basın; basmak|n
conflict|çatışma|n
spirit|ruh|n
replace|yerine koymak|v
British|İngiliz|adj
encourage|cesaretlendirmek|v
argument|tartışma, argüman|n
camp|kamp|n
brain|beyin|n
feature|özellik|n
afternoon|öğleden sonra|n
weekend|hafta sonu|n
dozen|düzine|n
possibility|olasılık|n
insurance|sigorta|n
department|bölüm, departman|n
battle|muharebe|n
beginning|başlangıç|n
date|tarih; randevu|n
generally|genellikle|adv
sorry|üzgün; pardon|adj
crisis|kriz|n
complete|tamamlamak|v
fan|hayran; vantilatör|n
stick|sopa; yapıştırmak|n
define|tanımlamak|v
easily|kolayca|adv
hole|delik|n
element|öğe, element|n
vision|vizyon|n
status|durum, statü|n
normal|normal|adj
ship|gemi|n
solution|çözüm|n
stone|taş|n
slowly|yavaşça|adv
scale|ölçek|n
university|üniversite|n
introduce|tanıtmak|v
driver|sürücü|n
attempt|girişim|n
park|park|n
spot|nokta; fark etmek|n
lack|eksiklik|n
ice|buz|n
boat|tekne|n
drink|içmek|v
sun|güneş|n
distance|mesafe|n
wood|odun, tahta|n
handle|halletmek|v
truck|kamyon|n
mountain|dağ|n
survey|anket|n
supposed|-mesi gereken|adj
tradition|gelenek|n
winter|kış|n
village|köy|n
refuse|reddetmek|v
sales|satışlar|n
roll|yuvarlamak|v
communication|iletişim|n
screen|ekran|n
gain|kazanmak|v
resident|sakin|n
hide|saklamak|v
gold|altın|n
club|kulüp|n
farm|çiftlik|n
potential|potansiyel|n
presence|varlık|n
independent|bağımsız|adj
district|ilçe|n
shape|şekil|n
reader|okuyucu|n
contract|sözleşme|n
crowd|kalabalık|n
apartment|daire|n
strength|güç|n
band|grup (müzik)|n
horse|at|n
target|hedef|n
prison|hapishane|n
guard|muhafız|n
demand|talep|n
reporter|muhabir|n
deliver|teslim etmek|v
text|metin|n
tool|araç, alet|n
wild|vahşi|adj
vehicle|taşıt|n
observe|gözlemlemek|v
flight|uçuş|n
facility|tesis|n
understanding|anlayış|n
average|ortalama|adj
emerge|ortaya çıkmak|v
advantage|avantaj|n
quick|hızlı|adj
leadership|liderlik|n
earn|kazanmak (para)|v
pound|pound; sterlin|n
basis|temel|n
bright|parlak|adj
operate|çalıştırmak|v
guest|misafir|n
sample|örnek|n
contribute|katkıda bulunmak|v
tiny|minik|adj
block|blok|n
protection|koruma|n
settle|yerleşmek|v
feed|beslemek|v
collect|toplamak|v
additional|ek|adj
highly|son derece|adv
identity|kimlik|n
title|başlık|n
mostly|çoğunlukla|adv
lesson|ders|n
faith|inanç|n
river|nehir|n
promote|tanıtmak, terfi ettirmek|v
living|yaşayan; geçim|adj
count|saymak|v
unless|-medikçe|conj
marry|evlenmek|v
tomorrow|yarın|adv
technique|teknik|n
path|patika, yol|n
ear|kulak|n
shop|dükkân|n
folk|halk|n
principle|ilke|n
survive|hayatta kalmak|v
lift|kaldırmak|v
border|sınır|n
competition|rekabet, yarışma|n
jump|zıplamak|v
gather|toplamak|v
limit|sınır|n
fit|uymak; formda|v
cry|ağlamak|v
equipment|ekipman|n
worth|değer|adj
associate|ilişkilendirmek|v
critic|eleştirmen|n
warm|ılık, sıcak|adj
aspect|yön, açı|n
insist|ısrar etmek|v
failure|başarısızlık|n
annual|yıllık|adj
comment|yorum|n
responsible|sorumlu|adj
affair|mesele, ilişki|n
procedure|prosedür|n
regular|düzenli|adj
spread|yaymak|v
soft|yumuşak|adj
ignore|görmezden gelmek|v
egg|yumurta|n
belief|inanç|n
demonstrate|göstermek|v
anybody|herhangi biri|pron
gift|hediye|n
religion|din|n
review|gözden geçirmek|v
editor|editör|n
engage|meşgul etmek|v
coffee|kahve|n
document|belge|n
speed|hız|n
cross|geçmek; çapraz|v
influence|etki|n
anyway|neyse, zaten|adv
threaten|tehdit etmek|v
commit|taahhüt etmek|v
female|dişi, kadın|adj
youth|gençlik|n
wave|dalga|n
afraid|korkmuş|adj
quarter|çeyrek|n
background|arka plan|n
native|yerli, ana (dil)|adj
broad|geniş|adj
wonderful|harika|adj
deny|inkâr etmek|v
apparently|görünüşe göre|adv
slightly|biraz|adv
reaction|tepki|n
twice|iki kez|adv
suit|takım elbise|n
perspective|bakış açısı|n
growing|büyüyen|adj
blow|üflemek|v
construction|inşaat|n
intelligence|zekâ|n
destroy|yok etmek|v
cook|pişirmek|v
connection|bağlantı|n
burn|yanmak|v
shoe|ayakkabı|n
grade|not, sınıf|n
context|bağlam|n
committee|komite|n
hey|hey|int
mistake|hata|n
location|konum|n
clothes|kıyafetler|n
quiet|sessiz|adj
dress|elbise; giyinmek|n
promise|söz vermek|v
aware|farkında|adj
neighbor|komşu|n
function|işlev|n
bone|kemik|n
active|aktif|adj
extend|uzatmak|v
chief|şef|n
combine|birleştirmek|v
below|aşağıda|prep
cool|serin; havalı|adj
voter|seçmen|n
learning|öğrenme|n
bus|otobüs|n
dangerous|tehlikeli|adj
remind|hatırlatmak|v
moral|ahlaki|adj
category|kategori|n
relatively|nispeten|adv
victory|zafer|n
academic|akademik|adj
internet|internet|n
healthy|sağlıklı|adj
negative|olumsuz|adj
following|aşağıdaki|adj
historical|tarihi|adj
medicine|ilaç, tıp|n
tour|tur|n
depend|bağlı olmak|v
photo|fotoğraf|n
finding|bulgu|n
grab|kapmak|v
direct|doğrudan|adj
classroom|sınıf (oda)|n
contact|iletişim|n
justice|adalet|n
participate|katılmak|v
daily|günlük|adj
fair|adil|adj
pair|çift|n
famous|ünlü|adj
exercise|egzersiz|n
knee|diz|n
flower|çiçek|n
tape|bant|n
hire|işe almak|v
familiar|tanıdık|adj
appropriate|uygun|adj
supply|tedarik|n
fully|tamamen|adv
actor|aktör|n
birth|doğum|n
search|aramak|v
tie|bağlamak; kravat|v
democracy|demokrasi|n
eastern|doğulu|adj
primary|birincil|adj
yesterday|dün|adv
circle|daire|n
device|cihaz|n
progress|ilerleme|n
bottom|alt|n
island|ada|n
exchange|değişim|n
clean|temiz|adj
studio|stüdyo|n
train|tren; eğitmek|n
lady|hanımefendi|n
colleague|meslektaş|n
application|başvuru; uygulama|n
neck|boyun|n
lean|yaslanmak|v
damage|hasar|n
plastic|plastik|n
tall|uzun (boy)|adj
plate|tabak|n
hate|nefret etmek|v
otherwise|aksi takdirde|adv
writing|yazı|n
male|erkek|adj
alive|canlı|adj
expression|ifade|n
football|futbol|n
intend|niyet etmek|v
chicken|tavuk|n
army|ordu|n
theater|tiyatro|n
shut|kapatmak|v
map|harita|n
extra|ekstra|adj
session|oturum|n
danger|tehlike|n
welcome|hoş geldin|int
domestic|yerli, evcil|adj
lots|bir sürü|n
literature|edebiyat|n
rain|yağmur|n
desire|arzu|n
assessment|değerlendirme|n
injury|yaralanma|n
respect|saygı|n
northern|kuzeyli|adj
nod|başını sallamak|v
paint|boyamak|v
fuel|yakıt|n
leaf|yaprak|n
dry|kuru|adj
instruction|talimat|n
pool|havuz|n
climb|tırmanmak|v
sweet|tatlı|adj
engine|motor|n
fourth|dördüncü|adj
salt|tuz|n
expand|genişletmek|v
importance|önem|n
metal|metal|n
fat|yağ; şişman|n
ticket|bilet|n
software|yazılım|n
disappear|kaybolmak|v
corporate|kurumsal|adj
strange|garip|adj
lip|dudak|n
reading|okuma|n
urban|kentsel|adj
mental|zihinsel|adj
increasingly|giderek|adv
lunch|öğle yemeği|n
educational|eğitimsel|adj
somewhere|bir yerde|adv
farmer|çiftçi|n
sugar|şeker|n
planet|gezegen|n
favorite|favori|adj
explore|keşfetmek|v
obtain|elde etmek|v
enemy|düşman|n
complex|karmaşık|adj
surround|çevrelemek|v
athlete|sporcu|n
invite|davet etmek|v
repeat|tekrarlamak|v
carefully|dikkatlice|adv
soul|ruh|n
scientific|bilimsel|adj
impossible|imkânsız|adj
panel|panel|n
meaning|anlam|n
mom|anne (gündelik)|n
married|evli|adj
instrument|enstrüman|n
predict|tahmin etmek|v
weather|hava durumu|n
emotional|duygusal|adj
commitment|bağlılık|n
bear|ayı; katlanmak|n
pocket|cep|n
thin|ince|adj
temperature|sıcaklık|n
surprise|sürpriz|n
proposal|teklif|n
consequence|sonuç|n
breath|nefes|n
sight|görüş|n
balance|denge|n
adopt|benimsemek|v
minority|azınlık|n
straight|düz|adj
connect|bağlamak|v
teaching|öğretim|n
belong|ait olmak|v
aid|yardım|n
advice|tavsiye|n
okay|tamam|int
photograph|fotoğraf|n
empty|boş|adj
regional|bölgesel|adj
trail|patika|n
novel|roman|n
code|kod|n
somehow|bir şekilde|adv
organize|düzenlemek|v
acknowledge|kabul etmek|v
theme|tema|n
storm|fırtına|n
union|birlik|n
desk|çalışma masası|n
thanks|teşekkürler|int
fruit|meyve|n
expensive|pahalı|adj
yellow|sarı|adj
conclusion|sonuç|n
shadow|gölge|n
struggle|mücadele|n
analyst|analist|n
dance|dans etmek|v
being|varlık|n
ring|yüzük; çalmak|n
largely|büyük ölçüde|adv
shift|vardiya; kaydırmak|n
revenue|gelir|n
mark|işaret|n
locate|yerini bulmak|v
appearance|görünüş|n
package|paket|n
difficulty|zorluk|n
bridge|köprü|n
recommend|tavsiye etmek|v
obviously|açıkça|adv
email|e-posta|n
hello|merhaba|int
goodbye|hoşça kal|int
cat|kedi|n
tea|çay|n
breakfast|kahvaltı|n
cheap|ucuz|adj
hungry|aç|adj
tired|yorgun|adj
angry|kızgın|adj
sad|üzgün|adj
funny|komik|adj
busy|meşgul|adj
slow|yavaş|adj
loud|yüksek sesli|adj
dirty|kirli|adj
beach|plaj|n
holiday|tatil|n
birthday|doğum günü|n
wash|yıkamak|v
borrow|ödünç almak|v
lend|ödünç vermek|v
forgive|affetmek|v
swim|yüzmek|v
ride|binmek|v
rent|kira|n
sick|hasta|adj
bored|sıkılmış|adj
excited|heyecanlı|adj
worried|endişeli|adj
proud|gururlu|adj
lucky|şanslı|adj
honest|dürüst|adj
polite|kibar|adj
smart|akıllı|adj
delicious|lezzetli|adj
comfortable|rahat|adj
careful|dikkatli|adj
useful|yararlı|adj
boring|sıkıcı|adj
terrible|berbat|adj
nervous|gergin|adj
calm|sakin|adj
hurry|acele etmek|v
cancel|iptal etmek|v
celebrate|kutlamak|v
prefer|tercih etmek|v
apologize|özür dilemek|v
complain|şikâyet etmek|v
pronounce|telaffuz etmek|v
translate|çevirmek (dil)|v
sentence|cümle|n
`;

const LIFE_RAW = `
## food|Yiyecek & İçecek|🍎|#FF6A3D
apple|elma|🍎|I eat an apple every day.|Her gün bir elma yerim.
bread|ekmek|🍞|Can you buy some bread?|Biraz ekmek alabilir misin?
cheese|peynir|🧀|This cheese is delicious.|Bu peynir çok lezzetli.
egg|yumurta|🥚|I had two eggs for breakfast.|Kahvaltıda iki yumurta yedim.
milk|süt|🥛|Do you want milk in your coffee?|Kahvene süt ister misin?
water|su|💧|Can I have a glass of water?|Bir bardak su alabilir miyim?
coffee|kahve|☕|Let's get a coffee.|Hadi bir kahve alalım.
tea|çay|🍵|Turkish tea is very strong.|Türk çayı çok demlidir.
rice|pirinç, pilav|🍚|We're having rice tonight.|Bu akşam pilav yiyoruz.
meat|et|🥩|I don't eat meat.|Et yemem.
chicken|tavuk|🍗|The chicken is in the oven.|Tavuk fırında.
fish|balık|🐟|Fresh fish, please.|Taze balık, lütfen.
soup|çorba|🍲|This soup is too hot.|Bu çorba çok sıcak.
salad|salata|🥗|I'll have a salad.|Ben salata alacağım.
sugar|şeker|🍬|No sugar, thanks.|Şekersiz, teşekkürler.
salt|tuz|🧂|Could you pass the salt?|Tuzu uzatır mısın?
breakfast|kahvaltı|🍳|Breakfast is ready!|Kahvaltı hazır!
dinner|akşam yemeği|🍽️|What's for dinner?|Akşam yemeğinde ne var?
hungry|aç|😋|I'm so hungry.|Çok açım.
delicious|lezzetli|🤤|It smells delicious.|Nefis kokuyor.
## home|Ev & Eşyalar|🏠|#8B7BFF
house|ev|🏠|Their house is near the sea.|Onların evi denize yakın.
room|oda|🛋️|My room is small but cozy.|Odam küçük ama rahat.
door|kapı|🚪|Please close the door.|Lütfen kapıyı kapat.
window|pencere|🪟|Can I open the window?|Pencereyi açabilir miyim?
kitchen|mutfak|🍳|She's cooking in the kitchen.|Mutfakta yemek yapıyor.
bed|yatak|🛏️|I go to bed at eleven.|On birde yatarım.
chair|sandalye|🪑|Take a chair and sit down.|Bir sandalye al ve otur.
table|masa|🍽️|Dinner is on the table.|Yemek masada.
key|anahtar|🔑|I can't find my keys.|Anahtarlarımı bulamıyorum.
lamp|lamba|💡|Turn on the lamp, please.|Lambayı aç lütfen.
bathroom|banyo|🛁|Where is the bathroom?|Banyo nerede?
sofa|kanepe|🛋️|The cat is sleeping on the sofa.|Kedi kanepede uyuyor.
wall|duvar|🧱|There's a clock on the wall.|Duvarda bir saat var.
garden|bahçe|🌷|We have a small garden.|Küçük bir bahçemiz var.
mirror|ayna|🪞|Look in the mirror.|Aynaya bak.
clock|saat (duvar)|🕰️|The clock is five minutes fast.|Saat beş dakika ileri.
phone|telefon|📱|My phone is dead.|Telefonumun şarjı bitti.
towel|havlu|🧺|Can I have a clean towel?|Temiz bir havlu alabilir miyim?
stairs|merdiven|🪜|Take the stairs, not the lift.|Asansörü değil, merdiveni kullan.
roof|çatı|🏚️|The roof needs repairing.|Çatının tamir edilmesi gerekiyor.
## body|Vücut|🫀|#FFB4D0
head|baş, kafa|🗣️|My head hurts.|Başım ağrıyor.
eye|göz|👁️|She has green eyes.|Yeşil gözleri var.
ear|kulak|👂|I'm all ears.|Can kulağıyla dinliyorum.
nose|burun|👃|My nose is running.|Burnum akıyor.
mouth|ağız|👄|Open your mouth, please.|Ağzını aç lütfen.
hand|el|✋|Wash your hands.|Ellerini yıka.
foot|ayak|🦶|I hurt my foot.|Ayağımı incittim.
leg|bacak|🦵|My legs are tired.|Bacaklarım yorgun.
arm|kol|💪|He broke his arm.|Kolunu kırdı.
hair|saç|💇|I need a haircut.|Saçımı kestirmem lazım.
tooth|diş|🦷|Brush your teeth.|Dişlerini fırçala.
heart|kalp|❤️|My heart is beating fast.|Kalbim hızlı atıyor.
face|yüz|🙂|Wash your face.|Yüzünü yıka.
finger|parmak|👆|I cut my finger.|Parmağımı kestim.
shoulder|omuz|🤷|My shoulder hurts.|Omzum ağrıyor.
brain|beyin|🧠|Your brain loves sleep.|Beynin uykuyu sever.
bone|kemik|🦴|The dog has a bone.|Köpeğin bir kemiği var.
back|sırt|🧍|I have back pain.|Sırt ağrım var.
neck|boyun|🦒|My neck is stiff.|Boynum tutuldu.
stomach|mide, karın|🤰|My stomach hurts.|Midem ağrıyor.
## feel|Duygular|😊|#D7F75B
happy|mutlu|😊|I'm happy to see you.|Seni gördüğüme sevindim.
sad|üzgün|😢|Why are you sad?|Neden üzgünsün?
angry|kızgın|😠|Don't be angry with me.|Bana kızma.
tired|yorgun|😴|I'm too tired to cook.|Yemek yapamayacak kadar yorgunum.
scared|korkmuş|😨|I'm scared of spiders.|Örümceklerden korkarım.
excited|heyecanlı|🤩|We're so excited about the trip.|Gezi için çok heyecanlıyız.
bored|sıkılmış|😒|I'm bored. Let's go out.|Sıkıldım. Hadi dışarı çıkalım.
surprised|şaşırmış|😲|I was surprised by the news.|Habere şaşırdım.
worried|endişeli|😟|Don't worry, be happy.|Endişelenme, mutlu ol.
calm|sakin|😌|Stay calm and breathe.|Sakin kal ve nefes al.
nervous|gergin|😬|I get nervous before exams.|Sınavlardan önce gerilirim.
lonely|yalnız (hisseden)|🥺|I feel lonely sometimes.|Bazen kendimi yalnız hissediyorum.
confused|kafası karışık|😕|I'm a bit confused.|Kafam biraz karıştı.
relaxed|rahatlamış|🧘|I feel relaxed after yoga.|Yogadan sonra rahatlarım.
grateful|minnettar|🙏|I'm grateful for your help.|Yardımın için minnettarım.
embarrassed|utanmış|😳|I was so embarrassed!|Çok utanmıştım!
proud|gururlu|🏅|I'm proud of you.|Seninle gurur duyuyorum.
jealous|kıskanç|😤|Don't be jealous.|Kıskanma.
hopeful|umutlu|🌈|I'm hopeful about the future.|Gelecek konusunda umutluyum.
love|sevgi, aşk|❤️|I love this song.|Bu şarkıyı çok seviyorum.
## people|Aile & İnsanlar|👪|#7CC8FF
mother|anne|👩|My mother is a teacher.|Annem öğretmen.
father|baba|👨|My father loves football.|Babam futbolu sever.
sister|kız kardeş|👧|I have one sister.|Bir kız kardeşim var.
brother|erkek kardeş|👦|My brother is older than me.|Abim benden büyük.
baby|bebek|👶|The baby is sleeping.|Bebek uyuyor.
son|oğul|👦|Their son is five.|Oğulları beş yaşında.
daughter|kız evlat|👧|Her daughter is a doctor.|Kızı doktor.
husband|koca, eş|🤵|Her husband is very kind.|Kocası çok nazik.
wife|eş (kadın)|👰|His wife is from Izmir.|Eşi İzmirli.
grandmother|büyükanne|👵|My grandmother makes great cookies.|Babaannem harika kurabiye yapar.
grandfather|büyükbaba|👴|My grandfather tells funny stories.|Dedem komik hikâyeler anlatır.
uncle|amca, dayı|🧔|My uncle lives in London.|Amcam Londra'da yaşıyor.
aunt|teyze, hala|👩‍🦰|My aunt has three cats.|Teyzemin üç kedisi var.
cousin|kuzen|🧑‍🤝‍🧑|My cousin is my best friend.|Kuzenim en iyi arkadaşım.
friend|arkadaş|🤝|She's an old friend of mine.|O benim eski bir arkadaşım.
neighbor|komşu|🏘️|Our neighbors are very friendly.|Komşularımız çok cana yakın.
child|çocuk|🧒|Every child needs love.|Her çocuğun sevgiye ihtiyacı var.
parents|anne baba|👨‍👩‍👧|I live with my parents.|Annemle babamla yaşıyorum.
boss|patron|👔|My boss is on holiday.|Patronum tatilde.
guest|misafir|🛎️|We have guests tonight.|Bu akşam misafirimiz var.
## city|Şehir|🏙️|#FFD166
street|sokak|🛣️|I live on this street.|Bu sokakta yaşıyorum.
shop|dükkân|🏪|The shop closes at nine.|Dükkân dokuzda kapanıyor.
bank|banka|🏦|Is there a bank near here?|Buralarda banka var mı?
hospital|hastane|🏥|She works at a hospital.|Hastanede çalışıyor.
school|okul|🏫|The school is next to the park.|Okul parkın yanında.
park|park|🏞️|Let's walk in the park.|Parkta yürüyelim.
bridge|köprü|🌉|The bridge is closed today.|Köprü bugün kapalı.
bus|otobüs|🚌|I take the bus to work.|İşe otobüsle giderim.
train|tren|🚆|The train is late again.|Tren yine gecikti.
car|araba|🚗|Where did you park the car?|Arabayı nereye park ettin?
taxi|taksi|🚕|Let's take a taxi.|Hadi taksiye binelim.
station|istasyon|🚉|Meet me at the station.|Benimle istasyonda buluş.
museum|müze|🏛️|The museum is free on Sundays.|Müze pazar günleri ücretsiz.
restaurant|restoran|🍽️|I booked a table at the restaurant.|Restoranda masa ayırttım.
market|pazar, market|🛒|I buy vegetables at the market.|Sebzeleri pazardan alırım.
pharmacy|eczane|💊|Is the pharmacy open?|Eczane açık mı?
library|kütüphane|📚|I study at the library.|Kütüphanede ders çalışırım.
airport|havalimanı|🛫|How far is the airport?|Havalimanı ne kadar uzakta?
hotel|otel|🏨|Our hotel has a pool.|Otelimizin havuzu var.
police|polis|👮|Call the police!|Polisi ara!
## travel|Seyahat|✈️|#7EE3B8
ticket|bilet|🎫|Two tickets, please.|İki bilet, lütfen.
passport|pasaport|🛂|Don't forget your passport.|Pasaportunu unutma.
luggage|bagaj|🧳|My luggage is lost.|Bagajım kayboldu.
map|harita|🗺️|Can you show me on the map?|Bana haritada gösterebilir misin?
beach|plaj|🏖️|Let's go to the beach.|Hadi plaja gidelim.
holiday|tatil|🌴|We're on holiday next week.|Gelecek hafta tatildeyiz.
flight|uçuş|✈️|My flight is at six.|Uçuşum saat altıda.
trip|gezi|🚐|How was your trip?|Gezin nasıldı?
reservation|rezervasyon|📅|I have a reservation.|Rezervasyonum var.
tourist|turist|📸|The city is full of tourists.|Şehir turistlerle dolu.
abroad|yurt dışı|🌍|I want to study abroad.|Yurt dışında okumak istiyorum.
arrive|varmak|🛬|We arrived late at night.|Gece geç vardık.
delay|gecikme|⏳|Sorry for the delay.|Gecikme için özür dilerim.
guide|rehber|🧭|Our guide speaks Turkish.|Rehberimiz Türkçe konuşuyor.
souvenir|hatıra eşya|🎁|I bought a souvenir for you.|Sana bir hatıra aldım.
backpack|sırt çantası|🎒|My backpack is too heavy.|Sırt çantam çok ağır.
suitcase|bavul|💼|I need to pack my suitcase.|Bavulumu hazırlamam lazım.
direction|yön|🧭|Excuse me, which direction is the station?|Afedersiniz, istasyon hangi yönde?
visa|vize|📄|Do I need a visa?|Vizeye ihtiyacım var mı?
view|manzara|🌄|What a beautiful view!|Ne güzel bir manzara!
## work|İş & Okul|💼|#FF8FB1
job|iş|💼|I love my new job.|Yeni işimi çok seviyorum.
office|ofis|🏢|I'm at the office until six.|Altıya kadar ofisteyim.
meeting|toplantı|🤝|The meeting starts at ten.|Toplantı onda başlıyor.
email|e-posta|📧|I'll send you an email.|Sana bir e-posta göndereceğim.
computer|bilgisayar|💻|My computer is very slow.|Bilgisayarım çok yavaş.
salary|maaş|💰|The salary is good.|Maaş iyi.
manager|yönetici|👔|I'd like to speak to the manager.|Yöneticiyle konuşmak istiyorum.
colleague|iş arkadaşı|👥|My colleagues are very helpful.|İş arkadaşlarım çok yardımsever.
deadline|son teslim tarihi|⏰|The deadline is Friday.|Son teslim cuma.
project|proje|📊|We're starting a new project.|Yeni bir projeye başlıyoruz.
interview|mülakat|🎤|I have a job interview tomorrow.|Yarın iş görüşmem var.
customer|müşteri|🛍️|The customer is always right.|Müşteri her zaman haklıdır.
homework|ödev|📝|Did you do your homework?|Ödevini yaptın mı?
exam|sınav|✏️|I passed the exam!|Sınavı geçtim!
lesson|ders|📖|The lesson was really interesting.|Ders gerçekten ilginçti.
pen|kalem|🖊️|Can I borrow your pen?|Kalemini ödünç alabilir miyim?
notebook|defter|📓|Write it in your notebook.|Defterine yaz.
student|öğrenci|🎓|She's a university student.|Üniversite öğrencisi.
question|soru|❓|Can I ask a question?|Bir soru sorabilir miyim?
answer|cevap|✅|That's the right answer.|Doğru cevap bu.
## time|Zaman|⏰|#B8A6FF
today|bugün|📅|What are you doing today?|Bugün ne yapıyorsun?
tomorrow|yarın|➡️|See you tomorrow!|Yarın görüşürüz!
yesterday|dün|⬅️|I called you yesterday.|Dün seni aradım.
morning|sabah|🌅|Good morning!|Günaydın!
afternoon|öğleden sonra|🌤️|I'm free this afternoon.|Bu öğleden sonra boşum.
evening|akşam|🌆|Good evening, everyone.|Herkese iyi akşamlar.
night|gece|🌙|Good night, sleep well.|İyi geceler, iyi uykular.
week|hafta|🗓️|I go to the gym three times a week.|Haftada üç kez spor salonuna giderim.
month|ay|📆|I'll finish it next month.|Gelecek ay bitireceğim.
year|yıl|🎆|Happy New Year!|Mutlu yıllar!
hour|saat (süre)|⏱️|The film is two hours long.|Film iki saat sürüyor.
minute|dakika|⏲️|Wait a minute, please.|Bir dakika bekle lütfen.
weekend|hafta sonu|🎉|Have a nice weekend!|İyi hafta sonları!
early|erken|🐓|I wake up early.|Erken kalkarım.
late|geç|🐢|Sorry, I'm late.|Pardon, geç kaldım.
now|şimdi|⚡|I'm busy right now.|Şu an meşgulüm.
soon|yakında|⏳|See you soon!|Yakında görüşürüz!
always|her zaman|♾️|She always smiles.|O her zaman gülümser.
never|asla|🚫|I never eat fast food.|Asla fast food yemem.
sometimes|bazen|🔁|Sometimes I work from home.|Bazen evden çalışırım.
## nature|Hava & Doğa|🌦️|#6EC6FF
sun|güneş|☀️|The sun is shining.|Güneş parlıyor.
rain|yağmur|🌧️|Take an umbrella, it's going to rain.|Şemsiye al, yağmur yağacak.
snow|kar|❄️|It snowed all night.|Bütün gece kar yağdı.
wind|rüzgâr|💨|The wind is very strong today.|Bugün rüzgâr çok sert.
cloud|bulut|☁️|There isn't a cloud in the sky.|Gökyüzünde tek bir bulut yok.
storm|fırtına|⛈️|A storm is coming.|Bir fırtına geliyor.
hot|sıcak|🥵|It's really hot today.|Bugün gerçekten sıcak.
cold|soğuk|🥶|It's cold outside.|Dışarısı soğuk.
warm|ılık|🌡️|The water is warm.|Su ılık.
sky|gökyüzü|🌌|Look at the sky!|Gökyüzüne bak!
sea|deniz|🌊|I love swimming in the sea.|Denizde yüzmeyi severim.
mountain|dağ|⛰️|We climbed the mountain.|Dağa tırmandık.
river|nehir|🏞️|The river is very long.|Nehir çok uzun.
tree|ağaç|🌳|There's a big tree in our garden.|Bahçemizde büyük bir ağaç var.
flower|çiçek|🌸|These flowers smell nice.|Bu çiçekler güzel kokuyor.
forest|orman|🌲|Don't get lost in the forest.|Ormanda kaybolma.
lake|göl|🏝️|We had a picnic by the lake.|Göl kenarında piknik yaptık.
summer|yaz|🏖️|Summer is my favorite season.|Yaz en sevdiğim mevsim.
winter|kış|⛄|Winters are long here.|Burada kışlar uzun.
autumn|sonbahar|🍂|Autumn leaves are beautiful.|Sonbahar yaprakları çok güzel.
## animals|Hayvanlar|🐾|#FFA36C
dog|köpek|🐶|My dog loves walks.|Köpeğim yürüyüşleri sever.
cat|kedi|🐱|The cat is sleeping.|Kedi uyuyor.
bird|kuş|🐦|Birds are singing.|Kuşlar ötüyor.
horse|at|🐴|Can you ride a horse?|Ata binebilir misin?
cow|inek|🐄|Cows give us milk.|İnekler bize süt verir.
sheep|koyun|🐑|There are sheep on the hill.|Tepede koyunlar var.
mouse|fare|🐭|I saw a mouse in the kitchen!|Mutfakta bir fare gördüm!
rabbit|tavşan|🐰|The rabbit is eating a carrot.|Tavşan havuç yiyor.
bear|ayı|🐻|Bears sleep in winter.|Ayılar kışın uyur.
lion|aslan|🦁|The lion is the king of the jungle.|Aslan ormanın kralıdır.
monkey|maymun|🐒|Monkeys are very clever.|Maymunlar çok zekidir.
elephant|fil|🐘|Elephants never forget.|Filler asla unutmaz.
snake|yılan|🐍|I'm afraid of snakes.|Yılanlardan korkarım.
bee|arı|🐝|Bees make honey.|Arılar bal yapar.
butterfly|kelebek|🦋|A butterfly landed on my hand.|Elime bir kelebek kondu.
duck|ördek|🦆|Let's feed the ducks.|Hadi ördekleri besleyelim.
wolf|kurt|🐺|Wolves live in groups.|Kurtlar grup hâlinde yaşar.
tiger|kaplan|🐯|Tigers are strong swimmers.|Kaplanlar güçlü yüzücülerdir.
turtle|kaplumbağa|🐢|Slow and steady, like a turtle.|Kaplumbağa gibi yavaş ama istikrarlı.
chicken|tavuk|🐔|The chickens are in the garden.|Tavuklar bahçede.
## clothes|Giyim|👕|#C9A7FF
shirt|gömlek|👔|I need a white shirt.|Beyaz bir gömleğe ihtiyacım var.
t-shirt|tişört|👕|It's a cool t-shirt.|Havalı bir tişört.
dress|elbise|👗|What a beautiful dress!|Ne güzel bir elbise!
shoes|ayakkabı|👟|These shoes are comfortable.|Bu ayakkabılar rahat.
jacket|ceket|🧥|Take a jacket, it's cold.|Ceket al, hava soğuk.
trousers|pantolon|👖|These trousers are too long.|Bu pantolon çok uzun.
hat|şapka|🎩|Nice hat!|Güzel şapka!
cap|kep|🧢|He always wears a cap.|Hep kep takar.
socks|çorap|🧦|I can't find my socks.|Çoraplarımı bulamıyorum.
gloves|eldiven|🧤|Wear your gloves.|Eldivenlerini giy.
scarf|atkı|🧣|This scarf is very warm.|Bu atkı çok sıcak tutuyor.
bag|çanta|👜|Is this your bag?|Bu senin çantan mı?
glasses|gözlük|👓|I can't read without my glasses.|Gözlüğüm olmadan okuyamam.
watch|kol saati|⌚|What a nice watch.|Ne güzel bir saat.
ring|yüzük|💍|She's wearing a gold ring.|Altın bir yüzük takıyor.
skirt|etek|🩱|She bought a new skirt.|Yeni bir etek aldı.
sweater|kazak|🧶|My grandma knitted this sweater.|Bu kazağı büyükannem ördü.
umbrella|şemsiye|☂️|Don't forget your umbrella.|Şemsiyeni unutma.
boots|bot, çizme|🥾|I need new boots for winter.|Kış için yeni botlara ihtiyacım var.
pocket|cep|👖|It's in my pocket.|Cebimde.
## colors|Renkler & Şekiller|🎨|#FF6A3D
red|kırmızı|🔴|I love your red car.|Kırmızı arabana bayıldım.
blue|mavi|🔵|The sky is blue.|Gökyüzü mavi.
green|yeşil|🟢|Green is my favorite color.|Yeşil en sevdiğim renk.
yellow|sarı|🟡|Bananas are yellow.|Muzlar sarıdır.
black|siyah|⚫|I drink my coffee black.|Kahvemi sütsüz içerim.
white|beyaz|⚪|Snow is white.|Kar beyazdır.
orange|turuncu; portakal|🟠|Orange is a warm color.|Turuncu sıcak bir renk.
purple|mor|🟣|She dyed her hair purple.|Saçını mora boyadı.
brown|kahverengi|🟤|He has brown eyes.|Kahverengi gözleri var.
pink|pembe|🩷|The flowers are pink.|Çiçekler pembe.
gray|gri|🩶|It's a gray day.|Kasvetli, gri bir gün.
circle|daire|⭕|Draw a circle.|Bir daire çiz.
square|kare|🟥|The room is a perfect square.|Oda tam bir kare.
triangle|üçgen|🔺|A triangle has three sides.|Üçgenin üç kenarı vardır.
star|yıldız|⭐|You're a star!|Sen bir yıldızsın!
line|çizgi|➖|Draw a straight line.|Düz bir çizgi çiz.
big|büyük|🐘|That's a big house.|Bu büyük bir ev.
small|küçük|🐜|It's a small world.|Dünya küçük.
dark|koyu, karanlık|🌑|It's getting dark.|Hava kararıyor.
light|açık (renk), ışık|💡|I like light colors.|Açık renkleri severim.
## actions|Günlük Eylemler|🏃|#D7F75B
wake up|uyanmak|⏰|I wake up at seven.|Yedide uyanırım.
eat|yemek|🍽️|Let's eat something.|Hadi bir şeyler yiyelim.
drink|içmek|🥤|Drink more water.|Daha çok su iç.
sleep|uyumak|😴|I didn't sleep well.|İyi uyuyamadım.
walk|yürümek|🚶|I walk to work.|İşe yürüyerek giderim.
run|koşmak|🏃|I run every morning.|Her sabah koşarım.
read|okumak|📖|I'm reading a great book.|Harika bir kitap okuyorum.
write|yazmak|✍️|Write your name here.|Adını buraya yaz.
listen|dinlemek|🎧|Listen carefully.|Dikkatlice dinle.
speak|konuşmak|🗣️|Do you speak English?|İngilizce konuşuyor musun?
cook|yemek pişirmek|🧑‍🍳|I love to cook.|Yemek yapmayı severim.
wash|yıkamak|🧼|Wash the dishes, please.|Bulaşıkları yıka lütfen.
buy|satın almak|🛒|I want to buy a new phone.|Yeni bir telefon almak istiyorum.
pay|ödemek|💳|Can I pay by card?|Kartla ödeyebilir miyim?
open|açmak|📂|Open the box.|Kutuyu aç.
close|kapatmak|🔒|Close your eyes.|Gözlerini kapat.
call|aramak|📞|Call me later.|Beni sonra ara.
wait|beklemek|⏳|Wait for me!|Beni bekle!
learn|öğrenmek|🧠|I'm learning English.|İngilizce öğreniyorum.
help|yardım etmek|🆘|Can you help me?|Bana yardım edebilir misin?
## shopping|Alışveriş & Para|🛍️|#FFD166
money|para|💵|I don't have much money.|Çok param yok.
price|fiyat|🏷️|What's the price?|Fiyatı ne?
cheap|ucuz|💸|It's really cheap.|Gerçekten ucuz.
expensive|pahalı|💎|That's too expensive.|Bu çok pahalı.
cash|nakit|💴|Do you accept cash?|Nakit kabul ediyor musunuz?
card|kart|💳|I'll pay by card.|Kartla ödeyeceğim.
receipt|fiş|🧾|Can I have the receipt?|Fişi alabilir miyim?
discount|indirim|🔖|Is there a discount?|İndirim var mı?
size|beden|📏|What size are you?|Kaç beden giyiyorsun?
change|para üstü|🪙|Keep the change.|Üstü kalsın.
bill|hesap, fatura|🧾|Can we have the bill, please?|Hesabı alabilir miyiz lütfen?
sale|indirim, satış|🏬|Everything is on sale.|Her şey indirimde.
gift|hediye|🎁|It's a gift for my mom.|Annem için bir hediye.
wallet|cüzdan|👛|I left my wallet at home.|Cüzdanımı evde unuttum.
sell|satmak|🤝|They sell fresh fruit.|Taze meyve satıyorlar.
cost|mal olmak|💲|How much does it cost?|Bu ne kadar?
free|ücretsiz|🆓|The entrance is free.|Giriş ücretsiz.
order|sipariş|📦|My order hasn't arrived.|Siparişim gelmedi.
return|iade etmek|↩️|I'd like to return this.|Bunu iade etmek istiyorum.
customer|müşteri|🙋|The customer is waiting.|Müşteri bekliyor.
## health|Sağlık|🩺|#7EE3B8
doctor|doktor|🧑‍⚕️|You should see a doctor.|Bir doktora görünmelisin.
nurse|hemşire|👩‍⚕️|The nurse was very kind.|Hemşire çok nazikti.
medicine|ilaç|💊|Take this medicine twice a day.|Bu ilacı günde iki kez al.
pain|ağrı|🤕|I have a pain in my back.|Sırtımda ağrı var.
fever|ateş (hastalık)|🤒|She has a high fever.|Yüksek ateşi var.
cough|öksürük|😷|I have a bad cough.|Kötü bir öksürüğüm var.
flu|grip|🤧|I think I have the flu.|Sanırım grip oldum.
headache|baş ağrısı|🤯|I've got a terrible headache.|Berbat bir baş ağrım var.
sick|hasta|🤢|I feel sick.|Kendimi hasta hissediyorum.
healthy|sağlıklı|💪|Eat healthy food.|Sağlıklı beslen.
appointment|randevu|📅|I have a doctor's appointment.|Doktor randevum var.
exercise|egzersiz|🏋️|Exercise is good for you.|Egzersiz sana iyi gelir.
rest|dinlenmek|🛌|You need to rest.|Dinlenmen gerekiyor.
allergy|alerji|🌼|I have a nut allergy.|Fındık fıstık alerjim var.
injury|yaralanma|🩹|It's a minor injury.|Küçük bir yaralanma.
blood|kan|🩸|They took a blood test.|Kan tahlili yaptılar.
dentist|diş hekimi|🦷|I'm scared of the dentist.|Dişçiden korkarım.
emergency|acil durum|🚑|It's an emergency!|Acil durum!
better|daha iyi|📈|I feel much better today.|Bugün çok daha iyiyim.
breathe|nefes almak|🌬️|Breathe in, breathe out.|Nefes al, nefes ver.
`;

function slug(s) { return s.toLowerCase().trim(); }

// ---- Parse FREQ
const seen = new Set();
export const FREQ = [];
for (const line of FREQ_RAW.trim().split('\n')) {
  const [en, tr, pos] = line.split('|');
  const id = slug(en);
  if (!en || seen.has(id)) continue;
  seen.add(id);
  FREQ.push({ id, en, tr, pos, rank: FREQ.length + 1, list: 'freq' });
}

// ---- Parse LIFE
export const THEMES = [];
let cur = null;
for (const line of LIFE_RAW.trim().split('\n')) {
  if (line.startsWith('## ')) {
    const [id, title, emoji, color] = line.slice(3).split('|');
    cur = { id, title, emoji, color, words: [] };
    THEMES.push(cur);
    continue;
  }
  const [en, tr, emoji, ex, exTr] = line.split('|');
  if (!en) continue;
  cur.words.push({ id: slug(en), en, tr, emoji, ex, exTr, list: 'life', theme: cur.id });
}
export const LIFE = THEMES.flatMap(t => t.words);

// Units of 100 for the frequency list
// Units 1–10 = the core 1000; units beyond are bonus (1001+)
export const UNIT_SIZE = 100;
export const CORE = 1000;
export const UNITS = Array.from({ length: Math.ceil(FREQ.length / UNIT_SIZE) }, (_, i) => {
  const words = FREQ.slice(i * UNIT_SIZE, (i + 1) * UNIT_SIZE);
  return { id: String(i + 1), n: i + 1, from: i * UNIT_SIZE + 1, to: i * UNIT_SIZE + words.length, words, bonus: i * UNIT_SIZE >= CORE };
});

// Global lookup: prefer richer (life) entry for emoji/example when the same word exists in both lists
export const WORDS = new Map();
for (const w of FREQ) WORDS.set(w.id, { ...w });
const head = s => s.split(/[,;(]/)[0].trim();
for (const w of LIFE) {
  const prev = WORDS.get(w.id);
  if (!prev) { WORDS.set(w.id, { ...w }); continue; }
  // attach the example only when both entries share the same core meaning
  const same = prev.tr.includes(head(w.tr)) || w.tr.includes(head(prev.tr));
  WORDS.set(w.id, same ? { ...prev, emoji: w.emoji, ex: w.ex, exTr: w.exTr, theme: w.theme } : { ...prev, emoji: prev.emoji });
}
// Track-aware lookup: life entries keep their own meaning
export function lookup(id, list) {
  if (list === 'life') return LIFE.find(w => w.id === id) || WORDS.get(id);
  return WORDS.get(id);
}
export const getWord = id => WORDS.get(id);

export const POS_TR = { n: 'isim', v: 'fiil', adj: 'sıfat', adv: 'zarf', prep: 'edat', pron: 'zamir', conj: 'bağlaç', det: 'belirleyici', num: 'sayı', int: 'ünlem' };

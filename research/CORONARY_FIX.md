# Koroner geometri düzeltmesi, 15 Eylül 2026

## Saptanan hata

Önceki uygulama `heart.glb` odacıklarını kendi merkezleme/dönüş işlemiyle yerleştirirken aort ve koronerleri bağımsız sabit koordinatlarla çiziyordu. LAD ve LCx ortak ostium noktasından ayrı spline olarak başlıyor, kısa sol ana koroner bulunmuyordu. Yapay sinüs küreleri ve ostium halkaları atlas aort kapağına kayıtlı değildi. Koroner seçimi tüm bir odacığı perfüzyon bölgesi olarak renklendiriyordu; bu bölgesel perfüzyon modeli değildi.

## Değişiklik

`cardiovascular.glb` içindeki dört odacık, aort, LM, LAD, LCx, RCA, kardiyak venler ve kapak yaprakçıkları birlikte kullanılıyor. Her düğümün tam dünya dönüşümü korunuyor; hepsine aynı merkezleme ve tek ölçek uygulanıyor. Yapay koroner çizgileri, ostium halkaları ve sinüs küreleri kaldırıldı. LM ayrı kimlik kazandı. GCV ve CS ayrı etiketlendi. Odacıkların tamamını perfüzyon alanı gibi boyama kaldırıldı.

Kaynak dosya SHA-256: `05f373a294ab809b9a628bc1474a66028642997330fddc553a33d4ac6409b757`. Dosyada Blender dışa aktarım bilgisi var; upstream kaynak/üretici/lisans doğrulanamadı. Bu dosya HuBMAP olarak etiketlenmedi.

## Anatomik karşılaştırma

- Kullanıcının mini atlası: `Mini_atlas.pdf`, PDF s. 7 (basılı s. 5), koroner ve büyük damarların anterior/posterior preparatları.
- [University of Minnesota, coronary arterial anatomy](https://www.vhlab.umn.edu/atlas/coronary-system-tutorial/coronary-arterial-anatomy.shtml): LM bifurkasyonu, LAD ön interventriküler oluk, LCx sol AV oluk.
- [Joshi ve ark. 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC2815286/): sağ/sol aort sinüsü ve ostial ilişkiler.

LM ve RCA aort kökü yakınında başlar; LAD ve LCx ortak LM distal ucunda birleşir. Ön ve arka görünümler incelendi. Kaynak ağların proksimal açıklıkları ölçüldü; kapalı bir lümen veya doğru ostium duvar deliği kanıtlanmadı.

## Kontrollerin anlamı

Yedi kaynak geometri kontrolü: aorta–LM/RCA yakınlığı, LM–LAD/LCx ayrımı, ortak bifurkasyon, LM'nin iki ayrı açık uç halkası. Eşik maksimum odacık genişliğinin %3,5'idir; yalnızca kaba kayıt/regresyon kontrolüdür, klinik tolerans değildir. Kaynak birimi doğrulanmadığından milimetre iddiası yoktur. RCA–aorta en yakın örnek köşe mesafesi odacık genişliğinin yaklaşık %1,41'idir; bu ölçüm kesintisiz lümen bağlantısı göstermez.

Tarayıcı testi dokuz kaynak yapının gerçek ekrandaki sınır kutularını bağımsız çözümlenmiş kaynak koordinatlarıyla karşılaştırır. Vertex sayısı ve ortak dönüşüm korunması denetlenir. Ayrıca RV kesitinin diğer odacıklara/koronerlere uygulanmadığı kontrol edilir.

## Duvar pencereleri

Kaynak RV tek bağlantılı mesh; ayrı serbest duvar etiketi yoktur. Dört bölgesel geometrik kesit sunulur. RV kesiti LV'ye doğru kalan tarafı koruyarak dış/anterior yönden açılır. LV lateral, LA posterior ve RA lateral kesitleri de geometrik penceredir. Bunlar endokard/miyokard/epikard ayrımı, ölçülen duvar kalınlığı veya uzman tarafından segmentlenmiş serbest duvar sınırı değildir. Yapay kesit kapağı eklenmedi.

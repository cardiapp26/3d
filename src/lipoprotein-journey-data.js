// Qualitative teaching stages, not molecular dynamics or measured kinetics.
// Mechanisms: Cohen & Fisher (2013), doi:10.1055/s-0033-1358519, Fig. 1;
// Feingold, Introduction to Lipids and Lipoproteins, Endotext, NBK305896.
const t = (tr, en) => ({ tr, en });

export const TRAFFIC_TARGETS = [
  { id: 'ldlr', label: 'LDLR', kind: t('Reseptör', 'Receptor'),
    name: t('Düşük yoğunluklu lipoprotein reseptörü', 'Low-density lipoprotein receptor'),
    site: t('Karaciğer hücre yüzeyi', 'Hepatocyte surface'),
    role: t('LDL üzerindeki apoB-100’ü ve kalıntılardaki apoE’yi tanır; bağlı partikülün tamamını hücre içine alır. ApoB-48 tek başına LDLR’ye bağlanmaz.', 'Recognizes apoB-100 on LDL and apoE on remnants; internalizes the whole bound particle. ApoB-48 alone does not bind LDLR.') },
  { id: 'srbi', label: 'SR-BI', kind: t('Reseptör', 'Receptor'),
    name: t('Çöpçü reseptör sınıf B tip I', 'Scavenger receptor class B type I'),
    site: t('Karaciğer hücre yüzeyi', 'Hepatocyte surface'),
    role: t('HDL’nin kolesterol esterlerini seçici olarak karaciğere aktarır. Bu işlemde HDL’nin tamamının hücreye alınması gerekmez; partikül yeniden dolaşabilir.', 'Selectively transfers cholesteryl esters from HDL into the liver. This does not require uptake of the entire HDL particle; the particle can circulate again.') },
  { id: 'lpl', label: 'LPL', kind: t('Enzim', 'Enzyme'),
    name: t('Lipoprotein lipaz', 'Lipoprotein lipase'),
    site: t('Kas / yağ dokusu kapillerinin kanla temas eden yüzeyi', 'Blood-facing surface of muscle / adipose capillaries'),
    role: t('ApoC-II ile etkinleşir. Şilomikron ve VLDL’deki trigliseridi hidroliz eder; çıkan yağ asitleri dokulara geçer. Yük azalınca partikül küçülür.', 'Activated by apoC-II. Hydrolyzes triglycerides in chylomicrons and VLDL; released fatty acids enter tissues. Losing cargo makes the particle smaller.') },
  { id: 'lrp1', label: 'LRP1', kind: t('Reseptör', 'Receptor'),
    name: t('LDL reseptörüyle ilişkili protein 1', 'LDL receptor-related protein 1'),
    site: t('Karaciğer hücre yüzeyi', 'Hepatocyte surface'),
    role: t('ApoE taşıyan kalıntıların, özellikle şilomikron kalıntılarının karaciğere alınmasına katkı sağlar. Kalıntı temizlenmesinde LDLR ve diğer yüzey yapıları da görev alır.', 'Helps the liver take up apoE-bearing remnants, particularly chylomicron remnants. LDLR and other surface structures also contribute to remnant clearance.') },
  { id: 'hl', label: 'HL', kind: t('Enzim', 'Enzyme'),
    name: t('Hepatik lipaz', 'Hepatic lipase'),
    site: t('Karaciğer sinüzoidal yüzeyi', 'Hepatic sinusoidal surface'),
    role: t('IDL’nin kalan trigliseridini ve fosfolipitlerini hidroliz ederek LDL oluşumuna katkı sağlar. Her IDL LDL olmaz; bir kısmı doğrudan karaciğere alınır.', 'Hydrolyzes remaining triglycerides and phospholipids in IDL, contributing to LDL formation. Some IDL is taken up directly by the liver instead.') },
  { id: 'abca1', label: 'ABCA1', kind: t('Taşıyıcı', 'Transporter'),
    name: t('ATP bağlayan kaset taşıyıcısı A1', 'ATP-binding cassette transporter A1'),
    site: t('Periferik hücreler ve karaciğer hücre zarı', 'Peripheral cell and hepatocyte membranes'),
    role: t('Hücreden lipitten fakir apoA-I’e serbest kolesterol ve fosfolipit aktarır. Böylece yeni HDL oluşumunu başlatır; LDL’yi HDL’ye dönüştürmez.', 'Transfers free cholesterol and phospholipids from cells to lipid-poor apoA-I, starting HDL formation. It does not turn LDL into HDL.') },
  { id: 'lcat', label: 'LCAT', kind: t('Enzim', 'Enzyme'),
    name: t('Lesitin-kolesterol açiltransferaz', 'Lecithin-cholesterol acyltransferase'),
    site: t('Plazma, HDL yüzeyi', 'Plasma, HDL surface'),
    role: t('ApoA-I ile etkinleşir. Serbest kolesterolü kolesterol esterine çevirir; esterler HDL çekirdeğine geçer ve partikül olgunlaşır.', 'Activated by apoA-I. Converts free cholesterol to cholesteryl esters, which enter the HDL core as the particle matures.') }
];

// radius / tg / ce are illustrative drawing units, never nm, concentrations or molecule counts.
export const TRAFFIC_JOURNEYS = [
  { id: 'vldl', particles: ['vldl', 'idl', 'ldl', 'lpa'],
    name: t('VLDL → IDL → LDL', 'VLDL → IDL → LDL'), apo: 'apoB-100 ×1',
    identity: t('Aynı apoB-100 partikülde kalır. TG azalır; kolesterol esterinin göreli payı artar. Şekiller sınıf simgesidir; gerçek partikül elmas veya altıgen olmaz.', 'The same apoB-100 stays on the particle. TG falls; the relative share of cholesteryl ester rises. Map shapes identify classes; particles do not become diamonds or hexagons.'),
    stages: [
      { label: 'VLDL', radius: 70, tg: 16, ce: 5, target: null,
        title: t('1. Karaciğer TG yüklü VLDL salgılar', '1. Liver secretes TG-rich VLDL'),
        detail: t('Sarı noktalar trigliseridi, turuncu noktalar kolesterol esterini temsil eder. Mavi yüzey şeridi tek apoB-100’dür.', 'Yellow dots represent triglyceride; orange dots represent cholesteryl ester. The blue surface ribbon is one apoB-100.'), transfer: null },
      { label: 'IDL', radius: 53, tg: 7, ce: 5, target: 'lpl', transfer: 'out',
        title: t('2. LPL, TG’yi parçalar: VLDL → IDL', '2. LPL hydrolyzes TG: VLDL → IDL'),
        detail: t('Yağ asitleri kas / yağ dokusuna gider. Aynı partikül küçülür ve IDL kalıntısı olur; yeni apoB eklenmez.', 'Fatty acids enter muscle / adipose tissue. The same particle shrinks into an IDL remnant; no new apoB is added.') },
      { label: 'LDL', radius: 39, tg: 2, ce: 5, target: 'hl', transfer: 'out',
        title: t('3. Hepatik lipaz: IDL → LDL', '3. Hepatic lipase: IDL → LDL'),
        detail: t('Karaciğere doğrudan alınmayan IDL’nin bir bölümü daha fazla TG kaybeder; apoE ayrılır. Ortaya kolesterol esterinden zengin LDL çıkar.', 'Some IDL that escapes direct liver uptake loses more TG and sheds apoE, becoming cholesteryl ester-rich LDL.') },
      { label: t('LDL alımı', 'LDL uptake'), radius: 39, tg: 2, ce: 5, target: 'ldlr', transfer: 'whole',
        title: t('4. LDLR, bütün LDL partikülünü alır', '4. LDLR takes up the whole LDL particle'),
        detail: t('ApoB-100 reseptöre bağlanır; lipid yükü ve apoB birlikte hücre içine girer. IDL’nin doğrudan karaciğere alımı bu zincirin alternatif koludur.', 'ApoB-100 binds the receptor; lipid cargo and apoB enter the cell together. Direct hepatic uptake of IDL is an alternative branch of this pathway.') }
    ] },
  { id: 'chylomicron', particles: ['chylomicron'],
    name: t('Şilomikron → kalıntı', 'Chylomicron → remnant'), apo: 'apoB-48 ×1',
    identity: t('ApoB-48 kalır. Şilomikron kalıntısı LDL’ye dönüşmez; apoE aracılığıyla karaciğere alınır.', 'ApoB-48 stays. Chylomicron remnants do not become LDL; apoE mediates their uptake by the liver.'),
    stages: [
      { label: t('Şilomikron', 'Chylomicron'), radius: 78, tg: 22, ce: 3, target: null, transfer: null,
        title: t('1. Bağırsak diyet yağını paketler', '1. Intestine packages dietary fat'),
        detail: t('Büyük, TG yüklü şilomikron lenf yoluyla kana ulaşır. Yüzeyinde bir apoB-48 taşır.', 'Large TG-rich chylomicrons reach blood through lymph, carrying one apoB-48 each.') },
      { label: t('Kalıntı', 'Remnant'), radius: 48, tg: 6, ce: 3, target: 'lpl', transfer: 'out',
        title: t('2. LPL, TG yükünü azaltır', '2. LPL removes TG cargo'),
        detail: t('TG hidrolizinden çıkan yağ asitleri dokulara geçer. Küçülen partikül, apoB-48 ve apoE taşıyan kalıntıdır.', 'Fatty acids released by TG hydrolysis enter tissues. The smaller remnant carries apoB-48 and apoE.') },
      { label: t('Kalıntı alımı', 'Remnant uptake'), radius: 48, tg: 6, ce: 3, target: 'lrp1', transfer: 'whole',
        title: t('3. ApoE, kalıntıyı karaciğere yönlendirir', '3. ApoE directs the remnant to the liver'),
        detail: t('LRP1 ve LDLR gibi yollar kalıntının tamamını alır. Bağlanma sinyalini apoE sağlar; apoB-48 LDLR ligandı değildir.', 'LRP1, LDLR and related pathways take up the whole remnant. ApoE provides the binding signal; apoB-48 is not an LDLR ligand.') }
    ] },
  { id: 'hdl', particles: ['hdl'],
    name: t('HDL: kolesterolü geri taşı', 'HDL: return cholesterol'), apo: 'apoA-I',
    identity: t('HDL ayrı bir yoldur; LDL’den oluşmaz. Burada doğrudan SR-BI yolu gösterilir; CETP ile dolaylı aktarım da mümkündür.', 'HDL has a separate pathway; it does not form from LDL. This view shows direct SR-BI delivery; indirect transfer via CETP also occurs.'),
    stages: [
      { label: t('Lipitten fakir apoA-I', 'Lipid-poor apoA-I'), radius: 22, tg: 0, ce: 0, target: null, transfer: null,
        title: t('1. ApoA-I başlangıç taşıyıcısıdır', '1. ApoA-I is the starting carrier'),
        detail: t('ApoA-I, kolesterol ve fosfolipit kabul ederek yeni HDL’nin oluşmasını sağlar. ApoB taşımaz.', 'ApoA-I accepts cholesterol and phospholipids to form nascent HDL. It carries no apoB.') },
      { label: t('Yeni HDL', 'Nascent HDL'), radius: 37, tg: 0, ce: 0, fc: 6, target: 'abca1', transfer: 'in',
        title: t('2. ABCA1, hücreden kolesterol aktarır', '2. ABCA1 transfers cholesterol from cells'),
        detail: t('Serbest kolesterol ve fosfolipit apoA-I’e geçer. Yeni HDL disk biçimindedir; çizimde yandan basitleştirilmiş görünür.', 'Free cholesterol and phospholipids move to apoA-I. Nascent HDL is disk-shaped, shown here in a simplified side view.') },
      { label: t('Olgun HDL', 'Mature HDL'), radius: 48, tg: 0, ce: 6, target: 'lcat', transfer: 'esterify',
        title: t('3. LCAT, kolesterolü esterler', '3. LCAT esterifies cholesterol'),
        detail: t('Yüzeydeki serbest kolesterol, kolesterol esterine dönüşüp çekirdeğe geçer. HDL daha küresel hale gelir.', 'Surface free cholesterol becomes cholesteryl ester and moves into the core. HDL becomes more spherical.') },
      { label: t('Seçici lipid aktarımı', 'Selective lipid transfer'), radius: 35, tg: 0, ce: 1, target: 'srbi', transfer: 'selective',
        title: t('4. SR-BI, lipid yükünü karaciğere aktarır', '4. SR-BI transfers lipid cargo to the liver'),
        detail: t('Turuncu kolesterol esterleri karaciğere geçer. HDL’nin protein iskeleti dolaşımda kalabilir; bütün partikülün yutulması gerekmez.', 'Orange cholesteryl esters enter the liver. The HDL protein scaffold can remain in circulation; whole-particle uptake is not required.') }
    ] }
];

export const JOURNEY_WORDS = {
  tr: { title: 'Dönüşümü yakından izle', intro: 'Bir partikülü takip et: yük değişir, taşıyıcının kimliği izlenebilir. Aşamaya tıkla veya zaman çubuğunu sürükle.',
    previous: '← Önceki', next: 'Sonraki →', progress: 'Dönüşüm aşaması', pathways: 'Dönüşüm yolları',
    legend: ['TG', 'Kolesterol esteri', 'Serbest kolesterol', 'Yüzey proteini'],
    out: 'Yağ asitleri → doku', in: 'Hücre → kolesterol', esterify: 'Serbest kolesterol → ester', whole: 'Bütün partikül → karaciğer', selective: 'Yalnız lipid → karaciğer',
    note: 'Büyütülmüş öğretim şeması. Noktalar molekül sayısı, hareket süresi biyolojik süre değildir. Boyut ve yük değişimi nitelikseldir.',
    targets: 'Reseptörler, enzimler ve taşıyıcılar', targetHint: 'Adına tıkla: bulunduğu yer ve yaptığı iş burada görünür.', location: 'Yer', role: 'Görev',
    lpa: 'Lp(a), LDL benzeri bir partiküle bağlı apo(a) taşır; temizlenme yolu tam açıklanmamıştır. Aşağıdaki zincir VLDL / IDL / LDL içindir, Lp(a) temizlenmesini göstermez.' },
  en: { title: 'Watch the transformation up close', intro: 'Follow one particle: cargo changes while carrier identity stays traceable. Pick a stage or drag the timeline.',
    previous: '← Previous', next: 'Next →', progress: 'Transformation stage', pathways: 'Transformation pathways',
    legend: ['TG', 'Cholesteryl ester', 'Free cholesterol', 'Surface protein'],
    out: 'Fatty acids → tissue', in: 'Cell → cholesterol', esterify: 'Free cholesterol → ester', whole: 'Whole particle → liver', selective: 'Lipid only → liver',
    note: 'Enlarged teaching schematic. Dots are not molecule counts; animation time is not biological time. Size and cargo changes are qualitative.',
    targets: 'Receptors, enzymes and transporters', targetHint: 'Select a name to see its location and function.', location: 'Location', role: 'Function',
    lpa: 'Lp(a) carries apo(a) attached to an LDL-like particle; its clearance is not fully understood. The chain below is for VLDL / IDL / LDL, not Lp(a) clearance.' }
};

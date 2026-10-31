// Lipoprotein "traffic" teaching data. The starting point is a popular infographic that explains
// lipids as trucks on a road (mindmusclepro on X, 2026). Each particle and each claim of that post is
// kept as the analogy and checked against the literature; the scientific note says where it holds.
const t = (tr, en) => ({ tr, en });

export const LIPOPROTEIN_SOURCES = [
  { id: 'post', title: 'mindmusclepro: "Lipids Explained" (X post, 2026), the analogy discussed here', url: 'https://x.com/mindmusclepro/status/2116432373869097353' },
  { id: 'ference', title: 'Ference BA et al. LDL causes ASCVD. EAS consensus. Eur Heart J 2017;38:2459', url: 'https://doi.org/10.1093/eurheartj/ehx144' },
  { id: 'boren', title: 'Borén J et al. LDL causes ASCVD: pathophysiological, genetic and therapeutic insights. EAS consensus. Eur Heart J 2020;41:2313', url: 'https://doi.org/10.1093/eurheartj/ehz962' },
  { id: 'sniderman', title: 'Sniderman AD et al. Apolipoprotein B particles and cardiovascular disease. JAMA Cardiol 2019;4:1287', url: 'https://doi.org/10.1001/jamacardio.2019.3780' },
  { id: 'kronenberg', title: 'Kronenberg F et al. Lipoprotein(a) in ASCVD and aortic stenosis. EAS consensus. Eur Heart J 2022;43:3925', url: 'https://doi.org/10.1093/eurheartj/ehac361' },
  { id: 'bjornson', title: 'Björnson E et al. Lp(a) is markedly more atherogenic than LDL: an apoB-based genetic analysis. J Am Coll Cardiol 2024;83:385', url: 'https://doi.org/10.1016/j.jacc.2023.10.039' },
  { id: 'horizon', title: 'TCTMD: Lp(a)HORIZON top-line results (pelacarsen, September 2026)', url: 'https://www.tctmd.com/news/lpahorizon-top-line-results-dash-hopes-pelacarsen' },
  { id: 'guideline-2026', title: '2026 ACC/AHA Dyslipidemia Guideline', url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001423' },
  { id: 'voight', title: 'Voight BF et al. Plasma HDL cholesterol and risk of MI: a Mendelian randomisation study. Lancet 2012;380:572', url: 'https://doi.org/10.1016/S0140-6736(12)60312-2' },
  { id: 'madsen', title: 'Madsen CM et al. Extreme high HDL cholesterol is paradoxically associated with high mortality. Eur Heart J 2017;38:2478', url: 'https://doi.org/10.1093/eurheartj/ehx163' },
  { id: 'aimhigh', title: 'AIM-HIGH Investigators. Niacin in patients with low HDL-C on statins. N Engl J Med 2011;365:2255', url: 'https://doi.org/10.1056/NEJMoa1107579' },
  { id: 'thrive', title: 'HPS2-THRIVE Collaborative Group. Extended-release niacin with laropiprant. N Engl J Med 2014;371:203', url: 'https://doi.org/10.1056/NEJMoa1300955' },
  { id: 'aegis', title: 'Gibson CM et al. Apolipoprotein A1 infusions (CSL112) after MI: AEGIS-II. N Engl J Med 2024;390:1560', url: 'https://doi.org/10.1056/NEJMoa2400969' },
  { id: 'ctt', title: 'Cholesterol Treatment Trialists. More versus less intensive LDL lowering. Lancet 2010;376:1670', url: 'https://doi.org/10.1016/S0140-6736(10)61350-5' },
  { id: 'eckel', title: 'Eckel RH et al. 2013 AHA/ACC guideline on lifestyle management. Circulation 2014;129:S76', url: 'https://doi.org/10.1161/01.cir.0000437740.48606.d1' },
  { id: 'brown', title: 'Brown L et al. Cholesterol-lowering effects of dietary fiber: a meta-analysis. Am J Clin Nutr 1999;69:30', url: 'https://doi.org/10.1093/ajcn/69.1.30' },
  { id: 'mozaffarian', title: 'Mozaffarian D et al. Trans fatty acids and cardiovascular disease. N Engl J Med 2006;354:1601', url: 'https://doi.org/10.1056/NEJMra054035' },
  { id: 'kodama', title: 'Kodama S et al. Effect of aerobic exercise training on HDL-C: a meta-analysis. Arch Intern Med 2007;167:999', url: 'https://doi.org/10.1001/archinte.167.10.999' },
  { id: 'skulas', title: 'Skulas-Ray AC et al. Omega-3 fatty acids for hypertriglyceridemia. AHA science advisory. Circulation 2019;140:e673', url: 'https://doi.org/10.1161/CIR.0000000000000709' },
  { id: 'reduceit', title: 'Bhatt DL et al. REDUCE-IT: icosapent ethyl. N Engl J Med 2019;380:11', url: 'https://doi.org/10.1056/NEJMoa1812792' },
  { id: 'strength', title: 'Nicholls SJ et al. STRENGTH: omega-3 carboxylic acids. JAMA 2020;324:2268', url: 'https://doi.org/10.1001/jama.2020.22258' }
];

/** Lipoprotein classes. Sizes and densities are textbook ranges; `apoB` marks one apoB per particle. */
export const LIPOPROTEINS = [
  {
    id: 'chylomicron', apoB: 'B-48', inPost: false, color: '#f0d68e',
    name: t('Şilomikron', 'Chylomicron'),
    size: '75–1200 nm', density: '< 0,95 g/mL',
    cargo: t('Diyet trigliseridi (~%85–90)', 'Dietary triglyceride (~85–90%)'),
    apos: 'apoB-48, C-II, C-III, E, A-I',
    route: t('Bağırsak → lenf → kan → kas/yağ kapillerinde LPL → kalıntı → karaciğer (apoE ile alım)', 'Intestine → lymph → blood → LPL in muscle/adipose capillaries → remnant → liver (apoE-mediated uptake)'),
    atherogenic: t('Büyük şilomikron intimaya giremez; kalıntıları girebilir.', 'Large chylomicrons cannot enter the intima; their remnants can.'),
    analogy: t('Gönderide yok. Benzetmede: diyetten gelen yağı taşıyan ilk kamyon.', 'Not in the post. In the analogy: the first truck, carrying fat from the meal.'),
    science: t('Tokluk lipidinin taşıyıcısıdır. ApoB-48 taşır; ApoB ölçümü bu partikülleri de sayar, ancak açlıkta sayıları azdır.', 'Carrier of postprandial fat. It carries apoB-48; an apoB assay counts these too, but they are few in the fasting state.')
  },
  {
    id: 'vldl', apoB: 'B-100', inPost: true, color: '#b8923c',
    name: t('VLDL', 'VLDL'),
    size: '30–80 nm', density: '0,95–1,006 g/mL',
    cargo: t('Endojen trigliserid (~%50–60)', 'Endogenous triglyceride (~50–60%)'),
    apos: 'apoB-100, C-II, C-III, E',
    route: t('Karaciğer → kan → LPL ile TG boşalır (kas: yakıt, yağ dokusu: depo) → IDL → LDL', 'Liver → blood → LPL unloads TG (muscle: fuel, adipose: storage) → IDL → LDL'),
    atherogenic: t('Küçük VLDL ve kalıntıları (remnant kolesterol) aterojeniktir.', 'Small VLDL and its remnants (remnant cholesterol) are atherogenic.'),
    analogy: t('"Yağ kargo kamyonu": trigliserid kutularını karaciğerden depolara taşır.', '"Fat cargo truck": carries boxes of triglyceride from the liver to storage.'),
    science: t('Benzetme yarım kalır: VLDL yükünü boşalttıkça küçülür, IDL ve sonra LDL olur. Yani LDL kamyonu çoğunlukla boşalmış VLDL kamyonudur.', 'The analogy stops half way: as VLDL unloads it shrinks into IDL and then LDL. The LDL truck is mostly an emptied VLDL truck.')
  },
  {
    id: 'idl', apoB: 'B-100', inPost: false, color: '#d6a73e',
    name: t('IDL (VLDL kalıntısı)', 'IDL (VLDL remnant)'),
    size: '25–35 nm', density: '1,006–1,019 g/mL',
    cargo: t('TG ve kolesterol esteri karışık', 'Mixed TG and cholesteryl ester'),
    apos: 'apoB-100, E',
    route: t('VLDL → IDL → yaklaşık yarısı karaciğere alınır, kalanı hepatik lipazla LDL olur', 'VLDL → IDL → about half taken up by the liver, the rest becomes LDL via hepatic lipase'),
    atherogenic: t('Evet; intimaya girer ve tutulur.', 'Yes; enters and is retained in the intima.'),
    analogy: t('Gönderide yok. Benzetmede: yükünün bir kısmını boşaltmış kargo kamyonu.', 'Not in the post. In the analogy: a cargo truck that has dropped part of its load.'),
    science: t('Remnant (kalıntı) kolesterol, LDL-C dışında kalan aterojenik kolesterolün önemli kısmıdır; non-HDL-C bunu da içerir.', 'Remnant cholesterol is a large part of the atherogenic cholesterol outside LDL-C; non-HDL-C includes it.')
  },
  {
    id: 'ldl', apoB: 'B-100', inPost: true, color: '#e2741e',
    name: t('LDL', 'LDL'),
    size: '18–25 nm', density: '1,019–1,063 g/mL',
    cargo: t('Kolesterol esteri (ana yük)', 'Cholesteryl ester (main load)'),
    apos: t('Yalnız apoB-100', 'apoB-100 only'),
    route: t('Kanda dolaşır; büyük kısmı karaciğer LDL reseptörüyle temizlenir. Bir kısmı arter duvarına (intima) girer ve proteoglikanlara tutunur.', 'Circulates; most is cleared by hepatic LDL receptors. Some enters the arterial wall (intima) and is retained by proteoglycans.'),
    atherogenic: t('Nedensel: genetik, epidemiyolojik ve randomize kanıt (EAS 2017).', 'Causal: genetic, epidemiological and randomized evidence (EAS 2017).'),
    analogy: t('"Teslimat kamyonu": karaciğer deposundan hücrelere kolesterol tuğlası taşır.', '"Delivery truck": carries cholesterol bricks from the liver warehouse to cells.'),
    science: t('Çoğu hücre kolesterolünü kendisi sentezler; LDL kamyonu çoğunlukla karaciğere geri döner. Zarar, kamyonun yol kenarına (intima) girip orada kalmasıdır: giren partikül sayısı ve kalış süresi belirleyicidir.', 'Most cells make their own cholesterol; the LDL truck mostly returns to the liver. Harm comes when trucks enter the roadside (intima) and stay: particle number and exposure time decide.')
  },
  {
    id: 'lpa', apoB: 'B-100', inPost: true, color: '#c2463c',
    name: t('Lp(a)', 'Lp(a)'),
    size: '~25–30 nm', density: '1,05–1,12 g/mL',
    cargo: t('LDL benzeri çekirdek + okside fosfolipitler', 'LDL-like core + oxidized phospholipids'),
    apos: t('apoB-100 + disülfid bağlı apo(a)', 'apoB-100 + disulfide-linked apo(a)'),
    route: t('Karaciğerde üretilir; düzeyi büyük ölçüde (>%90) LPA geniyle belirlenir. Temizlenme yolu tam bilinmez.', 'Made in the liver; level is largely (>90%) set by the LPA gene. Clearance route is not fully known.'),
    atherogenic: t('Evet; genetik analizde partikül başına LDL’den yaklaşık 6 kat aterojenik (Björnson 2024). Aort darlığı ile de ilişkili.', 'Yes; per particle about 6-fold more atherogenic than LDL in a genetic analysis (Björnson 2024). Also linked to aortic stenosis.'),
    analogy: t('"Yapışkan tekerlekli LDL kamyonu": plak ve pıhtı eğilimi.', '"LDL truck with sticky wheels": plaque and clot tendency.'),
    science: t('Benzetme iyi: apo(a) plazminojene benzer (antifibrinolitik olası etki), okside fosfolipitler inflamasyonu artırır. Erişkinlikte bir kez ölçülmesi önerilir (EAS 2022); ≥125 nmol/L (~≥50 mg/dL) yüksek kabul edilir.', 'A good analogy: apo(a) resembles plasminogen (possible antifibrinolytic effect) and oxidized phospholipids drive inflammation. Measure once in adulthood (EAS 2022); ≥125 nmol/L (~≥50 mg/dL) is high.')
  },
  {
    id: 'hdl', apoB: null, inPost: true, color: '#3f9a63',
    name: t('HDL', 'HDL'),
    size: '5–12 nm', density: '1,063–1,21 g/mL',
    cargo: t('Protein (~%50), fosfolipit, kolesterol', 'Protein (~50%), phospholipid, cholesterol'),
    apos: 'apoA-I (ana), apoA-II',
    route: t('Lipitten fakir apoA-I, ABCA1 ile hücreden kolesterol alır (efflux) → LCAT esterler → karaciğere SR-BI ile verir veya CETP ile apoB partiküllerine aktarır.', 'Lipid-poor apoA-I takes cholesterol from cells via ABCA1 (efflux) → LCAT esterifies → delivers to liver via SR-BI or transfers it to apoB particles via CETP.'),
    atherogenic: t('Hayır; ama HDL-C’yi artırmak olay azaltmadı.', 'No; but raising HDL-C did not reduce events.'),
    analogy: t('"Geri dönüşüm kamyonu": dokulardan ve arterlerden artık kolesterolü toplar.', '"Recycling truck": collects leftover cholesterol from tissues and arteries.'),
    science: t('Ters kolesterol taşınımı gerçektir, ama HDL-C kamyondaki yükü ölçer, kamyonun ne kadar iş yaptığını değil. Mendel randomizasyonu HDL-C’nin nedensel olmadığını gösterdi; çok yüksek HDL-C ile mortalite artabilir.', 'Reverse cholesterol transport is real, but HDL-C measures the load on the truck, not how much work it does. Mendelian randomization showed HDL-C is not causal; very high HDL-C may go with higher mortality.')
  }
];

/** Starting profiles (mg/dL; Lp(a) nmol/L). Teaching archetypes, not patients. */
export const LIPID_PRESETS = [
  { id: 'reference', name: t('Referans', 'Reference'), profile: { ldl: 100, tg: 100, hdl: 55, lpa: 30 } },
  { id: 'atherogenic', name: t('Aterojenik dislipidemi (insülin direnci)', 'Atherogenic dyslipidemia (insulin resistance)'), profile: { ldl: 100, tg: 280, hdl: 35, lpa: 30 } },
  { id: 'fh', name: t('FH benzeri yüksek LDL', 'FH-like high LDL'), profile: { ldl: 220, tg: 120, hdl: 50, lpa: 40 } },
  { id: 'lpa', name: t('Yüksek Lp(a)', 'High Lp(a)'), profile: { ldl: 100, tg: 100, hdl: 55, lpa: 220 } }
];

/**
 * Levers: fractional change of each value. Directions follow the cited evidence; magnitudes are
 * rounded mid-range teaching values, not individual predictions. Lifestyle does not change Lp(a).
 */
export const LIPID_LEVERS = [
  { id: 'weight', group: 'lifestyle', effect: { ldl: -0.04, tg: -0.15, hdl: 0.05 }, sources: ['eckel'],
    name: t('Kalori açığı (%5–8 kilo kaybı)', 'Calorie deficit (5–8% weight loss)'),
    note: t('TG en çok etkilenir; LDL-C düşüşü ~5 mg/dL, HDL-C artışı 2–3 mg/dL düzeyinde.', 'TG responds most; LDL-C falls ~5 mg/dL and HDL-C rises 2–3 mg/dL.') },
  { id: 'satfat', group: 'lifestyle', effect: { ldl: -0.10, hdl: -0.02 }, sources: ['eckel'],
    name: t('Doymuş yağı azalt, doymamışla değiştir', 'Cut saturated fat, replace with unsaturated'),
    note: t('Doymuş yağı enerjinin %5–6’sına indirmek LDL-C’yi ~11–13 mg/dL düşürür.', 'Lowering saturated fat to 5–6% of energy lowers LDL-C by ~11–13 mg/dL.') },
  { id: 'transfat', group: 'lifestyle', effect: { ldl: -0.05, hdl: 0.03 }, sources: ['mozaffarian'],
    name: t('Trans yağı kaldır', 'Eliminate trans fat'),
    note: t('Trans yağ LDL-C’yi yükseltir, HDL-C’yi düşürür; kaldırmak her ikisini düzeltir.', 'Trans fat raises LDL-C and lowers HDL-C; removing it reverses both.') },
  { id: 'carbs', group: 'lifestyle', effect: { tg: -0.15, hdl: 0.03 }, sources: ['eckel'],
    name: t('Rafine karbonhidrat ve şekeri azalt', 'Cut refined carbohydrate and sugar'),
    note: t('Hepatik VLDL-TG üretimini azaltır; LDL-C üzerine etkisi küçüktür.', 'Reduces hepatic VLDL-TG output; little effect on LDL-C.') },
  { id: 'fiber', group: 'lifestyle', effect: { ldl: -0.05 }, sources: ['brown'],
    name: t('Çözünür lif 5–10 g/gün', 'Soluble fiber 5–10 g/day'),
    note: t('Safra asidi geri emilimini azaltır; LDL-C’de yaklaşık %5 düşüş.', 'Reduces bile acid reabsorption; about 5% lower LDL-C.') },
  { id: 'omega3', group: 'lifestyle', effect: { tg: -0.25 }, sources: ['skulas', 'reduceit', 'strength'],
    name: t('Omega-3 (EPA+DHA ~4 g/gün)', 'Omega-3 (EPA+DHA ~4 g/day)'),
    note: t('Reçeteli 4 g/gün TG’yi %20–30 düşürür. Balık tüketimi bu dozu sağlamaz. Olay azalması yalnız icosapent etil ile (REDUCE-IT) gösterildi; karışık omega-3 (STRENGTH) ve reçetesiz takviyeler göstermedi.', 'Prescription 4 g/day lowers TG by 20–30%. Eating fish does not reach this dose. Event reduction was shown only with icosapent ethyl (REDUCE-IT), not with mixed omega-3 (STRENGTH) or over-the-counter supplements.') },
  { id: 'exercise', group: 'lifestyle', effect: { ldl: -0.03, tg: -0.10, hdl: 0.04 }, sources: ['kodama', 'eckel'],
    name: t('Düzenli aerobik egzersiz', 'Regular aerobic exercise'),
    note: t('HDL-C ortalama ~2,5 mg/dL artar; TG düşer. Yarar lipitlerin ötesindedir.', 'HDL-C rises ~2.5 mg/dL on average; TG falls. Benefit goes beyond lipids.') },
  { id: 'statin', group: 'drug', effect: { ldl: -0.50, tg: -0.15, hdl: 0.05, lpa: 0.10 }, sources: ['ctt'],
    name: t('Yüksek yoğunluklu statin', 'High-intensity statin'),
    note: t('LDL-C ≥%50 düşer. Her 1 mmol/L (~39 mg/dL) LDL-C düşüşü majör vasküler olayları ~%22 azaltır (CTT). Lp(a) değişmez veya biraz artabilir.', 'LDL-C falls ≥50%. Each 1 mmol/L (~39 mg/dL) lower LDL-C cuts major vascular events ~22% (CTT). Lp(a) is unchanged or may rise slightly.') },
  { id: 'ezetimibe', group: 'drug', effect: { ldl: -0.22 }, sources: ['ctt'],
    name: t('Ezetimib', 'Ezetimibe'),
    note: t('NPC1L1 inhibisyonu; statine ek ~%20–25 LDL-C düşüşü.', 'NPC1L1 inhibition; ~20–25% further LDL-C lowering on a statin.') },
  { id: 'pcsk9', group: 'drug', effect: { ldl: -0.60, tg: -0.10, lpa: -0.25 }, sources: ['ference', 'kronenberg'],
    name: t('PCSK9 monoklonal antikoru', 'PCSK9 monoclonal antibody'),
    note: t('LDL-C ~%60 ek düşüş; Lp(a) ~%20–30 düşer, ancak Lp(a) endikasyonu yoktur.', 'LDL-C ~60% further lowering; Lp(a) falls ~20–30%, but there is no Lp(a) indication.') }
];

/** Claims of the post, checked. verdict: 'ok' holds, 'partial' needs a correction, 'wrong' misleads. */
export const POST_CLAIMS = [
  { id: 'cholesterol', verdict: 'partial', sources: ['boren'],
    claim: t('Kolesterol hücre duvarı yapımı ve hormonlar için gereken malzemedir.', 'Cholesterol is the material for building cell walls and making hormones.'),
    check: t('Hayvan hücresinde duvar yoktur; kolesterol hücre zarının yapı taşıdır. Steroid hormonlar, safra asitleri ve D vitamini öncüsüdür. Vücut gereksinimini büyük ölçüde kendisi sentezler.', 'Animal cells have no wall; cholesterol builds the cell membrane. It is the precursor of steroid hormones, bile acids and vitamin D. The body makes most of what it needs.') },
  { id: 'trucks', verdict: 'ok', sources: ['boren'],
    claim: t('Lipoproteinler kolesterol taşıyan kamyonlardır; boyuta göre türleri vardır.', 'Lipoproteins are trucks carrying cholesterol; there are types by size.'),
    check: t('Doğru. Sınıflar yoğunluğa göre adlandırılır (ultrasantrifüj); boyut büyüdükçe yoğunluk azalır.', 'Correct. Classes are named by density (ultracentrifugation); the larger the particle, the lower the density.') },
  { id: 'tg', verdict: 'ok', sources: ['skulas'],
    claim: t('Trigliseridler kamyonların taşıdığı yakıt bidonlarıdır.', 'Triglycerides are fuel containers carried by the trucks.'),
    check: t('Doğru. LPL trigliseridi serbest yağ asidine ayırır: kasta yakıt, yağ dokusunda depo.', 'Correct. LPL splits triglyceride into free fatty acids: fuel in muscle, storage in fat.') },
  { id: 'hdl', verdict: 'partial', sources: ['voight', 'madsen', 'aimhigh', 'thrive'],
    claim: t('HDL geri dönüşüm kamyonudur; HDL yüksek olmalı.', 'HDL is the recycling truck; HDL should be high.'),
    check: t('Ters kolesterol taşınımı gerçektir, ama HDL-C’yi ilaçla yükseltmek (niasin: AIM-HIGH, HPS2-THRIVE; CETP inhibitörleri) olay azaltmadı. Mendel randomizasyonunda nedensel değil; çok yüksek HDL-C’de mortalite artabilir. Düşük HDL-C bir risk işaretidir, hedef değildir.', 'Reverse cholesterol transport is real, but raising HDL-C with drugs (niacin: AIM-HIGH, HPS2-THRIVE; CETP inhibitors) did not reduce events. It is not causal in Mendelian randomization; very high HDL-C may raise mortality. Low HDL-C is a risk marker, not a target.') },
  { id: 'ldl', verdict: 'partial', sources: ['ference', 'boren'],
    claim: t('LDL karaciğerden hücrelere kolesterol taşıyan teslimat kamyonudur; düşük olmalı.', 'LDL is the delivery truck from the liver to cells; it should be low.'),
    check: t('"Düşük olmalı" doğru: LDL nedenseldir. Ancak LDL çoğunlukla karaciğere geri döner; hasar, apoB partiküllerinin intimaya girip tutulmasıyla başlar.', '"Should be low" is right: LDL is causal. But LDL mostly returns to the liver; damage starts when apoB particles enter and are retained in the intima.') },
  { id: 'lpa', verdict: 'partial', sources: ['kronenberg', 'bjornson', 'horizon', 'guideline-2026'],
    claim: t('Lp(a) yapışkan tekerlekli LDL kamyonudur; düşük olmalı ama yapılabilecek pek bir şey yok.', 'Lp(a) is an LDL truck with sticky wheels; it should be low but not much can be done.'),
    check: t('Yaşam tarzı Lp(a)’yı değiştirmez. Yapılabilecek olan: bir kez ölç, yüksekse diğer riskleri (özellikle LDL-C) daha sıkı yönet. PCSK9 antikorları ~%25 düşürür. Lp(a)HORIZON’da pelacarsen Lp(a)’yı düşürdü ama Eylül 2026 ön sonuçlarında MACE’i azaltmadı; olpasiran ve lepodisiran çalışmaları sürüyor.', 'Lifestyle does not change Lp(a). What can be done: measure once and, if high, manage other risks (especially LDL-C) harder. PCSK9 antibodies lower it ~25%. In Lp(a)HORIZON, pelacarsen lowered Lp(a) but did not reduce MACE in the September 2026 top-line results; olpasiran and lepodisiran trials continue.') },
  { id: 'vldl', verdict: 'partial', sources: ['boren'],
    claim: t('VLDL trigliseridi depolara taşıyan yağ kargo kamyonudur.', 'VLDL is the fat cargo truck taking triglyceride to storage.'),
    check: t('Eksik: yükünü boşaltan VLDL, IDL ve LDL’ye dönüşür. VLDL kalıntıları (remnant kolesterol) aterojeniktir.', 'Incomplete: VLDL that unloads becomes IDL and LDL. VLDL remnants (remnant cholesterol) are atherogenic.') },
  { id: 'apob', verdict: 'ok', sources: ['sniderman', 'guideline-2026'],
    claim: t('ApoB tüm teslimat kamyonlarının ortak plakasıdır; sayısı yoldaki kamyon sayısıdır.', 'ApoB is the shared licence plate of all delivery trucks; counting it counts the trucks.'),
    check: t('Doğru ve benzetmenin en güçlü kısmı: her aterojenik partikülde tek apoB vardır. LDL-C ile apoB uyumsuz olduğunda (yüksek TG, diyabet, obezite) risk apoB’yi izler.', 'Correct, and the strongest part of the analogy: each atherogenic particle carries one apoB. When LDL-C and apoB disagree (high TG, diabetes, obesity), risk follows apoB.') },
  { id: 'apoa1', verdict: 'wrong', sources: ['aegis'],
    claim: t('ApoA1 yüksek olmalı; daha çok plaka daha çok temizlik demektir.', 'ApoA1 should be high; more plates mean more cleanup.'),
    check: t('ApoA-I infüzyonu (CSL112, AEGIS-II, 18 bin hasta) MI sonrası olayları azaltmadı. ApoB/apoA-I oranı risk işaretidir, tedavi hedefi değildir.', 'ApoA-I infusion (CSL112, AEGIS-II, 18,000 patients) did not reduce events after MI. The apoB/apoA-I ratio is a risk marker, not a treatment target.') },
  { id: 'ratio', verdict: 'partial', sources: ['sniderman'],
    claim: t('Trigliserid/HDL oranı düşük olmalı.', 'The triglyceride/HDL ratio should be low.'),
    check: t('İnsülin direnci ve küçük yoğun LDL için kaba bir işarettir; kesin eşiği yoktur ve kılavuz hedefi değildir. Aynı bilgiyi ApoB daha doğrudan verir.', 'A rough marker of insulin resistance and small dense LDL; there is no firm cut-off and it is not a guideline target. ApoB gives the same information more directly.') },
  { id: 'total', verdict: 'partial', sources: ['guideline-2026'],
    claim: t('Diğerleri yerindeyse total kolesterol daha az önemlidir.', 'Total cholesterol is less relevant if the rest is in check.'),
    check: t('Total kolesterol risk hesaplayıcılarında kullanılır ve non-HDL-C = TC − HDL-C hesabına girer. Tek başına tedavi hedefi değildir.', 'Total cholesterol enters risk calculators and the non-HDL-C = TC − HDL-C calculation. It is not a treatment target on its own.') },
  { id: 'lifestyle', verdict: 'wrong', sources: ['eckel', 'ctt', 'brown'],
    claim: t('Lp(a) dışında hepsi basit diyet ve yaşam tarzıyla düzeltilebilir.', 'All except Lp(a) can be sorted with simple diet and lifestyle.'),
    check: t('Yaşam tarzı temeldir ve TG’yi belirgin düşürür, ama LDL-C’yi tipik olarak yalnız %10–15 düşürür. FH gibi genetik durumlar ve yüksek riskli hastalar ilaç gerektirir; LDL-C düşüşünün olay azaltımı randomize çalışmalarla kanıtlıdır.', 'Lifestyle is the foundation and clearly lowers TG, but typically lowers LDL-C only 10–15%. Genetic conditions such as FH and high-risk patients need drugs; event reduction from lowering LDL-C is proven in randomized trials.') }
];

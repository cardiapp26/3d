export const T = (tr, en) => ({ tr, en });
export const VASO_SOURCES = {
  ssc: { title: 'SSC 2026 · Adult sepsis / septic shock', url: 'https://sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines' },
  acc: { title: 'ACC 2025 · Cardiogenic shock, Table 2', url: 'https://www.jacc.org/doi/10.1016/j.jacc.2025.02.018' },
  angiotensin: { title: 'GIAPREZA · DailyMed prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=c265d69a-3efe-4107-9a9e-e6fd3d531c48' },
  phenylephrine: { title: 'Phenylephrine · DailyMed prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7a23ed28-3912-4398-b660-bf9ec3ee3926' },
  milrinone: { title: 'Milrinone · DailyMed prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=838da14b-c070-4c09-b088-99e7c64d9964' },
  metaraminol: { title: 'Metaraminol · UK SmPC', url: 'https://www.medicines.org.uk/emc/product/14774/smpc' },
  levosimendan: { title: 'Simdax · Ministry of Health product information', url: 'https://mohpublic.z6.web.core.windows.net/IsraelDrugs/Rishum_7_60769918.pdf' }
};
// Qualitative effects only. No dose-response function or patient recommendation.
const drug = (id, name, target, effects, context, risk, dose, sources) => ({ id, name, target, effects, context, risk, dose, sources });
export const VASO_DRUGS = [
  drug('norepinephrine', T('Noradrenalin', 'Norepinephrine'), 'α₁ / β₁', ['↑↑', '↑ / ↔', '↔ / ↑'],
    T('Septik şokta ilk seçenek. Hipotansif kardiyojenik şokta makul ilk vazopressör.', 'First-line in septic shock; reasonable initial pressor in hypotensive cardiogenic shock.'),
    T('Periferik iskemi, ekstravazasyon ve aritmi; damar yolu ve perfüzyon izlenir.', 'Ischemia, extravasation and arrhythmia; assess access and perfusion.'),
    T('ACC 2025 öğretim aralığı: 0,05–1 µg/kg/dk, IV infüzyon.', 'ACC 2025 teaching range: 0.05–1 µg/kg/min, IV infusion.'), ['ssc','acc']),
  drug('vasopressin', T('Vazopressin', 'Vasopressin'), 'V₁a', ['↑↑', '↔ / ↓', '↔'],
    T('Septik şokta noradrenalin gereksinimi artarken ek ajan; katekolamin dışı yol.', 'Adjunct as norepinephrine requirement rises in septic shock; non-catecholamine pathway.'),
    T('Dijital/mezenterik iskemi; doğrudan inotrop değildir.', 'Digital/mesenteric ischemia; no direct inotropic action.'),
    T('ACC: 0,01–0,04 U/dk, IV. Görseldeki 0,03 U/dk bu aralıkta; kg başına değildir.', 'ACC: 0.01–0.04 U/min, IV. Image’s 0.03 U/min lies within this range; not weight-based.'), ['ssc','acc']),
  drug('dobutamine', T('Dobutamin', 'Dobutamine'), 'β₁ / β₂', ['↓ / ↔', '↑↑', '↑'],
    T('Yeterli volüm ve basınca rağmen kardiyak disfonksiyonla süren hipoperfüzyonda düşünülür; hipotansiyonda basınç desteği gerekebilir.', 'Consider for cardiac dysfunction with persistent hypoperfusion after adequate volume and pressure; may require pressure support.'),
    T('Taşikardi, aritmi, hipotansiyon ve miyokard O₂ talebinde artış.', 'Tachycardia, arrhythmia, hypotension and increased myocardial O₂ demand.'),
    T('ACC kardiyojenik şok tablosu: 2–10 µg/kg/dk, IV; evrensel doz sınırı değildir.', 'ACC cardiogenic shock table: 2–10 µg/kg/min, IV; not a universal dose limit.'), ['ssc','acc']),
  drug('milrinone', T('Milrinon', 'Milrinone'), 'PDE-3', ['↓↓', '↑↑', '↔ / ↑'],
    T('Seçilmiş düşük debili profilde inodilatör; basınç ve böbrek işlevi önemlidir.', 'Inodilator for selected low-output profiles; pressure and renal function matter.'),
    T('Böbrek yetersizliğinde birikim, hipotansiyon ve aritmi. Dobutamine kanıtlanmış sağkalım üstünlüğü yok.', 'Renal accumulation, hypotension and arrhythmia. No established survival advantage over dobutamine.'),
    T('ACC: 0,125–0,5 µg/kg/dk; ürün bilgisi idame: 0,375–0,75 µg/kg/dk. Böbrek işlevine göre azaltılır; bağlamlar aynı değildir.', 'ACC: 0.125–0.5 µg/kg/min; label maintenance: 0.375–0.75 µg/kg/min. Reduce for renal impairment; contexts differ.'), ['acc','milrinone']),
  drug('epinephrine', T('Adrenalin', 'Epinephrine'), 'α₁ / β₁ / β₂', ['↑', '↑↑', '↑↑'],
    T('Septik şokta noradrenalin + vazopressine rağmen düşük MAP için ek seçenek; kardiyak disfonksiyonda alternatif. Kardiyak arrest algoritması ayrı.', 'Additional option after norepinephrine plus vasopressin in septic shock; alternative with cardiac dysfunction. Arrest algorithm is separate.'),
    T('Taşiaritmi ve laktat artışı; laktat yükselmesi tek başına kötüleşen perfüzyon demek değildir.', 'Tachyarrhythmia and lactate rise; lactate alone need not indicate worsening perfusion.'),
    T('ACC: 0,01–0,5 µg/kg/dk, IV infüzyon; arrest bolusu değildir.', 'ACC: 0.01–0.5 µg/kg/min, IV infusion; not an arrest bolus.'), ['ssc','acc']),
  drug('phenylephrine', T('Fenilefrin', 'Phenylephrine'), 'α₁', ['↑↑', '↔ / ↓', '↔ / ↓'],
    T('Seçilmiş vazodilatasyonda saf α etkisi. Taşiaritmide otomatik tercih değildir; düşük debili kardiyojenik şokta ilk tek ajan olarak kaçınılır.', 'Pure α effect in selected vasodilation. Not an automatic tachyarrhythmia choice; avoid as sole initial agent in low-output cardiogenic shock.'),
    T('Refleks bradikardi ve debi düşüşü; artan ard yükü değerlendir.', 'Reflex bradycardia and reduced output; assess rising afterload.'),
    T('ABD ürün bilgisi, vazodilatör şok: 0,5–6 µg/kg/dk, IV. Perioperatif doz farklıdır.', 'US label, vasodilatory shock: 0.5–6 µg/kg/min, IV. Perioperative dosing differs.'), ['acc','phenylephrine']),
  drug('dopamine', T('Dopamin', 'Dopamine'), 'D₁ / β₁ / α₁', ['Doza bağlı / dose-dependent', '↑', '↑↑'],
    T('Seçilmiş bradikardik bağlam; septik şokta rutin ilk seçenek değil. Düşük doz renal koruma sağlamaz.', 'Selected bradycardic contexts; not routine first-line septic shock treatment. Low dose does not provide renal protection.'),
    T('Taşiaritmi riski; norepinefrine rutin alternatif değildir.', 'Tachyarrhythmia risk; not a routine norepinephrine substitute.'),
    T('ACC: 2–5 / 5–10 / 10–20 µg/kg/dk; reseptör etkileri örtüşür, kesin basamak sınırları değildir.', 'ACC: 2–5 / 5–10 / 10–20 µg/kg/min; receptor effects overlap, not sharp boundaries.'), ['acc','ssc']),
  drug('angiotensin', T('Anjiyotensin II', 'Angiotensin II'), 'AT₁', ['↑↑', 'Değişken / variable', '↔'],
    T('Refrakter vazodilatör şokta seçilmiş ek ajan; standart ilk seçenek değildir.', 'Selected adjunct in refractory vasodilatory shock; not standard first-line.'),
    T('Arteriyel/venöz tromboz; ürün bilgisi eşzamanlı VTE profilaksisi ister.', 'Arterial/venous thrombosis; label calls for concurrent VTE prophylaxis.'),
    T('GIAPREZA: başlangıç 20 ng/kg/dk; ilk 3 saat en çok 80, idame en çok 40 ng/kg/dk. ng, µg değildir.', 'GIAPREZA: start 20 ng/kg/min; first 3 hours maximum 80, maintenance maximum 40 ng/kg/min. ng is not µg.'), ['angiotensin','ssc']),
  drug('levosimendan', T('Levosimendan', 'Levosimendan'), 'Troponin C / KATP', ['↓', '↑', '↔ / ↑'],
    T('Seçilmiş akut kalp yetersizliği bağlamı; septik şokta SSC 2026 kullanımına karşı önerir. Bulunabilirlik/ruhsat ülkeye bağlı.', 'Selected acute heart-failure contexts; SSC 2026 suggests against use in septic shock. Availability/licensing varies by country.'),
    T('Hipotansiyon, aritmi, uzun etkili metabolit; ağır renal/hepatik bozukluk ürün kısıtlarını kontrol et.', 'Hypotension, arrhythmia, prolonged metabolite action; check severe renal/hepatic restrictions.'),
    T('Ürün bilgisi idame: 0,05–0,2 µg/kg/dk, IV. Yükleme ve süre ayrı ürün protokolüdür.', 'Label maintenance: 0.05–0.2 µg/kg/min, IV. Loading and duration follow separate product protocol.'), ['levosimendan','ssc']),
  drug('metaraminol', T('Metaraminol', 'Metaraminol'), 'α ağırlıklı / α dominant', ['↑', 'Değişken / variable', '↔ / ↓'],
    T('Seçilmiş akut vazomotor hipotansiyon, örneğin anestezi; septik şokta noradrenalinin standart yerine geçmez.', 'Selected acute vasomotor hypotension, e.g. anesthesia; not a standard replacement for norepinephrine in septic shock.'),
    T('Hipertansiyon, refleks bradikardi, iskemi; hazırlama hatası riski.', 'Hypertension, reflex bradycardia, ischemia; preparation errors.'),
    T('Bu kartta evrensel infüzyon hızı verilmez. UK SmPC konsantrasyon ve klinik titrasyon tarif eder; ürüne özgü bilgi bağlantıda.', 'No universal infusion rate given here. UK SmPC specifies preparation and clinical titration; product details linked.'), ['metaraminol'])
];
export const VASO_SCENARIOS = [
  { id:'septic', name:T('Septik', 'Septic'), detail:T('Vazodilatasyon; erken sıcak görünüm olabilir. Antibiyotik ve kaynak kontrolü eşzamanlıdır.', 'Vasodilation; may appear warm early. Antimicrobials and source control proceed together.'), cause:T('Enfeksiyon kaynağı + bireyselleştirilmiş sıvı yanıtı', 'Infection source + individualized fluid responsiveness') },
  { id:'cardiogenic', name:T('Kardiyojenik', 'Cardiogenic'), detail:T('Düşük debi; konjesyon/LV veya RV disfonksiyonunu ayır. Rutin sıvı yüklemesi uygun olmayabilir.', 'Low output; distinguish congestion and LV/RV dysfunction. Routine fluid loading may be inappropriate.'), cause:T('İskemi/kapak/ritim nedeni + şok ekibi; refrakter ise seçilmiş mekanik destek', 'Ischemic/valvular/rhythm cause + shock team; selected mechanical support if refractory') },
  { id:'hypovolemic', name:T('Hipovolemik', 'Hypovolemic'), detail:T('Hacim kaybını ve kanamayı düzelt. Vazopressör hacim replasmanının yerine geçmez.', 'Correct volume loss and hemorrhage. Pressors do not replace volume restoration.'), cause:T('Kanama kontrolü + uygun kan/sıvı replasmanı', 'Hemorrhage control + appropriate blood/fluid replacement') },
  { id:'obstructive', name:T('Obstrüktif', 'Obstructive'), detail:T('PE, tamponad veya tansiyon pnömotoraks. İlaç desteği tıkanıklığı gidermez.', 'PE, tamponade or tension pneumothorax. Drug support does not remove obstruction.'), cause:T('Nedene özgü reperfüzyon / drenaj / dekompresyon', 'Cause-specific reperfusion / drainage / decompression') },
  { id:'mixed', name:T('Karma', 'Mixed'), detail:T('Vazopleji ve pompa yetersizliği birlikte olabilir; tek soğuk/sıcak bulguyla tanı konmaz.', 'Vasoplegia and pump failure may coexist; warm/cold findings alone do not diagnose the cause.'), cause:T('Tekrarlayan POCUS + hemodinamik ve perfüzyon değerlendirmesi', 'Repeat POCUS + hemodynamic and perfusion assessment') }
];
export function vasoPath({ profile = 'pressure', scenario = 'septic', escalating = false } = {}) {
  if (!['pressure','output','both'].includes(profile) || !VASO_SCENARIOS.some(x=>x.id===scenario)) throw new RangeError('Unknown vasoactive teaching profile');
  if (scenario === 'hypovolemic' || scenario === 'obstructive') return { agents:['norepinephrine'], kind:'cause', adjunct:[] };
  const agents = profile === 'output' ? ['dobutamine'] : profile === 'both' ? ['norepinephrine','dobutamine'] : ['norepinephrine'];
  const adjunct = scenario === 'septic' && escalating && profile !== 'output' ? ['vasopressin'] : [];
  return { agents, adjunct, kind:profile };
}

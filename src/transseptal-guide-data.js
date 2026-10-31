// Content of the transseptal guide panel (transseptal-guide.js): equipment,
// the procedure step by step, LA confirmation, site choice by procedure,
// troubleshooting, complications, history and a knowledge check. Bilingual
// TR/EN; every card names its sources (keys of TS_SOURCES).

const w = (tr, en) => Object.freeze({ tr, en });

export const TS_SOURCES = Object.freeze({
  ehra: { short: 'Deisenhofer 2026', cite: 'Deisenhofer I, et al. EHRA/EAPCI clinical consensus statement on transseptal puncture. Europace 2026;28:euag021.' },
  pcr: { short: 'Ducrocq, PCR-EAPCI', cite: 'Ducrocq G, et al. Transseptal puncture. PCR-EAPCI Textbook of Percutaneous Interventional Cardiovascular Medicine.' },
  earley: { short: 'Earley 2009', cite: 'Earley MJ. How to perform a transseptal puncture. Heart 2009;95:85-92.' },
  ross: { short: 'Ross 1959', cite: 'Ross J Jr, Braunwald E, Morrow AG. Transseptal left atrial puncture: new technique for the measurement of left atrial pressure in man. Am J Cardiol 1959;3:653-655.' },
  brock: { short: 'Brockenbrough 1962', cite: 'Brockenbrough EC, Braunwald E, Ross J Jr. Transseptal left heart catheterization: a review of 450 studies and description of an improved technic. Circulation 1962;25:15-21.' },
  mullins: { short: 'Mullins 1983', cite: 'Mullins CE. Transseptal left heart catheterization: experience with a new technique in 520 pediatric and adult patients. Pediatr Cardiol 1983;4:239-245.' },
  academy: { short: 'Medtronic Academy', cite: 'Medtronic Academy, e-Learning Transseptal Access (general learning resource; no material reproduced).' }
});

export const TS_GUIDE_TABS = Object.freeze([
  { id: 'equipment', label: w('Ekipman', 'Equipment') },
  { id: 'steps', label: w('Adım adım', 'Step by step') },
  { id: 'confirm', label: w('LA doğrulama', 'LA confirmation') },
  { id: 'sites', label: w('Bölge seçimi', 'Site choice') },
  { id: 'trouble', label: w('Zor olgu', 'Difficult cases') },
  { id: 'complications', label: w('Komplikasyon', 'Complications') },
  { id: 'history', label: w('Tarihçe', 'History') },
  { id: 'quiz', label: w('Bilgi testi', 'Knowledge check') }
]);

export const TS_GUIDE_WORDS = Object.freeze({
  tr: {
    kicker: 'TRANSSEPTAL REHBER', title: 'Fossa ovalisten sol atriyuma', intro: 'Ekipman, adımlar, doğrulama ve güvenlik: her sekme 3B ders adımlarıyla birlikte çalışır.',
    tabs: 'Rehber bölümleri', sources: 'Kaynaklar', show3d: '3B adımda göster', schematic: 'Şematik çizim; ölçekli değildir.',
    pullback: 'SVC\'den geri çekme', view: 'Projeksiyon', lao: 'LAO 40°', rao: 'RAO 30°', jump: 'Sıçrama', tent: 'Çadır (tenting)', prev: 'Önceki', next: 'Sonraki', stepOf: 'Adım',
    needle: 'İğne ucu', stylet: 'Stile', clock: 'İğne oku yönü (proksimalden bakış)', clockHint: 'Okun yönünü seçin',
    signsPick: 'Gördüğünüz bulguları işaretleyin', advanceOk: 'Dilatatör ilerletilebilir', advanceNo: 'Henüz ilerletmeyin',
    showSites3d: '3B fossada göster', quizScore: 'Puan', quizRetry: 'Baştan başla', correct: 'Doğru', wrong: 'Yanlış', posterior: 'posterior', anterior: 'anterior', superior: 'üst', inferior: 'alt',
    incidence: 'Sıklık', mechanism: 'Mekanizma', prevent: 'Önleme', manage: 'Yönetim', problem: 'Sorun', action: 'Ne yapılır'
  },
  en: {
    kicker: 'TRANSSEPTAL GUIDE', title: 'From the fossa ovalis to the left atrium', intro: 'Equipment, steps, confirmation and safety: each tab works together with the 3D lesson steps.',
    tabs: 'Guide sections', sources: 'Sources', show3d: 'Show in the 3D step', schematic: 'Schematic drawing; not to scale.',
    pullback: 'Pullback from the SVC', view: 'Projection', lao: 'LAO 40°', rao: 'RAO 30°', jump: 'Jump', tent: 'Tenting', prev: 'Previous', next: 'Next', stepOf: 'Step',
    needle: 'Needle tip', stylet: 'Stylet', clock: 'Needle arrow direction (viewed from the hub)', clockHint: 'Pick the arrow direction',
    signsPick: 'Tick the signs you see', advanceOk: 'The dilator may be advanced', advanceNo: 'Do not advance yet',
    showSites3d: 'Show on the 3D fossa', quizScore: 'Score', quizRetry: 'Start again', correct: 'Correct', wrong: 'Wrong', posterior: 'posterior', anterior: 'anterior', superior: 'superior', inferior: 'inferior',
    incidence: 'Incidence', mechanism: 'Mechanism', prevent: 'Prevention', manage: 'Management', problem: 'Problem', action: 'What to do'
  }
});

/* ---------- Equipment ---------- */
// Parts of the assembly drawn in transseptal-guide-figures.js (ids match the SVG hotspots).
export const TS_EQUIPMENT = Object.freeze([
  {
    id: 'sheath', name: w('Transseptal kılıf', 'Transseptal sheath'),
    text: w('Uzun, önceden şekillendirilmiş (sabit kıvrımlı) veya yönlendirilebilir kılıf. Yan kolu kıvrımın yönünü gösterir; geri çekme boyunca yan kol iğne okuyla aynı yöne (saat 4–5) bakar. Sık kullanılan boy 63 cm; uzun boylu hastada daha uzun kılıf ve iğne gerekir.',
      'A long pre-shaped (fixed-curve) or steerable sheath. Its sidearm shows the direction of the curve; during the pullback the sidearm faces the same way as the needle arrow (4–5 o\'clock). A common length is 63 cm; tall patients need a longer sheath and needle.'),
    sources: ['earley', 'ehra', 'academy']
  },
  {
    id: 'dilator', name: w('Dilatatör', 'Dilator'),
    text: w('Kılıfın içine kilitlenir ve ucu kılıftan birkaç santimetre taşar (sık kullanılan boy 67 cm). Septumu iğneden sonra genişleten konik uçtur; LA\'ya iğnenin üzerinden ilerletilir. Kullanmadan önce kılıf ve dilatatör salinle yıkanır.',
      'Locks inside the sheath with its tip a few centimetres beyond it (a common length is 67 cm). Its tapered tip enlarges the hole after the needle and is advanced into the LA over the needle. Flush sheath and dilator with saline before use.'),
    sources: ['earley', 'academy']
  },
  {
    id: 'needle', name: w('Brockenbrough (BRK) iğnesi', 'Brockenbrough (BRK) needle'),
    text: w('Distal ucu incelen kıvrımlı iğne (sık kullanılan boy 71 cm; 89 ve 98 cm uzun seçenekler). Standart BRK kıvrımı yaklaşık 19°, BRK-1 yaklaşık 53°\'dir: geniş RA veya büyük LA\'da daha kıvrımlı iğne fossaya daha kolay oturur. Göbekteki ok iğne ucunun yönünü gösterir; göbek basınç hattına veya kontrast şırıngasına bağlanır. Kalın septumda RF iğne düşünülür.',
      'A curved needle with a tapered distal end (a common length is 71 cm; 89 and 98 cm long versions exist). The standard BRK curve is about 19°, the BRK-1 about 53°: in a wide RA or a large LA a more curved needle engages the fossa more easily. The hub arrow shows where the tip points; the hub connects to a pressure line or a contrast syringe. Consider an RF needle for a thick septum.'),
    sources: ['ehra', 'earley', 'academy']
  },
  {
    id: 'stylet', name: w('Stile', 'Stylet'),
    text: w('İğnenin lümenini dolduran tel. İğne kılıfa ve dilatatöre her zaman stile içindeyken sokulur: keskin uç dilatatörün iç duvarını kazıyıp plastik parçacık koparmasın diye. Dilatatör ucuna gelince stile çıkarılır, iğne aspire edilip yıkanır.',
      'A wire that fills the needle lumen. The needle always enters the sheath and dilator with the stylet inside, so that its sharp tip does not scrape the dilator wall and shear off plastic. At the dilator tip the stylet is removed and the needle is aspirated and flushed.'),
    sources: ['earley', 'academy']
  },
  {
    id: 'wire', name: w('Kılavuz tel', 'Guidewire'),
    text: w('150–200 cm, 0,032 veya 0,035 inç, yumuşak J uçlu tel; çapı dilatatörün iç lümenine göre seçilir. Önce sistemi SVC\'ye taşır, septum geçildikten sonra sol üst pulmoner vene konur. Tel ucunun kalp gölgesinin dışına çıktığını görmek LA içinde olduğunuzu doğrular.',
      'A 150–200 cm, 0.032 or 0.035 inch wire with a soft J tip; the diameter matches the dilator lumen. It first carries the system to the SVC and, after the crossing, goes into the left superior pulmonary vein. Seeing its tip beyond the cardiac silhouette confirms you are in the LA.'),
    sources: ['earley', 'academy']
  }
]);

/** Needle tip relative to the dilator tip, in mm (negative = inside the dilator). */
export const TS_NEEDLE_POSITIONS = Object.freeze([
  { id: 'stylet', mm: -20, label: w('Stile içinde, ucun 2 cm gerisinde', 'Stylet in, 2 cm behind the tip'), note: w('Kılıf içinde ilerlerken: dilatatör korunur.', 'While advancing in the sheath: the dilator is protected.'), safe: true },
  { id: 'gap', mm: -5, label: w('İki parmak aralığı: uç dilatatörün hemen içinde', 'Two-finger gap: tip just inside the dilator'), note: w('Geri çekme ve konumlandırma sırasında: iğne dışarı taşmaz ama dilatatörü destekler.', 'During pullback and positioning: the needle does not protrude yet supports the dilator.'), safe: true },
  { id: 'out', mm: 8, label: w('İğne dışarıda', 'Needle out'), note: w('Yalnız iki projeksiyonda doğrulanmış çadırda, ponksiyon anında.', 'Only at the moment of puncture, on a tent confirmed in two views.'), safe: false }
]);

/** Needle arrow clock positions (viewed from the hub, 12 = anterior, 6 = posterior). */
export function clockVerdict(hour) {
  const h = ((Math.round(hour * 2) / 2) % 12 + 12) % 12 || 12;
  if (h >= 4 && h <= 5.5) return 'ok';
  if (h === 3 || h === 3.5) return 'across';
  if (h === 6) return 'large-la';
  if (h > 6 && h < 12) return 'wrong';
  return 'anterior';
}
export const TS_CLOCK_TEXT = Object.freeze({
  ok: w('Saat 4–5:30: iğne posteriora ve sola, septuma dik bakar. Standart geri çekme yönü.', '4–5:30 o\'clock: the needle points posteriorly and leftward, perpendicular to the septum. The standard pullback direction.'),
  across: w('Saat 3: septum geçildikten sonra kılıf bu yöne çevrilir; LA\'nın arka duvarından uzaklaşır. Geri çekmede fossaya yeterince değmez.', '3 o\'clock: the sheath is turned here after the crossing, away from the LA posterior wall. During the pullback it does not engage the fossa well.'),
  'large-la': w('Saat 6: büyük LA\'da kullanılabilir; ancak arka duvar ve interatriyal reçese yaklaşır. Saat yönü çevirme posteriora götürür.', '6 o\'clock: may be used in a large LA but nears the posterior wall and the interatrial recess. Clockwise rotation moves posteriorly.'),
  anterior: w('Saat 12–2:30: anterior. İğne aort köküne (nonkoroner sinüs) yönelir. Saat yönünde çevirerek posteriora alın.', '12–2:30 o\'clock: anterior. The needle heads for the aortic root (non-coronary sinus). Rotate clockwise to go posterior.'),
  wrong: w('Saat 6:30–11:30: iğne RA serbest duvarına veya sağa bakar; septumdan uzaklaşır. Yeniden yönlendirin.', '6:30–11:30 o\'clock: the needle faces the RA free wall or rightward, away from the septum. Reorient.')
});

/* ---------- Procedure steps ---------- */
// `stage` drives the fluoroscopy schematic; `lesson` is the 3D lesson step index (content.js).
export const TS_PROCEDURE = Object.freeze([
  {
    stage: 'prep', lesson: 0,
    title: w('Hazırlık', 'Preparation'),
    text: w('Stile çıkarılır, iğne yıkanır, stile geri takılır. Kılıf ve dilatatör yıkanır, dilatatör kılıfa kilitlenir. Ponksiyondan önce en az TTE ile LA/LAA trombüsü ve septum değerlendirilir; işlem TEE veya ICE eşliğinde daha güvenlidir.',
      'Remove the stylet, flush the needle, reinsert the stylet. Flush sheath and dilator and lock the dilator in the sheath. Before the puncture at least a TTE checks for LA/LAA thrombus and the septum; TEE or ICE guidance makes the procedure safer.'),
    pearl: w('İğne hiçbir zaman stilesiz kılıfa sokulmaz.', 'Never insert the needle into the sheath without its stylet.'),
    sources: ['ehra', 'academy']
  },
  {
    stage: 'svc', lesson: 0,
    title: w('Tel ve kılıf SVC\'ye', 'Wire and sheath to the SVC'),
    text: w('Sağ femoral venden (ultrason eşliğinde) J tel SVC\'ye konur; kılıf ve dilatatör telin üzerinden SVC\'ye ilerletilir. Tel çıkarılır; dilatatör aspire edilip yıkanır (hava ve pıhtı kalmasın).',
      'From the right femoral vein (ultrasound guided) a J wire is placed in the SVC; the sheath and dilator follow it into the SVC. The wire is removed and the dilator aspirated and flushed (no air, no clot).'),
    pearl: w('Uzlaşı: ultrason eşliğinde venöz giriş komplikasyonu azaltır.', 'Consensus: ultrasound-guided venous access reduces complications.'),
    sources: ['ehra', 'earley']
  },
  {
    stage: 'needle', lesson: 0,
    title: w('İğne dilatatör ucuna', 'Needle to the dilator tip'),
    text: w('İğne stileyle birlikte floroskopi altında dilatatör ucunun hemen gerisine kadar ilerletilir. Dilatatör göbeği ile iğne oku arasında iki parmak aralık bırakılır. Stile çıkarılır, iğne aspire edilip yıkanır, basınç hattı veya kontrast şırıngası bağlanır.',
      'The needle with its stylet is advanced under fluoroscopy until just short of the dilator tip. Keep a two-finger gap between the dilator hub and the needle arrow. Remove the stylet, aspirate and flush the needle, connect a pressure line or contrast syringe.'),
    pearl: w('İki parmak aralığı: iğne taşmaz, dilatatör desteklenir.', 'Two-finger gap: no protrusion, the dilator stays supported.'),
    sources: ['earley', 'academy']
  },
  {
    stage: 'orient', lesson: 1,
    title: w('Yönlendirme: saat 4–5', 'Orientation: 4–5 o\'clock'),
    text: w('Geri çekmeden önce iğne oku ve kılıf yan kolu birlikte saat 4–5 yönüne (posterior septum) çevrilir. Büyük LA\'da saat 6\'ya kadar dönülebilir.',
      'Before the pullback the needle arrow and the sheath sidearm are turned together to 4–5 o\'clock (posterior septum). In a large LA up to 6 o\'clock.'),
    pearl: w('Ok ve yan kol hep birlikte döner; ayrışırsa iğne kılıf içinde dönmüştür.', 'Arrow and sidearm turn together; if they part, the needle has rotated inside the sheath.'),
    sources: ['earley', 'academy']
  },
  {
    stage: 'jump1', lesson: 1,
    title: w('Geri çekme: ilk sıçrama', 'Pullback: first jump'),
    text: w('Sistem iğne-dilatatör mesafesi korunarak yavaşça aşağı çekilir. İlk sıçrama SVC-RA bileşkesinde, uç aort çıkıntısının altına inerken görülür. Sıçramalar LAO\'da daha iyi seçilir.',
      'The assembly is pulled down slowly, keeping the needle-dilator distance. The first jump comes at the SVC-RA junction as the tip drops below the aortic bulge. The jumps are seen best in LAO.'),
    pearl: w('Kaydırıcıyla geri çekin ve sıçramaları izleyin.', 'Pull back with the slider and watch for the jumps.'),
    sources: ['earley', 'academy']
  },
  {
    stage: 'fossa', lesson: 1,
    title: w('İkinci sıçrama: fossaya düşüş ve çadır', 'Second jump: into the fossa, tenting'),
    text: w('İkinci sıçrama ucun limbusun üst kas kenarının altından fossa ovalise düşmesidir (normal kalplerin çoğunda hissedilir). Sistem hafifçe ileri itilerek fossada tutulur ve membran çadırlaştırılır (TEE/ICE\'de tenting).',
      'The second jump is the tip dropping under the superior muscular rim of the limbus into the fossa ovalis (felt in most normal hearts). Push slightly forward to hold it there and tent the membrane (tenting on TEE/ICE).'),
    pearl: w('Konum şüpheliyse: iğneyi çıkar, teli koy, SVC\'ye dön, baştan geri çek.', 'If unsure: needle out, wire in, back to the SVC, pull back again.'),
    sources: ['pcr', 'earley', 'academy']
  },
  {
    stage: 'confirm', lesson: 1,
    title: w('İki projeksiyonda doğrula', 'Confirm in two views'),
    text: w('RAO 30°: uç CS kateterinin (ve aort pigtailinin) posteriorunda, omurganın anteriorunda; yaklaşık ikisinin ortası. Saat yönü çevirme posteriora, tersi anteriora götürür. LAO 40°: uç posteriora ve sola, septuma dik bakar; kontrast veya ICE ile çadır görülür. Echo: bikaval görüntü üst-alt, kısa eksen ön-arka konumu verir.',
      'RAO 30°: tip posterior to the CS catheter (and the aortic pigtail), anterior to the spine; roughly midway. Clockwise rotation moves posteriorly, counterclockwise anteriorly. LAO 40°: the tip points posteriorly and leftward, perpendicular to the septum; contrast or ICE shows the tent. Echo: the bicaval view gives superior-inferior, the short axis anterior-posterior position.'),
    pearl: w('Tek projeksiyon yetmez: LAO yükseklik ve dikliği, RAO ön-arka konumu gösterir.', 'One view is not enough: LAO shows height and perpendicularity, RAO the anterior-posterior position.'),
    sources: ['ehra', 'pcr', 'academy']
  },
  {
    stage: 'puncture', lesson: 2,
    title: w('Ponksiyon', 'Puncture'),
    text: w('Önce yalnız iğne, sürekli floroskopi altında kontrollü itilir. Geçişte "boşalma" hissi ve çadırın birden kaybolması beklenir. Dirençli septumda kuvvet biriktirmeyin: tüm sistem karşı duvara fırlayabilir; keskin iğne veya RF düşünün.',
      'Push the needle alone, controlled, under continuous fluoroscopy. Expect a "give" and sudden loss of the tent on crossing. Do not store force on a resistant septum: the whole system can lunge into the far wall; consider a sharper needle or RF.'),
    pearl: w('İğne ucu LA\'da doğrulanmadan dilatatör ilerletilmez.', 'Do not advance the dilator until the needle tip is proven in the LA.'),
    sources: ['ehra', 'pcr']
  },
  {
    stage: 'cross', lesson: 2,
    title: w('LA\'yı doğrula, dilatatörü geçir', 'Confirm the LA, cross with the dilator'),
    text: w('LA basınç eğrisi, oksijenli kan (satürasyon), LA\'da kalan kontrast veya ICE\'de LA içinde iğne: en az iki bağımsız bulgu. Sonra dilatatör ucu iğnenin üzerinden LA\'ya ilerletilir. Heparin uygulanır; AF işlemlerinde ACT > 300 sn hedeflenir.',
      'LA pressure trace, oxygenated blood (saturation), contrast staying in the LA, or the needle in the LA on ICE: at least two independent signs. Then the dilator tip is advanced over the needle into the LA. Give heparin; in AF procedures aim for ACT > 300 s.'),
    pearl: w('Ayrıntı için "LA doğrulama" sekmesi.', 'See the "LA confirmation" tab.'),
    sources: ['ehra', 'earley']
  },
  {
    stage: 'exchange', lesson: 2,
    title: w('Kılıfı LA\'ya taşı', 'Bring the sheath into the LA'),
    text: w('Seçenek 1: iğne çıkarılır, tel LSPV\'ye konur ve kalp gölgesi dışında görülür; kılıf tel üzerinden ilerletilir. Seçenek 2: iğne dilatatörde kalır; kılıf dilatatörden ayrılıp onun üzerinden LA\'ya kaydırılır. Ardından dilatatör ve tel/iğne yavaşça çekilir, kılıf aspire edilip yıkanır; geçince kılıf saat 3\'e çevrilir.',
      'Option 1: remove the needle, place the wire in the LSPV and see it beyond the heart border; advance the sheath over the wire. Option 2: the needle stays in the dilator; the sheath is unlocked and slid over it into the LA. Then withdraw dilator and wire/needle slowly, aspirate and flush the sheath; once across turn the sheath to 3 o\'clock.'),
    pearl: w('Yavaş çekme ve aspirasyon: hava embolisinin başlıca önlemi.', 'Slow withdrawal and aspiration: the main guard against air embolism.'),
    sources: ['earley', 'academy']
  }
]);

/* ---------- LA confirmation ---------- */
// `objective`: a measurement or image of the needle/wire beyond doubt; tactile and visual feel alone are not.
export const TS_LA_SIGNS = Object.freeze([
  { id: 'pressure', objective: true, text: w('İğneden LA basınç eğrisi (a ve v dalgaları)', 'LA pressure waveform from the needle (a and v waves)') },
  { id: 'sat', objective: true, text: w('Aspire edilen kan oksijenli (satürasyon arteriyel düzeyde)', 'Aspirated blood is oxygenated (arterial saturation)') },
  { id: 'contrast', objective: true, text: w('Kontrast LA\'da dağılır, septumda leke kalmaz', 'Contrast swirls in the LA, no stain left in the septum') },
  { id: 'wire', objective: true, text: w('Tel sol pulmoner vende, kalp gölgesinin dışında', 'Wire in a left pulmonary vein, beyond the cardiac silhouette') },
  { id: 'ice', objective: true, text: w('ICE/TEE\'de iğne veya salin baloncukları LA içinde', 'Needle or saline bubbles inside the LA on ICE/TEE') },
  { id: 'tent', objective: false, text: w('Çadırın birden kaybolması', 'Sudden collapse of the tent') },
  { id: 'give', objective: false, text: w('Elde "boşalma" hissi', 'A "give" felt in the hand') },
  { id: 'pericardial', objective: false, trap: true, text: w('Kontrast kalp kenarında katmanlanır, temizlenmez', 'Contrast layers along the heart border and does not clear') },
  { id: 'aortic', objective: false, trap: true, text: w('Basınç eğrisi arteriyel, sistolik 120 mmHg civarı', 'Arterial pressure trace, systolic around 120 mmHg') }
]);

/** Verdict for a set of ticked sign ids: alarm signs first, then at least two signs with one objective. */
export function laVerdict(ids) {
  const picked = TS_LA_SIGNS.filter(s => ids.includes(s.id));
  const trap = picked.find(s => s.trap);
  if (trap) return { ok: false, reason: trap.id };
  const real = picked.filter(s => !s.trap);
  if (real.length >= 2 && real.some(s => s.objective)) return { ok: true, reason: 'enough' };
  return { ok: false, reason: real.length ? 'more' : 'none' };
}
export const TS_LA_VERDICT_TEXT = Object.freeze({
  enough: w('Yeterli: en az iki bağımsız bulgu ve biri nesnel. Dilatatörü iğnenin üzerinden ilerletin.', 'Enough: at least two independent signs, one of them objective. Advance the dilator over the needle.'),
  more: w('Yetersiz: en az iki bağımsız bulgu gerekir ve biri basınç, satürasyon, kontrast, tel veya ekodan gelmelidir.', 'Not enough: at least two independent signs are needed and one must come from pressure, saturation, contrast, wire or echo.'),
  none: w('Bir bulgu seçin.', 'Pick a sign.'),
  pericardial: w('Alarm: perikardiyal boşlukta kontrast. İğne atriyum dışında; ilerletmeyin, iğneyi geri çekin, ekoyla efüzyonu izleyin.', 'Alarm: contrast in the pericardial space. The needle is outside the atria; do not advance, withdraw the needle, watch for effusion on echo.'),
  aortic: w('Alarm: aort basıncı. İğne aort kökünde; dilatatör veya kılıf ilerletilmez, yalnız iğne geri çekilir.', 'Alarm: aortic pressure. The needle is in the aortic root; never advance dilator or sheath, withdraw the needle alone.')
});

/* ---------- Site choice ---------- */
// Keys match TS_SITES (transseptal-sites.js) so the 2D map and the 3D rings agree.
export const TS_SITE_GUIDE = Object.freeze([
  {
    key: 'pvi', name: w('PVI / sol atriyal ablasyon', 'PVI / left atrial ablation'),
    where: w('Merkez, hafif alçak', 'Central, slightly low'),
    why: w('Dört pulmoner vene ve mitral istmusa eşit uzaklık; kılıf hem sağ alt hem sol pulmoner venlere kıvrılabilir.', 'Equal reach to all four pulmonary veins and the mitral isthmus; the sheath can curve to the right inferior as well as the left veins.'),
    sources: ['ehra']
  },
  {
    key: 'laac', name: w('LAA kapatma', 'LAA occlusion'),
    where: w('Posterior ve inferior', 'Posterior and inferior'),
    why: w('LAA septumun önünde ve yukarısında olduğundan alçak-arka giriş kılıfa apendiksin eksenine eş yönlü yaklaşım verir. Ters tavuk kanadı anatomisinde biraz daha anterior seçilir.', 'The LAA lies anterior and superior to the septum, so a low posterior entry gives a coaxial approach to its axis. In reverse chicken-wing anatomy go slightly more anterior.'),
    sources: ['ehra', 'pcr']
  },
  {
    key: 'mitral', name: w('Mitral girişim (TEER)', 'Mitral intervention (TEER)'),
    where: w('Posterior ve yüksek', 'Posterior and high'),
    why: w('Cihazın LA içinde manevra yapacak yüksekliğe ihtiyacı vardır: dört boşluk görüntüde çadır ucu mitral koaptasyonun yaklaşık 3,5–4 cm üzerinde olmalıdır.', 'The device needs height in the LA to steer: on the four-chamber view the tent should sit about 3.5–4 cm above the mitral coaptation.'),
    sources: ['ehra', 'pcr']
  },
  {
    key: 'lv', name: w('Sol ventrikül ablasyonu', 'Left ventricular ablation'),
    where: w('Anterior, alçak-orta', 'Anterior, low to mid'),
    why: w('Mitral kapağa daha kısa ve doğrudan bir yol; kateter LV\'ye daha az açıyla girer.', 'A shorter, more direct route to the mitral valve; the catheter enters the LV with less angulation.'),
    sources: ['ehra']
  },
  {
    key: 'pfo', name: w('PFO', 'PFO'),
    where: w('Üst ve anterior', 'Superior and anterior'),
    why: w('Açık foramen ovale fossanın üst-ön kenarındaki tüneldir. Tünelden geçiş kolaydır ama kılıfı yüksek ve öne koyar; çoğu işlemde ayrı bir ponksiyon daha iyidir.', 'A patent foramen ovale is the tunnel at the superior-anterior rim of the fossa. Crossing it is easy but places the sheath high and anterior; for most procedures a separate puncture is better.'),
    sources: ['ehra', 'pcr']
  }
]);

/* ---------- Difficult cases ---------- */
export const TS_TROUBLE = Object.freeze([
  { problem: w('Fossa bulunamıyor, konum belirsiz', 'Cannot find the fossa, position unclear'), action: w('SVC\'ye dönüp geri çekmeyi tekrarlayın; iki projeksiyonda doğrulayın. TEE veya ICE ekleyin.', 'Go back to the SVC and repeat the pullback; confirm in two views. Add TEE or ICE.'), sources: ['academy', 'ehra'] },
  { problem: w('Uzun boylu hasta', 'Tall patient'), action: w('Daha uzun iğne ve kılıf (ör. 89–98 cm iğne, uygun uzun kılıf).', 'Longer needle and sheath (e.g. an 89–98 cm needle with a matching long sheath).'), sources: ['ehra', 'academy'] },
  { problem: w('Geniş RA veya büyük LA', 'Wide RA or large LA'), action: w('Daha kıvrımlı iğne (BRK-1) veya kıvrımı artırılmış iğne; yönlendirilebilir kılıf. Fossa büyük LA\'da aşağı kayar.', 'A more curved needle (BRK-1) or added curve; a steerable sheath. The fossa moves down in a large LA.'), sources: ['ehra', 'earley'] },
  { problem: w('Solunumla aşırı hareket', 'Excessive respiratory motion'), action: w('Genel anestezi veya nefes tutma; ponksiyonu solunum duraklamasında yapın.', 'General anaesthesia or breath hold; puncture in the respiratory pause.'), sources: ['academy'] },
  { problem: w('İğne itildikçe yukarı kayıyor', 'Needle slides cranially when pushed'), action: w('Kıvrımı artırın, daha keskin iğne veya RF kullanın; daha alçak ve posterior bir nokta seçin.', 'Increase the curve, use a sharper needle or RF; pick a lower, more posterior point.'), sources: ['academy', 'ehra'] },
  { problem: w('Kalın veya fibrotik septum (eski ponksiyon, lipomatöz hipertrofi)', 'Thick or fibrotic septum (prior puncture, lipomatous hypertrophy)'), action: w('ICE ile en ince bölgeyi bulun; keskin iğne, RF iğne (kısa, düşük güçlü uygulama) veya RF tel. Lipomatöz hipertrofide ince merkez hedeflenir.', 'Find the thinnest part with ICE; a sharp needle, an RF needle (brief low-power application) or an RF wire. In lipomatous hypertrophy aim at the thin centre.'), sources: ['ehra', 'academy'] },
  { problem: w('Anevrizmatik septum', 'Aneurysmal septum'), action: w('Aşırı kuvvetten kaçının: çadır LA\'nın karşı duvarına değebilir. ICE ile LA lateral duvarına mesafeyi izleyin; keskin iğne veya RF ile kısa ve kontrollü geçiş.', 'Avoid excessive force: the tent can reach the far LA wall. Watch the distance to the LA lateral wall on ICE; a short, controlled crossing with a sharp needle or RF.'), sources: ['academy', 'ehra'] },
  { problem: w('Yama veya kapatma cihazı', 'Patch or closure device'), action: w('TEE/ICE ile cihazın çevresindeki doğal septum (çoğunlukla alt-arka kenar) aranır. Doğal septum yoksa cihaz veya yama içinden geçiş RF ve balon dilatasyonla deneyimli ellerde yapılabilir.', 'Look on TEE/ICE for native septum around the device (usually its inferior-posterior rim). Without native septum, crossing through the device or patch with RF and balloon dilation is possible in experienced hands.'), sources: ['ehra'] },
  { problem: w('Dilatatör iğnenin üzerinden geçmiyor', 'Dilator will not follow the needle'), action: w('İğnenin içinden 0,014 inç ince tel LSPV\'ye ilerletilip destek sağlanır.', 'Advance a 0.014 inch wire through the needle into the LSPV for support.'), sources: ['academy'] },
  { problem: w('Kılıf dilatatörün üzerinden geçmiyor', 'Sheath will not follow the dilator'), action: w('Yalnız dilatatörle septumu ileri-geri geçerek ön dilatasyon yapın; kılıfı saat yönünde çevirip teli sağ üst pulmoner vene alın; gerekirse septal balon.', 'Pre-dilate by passing the dilator alone back and forth; rotate the sheath clockwise and reposition the wire in the right superior pulmonary vein; if needed a septal balloon.'), sources: ['academy', 'ehra'] },
  { problem: w('Kesintili IVC', 'Interrupted IVC'), action: w('Femoral yol septuma ulaşmaz: jugüler (veya transhepatik) yol ve buna uygun sistem.', 'The femoral route cannot reach the septum: a jugular (or transhepatic) route with a suitable system.'), sources: ['ehra'] }
]);

/* ---------- Complications ---------- */
export const TS_COMPLICATIONS = Object.freeze([
  {
    id: 'tamponade', name: w('Perikardiyal efüzyon / tamponad', 'Pericardial effusion / tamponade'),
    incidence: w('%0,5–2', '0.5–2%'),
    mechanism: w('Çok posterior veya anterior ponksiyon, RA/LA serbest duvarı veya iğne-kılıf sisteminin karşı duvara fırlaması.', 'A too-posterior or anterior puncture, the RA/LA free wall, or the system lunging into the far wall.'),
    prevent: w('İki projeksiyon ve eko eşliği; önce yalnız iğne; dirençte kuvvet biriktirmemek.', 'Two views and echo guidance; needle alone first; no stored force on resistance.'),
    manage: w('Tansiyon düşüşü, kalp kenarı hareketinde azalma: ekoyla doğrulayıp perkütan drenaj; aspirasyon azalınca protamin. Kılıf perforasyonunda cerrahi.', 'Falling blood pressure, reduced heart-border motion: confirm on echo and drain percutaneously; protamine once aspiration falls. Sheath perforation needs surgery.'),
    sources: ['ehra', 'pcr']
  },
  {
    id: 'aortic', name: w('Aort ponksiyonu', 'Aortic puncture'),
    incidence: w('< %0,1', '< 0.1%'),
    mechanism: w('Anterior ve yüksek yönelim: nonkoroner sinüs (en sık), sinotübüler bileşke veya yükselen aort.', 'An anterior, high orientation: the non-coronary sinus (most often), the sinotubular junction or the ascending aorta.'),
    prevent: w('İğne aort pigtailinin veya His kateterinin posteroinferiorunda kalır; arteriyel basınç eğrisi görülürse ilerletilmez.', 'Keep the needle posteroinferior to the aortic pigtail or His catheter; never advance on an arterial pressure trace.'),
    manage: w('Yalnız iğne girdiyse geri çekmek genellikle yeterli. Kılıf girdiyse kılıf yerinde bırakılır, tel aortta tutulur; cerrahi veya perkütan kapatma planlanır.', 'If only the needle entered, withdrawal is usually enough. If the sheath entered, leave it in place with a wire in the aorta; plan surgical or percutaneous closure.'),
    sources: ['ehra', 'pcr']
  },
  {
    id: 'air', name: w('Hava embolisi', 'Air embolism'),
    incidence: w('Seyrek', 'Rare'),
    mechanism: w('Kılıf değişimi sırasında hava girişi; hava anterior yerleşimli sağ koronere gider.', 'Air entering during sheath exchanges; it travels to the anteriorly placed right coronary.'),
    prevent: w('Tel ve dilatatörü yavaş çekin, kılıfı her değişimde aspire edip yıkayın.', 'Withdraw wire and dilator slowly, aspirate and flush the sheath at every exchange.'),
    manage: w('İnferior derivasyonlarda geçici ST yükselmesi, bradikardi: oksijen, destek, gerekirse yüksek hızlı pacing veya vazopressör; çoğu dakikalar içinde geçer.', 'Transient inferior ST elevation, bradycardia: oxygen, support, if needed high-rate pacing or a vasopressor; most resolve within minutes.'),
    sources: ['ehra', 'academy']
  },
  {
    id: 'stroke', name: w('İnme / TİA', 'Stroke / TIA'),
    incidence: w('< %1', '< 1%'),
    mechanism: w('Kılıf içinde veya üzerinde pıhtı, hava ya da dilatatörden koparılan parçacık.', 'Clot in or on the sheath, air, or particles shaved off the dilator.'),
    prevent: w('Heparin (100 U/kg, en fazla 10 000 U; ponksiyondan önce veya hemen sonra), AF işleminde ACT > 300 sn; yıkama; iğneyi stilesiz sokmamak.', 'Heparin (100 U/kg, max 10 000 U; before or right after the puncture), ACT > 300 s in AF procedures; flushing; never insert the needle without its stylet.'),
    manage: w('Acil nörolojik değerlendirme ve inme ekibi.', 'Urgent neurological assessment and the stroke team.'),
    sources: ['ehra', 'academy']
  },
  {
    id: 'asd', name: w('Kalıcı iatrojenik ASD', 'Persistent iatrogenic ASD'),
    incidence: w('Kılıf çapıyla artar (büyük kılıflarda %30–40)', 'Rises with sheath size (30–40% with large sheaths)'),
    mechanism: w('Büyük kılıf veya çift ponksiyon sonrası septal deliğin kapanmaması.', 'The septal hole failing to close after a large sheath or a double puncture.'),
    prevent: w('Uygun en küçük kılıf; gereksiz manipülasyondan kaçınma.', 'The smallest suitable sheath; avoid needless manipulation.'),
    manage: w('Çoğu soldan sağa ve klinik etkisiz. Kapatma: sağdan sola şant ve hipoksemi, > 8 mm defekt, paradoksal emboli kaygısı.', 'Most are left-to-right without clinical effect. Close for right-to-left shunt with hypoxaemia, a defect > 8 mm, or concern for paradoxical embolism.'),
    sources: ['ehra', 'pcr']
  }
]);

/* ---------- History ---------- */
export const TS_HISTORY = Object.freeze([
  { year: '1959', text: w('Ross, Braunwald ve Morrow (ABD Ulusal Kalp Enstitüsü): kapak cerrahisi öncesi sol atriyum basıncını ölçmek için transseptal ponksiyon.', 'Ross, Braunwald and Morrow (US National Heart Institute): transseptal puncture to measure left atrial pressure before valve surgery.'), sources: ['ross'] },
  { year: '1962', text: w('Brockenbrough, Braunwald ve Ross: geliştirilmiş iğne ve 450 olguluk deneyim. Brockenbrough iğnesinin temel tasarımı bugün de kullanılıyor.', 'Brockenbrough, Braunwald and Ross: an improved needle and a 450-study experience. The basic Brockenbrough needle design is still in use.'), sources: ['brock'] },
  { year: '1983', text: w('Mullins: iğne-dilatatör-kılıf sistemi; kılıfın LA\'da kalması girişimsel kullanımın yolunu açtı.', 'Mullins: the needle-dilator-sheath system; a sheath left in the LA opened the way for interventions.'), sources: ['mullins'] },
  { year: '1990–2000', text: w('AF ablasyonu ve balon mitral valvülotomi transseptal erişimi rutinleştirdi; TEE ve ICE eşliği yaygınlaştı.', 'AF ablation and balloon mitral valvotomy made transseptal access routine; TEE and ICE guidance spread.'), sources: ['earley'] },
  { year: '2000+', text: w('RF iğne ve teller, yönlendirilebilir ve büyük çaplı kılıflar (LAA kapatma, mitral TEER); bölgeye özgü ponksiyon kavramı.', 'RF needles and wires, steerable and large-bore sheaths (LAA occlusion, mitral TEER); the idea of a procedure-specific puncture site.'), sources: ['ehra'] }
]);

/* ---------- Knowledge check ---------- */
export const TS_QUIZ = Object.freeze([
  {
    q: w('İğne kılıfa sokulurken stile neden içinde olmalıdır?', 'Why must the stylet be inside the needle when it enters the sheath?'),
    options: [w('Dilatatörün iç duvarını kazımasın, parçacık koparmasın diye', 'So it does not scrape the dilator wall and shear off particles'), w('İğneyi daha kıvrımlı yapmak için', 'To make the needle more curved'), w('Basınç eğrisini kaydetmek için', 'To record the pressure trace'), w('İğneyi floroskopide görünür kılmak için', 'To make the needle visible on fluoroscopy')],
    answer: 0, why: w('Stile keskin ucu korur; dilatatör ucunda çıkarılır.', 'The stylet guards the sharp tip; it comes out at the dilator tip.')
  },
  {
    q: w('Geri çekme sırasında iğne oku hangi yöne bakmalıdır (proksimalden)?', 'Which way should the needle arrow face during the pullback (viewed from the hub)?'),
    options: [w('Saat 12', '12 o\'clock'), w('Saat 4–5', '4–5 o\'clock'), w('Saat 8', '8 o\'clock'), w('Saat 10', '10 o\'clock')],
    answer: 1, why: w('Saat 4–5 posterior septuma bakar; saat 12 aorta yönelir.', '4–5 o\'clock faces the posterior septum; 12 o\'clock heads for the aorta.')
  },
  {
    q: w('Geri çekmede ikinci sıçrama neyi gösterir?', 'What does the second jump on pullback mean?'),
    options: [w('SVC\'den RA\'ya geçiş', 'Passing from the SVC into the RA'), w('Ucun limbusun üst kenarının altından fossaya düşmesi', 'The tip dropping under the superior limbus into the fossa'), w('İğnenin LA\'ya geçmesi', 'The needle crossing into the LA'), w('Kılıfın triküspit kapağa girmesi', 'The sheath entering the tricuspid valve')],
    answer: 1, why: w('Birinci sıçrama SVC-RA bileşkesi, ikincisi fossaya düşüştür; ponksiyon değildir.', 'The first jump is the SVC-RA junction, the second the drop into the fossa; neither is the puncture.')
  },
  {
    q: w('RAO 30°\'de doğru iğne konumu hangisidir?', 'In RAO 30°, which needle position is right?'),
    options: [w('CS kateterinin anteriorunda, aortun üstünde', 'Anterior to the CS catheter, above the aorta'), w('CS kateterinin posteriorunda, omurganın anteriorunda', 'Posterior to the CS catheter, anterior to the spine'), w('Omurganın posteriorunda', 'Posterior to the spine'), w('Pigtail kateterin tam üstünde', 'Right on the pigtail catheter')],
    answer: 1, why: w('RAO ön-arka konumu gösterir; hedef CS ekseni ile omurganın arasıdır.', 'RAO shows the anterior-posterior position; the target lies between the CS axis and the spine.')
  },
  {
    q: w('RAO\'da iğne fazla anteriorsa sistemi hangi yöne çevirirsiniz?', 'In RAO the needle is too anterior. Which way do you rotate?'),
    options: [w('Saat yönünde', 'Clockwise'), w('Saat yönünün tersine', 'Counterclockwise'), w('Çevirmeden yalnız iterek', 'Push without rotating'), w('Kılıfı çekerek', 'Pull the sheath back')],
    answer: 0, why: w('Saat yönü posteriora, tersi anteriora götürür.', 'Clockwise moves posteriorly, counterclockwise anteriorly.')
  },
  {
    q: w('İğne ucundan arteriyel basınç eğrisi geliyor. Ne yaparsınız?', 'The needle shows an arterial pressure trace. What do you do?'),
    options: [w('Dilatatörü hemen ilerletirim', 'Advance the dilator at once'), w('Kontrast verip kılıfı ilerletirim', 'Inject contrast and advance the sheath'), w('Yalnız iğneyi geri çeker, konumu yeniden değerlendiririm', 'Withdraw the needle alone and reassess'), w('Teli LSPV\'ye koyarım', 'Put the wire into the LSPV')],
    answer: 2, why: w('Aort ponksiyonu: yalnız iğne girdiyse geri çekmek genellikle yeterlidir; dilatatör veya kılıf asla ilerletilmez.', 'Aortic puncture: if only the needle entered, withdrawal is usually enough; never advance the dilator or sheath.')
  },
  {
    q: w('Mitral TEER için tercih edilen ponksiyon bölgesi?', 'Preferred puncture site for mitral TEER?'),
    options: [w('Anterior ve alçak', 'Anterior and low'), w('Posterior ve yüksek', 'Posterior and high'), w('PFO tüneli', 'Through the PFO tunnel'), w('Merkez ve alçak', 'Central and low')],
    answer: 1, why: w('Cihazın LA içinde yüksekliğe ihtiyacı vardır: koaptasyonun yaklaşık 3,5–4 cm üzeri.', 'The device needs height in the LA: about 3.5–4 cm above coaptation.')
  },
  {
    q: w('Ponksiyondan sonra inferior derivasyonlarda geçici ST yükselmesi en olası neyi düşündürür?', 'Transient inferior ST elevation after the puncture most likely suggests?'),
    options: [w('Aort diseksiyonu', 'Aortic dissection'), w('Sağ koronere hava embolisi', 'Air embolism to the right coronary'), w('Perikardit', 'Pericarditis'), w('İatrojenik ASD', 'Iatrogenic ASD')],
    answer: 1, why: w('Anterior yerleşimli sağ koroner ostiyumu havayı kolay alır; çoğu dakikalar içinde düzelir.', 'The anteriorly placed right coronary ostium readily takes air; most resolve within minutes.')
  }
]);

const b = (tr, en) => ({ tr, en });
const node = (id, label, pathway, x, y, name, role, tests = []) => ({ id, label, pathway, x, y, name, role, tests });

// Classical laboratory cascade, not a kinetic or cell-based haemostasis model.
export const COAG_NODES = [
  node('xii', 'XII → XIIa', 'intrinsic', 195, 120, b('Hageman faktörü', 'Hageman factor'), b('Temas aktivasyonu; laboratuvar intrinsik yolunu başlatır. Eksikliği aPTT uzatabilir, tipik kanama nedeni değildir.', 'Contact activation starts the laboratory intrinsic pathway. Deficiency may prolong aPTT without typical bleeding.'), ['aptt']),
  node('xi', 'XI → XIa', 'intrinsic', 195, 210, b('Plazma tromboplastin öncülü', 'Plasma thromboplastin antecedent'), b('Aktif XI, IX aktivasyonuna katkı sağlar; trombin geri beslemesi de XI aktivasyonunu artırır.', 'Activated XI contributes to IX activation; thrombin feedback also promotes XI activation.'), ['aptt']),
  node('ix', 'IX → IXa', 'intrinsic', 195, 300, b('Christmas faktörü', 'Christmas factor'), b('IXa, VIIIa ile intrinsik tenaz kompleksinde X aktivasyonunu sağlar.', 'IXa and VIIIa form intrinsic tenase to activate X.'), ['aptt']),
  node('viii', 'VIII → VIIIa', 'intrinsic', 390, 300, b('Antihemofilik faktör A', 'Antihemophilic factor A'), b('VIIIa, IXa için kofaktördür; trombin tarafından aktive edilir.', 'VIIIa is a cofactor for IXa and is activated by thrombin.'), ['aptt']),
  node('tf', 'TF · III', 'extrinsic', 665, 120, b('Doku faktörü', 'Tissue factor'), b('Hasarda açığa çıkan doku faktörü VIIa ile birleşir; fizyolojik koagülasyon başlangıcında önemlidir.', 'Exposed tissue factor binds VIIa and is important in physiological initiation of coagulation.')),
  node('vii', 'VII → VIIa', 'extrinsic', 850, 120, b('Prokonvertin', 'Proconvertin'), b('TF-VIIa kompleksi X ve IX aktivasyonuna katkı sağlar. Vitamin K bağımlıdır.', 'TF-VIIa contributes to X and IX activation. Vitamin K dependent.'), ['pt']),
  node('extrinsic-tenase', 'TF + VIIa', 'extrinsic', 755, 250, b('Ekstrinsik tenaz', 'Extrinsic tenase'), b('TF + VIIa + Ca²⁺ + fosfolipid yüzey; X ve IX aktivasyonu.', 'TF + VIIa + Ca²⁺ + phospholipid surface; X and IX activation.')),
  node('intrinsic-tenase', 'IXa + VIIIa', 'intrinsic', 290, 395, b('İntrinsik tenaz', 'Intrinsic tenase'), b('IXa + VIIIa + Ca²⁺ + fosfolipid yüzey; X aktivasyonu.', 'IXa + VIIIa + Ca²⁺ + phospholipid surface; X activation.')),
  node('x', 'X → Xa', 'common', 480, 495, b('Stuart-Prower faktörü', 'Stuart-Prower factor'), b('Xa, Va ile protrombinaz kompleksinde trombin oluşumunu sağlar.', 'Xa with Va in prothrombinase generates thrombin.'), ['pt', 'aptt']),
  node('v', 'V → Va', 'common', 705, 585, b('Proakselerin', 'Proaccelerin'), b('Va, Xa için kofaktördür; trombin tarafından aktive edilir.', 'Va is a cofactor for Xa and is activated by thrombin.'), ['pt', 'aptt']),
  node('prothrombinase', 'Xa + Va', 'common', 480, 585, b('Protrombinaz kompleksi', 'Prothrombinase complex'), b('Xa + Va + Ca²⁺ + fosfolipid yüzey, protrombini trombine çevirir.', 'Xa + Va + Ca²⁺ + phospholipid surface convert prothrombin to thrombin.')),
  node('ii', 'II → IIa', 'common', 480, 675, b('Protrombin → trombin', 'Prothrombin → thrombin'), b('Trombin fibrinojeni fibrine çevirir; V, VIII, XI ve XIII aktivasyonunu destekler.', 'Thrombin converts fibrinogen to fibrin and supports activation of V, VIII, XI and XIII.'), ['pt', 'aptt']),
  node('i', 'I · Fibrinojen', 'common', 225, 765, b('Fibrinojen', 'Fibrinogen'), b('Trombinin parçaladığı çözünür fibrin öncülüdür.', 'Soluble fibrin precursor cleaved by thrombin.'), ['pt', 'aptt']),
  node('fibrin', 'Fibrin', 'common', 480, 765, b('Fibrin ağı', 'Fibrin network'), b('Fibrin polimerleşir; XIIIa çapraz bağları ağı stabilize eder.', 'Fibrin polymerizes; XIIIa cross-links stabilize the network.')),
  node('xiii', 'XIII → XIIIa', 'common', 745, 765, b('Fibrin stabilize edici faktör', 'Fibrin-stabilizing factor'), b('XIIIa fibrini çapraz bağlar. Eksikliğinde PT ve aPTT normal olabilir; ayrı aktivite testi gerekir.', 'XIIIa cross-links fibrin. PT and aPTT may be normal in deficiency; a separate activity assay is required.')),
  node('clot', 'Stabilize fibrin', 'common', 480, 855, b('Stabilize fibrin pıhtısı', 'Stabilized fibrin clot'), b('XIIIa çapraz bağlarıyla güçlenen fibrin ağı; eritrosit ve trombositleri tutabilir.', 'Cross-linked fibrin network may retain red cells and platelets.'))
];

export const COAG_EDGES = [
  ['xii', 'xi'], ['xi', 'ix'], ['ix', 'intrinsic-tenase'], ['viii', 'intrinsic-tenase'],
  ['tf', 'extrinsic-tenase'], ['vii', 'extrinsic-tenase'], ['extrinsic-tenase', 'x'],
  ['extrinsic-tenase', 'ix'], ['intrinsic-tenase', 'x'], ['x', 'prothrombinase'],
  ['v', 'prothrombinase'], ['prothrombinase', 'ii'], ['ii', 'fibrin'], ['i', 'fibrin'],
  ['ii', 'xiii'], ['fibrin', 'clot'], ['xiii', 'clot']
];
export const COAG_FEEDBACK = ['v', 'viii', 'xi'];
export const COAG_TESTS = { pt: ['vii', 'x', 'v', 'ii', 'i'], aptt: ['xii', 'xi', 'ix', 'viii', 'x', 'v', 'ii', 'i'] };
export const COAG_DRUGS = [
  { id: 'none', title: b('İlaç katmanı yok', 'No drug overlay'), targets: [], text: b('Faktör veya test seçerek yolu keşfedin.', 'Explore the pathway by selecting a factor or test.') },
  { id: 'warfarin', title: b('Warfarin · vitamin K', 'Warfarin · vitamin K'), targets: ['ii', 'vii', 'ix', 'x'], text: b('Vitamin K döngüsünü inhibe ederek II, VII, IX, X ve protein C/S işlevsel sentezini azaltır; mevcut faktörleri doğrudan bloke etmez. INR, warfarin izlemi için kullanılır.', 'Inhibits vitamin K recycling, reducing functional synthesis of II, VII, IX, X and proteins C/S; does not directly block existing factors. INR is used for warfarin monitoring.') },
  { id: 'heparin', title: b('UFH · antitrombin', 'UFH · antithrombin'), targets: ['x', 'ii'], text: b('Fraksiyone olmayan heparin antitrombin üzerinden özellikle Xa ve IIa inhibisyonunu artırır. Bu katman ana hedefleri gösterir; LMWH ile aynı etki dengesi değildir.', 'Unfractionated heparin enhances antithrombin-mediated inhibition, particularly Xa and IIa. Overlay shows principal targets; LMWH has a different balance of effects.') },
  { id: 'xa', title: b('Apiksaban · Xa', 'Apixaban · Xa'), targets: ['x'], text: b('Aktif Xa doğrudan inhibe edilir. Normal PT/aPTT, klinik olarak önemli DOAC etkisini dışlamaz; INR DOAC düzeyini ölçmez.', 'Directly inhibits activated Xa. Normal PT/aPTT do not exclude clinically relevant DOAC activity; INR does not quantify DOAC levels.') },
  { id: 'iia', title: b('Dabigatran · IIa', 'Dabigatran · IIa'), targets: ['ii'], text: b('Aktif trombin (IIa) doğrudan inhibe edilir. Şema hedefi gösterir; test süresi veya ilaç düzeyi hesaplamaz.', 'Directly inhibits activated thrombin (IIa). Diagram shows the target, not clotting times or drug concentrations.') },
  { id: 'lysis', title: b('Alteplaz · fibrinoliz', 'Alteplase · fibrinolysis'), targets: ['fibrin', 'clot'], text: b('Plazminojenden plazmin oluşumunu artırır; plazmin fibrini parçalar. Faktör sentezini azaltmak veya Xa inhibisyonundan farklıdır.', 'Promotes plasmin generation from plasminogen; plasmin breaks down fibrin. Distinct from reduced factor synthesis or Xa inhibition.') }
];
export const COAG_SOURCES = [
  { title: 'ARUP: Factor XIII Deficiency Testing', url: 'https://ltd.aruplab.com/api/ltd/pdf/377' },
  { title: 'ARUP: Prolonged Clotting Time Evaluation', url: 'https://arupconsult.com/content/prolonged-clotting-time-evaluation' },
  { title: 'Clinical Methods: Coagulation Tests', url: 'https://www.ncbi.nlm.nih.gov/books/NBK265/' },
  { title: 'Merck Manual: Overview of Hemostasis', url: 'https://www.merckmanuals.com/professional/hematology/hemostasis/overview-of-hemostasis' },
  { title: 'DailyMed: Warfarin', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ac117f50-8e67-4203-8d97-e53dd0687c20' },
  { title: 'DailyMed: Apixaban', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=396912c0-9f68-47ed-ba3f-8d9ace755a48' },
  { title: 'DailyMed: Heparin', url: 'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=e0cc5f44-9a67-4274-a48a-d6118e96d391' },
  { title: 'DailyMed: Dabigatran', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=dd47a015-ff90-d7a7-8dcb-4e6e31a68071' },
  { title: 'Genentech: Activase prescribing information', url: 'https://www.gene.com/gene/products/information/pdf/activase-prescribing.pdf' }
];

export function coagHighlights(test = 'all', drug = 'none') {
  return { tested: new Set(COAG_TESTS[test] ?? []), targeted: new Set(COAG_DRUGS.find(item => item.id === drug)?.targets ?? []) };
}

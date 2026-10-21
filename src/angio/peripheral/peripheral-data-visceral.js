// Original schematic visceral and renal map. Image left is the patient's right.
// Three projections share one structure list. The oblique is a shallow teaching
// sketch, not a measured C-arm angle.

const line = (kind, pts, w) => ({ type: 'line', kind, pts, w });
const MODES = ['ap', 'lateral', 'oblique'];

const S = (spec) => spec;

export const VISCERAL = [
  S({
    id: 'visceral-aorta',
    view: 'visceral',
    modes: MODES,
    kind: 'trunk',
    name: { tr: 'Karın aortu', en: 'Abdominal aorta' },
    text: {
      tr: 'Bu görünümde karın aortu, çölyak trunkustan bifurkasyona kadar visseral ve renal dalların gövdesidir. Çölyak yaklaşık T12, SMA yaklaşık L1, renaller L1–L2, IMA yaklaşık L3 düzeyindedir. Bifurkasyon yaklaşık L4 düzeyindedir ve ayrı sekmededir. Aralıklar şematik eğitim geometrisidir.',
      en: 'On this view the abdominal aorta is the trunk for the visceral and renal branches, from the celiac trunk to the bifurcation. The celiac artery is near T12, the SMA near L1, the renals at L1–L2, and the IMA near L3. The bifurcation is near L4 and has its own tab. Spacing is schematic teaching geometry.'
    },
    pearl: {
      tr: 'Ostial mezenterik darlık için lateral, renal ağız için hafif oblik kullanılır. AP adlandırma görünümüdür. Aortadaki kalsifikasyon, anevrizma veya mural trombüs kateter seçimini değiştirir. Bu çizimde lezyon yoktur.',
      en: 'Use a lateral projection for an ostial mesenteric stenosis and a slight oblique for a renal ostium. AP is the naming view. Aortic calcification, aneurysm, or mural thrombus changes catheter choice. This drawing has no lesion.'
    },
    hit: { x: 360, y: 80 },
    hits: { ap: { x: 360, y: 80 }, lateral: { x: 210, y: 100 }, oblique: { x: 300, y: 110 } },
    label: { tr: 'Aort', en: 'Aorta', x: 378, y: 78 },
    draw: {
      ap: [line('trunk', [[360, 32], [358, 180], [356, 360], [352, 560], [348, 760]], 22)],
      lateral: [line('trunk', [[214, 40], [210, 180], [206, 360], [202, 560], [198, 760]], 22)],
      oblique: [line('trunk', [[340, 40], [280, 150], [250, 300], [270, 480], [320, 640], [300, 760]], 20)]
    }
  }),
  S({
    id: 'celiac',
    view: 'visceral',
    modes: MODES,
    kind: 'artery',
    name: { tr: 'Çölyak trunkus', en: 'Celiac trunk' },
    text: {
      tr: 'Çölyak trunkus yaklaşık T12 düzeyinde aortun ön yüzünden çıkar. Kısa gövde sol gastrik, splenik ve ana hepatik arterlere ayrılır. Foregut kanlanması bu köktendir: distal özofagus, mide, proksimal duodenum, karaciğer, safra kesesi, dalak ve pankreasın bir bölümü.',
      en: 'The celiac trunk leaves the anterior aorta near T12. The short trunk divides into the left gastric, splenic, and common hepatic arteries. It supplies the foregut: distal esophagus, stomach, proximal duodenum, liver, gallbladder, spleen, and part of the pancreas.'
    },
    pearl: {
      tr: 'Ağız ön yüzdedir, bu yüzden lateral projeksiyon ostiumu profilde gösterir. Ekspirasyonda median arkuat ligaman çölyak kökünü kıvrımlı gösterebilir. AP üç dalı adlandırmak içindir. Gövde üzerindeki nokta duvarın üstünde değil, trunkusun kendisindedir.',
      en: 'The ostium is anterior, so a lateral projection shows it in profile. In expiration the median arcuate ligament can make the celiac origin look kinked. AP is for naming the three branches. The hit point sits on the trunk, not on the aortic wall.'
    },
    hit: { x: 326, y: 150 },
    hits: { ap: { x: 326, y: 150 }, lateral: { x: 300, y: 148 }, oblique: { x: 220, y: 142 } },
    label: { tr: 'Çölyak', en: 'Celiac', x: 300, y: 128 },
    draw: {
      ap: [line('artery', [[360, 148], [326, 150], [292, 154]], 13)],
      lateral: [line('artery', [[210, 156], [300, 148], [380, 142]], 13)],
      oblique: [line('artery', [[272, 156], [220, 142], [168, 128]], 12)]
    }
  }),
  S({
    id: 'left-gastric',
    view: 'visceral',
    modes: MODES,
    kind: 'branch',
    name: { tr: 'Sol gastrik arter', en: 'Left gastric artery' },
    text: {
      tr: 'Sol gastrik arter çölyak trifurkasyonunun en ince dalıdır ve çoğu kez ilk ayrılır. Küçük kurvatura boyunca yukarı ve hastanın soluna, görüntüde sağa doğru mideye gider. Özofageal dallar distal özofagusa çıkar. Sağ gastrik arterle küçük kurvaturada birleşir.',
      en: 'The left gastric artery is the smallest celiac branch and is often the first to leave. It runs up along the lesser curvature, toward the patient\'s left, which is image right. Esophageal branches reach the distal esophagus. It joins the right gastric artery along the lesser curve.'
    },
    pearl: {
      tr: 'Mide kanaması veya sol gastrik varyantı aranırken seçici enjeksiyon yapılır. Replaced sol hepatik arter bazen sol gastrikten çıkar. Lateralde dal düzlem dışına kısa bir kök olarak çizilir. Bu bir ölçeksiz şemadır.',
      en: 'Selective injection is used when looking for gastric bleeding or a left gastric variant. A replaced left hepatic artery sometimes arises from the left gastric artery. On the lateral sketch the branch is a short out-of-plane stem. This is an unscaled schematic.'
    },
    hit: { x: 348, y: 102 },
    hits: { ap: { x: 348, y: 102 }, lateral: { x: 396, y: 100 }, oblique: { x: 180, y: 90 } },
    label: { tr: 'Sol gastrik', en: 'Left gastric', x: 390, y: 64 },
    draw: {
      ap: [line('branch', [[292, 154], [330, 112], [378, 68]], 7)],
      lateral: [line('branch', [[380, 142], [400, 96], [392, 52]], 6)],
      oblique: [line('branch', [[168, 128], [186, 84], [176, 48]], 6)]
    }
  }),
  S({
    id: 'splenic',
    view: 'visceral',
    modes: MODES,
    kind: 'artery',
    name: { tr: 'Splenik arter', en: 'Splenic artery' },
    text: {
      tr: 'Splenik arter çölyak dallarının en kalınıdır. Pankreasın üst kenarı boyunca kıvrılarak dalağa gider. Bu AP şemada hastanın solu görüntünün sağındadır. Pankreatik dallar, kısa gastrik arterler ve sol gastroepiploik arter buradan çıkar.',
      en: 'The splenic artery is the largest celiac branch. It twists along the upper border of the pancreas to the spleen. On this AP schematic the patient\'s left is image right. Pancreatic branches, the short gastric arteries, and the left gastroepiploic artery arise from it.'
    },
    pearl: {
      tr: 'Kıvrımlı seyir normaldir, spazm sanılmamalıdır. Dalak hilusu travma, anevrizma ve hipersplenizmde bakılır. Lateralde dal düzlem dışındadır ve kısa bir kök olarak bırakılır. Ölçü bu çizgiden alınmaz.',
      en: 'A tortuous course is normal and should not be called spasm. The splenic hilum is reviewed in trauma, aneurysm, and hypersplenism. On the lateral sketch the artery is out of plane and is left as a short stem. Do not measure from this line.'
    },
    hit: { x: 470, y: 148 },
    hits: { ap: { x: 470, y: 148 }, lateral: { x: 345, y: 170 }, oblique: { x: 320, y: 152 } },
    label: { tr: 'Splenik', en: 'Splenic', x: 520, y: 118 },
    draw: {
      ap: [line('artery', [[292, 154], [380, 168], [470, 136], [560, 172], [650, 148]], 11)],
      lateral: [line('branch', [[330, 150], [360, 188]], 7)],
      oblique: [line('branch', [[240, 160], [320, 148], [400, 160]], 8)]
    }
  }),
  S({
    id: 'common-hepatic',
    view: 'visceral',
    modes: MODES,
    kind: 'artery',
    name: { tr: 'Ana hepatik arter', en: 'Common hepatic artery' },
    text: {
      tr: 'Ana hepatik arter çölyaktan karaciğere, yani hastanın sağına ve görüntünün soluna gider. Gastroduodenal arter ayrılana kadar bu adla anılır. Sağ gastrik arter çoğu kez ana hepatik veya proper hepatik arterden çıkar. Bu kartta ayrı bir düğme değildir.',
      en: 'The common hepatic artery runs from the celiac trunk toward the liver, the patient\'s right, which is image left. It keeps this name until the gastroduodenal artery leaves. The right gastric artery often arises from the common or proper hepatic artery. It is not a separate button on this card.'
    },
    pearl: {
      tr: 'Replaced sağ hepatik arter SMA\'dan, replaced sol hepatik arter sol gastrikten çıkabilir. AP\'de dalın yönü karaciğer tarafına bakılarak doğrulanır. Lateralde kısa bir öne giden köktür. Şema varyantı çizmez, metin hatırlatır.',
      en: 'A replaced right hepatic artery can arise from the SMA, and a replaced left hepatic artery from the left gastric artery. On AP the direction toward the liver confirms the branch. On the lateral sketch it is a short anterior stem. The schematic does not draw the variant. The text is the reminder.'
    },
    hit: { x: 220, y: 178 },
    hits: { ap: { x: 220, y: 178 }, lateral: { x: 364, y: 172 }, oblique: { x: 168, y: 154 } },
    label: { tr: 'A. hepatica comm.', en: 'Common hepatic', x: 168, y: 164, anchor: 'end' },
    draw: {
      ap: [line('artery', [[292, 154], [230, 172], [176, 204]], 11)],
      lateral: [line('branch', [[350, 146], [378, 196]], 8)],
      oblique: [line('branch', [[196, 138], [140, 168]], 8)]
    }
  }),
  S({
    id: 'proper-hepatic',
    view: 'visceral',
    modes: MODES,
    kind: 'branch',
    name: { tr: 'Proper hepatik arter', en: 'Proper hepatic artery' },
    text: {
      tr: 'Proper hepatik arter, gastroduodenal arter ayrıldıktan sonra karaciğer hilusuna giden devamdır. Sağ ve sol hepatik arterlere ayrılır. Kistik arter çoğu kez sağ hepatik arterden çıkar. Hilusta portal ven ve safra yolu ile seyreder.',
      en: 'The proper hepatic artery is the continuation to the liver hilum after the gastroduodenal artery has left. It divides into the right and left hepatic arteries. The cystic artery usually arises from the right hepatic artery. At the hilum it runs with the portal vein and the bile duct.'
    },
    pearl: {
      tr: 'Hepatik enjeksiyonda sağ ve sol dallar hilusta ayrılır. Tümör, travma veya safra kaçağı embolizasyonunda hangi sektöre gidildiği sorulur. Bu şema sağ ve sol dalı ayrı düğme yapmaz. Proper hepatik tek karttır.',
      en: 'On a hepatic injection the right and left branches separate at the hilum. Embolization for tumor, trauma, or bile leak asks which sector is supplied. This schematic does not make the right and left branches separate buttons. The proper hepatic artery is one card.'
    },
    hit: { x: 118, y: 248 },
    hits: { ap: { x: 118, y: 248 }, lateral: { x: 394, y: 224 }, oblique: { x: 116, y: 192 } },
    label: { tr: 'A. hepatica propria', en: 'Proper hepatic', x: 70, y: 270 },
    draw: {
      ap: [line('branch', [[176, 204], [130, 236], [96, 286]], 8)],
      lateral: [line('branch', [[378, 196], [408, 250]], 7)],
      oblique: [line('branch', [[140, 168], [96, 214]], 7)]
    }
  }),
  S({
    id: 'gastroduodenal',
    view: 'visceral',
    modes: MODES,
    kind: 'branch',
    name: { tr: 'Gastroduodenal arter', en: 'Gastroduodenal artery' },
    text: {
      tr: 'Gastroduodenal arter ana hepatik arterden ayrılıp duodenumun arkasına iner. Sağ gastroepiploik arter ve superior pankreatikoduodenal arterleri verir. Superior pankreatikoduodenal dallar SMA\'nın inferior pankreatikoduodenal arteri ile birleşir.',
      en: 'The gastroduodenal artery leaves the common hepatic artery and descends behind the duodenum. It gives the right gastroepiploic artery and the superior pancreaticoduodenal arteries. Those superior branches join the inferior pancreaticoduodenal artery from the SMA.'
    },
    pearl: {
      tr: 'Duodenum ülser kanamasının klasik kaynağı gastroduodenal arter veya pankreatikoduodenal dalıdır. Çölyak ile SMA arasında pankreas başı üzerinden kollateral yol burasıdır. Şemada tek bir inen dal olarak çizilir.',
      en: 'The classic source of a bleeding duodenal ulcer is the gastroduodenal artery or a pancreaticoduodenal branch. This is the collateral route between the celiac artery and the SMA across the pancreatic head. The schematic draws it as one descending branch.'
    },
    hit: { x: 196, y: 340 },
    hits: { ap: { x: 196, y: 340 }, lateral: { x: 364, y: 310 }, oblique: { x: 152, y: 280 } },
    label: { tr: 'GDA', en: 'GDA', x: 214, y: 360 },
    draw: {
      ap: [line('branch', [[176, 204], [192, 300], [206, 420], [198, 530]], 8)],
      lateral: [line('branch', [[378, 196], [362, 320], [350, 440]], 7)],
      oblique: [line('branch', [[140, 168], [154, 280], [164, 400]], 7)]
    }
  }),
  S({
    id: 'sma',
    view: 'visceral',
    modes: MODES,
    kind: 'artery',
    name: { tr: 'Superior mezenterik arter', en: 'Superior mesenteric artery' },
    text: {
      tr: 'Superior mezenterik arter yaklaşık L1 düzeyinde, çölyak kökünün hemen altından, aortun ön yüzünden çıkar. Midgut\'u besler: ince bağırsak, çekum, çıkan kolon ve transvers kolonun büyük bölümü. Jejunal ve ileal dallar yelpaze yapar. Sağ kolik, orta kolik ve ileokolik arterler bu gövdedendir.',
      en: 'The superior mesenteric artery arises near L1, just below the celiac origin, from the anterior aorta. It supplies the midgut: small bowel, cecum, ascending colon, and most of the transverse colon. Jejunal and ileal branches form a fan. The right colic, middle colic, and ileocolic arteries come from this trunk.'
    },
    pearl: {
      tr: 'Ostial SMA darlığı lateralde profilde aranır. Akut mezenter iskemide emboli çoğu kez ostiumun birkaç santim distaline oturur. Jejunal dallar bu şemada yelpaze çizgisidir, tek tek adlandırılmaz. Çölyak kapalıysa GDA üzerinden dolum görülebilir.',
      en: 'An ostial SMA stenosis is sought in profile on the lateral view. In acute mesenteric ischemia an embolus often lodges a few centimeters beyond the ostium. The jejunal branches here are a fan, not individually named. If the celiac artery is occluded, filling may arrive through the GDA.'
    },
    hit: { x: 372, y: 400 },
    hits: { ap: { x: 372, y: 400 }, lateral: { x: 360, y: 310 }, oblique: { x: 190, y: 310 } },
    label: { tr: 'SMA', en: 'SMA', x: 400, y: 250 },
    draw: {
      ap: [
        line('artery', [[360, 224], [372, 340], [368, 480], [352, 640]], 12),
        line('small', [[372, 340], [250, 390]], 4),
        line('small', [[370, 400], [270, 460]], 4),
        line('small', [[368, 360], [480, 400]], 4),
        line('small', [[366, 450], [500, 490]], 4)
      ],
      lateral: [
        line('artery', [[208, 236], [320, 274], [440, 340], [468, 520]], 12),
        line('small', [[400, 320], [480, 360]], 4)
      ],
      oblique: [
        line('artery', [[256, 248], [190, 292], [150, 380]], 11),
        line('small', [[180, 310], [120, 350]], 4)
      ]
    }
  }),
  S({
    id: 'ima',
    view: 'visceral',
    modes: MODES,
    kind: 'branch',
    name: { tr: 'İnferior mezenterik arter', en: 'Inferior mesenteric artery' },
    text: {
      tr: 'İnferior mezenterik arter yaklaşık L3 düzeyinde aortun ön-sol yüzünden çıkar. Bu AP şemada hastanın solu görüntünün sağındadır. Sol kolik, sigmoid ve superior rektal arterlere ayrılır. Hindgut\'u, distal transvers kolondan üst rektuma kadar besler.',
      en: 'The inferior mesenteric artery leaves the anterolateral aorta near L3, on the patient\'s left. On this AP schematic that is image right. It divides into the left colic, sigmoid, and superior rectal arteries. It supplies the hindgut, from the distal transverse colon to the upper rectum.'
    },
    pearl: {
      tr: 'SMA ile IMA arasında Drummond marjinal arteri ve Riolan arkı kollateraldir. Kronik mezenter iskemide tek damar darlığı çoğu kez kollaterallerle karşılanır. IMA ince olduğu için ostium seçici kateterle aranır. Şema kollateral ağı çizmez, metin hatırlatır.',
      en: 'The marginal artery of Drummond and the arc of Riolan connect the SMA and the IMA. In chronic mesenteric ischemia, stenosis of a single vessel is often compensated by collaterals. The IMA is small, so the ostium is sought with a selective catheter. The schematic does not draw the collateral net. The text is the reminder.'
    },
    hit: { x: 480, y: 560 },
    hits: { ap: { x: 480, y: 560 }, lateral: { x: 280, y: 554 }, oblique: { x: 420, y: 558 } },
    label: { tr: 'IMA', en: 'IMA', x: 520, y: 540 },
    draw: {
      ap: [line('branch', [[352, 508], [430, 544], [520, 590], [600, 640]], 7)],
      lateral: [line('branch', [[204, 518], [300, 558], [360, 600]], 7)],
      oblique: [line('branch', [[300, 518], [420, 558], [530, 604]], 7)]
    }
  }),
  S({
    id: 'renal',
    view: 'visceral',
    modes: MODES,
    kind: 'artery',
    name: { tr: 'Renal arterler', en: 'Renal arteries' },
    text: {
      tr: 'Renal arterler yaklaşık L1–L2 düzeyinde aortun yan yüzlerinden çıkar. Sağ renal arter çoğu kez biraz daha alçaktır ve IVC arkasından geçer, bu yüzden daha uzundur. AP şemada sağ böbrek görüntünün solundadır. Her iki taraf tek karttadır. Ağızlar posterolateraldedir.',
      en: 'The renal arteries leave the lateral aorta near L1–L2. The right renal artery is often slightly lower and passes behind the IVC, so it is longer. On the AP schematic the right kidney is image left. Both sides share one card. The ostia are posterolateral.'
    },
    pearl: {
      tr: 'Renal ağız için hafif ipsilateral oblik veya sık kullanılan 10–20° LAO tercih edilir. Lateral, mezenter ağızları içindir. Renal ostium lateralde arkaya kısa bir kök gibi görünür. Aksesuar renal arter ayrı karttadır ve segmental uç arterdir.',
      en: 'A slight ipsilateral oblique, often 10–20° LAO, is used for the renal ostia. The lateral projection is for the mesenteric ostia. On the lateral sketch a renal ostium looks like a short posterior stem. An accessory renal artery has its own card and is a segmental end artery.'
    },
    hit: { x: 200, y: 300 },
    hits: { ap: { x: 200, y: 300 }, lateral: { x: 150, y: 316 }, oblique: { x: 160, y: 338 } },
    label: { tr: 'Renal', en: 'Renal', x: 120, y: 276, anchor: 'end' },
    draw: {
      ap: [
        line('artery', [[358, 300], [250, 292], [140, 312], [72, 332]], 10),
        line('artery', [[358, 268], [480, 252], [590, 272], [660, 292]], 10)
      ],
      lateral: [line('branch', [[208, 300], [140, 318], [80, 332]], 8)],
      oblique: [
        line('artery', [[252, 310], [150, 340], [70, 360]], 9),
        line('artery', [[268, 278], [420, 250], [560, 232], [650, 244]], 9)
      ]
    }
  }),
  S({
    id: 'accessory-renal',
    view: 'visceral',
    modes: MODES,
    kind: 'variant',
    name: { tr: 'Aksesuar renal arter', en: 'Accessory renal artery' },
    text: {
      tr: 'Aksesuar renal arter kabaca dört kişiden birinde, bazı serilerde üçte bire varan sıklıkta görülür. Aorttan ayrı bir ostiumla, ana renalin üstünden veya altından çıkar ve böbreğin bir segmentine gider. Segmental uç arterdir. Dallar arasında kapsül içi kollateral beklenmez.',
      en: 'An accessory renal artery is present in about one person in four, and in some series up to one in three. It leaves the aorta through its own ostium, above or below the main renal artery, and supplies one renal segment. It is a segmental end artery. Intracapsular collaterals between segments are not expected.'
    },
    pearl: {
      tr: 'Alt polar arter üreteri çaprazlayabilir. Stent veya aort grefti bu ostiumu örterse segmental infarkt olur. Gonadal arterle karıştırılmamalıdır: aksesuar böbreğe girer, gonadal aşağı iner. Kesik çizgi varyantı gösterir. Her hastada yoktur.',
      en: 'A lower polar artery can cross the ureter. If a stent or an aortic graft covers this ostium, that segment infarcts. Do not confuse it with the gonadal artery: the accessory vessel enters the kidney, while the gonadal artery continues downward. The dashed line marks a variant. It is not present in every patient.'
    },
    hit: { x: 220, y: 388 },
    hits: { ap: { x: 220, y: 388 }, lateral: { x: 150, y: 386 }, oblique: { x: 170, y: 406 } },
    label: { tr: 'Aksesuar renal', en: 'Accessory renal', x: 96, y: 424 },
    draw: {
      ap: [line('variant', [[356, 372], [240, 392], [130, 414]], 6)],
      lateral: [line('variant', [[206, 370], [140, 390], [90, 402]], 5)],
      oblique: [line('variant', [[258, 378], [160, 408], [90, 428]], 5)]
    }
  }),
  S({
    id: 'gonadal',
    view: 'visceral',
    modes: MODES,
    kind: 'small',
    name: { tr: 'Gonadal arterler', en: 'Gonadal arteries' },
    text: {
      tr: 'Testiküler veya ovaryan arterler, renal arterlerin hemen altında aortun ön-yan yüzünden ince dallar olarak çıkar. Üreterle birlikte aşağı iner. Her iki taraf tek karttadır. Venöz dönüş farklıdır: sağ gonadal ven IVC\'ye, sol gonadal ven sol renal vene açılır.',
      en: 'The testicular or ovarian arteries are slim branches from the anterolateral aorta just below the renal arteries. They descend with the ureters. Both sides share one card. Venous drainage differs: the right gonadal vein enters the IVC, and the left gonadal vein enters the left renal vein.'
    },
    pearl: {
      tr: 'AP\'de alt polar renal arter sanılabilir. Gonadal arter böbreğe girmeden aşağı devam eder. Polar arter hilusa veya kutba gider ve uç arterdir. Bu şema veni çizmez. Sol renal ven varyantı aranırken bu ayrım hatırlanır.',
      en: 'On AP it can be mistaken for a lower polar renal artery. The gonadal artery continues downward without entering the kidney. A polar artery goes to the hilum or a pole and is an end artery. This schematic does not draw the vein. The distinction matters when a left renal vein variant is being sought.'
    },
    hit: { x: 300, y: 480 },
    hits: { ap: { x: 300, y: 480 }, lateral: { x: 270, y: 410 }, oblique: { x: 210, y: 500 } },
    label: { tr: 'Gonadal', en: 'Gonadal', x: 250, y: 560, anchor: 'end' },
    draw: {
      ap: [
        line('small', [[348, 338], [300, 460], [272, 630]], 4),
        line('small', [[368, 328], [430, 470], [468, 650]], 4)
      ],
      lateral: [line('small', [[212, 340], [280, 400], [300, 500]], 4)],
      oblique: [
        line('small', [[262, 356], [200, 500], [184, 640]], 4),
        line('small', [[286, 348], [360, 500], [404, 660]], 4)
      ]
    }
  })
];

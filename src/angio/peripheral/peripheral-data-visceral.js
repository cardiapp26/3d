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
    hit: { x: 360, y: 100 },
    hits: { ap: { x: 360, y: 100 }, lateral: { x: 200, y: 100 }, oblique: { x: 340, y: 48 } },
    label: { tr: 'Aort', en: 'Aorta', x: 392, y: 78, to: [360, 78] },
    labels: {
      lateral: { tr: 'Aort', en: 'Aorta', x: 40, y: 90, to: [200, 90] },
      oblique: { tr: 'Aort', en: 'Aorta', x: 480, y: 78, to: [324, 90] }
    },
    draw: {
      ap: [line('trunk', [[360, 40], [360, 780]], 22)],
      lateral: [line('trunk', [[200, 40], [200, 780]], 22)],
      oblique: [line('trunk', [[340, 48], [300, 150], [270, 280], [300, 450], [324, 580], [300, 760]], 20)]
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
    hit: { x: 404, y: 144 },
    hits: { ap: { x: 404, y: 144 }, lateral: { x: 340, y: 118 }, oblique: { x: 255, y: 137 } },
    label: { tr: 'Çölyak', en: 'Celiac', x: 392, y: 112, to: [410, 145] },
    labels: {
      lateral: { tr: 'Çölyak', en: 'Celiac', x: 360, y: 70, to: [340, 118] },
      oblique: { tr: 'Çölyak', en: 'Celiac', x: 230, y: 86, to: [255, 136] }
    },
    draw: {
      ap: [line('artery', [[360, 148], [448, 140]], 12)],
      lateral: [line('artery', [[200, 156], [340, 118], [500, 76]], 12)],
      oblique: [line('artery', [[300, 150], [210, 124]], 10)]
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
    hit: { x: 560, y: 78 },
    hits: { ap: { x: 560, y: 78 }, lateral: { x: 545, y: 56 }, oblique: { x: 200, y: 70 } },
    label: { tr: 'Sol gastrik', en: 'Left gastric', x: 560, y: 36, to: [600, 62] },
    labels: {
      lateral: { tr: 'Sol gastrik', en: 'Left gastric', x: 700, y: 58, anchor: 'end', to: [560, 52] },
      oblique: { tr: 'Sol gastrik', en: 'Left gastric', x: 24, y: 48, to: [230, 55] }
    },
    draw: {
      ap: [line('branch', [[448, 140], [560, 78], [640, 44]], 7)],
      lateral: [line('branch', [[500, 76], [590, 36]], 7)],
      oblique: [line('branch', [[210, 124], [200, 70], [280, 36]], 6)]
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
    hit: { x: 600, y: 154 },
    hits: { ap: { x: 600, y: 154 }, lateral: { x: 370, y: 164 }, oblique: { x: 275, y: 167 } },
    label: { tr: 'Splenik', en: 'Splenic', x: 500, y: 236, to: [560, 190] },
    labels: {
      lateral: { tr: 'Splenik', en: 'Splenic', x: 420, y: 230, to: [390, 200] },
      oblique: { tr: 'Splenik', en: 'Splenic', x: 400, y: 236, to: [320, 190] }
    },
    draw: {
      ap: [line('artery', [[448, 140], [540, 206], [600, 154], [642, 188]], 9)],
      lateral: [line('branch', [[340, 118], [400, 210]], 8)],
      oblique: [line('branch', [[210, 124], [340, 210]], 7)]
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
    hit: { x: 260, y: 198 },
    hits: { ap: { x: 260, y: 198 }, lateral: { x: 415, y: 152 }, oblique: { x: 200, y: 160 } },
    label: { tr: 'A. hepatica comm.', en: 'Common hepatic', x: 200, y: 158, to: [330, 178] },
    labels: {
      lateral: { tr: 'A. hepatica comm.', en: 'Common hepatic', x: 500, y: 210, to: [470, 180] },
      oblique: { tr: 'A. hepatica comm.', en: 'Common hepatic', x: 24, y: 100, to: [208, 132] }
    },
    draw: {
      ap: [line('artery', [[448, 140], [390, 176], [260, 198], [206, 204]], 9)],
      lateral: [line('artery', [[340, 118], [490, 186]], 8)],
      oblique: [line('artery', [[210, 124], [190, 196]], 7)]
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
    hit: { x: 168, y: 150 },
    hits: { ap: { x: 168, y: 150 }, lateral: { x: 525, y: 141 }, oblique: { x: 130, y: 186 } },
    label: { tr: 'A. hepatica propria', en: 'Proper hepatic', x: 36, y: 200, to: [172, 156] },
    labels: {
      lateral: { tr: 'A. hepatica propria', en: 'Proper hepatic', x: 500, y: 90, to: [540, 110] },
      oblique: { tr: 'A. hepatica propria', en: 'Proper hepatic', x: 24, y: 156, to: [130, 186] }
    },
    draw: {
      ap: [line('artery', [[206, 204], [168, 150], [150, 108]], 8)],
      lateral: [line('artery', [[490, 186], [560, 96]], 7)],
      oblique: [line('artery', [[190, 196], [70, 175]], 6)]
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
    hit: { x: 168, y: 268 },
    hits: { ap: { x: 168, y: 268 }, lateral: { x: 472, y: 248 }, oblique: { x: 190, y: 253 } },
    label: { tr: 'GDA', en: 'GDA', x: 236, y: 268, to: [192, 250] },
    labels: {
      lateral: { tr: 'GDA', en: 'GDA', x: 430, y: 280, to: [460, 280] },
      oblique: { tr: 'GDA', en: 'GDA', x: 24, y: 276, to: [190, 250] }
    },
    draw: {
      ap: [line('branch', [[206, 204], [168, 268], [176, 308]], 7)],
      lateral: [line('branch', [[490, 186], [455, 310]], 7)],
      oblique: [line('branch', [[190, 196], [190, 310]], 6)]
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
    hit: { x: 560, y: 450 },
    hits: { ap: { x: 560, y: 450 }, lateral: { x: 380, y: 310 }, oblique: { x: 240, y: 420 } },
    label: { tr: 'SMA', en: 'SMA', x: 620, y: 500, to: [570, 500] },
    labels: {
      lateral: { tr: 'SMA', en: 'SMA', x: 400, y: 360, to: [380, 320] },
      oblique: { tr: 'SMA', en: 'SMA', x: 24, y: 420, to: [240, 400] }
    },
    draw: {
      ap: [line('artery', [[360, 206], [470, 310], [560, 450], [580, 650], [560, 770]], 11)],
      lateral: [line('artery', [[200, 224], [380, 310], [540, 430]], 11)],
      oblique: [line('artery', [[270, 280], [240, 420], [210, 540]], 9)]
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
    hit: { x: 420, y: 660 },
    hits: { ap: { x: 420, y: 660 }, lateral: { x: 255, y: 604 }, oblique: { x: 387, y: 610 } },
    label: { tr: 'IMA', en: 'IMA', x: 440, y: 730, to: [405, 700] },
    labels: {
      lateral: { tr: 'IMA', en: 'IMA', x: 250, y: 700, to: [290, 640] },
      oblique: { tr: 'IMA', en: 'IMA', x: 470, y: 640, to: [430, 630] }
    },
    draw: {
      ap: [line('branch', [[360, 560], [420, 660], [390, 750]], 8)],
      lateral: [line('branch', [[200, 548], [310, 660]], 7)],
      oblique: [line('branch', [[324, 580], [450, 640]], 7)]
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
    hit: { x: 200, y: 386 },
    hits: { ap: { x: 200, y: 386 }, lateral: { x: 135, y: 314 }, oblique: { x: 365, y: 460 } },
    label: { tr: 'Renal', en: 'Renal', x: 36, y: 348, to: [230, 360] },
    labels: {
      lateral: { tr: 'Renal', en: 'Renal', x: 40, y: 300, to: [120, 318] },
      oblique: { tr: 'Renal', en: 'Renal', x: 470, y: 430, to: [400, 450] }
    },
    draw: {
      ap: [
        line('artery', [[360, 272], [280, 334], [200, 386], [140, 430]], 8),
        line('artery', [[360, 255], [480, 288], [550, 308], [586, 320]], 8)
      ],
      lateral: [line('artery', [[200, 300], [70, 328]], 8)],
      oblique: [line('artery', [[300, 450], [430, 470]], 7)]
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
    hit: { x: 160, y: 452 },
    hits: { ap: { x: 160, y: 452 }, lateral: { x: 140, y: 398 }, oblique: { x: 375, y: 530 } },
    label: { tr: 'Aksesuar renal', en: 'Accessory renal', x: 36, y: 520, to: [200, 430] },
    labels: {
      lateral: { tr: 'Aksesuar renal', en: 'Accessory renal', x: 40, y: 500, to: [150, 400] },
      oblique: { tr: 'Aksesuar renal', en: 'Accessory renal', x: 470, y: 560, to: [420, 530] }
    },
    draw: {
      ap: [line('variant', [[360, 368], [240, 420], [160, 452], [118, 448]], 6)],
      lateral: [line('variant', [[200, 378], [80, 418]], 6)],
      oblique: [line('variant', [[310, 520], [440, 540]], 6)]
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
    hit: { x: 280, y: 580 },
    hits: { ap: { x: 280, y: 580 }, lateral: { x: 370, y: 530 }, oblique: { x: 364, y: 715 } },
    label: { tr: 'Gonadal', en: 'Gonadal', x: 168, y: 640, anchor: 'end', to: [280, 600] },
    labels: {
      lateral: { tr: 'Gonadal', en: 'Gonadal', x: 460, y: 680, to: [390, 660] },
      oblique: { tr: 'Gonadal', en: 'Gonadal', x: 470, y: 720, to: [400, 720] }
    },
    draw: {
      ap: [
        line('small', [[346, 438], [280, 580], [240, 750]]),
        line('small', [[374, 400], [470, 470], [470, 750]])
      ],
      lateral: [line('small', [[200, 448], [370, 530], [410, 740]])],
      oblique: [line('small', [[308, 680], [420, 750]])]
    }
  })
];

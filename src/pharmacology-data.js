// Original bilingual educational summaries with label examples, not patient-specific dosing or prescribing decisions.
export const PHARMA_SOURCES = [
  {
    "id": "slides",
    "title": "Drugs that Affect the Cardiovascular System",
    "detail": {
      "tr": "Belge sayfaları 34–54 (kan basıncı/diüretikler), 66–68 (antikoagülanlar); sayfa numaraları PDF sırasıdır.",
      "en": "Document pages 34–54 (blood pressure/diuretics), 66–68 (anticoagulants); page numbers follow PDF order."
    }
  },
  {
    "id": "review",
    "title": "Lippincott Illustrated Reviews: Pharmacology · Karen Whalen (7th edition)",
    "detail": {
      "tr": "Belge s. 16–38 (antihipertansifler), 58–83 (diüretikler), 100–118 (kalp yetersizliği), 120–153 (antiaritmikler), 161–175 (anjina), 193–227 (antitrombotikler), 240–252 (lipitler). PDF sırası; basılı sayfalar farklıdır.",
      "en": "Lippincott Illustrated Reviews: Pharmacology, Karen Whalen. Document pages 16–38 (antihypertensives), 58–83 (diuretics), 100–118 (heart failure), 120–153 (antiarrhythmics), 161–175 (angina), 193–227 (antithrombotics), 240–252 (lipids). PDF order differs from printed pages."
    }
  },
  {
    "id": "wiki",
    "title": "Textbook of Cardiology: Cardiac Pharmacology",
    "detail": {
      "tr": "Mekanizma ve ilaç sınıfları için çevrimiçi kaynak; eski/genelleyici güvenlik ifadeleri güncel birincil kaynaklarla kontrol edildi. Erişim: 4 Ekim 2026.",
      "en": "Online mechanisms and drug classes; outdated or broad safety statements cross-checked with primary sources. Accessed: 4 October 2026."
    },
    "url": "https://www.textbookofcardiology.org/wiki/Cardiac_Pharmacology"
  },
  {
    "id": "hf-guideline",
    "title": "2022 AHA/ACC/HFSA Heart Failure Guideline",
    "detail": {
      "tr": "HFrEF hastalık seyrini değiştiren dört ilaç sınıfı. Erişim: 4 Ekim 2026.",
      "en": "Four disease-modifying classes in HFrEF. Accessed: 4 October 2026."
    },
    "url": "https://professional.heart.org/en/science-news/2022-guideline-for-the-management-of-heart-failure"
  },
  {
    "id": "arni-label",
    "title": "DailyMed: ENTRESTO prescribing information",
    "detail": {
      "tr": "ACE inhibitörü ile birlikte kullanım kontrendike; iki yönde geçişte en az 36 saat ara. Erişim: 4 Ekim 2026.",
      "en": "Concurrent ACE inhibitor use contraindicated; at least 36 hours between therapies in either direction. Accessed: 4 October 2026."
    },
    "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?lang=en&setid=000dc81d-ab91-450c-8eae-8eb74e72296f"
  },
  {
    "id": "digoxin-label",
    "title": "DailyMed: Digoxin prescribing information",
    "detail": {
      "tr": "Dar terapötik aralık, böbrek işlevi, hipokalemi/hipomagnezemi ve toksisite. Erişim: 4 Ekim 2026.",
      "en": "Narrow therapeutic window, renal function, hypokalemia/hypomagnesemia and toxicity. Accessed: 4 October 2026."
    },
    "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=48cad559-c17b-4d41-a154-e664e958c1c0"
  },
  {
    "id": "sotalol-label",
    "title": "DailyMed: Sotalol prescribing information",
    "detail": {
      "tr": "QT, böbrek işlevi, potasyum/magnezyum ve proaritmi. Erişim: 4 Ekim 2026.",
      "en": "QT, renal function, potassium/magnesium and proarrhythmia. Accessed: 4 October 2026."
    },
    "url": "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=282b48b2-f9ff-474a-b01e-68a9ce5edf07"
  },
  {
    "id": "flecainide-label",
    "title": "DailyMed: Flecainide prescribing information",
    "detail": {
      "tr": "Yapısal kalp hastalığı olmayan hastalardaki endikasyonlar ve miyokart enfarktüsü sonrası CAST güvenlik uyarısı. Erişim: 4 Ekim 2026.",
      "en": "Indications without structural heart disease and post-MI CAST safety warning. Accessed: 4 October 2026."
    },
    "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=74355cd2-b50e-0dc2-e053-2a91aa0aa164"
  },
  {
    "id": "action-slides",
    "title": "Action potentials / drugs (PPTX)",
    "detail": {
      "tr": "Sunum: slayt 2–3 (uyarılabilirlik, iyonlar), 5–11 (iletim sistemi ve düğüm hücrelerinde Ca bağımlı depolarizasyon). Metni olmayan slaytlardan ek iddia çıkarılmadı.",
      "en": "Slide deck: slides 2–3 (electrical properties and ions), 5–11 (conduction system and Ca-dependent nodal depolarization). Image-only slides not inferred."
    }
  },
  {
    "id": "antiarrhythmic-slides",
    "title": "Antiaritmikler (PPTX)",
    "detail": {
      "tr": "Sunum: slayt 7–10 (Vaughan Williams ve sınıf IC), 11 (amiodaron), 15–17 (QT, renal eliminasyon, digoksin). Sotalol/LV disfonksiyonu ve amiodaron güvenliği genellemeleri güncel etiketle sınırlandı; olgu slaytlarındaki QRS birim hataları aktarılmadı.",
      "en": "Slide deck: slides 7–10 (Vaughan Williams and class IC), 11 (amiodarone), 15–17 (QT, renal elimination, digoxin). Broad sotalol/LV dysfunction and amiodarone safety statements constrained by current labels; QRS unit errors in case slides not carried over."
    }
  },
  {
    "id": "adenosine-label",
    "title": "DailyMed: adenosine prescribing information",
    "detail": {
      "tr": "Mekanizma, kullanım ve güvenlik doğrulaması. Erişim: 6 Ekim 2026.",
      "en": "Mechanism, context and safety verification. Accessed: 6 October 2026."
    },
    "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=91a601ab-d3cc-4013-9108-1b5432476076"
  },
  {
    "id": "als-guideline",
    "title": "AHA: Adult Advanced Life Support",
    "detail": {
      "tr": "Mekanizma, kullanım ve güvenlik doğrulaması. Erişim: 6 Ekim 2026.",
      "en": "Mechanism, context and safety verification. Accessed: 6 October 2026."
    },
    "url": "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-advanced-life-support"
  },
  {
    "id": "dofetilide-label",
    "title": "DailyMed: dofetilide prescribing information",
    "detail": {
      "tr": "Mekanizma, kullanım ve güvenlik doğrulaması. Erişim: 6 Ekim 2026.",
      "en": "Mechanism, context and safety verification. Accessed: 6 October 2026."
    },
    "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=02438044-d6a3-49e9-a1ac-3aad21ef2c8c"
  },
  {
    "id": "dronedarone-label",
    "title": "DailyMed: dronedarone prescribing information",
    "detail": {
      "tr": "Mekanizma, kullanım ve güvenlik doğrulaması. Erişim: 6 Ekim 2026.",
      "en": "Mechanism, context and safety verification. Accessed: 6 October 2026."
    },
    "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7fa41601-7fb5-4155-8e50-2ae903f0d2d6"
  },
  {
    "id": "mexiletine-label",
    "title": "DailyMed: mexiletine prescribing information",
    "detail": {
      "tr": "Mekanizma, kullanım ve güvenlik doğrulaması. Erişim: 6 Ekim 2026.",
      "en": "Mechanism, context and safety verification. Accessed: 6 October 2026."
    },
    "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=e2c0430d-35ee-460c-b0d5-f117d43430c5"
  },
  {
    "id": "quinidine-label",
    "title": "DailyMed: quinidine prescribing information",
    "detail": {
      "tr": "Mekanizma, kullanım ve güvenlik doğrulaması. Erişim: 6 Ekim 2026.",
      "en": "Mechanism, context and safety verification. Accessed: 6 October 2026."
    },
    "url": "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=a10b6ded-4fe0-4059-bd77-c45acc3c876d"
  },
  {
    "id": "va-guideline",
    "title": "2017 AHA/ACC/HRS Ventricular Arrhythmia Guideline",
    "detail": {
      "tr": "Mekanizma, kullanım ve güvenlik doğrulaması. Erişim: 6 Ekim 2026.",
      "en": "Mechanism, context and safety verification. Accessed: 6 October 2026."
    },
    "url": "https://www.heartrhythmjournal.com/article/S1547-5271%2817%2931250-X/fulltext"
  }
];

export const PHARMA_TOPICS = [
  {
    "id": "principles",
    "title": {
      "tr": "Temel ilkeler: PK / PD",
      "en": "Principles: PK / PD"
    },
    "intro": {
      "tr": "İlaç düzeyi, hedef yanıt ve güvenlik birlikte değerlendirilir.",
      "en": "Drug exposure, target response and safety belong together."
    },
    "cards": [
      {
        "id": "clearance",
        "name": {
          "tr": "Klirens ve birikim",
          "en": "Clearance and accumulation"
        },
        "examples": {
          "tr": "Digoksin, sotalol",
          "en": "Digoxin, sotalol"
        },
        "mechanism": {
          "tr": "Eliminasyon azalınca aynı maruziyet planında ilaç birikebilir.",
          "en": "Reduced elimination can increase exposure under an unchanged regimen."
        },
        "use": {
          "tr": "Böbrek işlevinin ilaç etkisini neden değiştirdiğini açıklar.",
          "en": "Explains why renal function changes drug effects."
        },
        "risk": {
          "tr": "Birikim bradikardi veya proaritmiye yol açabilir.",
          "en": "Accumulation can cause bradycardia or proarrhythmia."
        },
        "monitor": {
          "tr": "Böbrek işlevi, EKG ve ilaca özgü düzey ölçümü.",
          "en": "Renal function, ECG and drug-specific level assessment."
        },
        "target": "kidney",
        "sources": [
          "review"
        ]
      },
      {
        "id": "receptors",
        "name": {
          "tr": "Reseptör ve kanal hedefleri",
          "en": "Receptor and channel targets"
        },
        "examples": {
          "tr": "Beta bloker, kalsiyum kanal blokeri",
          "en": "Beta blocker, calcium channel blocker"
        },
        "mechanism": {
          "tr": "Reseptör antagonizması ile iyon kanalı blokajı farklı hedeflere etki eder.",
          "en": "Receptor antagonism and ion-channel blockade act on different targets."
        },
        "use": {
          "tr": "Nabız, iletim ve damar direnci üzerindeki farkları açıklar.",
          "en": "Explains differences in rate, conduction and vascular resistance."
        },
        "risk": {
          "tr": "Benzer fizyolojik etkiler birleşince yan etki artabilir.",
          "en": "Combining similar physiological effects can increase adverse effects."
        },
        "monitor": {
          "tr": "Nabız, kan basıncı ve PR aralığı.",
          "en": "Heart rate, blood pressure and PR interval."
        },
        "target": "av",
        "sources": [
          "review",
          "wiki",
          "action-slides"
        ]
      },
      {
        "id": "therapeutic-window",
        "name": {
          "tr": "Terapötik pencere",
          "en": "Therapeutic window"
        },
        "examples": {
          "tr": "Digoksin",
          "en": "Digoxin"
        },
        "mechanism": {
          "tr": "Etkili ve toksik maruziyet aralığı birbirine yakındır.",
          "en": "Effective and toxic exposure ranges are close."
        },
        "use": {
          "tr": "Serum düzeyinin klinik bağlamla yorumlanmasını öğretir.",
          "en": "Teaches interpretation of serum levels in clinical context."
        },
        "risk": {
          "tr": "Hipokalemide görünürde uygun düzeyde bile toksisite olabilir.",
          "en": "Hypokalemia can permit toxicity at apparently acceptable levels."
        },
        "monitor": {
          "tr": "K, Mg, böbrek işlevi, ritim ve örnekleme zamanı.",
          "en": "K, Mg, renal function, rhythm and sampling time."
        },
        "target": "lv",
        "sources": [
          "review"
        ]
      },
      {
        "id": "action-potential",
        "name": {
          "tr": "Aksiyon potansiyeli ve ilaç hedefi",
          "en": "Action potential and drug target"
        },
        "examples": {
          "tr": "Sınıf I, II, III ve IV",
          "en": "Classes I, II, III and IV"
        },
        "mechanism": {
          "tr": "Çalışan miyosit: faz 0 hızlı Na, faz 2 Ca platosu, faz 3 K repolarizasyonu. SA/AV düğüm faz 0 Ca bağımlıdır.",
          "en": "Working myocyte: fast Na phase 0, Ca plateau phase 2, K repolarization phase 3. SA/AV nodal phase 0 is Ca-dependent."
        },
        "use": {
          "tr": "Na blokerinin QRS, K blokerinin QT, düğüm baskısının hız/PR etkisini bağlar.",
          "en": "Connects Na blockade with QRS, K blockade with QT, nodal suppression with rate/PR."
        },
        "risk": {
          "tr": "Ventrikül ile düğüm aksiyon potansiyelleri aynı değildir; sınıflar kusursuz tek hedef grupları değildir.",
          "en": "Ventricular and nodal action potentials differ; drug classes are not perfect single-target groups."
        },
        "monitor": {
          "tr": "EKG hız, PR, QRS ve QTc; hücre tipiyle birlikte yorumlama.",
          "en": "ECG rate, PR, QRS and QTc; interpretation with cell type."
        },
        "target": "lv",
        "sources": [
          "review",
          "action-slides",
          "antiarrhythmic-slides"
        ]
      }
    ]
  },
  {
    "id": "antihypertensives",
    "title": {
      "tr": "Antihipertansifler",
      "en": "Antihypertensives"
    },
    "intro": {
      "tr": "Damar direnci, kalp debisi ve RAAS farklı hedeflerdir.",
      "en": "Vascular resistance, cardiac output and RAAS are different targets."
    },
    "cards": [
      {
        "id": "acei",
        "name": {
          "tr": "ACE inhibitörleri",
          "en": "ACE inhibitors"
        },
        "examples": {
          "tr": "Enalapril, lisinopril",
          "en": "Enalapril, lisinopril"
        },
        "mechanism": {
          "tr": "Anjiyotensin II oluşumunu azaltır; bradikinin yıkımını azaltır.",
          "en": "Reduce angiotensin II formation and bradykinin breakdown."
        },
        "use": {
          "tr": "Hipertansiyon ve seçilmiş kalp yetersizliği bağlamları.",
          "en": "Hypertension and selected heart-failure settings."
        },
        "risk": {
          "tr": "Öksürük, anjiyoödem, hiperkalemi; gebelikte kullanılmaz.",
          "en": "Cough, angioedema, hyperkalemia; avoid in pregnancy."
        },
        "monitor": {
          "tr": "Kan basıncı, kreatinin ve K.",
          "en": "Blood pressure, creatinine and K."
        },
        "target": "aorta",
        "sources": [
          "review",
          "slides"
        ]
      },
      {
        "id": "arb",
        "name": {
          "tr": "Anjiyotensin reseptör blokerleri",
          "en": "Angiotensin receptor blockers"
        },
        "examples": {
          "tr": "Losartan, valsartan",
          "en": "Losartan, valsartan"
        },
        "mechanism": {
          "tr": "AT1 reseptörünü bloke eder; bradikinini doğrudan artırmaz.",
          "en": "Block AT1 receptors without directly increasing bradykinin."
        },
        "use": {
          "tr": "Hipertansiyon; uygun hastada RAAS inhibisyonu.",
          "en": "Hypertension; RAAS inhibition in suitable patients."
        },
        "risk": {
          "tr": "Hiperkalemi ve böbrek işlev değişimi; gebelikte kullanılmaz.",
          "en": "Hyperkalemia and renal function changes; avoid in pregnancy."
        },
        "monitor": {
          "tr": "Kan basıncı, böbrek işlevi ve K.",
          "en": "Blood pressure, renal function and K."
        },
        "target": "aorta",
        "sources": [
          "review"
        ]
      },
      {
        "id": "dhp",
        "name": {
          "tr": "Dihidropiridin kalsiyum blokerleri",
          "en": "Dihydropyridine calcium blockers"
        },
        "examples": {
          "tr": "Amlodipin, nifedipin",
          "en": "Amlodipine, nifedipine"
        },
        "mechanism": {
          "tr": "Damar düz kasında L tipi Ca kanallarını baskılar.",
          "en": "Inhibit L-type Ca channels predominantly in vascular smooth muscle."
        },
        "use": {
          "tr": "Hipertansiyon ve anjina; AV düğüm hız kontrolü sağlamaz.",
          "en": "Hypertension and angina; do not provide AV-nodal rate control."
        },
        "risk": {
          "tr": "Periferik ödem, baş ağrısı, hipotansiyon.",
          "en": "Peripheral edema, headache, hypotension."
        },
        "monitor": {
          "tr": "Kan basıncı, ödem ve semptomlar.",
          "en": "Blood pressure, edema and symptoms."
        },
        "target": "aorta",
        "sources": [
          "review"
        ]
      },
      {
        "id": "non-dhp",
        "name": {
          "tr": "Non-DHP kalsiyum blokerleri",
          "en": "Non-DHP calcium blockers"
        },
        "examples": {
          "tr": "Verapamil, diltiazem",
          "en": "Verapamil, diltiazem"
        },
        "mechanism": {
          "tr": "AV iletimini yavaşlatır; kontraktiliteyi azaltır.",
          "en": "Slow AV conduction and reduce contractility."
        },
        "use": {
          "tr": "Seçilmiş supraventriküler ritimler ve anjina.",
          "en": "Selected supraventricular rhythms and angina."
        },
        "risk": {
          "tr": "Bradikardi, AV blok; HFrEF bağlamında zararlı olabilir.",
          "en": "Bradycardia, AV block; can be harmful in HFrEF."
        },
        "monitor": {
          "tr": "Nabız, PR aralığı, kan basıncı, ventrikül işlevi.",
          "en": "Heart rate, PR interval, blood pressure, ventricular function."
        },
        "target": "av",
        "sources": [
          "review"
        ]
      }
    ]
  },
  {
    "id": "diuretics",
    "title": {
      "tr": "Diüretikler",
      "en": "Diuretics"
    },
    "intro": {
      "tr": "Nefron hedefi elektrolit etkisini belirler; hacim azalması konjesyonu hafifletir.",
      "en": "Nephron target determines electrolyte effects; volume reduction relieves congestion."
    },
    "cards": [
      {
        "id": "loop",
        "name": {
          "tr": "Loop diüretikleri",
          "en": "Loop diuretics"
        },
        "examples": {
          "tr": "Furosemid, torsemid",
          "en": "Furosemide, torsemide"
        },
        "mechanism": {
          "tr": "Henle kalın çıkan kolda NKCC2 taşıyıcısını inhibe eder.",
          "en": "Inhibit NKCC2 in the thick ascending limb."
        },
        "use": {
          "tr": "Kalp yetersizliğinde konjesyon ve ödem.",
          "en": "Congestion and edema in heart failure."
        },
        "risk": {
          "tr": "Hipokalemi, hipomagnezemi, hacim kaybı.",
          "en": "Hypokalemia, hypomagnesemia, volume depletion."
        },
        "monitor": {
          "tr": "Kilo, sıvı dengesi, K, Mg ve böbrek işlevi.",
          "en": "Weight, fluid balance, K, Mg and renal function."
        },
        "target": "kidney",
        "sources": [
          "review",
          "slides"
        ]
      },
      {
        "id": "thiazide",
        "name": {
          "tr": "Tiyazid ve benzerleri",
          "en": "Thiazides and related drugs"
        },
        "examples": {
          "tr": "Hidroklorotiyazid, klortalidon",
          "en": "Hydrochlorothiazide, chlorthalidone"
        },
        "mechanism": {
          "tr": "Distal tübülde Na/Cl geri emilimini azaltır.",
          "en": "Reduce distal-tubule Na/Cl reabsorption."
        },
        "use": {
          "tr": "Hipertansiyon; seçilmiş dirençli konjesyon durumları.",
          "en": "Hypertension; selected resistant-congestion settings."
        },
        "risk": {
          "tr": "Hiponatremi, hipokalemi, hiperürisemi.",
          "en": "Hyponatremia, hypokalemia, hyperuricemia."
        },
        "monitor": {
          "tr": "Na, K, böbrek işlevi ve kan basıncı.",
          "en": "Na, K, renal function and blood pressure."
        },
        "target": "kidney",
        "sources": [
          "review"
        ]
      },
      {
        "id": "enac",
        "name": {
          "tr": "ENaC blokerleri",
          "en": "ENaC blockers"
        },
        "examples": {
          "tr": "Amilorid, triamteren",
          "en": "Amiloride, triamterene"
        },
        "mechanism": {
          "tr": "Toplayıcı kanalda epitel sodyum kanalını bloke eder.",
          "en": "Block epithelial sodium channels in the collecting duct."
        },
        "use": {
          "tr": "Potasyum kaybını azaltan seçilmiş kombinasyonlar.",
          "en": "Selected combinations that reduce potassium loss."
        },
        "risk": {
          "tr": "Hiperkalemi; MRA ile aynı mekanizma değildir.",
          "en": "Hyperkalemia; mechanism differs from MRAs."
        },
        "monitor": {
          "tr": "K, böbrek işlevi ve birlikte kullanılan RAAS ilaçları.",
          "en": "K, renal function and concurrent RAAS drugs."
        },
        "target": "kidney",
        "sources": [
          "review"
        ]
      }
    ]
  },
  {
    "id": "heart-failure",
    "title": {
      "tr": "Kalp yetersizliği",
      "en": "Heart failure"
    },
    "intro": {
      "tr": "Kronik HFrEF temel ilaçları ile semptomatik hacim tedavisi farklı amaçlara sahiptir.",
      "en": "Foundational chronic HFrEF therapy and symptomatic volume treatment have different goals."
    },
    "cards": [
      {
        "id": "arni",
        "name": {
          "tr": "ARNI",
          "en": "ARNI"
        },
        "examples": {
          "tr": "Sakubitril / valsartan",
          "en": "Sacubitril / valsartan"
        },
        "mechanism": {
          "tr": "Neprilisin inhibisyonunu AT1 blokajı ile birleştirir.",
          "en": "Combines neprilysin inhibition with AT1 blockade."
        },
        "use": {
          "tr": "Kronik HFrEF hastalık seyrini değiştiren tedavi sınıfı.",
          "en": "Disease-modifying therapy class in chronic HFrEF."
        },
        "risk": {
          "tr": "Hipotansiyon, hiperkalemi, anjiyoödem; ACE inhibitörüyle birlikte kullanılmaz.",
          "en": "Hypotension, hyperkalemia, angioedema; contraindicated with ACE inhibitors."
        },
        "monitor": {
          "tr": "Kan basıncı, K, böbrek işlevi; ACEi geçişinde en az 36 saat ara.",
          "en": "Blood pressure, K, renal function; at least 36-hour ACEi washout."
        },
        "target": "lv",
        "sources": [
          "review",
          "arni-label"
        ]
      },
      {
        "id": "hf-beta",
        "name": {
          "tr": "HFrEF beta blokerleri",
          "en": "HFrEF beta blockers"
        },
        "examples": {
          "tr": "Karvedilol, bisoprolol, metoprolol süksinat",
          "en": "Carvedilol, bisoprolol, metoprolol succinate"
        },
        "mechanism": {
          "tr": "Kronik sempatik uyarının kalp üzerindeki etkisini azaltır.",
          "en": "Reduce effects of chronic sympathetic stimulation on the heart."
        },
        "use": {
          "tr": "Stabil kronik HFrEF; akut şokta başlatma ilacı değildir.",
          "en": "Stable chronic HFrEF; not initiation therapy for acute shock."
        },
        "risk": {
          "tr": "Bradikardi, hipotansiyon; akut hemodinamik bozulmada yeniden değerlendirilir.",
          "en": "Bradycardia, hypotension; reassess during acute hemodynamic deterioration."
        },
        "monitor": {
          "tr": "Nabız, kan basıncı, konjesyon ve klinik stabilite.",
          "en": "Heart rate, blood pressure, congestion and clinical stability."
        },
        "target": "sa",
        "sources": [
          "review"
        ]
      },
      {
        "id": "mra",
        "name": {
          "tr": "Mineralokortikoid reseptör antagonistleri",
          "en": "Mineralocorticoid receptor antagonists"
        },
        "examples": {
          "tr": "Spironolakton, eplerenon",
          "en": "Spironolactone, eplerenone"
        },
        "mechanism": {
          "tr": "Aldosteron reseptörünü bloke eder.",
          "en": "Block aldosterone receptors."
        },
        "use": {
          "tr": "Uygun böbrek işlevi ve K ile kronik HFrEF.",
          "en": "Chronic HFrEF with suitable renal function and K."
        },
        "risk": {
          "tr": "Hiperkalemi; spironolaktonda jinekomasti.",
          "en": "Hyperkalemia; gynecomastia with spironolactone."
        },
        "monitor": {
          "tr": "K ve böbrek işlevi; potasyum artıran kombinasyonlar.",
          "en": "K and renal function; potassium-raising combinations."
        },
        "target": "kidney",
        "sources": [
          "review"
        ]
      },
      {
        "id": "sglt2",
        "name": {
          "tr": "SGLT2 inhibitörleri",
          "en": "SGLT2 inhibitors"
        },
        "examples": {
          "tr": "Dapagliflozin, empagliflozin",
          "en": "Dapagliflozin, empagliflozin"
        },
        "mechanism": {
          "tr": "Proksimal tübülde glukoz/sodyum geri emilimini azaltır; kalp yararı yalnız glukoz düşüşü değildir.",
          "en": "Reduce proximal glucose/sodium reabsorption; cardiac benefit is not solely glucose lowering."
        },
        "use": {
          "tr": "Kronik HFrEF: diyabet olsun veya olmasın klinik yarar.",
          "en": "Clinical benefit in chronic HFrEF with or without diabetes."
        },
        "risk": {
          "tr": "Hacim kaybı, genital enfeksiyon, nadir ketoasidoz.",
          "en": "Volume depletion, genital infection, rare ketoacidosis."
        },
        "monitor": {
          "tr": "Hacim durumu, böbrek işlevi ve akut hastalık bağlamı.",
          "en": "Volume status, renal function and acute-illness context."
        },
        "target": "kidney",
        "sources": [
          "hf-guideline"
        ]
      },
      {
        "id": "digoxin",
        "name": {
          "tr": "Digoksin",
          "en": "Digoxin"
        },
        "examples": {
          "tr": "Digoksin",
          "en": "Digoxin"
        },
        "mechanism": {
          "tr": "Na⁺/K⁺-ATPaz inhibisyonu → hücre içi Ca²⁺/inotropi artışı. Vagal etki AV iletimini yavaşlatır, nodal refrakterliği uzatır (PR uzar). Ventrikül/Purkinje’de refrakterlik kısalabilir; Ca²⁺ yükü özellikle toksisitede tetiklenmiş aktivite/otomatisiteyi artırır.",
          "en": "Na⁺/K⁺-ATPase inhibition → increased intracellular Ca²⁺/inotropy. Vagal effects slow AV conduction and prolong nodal refractoriness (longer PR). Ventricular/Purkinje refractoriness may shorten; Ca²⁺ loading promotes triggered activity/automaticity, especially in toxicity."
        },
        "use": {
          "tr": "Seçilmiş HF semptomları veya AF hız kontrolü; sağkalım ilacı değildir.",
          "en": "Selected HF symptoms or AF rate control; not a survival therapy."
        },
        "risk": {
          "tr": "Dar terapötik aralık; hipokalemi/hipomagnezemi duyarlılığı artırır. Toksisitede AV blok ile PVC, bigemini, çift yönlü VT veya VF birlikte görülebilir.",
          "en": "Narrow therapeutic window; hypokalemia/hypomagnesemia increase susceptibility. Toxicity may combine AV block with PVCs, bigeminy, bidirectional VT or VF."
        },
        "monitor": {
          "tr": "Ritim, böbrek işlevi, K, Mg ve gerektiğinde serum düzeyi.",
          "en": "Rhythm, renal function, K, Mg and serum level when indicated."
        },
        "target": "av",
        "sources": [
          "digoxin-label",
          "review",
          "antiarrhythmic-slides"
        ]
      }
    ]
  },
  {
    "id": "antiarrhythmics",
    "title": {
      "tr": "Antiaritmikler",
      "en": "Antiarrhythmics"
    },
    "intro": {
      "tr": "İletim ve refrakterlik değişimleri ritmi düzeltebilir veya proaritmi oluşturabilir.",
      "en": "Conduction and refractoriness changes can restore rhythm or cause proarrhythmia."
    },
    "cards": [
      {
        "id": "class-i",
        "name": {
          "tr": "Sınıf I: sodyum kanalı",
          "en": "Class I: sodium channels"
        },
        "examples": {
          "tr": "IA: prokainamid, kinidin; IB: lidokain, meksiletin; IC: flekainid, propafenon",
          "en": "IA: procainamide, quinidine; IB: lidocaine, mexiletine; IC: flecainide, propafenone"
        },
        "mechanism": {
          "tr": "Hızlı Na akımını baskılar; alt sınıflar iletim ve repolarizasyonda farklıdır.",
          "en": "Suppress fast Na current; subclasses differ in conduction and repolarization."
        },
        "use": {
          "tr": "Ritime ve kardiyak yapıya göre seçilen ajanlar.",
          "en": "Agents selected according to rhythm and cardiac substrate."
        },
        "risk": {
          "tr": "IC ajanlar iskemik/yapısal kalp hastalığında kaçınılır; proaritmi riski.",
          "en": "Avoid IC agents in ischemic/structural heart disease; proarrhythmia risk."
        },
        "monitor": {
          "tr": "EKG: QRS/PR; IA için QT; ventrikül yapısı ve işlevi.",
          "en": "ECG: QRS/PR; QT for IA; ventricular structure and function."
        },
        "target": "lv",
        "sources": [
          "review",
          "flecainide-label",
          "antiarrhythmic-slides"
        ]
      },
      {
        "id": "class-ii",
        "name": {
          "tr": "Sınıf II: beta blokajı",
          "en": "Class II: beta blockade"
        },
        "examples": {
          "tr": "Metoprolol, esmolol",
          "en": "Metoprolol, esmolol"
        },
        "mechanism": {
          "tr": "SA otomatikliğini ve AV düğüm iletimini azaltır.",
          "en": "Reduce SA automaticity and AV-nodal conduction."
        },
        "use": {
          "tr": "Seçilmiş supraventriküler taşiaritmilerde hız kontrolü.",
          "en": "Rate control in selected supraventricular tachyarrhythmias."
        },
        "risk": {
          "tr": "Bradikardi, AV blok, hipotansiyon; bronkospazm riski ajana bağlıdır.",
          "en": "Bradycardia, AV block, hypotension; bronchospasm risk depends on agent."
        },
        "monitor": {
          "tr": "Nabız, PR aralığı ve kan basıncı.",
          "en": "Heart rate, PR interval and blood pressure."
        },
        "target": "av",
        "sources": [
          "review",
          "action-slides",
          "antiarrhythmic-slides"
        ]
      },
      {
        "id": "class-iii",
        "name": {
          "tr": "Sınıf III: repolarizasyon",
          "en": "Class III: repolarization"
        },
        "examples": {
          "tr": "Amiodaron, sotalol, dofetilid, dronedaron",
          "en": "Amiodarone, sotalol, dofetilide, dronedarone"
        },
        "mechanism": {
          "tr": "K akımı blokajı refrakterliği uzatır; amiodaron çok kanallı, sotalol ayrıca beta blokerdir.",
          "en": "K-current blockade prolongs refractoriness; amiodarone is multichannel, sotalol also beta-blocks."
        },
        "use": {
          "tr": "Seçilmiş atriyal ve ventriküler ritim sorunları.",
          "en": "Selected atrial and ventricular rhythm disorders."
        },
        "risk": {
          "tr": "QT/proaritmi; amiodaronda akciğer, karaciğer ve tiroit toksisitesi.",
          "en": "QT/proarrhythmia; pulmonary, hepatic and thyroid toxicity with amiodarone."
        },
        "monitor": {
          "tr": "QTc, K, Mg, böbrek işlevi; amiodaronda tiroit/karaciğer ve akciğer belirtileri.",
          "en": "QTc, K, Mg, renal function; thyroid/liver and pulmonary symptoms with amiodarone."
        },
        "target": "lv",
        "sources": [
          "review",
          "sotalol-label",
          "antiarrhythmic-slides"
        ]
      },
      {
        "id": "class-iv",
        "name": {
          "tr": "Sınıf IV: nodal kalsiyum kanalı",
          "en": "Class IV: nodal calcium channel"
        },
        "examples": {
          "tr": "Verapamil, diltiazem",
          "en": "Verapamil, diltiazem"
        },
        "mechanism": {
          "tr": "AV iletimini yavaşlatır; kontraktiliteyi azaltır.",
          "en": "Slow AV conduction and reduce contractility."
        },
        "use": {
          "tr": "Seçilmiş supraventriküler ritimlerde AV düğüm iletimi ve hız kontrolünü açıklar.",
          "en": "Explains AV nodal conduction and rate control in selected supraventricular rhythms."
        },
        "risk": {
          "tr": "Bradikardi, AV blok; HFrEF bağlamında zararlı olabilir.",
          "en": "Bradycardia, AV block; can be harmful in HFrEF."
        },
        "monitor": {
          "tr": "Nabız, PR aralığı, kan basıncı, ventrikül işlevi.",
          "en": "Heart rate, PR interval, blood pressure, ventricular function."
        },
        "target": "av",
        "sources": [
          "review",
          "antiarrhythmic-slides"
        ]
      },
      {
        "id": "adenosine",
        "name": {
          "tr": "Adenozin",
          "en": "Adenosine"
        },
        "examples": {
          "tr": "Adenozin",
          "en": "Adenosine"
        },
        "mechanism": {
          "tr": "A1 reseptörü üzerinden çok kısa AV nod blokajı; yarı ömür <10 saniye.",
          "en": "A1 receptor action produces brief AV-nodal block; half-life <10 seconds."
        },
        "use": {
          "tr": "Düzenli AV nod bağımlı SVT. Erişkin periferik IV etiket örneği: 6 mg, 1–2 saniyede; yanıt yoksa 1–2 dakika sonra 12 mg. Hastaya yakın giriş ve hemen hızlı SF yıkama. Nakil/santral kateter veya dipiridamol/karbamazepin varlığında AHA başlangıç dozunun 3 mg'a düşürülmesini önerir (nakil veya santral yolda 1 mg da yeterli olabilir).",
          "en": "Regular AV-node-dependent SVT. Adult peripheral IV label example: 6 mg over 1–2 seconds; if unsuccessful, 12 mg after 1–2 minutes. Use patient-proximal access and immediate rapid saline flush. For transplant, central line access, dipyridamole or carbamazepine, AHA recommends a reduced initial dose of 3 mg (in transplant or central access 1 mg may suffice)."
        },
        "risk": {
          "tr": "Pre-eksite AF (WPW) ve düzensiz/polimorfik geniş QRS taşikardide verilmez: VF riski. WPW ile düzenli ortodromik AVRT aynı durum değildir. Astım/aktif bronkospazmda kontrendike. Geçici AV blok/asistoli, flushing ve göğüs sıkışması yapabilir.",
          "en": "Do not give in pre-excited AF (WPW) or irregular/polymorphic wide-complex tachycardia: VF risk. Regular orthodromic AVRT with WPW is a different setting. Contraindicated in asthma/active bronchospasm. May cause transient AV block/asystole, flushing and chest pressure."
        },
        "monitor": {
          "tr": "Sürekli EKG, ritim tanımlama ve resüsitasyon hazırlığı. Kısa süreli korku/rahatsızlık önceden açıklanır. Kafein/teofilin etkisini azaltır; dipiridamol artırır; karbamazepin AV bloğu ağırlaştırabilir.",
          "en": "Continuous ECG, rhythm identification and resuscitation readiness. Explain brief dread/discomfort beforehand. Caffeine/theophylline reduce effects; dipyridamole enhances them; carbamazepine may worsen AV block."
        },
        "target": "av",
        "sources": [
          "adenosine-label",
          "als-guideline"
        ]
      },
      {
        "id": "quinidine",
        "name": {
          "tr": "Kinidin · IA",
          "en": "Quinidine · IA"
        },
        "examples": {
          "tr": "Kinidin · IA",
          "en": "Quinidine · IA"
        },
        "mechanism": {
          "tr": "Na⁺ ve K⁺ akımlarını baskılar; vagolitik etki AV iletimini artırabilir.",
          "en": "Blocks Na⁺ and K⁺ currents; vagolysis may increase AV conduction."
        },
        "use": {
          "tr": "Seçilmiş aritmilerde uzman seçimi; Brugada’da tekrarlayan polimorfik VT/ICD şokları bağlamında değerlendirilir.",
          "en": "Specialist selection for certain arrhythmias; considered in Brugada with recurrent polymorphic VT/ICD shocks."
        },
        "risk": {
          "tr": "QT uzaması/TdP; sinçonizm: tinnitus, baş dönmesi, görme/işitme belirtileri.",
          "en": "QT prolongation/TdP; cinchonism: tinnitus, vertigo, visual/hearing symptoms."
        },
        "monitor": {
          "tr": "QTc, QRS, K/Mg, organ işlevi ve ilaç etkileşimleri.",
          "en": "QTc, QRS, K/Mg, organ function and drug interactions."
        },
        "target": "lv",
        "sources": [
          "quinidine-label",
          "va-guideline"
        ]
      },
      {
        "id": "mexiletine",
        "name": {
          "tr": "Meksiletin · IB",
          "en": "Mexiletine · IB"
        },
        "examples": {
          "tr": "Meksiletin · IB",
          "en": "Mexiletine · IB"
        },
        "mechanism": {
          "tr": "Oral Na⁺ kanal blokeri; lidokain benzeri. Başlıca hepatik metabolizma; yarı ömür yaklaşık 10–12 saat.",
          "en": "Oral Na⁺ channel blocker, lidocaine-like. Mainly hepatic metabolism; half-life about 10–12 hours."
        },
        "use": {
          "tr": "Yaşamı tehdit eden ventriküler aritmilerde uzman tedavisi; rutin PVC baskılama amacıyla kullanılmaz.",
          "en": "Specialist treatment of life-threatening ventricular arrhythmias; not routine PVC suppression."
        },
        "risk": {
          "tr": "Proaritmi; bulantı, tremor/baş dönmesi; karaciğer hastalığında birikim.",
          "en": "Proarrhythmia; nausea, tremor/dizziness; accumulation in liver disease."
        },
        "monitor": {
          "tr": "EKG, karaciğer işlevi, nörolojik/Gİ belirtiler ve etkileşimler.",
          "en": "ECG, liver function, neurological/GI symptoms and interactions."
        },
        "target": "lv",
        "sources": [
          "mexiletine-label"
        ]
      },
      {
        "id": "dofetilide",
        "name": {
          "tr": "Dofetilid · III",
          "en": "Dofetilide · III"
        },
        "examples": {
          "tr": "Dofetilid · III",
          "en": "Dofetilide · III"
        },
        "mechanism": {
          "tr": "Seçici IKr blokajı; başlıca renal eliminasyon, QT uzaması.",
          "en": "Selective IKr blockade; mainly renal elimination and QT prolongation."
        },
        "use": {
          "tr": "Seçilmiş AF/flutter dönüşümü ve sinüs ritmi sürdürülmesi. Başlama/yeniden başlama en az 3 gün hastanede sürekli EKG gerektirir.",
          "en": "Selected AF/flutter conversion and sinus-rhythm maintenance. Initiation/reinitiation requires at least 3 days of inpatient continuous ECG."
        },
        "risk": {
          "tr": "TdP. Bazal QT/QTc >440 ms (ventriküler ileti bozukluğunda >500 ms) veya CrCl <20 mL/dk: kontrendike. HCTZ ve verapamil ile birlikte kontrendike.",
          "en": "TdP. Baseline QT/QTc >440 ms (>500 ms with ventricular conduction abnormalities) or CrCl <20 mL/min: contraindicated. Concomitant HCTZ and verapamil contraindicated."
        },
        "monitor": {
          "tr": "QT/QTc, hesaplanmış kreatinin klirensi, K/Mg ve tüm etkileşen ilaçlar; böbrek işlevine göre doz uzman protokolüyle belirlenir.",
          "en": "QT/QTc, calculated creatinine clearance, K/Mg and all interacting drugs; renal dosing follows specialist protocol."
        },
        "target": "lv",
        "sources": [
          "dofetilide-label"
        ]
      },
      {
        "id": "dronedarone",
        "name": {
          "tr": "Dronedaron · III",
          "en": "Dronedarone · III"
        },
        "examples": {
          "tr": "Dronedaron · III",
          "en": "Dronedarone · III"
        },
        "mechanism": {
          "tr": "İyotsuz çok kanallı antiaritmik; CYP3A metabolizması; yarı ömür 13–19 saat.",
          "en": "Noniodinated multichannel antiarrhythmic; CYP3A metabolism; half-life 13–19 hours."
        },
        "use": {
          "tr": "Paroksismal/persistan AF öyküsü olan sinüs ritmindeki seçilmiş hastalarda AF yatış riskini azaltır.",
          "en": "Reduces AF hospitalization risk in selected patients in sinus rhythm with paroxysmal/persistent AF history."
        },
        "risk": {
          "tr": "Kalıcı AF, yakın dönemde hastaneye yatış gerektiren dekompanse semptomatik HF veya NYHA IV HF: kontrendike, mortalite riski. QT uzaması, karaciğer/akciğer toksisitesi.",
          "en": "Permanent AF, recently decompensated symptomatic HF requiring hospitalization or NYHA IV HF: contraindicated, mortality risk. QT prolongation and liver/lung toxicity."
        },
        "monitor": {
          "tr": "Ritim, QTc, HF belirtileri, karaciğer ve böbrek işlevi; CYP3A ve digoksin etkileşimleri.",
          "en": "Rhythm, QTc, HF symptoms, liver and renal function; CYP3A and digoxin interactions."
        },
        "target": "lv",
        "sources": [
          "dronedarone-label"
        ]
      }
    ]
  },
  {
    "id": "antianginals",
    "title": {
      "tr": "Antianjinaller",
      "en": "Antianginals"
    },
    "intro": {
      "tr": "Oksijen talebi, dolum basıncı ve koroner tonus ilaç etkisini bağlar.",
      "en": "Oxygen demand, filling pressure and coronary tone connect drug effects."
    },
    "cards": [
      {
        "id": "nitrates",
        "name": {
          "tr": "Organik nitratlar",
          "en": "Organic nitrates"
        },
        "examples": {
          "tr": "Nitrogliserin, izosorbid mononitrat",
          "en": "Nitroglycerin, isosorbide mononitrate"
        },
        "mechanism": {
          "tr": "NO/cGMP yoluyla özellikle venöz dilatasyon ve preload azalması.",
          "en": "NO/cGMP causes predominantly venous dilation and reduced preload."
        },
        "use": {
          "tr": "Anjina semptomları; koroner spazm bağlamı.",
          "en": "Angina symptoms; coronary-spasm settings."
        },
        "risk": {
          "tr": "Baş ağrısı, hipotansiyon, tolerans; PDE5 inhibitörüyle kontrendike.",
          "en": "Headache, hypotension, tolerance; contraindicated with PDE5 inhibitors."
        },
        "monitor": {
          "tr": "Kan basıncı, semptom yanıtı ve etkileşim öyküsü.",
          "en": "Blood pressure, symptom response and interaction history."
        },
        "target": "coronaries",
        "sources": [
          "review"
        ]
      },
      {
        "id": "demand",
        "name": {
          "tr": "Nabız ve oksijen talebi",
          "en": "Rate and oxygen demand"
        },
        "examples": {
          "tr": "Beta blokerler",
          "en": "Beta blockers"
        },
        "mechanism": {
          "tr": "Nabız ve kontraktilite azalınca oksijen talebi düşer.",
          "en": "Reducing rate and contractility lowers oxygen demand."
        },
        "use": {
          "tr": "Seçilmiş efor anjinası; vazospastik anjinada aynı yaklaşım uygulanmaz.",
          "en": "Selected exertional angina; vasospastic angina requires a different approach."
        },
        "risk": {
          "tr": "Bradikardi ve hipotansiyon; beta blokajı spazmı kötüleştirebilir.",
          "en": "Bradycardia and hypotension; beta blockade may worsen spasm."
        },
        "monitor": {
          "tr": "Nabız, kan basıncı ve anjina tipi.",
          "en": "Heart rate, blood pressure and angina phenotype."
        },
        "target": "sa",
        "sources": [
          "review"
        ]
      },
      {
        "id": "ranolazine",
        "name": {
          "tr": "Ranolazin",
          "en": "Ranolazine"
        },
        "examples": {
          "tr": "Ranolazin",
          "en": "Ranolazine"
        },
        "mechanism": {
          "tr": "Geç Na akımını azaltarak hücre içi Ca yükünü ve diyastolik gerilimi azaltır.",
          "en": "Reduces late Na current, intracellular Ca load and diastolic tension."
        },
        "use": {
          "tr": "Seçilmiş kronik anjina semptomları.",
          "en": "Selected chronic angina symptoms."
        },
        "risk": {
          "tr": "QT uzaması ve CYP3A etkileşimleri.",
          "en": "QT prolongation and CYP3A interactions."
        },
        "monitor": {
          "tr": "QTc, böbrek/karaciğer bağlamı ve birlikte kullanılan ilaçlar.",
          "en": "QTc, renal/hepatic context and concurrent drugs."
        },
        "target": "lv",
        "sources": [
          "review"
        ]
      }
    ]
  },
  {
    "id": "antithrombotics",
    "title": {
      "tr": "Antitrombotikler",
      "en": "Antithrombotics"
    },
    "intro": {
      "tr": "Trombosit, koagülasyon ve fibrin yıkımı ayrı hedeflerdir.",
      "en": "Platelets, coagulation and fibrin breakdown are distinct targets."
    },
    "cards": [
      {
        "id": "antiplatelet",
        "name": {
          "tr": "Antitrombositler",
          "en": "Antiplatelet drugs"
        },
        "examples": {
          "tr": "Aspirin; klopidogrel, tikagrelor",
          "en": "Aspirin; clopidogrel, ticagrelor"
        },
        "mechanism": {
          "tr": "Aspirin COX-1; P2Y12 ajanları ADP sinyalini baskılar.",
          "en": "Aspirin inhibits COX-1; P2Y12 agents inhibit ADP signaling."
        },
        "use": {
          "tr": "Aterotrombotik olaylar ve seçilmiş koroner girişim bağlamları.",
          "en": "Atherothrombotic events and selected coronary-intervention settings."
        },
        "risk": {
          "tr": "Kanama; ikili tedavi kararı endikasyon ve süreye bağlıdır.",
          "en": "Bleeding; dual therapy depends on indication and duration."
        },
        "monitor": {
          "tr": "Kanama belirtileri, hemoglobin ve eş ilaçlar.",
          "en": "Bleeding signs, hemoglobin and concurrent drugs."
        },
        "target": "platelet",
        "sources": [
          "review"
        ]
      },
      {
        "id": "heparin",
        "name": {
          "tr": "Heparinler",
          "en": "Heparins"
        },
        "examples": {
          "tr": "UFH, enoksaparin",
          "en": "UFH, enoxaparin"
        },
        "mechanism": {
          "tr": "Antitrombin etkisini güçlendirir; UFH IIa/Xa, LMWH ağırlıkla Xa etkisi.",
          "en": "Enhance antithrombin; UFH affects IIa/Xa, LMWH predominantly Xa."
        },
        "use": {
          "tr": "Seçilmiş akut tromboz ve girişim bağlamları.",
          "en": "Selected acute thrombosis and procedural settings."
        },
        "risk": {
          "tr": "Kanama, heparine bağlı trombositopeni; LMWH böbrekte birikebilir.",
          "en": "Bleeding, heparin-induced thrombocytopenia; LMWH can accumulate renally."
        },
        "monitor": {
          "tr": "Trombosit, hemoglobin, böbrek işlevi; UFH için aPTT veya anti-Xa.",
          "en": "Platelets, hemoglobin, renal function; aPTT or anti-Xa for UFH."
        },
        "target": "platelet",
        "sources": [
          "review",
          "slides"
        ]
      },
      {
        "id": "oral-anticoag",
        "name": {
          "tr": "Oral antikoagülanlar",
          "en": "Oral anticoagulants"
        },
        "examples": {
          "tr": "Warfarin; apiksaban, rivaroksaban; dabigatran",
          "en": "Warfarin; apixaban, rivaroxaban; dabigatran"
        },
        "mechanism": {
          "tr": "Warfarin K vitamini döngüsünü; DOAC ajanları Xa veya IIa faktörünü inhibe eder.",
          "en": "Warfarin inhibits vitamin K recycling; DOACs directly inhibit Xa or IIa."
        },
        "use": {
          "tr": "Seçilmiş AF ve venöz tromboemboli; mekanik kapakta DOAC kullanılmaz.",
          "en": "Selected AF and venous thromboembolism; DOACs are not used for mechanical valves."
        },
        "risk": {
          "tr": "Kanama, böbrek işlevi ve ilaç etkileşimleri.",
          "en": "Bleeding, renal function and drug interactions."
        },
        "monitor": {
          "tr": "Warfarin: INR; DOAC: böbrek işlevi/uyum, INR etki ölçümü değildir.",
          "en": "Warfarin: INR; DOAC: renal function/adherence, INR does not measure effect."
        },
        "target": "platelet",
        "sources": [
          "review"
        ]
      },
      {
        "id": "fibrinolytic",
        "name": {
          "tr": "Fibrinolitikler",
          "en": "Fibrinolytics"
        },
        "examples": {
          "tr": "Alteplaz, tenekteplaz",
          "en": "Alteplase, tenecteplase"
        },
        "mechanism": {
          "tr": "Plazminojenin plazmine dönüşümünü artırıp fibrin yıkımını sağlar.",
          "en": "Promote plasminogen-to-plasmin conversion and fibrin breakdown."
        },
        "use": {
          "tr": "Özel zaman ve uygunluk koşulları olan akut trombotik durumlar.",
          "en": "Acute thrombotic conditions with specific timing and eligibility requirements."
        },
        "risk": {
          "tr": "Majör ve intrakraniyal kanama.",
          "en": "Major and intracranial bleeding."
        },
        "monitor": {
          "tr": "Kanama riski, nörolojik bulgular ve endikasyona özgü değerlendirme.",
          "en": "Bleeding risk, neurological signs and indication-specific assessment."
        },
        "target": "platelet",
        "sources": [
          "review"
        ]
      }
    ]
  },
  {
    "id": "lipids",
    "title": {
      "tr": "Lipit düşürücüler",
      "en": "Lipid-lowering drugs"
    },
    "intro": {
      "tr": "LDL reseptörü, kolesterol sentezi ve bağırsak emilimi ayrı hedeflerdir.",
      "en": "LDL receptors, cholesterol synthesis and intestinal absorption are separate targets."
    },
    "cards": [
      {
        "id": "statin",
        "name": {
          "tr": "Statinler",
          "en": "Statins"
        },
        "examples": {
          "tr": "Atorvastatin, rosuvastatin",
          "en": "Atorvastatin, rosuvastatin"
        },
        "mechanism": {
          "tr": "HMG-CoA redüktaz inhibisyonu hepatik LDL reseptörünü artırır.",
          "en": "HMG-CoA reductase inhibition increases hepatic LDL receptors."
        },
        "use": {
          "tr": "ASCVD risk azaltımı ve LDL düşürme.",
          "en": "ASCVD risk reduction and LDL lowering."
        },
        "risk": {
          "tr": "Kas belirtileri, nadir rabdomiyoliz; etkileşim ajana göre değişir.",
          "en": "Muscle symptoms, rare rhabdomyolysis; interactions vary by agent."
        },
        "monitor": {
          "tr": "Lipit yanıtı; başlangıç karaciğer değerlendirmesi, belirtilere göre CK.",
          "en": "Lipid response; baseline hepatic assessment, symptom-driven CK."
        },
        "target": "liver",
        "sources": [
          "review"
        ]
      },
      {
        "id": "ezetimibe",
        "name": {
          "tr": "Ezetimib",
          "en": "Ezetimibe"
        },
        "examples": {
          "tr": "Ezetimib",
          "en": "Ezetimibe"
        },
        "mechanism": {
          "tr": "Bağırsak NPC1L1 üzerinden kolesterol emilimini azaltır.",
          "en": "Reduces intestinal cholesterol absorption via NPC1L1."
        },
        "use": {
          "tr": "Ek LDL düşürme veya uygun statin intoleransı bağlamı.",
          "en": "Additional LDL lowering or suitable statin-intolerance settings."
        },
        "risk": {
          "tr": "Gastrointestinal yakınmalar; statinle karaciğer enzim artışı olabilir.",
          "en": "GI symptoms; hepatic enzymes may rise with statin combination."
        },
        "monitor": {
          "tr": "Lipit yanıtı ve klinik karaciğer bağlamı.",
          "en": "Lipid response and hepatic clinical context."
        },
        "target": "intestine",
        "sources": [
          "review"
        ]
      },
      {
        "id": "pcsk9",
        "name": {
          "tr": "PCSK9 antikorları",
          "en": "PCSK9 antibodies"
        },
        "examples": {
          "tr": "Evolokumab, alirokumab",
          "en": "Evolocumab, alirocumab"
        },
        "mechanism": {
          "tr": "LDL reseptörünün yıkımını azaltır, dolaşımdan LDL temizlenmesini artırır.",
          "en": "Reduce LDL-receptor degradation and increase LDL clearance."
        },
        "use": {
          "tr": "Seçilmiş yüksek risk veya ailesel hiperkolesterolemi.",
          "en": "Selected high-risk or familial hypercholesterolemia settings."
        },
        "risk": {
          "tr": "Enjeksiyon bölgesi reaksiyonları ve aşırı duyarlılık.",
          "en": "Injection-site reactions and hypersensitivity."
        },
        "monitor": {
          "tr": "LDL yanıtı, tolerans ve uygulama uyumu.",
          "en": "LDL response, tolerance and administration adherence."
        },
        "target": "liver",
        "sources": [
          "review"
        ]
      }
    ]
  },
  {
    "id": "interactions",
    "title": {
      "tr": "Etkileşim ve güvenlik",
      "en": "Interactions and safety"
    },
    "intro": {
      "tr": "İlaç listesi, elektrolit ve organ işlevi birlikte okunur.",
      "en": "Read medication list, electrolytes and organ function together."
    },
    "cards": [
      {
        "id": "interaction-model",
        "name": {
          "tr": "Farmakokinetik / farmakodinamik etkileşim",
          "en": "PK / PD interaction"
        },
        "examples": {
          "tr": "Amiodaron-digoksin; beta bloker-verapamil",
          "en": "Amiodarone-digoxin; beta blocker-verapamil"
        },
        "mechanism": {
          "tr": "PK maruziyeti değiştirir; PD aynı fizyolojik etkileri toplar.",
          "en": "PK changes exposure; PD adds effects on the same physiology."
        },
        "use": {
          "tr": "Bir kombinasyonun neden risk yarattığını açıklama.",
          "en": "Explains why a combination creates risk."
        },
        "risk": {
          "tr": "Enzim/taşıyıcı inhibisyonu aktif substrat maruziyetini artırabilir; ön ilaçlar farklıdır.",
          "en": "Enzyme/transporter inhibition may increase active substrate exposure; prodrugs differ."
        },
        "monitor": {
          "tr": "Tam ilaç listesi, EKG, böbrek işlevi ve elektrolitler.",
          "en": "Complete medication list, ECG, renal function and electrolytes."
        },
        "target": "av",
        "sources": [
          "review",
          "wiki",
          "digoxin-label"
        ]
      }
    ]
  }
];

PHARMA_TOPICS.push({
  id: 'vasoactive',
  title: { tr: 'Şok: Vazopressör / İnotrop', en: 'Shock: Vasopressors / Inotropes' },
  intro: { tr: 'Damar tonusu, pompa işlevi ve perfüzyonu birlikte değerlendir; şok nedenine göre seçim yolunu keşfet.', en: 'Assess vascular tone, pump function and perfusion together; explore selection pathways by shock cause.' },
  cards: []
});

export const PHARMA_INTERACTIONS = [
  {
    "id": "ace-arni",
    "title": {
      "tr": "ACE inhibitörü + ARNI",
      "en": "ACE inhibitor + ARNI"
    },
    "why": {
      "tr": "Birlikte bradikinin ilişkili anjiyoödem riski artar.",
      "en": "Concurrent use increases bradykinin-related angioedema risk."
    },
    "action": {
      "tr": "Birlikte kullanılmaz; her iki yönde geçişte en az 36 saat ara gerekir.",
      "en": "Do not combine; at least 36-hour separation is required in either switching direction."
    },
    "sources": [
      "arni-label"
    ]
  },
  {
    "id": "nitrate-pde5",
    "title": {
      "tr": "Nitrat + PDE5 inhibitörü",
      "en": "Nitrate + PDE5 inhibitor"
    },
    "why": {
      "tr": "cGMP etkileri birleşir; ağır hipotansiyon gelişebilir.",
      "en": "Combined cGMP effects can cause severe hypotension."
    },
    "action": {
      "tr": "Kontrendike kombinasyon; ilaç öyküsünde sildenafil/tadalafil sorgulanır.",
      "en": "Contraindicated combination; review sildenafil/tadalafil exposure."
    },
    "sources": [
      "review"
    ]
  },
  {
    "id": "nodal-block",
    "title": {
      "tr": "Beta bloker + verapamil/diltiazem",
      "en": "Beta blocker + verapamil/diltiazem"
    },
    "why": {
      "tr": "AV düğüm baskısı ve negatif inotropi toplanır.",
      "en": "AV-nodal suppression and negative inotropy add together."
    },
    "action": {
      "tr": "Bradikardi, AV blok ve hemodinamik bozulma açısından uzman değerlendirmesi.",
      "en": "Expert assessment for bradycardia, AV block and hemodynamic deterioration."
    },
    "sources": [
      "review"
    ]
  },
  {
    "id": "potassium",
    "title": {
      "tr": "RAAS blokajı + potasyum artıran ilaç",
      "en": "RAAS blockade + potassium-raising drug"
    },
    "why": {
      "tr": "ACEi/ARB/ARNI, MRA ve potasyum desteği hiperkalemi riskini artırır.",
      "en": "ACEi/ARB/ARNI, MRAs and potassium supplements increase hyperkalemia risk."
    },
    "action": {
      "tr": "Bazı kombinasyonlar faydalıdır; K ve böbrek işlevi izlemi gerekir.",
      "en": "Some combinations are beneficial; K and renal function monitoring are required."
    },
    "sources": [
      "review",
      "arni-label"
    ]
  },
  {
    "id": "digoxin-k",
    "title": {
      "tr": "Digoksin + elektrolit kaybı",
      "en": "Digoxin + electrolyte loss"
    },
    "why": {
      "tr": "Loop/tiyazid ile düşük K veya Mg miyokardı digoksine duyarlı kılar.",
      "en": "Low K or Mg from loop/thiazide therapy sensitizes myocardium to digoxin."
    },
    "action": {
      "tr": "Elektrolitler, böbrek işlevi, ritim ve toksisite belirtileri birlikte değerlendirilir.",
      "en": "Assess electrolytes, renal function, rhythm and toxicity signs together."
    },
    "sources": [
      "digoxin-label",
      "review"
    ]
  },
  {
    "id": "qt-stack",
    "title": {
      "tr": "QT uzatan ilaçların birleşmesi",
      "en": "Combining QT-prolonging drugs"
    },
    "why": {
      "tr": "Repolarizasyon gecikmesi, düşük K/Mg ve bradikardi torsades riskini artırır.",
      "en": "Delayed repolarization, low K/Mg and bradycardia increase torsades risk."
    },
    "action": {
      "tr": "QTc, ilaç listesi, K/Mg ve renal klirens değerlendirilir.",
      "en": "Assess QTc, medication list, K/Mg and renal clearance."
    },
    "sources": [
      "sotalol-label",
      "review"
    ]
  },
  {
    "id": "adenosine-methylxanthines",
    "title": {
      "tr": "Adenozin + metilksantinler",
      "en": "Adenosine + methylxanthines"
    },
    "why": {
      "tr": "Kafein, teofilin/aminofilin reseptör antagonizmasıyla yanıtı azaltabilir.",
      "en": "Caffeine, theophylline/aminophylline may reduce response by receptor antagonism."
    },
    "action": {
      "tr": "Maruziyet sorgulanır; doz değişikliği uzman protokolüne göre, otomatik artırılmaz.",
      "en": "Review exposure; dose changes follow specialist protocol, never automatic escalation."
    },
    "sources": [
      "adenosine-label"
    ]
  },
  {
    "id": "adenosine-dipyridamole",
    "title": {
      "tr": "Adenozin + dipiridamol",
      "en": "Adenosine + dipyridamole"
    },
    "why": {
      "tr": "Geri alım inhibisyonu adenozin etkisini artırır.",
      "en": "Uptake inhibition enhances adenosine effects."
    },
    "action": {
      "tr": "Düşük doz gereksinimi ve AV blok riski uzman protokolünde değerlendirilir.",
      "en": "Assess reduced dose requirements and AV-block risk under specialist protocol."
    },
    "sources": [
      "adenosine-label"
    ]
  },
  {
    "id": "adenosine-carbamazepine",
    "title": {
      "tr": "Adenozin + karbamazepin",
      "en": "Adenosine + carbamazepine"
    },
    "why": {
      "tr": "AV blok derecesi artabilir.",
      "en": "Degree of AV block may increase."
    },
    "action": {
      "tr": "İlaç öyküsü ve sürekli EKG; uzman değerlendirmesi.",
      "en": "Medication review and continuous ECG; specialist assessment."
    },
    "sources": [
      "adenosine-label"
    ]
  }
];

export const PHARMA_QUESTIONS = [
  {
    "id": "dhp-av",
    "prompt": {
      "tr": "Hangi grup AV düğümünü doğrudan yavaşlatır?",
      "en": "Which group directly slows the AV node?"
    },
    "options": [
      {
        "tr": "DHP: amlodipin",
        "en": "DHP: amlodipine"
      },
      {
        "tr": "Non-DHP: verapamil/diltiazem",
        "en": "Non-DHP: verapamil/diltiazem"
      },
      {
        "tr": "Tiyazid",
        "en": "Thiazide"
      }
    ],
    "answer": 1,
    "explanation": {
      "tr": "Non-DHP ajanlar AV iletimini yavaşlatır; DHP etkisi ağırlıkla damardadır.",
      "en": "Non-DHP agents slow AV conduction; DHP action is predominantly vascular."
    },
    "sources": [
      "review"
    ]
  },
  {
    "id": "arni-gap",
    "prompt": {
      "tr": "ACE inhibitörü ile ARNI geçişinde hangi güvenlik ilkesi geçerli?",
      "en": "Which safety principle applies when switching ACE inhibitor and ARNI?"
    },
    "options": [
      {
        "tr": "Birlikte kullanılır",
        "en": "Use together"
      },
      {
        "tr": "En az 36 saat ara",
        "en": "At least 36-hour separation"
      },
      {
        "tr": "Sadece INR bakılır",
        "en": "Check only INR"
      }
    ],
    "answer": 1,
    "explanation": {
      "tr": "Birlikte kullanım kontrendikedir; anjiyoödem riski nedeniyle iki yönde de ara gerekir.",
      "en": "Concurrent use is contraindicated; angioedema risk requires separation in both directions."
    },
    "sources": [
      "arni-label"
    ]
  },
  {
    "id": "digoxin-electrolyte",
    "prompt": {
      "tr": "Digoksin kullanan hastada hangi değişim toksisite riskini artırır?",
      "en": "Which change increases digoxin toxicity risk?"
    },
    "options": [
      {
        "tr": "Hipokalemi",
        "en": "Hypokalemia"
      },
      {
        "tr": "LDL düşüşü",
        "en": "LDL reduction"
      },
      {
        "tr": "HDL artışı",
        "en": "HDL increase"
      }
    ],
    "answer": 0,
    "explanation": {
      "tr": "Düşük K ve Mg digoksin duyarlılığını artırır; serum düzeyi tek başına yeterli değildir.",
      "en": "Low K and Mg increase digoxin sensitivity; serum level alone is insufficient."
    },
    "sources": [
      "digoxin-label"
    ]
  },
  {
    "id": "ic-substrate",
    "prompt": {
      "tr": "Sınıf IC seçiminde hangi bağlam güvenlik sorunu oluşturur?",
      "en": "Which setting creates a safety concern for class IC agents?"
    },
    "options": [
      {
        "tr": "Normal kalp yapısı",
        "en": "Normal cardiac structure"
      },
      {
        "tr": "İskemik/yapısal kalp hastalığı",
        "en": "Ischemic/structural heart disease"
      },
      {
        "tr": "İzole yüksek LDL",
        "en": "Isolated high LDL"
      }
    ],
    "answer": 1,
    "explanation": {
      "tr": "Flekainid gibi ajanlar bu bağlamda proaritmi riski taşır; enfarktüs sonrası CAST bulguları kritiktir.",
      "en": "Agents such as flecainide carry proarrhythmic risk here; post-MI CAST findings are critical."
    },
    "sources": [
      "flecainide-label"
    ]
  },
  {
    "id": "qt-monitor",
    "prompt": {
      "tr": "Sotalol güvenliği için hangi izlem bütünü uygundur?",
      "en": "Which monitoring set fits sotalol safety?"
    },
    "options": [
      {
        "tr": "Yalnız LDL",
        "en": "LDL alone"
      },
      {
        "tr": "Yalnız trombosit",
        "en": "Platelets alone"
      },
      {
        "tr": "QTc, K/Mg ve böbrek işlevi",
        "en": "QTc, K/Mg and renal function"
      }
    ],
    "answer": 2,
    "explanation": {
      "tr": "Repolarizasyon, elektrolitler ve renal eliminasyon birlikte torsades riskini etkiler.",
      "en": "Repolarization, electrolytes and renal elimination jointly influence torsades risk."
    },
    "sources": [
      "sotalol-label"
    ]
  },
  {
    "id": "doac-inr",
    "prompt": {
      "tr": "DOAC etkisi için INR nasıl yorumlanır?",
      "en": "How should INR be interpreted for DOAC effect?"
    },
    "options": [
      {
        "tr": "Warfarindeki gibi hedef ölçümüdür",
        "en": "It is a target measure as with warfarin"
      },
      {
        "tr": "Etkiyi güvenilir biçimde ölçmez",
        "en": "It does not reliably measure effect"
      },
      {
        "tr": "Kanama riskini sıfırlar",
        "en": "It removes bleeding risk"
      }
    ],
    "answer": 1,
    "explanation": {
      "tr": "INR warfarin izlemi içindir; DOAC güvenliği renal işlev, uyum ve klinik bağlamla değerlendirilir.",
      "en": "INR monitors warfarin; DOAC safety depends on renal function, adherence and clinical context."
    },
    "sources": [
      "review"
    ]
  }
];

// Peripheral Angiography & DSA C-Arm Projection Engine, Presets, Lesions & ABI/TBI Calculator
// Simulates 3D peripheral vascular geometry, contralateral/ipsilateral obliques, bolus-chase DSA,
// catheter engagement, focal stenosis / CTO collaterals, and real-time bifurcation overlap telemetry.

/**
 * 3D coordinate system (consistent with coronary fluoroscopy engine):
 * +X: Patient Left (Screen Right in AP)
 * +Y: Cranial (Screen Up in AP)
 * +Z: Anterior (Toward detector in AP)
 *
 * Each branch maps to one of the 71 canonical peripheral structure IDs.
 */
export const PERIPHERAL_3D_TREES = {
  aortoiliac: [
    {
      id: 'abdominal-aorta',
      nameTr: 'Karın aortu',
      nameEn: 'Abdominal aorta',
      caliberMm: 6.2,
      flowOrder: 0.0,
      points: [[0.0, 2.5, 0.15], [-0.03, 1.85, 0.18], [0.0, 1.2, 0.2], [0.0, 0.65, 0.22]]
    },
    {
      id: 'aortic-bifurcation',
      nameTr: 'Aort bifurkasyonu (L4)',
      nameEn: 'Aortic bifurcation (L4)',
      caliberMm: 5.8,
      flowOrder: 0.15,
      points: [[0.0, 0.68, 0.22], [0.0, 0.56, 0.22]]
    },
    {
      id: 'median-sacral',
      nameTr: 'Median sakral arter',
      nameEn: 'Median sacral artery',
      caliberMm: 1.6,
      flowOrder: 0.22,
      points: [[0.0, 0.62, 0.18], [0.02, 0.05, -0.25], [0.0, -0.55, -0.42], [0.0, -1.05, -0.5]]
    },
    {
      id: 'common-iliac',
      nameTr: 'Ana iliyak arter (Sağ/Sol)',
      nameEn: 'Common iliac artery (R/L)',
      caliberMm: 4.6,
      flowOrder: 0.25,
      points: [
        [0.0, 0.65, 0.22], [-0.38, 0.35, 0.16], [-0.82, -0.05, 0.08], [-1.18, -0.38, 0.02]
      ],
      contraPoints: [
        [0.0, 0.65, 0.22], [0.38, 0.35, 0.16], [0.82, -0.05, 0.08], [1.18, -0.38, 0.02]
      ]
    },
    {
      id: 'internal-iliac',
      nameTr: 'İç iliyak arter (hipogastrik)',
      nameEn: 'Internal iliac artery (hypogastric)',
      caliberMm: 3.4,
      flowOrder: 0.48,
      // Runs posteromedially into true pelvis (-Z) so AP overlaps with EIA, LAO/RAO separates
      points: [
        [-1.18, -0.38, 0.02], [-1.02, -0.65, -0.45], [-0.82, -0.92, -0.85], [-0.62, -1.15, -1.1]
      ],
      contraPoints: [
        [1.18, -0.38, 0.02], [1.02, -0.65, -0.45], [0.82, -0.92, -0.85], [0.62, -1.15, -1.1]
      ]
    },
    {
      id: 'iia-anterior',
      nameTr: 'İç iliyak ön bölüm',
      nameEn: 'Anterior division of internal iliac',
      caliberMm: 2.3,
      flowOrder: 0.68,
      points: [[-0.62, -1.15, -1.1], [-0.48, -1.45, -0.82], [-0.36, -1.72, -0.65]],
      contraPoints: [[0.62, -1.15, -1.1], [0.48, -1.45, -0.82], [0.36, -1.72, -0.65]]
    },
    {
      id: 'iia-posterior',
      nameTr: 'İç iliyak arka bölüm',
      nameEn: 'Posterior division of internal iliac',
      caliberMm: 2.4,
      flowOrder: 0.68,
      points: [[-0.62, -1.15, -1.1], [-0.85, -1.38, -1.45], [-1.05, -1.62, -1.68]],
      contraPoints: [[0.62, -1.15, -1.1], [0.85, -1.38, -1.45], [1.05, -1.62, -1.68]]
    },
    {
      id: 'external-iliac',
      nameTr: 'Dış iliyak arter',
      nameEn: 'External iliac artery',
      caliberMm: 4.1,
      flowOrder: 0.5,
      // Runs anterolaterally (+Z) toward inguinal ligament
      points: [
        [-1.18, -0.38, 0.02], [-1.34, -0.88, 0.38], [-1.48, -1.45, 0.68], [-1.58, -2.05, 0.88]
      ],
      contraPoints: [
        [1.18, -0.38, 0.02], [1.34, -0.88, 0.38], [1.48, -1.45, 0.68], [1.58, -2.05, 0.88]
      ]
    },
    {
      id: 'inferior-epigastric',
      nameTr: 'İnferior epigastrik arter',
      nameEn: 'Inferior epigastric artery',
      caliberMm: 1.8,
      flowOrder: 0.78,
      points: [[-1.52, -1.72, 0.78], [-1.25, -1.35, 1.05], [-0.95, -0.92, 1.22]],
      contraPoints: [[1.52, -1.72, 0.78], [1.25, -1.35, 1.05], [0.95, -0.92, 1.22]]
    },
    {
      id: 'deep-circumflex-iliac',
      nameTr: 'Derin sirkümfleks iliyak arter',
      nameEn: 'Deep circumflex iliac artery',
      caliberMm: 1.8,
      flowOrder: 0.78,
      points: [[-1.52, -1.72, 0.78], [-1.88, -1.48, 0.62], [-2.22, -1.22, 0.45]],
      contraPoints: [[1.52, -1.72, 0.78], [1.88, -1.48, 0.62], [2.22, -1.22, 0.45]]
    }
  ],

  femoral: [
    {
      id: 'common-femoral',
      nameTr: 'Ana femoral arter (CFA)',
      nameEn: 'Common femoral artery (CFA)',
      caliberMm: 5.2,
      flowOrder: 0.1,
      points: [[-0.25, 2.1, 0.35], [-0.18, 1.45, 0.42], [-0.1, 0.78, 0.46], [-0.05, 0.15, 0.48]]
    },
    {
      id: 'puncture-zone',
      nameTr: 'Güvenli ponksiyon bandı (Femur başı)',
      nameEn: 'Safe puncture zone (Femoral head)',
      caliberMm: 3.0,
      flowOrder: 0.25,
      dashed: true,
      points: [[-0.45, 1.05, 0.44], [0.22, 1.05, 0.44]]
    },
    {
      id: 'femoral-bifurcation',
      nameTr: 'Femoral bifurkasyon',
      nameEn: 'Femoral bifurcation',
      caliberMm: 4.8,
      flowOrder: 0.32,
      points: [[-0.05, 0.22, 0.48], [-0.05, 0.08, 0.48]]
    },
    {
      id: 'femoral-sfa',
      nameTr: 'Yüzeyel femoral arter (SFA)',
      nameEn: 'Superficial femoral artery (SFA)',
      caliberMm: 4.2,
      flowOrder: 0.45,
      // Continues anteriorly and slightly medial (+Z, +X)
      points: [
        [-0.05, 0.15, 0.48], [0.08, -0.52, 0.56], [0.2, -1.28, 0.58], [0.28, -2.15, 0.52]
      ]
    },
    {
      id: 'profunda',
      nameTr: 'Profunda femoris (Derin femoral)',
      nameEn: 'Profunda femoris (Deep femoral)',
      caliberMm: 3.8,
      flowOrder: 0.45,
      // Exits posterolaterally (-Z, -X) so AP overlaps proximal takeoff; RAO 30 opens it on right groin
      points: [
        [-0.05, 0.15, 0.48], [-0.38, -0.35, -0.28], [-0.72, -1.05, -0.78], [-0.95, -1.95, -1.05]
      ]
    },
    {
      id: 'lateral-circumflex',
      nameTr: 'Lateral sirkümfleks femoral arter',
      nameEn: 'Lateral circumflex femoral artery',
      caliberMm: 2.5,
      flowOrder: 0.65,
      points: [[-0.42, -0.42, -0.32], [-0.98, -0.55, -0.45], [-1.55, -0.82, -0.52], [-1.85, -1.35, -0.58]]
    },
    {
      id: 'medial-circumflex',
      nameTr: 'Medial sirkümfleks femoral arter',
      nameEn: 'Medial circumflex femoral artery',
      caliberMm: 2.3,
      flowOrder: 0.65,
      points: [[-0.32, -0.28, -0.22], [0.35, -0.38, -0.55], [0.92, -0.62, -0.78]]
    }
  ],

  runoff: [
    {
      id: 'sfa',
      nameTr: 'Süperfisyal femoral arter (SFA)',
      nameEn: 'Superficial femoral artery (SFA)',
      caliberMm: 4.4,
      flowOrder: 0.05,
      points: [[0.18, 2.55, 0.35], [0.15, 1.98, 0.22], [0.12, 1.42, 0.05]]
    },
    {
      id: 'pop-p1',
      nameTr: 'Popliteal arter P1',
      nameEn: 'Popliteal artery P1',
      caliberMm: 4.1,
      flowOrder: 0.22,
      points: [[0.12, 1.42, 0.05], [0.08, 1.02, -0.22], [0.05, 0.68, -0.38]]
    },
    {
      id: 'pop-p2',
      nameTr: 'Popliteal arter P2 (Diz eklemi)',
      nameEn: 'Popliteal artery P2 (Knee joint)',
      caliberMm: 3.9,
      flowOrder: 0.34,
      points: [[0.05, 0.68, -0.38], [0.04, 0.35, -0.45], [0.04, 0.02, -0.42]]
    },
    {
      id: 'pop-p3',
      nameTr: 'Popliteal arter P3',
      nameEn: 'Popliteal artery P3',
      caliberMm: 3.7,
      flowOrder: 0.44,
      points: [[0.04, 0.02, -0.42], [0.03, -0.28, -0.35], [0.02, -0.55, -0.28]]
    },
    {
      id: 'gen-sl',
      nameTr: 'Süperior lateral geniküler',
      nameEn: 'Superior lateral genicular',
      caliberMm: 1.6,
      flowOrder: 0.38,
      points: [[0.05, 0.62, -0.38], [-0.45, 0.72, -0.15], [-0.82, 0.48, 0.08]]
    },
    {
      id: 'gen-sm',
      nameTr: 'Süperior medial geniküler',
      nameEn: 'Superior medial genicular',
      caliberMm: 1.6,
      flowOrder: 0.38,
      points: [[0.05, 0.62, -0.38], [0.52, 0.72, -0.15], [0.85, 0.48, 0.08]]
    },
    {
      id: 'gen-il',
      nameTr: 'İnferior lateral geniküler',
      nameEn: 'Inferior lateral genicular',
      caliberMm: 1.5,
      flowOrder: 0.46,
      points: [[0.03, -0.18, -0.38], [-0.45, -0.25, -0.12], [-0.78, -0.05, 0.1]]
    },
    {
      id: 'gen-im',
      nameTr: 'İnferior medial geniküler',
      nameEn: 'Inferior medial genicular',
      caliberMm: 1.5,
      flowOrder: 0.46,
      points: [[0.03, -0.18, -0.38], [0.48, -0.25, -0.12], [0.82, -0.05, 0.1]]
    },
    {
      id: 'anterior-tibial',
      nameTr: 'Anterior tibial arter (AT)',
      nameEn: 'Anterior tibial artery (AT)',
      caliberMm: 2.9,
      flowOrder: 0.55,
      // Passes anteriorly (+Z) and laterally (-X) through interosseous membrane
      points: [
        [0.02, -0.55, -0.28], [-0.38, -0.78, 0.42], [-0.62, -1.35, 0.55], [-0.58, -1.95, 0.62]
      ]
    },
    {
      id: 'tibioperoneal',
      nameTr: 'Tibioperoneal trunkus (TPT)',
      nameEn: 'Tibioperoneal trunk (TPT)',
      caliberMm: 3.3,
      flowOrder: 0.54,
      points: [[0.02, -0.55, -0.28], [0.16, -0.88, -0.38]]
    },
    {
      id: 'peroneal',
      nameTr: 'Peroneal (fibular) arter',
      nameEn: 'Peroneal (fibular) artery',
      caliberMm: 2.6,
      flowOrder: 0.66,
      points: [[0.16, -0.88, -0.38], [-0.08, -1.35, -0.48], [-0.14, -1.88, -0.45]]
    },
    {
      id: 'posterior-tibial',
      nameTr: 'Posterior tibial arter (PT)',
      nameEn: 'Posterior tibial artery (PT)',
      caliberMm: 2.8,
      flowOrder: 0.66,
      points: [[0.16, -0.88, -0.38], [0.42, -1.35, -0.32], [0.55, -1.95, -0.28]]
    },
    {
      id: 'dorsalis-pedis',
      nameTr: 'Dorsalis pedis arteri',
      nameEn: 'Dorsalis pedis artery',
      caliberMm: 2.3,
      flowOrder: 0.84,
      points: [[-0.58, -1.95, 0.62], [-0.68, -2.28, 0.88], [-0.52, -2.48, 1.05]]
    },
    {
      id: 'lateral-plantar',
      nameTr: 'Lateral plantar arter',
      nameEn: 'Lateral plantar artery',
      caliberMm: 2.1,
      flowOrder: 0.85,
      points: [[0.55, -1.95, -0.28], [0.22, -2.35, -0.55], [-0.18, -2.48, -0.45]]
    },
    {
      id: 'medial-plantar',
      nameTr: 'Medial plantar arter',
      nameEn: 'Medial plantar artery',
      caliberMm: 1.7,
      flowOrder: 0.85,
      points: [[0.55, -1.95, -0.28], [0.68, -2.32, -0.35], [0.58, -2.52, -0.25]]
    },
    {
      id: 'plantar-arch',
      nameTr: 'Derin plantar ark',
      nameEn: 'Deep plantar arch',
      caliberMm: 1.9,
      flowOrder: 0.94,
      points: [[-0.18, -2.48, -0.45], [-0.38, -2.52, 0.25], [-0.52, -2.48, 1.05]]
    }
  ],

  visceral: [
    {
      id: 'visceral-aorta',
      nameTr: 'Karın aortu (Visseral)',
      nameEn: 'Abdominal aorta (Visceral)',
      caliberMm: 6.4,
      flowOrder: 0.0,
      points: [[0.0, 2.45, -0.15], [0.0, 1.25, -0.12], [0.0, 0.0, -0.1], [0.0, -1.25, -0.1], [0.0, -2.35, -0.12]]
    },
    {
      id: 'celiac',
      nameTr: 'Çölyak trunkus (T12)',
      nameEn: 'Celiac trunk (T12)',
      caliberMm: 4.2,
      flowOrder: 0.18,
      // Directed strongly anteriorly (+Z) so AP foreshortens it and Lateral opens it in full profile
      points: [[0.0, 1.72, -0.12], [0.12, 1.65, 0.72], [0.24, 1.76, 1.28]]
    },
    {
      id: 'left-gastric',
      nameTr: 'Sol gastrik arter',
      nameEn: 'Left gastric artery',
      caliberMm: 2.1,
      flowOrder: 0.36,
      points: [[0.24, 1.76, 1.28], [0.68, 2.15, 1.42], [1.12, 2.38, 1.25]]
    },
    {
      id: 'splenic',
      nameTr: 'Splenik arter',
      nameEn: 'Splenic artery',
      caliberMm: 3.2,
      flowOrder: 0.38,
      points: [[0.24, 1.76, 1.28], [0.85, 1.88, 0.85], [1.45, 1.68, 0.45], [1.98, 1.58, 0.15]]
    },
    {
      id: 'common-hepatic',
      nameTr: 'Ana hepatik arter',
      nameEn: 'Common hepatic artery',
      caliberMm: 3.1,
      flowOrder: 0.38,
      points: [[0.24, 1.76, 1.28], [-0.42, 1.68, 1.15], [-0.95, 1.62, 0.95]]
    },
    {
      id: 'proper-hepatic',
      nameTr: 'Proper hepatik arter',
      nameEn: 'Proper hepatic artery',
      caliberMm: 2.5,
      flowOrder: 0.56,
      points: [[-0.95, 1.62, 0.95], [-1.42, 1.92, 0.78], [-1.78, 2.12, 0.62]]
    },
    {
      id: 'gastroduodenal',
      nameTr: 'Gastroduodenal arter (GDA)',
      nameEn: 'Gastroduodenal artery (GDA)',
      caliberMm: 2.2,
      flowOrder: 0.58,
      points: [[-0.95, 1.62, 0.95], [-0.92, 1.12, 1.05], [-0.72, 0.72, 1.02]]
    },
    {
      id: 'sma',
      nameTr: 'Süperior mezenterik arter (SMA · L1)',
      nameEn: 'Superior mesenteric artery (SMA · L1)',
      caliberMm: 4.1,
      flowOrder: 0.25,
      // Leaves anterior aorta (+Z) and descends anteriorly
      points: [[0.0, 1.05, -0.12], [0.08, 0.72, 0.82], [0.22, -0.05, 1.25], [0.35, -0.95, 1.32]]
    },
    {
      id: 'renal',
      nameTr: 'Renal arter (L1–L2)',
      nameEn: 'Renal artery (L1–L2)',
      caliberMm: 3.8,
      flowOrder: 0.28,
      // Right renal leaves posterolaterally (-X, -Z), left renal laterally (+X, -Z)
      points: [[0.0, 0.55, -0.12], [-0.75, 0.42, -0.35], [-1.52, 0.28, -0.58]],
      contraPoints: [[0.0, 0.68, -0.12], [0.75, 0.62, -0.25], [1.48, 0.55, -0.42]]
    },
    {
      id: 'accessory-renal',
      nameTr: 'Aksesuar renal arter (Alt kutup)',
      nameEn: 'Accessory renal artery (Lower pole)',
      caliberMm: 2.0,
      flowOrder: 0.42,
      dashed: true,
      points: [[0.0, -0.05, -0.12], [-0.78, -0.18, -0.38], [-1.45, -0.22, -0.55]]
    },
    {
      id: 'gonadal',
      nameTr: 'Gonadal arter',
      nameEn: 'Gonadal artery',
      caliberMm: 1.5,
      flowOrder: 0.52,
      points: [[0.0, -0.45, -0.08], [-0.38, -1.25, 0.15], [-0.62, -2.05, 0.25]],
      contraPoints: [[0.0, -0.45, -0.08], [0.38, -1.25, 0.15], [0.62, -2.05, 0.25]]
    },
    {
      id: 'ima',
      nameTr: 'İnferior mezenterik arter (İMA · L3)',
      nameEn: 'Inferior mesenteric artery (IMA · L3)',
      caliberMm: 2.6,
      flowOrder: 0.45,
      points: [[0.0, -1.15, -0.1], [0.42, -1.48, 0.55], [0.95, -1.92, 0.78]]
    }
  ],

  arm: [
    {
      id: 'subclavian',
      nameTr: 'Sol subklavyan arter',
      nameEn: 'Left subclavian artery',
      caliberMm: 4.8,
      flowOrder: 0.05,
      points: [[-1.45, 2.35, -0.35], [-0.85, 2.15, -0.12], [-0.15, 1.98, 0.08], [0.55, 1.85, 0.15]]
    },
    {
      id: 'vertebral',
      nameTr: 'Vertebral arter',
      nameEn: 'Vertebral artery',
      caliberMm: 2.6,
      flowOrder: 0.18,
      points: [[-0.85, 2.15, -0.12], [-0.92, 2.68, -0.48]]
    },
    {
      id: 'internal-thoracic',
      nameTr: 'İnternal torasik arter (LIMA)',
      nameEn: 'Internal thoracic artery (LIMA)',
      caliberMm: 2.5,
      flowOrder: 0.22,
      points: [[-0.55, 2.08, -0.02], [-0.95, 1.25, 0.55], [-1.18, 0.35, 0.72], [-1.28, -0.45, 0.75]]
    },
    {
      id: 'thyrocervical',
      nameTr: 'Tiroservikal trunkus',
      nameEn: 'Thyrocervical trunk',
      caliberMm: 2.1,
      flowOrder: 0.24,
      points: [[-0.25, 2.0, 0.05], [-0.18, 2.52, 0.18]]
    },
    {
      id: 'costocervical',
      nameTr: 'Kostoservikal trunkus',
      nameEn: 'Costocervical trunk',
      caliberMm: 1.8,
      flowOrder: 0.26,
      points: [[0.15, 1.92, 0.1], [0.28, 2.32, -0.25]]
    },
    {
      id: 'axillary',
      nameTr: 'Aksiller arter',
      nameEn: 'Axillary artery',
      caliberMm: 4.3,
      flowOrder: 0.32,
      points: [[0.55, 1.85, 0.15], [0.85, 1.35, 0.12], [0.72, 0.68, 0.1]]
    },
    {
      id: 'brachial',
      nameTr: 'Brakiyal arter',
      nameEn: 'Brachial artery',
      caliberMm: 3.9,
      flowOrder: 0.48,
      points: [[0.72, 0.68, 0.1], [0.58, 0.05, 0.15], [0.45, -0.58, 0.22]]
    },
    {
      id: 'radial',
      nameTr: 'Radiyal arter',
      nameEn: 'Radial artery',
      caliberMm: 2.8,
      flowOrder: 0.66,
      points: [[0.45, -0.58, 0.22], [0.82, -1.15, 0.38], [1.05, -1.72, 0.45], [1.12, -2.18, 0.42]]
    },
    {
      id: 'ulnar',
      nameTr: 'Ulnar arter',
      nameEn: 'Ulnar artery',
      caliberMm: 2.9,
      flowOrder: 0.66,
      points: [[0.45, -0.58, 0.22], [0.08, -1.08, 0.15], [-0.15, -1.68, 0.18], [-0.18, -2.18, 0.22]]
    },
    {
      id: 'interosseous',
      nameTr: 'Ana interosseöz arter',
      nameEn: 'Common interosseous artery',
      caliberMm: 2.0,
      flowOrder: 0.74,
      points: [[0.08, -1.08, 0.15], [0.38, -1.52, -0.18], [0.42, -2.05, -0.22]]
    },
    {
      id: 'distal-radial',
      nameTr: 'Distal radiyal giriş (Enfiye çukuru)',
      nameEn: 'Distal radial access (Snuffbox)',
      caliberMm: 2.2,
      flowOrder: 0.86,
      points: [[1.12, -2.18, 0.42], [1.02, -2.35, 0.12]]
    },
    {
      id: 'superficial-arch',
      nameTr: 'Yüzeyel palmar ark',
      nameEn: 'Superficial palmar arch',
      caliberMm: 2.2,
      flowOrder: 0.92,
      points: [[-0.18, -2.18, 0.22], [0.35, -2.52, 0.35], [0.95, -2.38, 0.38]]
    },
    {
      id: 'deep-arch',
      nameTr: 'Derin palmar ark',
      nameEn: 'Deep palmar arch',
      caliberMm: 2.0,
      flowOrder: 0.94,
      points: [[1.02, -2.35, 0.12], [0.45, -2.38, 0.05], [-0.08, -2.25, 0.12]]
    }
  ]
};

/**
 * Standard Cath Lab Peripheral Projections per vascular territory
 */
export const PERIPHERAL_PRESETS = {
  aortoiliac: [
    {
      id: 'ai-ap',
      name: { tr: 'AP Aortogram', en: 'AP Aortogram' },
      alpha: 0,
      beta: 0,
      targetId: 'abdominal-aorta',
      target: { tr: 'Aort bifurkasyonu L4 & bilateral ana iliyak', en: 'Aortic bifurcation L4 & bilateral CIA' }
    },
    {
      id: 'ai-right-obl',
      name: { tr: 'Sağ İliyak (Karşı Oblik)', en: 'Right Iliac (Contralateral)' },
      alpha: 26,
      beta: -10,
      targetId: 'internal-iliac',
      target: { tr: 'LAO 26° CAU 10° · Sağ İİA/EİA ağzını açar', en: 'LAO 26° CAU 10° · Opens R IIA/EIA origin' }
    },
    {
      id: 'ai-left-obl',
      name: { tr: 'Sol İliyak (Karşı Oblik)', en: 'Left Iliac (Contralateral)' },
      alpha: -26,
      beta: -10,
      targetId: 'common-iliac',
      target: { tr: 'RAO 26° CAU 10° · Sol İİA/EİA ağzını açar', en: 'RAO 26° CAU 10° · Opens L IIA/EIA origin' }
    },
    {
      id: 'ai-pelvic-cau',
      name: { tr: 'Pelvik Kaudal (Gluteal)', en: 'Pelvic Caudal (Gluteal)' },
      alpha: 0,
      beta: -20,
      targetId: 'iia-posterior',
      target: { tr: 'AP CAU 20° · İç iliyak ön/arka divizyon ayrımı', en: 'AP CAU 20° · IIA anterior/posterior division' }
    }
  ],
  femoral: [
    {
      id: 'fem-ap',
      name: { tr: 'AP Femur Başı Giriş', en: 'AP Femoral Head Stick' },
      alpha: 0,
      beta: 0,
      targetId: 'puncture-zone',
      target: { tr: 'Femur başı merkezi & İEA alt sınırı', en: 'Femoral head center & below IEA' }
    },
    {
      id: 'fem-ipsi-rao',
      name: { tr: 'Sağ Kasık İpsilateral', en: 'Right Groin Ipsilateral' },
      alpha: -32,
      beta: 0,
      targetId: 'profunda',
      target: { tr: 'RAO 32° · Sağ SFA ve profunda femoris ayrımı', en: 'RAO 32° · Opens R SFA & profunda origin' }
    },
    {
      id: 'fem-contra-lao',
      name: { tr: 'Sol Kasık / Karşı Açı', en: 'Left Groin / Contra View' },
      alpha: 30,
      beta: 0,
      targetId: 'femoral-bifurcation',
      target: { tr: 'LAO 30° · Sirkümfleks dallar ve sol bifurkasyon', en: 'LAO 30° · Circumflex branches & L bifurcation' }
    },
    {
      id: 'fem-cra',
      name: { tr: 'Kraniyal Bifurkasyon', en: 'Cranial Bifurcation' },
      alpha: -25,
      beta: 12,
      targetId: 'lateral-circumflex',
      target: { tr: 'RAO 25° CRA 12° · Proksimal profunda uzaması', en: 'RAO 25° CRA 12° · Proximal profunda elongation' }
    }
  ],
  runoff: [
    {
      id: 'run-ap',
      name: { tr: 'AP Bolus-Chase', en: 'AP Bolus-Chase' },
      alpha: 0,
      beta: 0,
      targetId: 'sfa',
      target: { tr: 'SFA, Popliteal P1-P3 ve 3 damar dizaltı akım', en: 'SFA, Popliteal P1-P3 & 3-vessel tibial runoff' }
    },
    {
      id: 'run-trifurcation',
      name: { tr: 'Sağ Trifurkasyon (RAO)', en: 'Right Trifurcation (RAO)' },
      alpha: -28,
      beta: 0,
      targetId: 'anterior-tibial',
      target: { tr: 'RAO 28° · AT çıkışı ve TPT süperpozisyonunu açar', en: 'RAO 28° · Opens AT origin & TPT overlap' }
    },
    {
      id: 'run-pedal-lat',
      name: { tr: 'Lateral Pedal Ark', en: 'Lateral Pedal Arch' },
      alpha: -75,
      beta: 0,
      targetId: 'plantar-arch',
      target: { tr: 'RAO 75° · Dorsalis pedis, plantar ark ve topuk', en: 'RAO 75° · Dorsalis pedis, plantar arch & heel' }
    },
    {
      id: 'run-genicular',
      name: { tr: 'Hafif Oblik Popliteal', en: 'Oblique Popliteal P2' },
      alpha: 18,
      beta: 0,
      targetId: 'pop-p2',
      target: { tr: 'LAO 18° · Diz eklemi P2 ve geniküler ağ', en: 'LAO 18° · Knee joint P2 & genicular network' }
    }
  ],
  visceral: [
    {
      id: 'visc-ap',
      name: { tr: 'AP Visseral Harita', en: 'AP Visceral Naming' },
      alpha: 0,
      beta: 0,
      mode: 'ap',
      targetId: 'visceral-aorta',
      target: { tr: 'Çölyak dalları, hepatik, splenik ve bilateral renal', en: 'Celiac branches, hepatic, splenic & bilateral renals' }
    },
    {
      id: 'visc-lat',
      name: { tr: 'Lateral Mezenterik Ostium', en: 'Lateral Mesenteric Ostia' },
      alpha: 85,
      beta: 0,
      mode: 'lateral',
      targetId: 'celiac',
      target: { tr: 'LAO 85° · Çölyak ve SMA ön duvar çıkış profili', en: 'LAO 85° · Celiac & SMA anterior ostial profile' }
    },
    {
      id: 'visc-renal',
      name: { tr: 'LAO Renal Ostium', en: 'LAO Renal Ostium' },
      alpha: 18,
      beta: 0,
      mode: 'oblique',
      targetId: 'renal',
      target: { tr: 'LAO 18° · Posterolateral sağ/sol renal ağızlar', en: 'LAO 18° · Posterolateral R/L renal ostia' }
    },
    {
      id: 'visc-gda',
      name: { tr: 'RAO Hepatik / GDA', en: 'RAO Hepatic / GDA' },
      alpha: -22,
      beta: 8,
      mode: 'ap',
      targetId: 'gastroduodenal',
      target: { tr: 'RAO 22° CRA 8° · Proper hepatik ve GDA ayrımı', en: 'RAO 22° CRA 8° · Proper hepatic & GDA separation' }
    }
  ],
  arm: [
    {
      id: 'arm-arch',
      name: { tr: 'LAO Subklavyan & Ark', en: 'LAO Subclavian & Arch' },
      alpha: 35,
      beta: 0,
      targetId: 'subclavian',
      target: { tr: 'LAO 35° · Sol subklavyan ostium, vertebral ve LIMA', en: 'LAO 35° · L subclavian ostium, vertebral & LIMA' }
    },
    {
      id: 'arm-ap',
      name: { tr: 'AP Önkol & Radiyal', en: 'AP Forearm & Radial' },
      alpha: 0,
      beta: 0,
      targetId: 'radial',
      target: { tr: 'Brakiyal bifurkasyon, radiyal, ulnar ve interosseöz', en: 'Brachial bifurcation, radial, ulnar & interosseous' }
    },
    {
      id: 'arm-snuffbox',
      name: { tr: 'Enfiye Çukuru / Palmar', en: 'Snuffbox / Palmar Arch' },
      alpha: -22,
      beta: 10,
      targetId: 'distal-radial',
      target: { tr: 'RAO 22° CRA 10° · Distal radiyal ve derin palmar ark', en: 'RAO 22° CRA 10° · Distal radial & deep palmar arch' }
    },
    {
      id: 'arm-vertebral',
      name: { tr: 'Kraniyal Vertebral Kök', en: 'Cranial Vertebral Origin' },
      alpha: 15,
      beta: 18,
      targetId: 'vertebral',
      target: { tr: 'LAO 15° CRA 18° · Vertebral ve tiroservikal ayrımı', en: 'LAO 15° CRA 18° · Vertebral vs thyrocervical' }
    }
  ]
};

/**
 * Clinical Lesion, CTO & Intervention Simulator Scenarios
 */
export const PERIPHERAL_LESIONS = [
  {
    id: 'none',
    view: 'all',
    vesselId: null,
    pct: 0,
    posFraction: 0.5,
    name: { tr: 'Normal Patensi (Lezyon Yok)', en: 'Normal Patency (No Lesion)' },
    tasc: '-',
    rutherford: '0',
    abiPreset: { ankle: 128, brachial: 120, toe: 96 },
    access: { tr: 'Standart tanısal kateter', en: 'Standard diagnostic catheter' },
    recAlpha: 0,
    recBeta: 0,
    desc: {
      tr: 'Tüm periferik arter segmentlerinde kesintisiz antegrad kontrast doluşu ve normal trifazik hemodinamik profil.',
      en: 'Uninterrupted antegrade contrast opacification across all peripheral arterial segments with normal hemodynamic profile.'
    }
  },
  {
    id: 'leriche-tasc-d',
    view: 'aortoiliac',
    vesselId: 'abdominal-aorta',
    pct: 100,
    posFraction: 0.72,
    isCto: true,
    name: { tr: 'Leriche Sendromu · İnfrarenal Aortoiliyak TASC D Oklüzyon (%100)', en: 'Leriche Syndrome · Infrarenal Aortoiliac TASC D CTO (100%)' },
    tasc: 'TASC D',
    rutherford: 'I/3 (Fontaine IIb)',
    abiPreset: { ankle: 46, brachial: 124, toe: 34 },
    access: { tr: 'Bilateral femoral + sol radiyal/brakiyal kombine yaklaşım', en: 'Dual bilateral femoral + left radial/brachial access' },
    recAlpha: 0,
    recBeta: -10,
    collateral: {
      from: [0.0, 1.55, 0.18],
      via: [[-1.65, 0.45, 0.65], [-1.72, -0.85, 0.82]],
      to: [-1.48, -1.45, 0.68],
      labelTr: 'Lomber / İEA kollateral doluş',
      labelEn: 'Lumbar / IEA collateral reconstitution'
    },
    desc: {
      tr: 'İnfrarenal aort bifurkasyonu ve bilateral CIA tam tıkanıklığı. Kalça-uyluk klodikasyonu ve femoral nabız yokluğu triadı. Distal dış iliyaklar lomber, mezenterik ve inferior epigastrik kollaterallerle dolar.',
      en: 'Complete occlusion of the infrarenal aortic bifurcation and bilateral CIAs. Classic triad of buttock/thigh claudication and absent femoral pulses. Distal EIAs reconstitute via lumbar, mesenteric, and inferior epigastric collaterals.'
    }
  },
  {
    id: 'right-cia-ostial',
    view: 'aortoiliac',
    vesselId: 'common-iliac',
    pct: 80,
    posFraction: 0.45,
    name: { tr: 'Sağ Ana İliyak (CIA) Eksantrik Darlık (%80 · TASC A)', en: 'Right Common Iliac (CIA) Eccentric Stenosis (80% · TASC A)' },
    tasc: 'TASC A',
    rutherford: 'I/2 (Fontaine IIb)',
    abiPreset: { ankle: 78, brachial: 122, toe: 58 },
    access: { tr: 'İpsilateral retrograd CFA veya karşıdan crossover 6F sheath', en: 'Ipsilateral retrograde CFA or contralateral 6F crossover sheath' },
    recAlpha: 26,
    recBeta: -10,
    desc: {
      tr: 'Sağ CIA gövdesinde hemodinamik anlamlı darlık (istirahat sistolik gradyan >10 mmHg). Karşı oblik (LAO 26° CAU 10°) sağ iç ve dış iliyak bifurkasyonunu açarak stent yerleşimini korur.',
      en: 'Hemodynamically significant right CIA stenosis (resting peak gradient >10 mmHg). Contralateral oblique (LAO 26° CAU 10°) opens the right IIA/EIA bifurcation for accurate stent deployment.'
    }
  },
  {
    id: 'cfa-bifurcation-plaque',
    view: 'femoral',
    vesselId: 'common-femoral',
    pct: 75,
    posFraction: 0.82,
    name: { tr: 'Sağ CFA Kalsifik Plak & Bifurkasyon Darlığı (%75)', en: 'Right CFA Calcified Plaque & Bifurcation Stenosis (75%)' },
    tasc: 'Cerrahi / Hibrit',
    rutherford: 'I/3 (Fontaine IIb)',
    abiPreset: { ankle: 70, brachial: 122, toe: 50 },
    access: { tr: 'Karşı sol CFA crossover 6F/7F kılıf (hedef kasığa ponksiyon yapılmaz)', en: 'Contralateral left CFA crossover 6F/7F sheath (avoid stick in diseased CFA)' },
    recAlpha: -32,
    recBeta: 0,
    desc: {
      tr: 'Femur başı üzerinde distal CFA ve bifurkasyona uzanan kalsifik lezyon (Medina 1,1,0). AP görünümde profunda ağzı gizlenir; sağ ipsilateral oblik (RAO 32°) SFA-profunda çatalını açar.',
      en: 'Calcified distal CFA plaque extending into the bifurcation over the femoral head. AP projection hides the profunda ostium; right ipsilateral oblique (RAO 32°) separates the SFA-profunda fork.'
    }
  },
  {
    id: 'profunda-ostial-stenosis',
    view: 'femoral',
    vesselId: 'profunda',
    pct: 82,
    posFraction: 0.35,
    name: { tr: 'Sağ Profunda Femoris Ostial Darlık (%82)', en: 'Right Profunda Femoris Ostial Stenosis (82%)' },
    tasc: 'Kollateral Ana Damar',
    rutherford: 'II/4 (Fontaine III)',
    abiPreset: { ankle: 54, brachial: 126, toe: 38 },
    access: { tr: 'Karşı femoral crossover 6F kılıf', en: 'Contralateral femoral crossover 6F sheath' },
    recAlpha: -32,
    recBeta: 0,
    desc: {
      tr: 'Profunda femoris uyluğun en kritik kollateral kaynağıdır. AP projeksiyonda SFA proksimali ile üst üste biner; ostial darlığı görmek ve balon/stent taşmasını önlemek için ipsilateral RAO 30–35° şarttır.',
      en: 'The profunda femoris is the critical collateral lifeline of the thigh. On AP it overlaps the proximal SFA; ipsilateral RAO 30–35° is mandatory to profile the ostium and avoid jailing.'
    }
  },
  {
    id: 'sfa-hunter-cto',
    view: 'runoff',
    vesselId: 'sfa',
    pct: 100,
    posFraction: 0.65,
    isCto: true,
    name: { tr: 'SFA Hunter Kanalı Kronik Total Oklüzyon (%100 CTO · 12 cm · TASC B)', en: 'SFA Hunter Canal Chronic Total Occlusion (100% CTO · 12 cm · TASC B)' },
    tasc: 'TASC B',
    rutherford: 'I/3 (Fontaine IIb)',
    abiPreset: { ankle: 62, brachial: 122, toe: 45 },
    access: { tr: 'Karşıdan crossover uzun kılıf veya antegrad CFA (+ gerekirse retrograde pedal/popliteal)', en: 'Contralateral crossover sheath or antegrade CFA (+ retrograde pedal if needed)' },
    recAlpha: 0,
    recBeta: 0,
    collateral: {
      from: [0.16, 2.25, 0.28],
      via: [[-0.65, 1.55, 0.12], [-0.58, 0.92, -0.08]],
      to: [0.08, 1.02, -0.22],
      labelTr: 'Geniküler kollateral köprü (P1 doluşu)',
      labelEn: 'Genicular collateral bridge (P1 reconstitution)'
    },
    desc: {
      tr: 'Addüktör (Hunter) kanalında 12 cm\'lik tek SFA tam tıkanıklığı (TASC II B: ≤15 cm, diz altı popliteal tutulumu yok; toplamı >15 cm çoklu lezyonlar TASC C olurdu). Popliteal P1 segmenti inen geniküler ve profunda kollateralleri üzerinden gecikmeli olarak yeniden dolar.',
      en: 'Single 12 cm SFA occlusion within the adductor (Hunter) canal (TASC II B: ≤15 cm, infrageniculate popliteal spared; multiple lesions totalling >15 cm would be TASC C). The popliteal P1 segment reconstitutes on delayed bolus-chase frames via descending genicular and profunda collaterals.'
    }
  },
  {
    id: 'btk-at-clti',
    view: 'runoff',
    vesselId: 'anterior-tibial',
    pct: 88,
    posFraction: 0.32,
    name: { tr: 'Anterior Tibial Ostial Darlık (%88 · KTİ / Rutherford 5)', en: 'Anterior Tibial Ostial Stenosis (88% · CLTI / Rutherford 5)' },
    tasc: 'BTK / CLTI',
    rutherford: 'III/5 (Fontaine IV)',
    abiPreset: { ankle: 178, brachial: 122, toe: 26 },
    access: { tr: 'İpsilateral antegrad CFA 5F/6F + 0.014" dizaltı tel', en: 'Ipsilateral antegrade CFA 5F/6F + 0.014" BTK wire' },
    recAlpha: -28,
    recBeta: 0,
    desc: {
      tr: 'Ayak sırtında ülseri olan diyabetik hastada (medyal kalsinozis nedeniyle ABI >1.40, TBI 0.21) anterior tibial arter çıkış darlığı. İpsilateral oblik (RAO 28°) AT çıkışını TPT gövdesinden ayırır.',
      en: 'Anterior tibial origin stenosis in a diabetic patient with a dorsal foot ulcer (falsely elevated ABI >1.40 from medial calcinosis, TBI 0.21). RAO 28° separates the AT takeoff from the TPT.'
    }
  },
  {
    id: 'renal-ostial-ras',
    view: 'visceral',
    vesselId: 'renal',
    pct: 85,
    posFraction: 0.35,
    name: { tr: 'Sağ Renal Arter Aterosklerotik Ostial Darlık (%85)', en: 'Right Renal Artery Atherosclerotic Ostial Stenosis (85%)' },
    tasc: 'Renovasküler',
    rutherford: '-',
    abiPreset: { ankle: 132, brachial: 148, toe: 98 },
    access: { tr: 'Femoral veya sol radiyal 6F RDC / JR4 kılavuz kateter (no-touch tekniği)', en: 'Femoral or left radial 6F RDC / JR4 guiding catheter (no-touch technique)' },
    recAlpha: 18,
    recBeta: 0,
    desc: {
      tr: 'Aort duvarı plağının sağ renal ostiuma uzanımı (<5 mm). Renal arterler posterolateral çıktığı için LAO 15–20° projeksiyon sağ renal ostiumu aort kenarından ayırarak gerçek darlığı gösterir.',
      en: 'Aortic wall plaque spilling into the right renal ostium (<5 mm). Because the renal arteries arise posterolaterally, LAO 15–20° profiles the right renal ostium clear of the aortic wall.'
    }
  },
  {
    id: 'celiac-sma-mesenteric',
    view: 'visceral',
    vesselId: 'sma',
    pct: 85,
    posFraction: 0.32,
    name: { tr: 'Kronik Mezenterik İskemi · SMA Ostial Darlık (%85)', en: 'Chronic Mesenteric Ischemia · SMA Ostial Stenosis (85%)' },
    tasc: 'Mezenterik',
    rutherford: '-',
    abiPreset: { ankle: 118, brachial: 120, toe: 88 },
    access: { tr: 'Sol radiyal/brakiyal (aşağı açılı SMA için avantajlı) veya femoral LIMA/JR4', en: 'Left radial/brachial (favorable downward SMA angle) or femoral LIMA/JR4' },
    recAlpha: 85,
    recBeta: 0,
    desc: {
      tr: 'Süperior mezenterik arter aort ön yüzünden çıktığı için AP projeksiyonda ostium tam karşıdan (end-on) görünür ve darlık gizlenir. Tam lateral (LAO 85°) projeksiyon ostial darlığı profilde açar.',
      en: 'Because the SMA arises from the anterior aorta, its ostium is seen end-on in AP and severe stenosis is hidden. True lateral (LAO 85°) profiles the anterior origin.'
    }
  },
  {
    id: 'subclavian-steal',
    view: 'arm',
    vesselId: 'subclavian',
    pct: 90,
    posFraction: 0.28,
    name: { tr: 'Sol Subklavyan Proksimal Darlık (%90 · Subklavyan Steal)', en: 'Left Subclavian Proximal Stenosis (90% · Subclavian Steal)' },
    tasc: 'Üst Ekstremite',
    rutherford: '-',
    abiPreset: { ankle: 124, brachial: 88, toe: 92 },
    access: { tr: 'Sol radiyal + sağ femoral çift erişim', en: 'Dual left radial + right femoral access' },
    recAlpha: 35,
    recBeta: 0,
    desc: {
      tr: 'Vertebral ve LIMA çıkışının proksimalinde ağır sol subklavyan darlığı. Sol kol egzersiziyle ipsilateral vertebral arterde retrograd akım (steal) ve LIMA greftli hastalarda koroner-subklavyan steal gelişir. LAO 35° ark çıkışını açar.',
      en: 'Severe proximal left subclavian stenosis upstream of the vertebral and LIMA origins. Causes retrograde vertebral flow (subclavian steal) and coronary-subclavian steal in LIMA-grafted patients. LAO 35° opens the arch origin.'
    }
  }
];

/**
 * Projects a 3D peripheral coordinate [x, y, z] into 2D detector coordinates (u, v, depth)
 */
export function projectPeripheralPoint(pt, alpha = 0, beta = 0, beatPhase = 0) {
  const pulse = 1.0 + 0.018 * Math.sin(beatPhase * Math.PI * 2);
  const px = pt[0] * pulse;
  const py = pt[1];
  const pz = pt[2] * pulse;

  const radA = (alpha * Math.PI) / 180;
  const radB = (beta * Math.PI) / 180;

  const cosA = Math.cos(radA);
  const sinA = Math.sin(radA);
  const x1 = px * cosA - pz * sinA;
  const y1 = py;
  const z1 = px * sinA + pz * cosA;

  const cosB = Math.cos(radB);
  const sinB = Math.sin(radB);
  const x2 = x1;
  const y2 = y1 * cosB - z1 * sinB;
  const z2 = y1 * sinB + z1 * cosB;

  const focalDist = 9.0;
  const perspective = focalDist / Math.max(2.5, focalDist + z2 * 0.35);

  return {
    u: x2 * perspective,
    v: -y2 * perspective,
    depth: z2,
    perspective
  };
}

function dist3D(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * Computes real-time foreshortening, elongation index, and bifurcation overlap status
 */
export function computePeripheralTelemetry(viewId, alpha = 0, beta = 0, selectedId = null) {
  const branches = PERIPHERAL_3D_TREES[viewId] || PERIPHERAL_3D_TREES.aortoiliac;
  const metrics = {};

  for (const b of branches) {
    let len3 = 0;
    let len2 = 0;
    for (let i = 0; i < b.points.length - 1; i += 1) {
      const p1 = b.points[i];
      const p2 = b.points[i + 1];
      const q1 = projectPeripheralPoint(p1, alpha, beta);
      const q2 = projectPeripheralPoint(p2, alpha, beta);
      len3 += dist3D(p1, p2);
      len2 += Math.hypot(q2.u - q1.u, q2.v - q1.v);
    }
    const elongation = len3 > 0 ? Math.min(1.0, Math.max(0.12, len2 / (len3 * 0.92))) : 1.0;
    const foreshorteningPct = Math.round((1.0 - elongation) * 100);
    metrics[b.id] = {
      id: b.id,
      nameTr: b.nameTr,
      nameEn: b.nameEn,
      elongation: Number(elongation.toFixed(2)),
      foreshorteningPct,
      rating: elongation >= 0.8 ? 'excellent' : elongation >= 0.58 ? 'moderate' : 'severe'
    };
  }

  const targetBranch = (selectedId && metrics[selectedId]) ? metrics[selectedId] : metrics[branches[0].id];

  // Territory-specific clinical bifurcation separation rules
  let overlapStatus = {
    state: 'ok',
    tr: 'Bifurkasyon Açık (Optimal)',
    en: 'Bifurcation Opened (Optimal)'
  };

  if (viewId === 'aortoiliac') {
    if (Math.abs(alpha) < 15) {
      overlapStatus = {
        state: 'moderate',
        tr: 'İİA/EİA Süperpoze · Karşı Oblik 25° Önerilir',
        en: 'IIA/EIA Overlap · Use 25° Contralateral Oblique'
      };
    } else if (alpha >= 15) {
      overlapStatus = {
        state: 'excellent',
        tr: 'Sağ İİA/EİA Bifurkasyonu Açık (LAO)',
        en: 'Right IIA/EIA Bifurcation Opened (LAO)'
      };
    } else {
      overlapStatus = {
        state: 'excellent',
        tr: 'Sol İİA/EİA Bifurkasyonu Açık (RAO)',
        en: 'Left IIA/EIA Bifurcation Opened (RAO)'
      };
    }
  } else if (viewId === 'femoral') {
    if (alpha > -18 && alpha < 18) {
      overlapStatus = {
        state: 'moderate',
        tr: 'Profunda Ostium Süperpoze · RAO 30° Önerilir',
        en: 'Profunda Ostium Overlap · Use RAO 30°'
      };
    } else if (alpha <= -18) {
      overlapStatus = {
        state: 'excellent',
        tr: 'Sağ SFA / Profunda Çatalı Açık (RAO)',
        en: 'Right SFA / Profunda Fork Opened (RAO)'
      };
    } else {
      overlapStatus = {
        state: 'excellent',
        tr: 'Sol Kasık / Sirkümfleks Açısı Açık (LAO)',
        en: 'Left Groin / Circumflex Opened (LAO)'
      };
    }
  } else if (viewId === 'runoff') {
    if (Math.abs(alpha) < 16) {
      overlapStatus = {
        state: selectedId === 'anterior-tibial' || selectedId === 'tibioperoneal' ? 'moderate' : 'excellent',
        tr: 'AP Bolus-Chase · AT Çıkışı İçin RAO 25°',
        en: 'AP Bolus-Chase · Use RAO 25° for AT Origin'
      };
    } else {
      overlapStatus = {
        state: 'excellent',
        tr: 'AT & Tibioperoneal Trunkus Ayrımı Açık',
        en: 'AT & Tibioperoneal Trunk Separated'
      };
    }
  } else if (viewId === 'visceral') {
    if (selectedId === 'celiac' || selectedId === 'sma') {
      if (Math.abs(alpha) < 55) {
        overlapStatus = {
          state: 'severe',
          tr: 'Ön Ostium End-On · Lateral (85°) Şart',
          en: 'Anterior Ostium End-On · Use Lateral (85°)'
        };
      } else {
        overlapStatus = {
          state: 'excellent',
          tr: 'Çölyak / SMA Ostium Profilde Açık',
          en: 'Celiac / SMA Ostium in Full Profile'
        };
      }
    } else if (Math.abs(alpha) >= 12 && Math.abs(alpha) <= 35) {
      overlapStatus = {
        state: 'excellent',
        tr: 'Renal Ostiumlar Aort Duvarından Ayrık',
        en: 'Renal Ostia Separated from Aortic Wall'
      };
    } else if (Math.abs(alpha) > 60) {
      overlapStatus = {
        state: 'excellent',
        tr: 'Lateral Çölyak & SMA Profil Görünümü',
        en: 'Lateral Celiac & SMA Profile View'
      };
    } else {
      overlapStatus = {
        state: 'ok',
        tr: 'AP Dal Haritası · Renal İçin LAO 18°',
        en: 'AP Naming View · Use LAO 18° for Renals'
      };
    }
  } else if (viewId === 'arm') {
    if (selectedId === 'subclavian' && alpha < 20) {
      overlapStatus = {
        state: 'moderate',
        tr: 'Subklavyan Kök · LAO 35° Ark Açısı Önerilir',
        en: 'Subclavian Origin · Use LAO 35° Arch View'
      };
    } else {
      overlapStatus = {
        state: 'excellent',
        tr: 'Üst Ekstremite / Radiyal Aks Açık',
        en: 'Upper Extremity / Radial Axis Clear'
      };
    }
  }

  return {
    metrics,
    target: targetBranch,
    overlapStatus
  };
}

/**
 * ABI & TBI Hemodynamic Calculator (2016 AHA/ACC PAD Guideline)
 */
export function computeAbiTbi({ ankle = 124, brachial = 120, toe = 90 } = {}) {
  const a = Number(ankle);
  const b = Number(brachial);
  const t = Number(toe);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0 || a < 0) {
    return { valid: false };
  }
  const abi = Number((a / b).toFixed(2));
  const tbi = Number.isFinite(t) && t >= 0 ? Number((t / b).toFixed(2)) : null;

  let status = 'normal';
  let labelTr = 'Normal (1.00–1.40)';
  let labelEn = 'Normal (1.00–1.40)';
  // Rutherford and Fontaine are clinical (symptom-based) grades; ABI alone cannot assign them.
  let stageTr = 'İstirahatte hemodinamik PAH yok; semptom varsa egzersiz ABI';
  let stageEn = 'No haemodynamic PAD at rest; exercise ABI if symptoms suggest PAD';

  if (abi > 1.4) {
    status = 'noncompressible';
    labelTr = 'Sıkıştırılamaz Damar (>1.40 · Medyal Kalsinozis)';
    labelEn = 'Noncompressible (>1.40 · Medial Calcinosis)';
    if (tbi !== null && tbi < 0.7 && t < 30) {
      stageTr = `TBI ${tbi.toFixed(2)} (<0.70) · ayak parmağı basıncı <30 mmHg; istirahat ağrısı veya doku kaybıyla KTİ lehine`;
      stageEn = `TBI ${tbi.toFixed(2)} (<0.70) · toe pressure <30 mmHg; supports CLTI with rest pain or tissue loss`;
    } else if (tbi !== null && tbi < 0.7) {
      stageTr = `TBI ${tbi.toFixed(2)} (<0.70) · PAH Doğrulandı (TBI Kriteri)`;
      stageEn = `TBI ${tbi.toFixed(2)} (<0.70) · PAD Confirmed by TBI`;
    } else {
      stageTr = 'TBI <0.70 tanı eşiğidir (Diyabet / KBH)';
      stageEn = 'Use TBI <0.70 threshold (Diabetes / CKD)';
    }
  } else if (abi >= 1.0) {
    status = 'normal';
  } else if (abi >= 0.91) {
    status = 'borderline';
    labelTr = 'Sınırda ABI (0.91–0.99)';
    labelEn = 'Borderline ABI (0.91–0.99)';
    stageTr = 'Egzersiz sonrası ABI testi önerilir';
    stageEn = 'Consider post-exercise ABI testing';
  } else if (abi >= 0.7) {
    status = 'mild';
    labelTr = 'Hafif PAH (0.70–0.90)';
    labelEn = 'Mild PAD (0.70–0.90)';
    stageTr = 'PAH tanısı (ABI ≤0.90); Rutherford/Fontaine evresi semptomla belirlenir';
    stageEn = 'PAD confirmed (ABI ≤0.90); Rutherford/Fontaine stage is set by symptoms';
  } else if (abi > 0.4) {
    status = 'moderate';
    labelTr = 'Orta PAH (0.41–0.69)';
    labelEn = 'Moderate PAD (0.41–0.69)';
    stageTr = 'PAH tanısı (ABI ≤0.90); Rutherford/Fontaine evresi semptomla belirlenir';
    stageEn = 'PAD confirmed (ABI ≤0.90); Rutherford/Fontaine stage is set by symptoms';
  } else {
    status = 'severe';
    labelTr = 'Ağır PAH (≤0.40)';
    labelEn = 'Severe PAD (≤0.40)';
    stageTr = 'Ağır PAH; KTİ tanısı istirahat ağrısı veya doku kaybı ile ayak bileği <50 ya da parmak <30 mmHg gerektirir';
    stageEn = 'Severe PAD; CLTI needs rest pain or tissue loss with ankle <50 or toe <30 mmHg';
  }

  return {
    valid: true,
    abi,
    tbi,
    status,
    labelTr,
    labelEn,
    stageTr,
    stageEn
  };
}

/**
 * Renders the live Peripheral Fluoroscopy / DSA / Roadmap Canvas
 */
export function renderPeripheralFluoroscopyCanvas(canvas, state) {
  if (!canvas) return [];
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);

  const W = Number(canvas.dataset.logicalW || canvas.getAttribute('width') || 520);
  const H = Number(canvas.dataset.logicalH || canvas.getAttribute('height') || 520);

  if (!canvas.dataset.logicalW) {
    canvas.dataset.logicalW = String(W);
    canvas.dataset.logicalH = String(H);
  }
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const {
    viewId = 'aortoiliac',
    alpha = 0,
    beta = 0,
    imagingMode = 'dsa', // 'dsa' | 'fluoro' | 'roadmap'
    activeLesion = null,
    beatPhase = 0,
    contrastOpacity = 1.0,
    bolusWave = 1.0, // 0..1.4 wave position during bolus chase
    showLabels = true,
    showBones = true,
    showCatheter = true,
    showHeatmap = false,
    hoveredId = null,
    selectedId = null,
    lang = 'tr'
  } = state;

  const isTr = lang !== 'en';
  const cx = W / 2;
  const cy = H / 2 + 8;

  const branches = PERIPHERAL_3D_TREES[viewId] || PERIPHERAL_3D_TREES.aortoiliac;
  const allPts = branches.flatMap(b => [
    ...b.points.map(pt => projectPeripheralPoint(pt, alpha, beta)),
    ...(b.contraPoints ? b.contraPoints.map(pt => projectPeripheralPoint(pt, alpha, beta)) : [])
  ]);

  const minU = allPts.length ? Math.min(...allPts.map(p => p.u)) : -2;
  const maxU = allPts.length ? Math.max(...allPts.map(p => p.u)) : 2;
  const minV = allPts.length ? Math.min(...allPts.map(p => p.v)) : -2.5;
  const maxV = allPts.length ? Math.max(...allPts.map(p => p.v)) : 2.5;
  const centerU = (minU + maxU) / 2;
  const centerV = (minV + maxV) / 2;
  const span = Math.max(1.8, maxU - minU, maxV - minV);
  const scale = Math.min(W, H) * 0.72 / span;
  const originX = cx - centerU * scale;
  const originY = cy - centerV * scale;

  // 1. Background based on imagingMode (DSA vs Native Fluoroscopy vs Roadmap)
  const bgGrad = ctx.createRadialGradient(cx, cy, scale * 0.2, cx, cy, Math.max(W, H) * 0.65);
  if (imagingMode === 'dsa') {
    bgGrad.addColorStop(0, '#eef2f6');
    bgGrad.addColorStop(0.75, '#d8e0e8');
    bgGrad.addColorStop(1, '#aeb9c6');
  } else if (imagingMode === 'roadmap') {
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(0.8, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
  } else {
    bgGrad.addColorStop(0, '#e2e8f0');
    bgGrad.addColorStop(0.7, '#cbd5e1');
    bgGrad.addColorStop(1, '#94a3b8');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(8, 8, W - 16, H - 16, 14);
  ctx.clip();

  // 2. Bony & Anatomical Landmarks (Subtracted ghost in DSA, prominent in Native Fluoro)
  if (showBones) {
    const boneAlpha = imagingMode === 'dsa' ? 0.06 : imagingMode === 'roadmap' ? 0.12 : 0.25;
    ctx.save();
    const spineShift = (alpha / 90) * (W * 0.28);
    ctx.fillStyle = imagingMode === 'roadmap'
      ? `rgba(148, 163, 184, ${boneAlpha})`
      : `rgba(71, 85, 105, ${boneAlpha})`;

    if (viewId === 'aortoiliac' || viewId === 'visceral') {
      // Lumbar vertebral column L1-L5 & pelvic brim
      const spineX = cx - spineShift;
      for (let y = 26; y < H * 0.62; y += 44) {
        ctx.beginPath();
        ctx.roundRect(spineX - 24, y, 48, 34, 5);
        ctx.fill();
      }
      if (viewId === 'aortoiliac') {
        // Iliac wings
        ctx.beginPath();
        ctx.ellipse(cx - 105 - spineShift * 0.4, H * 0.64, 55, 78, -0.25, 0, Math.PI * 2);
        ctx.ellipse(cx + 105 - spineShift * 0.4, H * 0.64, 55, 78, 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (viewId === 'femoral') {
      // Femoral head landmark (critical for safe stick)
      const fhProj = projectPeripheralPoint([-0.12, 0.92, -0.15], alpha, beta);
      const fhx = originX + fhProj.u * scale;
      const fhy = originY + fhProj.v * scale;
      ctx.beginPath();
      ctx.arc(fhx, fhy, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = imagingMode === 'roadmap' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(51, 65, 85, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (viewId === 'runoff') {
      // Distal femur, knee joint line, tibia and fibula shafts
      const kneeProj = projectPeripheralPoint([0.04, 0.35, -0.45], alpha, beta);
      const ky = originY + kneeProj.v * scale;
      ctx.fillRect(cx - 26 - spineShift * 0.3, 18, 52, Math.max(20, ky - 24));
      ctx.fillRect(cx - 22 - spineShift * 0.3, ky + 8, 34, H - ky - 60);
      ctx.fillRect(cx - 48 - spineShift * 0.2, ky + 16, 14, H - ky - 68);
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(40, ky);
      ctx.lineTo(W - 40, ky);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (viewId === 'arm') {
      // 1st rib and humerus/radius/ulna shafts
      ctx.fillRect(cx + 12 - spineShift * 0.2, H * 0.22, 22, H * 0.35);
      ctx.fillRect(cx + 26 - spineShift * 0.2, H * 0.58, 14, H * 0.32);
      ctx.fillRect(cx - 8 - spineShift * 0.2, H * 0.58, 14, H * 0.32);
    }
    ctx.restore();
  }

  // 3. Diagnostic / Interventional Catheter or Crossover Sheath
  const rootBranch = branches[0];
  if (showCatheter && rootBranch && rootBranch.points.length) {
    const tip3D = rootBranch.points[0];
    const tipProj = projectPeripheralPoint(tip3D, alpha, beta, beatPhase);
    const tx = originX + tipProj.u * scale;
    const ty = originY + tipProj.v * scale;

    ctx.save();
    ctx.strokeStyle = imagingMode === 'roadmap' ? '#38bdf8' : '#1e293b';
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (viewId === 'aortoiliac' || viewId === 'visceral') {
      // Pigtail or flush catheter descending from thoracic aorta or ascending from groin
      ctx.moveTo(tx + 18, H + 10);
      ctx.bezierCurveTo(tx + 14, ty + 140, tx + 4, ty + 60, tx, ty + 12);
    } else {
      // Contralateral crossover or antegrade sheath coming from top
      ctx.moveTo(tx - 36, -10);
      ctx.bezierCurveTo(tx - 18, ty - 45, tx - 6, ty - 18, tx, ty);
    }
    ctx.stroke();

    // Radiopaque marker band at catheter tip
    ctx.fillStyle = imagingMode === 'roadmap' ? '#f8fafc' : '#020617';
    ctx.beginPath();
    ctx.arc(tx, ty + (viewId === 'aortoiliac' || viewId === 'visceral' ? 12 : 0), 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 4. Projected Peripheral Arterial Branches
  const telemetry = computePeripheralTelemetry(viewId, alpha, beta, selectedId);
  const clickRegions = [];

  const sorted = [...branches].sort((a, b) => {
    const dA = projectPeripheralPoint(a.points[0], alpha, beta, beatPhase).depth;
    const dB = projectPeripheralPoint(b.points[0], alpha, beta, beatPhase).depth;
    return dA - dB;
  });

  function drawPolylines(pts3D, branch, isContra = false) {
    const projPts = pts3D.map(pt => {
      const pr = projectPeripheralPoint(pt, alpha, beta, beatPhase);
      return { x: originX + pr.u * scale, y: originY + pr.v * scale, raw: pr };
    });

    const isSelected = selectedId === branch.id;
    const isHovered = hoveredId === branch.id;
    const metric = telemetry.metrics[branch.id];

    // Bolus-chase local contrast factor based on branch flowOrder
    const order = branch.flowOrder ?? 0.3;
    const waveDelta = bolusWave - order * 0.55;
    const localBolus = Math.max(0.12, Math.min(1.0, waveDelta * 2.4)) * contrastOpacity;

    const baseWidth = Math.max(1.8, (branch.caliberMm || 3.0) * 1.45);
    let strokeCol = imagingMode === 'roadmap'
      ? `rgba(241, 245, 249, ${Math.max(0.25, localBolus)})`
      : `rgba(15, 23, 42, ${Math.max(0.16, localBolus)})`;

    if (showHeatmap && metric) {
      if (metric.rating === 'excellent') strokeCol = 'rgba(16, 185, 129, 0.92)';
      else if (metric.rating === 'moderate') strokeCol = 'rgba(234, 179, 8, 0.92)';
      else strokeCol = 'rgba(239, 68, 68, 0.92)';
    }

    if (isSelected) strokeCol = '#0284c7';
    else if (isHovered) strokeCol = '#0ea5e9';

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isSelected || isHovered) {
      ctx.strokeStyle = isSelected ? 'rgba(56, 189, 248, 0.42)' : 'rgba(56, 189, 248, 0.28)';
      ctx.lineWidth = baseWidth + 7;
      ctx.beginPath();
      ctx.moveTo(projPts[0].x, projPts[0].y);
      for (let i = 1; i < projPts.length; i += 1) ctx.lineTo(projPts[i].x, projPts[i].y);
      ctx.stroke();
    }

    if (branch.dashed) ctx.setLineDash([5, 4]);

    const hasLesion = !isContra
      && activeLesion
      && activeLesion.vesselId === branch.id
      && activeLesion.pct > 0;

    if (!hasLesion) {
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = baseWidth;
      ctx.beginPath();
      ctx.moveTo(projPts[0].x, projPts[0].y);
      for (let i = 1; i < projPts.length; i += 1) ctx.lineTo(projPts[i].x, projPts[i].y);
      ctx.stroke();
    } else {
      const frac = activeLesion.posFraction || 0.5;
      const totalSegs = projPts.length - 1;
      const segIdx = Math.min(totalSegs - 1, Math.floor(frac * totalSegs));
      const segT = (frac * totalSegs) - segIdx;

      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = baseWidth;
      ctx.beginPath();
      ctx.moveTo(projPts[0].x, projPts[0].y);
      for (let i = 1; i <= segIdx; i += 1) ctx.lineTo(projPts[i].x, projPts[i].y);

      const pA = projPts[segIdx];
      const pB = projPts[segIdx + 1];
      const lx = pA.x + (pB.x - pA.x) * segT;
      const ly = pA.y + (pB.y - pA.y) * segT;
      const dx = pB.x - pA.x;
      const dy = pB.y - pA.y;
      const segLen = Math.hypot(dx, dy) || 1;
      const ux = dx / segLen;
      const uy = dy / segLen;

      ctx.lineTo(lx - ux * 5, ly - uy * 5);
      ctx.stroke();

      if (activeLesion.isCto || activeLesion.pct >= 99) {
        // CTO stump cap + radiolucent occlusion gap
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.55)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(lx - ux * 5, ly - uy * 5);
        ctx.lineTo(lx + ux * 10, ly + uy * 10);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const stenW = Math.max(0.9, baseWidth * (1.0 - activeLesion.pct / 100));
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = stenW;
        ctx.beginPath();
        ctx.moveTo(lx - ux * 5, ly - uy * 5);
        ctx.lineTo(lx + ux * 5, ly + uy * 5);
        ctx.stroke();
      }

      // Distal reconstituted vessel
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = baseWidth * (activeLesion.isCto ? 0.78 : 0.9);
      ctx.beginPath();
      ctx.moveTo(lx + ux * (activeLesion.isCto ? 10 : 5), ly + uy * (activeLesion.isCto ? 10 : 5));
      for (let i = segIdx + 1; i < projPts.length; i += 1) ctx.lineTo(projPts[i].x, projPts[i].y);
      ctx.stroke();

      // Draw collateral bridge if CTO has collateral definition
      if (activeLesion.collateral) {
        const cFrom = projectPeripheralPoint(activeLesion.collateral.from, alpha, beta, beatPhase);
        const cTo = projectPeripheralPoint(activeLesion.collateral.to, alpha, beta, beatPhase);
        const cVia = activeLesion.collateral.via.map(pt => projectPeripheralPoint(pt, alpha, beta, beatPhase));
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(originX + cFrom.u * scale, originY + cFrom.v * scale);
        cVia.forEach(vp => ctx.lineTo(originX + vp.u * scale, originY + vp.v * scale));
        ctx.lineTo(originX + cTo.u * scale, originY + cTo.v * scale);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Stenosis callout badge
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
      ctx.fill();

      const badgeText = activeLesion.isCto ? 'CTO %100' : `-%${activeLesion.pct}`;
      ctx.font = '700 10px ui-monospace, SFMono-Regular, monospace';
      const tw = ctx.measureText(badgeText).width;
      ctx.fillStyle = 'rgba(185, 28, 28, 0.92)';
      ctx.beginPath();
      ctx.roundRect(lx + 7, ly - 10, tw + 8, 15, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(badgeText, lx + 11, ly + 1);
    }

    ctx.restore();

    if (!isContra) {
      clickRegions.push({
        id: branch.id,
        points: projPts,
        midPoint: projPts[Math.floor(projPts.length / 2)],
        branch
      });
    }
  }

  for (const b of sorted) {
    drawPolylines(b.points, b, false);
    if (b.contraPoints) drawPolylines(b.contraPoints, b, true);
  }

  // 5. Vessel Labels on Fluoroscopy / DSA Canvas
  if (showLabels) {
    ctx.save();
    ctx.font = '600 10.5px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Active (selected/hovered) labels are placed first so they always win; others are nudged
    // vertically to avoid overlapping an earlier label and skipped when no free slot is near.
    const placed = [];
    const overlaps = (x, y, w, h) => placed.some(r => Math.abs(r.x - x) * 2 < r.w + w && Math.abs(r.y - y) * 2 < r.h + h + 2);
    const isActive = reg => reg.branch.id === selectedId || reg.branch.id === hoveredId;
    const ordered = [...clickRegions.filter(isActive), ...clickRegions.filter(reg => !isActive(reg))];
    for (const reg of ordered) {
      const b = reg.branch;
      const pt = reg.midPoint;
      if (!pt) continue;
      const isAct = isActive(reg);
      const shortLabel = (isTr ? b.nameTr : b.nameEn).split(' (')[0];
      const tw = ctx.measureText(shortLabel).width;
      const pw = tw + 10;
      const ph = 15;
      const rx = Math.max(pw / 2 + 10, Math.min(W - pw / 2 - 10, pt.x + 12));
      const baseY = Math.max(ph / 2 + 58, Math.min(H - ph / 2 - 14, pt.y - 8));
      const slot = [0, -1, 1, -2, 2].map(k => baseY + k * (ph + 3))
        .find(y => y >= ph / 2 + 58 && y <= H - ph / 2 - 14 && !overlaps(rx, y, pw, ph));
      if (slot === undefined && !isAct) continue;
      const ry = slot ?? baseY;
      placed.push({ x: rx, y: ry, w: pw, h: ph });

      ctx.fillStyle = isAct ? 'rgba(3, 105, 161, 0.92)' : 'rgba(15, 23, 42, 0.78)';
      ctx.strokeStyle = isAct ? '#38bdf8' : 'rgba(226, 232, 240, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(rx - pw / 2, ry - ph / 2, pw, ph, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isAct ? '#e0f2fe' : '#f8fafc';
      ctx.fillText(shortLabel, rx, ry);
    }
    ctx.restore();
  }

  // 6. Cath Lab Corner HUD Overlays
  const laoRaoStr = Math.abs(alpha) < 0.5 ? 'AP' : `${alpha > 0 ? 'LAO' : 'RAO'} ${Math.abs(Math.round(alpha))}°`;
  const craCauStr = Math.abs(beta) < 0.5 ? '0°' : `${beta > 0 ? 'CRA' : 'CAU'} ${Math.abs(Math.round(beta))}°`;
  const stampText = `${laoRaoStr} · ${craCauStr}`;
  const modeBadge = imagingMode === 'dsa'
    ? (isTr ? 'DSA SUBTRAKSİYON' : 'DSA SUBTRACTION')
    : imagingMode === 'roadmap'
      ? (isTr ? 'YOL HARİTASI (ROADMAP)' : 'ROADMAP MASK')
      : (isTr ? 'NATİV FLOROSKOPİ' : 'NATIVE FLUOROSCOPY');

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(14, 14, 164, 40, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 12.5px ui-monospace, SFMono-Regular, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(stampText, 22, 30);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 9.5px system-ui, sans-serif';
  ctx.fillText(modeBadge, 22, 44);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.roundRect(W - 126, 14, 112, 40, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#34d399';
  ctx.font = '700 11px ui-monospace, monospace';
  ctx.fillText(state.cinePlaying === false ? (isTr ? 'DONDURULDU' : 'FROZEN') : 'DSA · 6 FPS', W - 116, 30);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 9.5px system-ui, sans-serif';
  ctx.fillText(isTr ? 'Sağ = Sol Görüntü' : 'Img Left = Pt Right', W - 116, 44);

  ctx.restore();

  return clickRegions;
}

/**
 * Hit-tests mouse coordinates on the peripheral fluoroscopy canvas
 */
export function hitTestPeripheralVessel(clickRegions, x, y, maxDist = 20) {
  let nearest = null;
  let best = maxDist;
  for (const reg of clickRegions || []) {
    for (let i = 0; i < reg.points.length - 1; i += 1) {
      const p1 = reg.points[i];
      const p2 = reg.points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const l2 = dx * dx + dy * dy;
      if (l2 === 0) continue;
      const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / l2));
      const px = p1.x + t * dx;
      const py = p1.y + t * dy;
      const d = Math.hypot(x - px, y - py);
      if (d < best) {
        best = d;
        nearest = reg.id;
      }
    }
  }
  return nearest;
}

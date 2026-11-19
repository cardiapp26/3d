// Inspector texts for the structures that can be selected in the atheroma scene.
// Sources: Boren et al. (2025), Averna et al. (2026), Porsch & Binder (2024), Rashedi et al. (2026).

export const HOTSPOTS = Object.freeze({
  liver: {
    title: { tr: 'Karaciğer ve MASLD (Averna 2026)', en: 'Liver & MASLD (Averna 2026)' },
    body: {
      tr: 'İnsülin direnci ve hepatik steatoz (MASLD), MTP ve de novo lipogenez yoluyla büyük VLDL1 salınımını artırır. CETP aktivitesiyle kolesterol esteri kaybedip trigliserid kazanan LDL partikülleri hepatik lipaz tarafından küçültülerek subendotelyal proteoglikanlara çok yüksek afinite gösteren küçük-yoğun LDL (sdLDL) haline gelir.',
      en: 'Insulin resistance and hepatic steatosis (MASLD) drive large VLDL1 overproduction. CETP-mediated lipid exchange and hepatic lipase remodeling generate highly atherogenic small dense LDL (sdLDL) and remnants.'
    }
  },
  endothelium: {
    title: { tr: 'Endotel Bariyeri ve Transsitoz (Borén 2025)', en: 'Endothelial Barrier & Transcytosis (Borén 2025)' },
    body: {
      tr: 'Arteriyel dallanma noktalarındaki düşük/osilatuar kayma gerilimi (shear stress) glikokaliksi inceltir ve eNOS kaynaklı NO üretimini düşürür. Çapı <70 nm olan ApoB partikülleri SR-BI ve ALK1 reseptör aracılı kaveoler transsitozla intimaya geçer.',
      en: 'Low oscillatory shear stress at arterial bifurcations thins the glycocalyx and reduces eNOS nitric oxide. ApoB lipoproteins (<70 nm) cross the endothelium via SR-BI and ALK1 caveolar transcytosis.'
    }
  },
  proteoglycan: {
    title: { tr: 'Proteoglikan Retansiyon Tuzağı (Williams & Tabas / Borén 2025)', en: 'Proteoglycan Retention Trap (Borén 2025)' },
    body: {
      tr: 'Aterogenezi başlatan temel olay: ApoB-100 üzerindeki pozitif yüklü (B-bölgesi) aminoasit dizileri, subendotelyal biglikan ve versikan proteoglikanlarının negatif yüklü kondroitin sülfat zincirlerine kilitlenir. Tutulan partiküller ROS ve sfingomiyelinaz ile agregasyona ve oksidasyona (oxLDL) uğrar.',
      en: 'The initiating step of atherogenesis: positively charged site-B residues on apoB-100 bind negatively charged chondroitin sulfate chains on intimal biglycan and versican, trapping particles for oxidation into oxLDL.'
    }
  },
  foamcell: {
    title: { tr: 'Makrofaj Köpük Hücresi ve NLRP3 (Porsch 2024)', en: 'Macrophage Foam Cell & NLRP3 (Porsch 2024)' },
    body: {
      tr: 'CD36 ve SR-A çöpçü reseptörleri LDL reseptörünün aksine hücre içi kolesterol artsa bile kapanmaz. Aşırı kolesterol esteri birikimi köpük hücresini oluşturur; serbest kolesterol kristalleri lizozomu yırtarak NLRP3 inflamazomunu ve IL-1β / IL-6 kaskadını tetikler.',
      en: 'Unlike LDLR, scavenger receptors CD36 and SR-A lack sterol downregulation. Unchecked oxLDL uptake forms foam cells; intracellular cholesterol crystals rupture lysosomes to activate NLRP3 and IL-1β/IL-6.'
    }
  },
  cap: {
    title: { tr: 'Fibröz Kılıf, TCFA (<65 µm) ve Tromboz (Rashedi 2026)', en: 'Fibrous Cap, TCFA (<65 µm) & Thrombosis (Rashedi 2026)' },
    body: {
      tr: 'VSMC tarafından sentezlenen kollajen kılıf plağı stabilize eder. Ancak makrofaj MMP-1/8/13 kollajenazları kılıfı <65 µm altına incelttiğinde (TCFA) omuz bölgesinden yırtılır. Antifosfolipid antikorları (anti-β2GPI) endotel ve trombositlerde Doku Faktörü (TF) ekspresyonunu artırarak oklüzif trombozu hızlandırır.',
      en: 'VSMC collagen stabilizes the cap, but macrophage MMP-1/8/13 degradation creates a Thin-Cap Fibroatheroma (<65 µm). Rupture exposes Tissue Factor, while antiphospholipid antibodies (anti-β2GPI) amplify thrombosis.'
    }
  }
});

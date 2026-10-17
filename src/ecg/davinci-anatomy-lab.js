// Da Vinci Anatomy Corner: 12-Lead Electrocardiographic Anatomy Interactive Studio
// Based on Bradfield EP, Rimmer M, Miyazaki Y, Hanna P, Hayase JH, Do DH, Xu S, Yamagami S, Shivkumar K, Mori S.
// "12-Lead Electrocardiographic Anatomy." JACC: Case Reports / Da Vinci Anatomy Corner, 2025.
// UCLA Wallace A. McAlpine & Amara-Yad Project Collections.

import './davinci-anatomy-lab.css';
import { createDavinciWorkbench } from './davinci-workbench.js';

export function createDaVinciAnatomyLab({ mount, getLang = () => 'tr', state = {} }) {
  const st = Object.assign({
    tab: 'cabrera', // 'cabrera' | 'heights' | 'nomenclature' | 'atrial' | 'icns'
    cabreraMode: 'cabrera', // 'cabrera' | 'standard'
    cabreraScenario: 'rvot_shift', // 'rvot_shift' | 'sinus_p' | 'mi_contiguous'
    rvotFocus: 0.5, // 0: posterolateral free wall -> 1: medial free wall
    heightPlane: 'superior', // 'superior' (V1-V2) | 'middle' (V3) | 'inferior' (V4-V6)
    nomenclatureTopic: 'fascicles', // 'fascicles' | 'papillary' | 'bundles'
    pvSite: 'RSPV', // 'RSPV' | 'RIPV' | 'LSPV' | 'LIPV' | 'RAA' | 'LAA'
    icnsSgp: 'all', // 'all' | 'vrasgp' | 'vlasgp' | 'ldsgp' | 'mdsgp' | 'drasgp' | 'rcsgp' | 'lcsgp'
    cnaTarget: 'sa_node' // 'sa_node' | 'av_node' | 'marshall'
  }, state);

  const root = document.createElement('section');
  root.className = 'davinci-lab';

  const tr = (trText, enText) => getLang() === 'en' ? enText : trText;
  const workbench = createDavinciWorkbench({ getLang, state: st });

  function preserveFocus(redraw) {
    const active = root.contains(document.activeElement) ? document.activeElement : null;
    const key = active && [...active.attributes].find(a => a.name.startsWith('data-'));
    redraw();
    if (key) root.querySelector(`[${key.name}="${key.value}"]`)?.focus({ preventScroll: true });
  }

  function render() {
    root.replaceChildren();
    const tabs = [
      ['cabrera',tr('Cabrera · bakış ve vektör','Cabrera · view and vector'),'Fig 1, 2, 10, 11'],
      ['heights',tr('3D elektrot düzlemleri','3D electrode planes'),'Fig 3–6'],
      ['nomenclature',tr('Anatomik isimler','Anatomical names'),'Fig 7, 8'],
      ['atrial',tr('Atriyal odaklar ve P','Atrial sites and P'),'Fig 9'],
      ['icns',tr('Otonom sistem · ek kaynak','Autonomic system · separate source'),'Aksu et al. 2021']
    ];
    const nav=document.createElement('nav');nav.className='davinci-nav';nav.setAttribute('role','tablist');nav.setAttribute('aria-label',tr('Uzaysal EKG konuları','Spatial ECG topics'));
    tabs.forEach(([id,title,fig],i)=>{
      const b=document.createElement('button');b.type='button';b.className=`davinci-nav-btn ${st.tab===id?'active':''}`;b.dataset.davinciSection=id;
      b.setAttribute('role','tab');b.setAttribute('aria-selected',String(st.tab===id));b.tabIndex=st.tab===id?0:-1;b.id=`davinci-tab-${id}`;b.setAttribute('aria-controls','davinci-content');
      b.innerHTML=`<span class="nav-ch">${fig}</span><span class="nav-label">${title}</span>`;
      b.addEventListener('click',()=>{st.tab=id;preserveFocus(render);});
      b.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();const index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
        st.tab=tabs[index][0];render();root.querySelector(`[data-davinci-section="${st.tab}"]`).focus();
      });nav.append(b);
    });
    const content=document.createElement('div');content.className='davinci-content';content.id='davinci-content';content.setAttribute('role','tabpanel');content.setAttribute('aria-labelledby',`davinci-tab-${st.tab}`);
    root.append(nav,content);
    if(st.tab==='icns')renderIcnsTab(content,getLang()!=='en');
    else content.append(workbench.render(st.tab));
  }

  // --- SUB-MODULE 5: INTRINSIC CARDIAC AUTONOMIC NERVOUS SYSTEM (ICNS) ---
  // Aksu T, Gupta D, Pauza DH. "Anatomy and Physiology of Intrinsic Cardiac Autonomic Nervous System."
  // JACC: Case Reports 2021;3(4):625–629 (Da Vinci Anatomy Card #2).
  function renderIcnsTab(container, isTr) {
    container.replaceChildren();
    const card = document.createElement('div');
    card.className = 'davinci-card';

    const sgpData = {
      vrasgp: {
        code: 'VRAsGP',
        name: isTr ? 'Ventral Sağ Atriyal Subpleksus' : 'Ventral Right Atrial Subplexus',
        color: '#3b82f6',
        course: isTr ? 'Sağ atriyumun ön yüzünde seyreder; SVC-RA bileşkesinden sinüs düğümünün ön kısmına uzanır ve ventral interatriyal krest üzerinden sol atriyuma geçer.' : 'Located on the anterior RA; courses from the SVC-RA junction to the anterior SA node, extending across the ventral crest to the LA.',
        innervation: isTr ? 'Sinüs düğümü ön yüzü, ventral sağ atriyal miyokard.' : 'Anterior aspect of the SA node, ventral right atrial myocardium.',
        cnaNote: isTr ? 'Ventral krest ve sinüs düğümü çevresindeki ablasyonlarda sinüs hızında kalıcı artış sağlar.' : 'Modulates baseline sinus rate during anterior ganglion ablation.'
      },
      vlasgp: {
        code: 'VLAsGP',
        name: isTr ? 'Ventral Sol Atriyal Subpleksus' : 'Ventral Left Atrial Subplexus',
        color: '#22c55e',
        course: isTr ? 'Sol atriyumun ön ve çatı yüzeyinde yayılır; interatriyal oluk üzerinde VRAsGP ile anastomozlaşır.' : 'Distributed on the ventral surface and roof of the LA; communicates with VRAsGP across the interatrial crest.',
        innervation: isTr ? 'Sol atriyum ön duvarı, Bachmann demeti lifleri ve superior LA miyokardı.' : 'Anterior LA wall, Bachmann bundle region, and superior LA myocardium.',
        cnaNote: isTr ? 'Bachmann demeti ablasyonunda ve AF tetikleyicilerinde otonom modülasyon sunar.' : 'Modulates anterior LA conduction and AF trigger vulnerability.'
      },
      ldsgp: {
        code: 'LDsGP',
        name: isTr ? 'Sol Dorsal Subpleksus' : 'Left Dorsal Subplexus',
        color: '#ef4444',
        course: isTr ? 'Sol atriyum arka yüzünde, LSPV/LIPV antrumu ile sol atriyoventriküler sulkus arasında uzanarak dorsal LV serbest duvarına iner.' : 'Courses on the posterior LA between the left pulmonary veins and left AV groove down toward dorsal LV.',
        innervation: isTr ? 'LSPV, LIPV, Marshall ligamenti, lateral ve posterior LA, sol ventrikül arka yüzü.' : 'LSPV, LIPV, ligament of Marshall, posterior LA, and dorsal LV.',
        cnaNote: isTr ? 'Marshall veni/ligamenti ve LSGP (sol superior GP) ile örtüşür. AF ablasyonunda ve sempatik-parasempatik hiperaktiviteyi kırmada kritiktir.' : 'Overlaps the ligament of Marshall and LSGP (superior left GP); critical in AF ablation.'
      },
      mdsgp: {
        code: 'MDsGP',
        name: isTr ? 'Orta Dorsal Subpleksus' : 'Middle Dorsal Subplexus',
        color: '#f97316',
        course: isTr ? 'Sol atriyumun arka-üst çatısından başlar, Waterston interatriyal oluğu boyunca crux cordise ve ventriküllerin arka yüzüne iner.' : 'Extends from posterosuperior LA along Waterston groove down to the crux cordis and posterior ventricles.',
        innervation: isTr ? 'Sağ ve sol pulmoner ven antrumları, posterior interatriyal septum, AV düğüm ve crux cordis bölgesi.' : 'PV antrums, posterior interatrial groove, AV node, and crux cordis.',
        cnaNote: isTr ? 'Crux cordis ganglion kümesi (P-IS GP) ile birleşir; AV düğüm vagal iletiminin (dromotropi) ana nöral yoludur.' : 'Merges into the crux cordis GP (P-IS GP); primary conduit for vagal AV nodal deceleration.'
      },
      drasgp: {
        code: 'DRAsGP',
        name: isTr ? 'Dorsal Sağ Atriyal Subpleksus' : 'Dorsal Right Atrial Subplexus',
        color: '#ec4899',
        course: isTr ? 'SVC arka kökü, sağ atriyum arka-üst yüzeyi ve interatriyal olukta yerleşir; sinüs düğümünün arka yüzüne ve RAA’ya lifler verir.' : 'Situated at the dorsal root of the SVC and posterosuperior RA; sends branches to the posterior SA node.',
        innervation: isTr ? 'Sinüs düğümü arka bölgesi, krista terminalis superioru, posterior interatriyal septum.' : 'Posterior SA node, superior crista terminalis, and posterior interatrial septum.',
        cnaNote: isTr ? 'Klinik RSGP (SVC-Ao yağ yastıkçığı) ganglionları ile doğrudan eşleşir; sinüs arrestini önlemede primer kardiyonöroablasyon hedefidir.' : 'Directly corresponds to the clinical RSGP (SVC-Ao fat pad); primary target for cardioinhibitory sinus arrest.'
      },
      rcsgp: {
        code: 'RCsGP',
        name: isTr ? 'Sağ Koroner Subpleksus' : 'Right Coronary Subplexus',
        color: '#d946ef',
        course: isTr ? 'Sağ atriyoventriküler olukta, sağ koroner arter (RCA) boyunca seyreder; triküspit anülüsü ve RV inferior serbest duvarına ulaşır.' : 'Courses along the right AV sulcus alongside the RCA; reaches the tricuspid annulus and inferior RV.',
        innervation: isTr ? 'Triküspit anülüsü, sağ AV bileşke, RV inferior ve posterior miyokardı.' : 'Tricuspid annulus, right AV junction, inferior RV myocardium.',
        cnaNote: isTr ? 'İnferior MI sırasında vagal Bezold–Jarisch refleksinin (şiddetli bradikardi ve hipotansiyon) afferent/efferent liflerini barındırır.' : 'Carries afferent/efferent fibers mediating the Bezold–Jarisch reflex during inferior MI.'
      },
      lcsgp: {
        code: 'LCsGP',
        name: isTr ? 'Sol Koroner Subpleksus' : 'Left Coronary Subplexus',
        color: '#b45309',
        course: isTr ? 'Sol atriyoventriküler olukta, LCx arteri ve koroner sinüs boyunca dolanır; lateral mitral anülüsünü çevreler.' : 'Courses in the left AV sulcus alongside the LCx and CS; encircles the lateral mitral annulus.',
        innervation: isTr ? 'Mitral anülüs, koroner sinüs kılıfı, lateral LA ve sol ventrikül lateral duvarı.' : 'Mitral annulus, CS sleeve, lateral LA, and lateral LV.',
        cnaNote: isTr ? 'Koroner sinüs veya mitral istmus ablasyonlarında etkilenir; PV otonomik tonusunu modüle eder.' : 'Influenced during CS and mitral isthmus ablation; modulates PV and lateral LV autonomic tone.'
      }
    };

    const cnaData = {
      sa_node: {
        title: isTr ? 'RSGP (SVC-Ao Yağ Yastıkçığı) · Sinüs Düğümü Selektif Denervasyonu' : 'RSGP (SVC-Ao Fat Pad) · Selective SA Node Denervation',
        targetGps: 'DRAsGP & VRAsGP (Süperior Sağ Atriyal GP / RSGP)',
        indication: isTr ? 'Kardiyoinhibituvar Vazovagal Senkop (VVS Tip 2A/2B), Sinüs Arresti, Şiddetli Semptomatik Sinüs Bradikardisi' : 'Cardioinhibitory Vasovagal Syncope (VVS Type 2A/2B), Sinus Arrest, Severe Sinus Bradycardia',
        hfsResponse: isTr ? 'Yüksek Frekanslı Stimülasyon (HFS, 20 Hz, 12 V): Belirgin sinüs duraklaması (>3–5 saniye asistoli) veya ani sinüs arresti.' : 'High-Frequency Stimulation (HFS, 20 Hz, 12 V): Profound sinus pause (>3–5s asystole) or acute sinus arrest.',
        cnaEndpoint: isTr ? 'İstirahat sinüs hızında %20–30 artış; vagal uyarılara ve HFS’ye bağlı bradikardik yanıtın tamamen kaybolması. AV iletim ve PR aralığı DEĞİŞMEZ!' : 'Sustained 20–30% increase in baseline sinus rate; abolition of vagal sinus arrest. PR interval and AV nodal conduction are UNCHANGED!',
        endocardialSite: isTr ? 'Sağ atriyum çatısı: SVC-aort oluğu hizasında, krista terminalis superiorunun hemen medial/septal yüzeyi.' : 'High septal/anteromedial RA roof: facing the SVC-aortic groove, medial to superior crista terminalis.'
      },
      av_node: {
        title: isTr ? 'P-IS GP (Crux Cordis / IVC-LA Yağ Yastıkçığı) · AV Düğüm Selektif Denervasyonu' : 'P-IS GP (Crux Cordis / IVC-LA Fat Pad) · Selective AV Node Denervation',
        targetGps: 'MDsGP & Posterior İnteratriyal Septal GP (P-IS GP / Crux Cordis GP)',
        indication: isTr ? 'Fonksiyonel Vagal Paroksismal AV Blok (2. veya 3. derece AV Blok), Vagal Senkopta AV Blok Komponenti' : 'Functional Vagally Mediated Paroxysmal AV Block (2nd/3rd degree), AV Block component of VVS',
        hfsResponse: isTr ? 'HFS Uyarısı: Sinüs ritmi sürerken ventriküler yanıtsızlık ve tam AV blok (P dalgaları var, ventrikül asistolisi).' : 'HFS Delivery: Complete AV block with ventricular arrest while sinus rhythm persists (dissociated P waves).',
        cnaEndpoint: isTr ? 'Vagal AV bloğun tamamen engellenmesi; AV Wenckebach siklus uzunluğunun kısalması ve AH aralığının kısalması. Sinüs hızı DEĞİŞMEZ!' : 'Complete abolition of vagal AV block; shortening of AV Wenckebach cycle length and AH interval. Sinus rate is UNCHANGED!',
        endocardialSite: isTr ? 'Posteroseptal RA/LA: Koroner sinüs ostiyumu çevresi, inferior interatriyal septum ve sol atriyal posteromedial taban.' : 'Posteroseptal RA/LA: around the coronary sinus ostium, inferoposterior septum, and crux cordis.'
      },
      marshall: {
        title: isTr ? 'LSGP & Marshall Ligamenti · AF Otonomik Tetikleyici Substratı' : 'LSGP & Ligament of Marshall · AF Autonomic Trigger Substrate',
        targetGps: 'LDsGP & LSGP (Sol Süperior GP / Marshall Traktı)',
        indication: isTr ? 'Paroksismal Atriyal Fibrilasyon, Marshall kaynaklı ektopik odaklar, Pulmoner Ven Otonomik Hiperaktivitesi' : 'Paroxysmal Atrial Fibrillation, Marshall-mediated triggers, PV Autonomic Hyperactivity',
        hfsResponse: isTr ? 'HFS Uyarısı: LSPV bölgesinde fraksiyone elektrogramlar, refrakter periyotta belirgin kısalma ve AF indüksiyonu.' : 'HFS Delivery: Fractionated electrograms, localized ERP shortening, and immediate induction of atrial fibrillation.',
        cnaEndpoint: isTr ? 'Adrenerjik ve kolinerjik liflerin denervasyonu; Marshall veni alkol ablasyonu veya RF ablasyon ile AF tetikleyicilerinin yok edilmesi.' : 'Denervation of local autonomic inputs; elimination of Marshall AF triggers via RF or ethanol infusion.',
        endocardialSite: isTr ? 'LSPV antrumu ile sol atriyal apendiks (LAA) arasındaki krista / sırt (Marshall katlantısı).' : 'Ridge between the LSPV antrum and the left atrial appendage (fold of Marshall).'
      }
    };

    const activeCna = cnaData[st.cnaTarget] || cnaData.sa_node;
    const selectedSgp = st.icnsSgp !== 'all' ? sgpData[st.icnsSgp] : null;

    card.innerHTML = `
      <div class="davinci-card-head">
        <div>
          <h4>${isTr ? 'İntrinsik Kardiyak Otonom Sinir Sistemi (ICNS) ve Kardiyonöroablasyon (CNA)' : 'Intrinsic Cardiac Autonomic Nervous System (ICNS) & Cardioneuroablation (CNA)'}</h4>
          <span class="davinci-card-cite">Da Vinci Anatomy Card #2: Tolga Aksu, Dhiraj Gupta, Dainius H. Pauza (JACC: Case Reports 2021; 3:625–629)</span>
        </div>
      </div>

      <div class="davinci-callout info">
        <p>
          ${isTr
            ? '<strong>Otonomik Nöral Mimari:</strong> Sempatik sistem preganglionik lifleri torasik medulla spinalisten (T1–T5) köken alıp paravertebral sempatik zincir ganglionlarında sinaps yapar; postganglionik miyelinsiz lifler kalbe ulaşır. Buna karşılık, parasempatik sistemde vagus siniri (Kraniyal Sinir X, Nucleus ambiguus ve DMNV) preganglionik lifleri doğrudan kalp yüzeyindeki epikardiyal yağ yastıkçıkları içine taşır. Ganglionlu pleksuslar (GP) kalbin epikardında yer alır; postganglionik kolinerjik aksonlar oldukça kısadır (<1–2 mm) ve doğrudan yerel miyokard/düğümleri innerve eder.'
            : '<strong>Autonomic Neural Architecture:</strong> Sympathetic preganglionics originate in T1–T5 thoracic spinal segments and synapse in paravertebral chain ganglia; long unmyelinated postganglionics innervate cardiac tissue. Conversely, parasympathetic vagal fibers (CN X, Nucleus ambiguus & DMNV) travel as long preganglionics to synapse within intrinsic epicardial ganglionated plexuses (GPs) embedded in atrial fat pads. Postganglionic cholinergic axons are very short (<1–2 mm), exerting exquisite local control over the sinus and AV nodes.'
          }
        </p>
      </div>

      <!-- Section A: 7 Human Epicardiac Ganglionated Subplexuses (Pauza et al.) -->
      <div class="davinci-control-group">
        <label class="davinci-group-label">
          ${isTr ? 'A. Pauza İnsan Epikardiyal Ganglionlu Subpleksusları (7 sGP):' : 'A. Pauza 7 Human Epicardiac Ganglionated Subplexuses (sGPs):'}
        </label>
        <div class="davinci-btn-row">
          <button type="button" class="davinci-chip-btn ${st.icnsSgp === 'all' ? 'active' : ''}" data-sgp="all">
            ${isTr ? 'Tümü (7 sGP)' : 'All (7 sGPs)'}
          </button>
          ${Object.entries(sgpData).map(([id, d]) => `
            <button type="button" class="davinci-chip-btn ${st.icnsSgp === id ? 'active' : ''}" data-sgp="${id}" style="border-left: 3px solid ${d.color}">
              <span style="color:${d.color};font-weight:700">${d.code}</span> · ${d.name.split(' ')[0]}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="davinci-anatomy-grid">
        ${selectedSgp ? `
          <div class="davinci-grid-card" style="border-top: 3px solid ${selectedSgp.color}; grid-column: 1 / -1">
            <h5 style="color:${selectedSgp.color}">
              <span class="davinci-badge" style="background:${selectedSgp.color}22;color:${selectedSgp.color};border-color:${selectedSgp.color}55">${selectedSgp.code}</span>
              ${selectedSgp.name}
            </h5>
            <p><strong>${isTr ? 'Epikardiyal Seyir:' : 'Epicardial Course:'}</strong> ${selectedSgp.course}</p>
            <p><strong>${isTr ? 'Primer İnnervasyon:' : 'Primary Innervation:'}</strong> ${selectedSgp.innervation}</p>
            <p><strong>${isTr ? 'Klinik / Girişimsel Önem:' : 'Clinical / Ablation Significance:'}</strong> ${selectedSgp.cnaNote}</p>
          </div>
        ` : `
          <div class="davinci-grid-card" style="grid-column: 1 / -1">
            <h5>${isTr ? 'Pauza Sınıflaması: Kalp Çevresindeki 7 Epikardiyal Ağ' : 'Pauza Classification: 7 Epicardiac Neural Subplexuses'}</h5>
            <p>${isTr
              ? 'Pauza ve ark. (Anat Rec 2000) insan kalbinde 7 anatomik subpleksus (sGP) haritalamıştır: <strong>VRAsGP</strong> (Mavi, Ventral RA), <strong>VLAsGP</strong> (Yeşil, Ventral LA), <strong>LDsGP</strong> (Kırmızı, Sol dorsal / Marshall), <strong>MDsGP</strong> (Turuncu, Orta dorsal / Crux cordis), <strong>DRAsGP</strong> (Pembe, Dorsal RA / RSGP), <strong>RCsGP</strong> (Macenta, Sağ AV oluk / RCA), <strong>LCsGP</strong> (Kahverengi, Sol AV oluk / LCx). Yukarıdaki butonlarla her birinin seyrini ve innervasyon alanını inceleyebilirsiniz.'
              : 'Pauza et al. (Anat Rec 2000) mapped 7 distinct sGPs across the human epicardium: <strong>VRAsGP</strong> (Blue, Ventral RA), <strong>VLAsGP</strong> (Green, Ventral LA), <strong>LDsGP</strong> (Red, Left dorsal / Marshall), <strong>MDsGP</strong> (Orange, Middle dorsal / Crux cordis), <strong>DRAsGP</strong> (Pink, Dorsal RA / RSGP), <strong>RCsGP</strong> (Magenta, Right AV sulcus / RCA), <strong>LCsGP</strong> (Brown, Left AV sulcus / LCx). Use the buttons above to inspect each subplexus.'
            }</p>
          </div>
        `}
      </div>

      <!-- Section B: Cardioneuroablation (CNA) Functional Targets -->
      <div class="davinci-control-group" style="margin-top: 14px">
        <label class="davinci-group-label">
          ${isTr ? 'B. Kardiyonöroablasyon (CNA) Fonksiyonel Hedefleri ve Elektrofizyolojik Yanıtlar:' : 'B. Cardioneuroablation (CNA) Functional Targets & Electrophysiological Endpoints:'}
        </label>
        <div class="davinci-btn-row">
          <button type="button" class="davinci-chip-btn ${st.cnaTarget === 'sa_node' ? 'active' : ''}" data-cna="sa_node">
            🎯 ${isTr ? 'Sinüs Düğümü Hedefi (RSGP / SVC-Ao)' : 'SA Node Target (RSGP / SVC-Ao)'}
          </button>
          <button type="button" class="davinci-chip-btn ${st.cnaTarget === 'av_node' ? 'active' : ''}" data-cna="av_node">
            🎯 ${isTr ? 'AV Düğüm Hedefi (P-IS GP / Crux Cordis)' : 'AV Node Target (P-IS GP / Crux)'}
          </button>
          <button type="button" class="davinci-chip-btn ${st.cnaTarget === 'marshall' ? 'active' : ''}" data-cna="marshall">
            🎯 ${isTr ? 'Marshall & AF Substratı (LSGP)' : 'Marshall & AF Substrate (LSGP)'}
          </button>
        </div>
      </div>

      <!-- CNA Neural Circuit SVG Schematic -->
      <div class="davinci-svg-stage">
        <svg viewBox="0 0 680 220" class="davinci-stage-svg" role="img" aria-label="ICNS CNA Neural Circuit Diagram">
          <defs>
            <marker id="icns-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8"/>
            </marker>
            <marker id="icns-arrow-gold" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#facc15"/>
            </marker>
            <filter id="cna-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Brainstem Nuclei -->
          <rect x="20" y="70" width="120" height="80" rx="8" fill="#1e293b" stroke="#64748b" stroke-width="1.8"/>
          <text x="80" y="95" fill="#f8fafc" font-size="11" font-weight="700" text-anchor="middle">Beyin Sapı / Vagus</text>
          <text x="80" y="112" fill="#94a3b8" font-size="9" text-anchor="middle">Nuc. Ambiguus</text>
          <text x="80" y="126" fill="#94a3b8" font-size="9" text-anchor="middle">DMNV (N. Vagus X)</text>

          <!-- Vagus Nerve Pathway -->
          <path d="M 140 100 C 190 70, 220 50, 260 50" fill="none" stroke="${st.cnaTarget === 'sa_node' ? '#facc15' : '#38bdf8'}" stroke-width="${st.cnaTarget === 'sa_node' ? '3' : '1.8'}" stroke-dasharray="4,3" marker-end="url(#icns-arrow)"/>
          <path d="M 140 110 C 190 110, 220 110, 260 110" fill="none" stroke="${st.cnaTarget === 'marshall' ? '#facc15' : '#38bdf8'}" stroke-width="${st.cnaTarget === 'marshall' ? '3' : '1.8'}" stroke-dasharray="4,3" marker-end="url(#icns-arrow)"/>
          <path d="M 140 120 C 190 150, 220 170, 260 170" fill="none" stroke="${st.cnaTarget === 'av_node' ? '#facc15' : '#38bdf8'}" stroke-width="${st.cnaTarget === 'av_node' ? '3' : '1.8'}" stroke-dasharray="4,3" marker-end="url(#icns-arrow)"/>

          <!-- Ganglia / Fat Pads -->
          <!-- 1. RSGP (SVC-Ao) -->
          <g transform="translate(260, 30)">
            <rect x="0" y="0" width="165" height="40" rx="6" fill="${st.cnaTarget === 'sa_node' ? '#854d0e' : '#1e293b'}" stroke="${st.cnaTarget === 'sa_node' ? '#facc15' : '#ec4899'}" stroke-width="${st.cnaTarget === 'sa_node' ? '2.5' : '1.5'}" ${st.cnaTarget === 'sa_node' ? 'filter="url(#cna-glow)"' : ''}/>
            <circle cx="12" cy="20" r="5" fill="#ec4899"/>
            <text x="24" y="18" fill="#f8fafc" font-size="10.5" font-weight="700">RSGP (SVC-Ao Fat Pad)</text>
            <text x="24" y="32" fill="#cbd5e1" font-size="8.5">DRAsGP / Superior Right GP</text>
          </g>

          <!-- 2. LSGP (Marshall / LSPV) -->
          <g transform="translate(260, 90)">
            <rect x="0" y="0" width="165" height="40" rx="6" fill="${st.cnaTarget === 'marshall' ? '#854d0e' : '#1e293b'}" stroke="${st.cnaTarget === 'marshall' ? '#facc15' : '#ef4444'}" stroke-width="${st.cnaTarget === 'marshall' ? '2.5' : '1.5'}" ${st.cnaTarget === 'marshall' ? 'filter="url(#cna-glow)"' : ''}/>
            <circle cx="12" cy="20" r="5" fill="#ef4444"/>
            <text x="24" y="18" fill="#f8fafc" font-size="10.5" font-weight="700">LSGP (Marshall / LSPV)</text>
            <text x="24" y="32" fill="#cbd5e1" font-size="8.5">LDsGP / Superior Left GP</text>
          </g>

          <!-- 3. P-IS GP (Crux Cordis / IVC-LA) -->
          <g transform="translate(260, 150)">
            <rect x="0" y="0" width="165" height="40" rx="6" fill="${st.cnaTarget === 'av_node' ? '#854d0e' : '#1e293b'}" stroke="${st.cnaTarget === 'av_node' ? '#facc15' : '#f97316'}" stroke-width="${st.cnaTarget === 'av_node' ? '2.5' : '1.5'}" ${st.cnaTarget === 'av_node' ? 'filter="url(#cna-glow)"' : ''}/>
            <circle cx="12" cy="20" r="5" fill="#f97316"/>
            <text x="24" y="18" fill="#f8fafc" font-size="10.5" font-weight="700">P-IS GP (Crux Cordis)</text>
            <text x="24" y="32" fill="#cbd5e1" font-size="8.5">MDsGP / IVC-LA Fat Pad</text>
          </g>

          <!-- Postganglionic Links to Target Nodes -->
          <path d="M 425 50 L 515 50" fill="none" stroke="${st.cnaTarget === 'sa_node' ? '#facc15' : '#ec4899'}" stroke-width="${st.cnaTarget === 'sa_node' ? '2.5' : '1.5'}" marker-end="url(#icns-arrow)"/>
          <path d="M 425 110 C 470 110, 480 70, 515 65" fill="none" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="3,3"/>
          <path d="M 425 170 L 515 170" fill="none" stroke="${st.cnaTarget === 'av_node' ? '#facc15' : '#f97316'}" stroke-width="${st.cnaTarget === 'av_node' ? '2.5' : '1.5'}" marker-end="url(#icns-arrow)"/>

          <!-- Target End Organs -->
          <!-- Sinoatrial Node -->
          <g transform="translate(520, 30)">
            <rect x="0" y="0" width="140" height="40" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8"/>
            <circle cx="16" cy="20" r="6" fill="#38bdf8"/>
            <text x="30" y="18" fill="#f8fafc" font-size="11" font-weight="700">Sinüs Düğümü (SA)</text>
            <text x="30" y="32" fill="#38bdf8" font-size="9" font-weight="600">Negatif Kronotropi</text>
          </g>

          <!-- Atrioventricular Node -->
          <g transform="translate(520, 150)">
            <rect x="0" y="0" width="140" height="40" rx="6" fill="#1e293b" stroke="#e0a92a" stroke-width="1.8"/>
            <circle cx="16" cy="20" r="6" fill="#e0a92a"/>
            <text x="30" y="18" fill="#f8fafc" font-size="11" font-weight="700">AV Düğüm (AVN)</text>
            <text x="30" y="32" fill="#e0a92a" font-size="9" font-weight="600">Negatif Dromotropi</text>
          </g>
        </svg>
      </div>

      <!-- CNA Details Card -->
      <div class="davinci-anatomy-grid" style="margin-top: 10px">
        <div class="davinci-grid-card" style="grid-column: 1 / -1; border-left: 4px solid #facc15">
          <h5 style="color: #facc15">${activeCna.title}</h5>
          <p><strong>${isTr ? 'İlgili Pauza Subpleksusu / Ganglion:' : 'Associated Pauza Subplexus / Ganglia:'}</strong> ${activeCna.targetGps}</p>
          <p><strong>${isTr ? 'Klinik Endikasyon:' : 'Clinical Indication:'}</strong> ${activeCna.indication}</p>
          <p><strong>${isTr ? 'Yüksek Frekanslı Stimülasyon (HFS) Yanıtı:' : 'HFS Stimulation Response:'}</strong> <span style="color:#ef4444">${activeCna.hfsResponse}</span></p>
          <p><strong>${isTr ? 'Ablasyon Son Noktası (CNA Endpoint):' : 'Ablation Endpoint:'}</strong> <span style="color:#4ade80">${activeCna.cnaEndpoint}</span></p>
          <p><strong>${isTr ? 'Endokardiyal Kateter Giriş Bölgesi:' : 'Endocardial Catheter Approach:'}</strong> ${activeCna.endocardialSite}</p>
        </div>
      </div>

      <!-- Interactive HFS vs Post-CNA ECG Response Simulator -->
      <div class="davinci-control-group" style="margin-top:12px;">
        <label class="davinci-group-label">
          ${isTr ? 'C. Canlı HFS (20 Hz Vagal Stimülasyon) ve Kardiyonöroablasyon (CNA) EKG Yanıt Simülatörü:' : 'C. Live HFS (20 Hz Vagal Stimulation) & Post-CNA ECG Response Simulator:'}
        </label>
        <div class="davinci-btn-row">
          <button type="button" class="davinci-chip-btn ${(st.cnaPhase || 'baseline') === 'baseline' ? 'active' : ''}" data-cna-phase="baseline">
            💚 ${isTr ? '1. Bazal Sinüs Ritmi (~72/dk)' : '1. Baseline Sinus (~72 bpm)'}
          </button>
          <button type="button" class="davinci-chip-btn ${(st.cnaPhase || 'baseline') === 'hfs' ? 'active' : ''}" data-cna-phase="hfs">
            ⚡ ${isTr ? '2. Pre-CNA HFS Uyarısı (Vagal Pause / AV Blok)' : '2. Pre-CNA HFS Delivery (Vagal Pause / AVB)'}
          </button>
          <button type="button" class="davinci-chip-btn ${(st.cnaPhase || 'baseline') === 'post_cna' ? 'active' : ''}" data-cna-phase="post_cna">
            🔥 ${isTr ? '3. Post-CNA Ablasyon Sonrası (Pause Kaybolur!)' : '3. Post-CNA Endpoint (Vagal Pause Abolished!)'}
          </button>
        </div>
        <div class="davinci-svg-stage" style="margin-top:8px;">
          <canvas id="icns-cna-ecg-canvas" width="680" height="130" style="width:100%;height:auto;display:block;border-radius:8px;background:#fff9f5;"></canvas>
        </div>
      </div>

      <!-- 3D Heart Model Action Banner -->
      <div class="davinci-lead-banner">
        <div class="davinci-banner-content">
          <h4>${isTr ? '3 Boyutlu Kalp Modelinde ICNS Katmanını Görüntüleyin' : 'View the ICNS Layer on the 3D Heart Model'}</h4>
          <p>${isTr
            ? '3D anatomik model üzerinde 7 epikardiyal subpleksusu, sinir yollarını, ganglion küme auralarını ve CNA ablasyon hedeflerini dinamik olarak inceleyin.'
            : 'Explore the 7 human epicardiac subplexuses, ganglion clusters, and CNA targets directly on the interactive 3D heart model.'
          }</p>
        </div>
        <button type="button" class="davinci-banner-btn btn-goto-3d-icns">
          ${isTr ? '⚡ 3D Kalp Modelinde ICNS İncele' : '⚡ Inspect ICNS in 3D Heart'}
        </button>
      </div>
    `;

    // Draw HFS / CNA ECG Response Canvas
    const cnaCanvas = card.querySelector('#icns-cna-ecg-canvas');
    if (cnaCanvas) {
      const ctx = cnaCanvas.getContext('2d');
      const W = cnaCanvas.width;
      const H = cnaCanvas.height;
      const phaseMode = st.cnaPhase || 'baseline';
      ctx.fillStyle = '#fff9f5';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(225, 29, 72, 0.25)';
      ctx.lineWidth = 0.8;
      for (let x = 0; x <= W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      if (phaseMode === 'hfs') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(190, 0, 310, H);
        ctx.fillStyle = '#dc2626';
        ctx.font = '800 11px ui-sans-serif, system-ui, sans-serif';
        ctx.fillText(
          st.cnaTarget === 'sa_node'
            ? (isTr ? '⚡ HFS (20 Hz): RSGP Vagal Sinüs Arresti / Asistoli Pause!' : '⚡ HFS (20 Hz): RSGP Vagal Sinus Arrest Pause!')
            : st.cnaTarget === 'av_node'
            ? (isTr ? '⚡ HFS (20 Hz): P-IS GP Tam AV Blok (P dalgaları sürer, QRS düşer!)' : '⚡ HFS (20 Hz): P-IS GP Complete AV Block (P waves only!)')
            : (isTr ? '⚡ HFS (20 Hz): Marshall LSGP Kolinerjik ERP Kısalması & AF İndüksiyonu!' : '⚡ HFS (20 Hz): Marshall LSGP AF Induction!'),
          198, 18
        );
      } else if (phaseMode === 'post_cna') {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
        ctx.fillRect(190, 0, 310, H);
        ctx.fillStyle = '#059669';
        ctx.font = '800 11px ui-sans-serif, system-ui, sans-serif';
        ctx.fillText(isTr ? '🔥 POST-CNA + HFS: Vagal Pause Tamamen Ortadan Kalktı (Başarılı Denervasyon · ~86/dk)' : '🔥 POST-CNA + HFS: Vagal Response Completely Abolished (~86 bpm)', 198, 18);
      }

      const yMid = H * 0.64;
      const gauss = (x, mu, s, a) => a * Math.exp(-0.5 * Math.pow((x - mu) / s, 2));
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const beatSpacing = phaseMode === 'post_cna' ? 82 : 98;
      for (let x = 0; x < W; x++) {
        let mv = 0;
        const inWindow = x >= 190 && x <= 500;
        if (phaseMode === 'hfs' && inWindow) {
          if (st.cnaTarget === 'sa_node') {
            // Sinus arrest flatline with tiny HFS artifact
            mv = 0.02 * Math.sin(x * 1.4);
          } else if (st.cnaTarget === 'av_node') {
            // P waves continue marching, QRS dropped
            const b = (x % beatSpacing) / beatSpacing;
            mv = gauss(b, 0.18, 0.03, 0.16) + 0.015 * Math.sin(x * 1.4);
          } else {
            // Marshall AF induction
            const b = (x % 52) / 52;
            mv = 0.08 * Math.sin(x * 0.45) + gauss(b, 0.3, 0.025, 0.78);
          }
        } else {
          const b = (x % beatSpacing) / beatSpacing;
          mv = gauss(b, 0.16, 0.025, 0.14) - gauss(b, 0.28, 0.009, 0.08) + gauss(b, 0.30, 0.013, 0.92) - gauss(b, 0.32, 0.01, 0.18) + gauss(b, 0.48, 0.04, 0.26);
        }
        const y = yMid - mv * 38;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Event listeners for sGP buttons
    card.querySelectorAll('[data-sgp]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.icnsSgp = btn.dataset.sgp;
        preserveFocus(render);
      });
    });

    // Event listeners for CNA buttons
    card.querySelectorAll('[data-cna]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.cnaTarget = btn.dataset.cna;
        preserveFocus(render);
      });
    });

    // Event listeners for CNA HFS Phase buttons
    card.querySelectorAll('[data-cna-phase]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.cnaPhase = btn.dataset.cnaPhase;
        preserveFocus(render);
      });
    });

    // Event listener for 3D navigation
    card.querySelector('.btn-goto-3d-icns')?.addEventListener('click', () => {
      window.location.href = '../?lang=' + getLang() + '#/mode/anatomy';
    });

    container.append(card);
  }

  mount.append(root);
  render();
  return { render, destroy() { Object.assign(state, st); workbench.destroy(); root.remove(); } };
}

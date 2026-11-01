// Pericardial Pathophysiology Lab: Cardiac Tamponade vs Constrictive Pericarditis
// Grounded in Leonard S. Lilly's "Pathophysiology of Heart Disease" (Chapter 14)

import { PERICARDIAL_DISORDERS } from './pathophysiology-data.js';

export function createPericardialLab(opts = {}) {
  const container = opts.mount || opts.container;
  if (!container) throw new Error('createPericardialLab requires a mount container');

  const getLang = typeof opts.getLang === 'function' ? opts.getLang : () => (opts.lang === 'en' ? 'en' : 'tr');
  let lang = getLang() === 'en' ? 'en' : 'tr';

  let disorderId = 'tamponade_acute';
  let respPhase = 'inspiration'; // inspiration | expiration
  let isBreathing = false;
  let breathTimer = null;

  const root = document.createElement('div');
  root.className = 'pericardial-lab';

  function tr(obj) {
    if (!obj) return '';
    return obj[lang] || obj.tr || obj.en || '';
  }

  function getDisorder() {
    return PERICARDIAL_DISORDERS.find(d => d.id === disorderId) || PERICARDIAL_DISORDERS[0];
  }

  function getHemodynamics() {
    const dis = getDisorder();
    let sbpExp = 120;
    let sbpInsp = 114;
    let jvpBase = 6;
    let jvpInsp = 4;

    if (disorderId === 'tamponade_acute') {
      sbpExp = 100;
      sbpInsp = 78; // 22 mmHg drop = profound pulsus paradoxus
      jvpBase = 18;
      jvpInsp = 17;
    } else if (disorderId === 'tamponade_chronic') {
      sbpExp = 106;
      sbpInsp = 88; // 18 mmHg drop
      jvpBase = 15;
      jvpInsp = 14;
    } else if (disorderId === 'constriction') {
      sbpExp = 112;
      sbpInsp = 106; // < 10 mmHg drop (not typical pulsus paradoxus)
      jvpBase = 16;
      jvpInsp = 22; // Kussmaul sign: inspiratory rise!
    }

    const currentSbp = respPhase === 'inspiration' ? sbpInsp : sbpExp;
    const currentJvp = respPhase === 'inspiration' ? jvpInsp : jvpBase;
    const pulsusDelta = sbpExp - sbpInsp;
    const hasPulsus = pulsusDelta > 10;
    const hasKussmaul = jvpInsp > jvpBase;

    return { sbpExp, sbpInsp, currentSbp, currentJvp, pulsusDelta, hasPulsus, hasKussmaul };
  }

  function render() {
    const dis = getDisorder();
    const hemo = getHemodynamics();

    root.innerHTML = `
      <div class="pericardial-grid">
        <!-- TOP TOOLBAR -->
        <div class="pericardial-toolbar">
          <div class="control-cluster">
            <span class="control-label">${lang === 'en' ? 'Pericardial Pathology' : 'Perikardiyal Patoloji'}:</span>
            <div class="btn-group">
              ${PERICARDIAL_DISORDERS.map(d => `
                <button class="stage-btn ${d.id === disorderId ? 'active' : ''}" data-disorder="${d.id}">
                  ${tr(d.name)}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="control-cluster">
            <span class="control-label">${lang === 'en' ? 'Respiratory Cycle' : 'Solunum Fazı'}:</span>
            <div class="btn-group">
              <button class="stage-btn ${respPhase === 'expiration' ? 'active' : ''}" data-phase="expiration">
                ${lang === 'en' ? 'Expiration' : 'Ekspiryum'}
              </button>
              <button class="stage-btn ${respPhase === 'inspiration' ? 'active' : ''}" data-phase="inspiration">
                ${lang === 'en' ? 'Inspiration' : 'İnspiryum'}
              </button>
              <button class="action-btn resp-breath-btn ${isBreathing ? 'btn-active' : ''}">
                ${isBreathing ? (lang === 'en' ? 'Pause Breathing' : 'Solunumu Durdur') : (lang === 'en' ? 'Auto-Breathe (12/min)' : 'Canlı Solunum Döngüsü')}
              </button>
            </div>
          </div>
        </div>

        <!-- SUMMARY ALERT -->
        <div class="pericardial-desc-bar">
          <p><strong>${tr(dis.name)}:</strong> ${tr(dis.desc)}</p>
        </div>

        <!-- 3 MAIN VISUAL PANELS -->
        <div class="pericardial-panels-row">
          <!-- PANEL 1: PERICARDIAL COMPLIANCE CURVE -->
          <div class="pericardial-card">
            <div class="card-head">
              <h3>${lang === 'en' ? '1. Pericardial Pressure-Volume Curve' : '1. Perikardiyal Basınç-Hacim Kompliyans Eğrisi'}</h3>
              <span class="badge ${disorderId.includes('tamponade') ? 'badge-danger' : disorderId === 'constriction' ? 'badge-warning' : 'badge-ok'}">
                ${lang === 'en' ? 'P-V Relation' : 'P-V İlişkisi'}
              </span>
            </div>

            <div class="curve-svg-box">
              <svg viewBox="0 0 340 220" class="pericardial-pv-svg">
                <!-- Axes -->
                <line x1="45" y1="185" x2="320" y2="185" stroke="var(--border)" stroke-width="2" stroke-linecap="round"/>
                <line x1="45" y1="185" x2="45" y2="25" stroke="var(--border)" stroke-width="2" stroke-linecap="round"/>
                <text x="315" y="198" font-size="10" font-weight="700" fill="var(--text-sub)" text-anchor="end">${lang === 'en' ? 'Fluid Volume (mL)' : 'Sıvı Hacmi (mL)'}</text>
                <text x="40" y="20" font-size="10" font-weight="700" fill="var(--text-sub)" text-anchor="start">${lang === 'en' ? 'Intrapericardial Pressure (mmHg)' : 'İntraperikardiyal Basınç (mmHg)'}</text>

                <!-- Grid lines -->
                <line x1="45" y1="140" x2="320" y2="140" stroke="var(--border)" stroke-dasharray="2,2" stroke-width="1" opacity="0.4"/>
                <line x1="45" y1="95" x2="320" y2="95" stroke="var(--border)" stroke-dasharray="2,2" stroke-width="1" opacity="0.4"/>
                <line x1="45" y1="50" x2="320" y2="50" stroke="var(--border)" stroke-dasharray="2,2" stroke-width="1" opacity="0.4"/>
                <text x="38" y="143" font-size="9" fill="var(--text-sub)" text-anchor="end">10</text>
                <text x="38" y="98" font-size="9" fill="var(--text-sub)" text-anchor="end">20</text>
                <text x="38" y="53" font-size="9" fill="var(--text-sub)" text-anchor="end">30</text>

                <!-- Normal / Acute Curve (Steep at 200 mL) -->
                <path d="M 45,183 Q 110,182 140,165 Q 165,130 175,40" fill="none" stroke="#dc2626" stroke-width="2.2" />
                <text x="145" y="65" font-size="9.5" font-weight="700" fill="#dc2626">${lang === 'en' ? 'Acute Effusion' : 'Akut Sıvı (200 mL)'}</text>

                <!-- Chronic Curve (Shifted right to 1000 mL) -->
                <path d="M 45,183 Q 180,182 250,165 Q 285,130 295,45" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="4,2"/>
                <text x="260" y="90" font-size="9.5" font-weight="700" fill="#0284c7">${lang === 'en' ? 'Chronic (1000 mL)' : 'Kronik (1000 mL)'}</text>

                <!-- Current Operating Dot -->
                ${(() => {
                  let cx = 55;
                  let cy = 183;
                  if (disorderId === 'tamponade_acute') { cx = 168; cy = 95; }
                  else if (disorderId === 'tamponade_chronic') { cx = 288; cy = 115; }
                  else if (disorderId === 'constriction') { cx = 60; cy = 105; }

                  return `
                    <circle cx="${cx}" cy="${cy}" r="7" fill="#f59e0b" stroke="#fff" stroke-width="2"/>
                    <text x="${cx + 12}" y="${cy + 4}" font-size="10.5" font-weight="800" fill="#f59e0b">
                      ${dis.pressure} mmHg
                    </text>
                  `;
                })()}
              </svg>
            </div>

            <div class="compliance-note">
              ${lang === 'en'
                ? '<strong>Pericardial Stretch Reserve:</strong> In acute hemopericardium, the noncompliant parietal pericardium reaches its stretch limit with just 150-250 mL, shooting pressures above 20 mmHg. In chronic effusions, slow remodeling allows >1000 mL before decompensation.'
                : '<strong>Perikardiyal Esneme Sınırı:</strong> Akut hemoperikardiyumda esneyemeyen pariyetal perikard 150-250 mL kanla bile kritik gerilme sınırına ulaşır ve basınç 20 mmHg üzerine fırlar. Kronik efüzyonlarda ise yavaş adaptasyon 1000 mL üzerine izin verir.'}
            </div>
          </div>

          <!-- PANEL 2: VENTRICULAR INTERDEPENDENCE & PULSUS PARADOXUS -->
          <div class="pericardial-card">
            <div class="card-head">
              <h3>${lang === 'en' ? '2. Ventricular Interdependence & Pulsus Paradoxus' : '2. Ventriküler Etkileşim ve Pulsus Paradoxus'}</h3>
              <span class="badge ${hemo.hasPulsus ? 'badge-danger' : 'badge-ok'}">
                ${hemo.hasPulsus ? (lang === 'en' ? 'PULSUS PARADOXUS (+)' : 'PULSUS PARADOXUS (+)') : (lang === 'en' ? 'NORMAL (<10 mmHg)' : 'NORMAL (<10 mmHg)')}
              </span>
            </div>

            <!-- Biventricular Septal Shift Visual -->
            <div class="septal-shift-box">
              <svg viewBox="0 0 320 140" class="septal-shift-svg">
                <!-- External Compressive Shell / Pericardial Fluid -->
                <rect x="30" y="10" width="260" height="120" rx="40" fill="${disorderId.includes('tamponade') ? '#ef4444' : disorderId === 'constriction' ? '#78716c' : 'none'}" opacity="${disorderId.includes('tamponade') ? '0.22' : disorderId === 'constriction' ? '0.35' : '0'}" stroke="${disorderId.includes('tamponade') ? '#ef4444' : disorderId === 'constriction' ? '#78716c' : 'var(--border)'}" stroke-width="${disorderId === 'constriction' ? '6' : '3'}" stroke-dasharray="${disorderId === 'constriction' ? 'none' : '4,2'}"/>

                <!-- Right Ventricle Cavity -->
                <path d="M 60,70 Q 75,25 125,30 Q 130,70 125,110 Q 75,115 60,70 Z" fill="#0284c7" opacity="0.35" stroke="#0284c7" stroke-width="2"/>
                <text x="95" y="74" font-size="11" font-weight="800" fill="#0284c7" text-anchor="middle">RV</text>

                <!-- Interventricular Septum (Shifts left on inspiration in tamponade) -->
                ${respPhase === 'inspiration' && disorderId.includes('tamponade') ? `
                  <!-- Leftward bulging septum -->
                  <path d="M 140,25 Q 175,70 140,115" fill="none" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round"/>
                  <text x="185" y="74" font-size="10" font-weight="800" fill="#ef4444">${lang === 'en' ? 'Septal Shift ->' : 'Septum Sola ->'}</text>
                ` : `
                  <!-- Normal / Expiration midline septum -->
                  <path d="M 140,25 Q 132,70 140,115" fill="none" stroke="var(--text-main)" stroke-width="4" stroke-linecap="round"/>
                `}

                <!-- Left Ventricle Cavity -->
                <circle cx="210" cy="70" r="${respPhase === 'inspiration' && disorderId.includes('tamponade') ? '28' : '38'}" fill="#dc2626" opacity="0.3" stroke="#dc2626" stroke-width="2"/>
                <text x="210" y="74" font-size="11" font-weight="800" fill="#dc2626" text-anchor="middle">LV</text>
              </svg>
            </div>

            <!-- Arterial Blood Pressure Waveform SVG -->
            <div class="bp-waveform-box">
              <span class="waveform-title">${lang === 'en' ? 'Arterial Pressure Trace (Radial/Aortic)' : 'Arter Basınç Dalgası (Pulsus Paradoxus)'}</span>
              <svg viewBox="0 0 320 85" class="bp-svg">
                <!-- Expiration beats (higher) -->
                <path d="M 10,65 L 20,25 Q 26,18 32,32 L 35,42 Q 42,40 50,65 
                         L 60,65 L 70,25 Q 76,18 82,32 L 85,42 Q 92,40 100,65" 
                      fill="none" stroke="#22c55e" stroke-width="2.2" stroke-linecap="round"/>
                <text x="55" y="16" font-size="10" font-weight="700" fill="#22c55e">${lang === 'en' ? 'Exp: ' + hemo.sbpExp + ' mmHg' : 'Ekspiryum: ' + hemo.sbpExp + ' mmHg'}</text>

                <!-- Inspiration beats (dropped if pulsus) -->
                ${(() => {
                  const dropY = Math.min(45, (hemo.pulsusDelta / 22) * 25);
                  const yTop = 25 + dropY;
                  return `
                    <path d="M 130,65 L 140,${yTop} Q 146,${yTop - 6} 152,${yTop + 8} L 155,${yTop + 16} Q 162,${yTop + 14} 170,65 
                             L 180,65 L 190,${yTop} Q 196,${yTop - 6} 202,${yTop + 8} L 205,${yTop + 16} Q 212,${yTop + 14} 220,65" 
                          fill="none" stroke="${hemo.hasPulsus ? '#dc2626' : '#22c55e'}" stroke-width="2.5" stroke-linecap="round"/>
                    <text x="175" y="${Math.max(16, yTop - 6)}" font-size="10" font-weight="800" fill="${hemo.hasPulsus ? '#dc2626' : '#22c55e'}">
                      ${lang === 'en' ? 'Insp: ' + hemo.sbpInsp + ' mmHg' : 'İnspiryum: ' + hemo.sbpInsp + ' mmHg'}
                    </text>
                  `;
                })()}

                <!-- Drop indicator -->
                <line x1="240" y1="25" x2="240" y2="${25 + (hemo.pulsusDelta / 22) * 25}" stroke="#ef4444" stroke-width="2" marker-end="url(#arrow)"/>
                <text x="250" y="42" font-size="10" font-weight="800" fill="#ef4444">
                  Δ ${hemo.pulsusDelta} mmHg
                </text>
              </svg>
            </div>

            <div class="pulsus-explanation">
              <strong>${lang === 'en' ? 'Mechanism of Pulsus Paradoxus:' : 'Pulsus Paradoxus Mekanizması:'}</strong>
              ${lang === 'en'
                ? 'Normally, inspiration drops intrathoracic pressure, increasing venous return to RV. In tamponade, the tense fluid encloses both ventricles in a fixed volume. RV expansion bulges the septum into the LV cavity, reducing LV filling and dropping systolic BP > 10 mmHg.'
                : 'Normalde inspiryumda intratorasik basınç negatifleşir ve sağ kalbe venöz dönüş artar. Tamponadda gergin sıvı iki ventrikülü sabit bir hacme hapseder. RV genişledikçe interventriküler septum sol ventrikül lümenine bombeleşir; LV doluşu ve atım hacmi çöker, sistolik tansiyon >10 mmHg düşer.'}
            </div>
          </div>

          <!-- PANEL 3: JVP & VENTRICULAR WAVEFORMS -->
          <div class="pericardial-card">
            <div class="card-head">
              <h3>${lang === 'en' ? '3. Jugular Venous Pulse (JVP) & Square-Root Sign' : '3. Juguler Venöz Basınç (JVP) & Karekök Trasesi'}</h3>
              <span class="badge ${hemo.hasKussmaul ? 'badge-danger' : 'badge-subtle'}">
                ${hemo.hasKussmaul ? (lang === 'en' ? 'KUSSMAUL SIGN (+)' : 'KUSSMAUL BELİRTİSİ (+)') : (lang === 'en' ? 'Kussmaul (-)' : 'Kussmaul (-)')}
              </span>
            </div>

            <!-- JVP Tracing SVG -->
            <div class="jvp-wave-box">
              <span class="waveform-title">${lang === 'en' ? 'Right Atrial Pressure / JVP Waveform' : 'Sağ Atriyum Basıncı / JVP Dalgası'}</span>
              <svg viewBox="0 0 320 85" class="jvp-svg">
                ${disorderId.includes('tamponade') ? `
                  <!-- Tamponade: High mean, prominent x descent, BLUNTED/ABSENT y descent -->
                  <path d="M 15,35 Q 25,22 35,32 Q 45,65 55,50 Q 65,30 75,32 Q 85,34 95,35 
                           L 115,35 Q 125,22 135,32 Q 145,65 155,50 Q 165,30 175,32 Q 185,34 195,35" 
                        fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
                  <text x="60" y="75" font-size="10" font-weight="700" fill="#0284c7">x descent (derin)</text>
                  <text x="125" y="25" font-size="10.5" font-weight="800" fill="#dc2626">${lang === 'en' ? 'Absent / Blunted y-descent' : 'Silinmiş / Kayıp y-inişi'}</text>
                ` : disorderId === 'constriction' ? `
                  <!-- Constriction: Sharp x descent, SHARP/DEEP y descent -->
                  <path d="M 15,35 Q 25,20 35,30 Q 45,65 55,42 Q 65,22 75,30 Q 85,75 95,35 
                           L 115,35 Q 125,20 135,30 Q 145,65 155,42 Q 165,22 175,30 Q 185,75 195,35" 
                        fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
                  <text x="60" y="75" font-size="10" font-weight="700" fill="#0284c7">x</text>
                  <text x="100" y="80" font-size="11" font-weight="800" fill="#ef4444">y (derin, keskin)</text>
                  <text x="145" y="20" font-size="10.5" font-weight="800" fill="#f59e0b">${lang === 'en' ? 'Prominent Steep y-descent' : 'Belirgin Derin y-İnişi'}</text>
                ` : `
                  <!-- Normal JVP: a, x, v, y -->
                  <path d="M 15,50 Q 25,35 35,45 Q 45,65 55,55 Q 65,40 75,48 Q 85,62 95,50 
                           L 115,50 Q 125,35 135,45 Q 145,65 155,55 Q 165,40 175,48 Q 185,62 195,50" 
                        fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
                  <text x="35" y="30" font-size="9" fill="var(--text-sub)">a</text>
                  <text x="55" y="75" font-size="9" fill="var(--text-sub)">x</text>
                  <text x="75" y="35" font-size="9" fill="var(--text-sub)">v</text>
                  <text x="95" y="72" font-size="9" fill="var(--text-sub)">y</text>
                `}
              </svg>
            </div>

            <!-- Ventricular Dip-and-Plateau Trace -->
            <div class="ventricle-dip-box">
              <span class="waveform-title">${lang === 'en' ? 'Ventricular Diastolic Pressure (Square-Root Sign)' : 'Ventrikül Basıncı (Karekök / Dip-and-Plateau Trasesi)'}</span>
              <svg viewBox="0 0 320 85" class="dip-svg">
                ${disorderId === 'constriction' ? `
                  <!-- Classic Square root dip-and-plateau -->
                  <path d="M 15,15 L 25,68 Q 30,78 36,45 L 90,45 L 95,15 L 105,68 Q 110,78 116,45 L 170,45" 
                        fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
                  <text x="45" y="78" font-size="10" font-weight="800" fill="#dc2626">Dip</text>
                  <text x="75" y="40" font-size="10" font-weight="800" fill="#f59e0b">Plateau (Kalsifiye Sınır)</text>
                  <text x="190" y="45" font-size="12" font-weight="900" fill="#f59e0b">√ (Karekök)</text>
                ` : `
                  <!-- Normal / Tamponade ventricular pressure -->
                  <path d="M 15,15 L 25,70 Q 40,68 90,62 L 95,15 L 105,70 Q 120,68 170,62" 
                        fill="none" stroke="var(--text-sub)" stroke-width="2" stroke-linecap="round"/>
                  <text x="180" y="65" font-size="10" fill="var(--text-sub)">Diyastolik plato yok</text>
                `}
              </svg>
            </div>

            <div class="kussmaul-explanation">
              <strong>${lang === 'en' ? 'Kussmaul Sign & y-Descent Rules:' : 'Kussmaul Belirtisi & y-İnişi Farkı:'}</strong>
              ${lang === 'en'
                ? '<strong>Tamponade:</strong> Elevated intrapericardial pressure continuously compresses the RV throughout diastole; early diastolic filling cannot occur rapidly -> <em>y-descent is blunted or absent</em>.<br/><strong>Constriction:</strong> Early filling is unimpeded by the rigid shell -> <em>rapid deep y-descent</em>. However, once the rigid shell limits expansion, filling abruptly halts (square-root sign). Venous return on inspiration cannot enter the encased right heart, paradoxical rising JVP (Kussmaul sign).'
                : '<strong>Tamponadda:</strong> Yüksek sıvı basıncı ventrikülü diyastol boyunca sürekli sıkar; erken diyastolde ventrikül hızla genişleyemez -> <em>y-inişi silinir veya kaybolur</em>.<br/><strong>Konstriksiyonda:</strong> Erken diyastolde kılıf henüz engele takılmadığı için kan aniden ventriküle boşalır -> <em>keskin derin y-inişi</em>. Orta diyastolde kalsifiye kabuğa çarpınca dolum aniden durur (karekök trasesi). İnspiryumda gelen fazla kan sert kalbe giremediği için juguler venlerde göllenir ve JVP yükselir (Kussmaul belirtisi).'}
            </div>
          </div>
        </div>

        <!-- LILLY BED-SIDE COMPARISON TABLE -->
        <div class="lilly-callout-card">
          <div class="callout-badge">
            <span class="icon">⚖️</span>
            <strong>${lang === 'en' ? 'Lilly Chapter 14 Bedside Differential: Tamponade vs Constriction' : 'Lilly Bölüm 14 Yatak Başı Ayırıcı Tanı Tablosu: Tamponad ve Konstriksiyon'}</strong>
          </div>
          <div class="table-responsive">
            <table class="pathophys-compare-table">
              <thead>
                <tr>
                  <th>${lang === 'en' ? 'Feature / Sign' : 'Özellik / Klinik Bulgu'}</th>
                  <th>${lang === 'en' ? 'Cardiac Tamponade' : 'Kardiyak Tamponad'}</th>
                  <th>${lang === 'en' ? 'Constrictive Pericarditis' : 'Konstriktif Perikardit'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${lang === 'en' ? 'Classic Physical Triad' : 'Klasik Klinik Triad'}</strong></td>
                  <td>${lang === 'en' ? "Beck's Triad: Hypotension, JVD, Muffled Heart Sounds" : "Beck Triadı: Hipotansiyon, JVD, Boğuk Kalp Sesleri"}</td>
                  <td>${lang === 'en' ? 'Pericardial knock, elevated JVP, peripheral ascites/edema' : 'Perikardiyal Vuru (Knock), belirgin JVD, asit/ödem'}</td>
                </tr>
                <tr>
                  <td><strong>${lang === 'en' ? 'Pulsus Paradoxus (>10 mmHg drop)' : 'Pulsus Paradoxus (>10 mmHg tansiyon düşüşü)'}</strong></td>
                  <td><span class="badge-danger">Tipik Olarak VAR (%98)</span></td>
                  <td><span class="badge-subtle">Genellikle YOK / Nadir (<%20)</span></td>
                </tr>
                <tr>
                  <td><strong>${lang === 'en' ? "Kussmaul's Sign (Inspiratory JVP rise)" : "Kussmaul Belirtisi (İnspiryumda JVP artışı)"}</strong></td>
                  <td><span class="badge-subtle">YOK (İnspiryumda düşer veya değişmez)</span></td>
                  <td><span class="badge-danger">Tipik Olarak VAR (Pozitif)</span></td>
                </tr>
                <tr>
                  <td><strong>${lang === 'en' ? 'JVP y-descent' : 'JVP y-İnişi'}</strong></td>
                  <td><strong class="text-danger">${lang === 'en' ? 'Absent or Blunted' : 'Silinmiş / Kayıp'}</strong></td>
                  <td><strong class="text-warning">${lang === 'en' ? 'Prominent, Deep & Rapid' : 'Belirgin, Derin ve Dik'}</strong></td>
                </tr>
                <tr>
                  <td><strong>${lang === 'en' ? 'Ventricular Pressure Tracing' : 'Ventrikül Basınç Trasesi'}</strong></td>
                  <td>${lang === 'en' ? 'Equilibration of diastolic pressures, no dip-and-plateau' : 'Diyastol sonu basınç eşitlenmesi, karekök yok'}</td>
                  <td>${lang === 'en' ? 'Dip-and-plateau ("Square-Root" √ sign)' : 'Karekök ("Dip-and-Plateau" √) Trasesi'}</td>
                </tr>
                <tr>
                  <td><strong>${lang === 'en' ? 'Primary Emergency Treatment' : 'Birincil Acil Tedavi'}</strong></td>
                  <td><strong>${lang === 'en' ? 'Pericardiocentesis (Needle aspiration)' : 'Perikardiyosentez (Acil İğne Aspirasyonu)'}</strong></td>
                  <td><strong>${lang === 'en' ? 'Pericardiectomy (Surgical stripping)' : 'Perikardiyektomi (Cerrahi Soyma)'}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Bind event handlers
    root.querySelectorAll('[data-disorder]').forEach(btn => {
      btn.addEventListener('click', () => {
        disorderId = btn.dataset.disorder;
        render();
      });
    });

    root.querySelectorAll('[data-phase]').forEach(btn => {
      btn.addEventListener('click', () => {
        respPhase = btn.dataset.phase;
        render();
      });
    });

    const breathBtn = root.querySelector('.resp-breath-btn');
    if (breathBtn) {
      breathBtn.addEventListener('click', toggleBreathing);
    }
  }

  function toggleBreathing() {
    if (isBreathing) {
      clearInterval(breathTimer);
      isBreathing = false;
      render();
    } else {
      isBreathing = true;
      render();
      breathTimer = setInterval(() => {
        respPhase = respPhase === 'inspiration' ? 'expiration' : 'inspiration';
        render();
      }, 2500); // 12 breaths per minute = 5 seconds full cycle
    }
  }

  render();
  container.appendChild(root);

  return {
    destroy() {
      if (breathTimer) clearInterval(breathTimer);
      root.remove();
    },
    update() {
      render();
    },
    setLanguage(nextLang) {
      lang = nextLang === 'en' ? 'en' : 'tr';
      render();
    }
  };
}

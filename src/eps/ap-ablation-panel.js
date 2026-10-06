import { AP_ABLATION_EXAMPLES, AP_ABLATION_SOURCE, AP_ABLATION_TEXT, apAblationRecording } from './ap-ablation-recordings.js';
import { createBostonGuide } from './ap-boston-guide.js';

const principles = {
  tr: [
    'Önce taşikardi mekanizması ve AP katılımı doğrulanır; erken A veya renkli harita tek başına katılım kanıtı değildir.',
    'Maksimal preeksitasyonlu 12 derivasyonlu EKG, ventriküler giriş bölgesini yaklaşık gösterir. Annülüste lokal A/V ve erken V ile hedef doğrulanır.',
    'AP oblik olabilir: atriyal ve ventriküler giriş aynı noktada olmayabilir. En erken CS A, kesin ventriküler hedef değildir.',
    'Diferansiyel atriyal pacing ile en kısa S–preeksite QRS, atriyal giriş lokalizasyonuna yardım eder. Kateter travması geçici yol bloğu oluşturabilir; harita konumu saklamaya yardımcı olur.',
    'Upstream/inverted mapping: uyarım kateteri giriş tarafında gezdirilir, karşı odacıkta referans sabittir. En kısa S–A/S–V, referanstan önceki pencere nedeniyle haritada geç renk görünebilir. Yanlış sinyal seçimi ve iki odacığın birlikte yakalanması haritayı yanıltır; küçük seçilmiş serilere dayanan yardımcı yöntemdir.',
    'Yol iletiminin kaybı elektriksel sonuçtur; atriyal giriş, ventriküler giriş veya yolun kendisinden hangisinin kesildiğini tek başına göstermez. Antegrad/retrograd yeniden test ve indüklenebilirlik değerlendirmesi gerekir.'
  ],
  en: [
    'Confirm the tachycardia mechanism and AP participation first; early A or a color map alone does not establish participation.',
    'A maximally preexcited 12-lead ECG approximates the ventricular insertion region. Confirm the annular target using local A/V and early V.',
    'An AP can be oblique: atrial and ventricular insertions may differ. Earliest CS A is not a definitive ventricular target.',
    'Differential atrial pacing uses the shortest S–preexcited QRS to help locate the atrial insertion. Catheter trauma can transiently block a pathway; mapping helps retain its location.',
    'Upstream/inverted mapping: rove the pacing catheter in the upstream chamber and keep a fixed opposite-chamber reference. The shortest S–A/S–V can appear late on a map whose window precedes the reference. Incorrect signal selection and dual-chamber capture can mislead; evidence comes from small selected series.',
    'Loss of pathway conduction is an electrical endpoint; it does not identify whether the atrial insertion, ventricular insertion or pathway itself was interrupted. Retest antegrade/retrograde conduction and assess inducibility.'
  ]
};
export function createApAblationPanel(doc, { getLang, onRecording }) {
  const root = doc.createElement('details');
  root.className = 'ep-pace'; root.setAttribute('data-ap-ablation', '');
  const title = doc.createElement('summary'); title.className = 'ep-pace-title';
  const list = doc.createElement('ol'); list.className = 'basics-lines';
  const actions = doc.createElement('div'); actions.className = 'ep-pace-actions';
  const note = doc.createElement('p'); note.className = 'ep-pace-note';
  const source = doc.createElement('a'); source.href = AP_ABLATION_SOURCE;
  source.target = '_blank'; source.rel = 'noopener noreferrer'; source.textContent = 'Prystowsky & Padanilam 2025';
  let selected = null;
  const buttons = AP_ABLATION_EXAMPLES.map(([id]) => {
    const b = doc.createElement('button'); b.type = 'button'; b.className = 'ep-pace-deliver';
    b.setAttribute('data-ap-recording', id);
    b.addEventListener('click', () => { selected = id; render(); onRecording({ ...apAblationRecording(id), lab: 'ap-ablation' }); });
    actions.append(b); return b;
  });
  const boston = createBostonGuide(doc, getLang);
  root.append(title, list, actions, note, source, boston.element);
  function render() {
    boston.render();
    const en = getLang() === 'en';
    title.textContent = en ? 'AP ablation: electrical localization' : 'AP ablasyonu: elektriksel lokalizasyon';
    list.replaceChildren(...principles[en ? 'en' : 'tr'].map((text) => { const li = doc.createElement('li'); li.textContent = text; return li; }));
    buttons.forEach((b, i) => { b.textContent = AP_ABLATION_EXAMPLES[i][en ? 2 : 1]; });
    note.textContent = selected ? AP_ABLATION_TEXT[selected][en ? 'en' : 'tr'] : (en ? 'Open a synthetic example on the recorder. These examples have their own pathway location, independent of the selected case.' : 'Sentetik örneği recorder üzerinde açın. Örneklerin yol konumu seçili olgudan bağımsızdır.');
  }
  render();
  return { element: root, render };
}

// Image reading quiz (ivus-quiz.js): seven levels from the normal wall to stents. Each question
// shows a frame of the teaching model (ivus-basics-frame.js) with an arrow on one structure and
// three answers. The arrow is found, not typed: along the beam at `hour` (clock, from the
// catheter) the middle of the first run of the `answer` structure, so it stays on target if the
// model changes. Texts are our own; answers reuse the structure names and explanations.
import { FOV_MM, structureAt } from './ivus-basics-frame.js';

const L = (tr, en) => ({ tr, en });
const q = (preset, answer, hour, distractors, system = 'rotational-40') => ({ preset, answer, hour, distractors, system });

export const QUIZ_LEVELS = [
  { id: 'normal', title: L('Normal koroner', 'Normal coronary artery'), intro: L('İçten dışa: kan, intima, media, adventisya.', 'From inside out: blood, intima, media, adventitia.'),
    questions: [q('normal', 'lumen', 1, ['nurd', 'fibrous']), q('normal', 'media', 4, ['adventitia', 'hematoma']), q('normal', 'adventitia', 5, ['media', 'fibrous']), q('normal', 'intima', 2, ['flap', 'strut'])] },
  { id: 'calcium', title: L('Kalsiyum', 'Calcium'), intro: L('Parlak ön kenar, arkada gölge; yüzeyel ya da derin, nodül.', 'Bright leading edge, shadow behind; superficial or deep, nodule.'),
    questions: [q('calcium', 'calcium', 10, ['fibrous', 'strut']), q('calcium', 'calciumShadow', 10.5, ['attenuation', 'lumen']), q('calcium', 'reverberation', 10, ['flap', 'ringdown']), q('nodule', 'nodule', 10.8, ['thrombus', 'calcium'])] },
  { id: 'plaque', title: L('Plak tipleri', 'Plaque types'), intro: L('Parlaklığı adventisyaya göre söyle.', 'Judge brightness against the adventitia.'),
    questions: [q('fibrous', 'fibrous', 3.5, ['lipid', 'calcium']), q('mixed', 'lipid', 1.5, ['fibrous', 'thrombus']), q('attenuated', 'attenuated', 2.5, ['lipid', 'thrombus']), q('attenuated', 'attenuation', 2.5, ['calciumShadow', 'wireShadow'])] },
  { id: 'pathology', title: L('Diğer patolojik bulgular', 'Other pathological findings'), intro: L('Lümen içi kitle, duvar içi kan, yan dal.', 'A mass in the lumen, blood in the wall, a side branch.'),
    questions: [q('thrombus', 'thrombus', 2, ['nodule', 'lumen']), q('hematoma', 'hematoma', 8.5, ['falseLumen', 'lipid']), q('sidebranch', 'sideBranch', 2.8, ['falseLumen', 'lumen'])] },
  { id: 'artifacts', title: L('Artefaktlar', 'Artifacts'), intro: L('Damarda değil, görüntüde olan şeyler.', 'Things in the image, not in the vessel.'),
    questions: [q('normal', 'ringdown', 3, ['intima', 'catheter'], 'phased-20'), q('normal', 'wire', 8, ['calcium', 'strut']), q('normal', 'wireShadow', 8, ['calciumShadow', 'attenuation']), q('nurd', 'nurd', 3.5, ['reverberation', 'attenuation'])] },
  { id: 'dissection', title: L('Gerçek ve yalancı lümen', 'True and false lumen'), intro: L('Flebi bul; hangi lümenin etrafında üç katmanlı duvar var?', 'Find the flap; which lumen has the three-layered wall around it?'),
    questions: [q('dissection', 'flap', 3, ['intima', 'strut']), q('dissection', 'falseLumen', 3, ['trueLumen', 'hematoma']), q('dissection', 'trueLumen', 9, ['falseLumen', 'sideBranch'])] },
  { id: 'stent', title: L('Stent strutları', 'Stent struts'), intro: L('Strut duvara değiyor mu?', 'Does the strut touch the wall?'),
    questions: [q('stent', 'strut', 6.1, ['malapposedStrut', 'calcium']), q('stent', 'malapposedStrut', 2.45, ['strut', 'flap']), q('stent', 'calciumShadow', 6.1, ['attenuation', 'media'])] }
];

/** Where the arrow points: the middle of the first run of the answer structure along the beam at the question's hour. */
export function questionTarget(question) {
  const a = (question.hour / 12) * Math.PI * 2, opts = { preset: question.preset, system: question.system };
  let start = null, last = null;
  for (let r = .05; r <= FOV_MM - .1; r += .01) {
    const hit = structureAt(r * Math.sin(a), -r * Math.cos(a), opts).id === question.answer;
    if (hit) { start ??= r; last = r; } else if (start != null) break;
  }
  if (start == null) return null;
  // Middle of the run, snapped to a sampled point so the arrow never falls between two structures.
  const r = start + Math.round((last - start) / .02) * .01;
  return { x: r * Math.sin(a), y: -r * Math.cos(a), r };
}

/** The three answers in a fixed, question-dependent order (the right one is not always first). */
export function questionOptions(question, index) {
  const all = [question.answer, ...question.distractors];
  const shift = index % 3;
  return [...all.slice(shift), ...all.slice(0, shift)];
}

export const QUIZ_TEXT = {
  title: L('Görüntü okuma testi', 'Image reading quiz'),
  intro: L('Her soruda modelden çizilen bir IVUS karesi ve bir ok var. Okun gösterdiği yapıyı seç; cevaptan sonra nedenini oku. Seviyeler normal duvardan stente ilerler.', 'Each question shows an IVUS frame drawn by the model and an arrow. Pick the structure under the arrow, then read why. Levels go from the normal wall to stents.'),
  start: L('Başla', 'Start'), again: L('Tekrar', 'Again'), levels: L('Seviyeler', 'Levels'), next: L('Devam', 'Continue'),
  question: L('Soru', 'Question'), of: L('/', '/'), score: L('Puan', 'Score'), total: L('Toplam', 'Total'),
  right: L('Doğru.', 'Correct.'), wrong: L('Yanlış. Doğru cevap:', 'Not quite. The answer is:'),
  done: L('Seviye bitti', 'Level complete'), inspect: L('Bu kareyi Temeller’de incele', 'Inspect this frame in Basics'),
  ask: L('Okun gösterdiği yapı hangisi?', 'What does the arrow point to?')
};

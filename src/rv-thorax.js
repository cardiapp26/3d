import * as THREE from 'three';
import { icsY, lineX } from './chest-surface.js';
import { chestGuides } from './auscultation-points.js';

/*
 * RVOT in the thorax (Miyazaki et al., JACC Case Rep 2026;31(36):109418,
 * Figure 3A-B): precordial electrodes on the shared chest-wall frame
 * (chest-surface.js), the RVOT and LVOT axes and their crisscross. The atlas
 * has no ribs, sternum or lungs; the frame and electrodes are schematic
 * (about 3.7 cm per unit). V1 and V2 sit at the 4th intercostal space beside
 * the sternum, V4 at the 5th space on the midclavicular line, V3 midway,
 * V5 and V6 level with V4 on the anterior and mid axillary lines; the chest
 * frame is a plane, so V5/V6 are only approximately placed (pushed back).
 */
export const ELECTRODE_COLORS = Object.freeze({ V1: '#d7262b', V2: '#f2d21b', V3: '#1f8a3c', V4: '#c4262b', V5: '#1b1b1b', V6: '#7a3fb0' });
const AAL = 1.1, MAL = 2.0;           // beyond the left MCL (~4 and ~7.5 cm), teaching placement
const LATERAL_DEPTH = [0.55, 1.3];    // V5 and V6 pushed back from the chest plane

/** Electrode positions {V1..V6: Vector3} on the chest plane at depth z. */
export function precordialPositions(z) {
  const v1 = new THREE.Vector3(lineX('right', 'sternal'), icsY(4), z);
  const v2 = new THREE.Vector3(lineX('left', 'sternal'), icsY(4), z);
  const v4 = new THREE.Vector3(lineX('left', 'mcl'), icsY(5), z);
  const v3 = v2.clone().lerp(v4, 0.5);
  const v5 = new THREE.Vector3(v4.x + AAL, v4.y, z - LATERAL_DEPTH[0]);
  const v6 = new THREE.Vector3(v4.x + MAL, v4.y, z - LATERAL_DEPTH[1]);
  return { V1: v1, V2: v2, V3: v3, V4: v4, V5: v5, V6: v6 };
}

/**
 * Where V2 projects onto the RVOT in the frontal plane: the horizontal (x, y)
 * distance to the nearest RVOT point and whether it lies over the RVOT.
 * @param {THREE.Vector3} v2
 * @param {THREE.Vector3[]} rvotPoints
 */
export function v2OverRvot(v2, rvotPoints, overDistance = 0.18) {
  let best = Infinity, depth = null;
  for (const p of rvotPoints) {
    const d = Math.hypot(p.x - v2.x, p.y - v2.y);
    if (d < best) { best = d; depth = v2.z - p.z; }
  }
  return { distance: best, over: best < overDistance, depth, cm: best * 3.7 };
}

function textSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(32, 32, 28, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = color === '#f2d21b' ? '#1b1b1b' : '#ffffff';
  ctx.font = '700 26px "DM Sans", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 32, 34);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
  sprite.scale.set(0.26, 0.26, 1);
  sprite.renderOrder = 7;
  return sprite;
}

function dottedArrow(from, to, color) {
  const group = new THREE.Group();
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), new THREE.LineDashedMaterial({ color, dashSize: 0.06, gapSize: 0.05, depthTest: false, transparent: true, linewidth: 2 }));
  line.computeLineDistances();
  const dir = to.clone().sub(from).normalize();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 12), new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true }));
  cone.position.copy(to);
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  group.add(line, cone);
  group.traverse((o) => { o.renderOrder = 6; });
  return group;
}

/**
 * @param {{ parent: THREE.Object3D, chestZ: number, rvot: { centroid: THREE.Vector3, axis: THREE.Vector3, points: THREE.Vector3[] },
 *   lvot: { centroid: THREE.Vector3, axis: THREE.Vector3 } }} input
 */
export function createRvThorax({ parent, chestZ, rvot, lvot }) {
  const group = new THREE.Group();
  group.name = 'RVOT in the thorax (schematic)';
  group.visible = false;
  const guides = chestGuides(chestZ);
  group.add(guides);
  const arrows = [];
  const electrodes = precordialPositions(chestZ + 0.02);
  for (const [id, p] of Object.entries(electrodes)) {
    const sprite = textSprite(id, ELECTRODE_COLORS[id]);
    sprite.position.copy(p);
    sprite.userData.electrode = id;
    group.add(sprite);
  }
  const span = 0.75;
  arrows.push(dottedArrow(rvot.centroid.clone().addScaledVector(rvot.axis, -span), rvot.centroid.clone().addScaledVector(rvot.axis, span), 0x1d3f8a));
  arrows.push(dottedArrow(lvot.centroid.clone().addScaledVector(lvot.axis, -span), lvot.centroid.clone().addScaledVector(lvot.axis, span), 0x111111));
  group.add(...arrows);
  parent.add(group);
  const v2 = v2OverRvot(electrodes.V2, rvot.points);
  // Axis directions in words: RVOT left posterosuperior, LVOT right superior (+x is patient left, +z anterior).
  const describe = (a) => ({ left: a.x > 0.15, right: a.x < -0.15, superior: a.y > 0.15, posterior: a.z < -0.15, anterior: a.z > 0.15 });
  const measures = {
    v2, electrodes: Object.fromEntries(Object.entries(electrodes).map(([k, p]) => [k, p.toArray()])),
    rvotAxis: describe(rvot.axis), lvotAxis: describe(lvot.axis),
    crossAngle: THREE.MathUtils.radToDeg(rvot.axis.angleTo(lvot.axis))
  };
  // Axial levels: the electrodes stay (V2 in the sagittal sequence), axes and chest lines would clutter the slice.
  return { group, measures, setVisible(on) { group.visible = Boolean(on); }, setSliced(on) { guides.visible = !on; for (const a of arrows) a.visible = !on; } };
}

export const FIG3_TEXT = {
  tr: {
    toggle: 'Şekil 3 · Göğüs içinde RVOT',
    levels: { front: 'Önden (A–B)', root: 'Pulmoner kök', high: 'Yüksek RVOT', low: 'Düşük RVOT' },
    levelNote: {
      root: 'Pulmoner kök düzeyi, yukarıdan (ön yukarıda, hasta sağı sağda): pulmoner kök çıkan aortun solunda ve aort kökünün sol-üstündedir.',
      high: 'Yüksek RVOT düzeyi: RVOT aort kökünün sol-önündedir; aort kökü (R, L) RVOT’un arkasında görülür.',
      low: 'Düşük RVOT düzeyi: RVOT, LVOT’un önünde ve ön-üstündedir. Bu düzeyde V2 elektrodu, RVOT ve LVOT ön-arka bir sıra oluşturur.'
    },
    levelLimits: 'Kesitler BT görüntüsü değil; atlas yüzeylerinin konturlarıdır. Sağ taraf mavi, sol taraf kırmızı halka; düzeyler pulmoner kapak ve aort kapağı yüksekliklerinden seçildi.',
    intro: 'Önden bakış (Miyazaki 2026, Şekil 3A–B). Sağ kalp mavi, sol kalp kırmızı; RVOT parlak mavi. Prekordiyal elektrotlar göğüs ön yüzü çerçevesinde: V1 ve V2 4. interkostal aralıkta sternum kenarlarında, V4 5. aralıkta midklaviküler çizgide, V3 ikisinin ortasında.',
    v2: (m) => m.over
      ? `Bu atlasta V2, RVOT’un hemen önünde (ön yüzde ${m.cm.toFixed(1)} cm uzaklıkta, yaklaşık ${(m.depth * 3.7).toFixed(1)} cm derinde).`
      : `Bu atlasta V2, RVOT’a ön yüzde ${m.cm.toFixed(1)} cm uzakta; gerçekte V2’nin yeri kişiden kişiye belirgin değişir.`,
    axes: (m) => `Lacivert kesikli ok: RVOT ekseni (sol-posterosuperior). Siyah kesikli ok: LVOT ekseni (sağ-superior). İki eksen arasındaki açı bu atlasta yaklaşık ${Math.round(m.crossAngle)}°; bu çapraz ilişki arteryel gövdenin embriyolojik gelişimini yansıtır.`,
    points: [
      'RVOT sol sternum kenarının arkasındadır; V2 elektrodu 4. interkostal aralıkta bu bölgeye yakındır, ama yeri bireyler arasında belirgin değişir.',
      'RVOT genellikle sol akciğerle örtülmez; sol parasternal transtorasik eko penceresi bu yüzden mümkündür. (Atlasta akciğer yok; bu ilişki çizilmedi.)',
      'V4 kalp apeksinin çevresindedir. Bu atlasta 5. aralık midklaviküler çizgi apeksin biraz lateraline düşer; göğüs çerçevesi ölçülmüş değil, şematiktir.'
    ],
    limits: 'Kaburga, sternum ve akciğer atlasta yoktur; göğüs çizgileri ve elektrotlar şematik çerçevededir (yaklaşık 3,7 cm/birim). Göğüs düz bir düzlem olarak alındığından V5 ve V6 yaklaşık konumdadır.'
  },
  en: {
    toggle: 'Figure 3 · RVOT in the thorax',
    levels: { front: 'Anterior (A–B)', root: 'Pulmonary root', high: 'High RVOT', low: 'Low RVOT' },
    levelNote: {
      root: 'Pulmonary root level from above (anterior up, patient right on the right): the pulmonary root lies left of the ascending aorta and left superior to the aortic root.',
      high: 'High RVOT level: the RVOT lies left anterior to the aortic root; the aortic root (R, L) is seen behind it.',
      low: 'Low RVOT level: the RVOT lies anterior to anterosuperior to the LVOT. At this level V2, the RVOT and the LVOT form an anteroposterior sequence.'
    },
    levelLimits: 'The sections are not CT images but contours of the atlas surfaces. Right-sided structures are blue rings, left-sided red; levels are chosen from the pulmonary and aortic valve heights.',
    intro: 'Anterior view (Miyazaki 2026, Figure 3A–B). Right heart blue, left heart red; RVOT bright blue. Precordial electrodes on the chest-wall frame: V1 and V2 at the 4th intercostal space beside the sternum, V4 at the 5th space on the midclavicular line, V3 midway.',
    v2: (m) => m.over
      ? `On this atlas V2 lies just in front of the RVOT (${m.cm.toFixed(1)} cm away in the frontal plane, about ${(m.depth * 3.7).toFixed(1)} cm deep).`
      : `On this atlas V2 is ${m.cm.toFixed(1)} cm from the RVOT in the frontal plane; in reality V2 placement varies markedly between individuals.`,
    axes: (m) => `Navy dashed arrow: RVOT axis (left posterosuperior). Black dashed arrow: LVOT axis (right superior). The two axes are about ${Math.round(m.crossAngle)}° apart on this atlas; this crisscross reflects the embryological development of the arterial trunk.`,
    points: [
      'The RVOT lies behind the left sternal border; the V2 electrode at the 4th intercostal space is near it, with marked individual variation.',
      'The RVOT is generally not covered by the left lung, which is why a left parasternal transthoracic echo window is feasible. (The atlas has no lung; this relation is not drawn.)',
      'V4 lies around the cardiac apex. On this atlas the 5th-space midclavicular point falls slightly lateral to the apex; the chest frame is schematic, not measured.'
    ],
    limits: 'The atlas has no ribs, sternum or lungs; chest lines and electrodes sit on a schematic frame (about 3.7 cm per unit). The chest is taken as a plane, so V5 and V6 are approximately placed.'
  }
};

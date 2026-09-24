import * as THREE from 'three';
import { AUSCULTATION_AREAS } from './exam-findings.js';

// Schematic auscultation areas projected onto a chest-wall plane in front of
// the heart. Levels come from measured anatomy (pulmonary valve height for
// the 2nd intercostal space, the tricuspid annulus for the lower sternal
// border, the LV apex for the mitral area); lateral offsets use the sternal
// midline of the thoracic scenery. The atlas has ~3.7 cm per unit, so an
// intercostal space is about 0.7 units and the sternal edge ~0.5 units from
// the midline. These are teaching markers, not surface anatomy landmarks.

const MIDLINE_X = -0.25;        // sternal midline (vertebral column axis in thorax.js)
const STERNAL_EDGE = 0.5;       // units from midline to the parasternal line
const CHEST_OFFSET = 0.3;       // chest wall in front of the most anterior heart point
const ICS = 0.7;                // one intercostal space

/** World positions of the five classic auscultation areas. */
export function auscultationPositions({ sourceCenter, meshVertices }) {
  const pulmonaryValve = sourceCenter('pulmonary-valve');
  const tricuspid = sourceCenter('tricuspid-annulus') || sourceCenter('tricuspid');
  const lvVerts = meshVertices('lv');
  if (!pulmonaryValve || !tricuspid || !lvVerts.length) return null;
  const heartFront = Math.max(...['rv', 'lv', 'ra', 'aorta', 'pa'].flatMap(id => {
    const verts = meshVertices(id);
    return verts.length ? [Math.max(...verts.map(v => v.z))] : [];
  }));
  const z = heartFront + CHEST_OFFSET;
  // Apex: the LV point farthest down and to the left.
  const apex = lvVerts.reduce((best, v) => (v.x - v.y > best.x - best.y ? v : best));
  const secondIcs = pulmonaryValve.y + 0.35;
  return {
    aortic: new THREE.Vector3(MIDLINE_X - STERNAL_EDGE, secondIcs, z),
    pulmonic: new THREE.Vector3(MIDLINE_X + STERNAL_EDGE, secondIcs, z),
    erb: new THREE.Vector3(MIDLINE_X + STERNAL_EDGE, secondIcs - ICS, z),
    tricuspid: new THREE.Vector3(MIDLINE_X + STERNAL_EDGE * 0.8, tricuspid.y - 0.45, z),
    mitral: new THREE.Vector3(apex.x, apex.y, z - 0.05)
  };
}

function labelTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#244f43';
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 30px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 32, 34);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Pickable markers (pickId `ausc-<area>`), hidden until the exam mode shows them.
 * @returns {{ group: THREE.Group, build: () => void, setVisible: (v: boolean) => void, highlight: (areaId: string|null) => void }}
 */
export function createAuscultationMarkers(helpers) {
  const group = new THREE.Group();
  group.name = 'Auscultation areas (schematic)';
  group.visible = false;
  const markers = new Map();

  function build() {
    if (markers.size) return;
    const positions = auscultationPositions(helpers);
    if (!positions) return;
    for (const [areaId, position] of Object.entries(positions)) {
      const area = AUSCULTATION_AREAS[areaId];
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(0.16, 32),
        new THREE.MeshBasicMaterial({ color: 0x31573f, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
      );
      disc.position.copy(position);
      disc.name = `${area.label.en} (schematic)`;
      disc.userData = { pickId: `ausc-${areaId}`, provenance: 'schematic', sourceName: area.label.en, areaId };
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(area.short), depthTest: false, transparent: true }));
      label.scale.set(0.2, 0.2, 1);
      label.position.copy(position).add(new THREE.Vector3(0, 0, 0.02));
      label.userData = { pickId: `ausc-${areaId}` };
      label.renderOrder = 6;
      disc.renderOrder = 5;
      group.add(disc, label);
      markers.set(areaId, disc);
    }
  }

  return {
    group,
    build,
    setVisible(visible) {
      if (visible) build();
      group.visible = Boolean(visible);
    },
    highlight(areaId) {
      for (const [id, disc] of markers) {
        disc.material.opacity = id === areaId ? 0.8 : 0.35;
        disc.scale.setScalar(id === areaId ? 1.3 : 1);
      }
    },
    positions: () => Object.fromEntries([...markers].map(([id, disc]) => [id, disc.position.clone()]))
  };
}

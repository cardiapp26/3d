import * as THREE from 'three';
import { AUSCULTATION_AREAS } from './exam-findings.js';
import { CHEST, areaPoints, icsY, lineX } from './chest-surface.js';

// Auscultation areas on the shared chest-wall frame (chest-surface.js):
// every area is a side / line / intercostal-space address on one plane in
// front of the heart, so they agree with each other and with the drawn
// sternum, intercostal and midclavicular guides. Only the plane's depth is
// measured from the heart (its most anterior point). Teaching markers, not
// segmented surface anatomy.

/** z of the chest plane: in front of the most anterior heart point. */
function chestPlaneZ(meshVertices) {
  const fronts = ['rv', 'lv', 'ra', 'aorta', 'pa'].flatMap(id => {
    const verts = meshVertices(id);
    return verts.length ? [Math.max(...verts.map(v => v.z))] : [];
  });
  return fronts.length ? Math.max(...fronts) + CHEST.chestOffset : null;
}

/** World positions of the five classic auscultation areas. */
export function auscultationPositions({ meshVertices }) {
  const z = chestPlaneZ(meshVertices);
  if (z == null) return null;
  return Object.fromEntries(Object.entries(areaPoints(z)).map(([id, p]) => [id, new THREE.Vector3(p.x, p.y, p.z)]));
}

// Faint chest-wall guides: sternal borders, intercostal ticks (numbered on
// the left sternal border) and the left midclavicular line.
function chestGuides(z) {
  const group = new THREE.Group();
  group.name = 'Chest wall reference (schematic)';
  const line = (points, dashed = false) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, y]) => new THREE.Vector3(x, y, z - 0.01)));
    const material = dashed
      ? new THREE.LineDashedMaterial({ color: 0x14352b, transparent: true, opacity: 0.85, dashSize: 0.08, gapSize: 0.06, depthWrite: false, depthTest: false })
      : new THREE.LineBasicMaterial({ color: 0x14352b, transparent: true, opacity: 0.8, depthWrite: false, depthTest: false });
    const out = new THREE.Line(geometry, material);
    if (dashed) out.computeLineDistances();
    return out;
  };
  const top = icsY(1.5), bottom = icsY(5.6);
  for (const side of ['left', 'right']) group.add(line([[lineX(side, 'sternal'), top], [lineX(side, 'sternal'), bottom]]));
  const mcl = lineX('left', 'mcl');
  group.add(line([[mcl, icsY(1.5)], [mcl, icsY(6)]], true));
  for (const n of [2, 3, 4, 5]) {
    const y = icsY(n);
    group.add(line([[lineX('right', 'sternal') - 0.25, y], [lineX('right', 'sternal'), y]]));
    group.add(line([[lineX('left', 'sternal'), y], [lineX('left', 'sternal') + 0.25, y]]));
    const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tickTexture(`${n}`), depthTest: false, transparent: true, opacity: 0.8 }));
    tag.scale.set(0.11, 0.11, 1);
    tag.position.set(lineX('right', 'sternal') - 0.36, y, z);
    group.add(tag);
  }
  group.add(line([[mcl - 0.2, icsY(5)], [mcl + 0.2, icsY(5)]]));
  group.traverse(o => { o.renderOrder = 5; });
  return group;
}

function tickTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#14352b';
  ctx.font = '700 22px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 16, 17);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
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
  let highlighted = null;

  function build() {
    if (markers.size) return;
    const positions = auscultationPositions(helpers);
    if (!positions) return;
    group.add(chestGuides(positions.aortic.z));
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
      if (visible) { build(); this.highlight(highlighted); }
      group.visible = Boolean(visible);
    },
    highlight(areaId) {
      for (const [id, disc] of markers) {
        disc.material.opacity = id === areaId ? 0.8 : 0.35;
        disc.scale.setScalar(id === areaId ? 1.3 : 1);
      }
      highlighted = areaId && AUSCULTATION_AREAS[areaId] ? areaId : null;
    },
    getHighlighted: () => highlighted,
    positions: () => Object.fromEntries([...markers].map(([id, disc]) => [id, disc.position.clone()]))
  };
}

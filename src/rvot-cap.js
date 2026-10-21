import * as THREE from 'three';
import { sectionMeshes } from './echo-section.js';

/*
 * Cut face of the RVOT superior section. The atlas RV is a single surface
 * with no wall thickness, so a stencil cap would fill the whole cavity.
 * Instead the RV contour on the cut plane becomes a band of wall drawn
 * inward from the surface, coloured by the segment of each contour point;
 * the LV and aortic contours are drawn as lines for orientation. The band
 * width is a teaching thickness, not measured myocardium.
 */
export const RVOT_WALL_FRACTION = 0.14;   // band width as a share of the contour's mean radius
const LIFT = 0.004;                       // draw just below the cut so the clipping plane keeps it

function frameOf(plane, centre) {
  const view = plane.normal.clone().negate();                  // toward the camera
  const anterior = new THREE.Vector3(0, 0, 1).addScaledVector(view, -view.z).normalize();
  const right = new THREE.Vector3().crossVectors(anterior, view).normalize();
  const origin = plane.projectPoint(centre, new THREE.Vector3()).addScaledVector(view, -LIFT);
  return { origin, view, anterior, right, image: { origin: origin.toArray(), beam: anterior.toArray(), lateral: right.toArray(), normal: view.toArray() } };
}

const itemOf = (mesh, parts = null) => {
  const g = mesh.geometry;
  mesh.updateWorldMatrix(true, false);
  return { id: mesh.userData.id, positions: g.attributes.position.array, index: g.index?.array || null, matrix: mesh.matrixWorld.elements, key: g, mesh: parts ? { userData: { parts } } : null };
};

/** Band triangles inward from each contour, coloured per point. */
function bandGeometry(contours, frame, fallback) {
  const pos = [], col = [], idx = [], c = new THREE.Color();
  const to3 = ([x, y]) => frame.origin.clone().addScaledVector(frame.right, x).addScaledVector(frame.anterior, y);
  for (const contour of contours) {
    const pts = contour.points, n = pts.length;
    if (n < 3) continue;
    const cx = pts.reduce((s, p) => s + p[0], 0) / n, cy = pts.reduce((s, p) => s + p[1], 0) / n;
    const radius = pts.reduce((s, p) => s + Math.hypot(p[0] - cx, p[1] - cy), 0) / n;
    const width = RVOT_WALL_FRACTION * radius;
    const base = pos.length / 3;
    pts.forEach((p, i) => {
      const dx = cx - p[0], dy = cy - p[1], d = Math.hypot(dx, dy) || 1;
      const w = Math.min(width, d * 0.6);
      const inner = [p[0] + dx / d * w, p[1] + dy / d * w];
      for (const q of [p, inner]) pos.push(...to3(q).toArray());
      c.set(contour.parts?.[i]?.color || fallback);
      col.push(...c.toArray(), ...c.clone().multiplyScalar(0.82).toArray());
    });
    for (let i = 0; i + 1 < n; i++) {
      const a = base + 2 * i, b = a + 2;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

function lineGeometry(contours, frame) {
  const pos = [];
  const to3 = ([x, y]) => frame.origin.clone().addScaledVector(frame.right, x).addScaledVector(frame.anterior, y);
  for (const { points } of contours) for (let i = 0; i + 1 < points.length; i++) pos.push(...to3(points[i]).toArray(), ...to3(points[i + 1]).toArray());
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/**
 * @param {{ parent: THREE.Object3D }} options
 * @returns {{ update(input: { plane: THREE.Plane, centre: THREE.Vector3, rv: THREE.Mesh, parts: object, outlines: THREE.Mesh[] }): object, setVisible(on: boolean): void, group: THREE.Group }}
 */
export function createRvotCap({ parent }) {
  const group = new THREE.Group();
  group.name = 'RVOT section cap';
  group.visible = false;
  const band = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 }));
  const outline = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x8a6a64, transparent: true, opacity: 0.85 }));
  band.renderOrder = outline.renderOrder = 3;
  group.add(band, outline);
  parent.add(group);
  let summary = { rings: 0, points: 0, outlines: 0 };
  return {
    group,
    update({ plane, centre, rv, parts, outlines = [] }) {
      const frame = frameOf(plane, centre);
      const rvCut = sectionMeshes([itemOf(rv, parts)], frame.image, { minLength: 0.05 });
      const other = sectionMeshes(outlines.map((m) => itemOf(m)), frame.image, { minLength: 0.05 });
      band.geometry.dispose(); outline.geometry.dispose();
      band.geometry = bandGeometry(rvCut.contours, frame, '#7a4a4c');
      outline.geometry = lineGeometry(other.contours, frame);
      summary = { rings: rvCut.contours.length, points: rvCut.contours.reduce((s, c) => s + c.points.length, 0), outlines: other.contours.length };
      return summary;
    },
    setVisible(on) { group.visible = Boolean(on); },
    getSummary: () => ({ ...summary, visible: group.visible })
  };
}

function labelSprite(text, color) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = '700 30px "DM Sans", sans-serif';
  canvas.width = Math.ceil(ctx.measureText(text).width) + 28; canvas.height = 46;
  ctx.font = '700 30px "DM Sans", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(1, 1, canvas.width - 2, canvas.height - 2, 12); else ctx.rect(1, 1, canvas.width - 2, canvas.height - 2);
  ctx.fill();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
  sprite.scale.set(0.0034 * canvas.width, 0.0034 * canvas.height, 1);
  sprite.renderOrder = 8;
  return sprite;
}

/**
 * Axial cut faces of several structures (Figure 3C): one coloured wall band per
 * mesh and a name at the centre of its longest contour.
 * @param {{ parent: THREE.Object3D }} options
 */
export function createSectionCaps({ parent }) {
  const group = new THREE.Group();
  group.name = 'Axial section caps';
  group.visible = false;
  parent.add(group);
  let summary = {};
  return {
    group,
    /** @param {{ plane: THREE.Plane, centre: THREE.Vector3, items: { mesh: THREE.Mesh, color: string, label?: string }[] }} input */
    update({ plane, centre, items }) {
      for (const child of [...group.children]) { child.geometry?.dispose(); child.material?.map?.dispose(); child.material?.dispose(); group.remove(child); }
      const frame = frameOf(plane, centre);
      summary = {};
      for (const { mesh, color, label } of items) {
        const cut = sectionMeshes([itemOf(mesh)], frame.image, { minLength: 0.05 });
        if (!cut.contours.length) continue;
        const band = new THREE.Mesh(bandGeometry(cut.contours, frame, color), new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.7, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 }));
        band.renderOrder = 3;
        group.add(band);
        const longest = cut.contours.reduce((a, b) => (b.length > a.length ? b : a));
        const n = longest.points.length;
        const c2 = longest.points.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n], [0, 0]);
        const at = frame.origin.clone().addScaledVector(frame.right, c2[0]).addScaledVector(frame.anterior, c2[1]).addScaledVector(frame.view, 0.02);
        if (label) { const sprite = labelSprite(label, color); sprite.position.copy(at); group.add(sprite); }
        summary[mesh.userData.id] = (summary[mesh.userData.id] || 0) + cut.contours.length;
      }
      return { ...summary };
    },
    setVisible(on) { group.visible = Boolean(on); },
    getSummary: () => ({ ...summary, visible: group.visible })
  };
}

import * as THREE from 'three';
import { toFrame } from './mesh-utils.js';
import { uncoveredArc } from './schematic-leaflets.js';

export const SCALLOP_COLORS = ['#e8ad57', '#64c8b5', '#929aeb'];

// Approximate teaching regions, not fissures segmented from the atlas.
// Numbering follows the commissural axis, with 1 on the anatomical left (+X).
export function scallopLayout(ring, posterior) {
  const { frame, rim } = ring;
  const p = posterior.geometry.attributes.position;
  posterior.updateWorldMatrix(true, false);
  const samples = [];
  for (let i = 0; i < p.count; i++) {
    samples.push(toFrame(frame, new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(posterior.matrixWorld)));
  }
  const gap = uncoveredArc(rim, samples, frame);
  if (gap.length < 4) return null;
  const axis = gap[0].clone().sub(gap.at(-1)).projectOnPlane(frame.normal).normalize();
  if (axis.x < 0) axis.negate();
  const ends = [gap[0], gap.at(-1)].map(point => point.clone().sub(frame.center).dot(axis));
  const low = Math.min(...ends), high = Math.max(...ends);
  if (high - low < frame.radius * 0.2) return null;
  return { axis, low, high, region(point) {
    const t = (point.clone().sub(frame.center).dot(axis) - low) / (high - low);
    return t > 2 / 3 ? 0 : t > 1 / 3 ? 1 : 2;
  } };
}

export function createMitralScallops(container, getMeshes) {
  const overlay = document.createElement('div');
  overlay.className = 'mitral-scallops';
  overlay.hidden = true;
  const note = document.createElement('div');
  note.className = 'mitral-scallop-note';
  overlay.append(note);
  container.append(overlay);
  const entries = [];
  const colored = [];
  let active = false;

  function build() {
    const ring = getMeshes('mitral-annulus')[0]?.userData;
    const posterior = getMeshes('mitral-posterior')[0];
    if (!ring?.frame || !posterior) return;
    const layout = scallopLayout(ring, posterior);
    if (!layout) return;
    for (const mesh of getMeshes('mitral')) {
      const p = mesh.geometry.attributes.position;
      const colors = new Float32Array(p.count * 3);
      const buckets = [[], [], []];
      mesh.updateWorldMatrix(true, false);
      for (let i = 0; i < p.count; i++) {
        const point = new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld);
        const depth = toFrame(ring.frame, point).d;
        const region = layout.region(point);
        const body = depth >= -0.15 * ring.frame.radius && depth < 0.65 * ring.frame.radius;
        const color = new THREE.Color(body ? SCALLOP_COLORS[region] : '#f4efe4');
        color.toArray(colors, i * 3);
        if (body) buckets[region].push({ point, index: i });
      }
      mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      colored.push(mesh);
      buckets.forEach((bucket, region) => {
        if (!bucket.length) return;
        const center = bucket.reduce((sum, v) => sum.add(v.point), new THREE.Vector3()).divideScalar(bucket.length);
        const anchor = bucket.reduce((best, v) => v.point.distanceToSquared(center) < best.point.distanceToSquared(center) ? v : best);
        const label = document.createElement('span');
        label.className = 'mitral-scallop-label';
        label.textContent = `${mesh.userData.leaflet === 'anterior' ? 'A' : 'P'}${region + 1}`;
        label.style.borderColor = SCALLOP_COLORS[region];
        overlay.append(label);
        entries.push({ mesh, index: anchor.index, label });
      });
    }
  }

  function update(camera, enabled) {
    if (active !== enabled) {
      active = enabled;
      for (const mesh of colored) {
        mesh.material.vertexColors = enabled;
        mesh.material.needsUpdate = true;
      }
    }
    overlay.hidden = !enabled;
    if (!enabled) return;
    note.textContent = document.documentElement.lang === 'tr'
      ? 'Şematik bölgeler · A1–A3: anterior segmentler · P1–P3: posterior scalloplar'
      : 'Schematic regions · A1–A3: anterior segments · P1–P3: posterior scallops';
    for (const { mesh, index, label } of entries) {
      const point = new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position, index).applyMatrix4(mesh.matrixWorld).project(camera);
      label.hidden = !mesh.visible || point.z < -1 || point.z > 1 || Math.abs(point.x) > 1 || Math.abs(point.y) > 1;
      label.style.left = `${(point.x + 1) * 50}%`;
      label.style.top = `${(1 - point.y) * 50}%`;
    }
  }
  return { build, update, dispose() { overlay.remove(); } };
}

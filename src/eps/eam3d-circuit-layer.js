/*
 * Circuit layer of the 3D EAM map ("Find the circuit"): reentrant circuit ribbons laid on the
 * wall of their own chamber, numbered badges, anatomical landmark labels and a legend that
 * names each circuit, says where it turns and which ablation line interrupts it.
 */
import * as THREE from 'three';
import { ANCHORS } from './eam3d-anatomy.js';

const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const RIBBON_SAMPLES = 72;
const SMOOTH_PASSES = 3;
// Ribbons ride just outside the endocardial shell so they are not hidden inside the wall.
const SURFACE_LIFT = 0.03;
const PV_IDS = Object.freeze(['lspv', 'lipv', 'rspv', 'ripv']);

// Anatomical landmarks named on the map while circuits are shown.
const FIXED_LANDMARKS = Object.freeze([
  { id: 'mv', chamber: 'la', pos: ANCHORS.mvCenter },
  { id: 'tv', chamber: 'ra', pos: ANCHORS.tvCenter },
  { id: 'cs', chamber: 'ra', pos: ANCHORS.csOstium },
  { id: 'cti', chamber: 'ra', pos: ANCHORS.ctiMid },
  { id: 'roof', chamber: 'la', pos: ANCHORS.laRoofMid },
  { id: 'posterior', chamber: 'la', pos: ANCHORS.laPosterior },
  { id: 'scar', chamber: 'lv', pos: ANCHORS.lvInferolateralScar },
]);

function nearestVertex(positions, point) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < positions.count; i++) {
    const dx = positions.getX(i) - point.x;
    const dy = positions.getY(i) - point.y;
    const dz = positions.getZ(i) - point.z;
    const d = dx * dx + dy * dy + dz * dz;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return new THREE.Vector3(positions.getX(best), positions.getY(best), positions.getZ(best));
}

// Radii in atlas units (the heart's longest side is 3.3 units, about 3.6 cm per unit).
const MITRAL_RADIUS = 0.42;
const TRICUSPID_RADIUS = 0.5;
const SCAR_RADIUS = 0.3;
const ANTERIOR_RADIUS = 0.22;
const FIGURE8_RADIUS = 0.17;

/** Two unit vectors spanning the plane normal to `axis`. */
function planeBasis(axis) {
  const n = axis.clone().normalize();
  const helper = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(helper, n).normalize();
  return { n, u, v: new THREE.Vector3().crossVectors(n, u).normalize() };
}

/**
 * Ring of points around `centre` in the plane normal to `axis`. Seen from the side the axis
 * points to, the ring turns counter-clockwise (`turn` = 1) or clockwise (`turn` = -1).
 */
function ring(centre, axis, radius, { turn = 1, start = 0, count = RIBBON_SAMPLES } = {}) {
  const { u, v } = planeBasis(axis);
  return Array.from({ length: count }, (_, i) => {
    const a = start + turn * (i / count) * Math.PI * 2;
    return centre.clone().addScaledVector(u, Math.cos(a) * radius).addScaledVector(v, Math.sin(a) * radius);
  });
}

/**
 * Two touching loops turning in opposite directions (figure of eight) on a wall patch.
 * `across` is the direction that separates the two lobes; both lobes start where they meet.
 */
function figureEight(centre, axis, across, radius) {
  const { n, u, v } = planeBasis(axis);
  const side = across.clone().projectOnPlane(n).normalize();
  const lobe = (sign, turn) => {
    const lobeCentre = centre.clone().addScaledVector(side, sign * radius);
    const toMeet = side.clone().multiplyScalar(-sign);
    const start = Math.atan2(toMeet.dot(v), toMeet.dot(u));
    return ring(lobeCentre, n, radius, { turn, start, count: RIBBON_SAMPLES / 2 });
  };
  return [...lobe(-1, 1), ...lobe(1, -1)];
}

/** Points of a closed loop moved onto a chamber wall, smoothed, and lifted off it. */
function layOnWall(curve, mesh) {
  const pts = Array.isArray(curve) ? curve : curve.getSpacedPoints(RIBBON_SAMPLES).slice(0, RIBBON_SAMPLES);
  if (!mesh) return pts;
  const positions = mesh.geometry.attributes.position;
  let laid = pts.map((p) => nearestVertex(positions, p));
  for (let pass = 0; pass < SMOOTH_PASSES; pass++) {
    laid = laid.map((p, i) => {
      const prev = laid[(i + laid.length - 1) % laid.length];
      const next = laid[(i + 1) % laid.length];
      return p.clone().multiplyScalar(0.5).addScaledVector(prev, 0.25).addScaledVector(next, 0.25);
    });
  }
  const centre = mesh.userData.centre || new THREE.Vector3();
  return laid.map((p) => p.clone().addScaledVector(p.clone().sub(centre).normalize(), SURFACE_LIFT));
}

function disposeChildren(group) {
  group.traverse((o) => {
    o.geometry?.dispose();
    for (const m of [o.material].flat().filter(Boolean)) m.dispose();
  });
  group.clear();
}

/**
 * @param {{ onCircuitSelect: (circuitNumber: number) => void }} options
 */
export function createCircuitLayer({ onCircuitSelect }) {
  const group = new THREE.Group();
  const overlay = document.createElement('div');
  overlay.className = 'eam3d-circuit-overlay';
  const tags = document.createElement('div');
  tags.className = 'eam3d-circuit-tags';
  const legend = document.createElement('div');
  legend.className = 'eam3d-circuit-legend';
  legend.setAttribute('data-eam3d-circuit-legend', 'true');
  legend.hidden = true;
  // Where the selected circuit turns and which line cuts it; sits under the 3D view.
  const caption = document.createElement('div');
  caption.className = 'eam3d-circuit-caption';
  caption.setAttribute('data-eam3d-circuit-caption', 'true');
  caption.hidden = true;
  overlay.append(tags, legend, caption);

  let chambers = new Map();
  let landmarks = [];
  let shapes = new Map();
  const anchored = [];
  const wallCache = new Map();

  /** Give the layer the loaded chamber and vessel meshes (atlas frame). */
  function setAnatomy(chamberMeshes, vesselMeshes) {
    chambers = new Map(chamberMeshes.map((m) => [m.userData.id, m]));
    wallCache.clear();
    const la = chambers.get('la');
    const laCentre = la?.userData.centre || V(ANCHORS.mvCenter);
    const pvs = vesselMeshes
      .filter((m) => PV_IDS.includes(m.userData.id))
      .map((m) => ({ id: m.userData.id, point: nearestVertex(m.geometry.attributes.position, laCentre) }));
    landmarks = [
      ...FIXED_LANDMARKS.map((lm) => ({ id: lm.id, point: chambers.get(lm.chamber) ? nearestVertex(chambers.get(lm.chamber).geometry.attributes.position, V(lm.pos)) : V(lm.pos) })),
      ...pvs,
    ];
    shapes = buildShapes(pvs);
    // The mitral label sits at the centre of the perimitral ring, so name and loop agree.
    const mitral = shapes.get('circuit-1-mitral');
    if (mitral) {
      const centre = mitral.reduce((sum, p) => sum.add(p), new THREE.Vector3()).multiplyScalar(1 / mitral.length);
      landmarks = landmarks.map((lm) => (lm.id === 'mv' ? { ...lm, point: centre } : lm));
    }
  }

  /**
   * Circuit paths built from the anatomy instead of fixed coordinates: annular rings sit in the
   * valve plane, the roof circuit circles the left pulmonary veins, the posterior circuit is a
   * figure of eight between the veins, and the VT loop circles the LV scar.
   */
  function buildShapes(pvs) {
    const out = new Map();
    const centreOf = (id) => chambers.get(id)?.userData.centre;
    const la = centreOf('la');
    const ra = centreOf('ra');
    const lv = centreOf('lv');
    const pv = Object.fromEntries(pvs.map((p) => [p.id, p.point]));
    if (la) {
      // Perimitral: around the LA floor where it meets the LV, counter-clockwise seen from the
      // LV (as in LAO). The annulus centre is the LA wall point nearest the LV.
      if (lv) {
        const mv = nearestVertex(chambers.get('la').geometry.attributes.position, lv);
        out.set('circuit-1-mitral', ring(mv, lv.clone().sub(la), MITRAL_RADIUS));
      }
      if (pv.lspv && pv.lipv) {
        const leftPvs = pv.lspv.clone().add(pv.lipv).multiplyScalar(0.5);
        const r = pv.lspv.distanceTo(pv.lipv) * 0.5 + 0.18;
        out.set('circuit-2-roof', ring(leftPvs, leftPvs.clone().sub(la), r));
      }
      const post = V(ANCHORS.laPosterior);
      const across = pv.lspv && pv.rspv ? pv.lspv.clone().sub(pv.rspv) : new THREE.Vector3(1, 0, 0);
      out.set('circuit-3-posterior-fig8', figureEight(post, post.clone().sub(la), across, FIGURE8_RADIUS));
      const anterior = la.clone().add(new THREE.Vector3(0.05, 0.12, 1).normalize().multiplyScalar(0.5));
      out.set('circuit-4-anterior-scar', ring(anterior, anterior.clone().sub(la), ANTERIOR_RADIUS));
    }
    if (ra) {
      // Typical flutter: counter-clockwise around the tricuspid annulus seen from the RV apex (LAO).
      const tv = V(ANCHORS.tvCenter);
      out.set('circuit-5-cti', ring(tv, V(ANCHORS.rvApex).sub(tv), TRICUSPID_RADIUS));
    }
    if (lv) {
      const scar = V(ANCHORS.lvInferolateralScar);
      out.set('circuit-6-vt-isthmus', ring(scar, scar.clone().sub(lv), SCAR_RADIUS));
    }
    return out;
  }

  function ribbonPoints(circuit) {
    const key = `${circuit.id}|${chambers.size}`;
    if (!wallCache.has(key)) {
      const shaped = shapes.get(circuit.id);
      const path = shaped || new THREE.CatmullRomCurve3(circuit.ribbon3d.map(V), true);
      wallCache.set(key, layOnWall(path, chambers.get(circuit.chamber)));
    }
    return wallCache.get(key);
  }

  function addTag(className, html, point, attrs = {}) {
    const node = document.createElement(attrs.button ? 'button' : 'span');
    if (attrs.button) node.type = 'button';
    node.className = className;
    node.innerHTML = html;
    for (const [k, v] of Object.entries(attrs.data || {})) node.dataset[k] = v;
    if (attrs.color) node.style.setProperty('--badge-color', attrs.color);
    tags.appendChild(node);
    anchored.push({ point, el: node });
    return node;
  }

  const escape = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

  function legendRow(c, selected, labels) {
    const text = labels.circuits[c.id] || { short: `#${c.number}`, how: '' };
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `eam3d-circuit-legend-row${selected ? ' is-selected' : ''}${c.interrupted ? ' is-blocked' : ''}`;
    row.style.setProperty('--badge-color', c.color);
    row.dataset.eam3dLegendCircuit = String(c.number);
    const share = c.interrupted ? labels.blocked : `%${c.frequencyPct}`;
    row.innerHTML = `<i></i><b>${c.number}</b><span>${escape(text.short)}</span><em>${escape(share)}</em>`;
    if (selected) {
      const lines = c.blockedBy.map((id) => labels.lines[id] || id).join(' / ');
      caption.style.setProperty('--badge-color', c.color);
      caption.innerHTML = `<b>${c.number} · ${escape(text.short)}</b> ${escape(text.how)} <span>${escape(labels.cutBy)}: ${escape(lines)}</span>`;
      caption.hidden = false;
    }
    row.addEventListener('click', () => onCircuitSelect(c.number));
    legend.appendChild(row);
  }

  /**
   * Redraw ribbons, badges, landmarks and legend.
   * @param {{ report: object | null, selected: number | null, labels: object | null }} view
   */
  function update({ report, selected, labels }) {
    disposeChildren(group);
    tags.replaceChildren();
    legend.replaceChildren();
    anchored.length = 0;
    legend.hidden = !report || !labels;
    caption.hidden = true;
    if (!report || !labels) return;

    const anySelected = report.circuits.some((c) => c.number === selected);
    const title = document.createElement('strong');
    title.textContent = labels.legendTitle;
    legend.title = labels.legendHint;
    legend.append(title);
    if (!anySelected) {
      caption.style.removeProperty('--badge-color');
      caption.textContent = labels.legendHint;
      caption.hidden = false;
    }

    for (const c of report.circuits) {
      const isSelected = selected === c.number;
      const faded = c.interrupted || (anySelected && !isSelected);
      const opacity = faded ? 0.16 : isSelected ? 1 : 0.85;
      const pts = ribbonPoints(c);
      const curve = new THREE.CatmullRomCurve3(pts, true);
      const ribbon = new THREE.Mesh(
        new THREE.TubeGeometry(curve, RIBBON_SAMPLES * 2, isSelected ? 0.03 : 0.02, 8, true),
        new THREE.MeshStandardMaterial({ color: c.color, emissive: c.color, emissiveIntensity: isSelected ? 0.95 : 0.55, transparent: true, opacity, depthTest: false })
      );
      ribbon.renderOrder = 12;
      group.add(ribbon);

      // Arrows show the direction of rotation.
      for (const t of isSelected ? [0.15, 0.48, 0.81] : [0.4]) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(isSelected ? 0.05 : 0.042, 0.12, 10),
          new THREE.MeshBasicMaterial({ color: c.color, transparent: true, opacity, depthTest: false })
        );
        cone.position.copy(curve.getPointAt(t));
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangentAt(t).normalize());
        cone.renderOrder = 13;
        group.add(cone);
      }

      if (!faded || isSelected) {
        const short = labels.circuits[c.id]?.short || '';
        const badge = addTag(
          `eam3d-circuit-badge${isSelected ? ' is-selected' : ''}${c.interrupted ? ' is-blocked' : ''}`,
          isSelected ? `<b>${c.number}</b><span>${escape(short)}</span>` : `<b>${c.number}</b>`,
          curve.getPointAt(0),
          { button: true, color: c.color, data: { circuitBadge: c.id } }
        );
        badge.addEventListener('click', () => onCircuitSelect(c.number));
      }
      legendRow(c, isSelected, labels);
    }

    for (const lm of landmarks) {
      const name = labels.landmarks[lm.id];
      if (name) addTag('eam3d-landmark-tag', escape(name), lm.point, { data: { landmark: lm.id } });
    }
  }

  /** Move the HTML tags over their 3D points; call after each render. */
  function project(camera, width, height) {
    if (!anchored.length || !width) return;
    for (const a of anchored) {
      const p = a.point.clone().project(camera);
      a.el.hidden = p.z > 1;
      a.el.style.left = `${((p.x + 1) * width) / 2}px`;
      a.el.style.top = `${((-p.y + 1) * height) / 2}px`;
    }
  }

  return { group, overlay, setAnatomy, update, project, dispose: () => disposeChildren(group) };
}

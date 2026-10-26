/*
 * Which side of each chamber wall surface faces a cavity, for the echo image
 * (echo-bmode.js). The atlas chambers are wall shells: an endocardial and an
 * epicardial surface (about 0.9 cm apart in the LV), triangles wound so their
 * normals point out of the wall tissue. Along the normal, an endocardial
 * vertex looks across its cavity at the opposite wall; an epicardial vertex
 * looks out of the heart. Measured once at rest: five rays per vertex (the
 * normal and four 25 degree tilts) march an occupancy grid of all the wall
 * surfaces; a vertex is cavity-facing when at least three of them first meet
 * the same chamber's surface (the far wall of its cavity) within REACH. An
 * epicardial vertex that looks at a neighbour (the aorta across the
 * atrioventricular groove) first meets that neighbour's surface instead. The result is a 0/1 array per vertex, read by echo-section.js
 * from `mesh.userData.echoFacing`.
 */
export const CELL = 0.05;        // atlas units (about 1.9 mm)
export const REACH = 2.6;        // wider than any cavity in the atlas (about 9.6 cm)
const START = 0.1;               // first step clear of the vertex's own surface
const TILT = Math.tan((25 * Math.PI) / 180);
const MIN_HITS = 3;

function worldPositions(mesh) {
  const src = mesh.geometry.attributes.position.array, m = mesh.matrixWorld.elements, out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i += 3) {
    const x = src[i], y = src[i + 1], z = src[i + 2];
    out[i] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[i + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[i + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
  }
  return out;
}

const triangleCount = mesh => (mesh.geometry.index ? mesh.geometry.index.count : mesh.geometry.attributes.position.count) / 3;
const corner = (mesh, t, k) => (mesh.geometry.index ? mesh.geometry.index.getX(3 * t + k) : 3 * t + k);

/** Occupancy grid of every surface (vertices and triangle centroids). */
export function occupancyGrid(surfaces) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const { world } of surfaces) for (let i = 0; i < world.length; i += 3) for (let k = 0; k < 3; k++) {
    min[k] = Math.min(min[k], world[i + k]); max[k] = Math.max(max[k], world[i + k]);
  }
  const origin = min.map(v => v - 2 * CELL);
  const size = max.map((v, k) => Math.ceil((v - origin[k]) / CELL) + 3);
  const cells = new Uint8Array(size[0] * size[1] * size[2]);   // 0 empty, else surface index + 1
  const at = (x, y, z) => {
    const i = Math.floor((x - origin[0]) / CELL), j = Math.floor((y - origin[1]) / CELL), k = Math.floor((z - origin[2]) / CELL);
    return i < 0 || j < 0 || k < 0 || i >= size[0] || j >= size[1] || k >= size[2] ? -1 : (k * size[1] + j) * size[0] + i;
  };
  let label = 0;
  const mark = (x, y, z) => { const c = at(x, y, z); if (c >= 0) cells[c] = label; };
  for (const { mesh, world } of surfaces) {
    label = Math.min(255, surfaces.findIndex(s => s.mesh === mesh) + 1);
    for (let i = 0; i < world.length; i += 3) mark(world[i], world[i + 1], world[i + 2]);
    for (let t = 0; t < triangleCount(mesh); t++) {
      const a = 3 * corner(mesh, t, 0), b = 3 * corner(mesh, t, 1), c = 3 * corner(mesh, t, 2);
      mark((world[a] + world[b] + world[c]) / 3, (world[a + 1] + world[b + 1] + world[c + 1]) / 3, (world[a + 2] + world[b + 2] + world[c + 2]) / 3);
    }
  }
  return { surfaceAt: (x, y, z) => { const c = at(x, y, z); return c >= 0 ? cells[c] : 0; } };
}

/** Area-weighted vertex normals from the winding (out of the wall tissue). */
function vertexNormals(mesh, world) {
  const normals = new Float32Array(world.length);
  for (let t = 0; t < triangleCount(mesh); t++) {
    const a = 3 * corner(mesh, t, 0), b = 3 * corner(mesh, t, 1), c = 3 * corner(mesh, t, 2);
    const ux = world[b] - world[a], uy = world[b + 1] - world[a + 1], uz = world[b + 2] - world[a + 2];
    const vx = world[c] - world[a], vy = world[c + 1] - world[a + 1], vz = world[c + 2] - world[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const v of [a, b, c]) { normals[v] += nx; normals[v + 1] += ny; normals[v + 2] += nz; }
  }
  return normals;
}

/** Surface label (index + 1) first met along the ray within REACH, or 0. */
function firstSurface(grid, p, d) {
  for (let s = START; s <= REACH; s += CELL) {
    const hit = grid.surfaceAt(p[0] + d[0] * s, p[1] + d[1] * s, p[2] + d[2] * s);
    if (hit) return hit;
  }
  return 0;
}

/**
 * @param {THREE.Mesh[]} chambers meshes to classify (rest pose, world matrices current)
 * @param {THREE.Mesh[]} obstacles every wall surface a ray can meet (chambers included)
 * @returns {Map<THREE.Mesh, Uint8Array>} 1 where the vertex faces a cavity
 */
export function measureCavityFacing(chambers, obstacles) {
  const surfaces = [...new Set([...chambers, ...obstacles])].map(mesh => { mesh.updateWorldMatrix(true, false); return { mesh, world: worldPositions(mesh) }; });
  const grid = occupancyGrid(surfaces);
  const out = new Map();
  for (const { mesh, world } of surfaces.filter(s => chambers.includes(s.mesh))) {
    const own = Math.min(255, surfaces.findIndex(s => s.mesh === mesh) + 1);
    const normals = vertexNormals(mesh, world);
    const facing = new Uint8Array(world.length / 3);
    for (let v = 0; v < facing.length; v++) {
      let n = [normals[3 * v], normals[3 * v + 1], normals[3 * v + 2]];
      const len = Math.hypot(...n);
      if (!len) continue;
      n = n.map(x => x / len);
      // Two tangents for the tilted rays.
      const t1 = Math.abs(n[0]) < 0.9 ? [0, -n[2], n[1]] : [-n[2], 0, n[0]];
      const l1 = Math.hypot(...t1), u = t1.map(x => x / l1);
      const w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
      const p = [world[3 * v], world[3 * v + 1], world[3 * v + 2]];
      let hits = 0;
      for (const [a, b] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const d = n.map((x, k) => x + TILT * (a * u[k] + b * w[k]));
        const dl = Math.hypot(...d);
        if (firstSurface(grid, p, d.map(x => x / dl)) === own) hits++;
      }
      facing[v] = hits >= MIN_HITS ? 1 : 0;
    }
    out.set(mesh, facing);
  }
  return out;
}

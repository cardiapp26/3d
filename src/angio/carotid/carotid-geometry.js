// Sample authored cubic centre-lines into smoothly tapered vessel silhouettes.
// Coordinates are illustrative, not calibrated patient measurements.
export function sampleVessel(d) {
  const tokens = d.match(/[MLCQ]|-?\d+(?:\.\d+)?/g) || [];
  const points = [];
  let cursor = [0, 0];
  let i = 0;
  const read = () => [Number(tokens[i++]), Number(tokens[i++])];
  while (i < tokens.length) {
    const command = tokens[i++];
    if (command === 'M') { cursor = read(); points.push(cursor); continue; }
    if (!['L', 'C', 'Q'].includes(command)) throw new Error(`Unsupported vessel command: ${command}`);
    const start = cursor;
    const a = read();
    const b = command === 'L' ? a : read();
    const end = command === 'C' ? read() : b;
    for (let n = 1; n <= 24; n++) {
      const t = n / 24, u = 1 - t;
      points.push(start.map((v, axis) => command === 'L'
        ? u * v + t * end[axis]
        : command === 'Q'
          ? u * u * v + 2 * u * t * a[axis] + t * t * end[axis]
          : u ** 3 * v + 3 * u * u * t * a[axis] + 3 * u * t * t * b[axis] + t ** 3 * end[axis]));
    }
    cursor = end;
  }
  return points;
}

export function vesselSilhouette(d, width, endScale = 0.86) {
  const points = sampleVessel(d);
  const edge = sign => points.map((p, i) => {
    const a = points[Math.max(0, i - 1)], b = points[Math.min(points.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy) || 1;
    const r = width / 2 * (1 - (1 - endScale) * i / Math.max(1, points.length - 1));
    return `${(p[0] - sign * dy / length * r).toFixed(2)} ${(p[1] + sign * dx / length * r).toFixed(2)}`;
  });
  return `M${edge(1).join(' L')} L${edge(-1).reverse().join(' L')} Z`;
}

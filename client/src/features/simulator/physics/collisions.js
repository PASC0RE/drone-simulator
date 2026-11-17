const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const RESTITUTION = 0.2;

/**
 * Sphere vs axis-aligned boxes. Mutates state (pos, vel).
 * Returns { impact, supported }:
 *   impact    - fastest speed (m/s) at which the sphere hit a surface this step
 *   supported - true if it rests on top of a box (e.g. a roof)
 */
export function collideSphereWithBoxes(s, boxes, radius) {
  let impact = 0;
  let supported = false;

  for (const b of boxes) {
    const cx = clamp(s.pos[0], b.minX, b.maxX);
    const cy = clamp(s.pos[1], b.minY, b.maxY);
    const cz = clamp(s.pos[2], b.minZ, b.maxZ);

    const dx = s.pos[0] - cx;
    const dy = s.pos[1] - cy;
    const dz = s.pos[2] - cz;
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 >= radius * radius) continue;

    let nx, ny, nz, penetration;
    if (d2 > 1e-12) {
      const d = Math.sqrt(d2);
      nx = dx / d; ny = dy / d; nz = dz / d;
      penetration = radius - d;
    } else {
      // centre is inside the box: push it out through the roof
      nx = 0; ny = 1; nz = 0;
      penetration = b.maxY - s.pos[1] + radius;
    }

    s.pos[0] += nx * penetration;
    s.pos[1] += ny * penetration;
    s.pos[2] += nz * penetration;

    const vn = s.vel[0] * nx + s.vel[1] * ny + s.vel[2] * nz;
    if (vn < 0) {
      impact = Math.max(impact, -vn);
      const j = (1 + RESTITUTION) * vn;
      s.vel[0] -= j * nx;
      s.vel[1] -= j * ny;
      s.vel[2] -= j * nz;
    }
    if (ny > 0.7) supported = true;
  }

  return { impact, supported };
}

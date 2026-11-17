// Building layout shared by the renderer (Obstacles.jsx) and the physics (collisions).
// Plain JS, no React, so the physics can be tested in Node.

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateBuildings(count = 45) {
  const rand = mulberry32(42);
  const list = [];
  while (list.length < count) {
    const x = (rand() - 0.5) * 160;
    const z = (rand() - 0.5) * 160;
    if (Math.hypot(x, z) < 12) continue; // keep the landing pad clear
    const w = 3 + rand() * 6;
    const d = 3 + rand() * 6;
    const h = 4 + rand() * 22;
    const shade = 0.45 + rand() * 0.25;
    list.push({ x, z, w, d, h, color: `hsl(215, 8%, ${Math.round(shade * 100)}%)` });
  }
  return list;
}

export const BUILDINGS = generateBuildings();

export const BUILDING_BOXES = BUILDINGS.map((b) => ({
  minX: b.x - b.w / 2, maxX: b.x + b.w / 2,
  minY: 0,             maxY: b.h,
  minZ: b.z - b.d / 2, maxZ: b.z + b.d / 2,
}));

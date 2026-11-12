import { useMemo } from 'react';

// small deterministic random generator, so the city looks the same every reload
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function Obstacles({ count = 45 }) {
  const buildings = useMemo(() => {
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
  }, [count]);

  return (
    <group>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.color} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

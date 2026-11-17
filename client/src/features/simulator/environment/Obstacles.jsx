import { BUILDINGS } from './layout.js';

export default function Obstacles() {
  return (
    <group>
      {BUILDINGS.map((b, i) => (
        <mesh
          key={i}
          position={[b.x, b.h / 2, b.z]}
          castShadow
          receiveShadow
          onClick={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
        >
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.color} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

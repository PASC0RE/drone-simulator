import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const ARM = 0.45;
const ROTORS = [
  [ARM, 0.08, ARM],
  [-ARM, 0.08, ARM],
  [ARM, 0.08, -ARM],
  [-ARM, 0.08, -ARM],
];

// Built-in placeholder quadcopter (no asset files needed). Nose = -Z (red marker).
export default function FallbackDrone() {
  const rotors = useRef([]);

  useFrame((_, delta) => {
    rotors.current.forEach((r, i) => {
      if (r) r.rotation.y += delta * 40 * (i % 2 === 0 ? 1 : -1);
    });
  });

  return (
    <group>
      {/* body */}
      <mesh castShadow>
        <boxGeometry args={[0.45, 0.14, 0.45]} />
        <meshStandardMaterial color="#2b2f36" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* front marker */}
      <mesh position={[0, 0.02, -0.26]} castShadow>
        <boxGeometry args={[0.16, 0.08, 0.08]} />
        <meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={0.6} />
      </mesh>

      {/* arms */}
      <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[1.35, 0.05, 0.07]} />
        <meshStandardMaterial color="#444b55" />
      </mesh>
      <mesh rotation={[0, -Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[1.35, 0.05, 0.07]} />
        <meshStandardMaterial color="#444b55" />
      </mesh>

      {/* rotors */}
      {ROTORS.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.1, 12]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh ref={(el) => (rotors.current[i] = el)} position={[0, 0.07, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.01, 24]} />
            <meshStandardMaterial color="#9aa7b4" transparent opacity={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

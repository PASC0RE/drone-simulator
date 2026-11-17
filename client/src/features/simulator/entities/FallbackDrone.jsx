import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { visualOf } from '../../catalog/lib/droneInfo.js';

// Built-in placeholder drone (no asset files needed). Nose = -Z (red marker).
// Its shape comes from the drone's specs, so each drone looks different even
// before real .gltf models exist. Heights stay fixed so it always rests on the ground.
// rotorSpeedRef (rad/s) is written by the flight physics: faster rotors = more thrust.
export default function FallbackDrone({ rotorSpeedRef, drone }) {
  const rotors = useRef([]);
  const look = useMemo(() => visualOf(drone ?? { name: '', weight: 1.4, maxSpeed: 68, batteryLife: 38, type: 'CIVILIAN' }), [drone]);
  const { arm, rotorR, body, color } = look;

  const rotorPositions = useMemo(() => {
    const n = look.rotors;
    if (n === 4) {
      const a = arm * 0.7;
      return [[a, a], [-a, a], [a, -a], [-a, -a]];
    }
    return Array.from({ length: n }, (_, i) => {
      const t = (i / n) * Math.PI * 2 + Math.PI / n;
      return [Math.cos(t) * arm, Math.sin(t) * arm];
    });
  }, [look.rotors, arm]);

  useFrame((_, delta) => {
    const speed = rotorSpeedRef ? rotorSpeedRef.current : 30;
    rotors.current.forEach((r, i) => {
      if (r) r.rotation.y += delta * speed * 0.8 * (i % 2 === 0 ? 1 : -1);
    });
  });

  const dark = '#2b2f36';
  const frame = '#444b55';

  if (look.rotors === 0) {
    // fixed-wing silhouette: fuselage, wing, twin tail, pusher propeller
    return (
      <group>
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.2, 1.7]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.02, -0.9]} castShadow>
          <boxGeometry args={[0.12, 0.1, 0.12]} />
          <meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0.05, -0.1]} castShadow>
          <boxGeometry args={[3.0, 0.04, 0.5]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0.35, 0.18, 0.75]} castShadow>
          <boxGeometry args={[0.04, 0.3, 0.3]} />
          <meshStandardMaterial color={frame} />
        </mesh>
        <mesh position={[-0.35, 0.18, 0.75]} castShadow>
          <boxGeometry args={[0.04, 0.3, 0.3]} />
          <meshStandardMaterial color={frame} />
        </mesh>
        <mesh position={[0, 0.18, 0.8]} castShadow>
          <boxGeometry args={[0.8, 0.03, 0.22]} />
          <meshStandardMaterial color={frame} />
        </mesh>
        <mesh ref={(el) => (rotors.current[0] = el)} position={[0, 0.02, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.01, 24]} />
          <meshStandardMaterial color="#9aa7b4" transparent opacity={0.5} />
        </mesh>
        <mesh position={[0.2, -0.1, 0]} castShadow>
          <boxGeometry args={[0.04, 0.04, 0.9]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[-0.2, -0.1, 0]} castShadow>
          <boxGeometry args={[0.04, 0.04, 0.9]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
    );
  }

  const armLen = arm * 2 * 1.02;

  return (
    <group>
      {/* central body */}
      <mesh castShadow>
        <boxGeometry args={[body, 0.14, body]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
      </mesh>

      {/* nose marker */}
      <mesh position={[0, 0.02, -(body / 2 + 0.04)]} castShadow>
        <boxGeometry args={[Math.min(0.16, body * 0.5), 0.08, 0.08]} />
        <meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={0.6} />
      </mesh>

      {/* arms: one bar from the centre to every rotor */}
      {rotorPositions.map(([x, z], i) => {
        const len = Math.hypot(x, z);
        return (
          <mesh key={`arm${i}`} position={[x / 2, 0, z / 2]} rotation={[0, Math.atan2(-z, x), 0]} castShadow>
            <boxGeometry args={[len, 0.05, 0.07]} />
            <meshStandardMaterial color={frame} />
          </mesh>
        );
      })}

      {rotorPositions.map(([x, z], i) => (
        <group key={i} position={[x, 0.08, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.1, 12]} />
            <meshStandardMaterial color={dark} />
          </mesh>
          <mesh ref={(el) => (rotors.current[i] = el)} position={[0, 0.07, 0]} castShadow>
            <cylinderGeometry args={[rotorR, rotorR, 0.01, 24]} />
            <meshStandardMaterial color="#9aa7b4" transparent opacity={0.55} />
          </mesh>
        </group>
      ))}

      {/* skids, so the drone visibly rests on the ground */}
      <mesh position={[Math.min(0.3, armLen * 0.25), -0.1, 0]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.6]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[-Math.min(0.3, armLen * 0.25), -0.1, 0]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.6]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

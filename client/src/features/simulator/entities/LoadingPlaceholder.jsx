import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// Shown inside the 3D scene while the .gltf is downloading
export default function LoadingPlaceholder() {
  const ref = useRef();

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 1.5;
      ref.current.rotation.x += delta * 0.7;
    }
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshBasicMaterial color="#4fc3f7" wireframe />
    </mesh>
  );
}

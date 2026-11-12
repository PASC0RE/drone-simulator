import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const TARGET_SIZE = 1.6; // longest side of the drone in world units (~metres)

/**
 * Loads a .gltf / .glb file.
 * useGLTF uses three's GLTFLoader internally and suspends while downloading,
 * so the parent <Suspense> shows a loader and the parent error boundary
 * catches failures.
 *
 * Assumption: the model's nose points to -Z (three.js "forward").
 * If your model faces another way, change `rotationY`.
 */
export default function DroneModel({ url, onReady, rotationY = 0 }) {
  const gltf = useGLTF(url);

  const { object, scale, offset } = useMemo(() => {
    const clone = gltf.scene.clone(true);

    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Normalise size and centre the model so every drone behaves the same
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxSide = Math.max(size.x, size.y, size.z) || 1;
    const s = TARGET_SIZE / maxSide;

    return { object: clone, scale: s, offset: center.multiplyScalar(-s) };
  }, [gltf]);

  useEffect(() => {
    onReady?.();
  }, [onReady, object]);

  return (
    <group rotation={[0, rotationY, 0]}>
      <primitive object={object} scale={scale} position={offset} />
    </group>
  );
}

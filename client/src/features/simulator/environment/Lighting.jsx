import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SUN_POSITION } from './constants.js';

const pos = new THREE.Vector3();

export default function Lighting({ targetRef }) {
  const light = useRef();
  const { scene } = useThree();

  // the light's target must live in the scene to be updated
  useEffect(() => {
    const l = light.current;
    scene.add(l.target);
    return () => scene.remove(l.target);
  }, [scene]);

  // move the sun with the drone so the shadow map always covers the area around it
  useFrame(() => {
    const l = light.current;
    if (!l || !targetRef?.current) return;
    targetRef.current.getWorldPosition(pos);
    l.target.position.set(pos.x, 0, pos.z);
    l.position.set(pos.x + SUN_POSITION[0], SUN_POSITION[1], pos.z + SUN_POSITION[2]);
    l.target.updateMatrixWorld();
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#bcd6ff', '#4a5d3a', 0.5]} />

      <directionalLight
        ref={light}
        position={SUN_POSITION}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={250}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-bias={-0.0005}
      />
    </>
  );
}

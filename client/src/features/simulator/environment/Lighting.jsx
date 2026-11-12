import { SUN_POSITION } from './constants.js';

export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#bcd6ff', '#4a5d3a', 0.5]} />

      {/* sun: casts the shadows */}
      <directionalLight
        position={SUN_POSITION}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={250}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0005}
      />
    </>
  );
}

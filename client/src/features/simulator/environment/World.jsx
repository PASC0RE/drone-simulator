import { Sky } from '@react-three/drei';
import Lighting from './Lighting.jsx';
import Ground from './Ground.jsx';
import Obstacles from './Obstacles.jsx';
import { SUN_POSITION } from './constants.js';



export default function World() {
  return (
    <>
      {/* procedural skybox (no image files needed) */}
      <Sky distance={450000} sunPosition={SUN_POSITION} turbidity={6} rayleigh={1.5} />
      <fog attach="fog" args={['#c3d9ea', 80, 600]} />

      <Lighting />
      <Ground />
      <Obstacles />
    </>
  );
}

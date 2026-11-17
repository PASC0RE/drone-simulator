import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Grid, Sky } from '@react-three/drei';
import * as THREE from 'three';
import Lighting from '../simulator/environment/Lighting.jsx';
import { mulberry32 } from './course.js';
import { useChallengeStore } from './challengeStore.js';

const DAY_FOG = new THREE.Color('#bcd7ea');
const DUSK_FOG = new THREE.Color('#e8975f');

// The sun sinks while the daylight timer runs out: that is the "race".
function SunController() {
  const { scene } = useThree();
  const [fraction, setFraction] = useState(1);
  const timer = useRef(0);

  useFrame((_, delta) => {
    timer.current += delta;
    if (timer.current < 0.25) return; // 4 updates a second is plenty for a slow sunset
    timer.current = 0;
    const run = useChallengeStore.getState().run;
    const f = run ? Math.max(0, Math.min(1, run.daylight / run.daylightMax)) : 1;
    setFraction((old) => (Math.abs(old - f) > 0.004 ? f : old));
    if (scene.fog) scene.fog.color.lerpColors(DUSK_FOG, DAY_FOG, f);
  });

  const elevation = THREE.MathUtils.degToRad(3 + 42 * fraction);
  const sun = [Math.cos(elevation) * 30, Math.sin(elevation) * 100, -Math.cos(elevation) * 100];
  return <Sky distance={450000} sunPosition={sun} turbidity={fraction < 0.35 ? 12 : 6} rayleigh={fraction < 0.35 ? 3 : 1.5} />;
}

function Mountains({ seed, length }) {
  const items = useMemo(() => {
    const rand = mulberry32(seed * 31 + 5);
    const list = [];
    for (let i = 0; i < 70; i += 1) {
      const side = rand() < 0.5 ? -1 : 1;
      const h = 25 + rand() * 60;
      const r = h * (0.5 + rand() * 0.4);
      list.push({
        // the whole base stays at least 45 m away from the flight path (x = -26..26)
        x: side * (r + 45 + rand() * 200),
        z: -rand() * (length + 400) + 150,
        h,
        r,
        rot: rand() * Math.PI,
        shade: 0.32 + rand() * 0.18,
      });
    }
    return list;
  }, [seed, length]);

  return (
    <group>
      {items.map((m, i) => (
        <mesh key={i} position={[m.x, m.h / 2 - 1, m.z]} rotation={[0, m.rot, 0]}>
          <coneGeometry args={[m.r, m.h, 4]} />
          <meshStandardMaterial color={new THREE.Color().setHSL(0.07, 0.35, m.shade)} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

export default function ChallengeWorld({ course, targetRef }) {
  return (
    <>
      <SunController />
      <fog attach="fog" args={['#bcd7ea', 120, 900]} />
      <Lighting targetRef={targetRef} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -course.length / 2]}>
        <planeGeometry args={[3000, course.length + 3000]} />
        <meshStandardMaterial color="#c9ad82" roughness={1} />
      </mesh>
      <Grid
        position={[0, 0.02, 0]}
        args={[2000, 2000]}
        cellSize={5}
        cellThickness={0.6}
        cellColor="#b09468"
        sectionSize={25}
        sectionThickness={1.2}
        sectionColor="#8f7650"
        fadeDistance={260}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* start pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[3, 48]} />
        <meshStandardMaterial color="#e8ecef" />
      </mesh>

      <Mountains seed={course.seed} length={course.length} />
    </>
  );
}

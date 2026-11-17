import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import World from '../features/simulator/environment/World.jsx';
import FallbackDrone from '../features/simulator/entities/FallbackDrone.jsx';

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// The selected drone circles above the city. Camera stays still and tracks it.
function Flyer({ drone, radius, scale, camZ }) {
  const group = useRef();
  const [rotors] = useState(() => ({ current: 70 }));
  const slow = useRef(reducedMotion());

  useFrame(({ clock, camera }) => {
    const g = group.current;
    if (!g) return;
    const a = clock.elapsedTime * (slow.current ? 0.05 : 0.32);
    g.position.set(Math.cos(a) * radius, 3.6 + Math.sin(a * 2) * 0.4, -Math.sin(a) * radius);
    g.rotation.order = 'YXZ';
    g.rotation.set(-0.08, a, 0.22);
    camera.position.set(1.5, 2.6, camZ);
    camera.lookAt(0, 3.4, 0);
  });

  return (
    <group ref={group} scale={scale}>
      <FallbackDrone rotorSpeedRef={rotors} drone={drone} />
    </group>
  );
}

// Rendering a big WebGL canvas every frame is what makes a page stutter while scrolling.
// So: draw nothing while the canvas is off screen, and cap the resolution on large screens.
function useVisible(ref) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return visible;
}

function pixelRatio(close) {
  if (typeof window === 'undefined') return 1;
  const budget = close ? 1000 : 1500; // pixels across: more than this is wasted on a background scene
  return Math.min(1.5, Math.max(0.5, budget / window.innerWidth) * (window.devicePixelRatio > 1 ? 1.25 : 1));
}

// `close` = tighter shot, used for the preview on the detail page
export default function HeroScene({ drone, close = false }) {
  const box = useRef(null);
  const visible = useVisible(box);
  const [dpr] = useState(() => pixelRatio(close));

  return (
    <div ref={box} className="scene-box">
      <Canvas
        dpr={dpr}
        frameloop={visible ? 'always' : 'never'}
        gl={{ powerPreference: 'high-performance', antialias: true }}
        camera={{ fov: 50, near: 0.1, far: 2000, position: [1.5, 2.6, close ? 9 : 13] }}
      >
        <World />
        <Flyer drone={drone} radius={close ? 3.4 : 6.5} scale={close ? 2.2 : 2.3} camZ={close ? 9 : 13} />
      </Canvas>
    </div>
  );
}

import { memo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useSimulatorStore } from '../simulator/store/simulatorStore.js';
import { useChallengeStore } from './challengeStore.js';
import { createRun, stepRun, ORB_PICKUP } from './course.js';
import { useT } from '../../i18n/index.js';

const COLORS = {
  pending: '#3fa7d6',
  next: '#ff8a1f',
  passed: '#3ddc84',
  perfect: '#ffd84a',
  missed: '#e5484d',
};

const forward = new THREE.Vector3();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function snapshot(run, extra) {
  return { ...run, gateState: [...run.gateState], orbTaken: [...run.orbTaken], ...extra };
}

/** Runs the game rules every frame and publishes a snapshot (10x per second) for the HUD. */
function Controller({ course, droneRef }) {
  const run = useRef(createRun(course));
  const prev = useRef(null);
  const lastReset = useRef(useSimulatorStore.getState().resetCount);
  const lastEvent = useRef(0);
  const lastStatus = useRef('ready');
  const timer = useRef(0);

  useEffect(() => {
    run.current = createRun(course);
    prev.current = null;
    useChallengeStore.getState().setRun(snapshot(run.current, { arrow: 0, distance: 0, altDelta: 0 }));
  }, [course]);

  useFrame((_, delta) => {
    const g = droneRef.current;
    if (!g) return;
    const sim = useSimulatorStore.getState();

    if (sim.resetCount !== lastReset.current) {
      lastReset.current = sim.resetCount;
      run.current = createRun(course);
      prev.current = null;
      lastEvent.current = 0;
      lastStatus.current = 'ready';
    }

    const pos = [g.position.x, g.position.y, g.position.z];
    if (!prev.current) prev.current = [...pos];
    const dt = Math.min(Math.max(delta, 1 / 240), 0.1);

    const tel = sim.telemetry;
    stepRun(run.current, course, pos, prev.current, dt, {
      crashed: tel.status === 'CRASHED',
      batteryEmpty: !tel.motorsOn && tel.status !== 'CRASHED',
    });
    prev.current = pos;

    timer.current += dt;
    const r = run.current;
    if (timer.current >= 0.1 || r.eventCount !== lastEvent.current || r.status !== lastStatus.current) {
      timer.current = 0;
      lastEvent.current = r.eventCount;
      lastStatus.current = r.status;

      // arrow towards the next gate, relative to where the drone is pointing
      const target = course.gates[Math.min(r.nextGate, course.gates.length - 1)];
      forward.set(0, 0, -1).applyQuaternion(g.quaternion);
      const yaw = Math.atan2(-forward.x, -forward.z);
      const toTarget = Math.atan2(-(target.x - pos[0]), -(target.z - pos[2]));
      useChallengeStore.getState().setRun(
        snapshot(r, {
          arrow: wrap(toTarget - yaw),
          distance: Math.hypot(target.x - pos[0], target.z - pos[2]),
          altDelta: target.y - pos[1],
        })
      );
    }
  });

  return null;
}

function Gate({ gate, state, isNext, isLast }) {
  const t = useT();
  const color = isNext ? COLORS.next : COLORS[state];
  return (
    <group position={[gate.x, gate.y, gate.z]}>
      <mesh>
        <torusGeometry args={[gate.r, isNext ? 0.28 : 0.2, 12, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isNext ? 1.1 : 0.55} />
      </mesh>
      {isLast && (
        <Html position={[0, gate.r + 2.2, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div className="gate-flag">{t('ch.finish')}</div>
        </Html>
      )}
    </group>
  );
}

const Posts = memo(function Posts({ course }) {
  return course.posts.map((p, i) => (
    <mesh key={`post${i}`} position={[p.x, p.h / 2, p.z]} castShadow>
      <boxGeometry args={[p.w, p.h, p.d]} />
      <meshStandardMaterial color="#e9eef2" roughness={0.7} />
    </mesh>
  ));
});

const Pylons = memo(function Pylons({ course }) {
  return course.pylons.map((p, i) => (
    <group key={`py${i}`} position={[p.x, 0, p.z]}>
      <mesh position={[0, p.h / 2, 0]} castShadow>
        <boxGeometry args={[p.w, p.h, p.d]} />
        <meshStandardMaterial color="#4a5568" roughness={0.8} />
      </mesh>
      {/* warning stripe and light, so they are easy to see against the sky */}
      <mesh position={[0, p.h - 1.2, 0]}>
        <boxGeometry args={[p.w + 0.06, 1.2, p.d + 0.06]} />
        <meshStandardMaterial color="#ff8a1f" emissive="#ff8a1f" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, p.h + 0.3, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={1.2} />
      </mesh>
    </group>
  ));
});

function Orbs({ course }) {
  const taken = useChallengeStore((s) => s.run?.orbTaken);
  return course.orbs.map((o, i) =>
    taken?.[i] ? null : (
      <mesh key={`orb${i}`} position={[o.x, o.y, o.z]}>
        <sphereGeometry args={[ORB_PICKUP * 0.33, 16, 16]} />
        <meshStandardMaterial color="#ffd84a" emissive="#ffb800" emissiveIntensity={1.4} transparent opacity={0.92} />
      </mesh>
    )
  );
}

export default function ChallengeLayer({ course, droneRef }) {
  const run = useChallengeStore((s) => s.run);
  const states = run?.gateState;
  const next = run?.nextGate ?? 0;

  return (
    <>
      <Controller course={course} droneRef={droneRef} />
      {course.gates.map((g, i) => (
        <Gate
          key={g.id}
          gate={g}
          state={states?.[i] ?? 'pending'}
          isNext={i === next && run?.status !== 'finished'}
          isLast={i === course.gates.length - 1}
        />
      ))}
      <Posts course={course} />
      <Pylons course={course} />
      <Orbs course={course} />
    </>
  );
}

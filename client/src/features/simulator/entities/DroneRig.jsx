import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Demo flight path (figure-8) so the chase camera has something to follow.
// In the next phase this is replaced by keyboard input + physics.
const RADIUS = 25;
const OMEGA = 0.4; // path speed (rad/s)
const BASE_HEIGHT = 6;

const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const damp = (k, dt) => 1 - Math.exp(-k * dt);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export default function DroneRig({ groupRef, autopilot, children }) {
  const s = useRef({ pathTime: 0, clock: 0, yaw: 0, pitch: 0, roll: 0, started: false });

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // never let dt reach 0 (first frame can have delta = 0 -> division by zero -> NaN)
    const dt = Math.min(Math.max(delta, 1 / 240), 0.05);
    const st = s.current;

    st.clock += dt;
    if (autopilot) st.pathTime += dt;

    const a = st.pathTime * OMEGA;

    // position on a figure-8
    const x = RADIUS * Math.sin(a);
    const z = (RADIUS / 2) * Math.sin(2 * a);
    const y = BASE_HEIGHT + 1.5 * Math.sin(2 * a) + Math.sin(st.clock * 3) * 0.08;

    // velocity -> heading (nose points to -Z when yaw = 0)
    const vx = RADIUS * Math.cos(a) * OMEGA;
    const vz = RADIUS * Math.cos(2 * a) * OMEGA;

    let yawRate = 0;
    if (autopilot) {
      const targetYaw = Math.atan2(-vx, -vz);
      if (!st.started) {
        st.yaw = targetYaw;
        st.started = true;
      }
      let diff = targetYaw - st.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // wrap to [-PI, PI]
      const k = damp(6, dt);
      st.yaw += diff * k;
      yawRate = diff * 6; // same as (diff * k) / dt, without dividing
    }

    // lean forward when moving, bank into turns
    const targetPitch = autopilot ? -0.2 : 0;
    const targetRoll = autopilot ? clamp(yawRate * 0.25, -0.5, 0.5) : 0;
    st.pitch += (targetPitch - st.pitch) * damp(4, dt);
    st.roll += (targetRoll - st.roll) * damp(4, dt);

    // safety net: if anything ever becomes NaN, skip the frame instead of breaking the scene
    if (![x, y, z, st.pitch, st.yaw, st.roll].every(Number.isFinite)) {
      st.yaw = st.pitch = st.roll = 0;
      return;
    }

    group.position.set(x, y, z);
    euler.set(st.pitch, st.yaw, st.roll, 'YXZ');
    group.quaternion.setFromEuler(euler);
  });

  return <group ref={groupRef}>{children}</group>;
}

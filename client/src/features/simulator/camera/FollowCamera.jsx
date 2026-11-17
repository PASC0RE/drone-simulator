import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulatorStore } from '../store/simulatorStore.js';

const UP = new THREE.Vector3(0, 1, 0);
const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const desired = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const forward = new THREE.Vector3();

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Third-person camera with full 360° orbit.
 *  - drag the mouse: orbit around the drone (any angle, also from the front / sides)
 *  - wheel: zoom
 *  - chase mode (default): after you let go the camera glides back behind the drone
 *  - orbit mode (press C): the camera keeps the angle you chose and does NOT turn with the drone
 *
 * The drone's yaw is used (not pitch/roll) so the horizon never tilts.
 */
export default function FollowCamera({
  targetRef,
  distance = 7.5,
  elevation = 0.3, // radians above the horizon
  positionLag = 4,
  lookLag = 6,
  minHeight = 0.8,
}) {
  const { gl } = useThree();
  const view = useRef({ az: 0, el: elevation, dist: distance, dragging: false, idle: 0 });
  const smoothLook = useRef(new THREE.Vector3());
  const initialised = useRef(false);
  const lastYaw = useRef(0);

  // ----- mouse input -----
  useEffect(() => {
    const el = gl.domElement;
    const v = view.current;
    let lastX = 0, lastY = 0;

    const down = (e) => {
      v.dragging = true; lastX = e.clientX; lastY = e.clientY;
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (!v.dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      v.az = wrap(v.az - dx * 0.006);            // unlimited: full 360 degrees
      v.el = clamp(v.el + dy * 0.005, -0.2, 1.4); // from just below horizon to almost top-down
      v.idle = 0;
    };
    const up = (e) => { v.dragging = false; el.releasePointerCapture?.(e.pointerId); };
    const wheel = (e) => {
      e.preventDefault();
      v.dist = clamp(v.dist * (1 + Math.sign(e.deltaY) * 0.1), 2.5, 30);
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    el.style.cursor = 'grab';
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [gl]);

  // ----- per-frame follow -----
  useFrame(({ camera }, delta) => {
    const target = targetRef.current;
    if (!target) return;

    const dt = Math.min(Math.max(delta, 1 / 240), 0.1);
    const v = view.current;
    const mode = useSimulatorStore.getState().cameraMode;

    target.getWorldPosition(pos);
    target.getWorldQuaternion(quat);
    euler.setFromQuaternion(quat, 'YXZ');
    const yaw = euler.y;

    // chase mode: when the user is not dragging, drift back behind the drone
    if (mode === 'chase') {
      v.idle += dt;
      if (!v.dragging && v.idle > 1.2) v.az += wrap(0 - v.az) * (1 - Math.exp(-2 * dt));
      if (!v.dragging && v.idle > 1.2) v.el += (elevation - v.el) * (1 - Math.exp(-2 * dt));
    }

    // chase: angle follows the drone's yaw. orbit: fixed in the world, so we cancel yaw changes.
    let angle;
    if (mode === 'chase') {
      angle = yaw + v.az;
    } else {
      v.az = wrap(v.az - wrap(yaw - lastYaw.current)); // keep world angle constant
      angle = yaw + v.az;
    }
    lastYaw.current = yaw;

    const cosE = Math.cos(v.el);
    desired.set(Math.sin(angle) * cosE * v.dist, Math.sin(v.el) * v.dist, Math.cos(angle) * cosE * v.dist).add(pos);
    desired.y = Math.max(desired.y, minHeight);

    if (mode === 'chase') {
      // look a little ahead of the drone
      forward.set(0, 0.3, -5).applyAxisAngle(UP, yaw);
      lookTarget.copy(pos).add(forward);
    } else {
      lookTarget.copy(pos);
    }

    // never feed NaN into the camera (it would never recover)
    if (!Number.isFinite(desired.x + desired.y + desired.z + lookTarget.x + lookTarget.y + lookTarget.z)) return;

    if (!initialised.current) {
      camera.position.copy(desired);
      smoothLook.current.copy(lookTarget);
      initialised.current = true;
    }

    camera.position.lerp(desired, 1 - Math.exp(-positionLag * dt));
    smoothLook.current.lerp(lookTarget, 1 - Math.exp(-lookLag * dt));
    camera.lookAt(smoothLook.current);
  });

  return null;
}

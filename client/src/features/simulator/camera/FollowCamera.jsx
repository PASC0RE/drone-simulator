import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
const yawQuat = new THREE.Quaternion();
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const desired = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

/**
 * Third-person chase camera.
 *  - sits `offset` behind/above the drone, rotated by the drone's YAW only
 *    (so the horizon doesn't tilt when the drone banks or pitches)
 *  - frame-rate independent smoothing (exponential damping)
 *  - looks slightly ahead of the drone
 */
export default function FollowCamera({
  targetRef,
  offset = [0, 2.5, 7],
  lookAhead = [0, 0.3, -5],
  positionLag = 3.5, // higher = camera sticks tighter
  lookLag = 6,
  minHeight = 0.8,
}) {
  const smoothLook = useRef(new THREE.Vector3());
  const initialised = useRef(false);

  useFrame(({ camera }, delta) => {
    const target = targetRef.current;
    if (!target) return;

    const dt = Math.min(Math.max(delta, 1 / 240), 0.1);

    target.getWorldPosition(pos);
    target.getWorldQuaternion(quat);

    // keep only the heading (yaw) of the drone
    euler.setFromQuaternion(quat, 'YXZ');
    yawQuat.setFromAxisAngle(UP, euler.y);

    desired.set(offset[0], offset[1], offset[2]).applyQuaternion(yawQuat).add(pos);
    desired.y = Math.max(desired.y, minHeight); // never go under the ground

    lookTarget.set(lookAhead[0], lookAhead[1], lookAhead[2]).applyQuaternion(yawQuat).add(pos);

    // safety net: never feed NaN into the camera (it would never recover)
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

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useDroneControls } from '../controls/useDroneControls.js';
import { axesFromKeys } from '../controls/keymap.js';
import { createFlightState, resetFlightState, stepFlight, getTelemetry } from '../physics/flightModel.js';
import { STEP } from '../physics/constants.js';
import { useSimulatorStore } from '../store/simulatorStore.js';

const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const TELEMETRY_INTERVAL = 0.05; // s  (20 Hz)

/**
 * Connects keyboard -> flightModel -> Three.js group.
 * The group's position/rotation are set from the simulated state every frame.
 */
export default function DroneRig({ groupRef, params, colliders, rotorSpeedRef, children }) {
  const keys = useDroneControls();
  const flight = useRef(createFlightState());
  const stick = useRef({ forward: 0, right: 0, throttle: 0, yawRight: 0 }); // smoothed input
  const accumulator = useRef(0);
  const telemetryTimer = useRef(0);
  const lastReset = useRef(useSimulatorStore.getState().resetCount);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const store = useSimulatorStore.getState();
    const state = flight.current;

    if (store.resetCount !== lastReset.current) {
      lastReset.current = store.resetCount;
      resetFlightState(state);
      Object.keys(stick.current).forEach((k) => (stick.current[k] = 0));
    }

    const dt = Math.min(Math.max(delta, 1 / 240), 0.1);

    // keys are on/off: ramp them like a soft joystick (~0.12 s)
    const raw = axesFromKeys(keys.current);
    const ramp = 1 - Math.exp(-8 * dt);
    for (const axis of Object.keys(stick.current)) {
      stick.current[axis] += (raw[axis] - stick.current[axis]) * ramp;
    }

    // fixed-step physics => the same behaviour at 30, 60 or 144 FPS
    accumulator.current += dt;
    const input = { ...stick.current, assist: store.assist };
    while (accumulator.current >= STEP) {
      stepFlight(state, input, params, STEP, colliders);
      accumulator.current -= STEP;
    }

    // never let a NaN reach the scene
    const finite = [...state.pos, state.pitch, state.roll, state.yaw].every(Number.isFinite);
    if (!finite) {
      resetFlightState(state);
      return;
    }

    group.position.set(state.pos[0], state.pos[1], state.pos[2]);
    euler.set(state.pitch, state.yaw, state.roll, 'YXZ');
    group.quaternion.setFromEuler(euler);

    // rotor animation speed (rad/s)
    if (rotorSpeedRef) {
      const load = Math.sqrt(Math.max(state.thrust / params.hoverThrust, 0));
      rotorSpeedRef.current = state.motorsOn ? 10 + 45 * load : 0;
    }

    telemetryTimer.current += dt;
    if (telemetryTimer.current >= TELEMETRY_INTERVAL) {
      telemetryTimer.current = 0;
      store.setTelemetry(getTelemetry(state, params));
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

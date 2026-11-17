import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useDroneControls } from '../controls/useDroneControls.js';
import { axesFromKeys } from '../controls/keymap.js';
import { createFlightState, resetFlightState, stepFlight, getTelemetry } from '../physics/flightModel.js';
import { createMission, stepMission } from '../physics/autopilot.js';
import { STEP } from '../physics/constants.js';
import { useSimulatorStore } from '../store/simulatorStore.js';

const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const TELEMETRY_INTERVAL = 0.05; // s  (20 Hz)

/**
 * Connects keyboard / autopilot -> flightModel -> Three.js group.
 * The group's position/rotation are set from the simulated state every frame.
 *
 * Who is flying?
 *   mission running or paused -> the autopilot produces the stick commands
 *   otherwise                 -> the keyboard does
 */
export default function DroneRig({ groupRef, params, colliders, rotorSpeedRef, children }) {
  const keys = useDroneControls();
  const flight = useRef(createFlightState());
  const stick = useRef({ forward: 0, right: 0, throttle: 0, yawRight: 0 }); // smoothed input
  const mission = useRef(null);
  const accumulator = useRef(0);
  const telemetryTimer = useRef(0);
  const lastReset = useRef(useSimulatorStore.getState().resetCount);
  const lastNonce = useRef(useSimulatorStore.getState().missionNonce);
  const lastProgress = useRef(null);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    let store = useSimulatorStore.getState();
    const state = flight.current;

    if (store.resetCount !== lastReset.current) {
      lastReset.current = store.resetCount;
      resetFlightState(state);
      mission.current = null;
      Object.keys(stick.current).forEach((k) => (stick.current[k] = 0));
    }

    // a new mission was started: plan it from where the drone is right now
    if (store.missionNonce !== lastNonce.current) {
      lastNonce.current = store.missionNonce;
      if (state.crashed) {
        mission.current = null;
        store.setMission('aborted', 'The drone has crashed. Press R to reset it first.');
      } else {
        mission.current = createMission(state.pos, store.waypoints, params);
      }
      store = useSimulatorStore.getState();
    }

    const dt = Math.min(Math.max(delta, 1 / 240), 0.1);

    const flying = store.autopilot && (store.missionStatus === 'running' || store.missionStatus === 'paused');
    let auto = null;
    if (flying && mission.current) {
      if (state.crashed) {
        mission.current = null;
        store.setMission('aborted', 'The drone crashed during the mission.');
      } else {
        auto = stepMission(mission.current, state, params, { hold: store.missionStatus === 'paused' });
        if (auto.done && store.missionStatus === 'running') store.setMission('complete');
      }
    }

    let input;
    if (auto) {
      // the autopilot commands are already smooth: use them directly
      Object.assign(stick.current, auto.input);
      input = { ...stick.current, assist: true };
    } else {
      // keys are on/off: ramp them like a soft joystick (~0.12 s)
      const raw = axesFromKeys(keys.current, store.controlScheme);
      const ramp = 1 - Math.exp(-8 * dt);
      for (const axis of Object.keys(stick.current)) {
        stick.current[axis] += (raw[axis] - stick.current[axis]) * ramp;
      }
      input = { ...stick.current, assist: store.assist };
    }
    lastProgress.current = auto ? auto.progress : null;

    // fixed-step physics => the same behaviour at 30, 60 or 144 FPS
    accumulator.current += dt;
    while (accumulator.current >= STEP) {
      stepFlight(state, input, params, STEP, colliders);
      accumulator.current -= STEP;
    }

    // never let a NaN reach the scene
    const finite = [...state.pos, state.pitch, state.roll, state.yaw].every(Number.isFinite);
    if (!finite) {
      resetFlightState(state);
      mission.current = null;
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
      if (lastProgress.current) store.setMissionProgress(lastProgress.current);
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

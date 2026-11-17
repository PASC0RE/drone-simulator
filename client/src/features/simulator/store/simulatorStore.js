import { create } from 'zustand';

const INITIAL_TELEMETRY = {
  speed: 0,
  verticalSpeed: 0,
  altitude: 0,
  heading: 0,
  pitchDeg: 0,
  rollDeg: 0,
  battery: 100,
  thrustPct: 0,
  status: 'LANDED',
  crashReason: '',
  motorsOn: true,
};

// Telemetry lives here (not in React state of the 3D scene) so the HUD can update
// ~20 times per second without re-rendering the Three.js scene.
export const useSimulatorStore = create((set) => ({
  telemetry: INITIAL_TELEMETRY,
  assist: true,       // true = altitude hold, false = manual throttle
  resetCount: 0,
  cameraMode: 'chase', // 'chase' = recentres behind the drone, 'orbit' = stays where you put it

  setTelemetry: (telemetry) => set({ telemetry }),
  toggleAssist: () => set((s) => ({ assist: !s.assist })),
  toggleCameraMode: () => set((s) => ({ cameraMode: s.cameraMode === 'chase' ? 'orbit' : 'chase' })),
  requestReset: () => set((s) => ({ resetCount: s.resetCount + 1 })),
}));

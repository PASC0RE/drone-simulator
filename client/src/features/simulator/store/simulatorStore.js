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

const INITIAL_PROGRESS = { nextWaypoint: 0, distance: 0, legs: 0, leg: 0, speedLimit: 0 };

// Telemetry lives here (not in React state of the 3D scene) so the HUD can update
// ~20 times per second without re-rendering the Three.js scene.
export const useSimulatorStore = create((set) => ({
  telemetry: INITIAL_TELEMETRY,
  assist: true,       // true = altitude hold, false = manual throttle
  resetCount: 0,
  controlScheme: 'standard', // 'standard' or 'arcade' (A/D turn)
  cameraMode: 'chase', // 'chase' = recentres behind the drone, 'orbit' = stays where you put it

  // ----- autopilot / waypoint mission -----
  autopilot: false,
  waypointAltitude: 10,        // altitude [m] given to the next waypoint you place
  waypoints: [],               // { id, x, y (altitude above ground), z }
  nextWaypointId: 1,
  missionStatus: 'idle',       // idle | running | paused | complete | aborted
  missionMessage: '',
  missionNonce: 0,             // changes every time a mission is (re)started from scratch
  missionProgress: INITIAL_PROGRESS,

  setTelemetry: (telemetry) => set({ telemetry }),
  toggleAssist: () => set((s) => ({ assist: !s.assist })),
  toggleScheme: () => set((s) => ({ controlScheme: s.controlScheme === 'standard' ? 'arcade' : 'standard' })),
  toggleCameraMode: () => set((s) => ({ cameraMode: s.cameraMode === 'chase' ? 'orbit' : 'chase' })),
  requestReset: () =>
    set((s) => ({
      resetCount: s.resetCount + 1,
      missionStatus: 'idle',
      missionMessage: '',
      missionProgress: INITIAL_PROGRESS,
    })),

  toggleAutopilot: () =>
    set((s) => ({
      autopilot: !s.autopilot,
      missionStatus: 'idle', // leaving / entering the mode always stops a running mission
      missionMessage: '',
      missionProgress: INITIAL_PROGRESS,
    })),

  setWaypointAltitude: (waypointAltitude) => set({ waypointAltitude }),

  addWaypoint: (x, z) =>
    set((s) => {
      if (!s.autopilot || s.missionStatus === 'running' || s.missionStatus === 'paused') return s;
      const wp = { id: s.nextWaypointId, x, y: s.waypointAltitude, z };
      return {
        waypoints: [...s.waypoints, wp],
        nextWaypointId: s.nextWaypointId + 1,
        missionStatus: 'idle',
        missionMessage: '',
      };
    }),

  removeWaypoint: (id) =>
    set((s) =>
      s.missionStatus === 'running' || s.missionStatus === 'paused'
        ? s
        : { waypoints: s.waypoints.filter((w) => w.id !== id), missionStatus: 'idle', missionMessage: '' }
    ),

  startMission: () =>
    set((s) => {
      if (!s.autopilot || s.waypoints.length === 0 || s.missionStatus === 'running') return s;
      if (s.missionStatus === 'paused') return { missionStatus: 'running' }; // resume
      return {
        missionStatus: 'running',
        missionMessage: '',
        missionNonce: s.missionNonce + 1,
        missionProgress: { ...INITIAL_PROGRESS, legs: s.waypoints.length },
      };
    }),

  pauseMission: () => set((s) => (s.missionStatus === 'running' ? { missionStatus: 'paused' } : s)),

  resetWaypoints: () =>
    set({ waypoints: [], missionStatus: 'idle', missionMessage: '', missionProgress: INITIAL_PROGRESS }),

  setMission: (missionStatus, missionMessage = '') => set({ missionStatus, missionMessage }),
  setMissionProgress: (missionProgress) => set({ missionProgress }),
}));

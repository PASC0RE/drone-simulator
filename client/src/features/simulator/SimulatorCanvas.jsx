import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, useGLTF } from '@react-three/drei';

import World from './environment/World.jsx';
import { BUILDING_BOXES } from './environment/layout.js';
import DroneRig from './entities/DroneRig.jsx';
import DroneModel from './entities/DroneModel.jsx';
import FallbackDrone from './entities/FallbackDrone.jsx';
import LoadingPlaceholder from './entities/LoadingPlaceholder.jsx';
import ModelErrorBoundary from './entities/ModelErrorBoundary.jsx';
import FollowCamera from './camera/FollowCamera.jsx';
import StatusOverlay from './hud/StatusOverlay.jsx';
import FlightHUD from './hud/FlightHUD.jsx';
import ControlsHelp from './hud/ControlsHelp.jsx';
import MissionPanel from './hud/MissionPanel.jsx';
import WaypointLayer from './navigation/WaypointLayer.jsx';
import { mapSpecsToPhysics } from './physics/specMapper.js';
import { useSimulatorStore } from './store/simulatorStore.js';
import ChallengeWorld from '../challenge/ChallengeWorld.jsx';
import ChallengeLayer from '../challenge/ChallengeLayer.jsx';
import ChallengeHUD from '../challenge/ChallengeHUD.jsx';
import { makeCourse } from '../challenge/course.js';

export default function SimulatorCanvas({ drone, apiWarning, toolbar = null, mode = 'free' }) {
  const challenge = mode === 'challenge';
  const modelUrl = drone?.modelUrl ?? null;
  const droneName = drone?.name ?? '—';

  // database specs -> physics parameters (this is why each drone flies differently)
  const params = useMemo(() => mapSpecsToPhysics(drone), [drone]);

  const [seed, setSeed] = useState(1);
  const course = useMemo(
    () => (challenge ? makeCourse({ seed, vmax: params.maxSpeed }) : null),
    [challenge, seed, params.maxSpeed]
  );

  // no autopilot in the challenge (it would fly the course for you)
  useEffect(() => {
    useSimulatorStore.getState().setAutopilotLocked(challenge);
    return () => useSimulatorStore.getState().setAutopilotLocked(false);
  }, [challenge]);

  const droneRef = useRef(null);
  const rotorSpeedRef = useRef(0);
  const [retryKey, setRetryKey] = useState(0);
  const [model, setModel] = useState(
    modelUrl
      ? { status: 'loading', error: null }
      : { status: 'fallback', error: 'This drone has no model URL.' }
  );

  const handleReady = useCallback(() => setModel({ status: 'ready', error: null }), []);
  const handleError = useCallback(
    (error) => setModel({ status: 'fallback', error: error?.message || 'Unknown error' }),
    []
  );

  const handleRetry = () => {
    if (!modelUrl) return;
    useGLTF.clear(modelUrl);
    setModel({ status: 'loading', error: null });
    setRetryKey((k) => k + 1);
  };

  return (
    <div className={`sim ${challenge ? 'challenge' : ''}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 60, near: 0.1, far: 2000, position: [0, 8, 14] }}
      >
        {challenge ? <ChallengeWorld course={course} targetRef={droneRef} /> : <World targetRef={droneRef} />}

        {/* The rig must come BEFORE the camera so it moves first each frame */}
        <DroneRig
          groupRef={droneRef}
          params={params}
          colliders={challenge ? course.colliders : BUILDING_BOXES}
          rotorSpeedRef={rotorSpeedRef}
        >
          <ModelErrorBoundary
            key={retryKey}
            onError={handleError}
            fallback={<FallbackDrone rotorSpeedRef={rotorSpeedRef} drone={drone} />}
          >
            <Suspense fallback={<LoadingPlaceholder />}>
              {modelUrl ? (
                <DroneModel url={modelUrl} onReady={handleReady} />
              ) : (
                <FallbackDrone rotorSpeedRef={rotorSpeedRef} drone={drone} />
              )}
            </Suspense>
          </ModelErrorBoundary>
        </DroneRig>

        {challenge ? <ChallengeLayer course={course} droneRef={droneRef} /> : <WaypointLayer />}

        <FollowCamera targetRef={droneRef} />
      </Canvas>

      <Loader />

      {toolbar}

      <StatusOverlay
        droneName={droneName}
        specs={drone}
        modelStatus={model.status}
        modelError={model.error}
        apiWarning={apiWarning}
        onRetry={modelUrl ? handleRetry : null}
      />
      <ControlsHelp hideAutopilot={challenge} />
      {challenge ? (
        <ChallengeHUD
          course={course}
          seed={seed}
          onNewCourse={() => setSeed((n) => (n % 99) + 1)}
          bestKey={`${drone?.id ?? 0}:${seed}`}
        />
      ) : (
        <MissionPanel />
      )}
      <FlightHUD maxSpeedMs={params.maxSpeed} challenge={challenge} />
    </div>
  );
}

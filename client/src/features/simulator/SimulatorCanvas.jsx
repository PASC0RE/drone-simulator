import { Suspense, useCallback, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, useGLTF } from '@react-three/drei';

import World from './environment/World.jsx';
import DroneRig from './entities/DroneRig.jsx';
import DroneModel from './entities/DroneModel.jsx';
import FallbackDrone from './entities/FallbackDrone.jsx';
import LoadingPlaceholder from './entities/LoadingPlaceholder.jsx';
import ModelErrorBoundary from './entities/ModelErrorBoundary.jsx';
import FollowCamera from './camera/FollowCamera.jsx';
import StatusOverlay from './hud/StatusOverlay.jsx';

export default function SimulatorCanvas({ droneName, modelUrl, apiWarning }) {
  const droneRef = useRef(null);
  const [autopilot, setAutopilot] = useState(true);
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
    useGLTF.clear(modelUrl); // drop the cached failure so the loader really retries
    setModel({ status: 'loading', error: null });
    setRetryKey((k) => k + 1);
  };

  return (
    <div className="sim">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 60, near: 0.1, far: 2000, position: [0, 8, 14] }}
      >
        <World />

        {/* The rig must come BEFORE the camera so it moves first each frame */}
        <DroneRig groupRef={droneRef} autopilot={autopilot}>
          <ModelErrorBoundary
            key={retryKey}
            onError={handleError}
            fallback={<FallbackDrone />}
          >
            <Suspense fallback={<LoadingPlaceholder />}>
              {modelUrl ? (
                <DroneModel url={modelUrl} onReady={handleReady} />
              ) : (
                <FallbackDrone />
              )}
            </Suspense>
          </ModelErrorBoundary>
        </DroneRig>

        <FollowCamera targetRef={droneRef} />
      </Canvas>

      {/* drei's progress bar while the .gltf is downloading */}
      <Loader />

      <StatusOverlay
        droneName={droneName}
        modelStatus={model.status}
        modelError={model.error}
        apiWarning={apiWarning}
        autopilot={autopilot}
        onToggleAutopilot={() => setAutopilot((v) => !v)}
        onRetry={modelUrl ? handleRetry : null}
      />
    </div>
  );
}

import { useMemo, useRef } from 'react';
import { Html, Line } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useSimulatorStore } from '../store/simulatorStore.js';
import { BUILDING_BOXES } from '../environment/layout.js';
import { findBlockedLegs, waypointToWorld, waypointBlocked } from '../physics/autopilot.js';
import { GROUND_CLEARANCE } from '../physics/constants.js';

const COLORS = { pending: '#4fc3f7', next: '#ff9f1a', reached: '#2ecc71', blocked: '#ff5a4d' };
const CLICK_MOVE_LIMIT = 4; // px: a mouse movement larger than this is a camera drag, not a click

const round1 = (v) => Math.round(v * 10) / 10;

function Marker({ wp, index, color, blocked }) {
  const y = wp.y + GROUND_CLEARANCE;
  return (
    <group position={[wp.x, 0, wp.z]}>
      {/* pole from the ground to the waypoint */}
      <mesh position={[0, y / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, y, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      {/* ring on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.6, 0.85, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      {/* the waypoint itself */}
      <mesh position={[0, y, 0]}>
        <octahedronGeometry args={[0.55]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </mesh>
      <Html position={[0, y + 1.3, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`wp-label ${blocked ? 'blocked' : ''}`} style={{ borderColor: color }}>
          <b>{index + 1}</b> {blocked ? '⚠' : ''}
          <span>{`${wp.x.toFixed(0)}, ${wp.y.toFixed(0)}, ${wp.z.toFixed(0)}`}</span>
        </div>
      </Html>
    </group>
  );
}

export default function WaypointLayer() {
  const { gl } = useThree();
  const autopilot = useSimulatorStore((s) => s.autopilot);
  const waypoints = useSimulatorStore((s) => s.waypoints);
  const status = useSimulatorStore((s) => s.missionStatus);
  const nextWaypoint = useSimulatorStore((s) => s.missionProgress.nextWaypoint);
  const altitude = useSimulatorStore((s) => s.waypointAltitude);
  const ghost = useRef();

  const blockedLegs = useMemo(() => findBlockedLegs(waypoints, BUILDING_BOXES), [waypoints]);

  if (!autopilot) return null;

  const editing = status !== 'running' && status !== 'paused';
  const started = status === 'running' || status === 'paused';
  const doneAll = status === 'complete';

  const colorOf = (i) => {
    if (doneAll) return COLORS.reached;
    if (started) return i < nextWaypoint ? COLORS.reached : i === nextWaypoint ? COLORS.next : COLORS.pending;
    return COLORS.pending;
  };

  const setCursor = (c) => { gl.domElement.style.cursor = c; };

  const onClick = (e) => {
    if (!editing || e.delta > CLICK_MOVE_LIMIT) return;
    e.stopPropagation();
    const x = round1(e.point.x);
    const z = round1(e.point.z);
    if (waypointBlocked({ x, y: altitude, z }, BUILDING_BOXES)) return; // inside a building
    useSimulatorStore.getState().addWaypoint(x, z);
  };

  const onMove = (e) => {
    if (!ghost.current) return;
    ghost.current.visible = editing;
    ghost.current.position.set(e.point.x, 0, e.point.z);
  };

  return (
    <group>
      {/* invisible click target: the ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
        onClick={onClick}
        onPointerMove={onMove}
        onPointerOver={() => editing && setCursor('crosshair')}
        onPointerOut={() => { setCursor('grab'); if (ghost.current) ghost.current.visible = false; }}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      {/* preview of the waypoint under the mouse */}
      <group ref={ghost} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <ringGeometry args={[0.6, 0.85, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, altitude + GROUND_CLEARANCE, 0]}>
          <octahedronGeometry args={[0.5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.35} wireframe />
        </mesh>
      </group>

      {/* route: blue = ok, red = passes through a building */}
      {waypoints.slice(0, -1).map((w, i) => (
        <Line
          key={`leg-${w.id}`}
          points={[waypointToWorld(w), waypointToWorld(waypoints[i + 1])]}
          color={blockedLegs.includes(i) ? COLORS.blocked : '#ffffff'}
          lineWidth={2}
          dashed
          dashSize={0.8}
          gapSize={0.5}
        />
      ))}

      {waypoints.map((w, i) => (
        <Marker
          key={w.id}
          wp={w}
          index={i}
          color={colorOf(i)}
          blocked={blockedLegs.includes(i) || blockedLegs.includes(i - 1)}
        />
      ))}
    </group>
  );
}

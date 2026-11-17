/**
 * Quadcopter flight model. PURE JavaScript: no React, no Three.js.
 * That makes it easy to unit-test and to explain in the thesis.
 *
 * Coordinate system (same as Three.js): +X right, +Y up, nose points to -Z.
 * Rotation order YXZ:  R = Ry(yaw) * Rx(pitch) * Rz(roll)
 *   pitch > 0 = nose up      roll > 0 = leaning left      yaw > 0 = turning left
 *
 * Physics per step:
 *   1. Attitude (pitch/roll) follows the commanded tilt like a spring-damper  -> tilt inertia
 *   2. Thrust is along the drone's own UP axis                                -> thrust vectoring
 *   3. a = (T/m)*up + gravity + drag ; v += a*dt ; p += v*dt                  -> momentum
 *   4. Ground / building collisions, battery drain
 */
import { GRAVITY, GROUND_CLEARANCE, BODY_RADIUS } from './constants.js';
import { collideSphereWithBoxes } from './collisions.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const NEUTRAL = { forward: 0, right: 0, throttle: 0, yawRight: 0, assist: true };

export function createFlightState() {
  return {
    pos: [0, GROUND_CLEARANCE, 0],
    vel: [0, 0, 0],
    pitch: 0, roll: 0, yaw: 0,
    pitchRate: 0, rollRate: 0, yawRate: 0,
    thrust: 0,          // actual rotor thrust [N] (lags behind the command)
    battery: 100,       // %
    onGround: true,
    crashed: false,
    crashReason: '',
    motorsOn: true,
  };
}

export function resetFlightState(s) {
  Object.assign(s, createFlightState());
}

/**
 * input: { forward, right, throttle, yawRight, assist }   axes are -1..1
 *   forward  +1 = pitch forward (W)      right    +1 = roll right (D)
 *   throttle +1 = climb (Space / Up)     yawRight +1 = turn right (E)
 *   assist   true = altitude hold, false = manual throttle
 */
export function stepFlight(s, input, p, dt, boxes = []) {
  const hover = p.mass * GRAVITY;
  const motorsOn = !s.crashed && s.battery > 0;
  s.motorsOn = motorsOn;

  const cmd = motorsOn ? input : NEUTRAL;
  const throttle = clamp(cmd.throttle, -1, 1);
  const idleOnGround = s.onGround && throttle <= 0.02; // landed and not trying to take off

  // ---------- 1. attitude ----------
  if (motorsOn) {
    const tilt = idleOnGround ? 0 : 1; // stay level while parked
    const targetPitch = -clamp(cmd.forward, -1, 1) * p.maxTilt * tilt;
    const targetRoll = -clamp(cmd.right, -1, 1) * p.maxTilt * tilt;
    const targetYawRate = -clamp(cmd.yawRight, -1, 1) * p.maxYawRate;

    const wn2 = p.wn * p.wn;
    const damping = 2 * p.zeta * p.wn;
    s.pitchRate += (wn2 * (targetPitch - s.pitch) - damping * s.pitchRate) * dt;
    s.rollRate += (wn2 * (targetRoll - s.roll) - damping * s.rollRate) * dt;
    s.yawRate += (targetYawRate - s.yawRate) * (1 - Math.exp(-dt * p.wn * 0.5));
  } else {
    const k = Math.exp(-3 * dt);
    s.pitchRate *= k; s.rollRate *= k; s.yawRate *= k;
  }

  s.pitch = clamp(s.pitch + s.pitchRate * dt, -1.2, 1.2);
  s.roll = clamp(s.roll + s.rollRate * dt, -1.2, 1.2);
  s.yaw += s.yawRate * dt;
  if (s.yaw > Math.PI) s.yaw -= 2 * Math.PI;
  else if (s.yaw < -Math.PI) s.yaw += 2 * Math.PI;

  // ---------- 2. thrust command ----------
  const cosTilt = Math.cos(s.roll) * Math.cos(s.pitch); // vertical share of thrust
  let thrustCmd = 0;
  if (motorsOn && !idleOnGround) {
    if (cmd.assist) {
      // altitude hold: throttle = desired climb rate, a P-controller supplies the thrust,
      // and thrust is boosted by 1/cos(tilt) so tilting does not lose height
      const targetVz = throttle >= 0 ? throttle * p.maxClimb : throttle * p.maxDescent;
      const accel = p.altKp * (targetVz - s.vel[1]);
      thrustCmd = (p.mass * (GRAVITY + accel)) / Math.max(cosTilt, 0.5);
    } else {
      // manual: neutral = hover thrust, throttle adds/removes thrust directly
      const range = throttle >= 0 ? throttle * (p.twr - 1) : throttle * 0.8;
      thrustCmd = hover * (1 + range);
    }
  }
  thrustCmd = clamp(thrustCmd, 0, p.maxThrust);
  s.thrust += (thrustCmd - s.thrust) * (1 - Math.exp(-dt / p.motorTau)); // motor lag

  // ---------- 3. forces -> motion ----------
  const sr = Math.sin(s.roll), cr = Math.cos(s.roll);
  const sp = Math.sin(s.pitch), cp = Math.cos(s.pitch);
  const sy = Math.sin(s.yaw), cy = Math.cos(s.yaw);

  // the drone's UP axis in world space = thrust direction
  const ux = -sr * cy + cr * sp * sy;
  const uy = cr * cp;
  const uz = sr * sy + cr * sp * cy;

  const speed = Math.hypot(s.vel[0], s.vel[1], s.vel[2]);
  const drag = p.c1 + p.c2 * speed; // a_drag = -drag * v
  const thrustAccel = s.thrust / p.mass;

  s.vel[0] += (ux * thrustAccel - drag * s.vel[0]) * dt;
  s.vel[1] += (uy * thrustAccel - GRAVITY - drag * s.vel[1]) * dt;
  s.vel[2] += (uz * thrustAccel - drag * s.vel[2]) * dt;

  s.pos[0] += s.vel[0] * dt;
  s.pos[1] += s.vel[1] * dt;
  s.pos[2] += s.vel[2] * dt;

  // ---------- 4. collisions ----------
  const crash = (reason) => {
    if (!s.crashed) {
      s.crashed = true;
      s.crashReason = reason;
    }
  };

  const hit = collideSphereWithBoxes(s, boxes, BODY_RADIUS);
  if (hit.impact > p.crashSpeed) crash('Crashed into a building');

  let landed = hit.supported;
  if (s.pos[1] <= GROUND_CLEARANCE) {
    s.pos[1] = GROUND_CLEARANCE;
    if (s.vel[1] < 0) {
      if (-s.vel[1] > p.crashSpeed) crash('Hard landing');
      s.vel[1] = 0;
    }
    landed = true;
  }

  s.onGround = landed && s.vel[1] <= 0.05;
  if (s.onGround) {
    const friction = Math.exp(-4 * dt); // wheels/skids scrub speed on the ground
    s.vel[0] *= friction;
    s.vel[2] *= friction;
  }

  // ---------- 5. battery (power ~ thrust^1.5, from momentum theory) ----------
  if (motorsOn) {
    const load = Math.max(s.thrust / hover, 0.15);
    s.battery = Math.max(0, s.battery - p.drainPerSecAtHover * Math.pow(load, 1.5) * dt);
  }
}

/** Values shown on the HUD */
export function getTelemetry(s, p) {
  const heading = (((-s.yaw * 180) / Math.PI) % 360 + 360) % 360; // compass: 0 = north (-Z), clockwise
  let status = 'FLYING';
  if (s.crashed) status = 'CRASHED';
  else if (s.onGround) status = 'LANDED';

  return {
    speed: Math.hypot(s.vel[0], s.vel[2]),
    verticalSpeed: s.vel[1],
    altitude: Math.max(0, s.pos[1] - GROUND_CLEARANCE),
    heading,
    pitchDeg: (s.pitch * 180) / Math.PI,
    rollDeg: (-s.roll * 180) / Math.PI, // positive = leaning right
    battery: s.battery,
    thrustPct: (100 * s.thrust) / p.maxThrust,
    status,
    crashReason: s.crashReason,
    motorsOn: s.motorsOn,
  };
}

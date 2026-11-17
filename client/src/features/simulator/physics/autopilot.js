/**
 * Waypoint autopilot. PURE JavaScript (no React, no Three.js), so it can be tested in Node.
 *
 * Algorithm (what to explain in the thesis):
 *  1. PATH      Ordered waypoints -> polyline  [start, (takeoff point), WP1, WP2, ...].
 *  2. CARROT    "Pure pursuit": project the drone onto the current leg, then aim at a point
 *               `lookahead` metres further along the polyline (it slides around corners, so
 *               the drone turns smoothly instead of stopping at every waypoint).
 *  3. SPEED     Speed limit = min(cruise, braking profile). Braking profile  v = sqrt(v_end^2 + 2*a*d)
 *               makes the drone slow down before sharp corners and stop at the last waypoint.
 *  4. VELOCITY  Desired velocity -> desired acceleration (P-controller + drag compensation)
 *               -> body frame -> pitch / roll stick commands  (a = g*tan(tilt)).
 *  5. YAW       The nose is steered towards the direction of travel.
 *  6. ALTITUDE  Climb rate is commanded; the flight model's altitude-hold does the rest.
 *
 * The output has the same shape as the keyboard input of flightModel.stepFlight(),
 * so the autopilot "flies" the drone exactly like a pilot would.
 */
import { GRAVITY, GROUND_CLEARANCE, BODY_RADIUS } from './constants.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const KV = 1.1;          // velocity P-gain [1/s]
const KZ = 0.9;          // altitude P-gain [1/s]
const ACCEPT_LAST = 1.6; // m: final waypoint is "reached" inside this radius...
const ACCEPT_SPEED = 0.8;// ...and slower than this [m/s]

/** Waypoints are { x, y, z } with y = altitude above the ground [m]. Returns world positions. */
export const waypointToWorld = (w) => [w.x, w.y + GROUND_CLEARANCE, w.z];

/**
 * Build the path that is actually flown.
 * If the drone is low, a vertical "takeoff" point above its position is inserted first.
 */
export function buildPath(startPos, waypoints) {
  const pts = [[startPos[0], startPos[1], startPos[2]]];
  const wpOfPoint = [-1];

  const first = waypoints.length ? waypointToWorld(waypoints[0]) : null;
  if (first && first[1] - startPos[1] > 1.0) {
    pts.push([startPos[0], first[1], startPos[2]]); // climb straight up first
    wpOfPoint.push(-1);
  }

  waypoints.forEach((w, i) => {
    const p = waypointToWorld(w);
    if (dist3(p, pts[pts.length - 1]) < 0.5) {
      wpOfPoint[wpOfPoint.length - 1] = i; // same place as the previous point: merge
      return;
    }
    pts.push(p);
    wpOfPoint.push(i);
  });

  return { pts, wpOfPoint };
}

export function createMission(startPos, waypoints, p) {
  const { pts, wpOfPoint } = buildPath(startPos, waypoints);
  const legLen = [];
  const legDir = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const d = dist3(pts[i], pts[i + 1]) || 1e-6;
    legLen.push(d);
    legDir.push([
      (pts[i + 1][0] - pts[i][0]) / d,
      (pts[i + 1][1] - pts[i][1]) / d,
      (pts[i + 1][2] - pts[i][2]) / d,
    ]);
  }

  return {
    pts, wpOfPoint, legLen, legDir,
    leg: 0,
    done: pts.length < 2,
    holdY: null,
    cruise: Math.min(p.maxSpeed * 0.6, 14), // m/s
  };
}

const NEUTRAL_INPUT = { forward: 0, right: 0, throttle: 0, yawRight: 0, assist: true };

/**
 * One control step. s = flight state, p = physics params (specMapper).
 * opts.hold = true  -> brake and hold position (mission paused)
 * Returns { input, progress, done }.
 */
export function stepMission(m, s, p, opts = {}) {
  const hold = !!opts.hold;
  if (m.done && !hold) {
    // finished: just hover where we are
    return { input: holdInput(m, s, p), progress: progressOf(m, s), done: true };
  }
  if (hold) return { input: holdInput(m, s, p), progress: progressOf(m, s), done: false };
  m.holdY = null;

  const { pts, legLen, legDir } = m;
  const nLegs = legLen.length;
  const pos = s.pos;
  const vel = s.vel;
  const hSpeed = Math.hypot(vel[0], vel[2]);
  const speed = Math.hypot(vel[0], vel[1], vel[2]);

  // ---------- 1. advance to the next leg ----------
  while (m.leg < nLegs - 1) {
    const end = pts[m.leg + 1];
    const d = dist3(pos, end);
    const r = clamp(1.5 + 0.3 * speed, 2, 6);
    const dir = legDir[m.leg];
    const along = (pos[0] - end[0]) * dir[0] + (pos[1] - end[1]) * dir[1] + (pos[2] - end[2]) * dir[2];
    // reached = inside the radius, or we have flown past the waypoint's plane while close to it
    if (d < r || (along > -0.5 && d < r + 8)) m.leg++;
    else break;
  }

  // ---------- 2. finished? ----------
  const lastPt = pts[pts.length - 1];
  const dEnd3 = dist3(pos, lastPt);
  if (m.leg === nLegs - 1 && dEnd3 < ACCEPT_LAST && speed < ACCEPT_SPEED) {
    m.done = true;
    return { input: holdInput(m, s, p), progress: progressOf(m, s), done: true };
  }

  // ---------- 3. carrot point (pure pursuit) ----------
  const i = m.leg;
  const rel = [pos[0] - pts[i][0], pos[1] - pts[i][1], pos[2] - pts[i][2]];
  const sProj = clamp(rel[0] * legDir[i][0] + rel[1] * legDir[i][1] + rel[2] * legDir[i][2], 0, legLen[i]);
  const lookahead = clamp(0.8 * hSpeed + 2, 2.5, 9);

  let k = i;
  let t = sProj + lookahead;
  while (k < nLegs - 1 && t > legLen[k]) {
    t -= legLen[k];
    k++;
  }
  t = Math.min(t, legLen[k]);
  const target = [
    pts[k][0] + legDir[k][0] * t,
    pts[k][1] + legDir[k][1] * t,
    pts[k][2] + legDir[k][2] * t,
  ];

  // ---------- 4. speed profile ----------
  const aRef = GRAVITY * Math.tan(p.maxTilt);
  const aDec = 0.4 * aRef; // comfortable braking [m/s^2]

  let distAhead = legLen[i] - sProj; // distance along the path to the end of the current leg
  const pathRemaining = distAhead + legLen.slice(i + 1).reduce((a, b) => a + b, 0);
  // on the last leg use the real distance to the final point: if the drone overshoots, the
  // projection onto the leg would say "0 m left" and the drone could never come back
  const remaining = i === nLegs - 1 ? dEnd3 : pathRemaining;

  // brake early enough: the drone needs ~0.35 s to tilt (attitude lag)
  const brakeDist = Math.max(remaining - 0.8 - 0.35 * hSpeed, 0);
  let vLimit = Math.sqrt(2 * aDec * brakeDist); // stop at the last waypoint
  let dCorner = distAhead;
  for (let c = i; c < Math.min(i + 3, nLegs - 1); c++) {
    const cosT = clamp(
      legDir[c][0] * legDir[c + 1][0] + legDir[c][1] * legDir[c + 1][1] + legDir[c][2] * legDir[c + 1][2],
      -1, 1
    );
    const turn = Math.acos(cosT); // 0 = straight on, PI = U-turn
    const vCorner = m.cruise * clamp(1 - turn / (0.75 * Math.PI), 0.2, 1);
    vLimit = Math.min(vLimit, Math.sqrt(vCorner * vCorner + 2 * aDec * dCorner));
    dCorner += legLen[c + 1];
  }

  // ---------- 5. desired velocity ----------
  const alt = pos[1] - GROUND_CLEARANCE;
  const climbGate = clamp((alt - 1.0) / 2.0, 0, 1); // no sideways flight until we are airborne

  const hx = target[0] - pos[0];
  const hz = target[2] - pos[2];
  const hd = Math.hypot(hx, hz);

  let speedCmd = Math.min(m.cruise, vLimit) * climbGate;
  speedCmd = Math.min(speedCmd, hd * 1.2); // do not overshoot a close target
  const vdx = hd > 0.05 ? (hx / hd) * speedCmd : 0;
  const vdz = hd > 0.05 ? (hz / hd) * speedCmd : 0;

  const vzCmd = clamp(KZ * (target[1] - pos[1]), -p.maxDescent, p.maxClimb);

  return {
    input: controlToInput(s, p, vdx, vdz, vzCmd, hd > 2.5 && speedCmd > 0.5 ? Math.atan2(-hx, -hz) : null),
    progress: progressOf(m, s, vLimit),
    done: false,
  };
}

/** Brake to a standstill and keep the current altitude. */
function holdInput(m, s, p) {
  if (m.holdY === null) m.holdY = s.pos[1];
  const vzCmd = clamp(KZ * (m.holdY - s.pos[1]), -p.maxDescent, p.maxClimb);
  return controlToInput(s, p, 0, 0, vzCmd, null);
}

/**
 * Desired world velocity -> stick commands.
 *   dv/dt = a_thrust - drag*v   =>   a_thrust = KV*(v_des - v) + drag*v
 *   horizontal acceleration of a tilted drone:  a = g*tan(tilt)
 */
function controlToInput(s, p, vdx, vdz, vzCmd, targetYaw) {
  const vx = s.vel[0];
  const vz = s.vel[2];
  const speed = Math.hypot(s.vel[0], s.vel[1], s.vel[2]);
  const drag = p.c1 + p.c2 * speed;

  const ax = KV * (vdx - vx) + drag * vx;
  const az = KV * (vdz - vz) + drag * vz;

  // body axes (nose = -Z at yaw 0):  forward = (-sin yaw, -cos yaw),  right = (cos yaw, -sin yaw)
  const sy = Math.sin(s.yaw);
  const cy = Math.cos(s.yaw);
  const aForward = ax * -sy + az * -cy;
  const aRight = ax * cy + az * -sy;

  const aRef = GRAVITY * Math.tan(p.maxTilt);

  let yawRight = 0;
  if (targetYaw !== null) {
    yawRight = -clamp(1.5 * wrap(targetYaw - s.yaw), -1, 1); // yawRight > 0 turns right (yaw decreases)
  }

  return {
    forward: clamp(aForward / aRef, -1, 1),
    right: clamp(aRight / aRef, -1, 1),
    throttle: clamp(vzCmd >= 0 ? vzCmd / p.maxClimb : vzCmd / p.maxDescent, -1, 1),
    yawRight,
    assist: true,
  };
}

/** Numbers for the UI. nextWaypoint = index (in the user's list) of the waypoint being flown to. */
function progressOf(m, s, speedLimit = 0) {
  let nextWaypoint = -1;
  for (let k = m.leg + 1; k < m.wpOfPoint.length; k++) {
    if (m.wpOfPoint[k] >= 0) { nextWaypoint = m.wpOfPoint[k]; break; }
  }
  const target = m.pts[Math.min(m.leg + 1, m.pts.length - 1)];
  return {
    nextWaypoint: m.done ? -1 : nextWaypoint,
    distance: dist3(s.pos, target),
    legs: m.legLen.length,
    leg: m.leg,
    speedLimit,
  };
}

/**
 * Which legs of the planned route (waypoint i -> waypoint i+1) pass through a building?
 * boxes = BUILDING_BOXES. Returns an array of leg indices. Used to warn the user.
 */
export function findBlockedLegs(waypoints, boxes, margin = 1.0) {
  const blocked = [];
  const m = BODY_RADIUS + margin;
  const inside = (x, y, z) =>
    boxes.some(
      (b) =>
        x > b.minX - m && x < b.maxX + m &&
        z > b.minZ - m && z < b.maxZ + m &&
        y < b.maxY + m
    );

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypointToWorld(waypoints[i]);
    const b = waypointToWorld(waypoints[i + 1]);
    const n = Math.max(2, Math.ceil(dist3(a, b) / 0.5));
    for (let s = 0; s <= n; s++) {
      const t = s / n;
      if (inside(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)) {
        blocked.push(i);
        break;
      }
    }
  }
  return blocked;
}

/** Is a single waypoint inside a building? (used when placing) */
export function waypointBlocked(w, boxes, margin = 1.0) {
  return findBlockedLegs([w, w], boxes, margin).length > 0;
}

export { NEUTRAL_INPUT };

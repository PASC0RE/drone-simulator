// Headless tests of the waypoint autopilot:  node tools/autopilot-check.mjs
const base = new URL('../src/features/simulator/', import.meta.url).href;
const { createFlightState, stepFlight, getTelemetry } = await import(base + 'physics/flightModel.js');
const { mapSpecsToPhysics } = await import(base + 'physics/specMapper.js');
const { createMission, stepMission, findBlockedLegs, waypointToWorld } = await import(base + 'physics/autopilot.js');
const { BUILDING_BOXES } = await import(base + 'environment/layout.js');
const { STEP } = await import(base + 'physics/constants.js');

const DRONES = {
  falcon: { weight: 1.4, maxSpeed: 68, batteryLife: 38 },
  hawk: { weight: 24, maxSpeed: 150, batteryLife: 240 },
  sparrow: { weight: 0.18, maxSpeed: 45, batteryLife: 22 },
};
let failures = 0;
const check = (name, ok) => { console.log((ok ? '  PASS ' : '  FAIL ') + name); if (!ok) failures++; };
const f = (v, d = 1) => Number(v).toFixed(d);
const wp = (x, y, z) => ({ x, y, z });

const CTRL_DT = 1 / 60;

/** Simulate like DroneRig does: control at 60 Hz, physics at 120 Hz. */
function fly(specs, waypoints, { boxes = [], maxTime = 400, pauseAt = null, pauseFor = 0 } = {}) {
  const p = mapSpecsToPhysics(specs);
  const s = createFlightState();
  const m = createMission(s.pos, waypoints, p);
  const minDist = waypoints.map(() => Infinity);
  const log = { t: 0, pausedSpeed: null, pausedAltDrift: null };
  let paused = false, pausedFor = 0, pauseStartAlt = 0;
  let maxAlt = 0;

  while (log.t < maxTime) {
    const hold = pauseAt !== null && log.t >= pauseAt && pausedFor < pauseFor;
    if (hold && !paused) { paused = true; pauseStartAlt = s.pos[1]; }
    if (hold) pausedFor += CTRL_DT;
    if (paused && !hold) {
      log.pausedSpeed = Math.hypot(...s.vel);
      log.pausedAltDrift = Math.abs(s.pos[1] - pauseStartAlt);
      paused = false; pauseAt = null;
    }

    const out = stepMission(m, s, p, { hold });
    stepFlight(s, out.input, p, STEP, boxes);
    stepFlight(s, out.input, p, STEP, boxes);
    log.t += CTRL_DT;

    waypoints.forEach((w, i) => {
      const d = Math.hypot(s.pos[0] - w.x, s.pos[1] - (w.y + 0.12), s.pos[2] - w.z);
      if (d < minDist[i]) minDist[i] = d;
    });
    maxAlt = Math.max(maxAlt, s.pos[1]);
    if (s.crashed) break;
    if (out.done && !hold) break;
  }
  const finite = [...s.pos, ...s.vel, s.pitch, s.roll, s.yaw].every(Number.isFinite);
  return { s, m, p, log, minDist, finite, done: m.done, maxAlt, speed: Math.hypot(...s.vel) };
}

// find a square route that does not cross any building at 30 m (buildings are max 26 m high)
const square = (h, alt) => [wp(h, alt, -h), wp(h, alt, h), wp(-h, alt, h), wp(-h, alt, -h)];

console.log('1. Square route 30x30 m, altitude 30 m, with buildings (Falcon)');
{
  const route = square(30, 30);
  check('route is clear of buildings', findBlockedLegs(route, BUILDING_BOXES).length === 0);
  const r = fly(DRONES.falcon, route, { boxes: BUILDING_BOXES });
  console.log(`   time ${f(r.log.t)} s, closest approach per waypoint: ${r.minDist.map((d) => f(d)).join(' / ')} m, end speed ${f(r.speed, 2)} m/s`);
  check('mission completes', r.done);
  check('no crash', !r.s.crashed);
  check('every waypoint passed within 4 m', r.minDist.every((d) => d < 4));
  check('stops at the last waypoint (< 1.6 m, < 0.8 m/s)', r.minDist[3] < 1.6 && r.speed < 0.8);
  check('all numbers finite', r.finite);
  check('altitude never above target + 3 m', r.maxAlt - 0.12 < 33);
}

console.log('\n2. Same task for all three drones, 12 m altitude, no buildings');
for (const [name, specs] of Object.entries(DRONES)) {
  const route = [wp(25, 12, 0), wp(25, 12, -25), wp(0, 12, -25)];
  const r = fly(specs, route);
  console.log(`   ${name.padEnd(8)} time ${f(r.log.t).padStart(5)} s  cruise ${f(r.m.cruise)} m/s  approach ${r.minDist.map((d) => f(d)).join(' / ')} m`);
  check(`${name}: completes without crash`, r.done && !r.s.crashed);
  check(`${name}: all waypoints within 4 m`, r.minDist.every((d) => d < 4));
}

console.log('\n3. Sharp corners (U-turn) and altitude changes');
{
  const route = [wp(30, 10, 0), wp(0, 25, 0), wp(30, 8, 5)];
  const r = fly(DRONES.falcon, route);
  console.log(`   approach ${r.minDist.map((d) => f(d)).join(' / ')} m`);
  check('U-turn route completes', r.done && !r.s.crashed);
  check('climbs and descends to the waypoint altitudes', r.minDist.every((d) => d < 4.5));
}

console.log('\n4. Pause / resume');
{
  const route = [wp(40, 15, 0), wp(40, 15, -40)];
  const r = fly(DRONES.falcon, route, { pauseAt: 6, pauseFor: 8 });
  console.log(`   speed at end of pause ${f(r.log.pausedSpeed, 2)} m/s, altitude drift during pause ${f(r.log.pausedAltDrift, 2)} m`);
  check('drone brakes to (almost) a standstill while paused', r.log.pausedSpeed !== null && r.log.pausedSpeed < 1.0);
  check('altitude is held while paused (< 1.5 m)', r.log.pausedAltDrift < 1.5);
  check('mission still completes after resume', r.done && !r.s.crashed);
}

console.log('\n5. Blocked-leg detection');
{
  const b = BUILDING_BOXES.find((x) => x.maxY > 15);
  const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
  const through = [wp(cx - 20, 5, cz), wp(cx + 20, 5, cz)];
  check('leg through a tall building is flagged', findBlockedLegs(through, BUILDING_BOXES).includes(0));
  const over = [wp(cx - 20, 40, cz), wp(cx + 20, 40, cz)];
  check('same leg at 40 m is clear', findBlockedLegs(over, BUILDING_BOXES).length === 0);
}

console.log('\n6. Robustness');
{
  const r = fly(DRONES.falcon, [wp(0, 10, 0)]);
  check('single waypoint straight above the pad works', r.done && !r.s.crashed && r.minDist[0] < 2);
  const r2 = fly(DRONES.sparrow, [wp(10, 3, 0), wp(10, 3, 0.2), wp(-10, 3, 0)]);
  check('duplicate / very close waypoints do not break it', r2.finite && !r2.s.crashed);
}

console.log(failures ? `\n${failures} CHECK(S) FAILED` : '\nALL AUTOPILOT CHECKS PASSED');
process.exit(failures ? 1 : 0);

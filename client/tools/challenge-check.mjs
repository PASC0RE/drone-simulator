// Headless check of the "Sun Run" challenge:  node tools/challenge-check.mjs
// Flies every drone through the course with the autopilot and checks that the course is finishable.
const base = new URL('../src/features/simulator/', import.meta.url).href;
const { createFlightState, stepFlight, getTelemetry } = await import(base + 'physics/flightModel.js');
const { mapSpecsToPhysics } = await import(base + 'physics/specMapper.js');
const { createMission, stepMission } = await import(base + 'physics/autopilot.js');
const { STEP, GROUND_CLEARANCE } = await import(base + 'physics/constants.js');
const { makeCourse, createRun, stepRun, starsOf } = await import('../src/features/challenge/course.js');

const { FALLBACK_DRONES: drones } = await import('../src/features/catalog/data/fallbackDrones.js');
let failures = 0;
const check = (name, ok) => { console.log((ok ? '  PASS ' : '  FAIL ') + name); if (!ok) failures++; };

const seeds = (process.env.SEEDS || '1,2,3').split(',').map(Number);
for (const d of drones) {
  for (const seed of seeds) {
    const p = mapSpecsToPhysics(d);
    const course = makeCourse({ seed, vmax: p.maxSpeed });
    const s = createFlightState();
    const wps = course.gates.map((g) => ({ x: g.x, y: g.y - GROUND_CLEARANCE, z: g.z }));
    const m = createMission(s.pos, wps, p);
    const run = createRun(course);
    let prev = [...s.pos];
    let t = 0;
    while (t < 600 && run.status !== 'finished' && run.status !== 'failed') {
      const out = stepMission(m, s, p, { hold: false });
      stepFlight(s, out.input, p, STEP, course.colliders);
      stepFlight(s, out.input, p, STEP, course.colliders);
      t += 1 / 60;
      stepRun(run, course, s.pos, prev, 1 / 60, { crashed: s.crashed, batteryEmpty: !s.motorsOn && !s.crashed });
      prev = [...s.pos];
    }
    const ok = run.status === 'finished';
    check(
      `${d.name.padEnd(30)} seed ${seed}: ${run.status}${run.reason ? '/' + run.reason : ''}  gates ${run.gatesPassed}/${course.gates.length}  ` +
      `time ${run.time.toFixed(0)}s of ${run.daylightMax.toFixed(0)}s (par ${course.parTime.toFixed(0)}s)  score ${run.score}  ${'*'.repeat(starsOf(run, course))}`,
      ok
    );
  }
}
console.log(failures ? `\n${failures} FAILED` : '\nALL CHALLENGE CHECKS PASSED');
process.exit(failures ? 1 : 0);

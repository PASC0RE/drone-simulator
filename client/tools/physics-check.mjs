const base = new URL('../src/features/simulator/', import.meta.url).href;
const { createFlightState, stepFlight, getTelemetry } = await import(base + 'physics/flightModel.js');
const { mapSpecsToPhysics } = await import(base + 'physics/specMapper.js');
const { BUILDING_BOXES } = await import(base + 'environment/layout.js');
const { STEP } = await import(base + 'physics/constants.js');

const DRONES = {
  falcon: { weight: 1.4, maxSpeed: 68, batteryLife: 38 },
  hawk: { weight: 24, maxSpeed: 150, batteryLife: 240 },
  sparrow: { weight: 0.18, maxSpeed: 45, batteryLife: 22 },
};
const Z = { forward: 0, right: 0, throttle: 0, yawRight: 0 };

// run a list of [seconds, inputPatch] phases
function run(s, p, phases, assist = true, boxes = []) {
  const log = [];
  for (const [sec, patch] of phases) {
    const inp = { ...Z, ...patch, assist };
    const n = Math.round(sec / STEP);
    for (let i = 0; i < n; i++) stepFlight(s, inp, p, STEP, boxes);
    log.push(getTelemetry(s, p));
  }
  return log;
}
const f = (v, d = 2) => Number(v).toFixed(d);
const show = (label, t) => console.log(`${label.padEnd(34)} alt=${f(t.altitude)} spd=${f(t.speed)} vs=${f(t.verticalSpeed)} hdg=${f(t.heading,0)} pit=${f(t.pitchDeg,1)} rol=${f(t.rollDeg,1)} bat=${f(t.battery,2)} ${t.status}`);
let failures = 0;
const check = (name, ok) => { console.log((ok ? '  PASS ' : '  FAIL ') + name); if (!ok) failures++; };

const p = mapSpecsToPhysics(DRONES.falcon);
console.log('Falcon params: twr', f(p.twr), 'maxThrust', f(p.maxThrust), 'c1', f(p.c1,3), 'c2', f(p.c2,4), 'wn', f(p.wn), '\n');

// 1. parked drone stays put, barely uses battery
{
  const s = createFlightState();
  const [t] = run(s, p, [[5, {}]]);
  show('1. parked 5 s', t);
  check('stays on ground', t.altitude < 0.01 && t.status === 'LANDED');
  check('battery barely drains', t.battery > 99.9);
}

// 2. take off (assist), release -> should hover
{
  const s = createFlightState();
  const [up, rel, hold] = run(s, p, [[2, { throttle: 1 }], [3, {}], [10, {}]]);
  show('2a. throttle up 2 s', up);
  show('2b. released +3 s', rel);
  show('2c. released +13 s', hold);
  check('climbs', up.altitude > 3);
  check('hovers after release (|vs| < 0.1)', Math.abs(hold.verticalSpeed) < 0.1);
  check('altitude stable while hovering', Math.abs(hold.altitude - rel.altitude) < 0.5);
}

// 3. forward flight + stopping (assist)
{
  const s = createFlightState();
  run(s, p, [[2, { throttle: 1 }], [3, {}]]);
  const alt0 = getTelemetry(s, p).altitude;
  const [a, b, c] = run(s, p, [[3, { forward: 1 }], [20, { forward: 1 }], [10, {}]]);
  show('3a. W 3 s', a);
  show('3b. W 23 s (top speed)', b);
  show('3c. released 10 s', c);
  check('moves forward (-Z)', s.pos[2] < -20);
  check('nose down while accelerating', a.pitchDeg < -5);
  check('top speed close to spec 18.9 m/s', b.speed > 16 && b.speed < 21);
  check('assist keeps altitude (±1.5 m)', Math.abs(b.altitude - alt0) < 1.5);
  check('slows down after release', c.speed < b.speed * 0.5);
  check('levels out after release', Math.abs(c.pitchDeg) < 8);
}

// 4. manual mode: neutral hovers, tilting loses height
{
  const s = createFlightState();
  run(s, p, [[2, { throttle: 1 }], [1, { throttle: -0.0 }]], true);
  const [n] = run(s, p, [[3, {}]], false);
  show('4a. manual neutral 3 s', n);
  check('manual neutral does not fall like a rock', Math.abs(n.verticalSpeed) < 2);
  const alt = n.altitude;
  const [tilt] = run(s, p, [[4, { forward: 1 }]], false);
  show('4b. manual + W 4 s', tilt);
  check('manual tilt sinks (no compensation)', tilt.altitude < alt - 0.3);
}

// 5. yaw + heading convention
{
  const s = createFlightState();
  run(s, p, [[2, { throttle: 1 }]]);
  const [e] = run(s, p, [[1, { yawRight: 1 }]]);
  show('5a. E (yaw right) 1 s', e);
  check('E increases compass heading', e.heading > 20 && e.heading < 180);
  const s2 = createFlightState();
  run(s2, p, [[2, { throttle: 1 }]]);
  const [q] = run(s2, p, [[1, { yawRight: -1 }]]);
  show('5b. Q (yaw left) 1 s', q);
  check('Q decreases heading (wraps below 360)', q.heading > 180);
}

// 6. roll direction: D = right = +X
{
  const s = createFlightState();
  run(s, p, [[2, { throttle: 1 }]]);
  run(s, p, [[3, { right: 1 }]]);
  check('D moves drone to +X (right)', s.pos[0] > 2);
  const s2 = createFlightState();
  run(s2, p, [[2, { throttle: 1 }]]);
  run(s2, p, [[3, { forward: -1 }]]);
  check('S moves drone backwards (+Z)', s2.pos[2] > 2);
}

// 7. flight follows yaw: after turning 90 deg right, W moves along +X
{
  const s = createFlightState();
  run(s, p, [[2, { throttle: 1 }], [3, {}]]);
  // turn right until heading ~90
  for (let i = 0; i < 20 / STEP && getTelemetry(s, p).heading < 88; i++) stepFlight(s, { ...Z, yawRight: 1, assist: true }, p, STEP, []);
  run(s, p, [[1.5, {}]]);
  const x0 = s.pos[0];
  run(s, p, [[3, { forward: 1 }]]);
  check('after turning right 90°, W flies east (+X)', s.pos[0] - x0 > 3);
}

// 8. battery drain matches spec (hover)
{
  const s = createFlightState();
  run(s, p, [[2, { throttle: 1 }], [3, {}]]);
  const b0 = s.battery;
  run(s, p, [[60, {}]]);
  const used = b0 - s.battery;
  console.log(`8. hover 60 s used ${f(used,3)}%  (spec: 100/(38*60)*60 = ${f(100/38,3)}%)`);
  check('hover drain ≈ 100%/flight time', used > 2.4 && used < 3.1);
}

// 9. battery empty -> falls and crashes
{
  const s = createFlightState();
  run(s, p, [[2, { throttle: 1 }], [2, {}]]);
  s.battery = 0;
  const [t] = run(s, p, [[6, {}]]);
  show('9. battery 0 at altitude', t);
  check('motors off + crash on impact', t.status === 'CRASHED' && !t.motorsOn);
}

// 10. building collision
{
  const s = createFlightState();
  const b = BUILDING_BOXES.find((x) => x.minZ < -10 && Math.abs((x.minX + x.maxX) / 2) < 10) || BUILDING_BOXES[0];
  s.pos = [(b.minX + b.maxX) / 2, 3, b.maxZ + 6];
  s.onGround = false;
  const [t] = run(s, p, [[8, { forward: 1 }]], true, BUILDING_BOXES);
  show('10. fly into a building', t);
  check('never ends up inside the box', !(s.pos[0] > b.minX && s.pos[0] < b.maxX && s.pos[1] < b.maxY && s.pos[2] > b.minZ && s.pos[2] < b.maxZ));
}

// 11. different drones feel different
{
  console.log('\n11. same inputs, three drones:');
  const results = {};
  for (const [name, specs] of Object.entries(DRONES)) {
    const pp = mapSpecsToPhysics(specs);
    const s = createFlightState();
    run(s, pp, [[2, { throttle: 1 }], [3, {}]]);
    const [a] = run(s, pp, [[1.5, { forward: 1 }]]);
    const [b] = run(s, pp, [[25, { forward: 1 }]]);
    results[name] = { a, b, vmax: pp.maxSpeed };
    console.log(`   ${name.padEnd(8)} speed@1.5s=${f(a.speed)}  top=${f(b.speed)} m/s (spec ${f(pp.maxSpeed)})  twr=${f(pp.twr)}`);
  }
  check('micro drone accelerates faster than the heavy UAV', results.sparrow.a.speed > results.hawk.a.speed);
  check('each drone approaches its own top speed', Object.values(results).every((r) => r.b.speed > r.vmax * 0.8 && r.b.speed < r.vmax * 1.1));
}

// 12. no NaNs anywhere, even with extreme inputs and odd dt
{
  const s = createFlightState();
  const ps = mapSpecsToPhysics(DRONES.sparrow);
  for (let i = 0; i < 120 * 60; i++) {
    const k = i / 120;
    stepFlight(s, { forward: Math.sin(k), right: Math.cos(k * 1.3), throttle: Math.sin(k * 0.7), yawRight: Math.cos(k), assist: i % 2000 < 1000 }, ps, STEP, BUILDING_BOXES);
  }
  check('60 s of chaotic input: all numbers finite', [...s.pos, ...s.vel, s.pitch, s.roll, s.yaw, s.battery, s.thrust].every(Number.isFinite));
}

console.log(failures ? `\n${failures} CHECK(S) FAILED` : '\nALL CHECKS PASSED');

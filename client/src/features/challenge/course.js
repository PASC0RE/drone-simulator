// "Sun Run": a course of rings (gates) along -Z, with pylons and energy orbs.
// Plain JS (no React), so it can be tested in Node.

export function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const GATE_RADIUS = 5;
export const ORB_PICKUP = 3;
export const DAYLIGHT_BONUS_ORB = 3; // seconds of daylight an orb adds

const box = (x, z, w, d, h) => ({
  minX: x - w / 2, maxX: x + w / 2,
  minY: 0,         maxY: h,
  minZ: z - d / 2, maxZ: z + d / 2,
});

/**
 * @param seed   course number: the same seed always gives the same course
 * @param vmax   drone top speed in m/s (faster drones get a longer course)
 * @param gates  number of rings
 */
export function makeCourse({ seed = 1, vmax = 15, gates = 16 } = {}) {
  const rand = mulberry32(seed * 9973 + 17);
  const spacing = clamp(vmax * 2.4, 48, 80);
  const stepX = Math.min(14, spacing * 0.28);

  const list = [];
  let x = 0;
  let y = 9;
  for (let i = 0; i < gates; i += 1) {
    x = clamp(x + (rand() * 2 - 1) * stepX, -26, 26);
    y = clamp(y + (rand() * 2 - 1) * 4, 8, 18);
    list.push({ id: i, x, y, z: -(spacing * 1.3 + i * spacing), r: GATE_RADIUS });
  }

  const pylons = []; // { x, z, w, d, h, box }
  const orbs = []; // { id, x, y, z }
  const posts = []; // gate frames: also solid

  const points = [{ x: 0, y: 0.12, z: 0 }, ...list];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];

    const n = rand() < 0.5 ? 1 : 2;
    for (let k = 0; k < n; k += 1) {
      const t = 0.25 + rand() * 0.5;
      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;
      const pz = a.z + (b.z - a.z) * t;
      const side = rand() < 0.5 ? -1 : 1;
      const off = 8 + rand() * 8;
      const w = 2 + rand() * 2;
      const d = 2 + rand() * 2;
      const h = Math.max(py + 8, 14) + rand() * 14;
      const cx = px + side * off;
      pylons.push({ x: cx, z: pz, w, d, h, box: box(cx, pz, w, d, h) });
    }

    orbs.push({
      id: i,
      x: (a.x + b.x) / 2 + (rand() - 0.5) * 4,
      y: (a.y + b.y) / 2 + (rand() - 0.5) * 2,
      z: (a.z + b.z) / 2,
    });
  }

  for (const g of list) {
    const h = g.y + g.r + 3;
    for (const side of [-1, 1]) {
      const cx = g.x + side * (g.r + 1.4);
      posts.push({ x: cx, z: g.z, w: 1.2, d: 1.2, h, box: box(cx, g.z, 1.2, 1.2, h) });
    }
  }

  const length = Math.abs(list[list.length - 1].z);
  // "par" time = covering the course at 55 % of top speed (counted up to 20 m/s: nobody
  // can turn tightly at 40 m/s) + a few seconds to take off
  const parTime = length / (0.55 * Math.min(vmax, 20)) + 8;

  return {
    seed,
    spacing,
    gates: list,
    pylons,
    posts,
    orbs,
    colliders: [...pylons, ...posts].map((p) => p.box),
    length,
    parTime,
  };
}

// ---------------------------------------------------------------- run state

export const DAYLIGHT_FACTOR = 1.45; // total daylight = par time x this

export function createRun(course) {
  return {
    status: 'ready', // ready | running | finished | failed
    reason: '', // crash | battery | sunset
    time: 0,
    daylightMax: course.parTime * DAYLIGHT_FACTOR,
    daylight: course.parTime * DAYLIGHT_FACTOR,
    score: 0,
    combo: 0,
    bestCombo: 0,
    gatesPassed: 0,
    gatesMissed: 0,
    perfects: 0,
    orbs: 0,
    nextGate: 0,
    gateState: course.gates.map(() => 'pending'), // pending | passed | perfect | missed
    orbTaken: course.orbs.map(() => false),
    bonus: 0,
    event: null, // { id, kind, points }
    eventCount: 0,
  };
}

function emit(run, kind, points) {
  run.eventCount += 1;
  run.event = { id: run.eventCount, kind, points };
}

/**
 * Advance the run by one frame.
 * pos / prev: world positions of the drone now and one frame ago
 * drone: { crashed, batteryEmpty }
 */
export function stepRun(run, course, pos, prev, dt, drone) {
  if (run.status === 'finished' || run.status === 'failed') return run;

  if (run.status === 'ready') {
    if (pos[1] > 1.2) run.status = 'running';
    else return run;
  }

  run.time += dt;
  run.daylight = Math.max(0, run.daylight - dt);

  // gates: a gate counts when the drone crosses its plane (z)
  while (run.nextGate < course.gates.length && pos[2] <= course.gates[run.nextGate].z) {
    const g = course.gates[run.nextGate];
    const span = prev[2] - pos[2];
    const t = span > 1e-6 ? Math.min(1, Math.max(0, (prev[2] - g.z) / span)) : 1;
    const cx = prev[0] + (pos[0] - prev[0]) * t;
    const cy = prev[1] + (pos[1] - prev[1]) * t;
    const d = Math.hypot(cx - g.x, cy - g.y);

    if (d <= g.r) {
      const perfect = d <= g.r * 0.3;
      run.combo += 1;
      run.bestCombo = Math.max(run.bestCombo, run.combo);
      const multiplier = Math.min(5, 1 + Math.floor((run.combo - 1) / 3));
      const points = 100 * multiplier + (perfect ? 50 : 0);
      run.score += points;
      run.gatesPassed += 1;
      if (perfect) run.perfects += 1;
      run.gateState[run.nextGate] = perfect ? 'perfect' : 'passed';
      emit(run, perfect ? 'perfect' : 'pass', points);
    } else {
      run.combo = 0;
      run.gatesMissed += 1;
      run.gateState[run.nextGate] = 'missed';
      emit(run, 'miss', 0);
    }
    run.nextGate += 1;
  }

  // orbs
  for (let i = 0; i < course.orbs.length; i += 1) {
    if (run.orbTaken[i]) continue;
    const o = course.orbs[i];
    if (Math.hypot(pos[0] - o.x, pos[1] - o.y, pos[2] - o.z) <= ORB_PICKUP) {
      run.orbTaken[i] = true;
      run.orbs += 1;
      run.score += 25;
      run.daylight = Math.min(run.daylightMax, run.daylight + DAYLIGHT_BONUS_ORB);
      emit(run, 'orb', 25);
    }
  }

  if (run.nextGate >= course.gates.length) {
    run.status = 'finished';
    run.bonus = Math.round(run.daylight * 5) + (run.gatesMissed === 0 ? 500 : 0);
    run.score += run.bonus;
    emit(run, 'finish', run.bonus);
  } else if (drone.crashed) {
    run.status = 'failed';
    run.reason = 'crash';
  } else if (drone.batteryEmpty) {
    run.status = 'failed';
    run.reason = 'battery';
  } else if (run.daylight <= 0) {
    run.status = 'failed';
    run.reason = 'sunset';
  }
  return run;
}

export function starsOf(run, course) {
  if (run.status !== 'finished') return 0;
  const ratio = run.gatesPassed / course.gates.length;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  return 1;
}

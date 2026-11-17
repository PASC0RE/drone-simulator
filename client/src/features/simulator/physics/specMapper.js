import { GRAVITY } from './constants.js';

/**
 * Converts the database specs (weight, maxSpeed, batteryLife) into the
 * parameters used by flightModel.js. This is what makes every drone feel different.
 *
 * Units: weight [kg], maxSpeed [km/h], batteryLife [minutes]
 */
export const DEFAULT_SPECS = { weight: 1.4, maxSpeed: 68, batteryLife: 38 };

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (v, fallback) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : fallback);
const rad = (deg) => (deg * Math.PI) / 180;

export function mapSpecsToPhysics(specs) {
  const mass = num(specs?.weight, DEFAULT_SPECS.weight);
  const maxSpeed = num(specs?.maxSpeed, DEFAULT_SPECS.maxSpeed) / 3.6; // m/s
  const batteryMinutes = num(specs?.batteryLife, DEFAULT_SPECS.batteryLife);

  const logMass = Math.log(1 + mass);

  // --- thrust: lighter drones have more spare power (thrust-to-weight ratio)
  const twr = clamp(2.6 - 0.35 * logMass, 1.4, 2.6);
  const hoverThrust = mass * GRAVITY;
  const maxThrust = twr * hoverThrust;

  // --- tilt & drag: reaching `maxSpeed` in level flight needs exactly `maxTilt`
  //     g*tan(tilt) = c1*v + c2*v^2   (linear + quadratic air drag)
  // lighter drones are more agile and may tilt harder (micro ~41 deg, heavy UAV ~29 deg)
  const maxTilt = rad(clamp(42 - 4 * logMass, 25, 42));
  const gTan = GRAVITY * Math.tan(maxTilt);
  const c1 = Math.min(0.15, (0.5 * gTan) / maxSpeed);
  const c2 = (gTan - c1 * maxSpeed) / (maxSpeed * maxSpeed);

  return {
    mass,
    maxSpeed,
    twr,
    hoverThrust,
    maxThrust,
    maxTilt,
    c1,
    c2,

    // vertical speed limits used by altitude-hold (assist) mode
    maxClimb: 2 + (twr - 1) * 3,
    maxDescent: 3,
    altKp: 3,

    // attitude response: spring-damper with natural frequency wn (heavier = slower)
    wn: clamp(11 - 1.8 * logMass, 4, 11),
    zeta: 0.9,
    maxYawRate: rad(clamp(140 - 20 * logMass, 60, 140)),

    // motors need a moment to spin up/down
    motorTau: clamp(0.05 + 0.03 * logMass, 0.05, 0.2),

    // battery: % per second while hovering (= 100% / flight time)
    drainPerSecAtHover: 100 / (batteryMinutes * 60),

    // faster than this when hitting something = crash
    crashSpeed: 7,
  };
}

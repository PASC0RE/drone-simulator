import { mapSpecsToPhysics } from '../../simulator/physics/specMapper.js';
import { t } from '../../../i18n/index.js';

// Category is worked out from the specs, so new drones in the database
// are sorted without any code change.
export const CLASS_KEYS = ['racing', 'camera', 'scout', 'micro', 'utility', 'heavy', 'fixedwing', 'patrol'];
export const classLabel = (key) => t(`cls.${key}`);
export const classBlurb = (key) => t(`blurb.${key}`);

export function categoryOf(d) {
  const name = (d.name || '').toLowerCase();
  if (name.includes('fixed-wing')) return 'fixedwing';
  if (d.weight < 0.5) return 'micro';
  if (d.weight <= 1 && d.maxSpeed >= 100) return 'racing';
  if (d.weight >= 15) return 'heavy';
  if (name.includes('cinema') || name.includes('camera')) return 'camera';
  if (d.type === 'MILITARY' && d.batteryLife >= 50) return 'patrol';
  if (name.includes('recon') || name.includes('scout') || d.maxSpeed >= 100) return 'scout';
  if (d.type === 'MILITARY') return 'scout';
  return 'utility';
}

// Short name for list rows: "Falcon R4 Recon Quadcopter" -> "Falcon R4"
export function shortName(d) {
  const words = (d.name || '').split(' ');
  return words.slice(0, words[1] && /^[A-Z0-9-]{2,}\d?$/.test(words[1]) ? 2 : 1).join(' ');
}

export function typeLabel(d) {
  return t(d.type === 'MILITARY' ? 'type.military' : 'type.civilian');
}

/** Flight characteristics worked out by the same code the simulator uses. */
export function flightProfile(d) {
  const p = mapSpecsToPhysics(d);
  return {
    physics: p,
    topSpeedKmh: Math.round(d.maxSpeed),
    climbMs: +p.maxClimb.toFixed(1),
    powerRatio: +p.twr.toFixed(1),
    tiltDeg: Math.round((p.maxTilt * 180) / Math.PI),
    turnDegS: Math.round((p.maxYawRate * 180) / Math.PI),
    response: p.wn,
  };
}

// Maximums over the whole list -> every bar is relative to the other drones.
export function scaleOf(drones) {
  const max = (fn) => Math.max(1e-6, ...drones.map(fn));
  return {
    speed: max((d) => d.maxSpeed),
    battery: max((d) => d.batteryLife),
    agility: max((d) => flightProfile(d).physics.wn * flightProfile(d).physics.maxYawRate),
    weight: max((d) => d.weight),
  };
}

export function barsOf(d, scale) {
  const p = flightProfile(d).physics;
  return {
    speed: d.maxSpeed / scale.speed,
    battery: d.batteryLife / scale.battery,
    agility: (p.wn * p.maxYawRate) / scale.agility,
    // weight on a log scale, so a 0.18 kg micro drone is still visible next to a 25 kg one
    weight: Math.log(1 + d.weight) / Math.log(1 + scale.weight),
  };
}

export const mins = (m) => {
  if (m < 60) return `${m} ${t('u.min')}`;
  const h = Math.floor(m / 60);
  const rest = Math.round(m % 60);
  return rest ? `${h} ${t('u.h')} ${rest} ${t('u.min')}` : `${h} ${t('u.h')}`;
};
export const kg = (w) => (w < 1 ? `${Math.round(w * 1000)} ${t('u.g')}` : `${w} ${t('u.kg')}`);

// Look of each drone: used by the 3D placeholder and the SVG thumbnails.
const LOOK = {
  racing: { rotors: 4, arm: 0.42, rotorR: 0.17, body: 0.3, color: '#FF8A1F' },
  camera: { rotors: 4, arm: 0.6, rotorR: 0.26, body: 0.5, color: '#CFE8F5' },
  scout: { rotors: 4, arm: 0.5, rotorR: 0.22, body: 0.4, color: '#7C8F6A' },
  micro: { rotors: 4, arm: 0.2, rotorR: 0.09, body: 0.16, color: '#E7C94A' },
  utility: { rotors: 4, arm: 0.7, rotorR: 0.3, body: 0.55, color: '#3FA7D6' },
  heavy: { rotors: 6, arm: 0.95, rotorR: 0.36, body: 0.7, color: '#E5E9EC' },
  patrol: { rotors: 8, arm: 0.9, rotorR: 0.3, body: 0.6, color: '#566573' },
  fixedwing: { rotors: 0, arm: 1.2, rotorR: 0.2, body: 0.4, color: '#9AA7B4' },
};

export function visualOf(d) {
  const category = categoryOf(d);
  return { category, ...LOOK[category] };
}

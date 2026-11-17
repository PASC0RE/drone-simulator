// event.code = PHYSICAL key, so it works with any keyboard layout (including Cyrillic)
export const KEY_BINDINGS = {
  forward:      ['KeyW'],
  backward:     ['KeyS'],
  left:         ['KeyA'],
  right:        ['KeyD'],
  throttleUp:   ['ArrowUp', 'Space'],
  throttleDown: ['ArrowDown', 'ShiftLeft', 'ShiftRight'],
  yawLeft:      ['KeyQ', 'ArrowLeft'],
  yawRight:     ['KeyE', 'ArrowRight'],
};

export const ACTION_KEYS = {
  toggleAssist: 'KeyH',
  reset: 'KeyR',
  toggleCamera: 'KeyC',
  toggleScheme: 'KeyT',
  toggleAutopilot: 'KeyP',
};

export const CONTROL_CODES = new Set([
  ...Object.values(KEY_BINDINGS).flat(),
  ...Object.values(ACTION_KEYS),
]);

const held = (pressed, action) => KEY_BINDINGS[action].some((code) => pressed.has(code));

const any = (pressed, codes) => codes.some((c) => pressed.has(c));

/**
 * Set of pressed key codes -> axes in the range -1..1
 *  scheme 'standard': A/D = roll (slide sideways), Q/E = yaw (turn)
 *  scheme 'arcade'  : A/D = yaw (turn),            Q/E = roll (slide sideways)
 */
export function axesFromKeys(pressed, scheme = 'standard') {
  const ad = (any(pressed, ['KeyD']) ? 1 : 0) - (any(pressed, ['KeyA']) ? 1 : 0);
  const qe = (any(pressed, ['KeyE']) ? 1 : 0) - (any(pressed, ['KeyQ']) ? 1 : 0);
  const arrows = (pressed.has('ArrowRight') ? 1 : 0) - (pressed.has('ArrowLeft') ? 1 : 0);

  const arcade = scheme === 'arcade';
  return {
    forward: (held(pressed, 'forward') ? 1 : 0) - (held(pressed, 'backward') ? 1 : 0),
    right: arcade ? qe : ad,
    throttle: (held(pressed, 'throttleUp') ? 1 : 0) - (held(pressed, 'throttleDown') ? 1 : 0),
    yawRight: clampAxis((arcade ? ad : qe) + arrows),
  };
}

const clampAxis = (v) => Math.max(-1, Math.min(1, v));

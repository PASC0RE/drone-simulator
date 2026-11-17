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
};

export const CONTROL_CODES = new Set([
  ...Object.values(KEY_BINDINGS).flat(),
  ...Object.values(ACTION_KEYS),
]);

const held = (pressed, action) => KEY_BINDINGS[action].some((code) => pressed.has(code));

/** Set of pressed key codes -> axes in the range -1..1 */
export function axesFromKeys(pressed) {
  return {
    forward: (held(pressed, 'forward') ? 1 : 0) - (held(pressed, 'backward') ? 1 : 0),
    right: (held(pressed, 'right') ? 1 : 0) - (held(pressed, 'left') ? 1 : 0),
    throttle: (held(pressed, 'throttleUp') ? 1 : 0) - (held(pressed, 'throttleDown') ? 1 : 0),
    yawRight: (held(pressed, 'yawRight') ? 1 : 0) - (held(pressed, 'yawLeft') ? 1 : 0),
  };
}

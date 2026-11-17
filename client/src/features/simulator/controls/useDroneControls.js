import { useEffect, useRef } from 'react';
import { ACTION_KEYS, CONTROL_CODES } from './keymap.js';
import { useSimulatorStore } from '../store/simulatorStore.js';

/**
 * Registers the keyboard listeners and returns a ref to the Set of currently
 * pressed key codes. The physics loop reads it every frame (no React re-renders).
 */
export function useDroneControls() {
  const pressed = useRef(new Set());

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return; // don't break browser shortcuts (Ctrl+R ...)
      if (!CONTROL_CODES.has(e.code)) return;

      e.preventDefault(); // stop Space/arrows from scrolling or clicking a focused button
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body) active.blur();

      if (e.repeat) return;

      if (e.code === ACTION_KEYS.toggleAssist) useSimulatorStore.getState().toggleAssist();
      else if (e.code === ACTION_KEYS.toggleAutopilot) useSimulatorStore.getState().toggleAutopilot();
      else if (e.code === ACTION_KEYS.toggleScheme) useSimulatorStore.getState().toggleScheme();
      else if (e.code === ACTION_KEYS.toggleCamera) useSimulatorStore.getState().toggleCameraMode();
      else if (e.code === ACTION_KEYS.reset) useSimulatorStore.getState().requestReset();
      else pressed.current.add(e.code);
    };

    const onKeyUp = (e) => pressed.current.delete(e.code);
    const releaseAll = () => pressed.current.clear(); // avoids "stuck keys" when the tab loses focus

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', releaseAll);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseAll);
      document.removeEventListener('visibilitychange', releaseAll);
    };
  }, []);

  return pressed;
}

import { useSimulatorStore } from '../store/simulatorStore.js';

const COMMON = [
  ['W / S', 'Pitch forward / back'],
  ['Space / ↑', 'Throttle up'],
  ['Shift / ↓', 'Throttle down'],
];
const STANDARD = [
  ['A / D', 'Roll (slide left / right)'],
  ['Q / E', 'Turn left / right'],
];
const ARCADE = [
  ['A / D', 'Turn left / right'],
  ['Q / E', 'Slide left / right'],
];
const OTHER = [
  ['P', 'Autopilot / waypoints'],
  ['T', 'Swap A/D and Q/E'],
  ['H', 'Altitude hold on/off'],
  ['Mouse drag', 'Orbit camera 360°'],
  ['Wheel', 'Zoom'],
  ['C', 'Camera: chase / orbit'],
  ['R', 'Reset'],
];

export default function ControlsHelp() {
  const scheme = useSimulatorStore((s) => s.controlScheme);
  const rows = [...COMMON, ...(scheme === 'arcade' ? ARCADE : STANDARD), ...OTHER];

  return (
    <div className="panel help">
      <strong>Controls ({scheme})</strong>
      <table>
        <tbody>
          {rows.map(([key, action]) => (
            <tr key={key}>
              <td><kbd>{key}</kbd></td>
              <td>{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

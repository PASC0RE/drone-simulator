import { useSimulatorStore } from '../store/simulatorStore.js';
import { useT } from '../../../i18n/index.js';

export const COMMON = [
  ['W / S', 'k.pitch'],
  ['Space / ↑', 'k.up'],
  ['Shift / ↓', 'k.down'],
];
export const STANDARD = [
  ['A / D', 'k.roll'],
  ['Q / E', 'k.turn'],
];
export const ARCADE = [
  ['A / D', 'k.turn'],
  ['Q / E', 'k.slide'],
];
export const OTHER = [
  ['P', 'k.autopilot'],
  ['T', 'k.scheme'],
  ['H', 'k.hold'],
  ['kk.drag', 'k.orbit'],
  ['kk.wheel', 'k.zoom'],
  ['C', 'k.cam'],
  ['R', 'k.reset'],
];

export default function ControlsHelp({ hideAutopilot = false }) {
  const t = useT();
  const scheme = useSimulatorStore((s) => s.controlScheme);
  const rows = [...COMMON, ...(scheme === 'arcade' ? ARCADE : STANDARD), ...OTHER].filter(([key]) => !(hideAutopilot && key === 'P'));

  return (
    <div className="panel help">
      <strong>{t('ctl.title', { scheme: t(`scheme.${scheme}`) })}</strong>
      <table>
        <tbody>
          {rows.map(([key, action]) => (
            <tr key={key}>
              <td><kbd>{t(key)}</kbd></td>
              <td>{t(action)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

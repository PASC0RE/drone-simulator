const ROWS = [
  ['W / S', 'Pitch forward / back'],
  ['A / D', 'Roll left / right'],
  ['Space / ↑', 'Throttle up'],
  ['Shift / ↓', 'Throttle down'],
  ['Q / E', 'Yaw left / right'],
  ['H', 'Altitude hold on/off'],
  ['Mouse drag', 'Orbit camera 360°'],
  ['Wheel', 'Zoom'],
  ['C', 'Camera: chase / orbit'],
  ['R', 'Reset'],
];

export default function ControlsHelp() {
  return (
    <div className="panel help">
      <strong>Controls</strong>
      <table>
        <tbody>
          {ROWS.map(([key, action]) => (
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

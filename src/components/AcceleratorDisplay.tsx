import type { AccelResult } from '../lib/pe';

interface AcceleratorDisplayProps {
  accelerators: AccelResult[];
}

export function AcceleratorDisplay({ accelerators }: AcceleratorDisplayProps) {
  return (
    <>
      {accelerators.map((accel, i) => {
        const idText = accel.name ? `"${accel.name}"` : `#${accel.id}`;
        return (
          <div key={i} class="w-full mb-3">
            <div class="text-[11px] text-gray-400 mb-1">Table des accélérateurs {idText}</div>
            <table class="data-table">
              <thead>
                <tr><th>Touche</th><th>ID de commande</th></tr>
              </thead>
              <tbody>
                {accel.entries.map((e, j) => (
                  <tr key={j}>
                    <td>{e.keyName}</td>
                    <td>{e.cmd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}

import { useState } from 'preact/hooks';
import type { ImportResult } from '../lib/pe';

interface ImportTableDisplayProps {
  imports: ImportResult[];
}

export function ImportTableDisplay({ imports }: ImportTableDisplayProps) {
  return (
    <>
      {imports.map((imp, i) => (
        <ImportDll key={i} imp={imp} />
      ))}
    </>
  );
}

function ImportDll({ imp }: { imp: ImportResult }) {
  const [open, setOpen] = useState(false);

  return (
    <div class="w-full mb-3">
      <button
        class="text-left text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer bg-transparent border-0 p-0"
        onClick={() => setOpen(!open)}
      >
        <span class="inline-block w-4 text-gray-400">{open ? '▾' : '▸'}</span>
        {imp.dll}
        <span class="text-gray-400 font-normal ml-1">({imp.functions.length})</span>
      </button>
      {open && (
        <table class="data-table mt-1">
          <thead>
            <tr><th>Fonction</th><th>Ordinal</th><th>Indice</th></tr>
          </thead>
          <tbody>
            {imp.functions.map((fn, j) => (
              <tr key={j}>
                <td>{fn.name ?? '(par ordinal)'}</td>
                <td>{fn.ordinal != null ? fn.ordinal : ''}</td>
                <td>{fn.hint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

import type { ExportResult } from '../lib/pe';

interface ExportTableDisplayProps {
  exports: ExportResult;
}

export function ExportTableDisplay({ exports: exp }: ExportTableDisplayProps) {
  return (
    <div class="w-full mb-3">
      <div class="text-[11px] text-gray-400 mb-1">
        {exp.dll} — {exp.functions.length} fonction(s)
      </div>
      <table class="data-table">
        <thead>
          <tr><th>Ordinal</th><th>Nom</th><th>RVA</th><th>Redirigée vers</th></tr>
        </thead>
        <tbody>
          {exp.functions.map((fn, i) => (
            <tr key={i}>
              <td>{fn.ordinal}</td>
              <td>{fn.name ?? ''}</td>
              <td>0x{fn.rva.toString(16).padStart(8, '0')}</td>
              <td>{fn.forwardedTo ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

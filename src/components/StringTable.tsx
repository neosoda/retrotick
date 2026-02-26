import type { StringResult } from '../lib/pe';
import { langToHtmlLang } from '../lib/lang';

interface StringTableProps {
  strings: StringResult[];
}

export function StringTable({ strings }: StringTableProps) {
  return (
    <table class="data-table">
      <thead>
        <tr><th>ID</th><th>String</th></tr>
      </thead>
      <tbody>
        {strings.map((s, i) => (
          <tr key={i}>
            <td>{s.id}</td>
            <td lang={langToHtmlLang(s.languageId) || undefined}>{s.string}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

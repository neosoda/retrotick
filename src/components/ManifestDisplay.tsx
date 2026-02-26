import type { ManifestResult } from '../lib/pe';
import { langToHtmlLang } from '../lib/lang';

interface ManifestDisplayProps {
  manifests: ManifestResult[];
}

export function ManifestDisplay({ manifests }: ManifestDisplayProps) {
  return (
    <>
      {manifests.map((m, i) => {
        const idText = m.name ? `"${m.name}"` : `#${m.id}`;
        return (
          <div key={i} class="text-card">
            <div class="text-[11px] text-gray-400 mb-1.5">Manifest {idText}</div>
            <pre lang={langToHtmlLang(m.languageId) || undefined}>{m.text}</pre>
          </div>
        );
      })}
    </>
  );
}

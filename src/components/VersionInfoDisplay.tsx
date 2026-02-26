import type { VersionResult } from '../lib/pe';
import { langToHtmlLang } from '../lib/lang';

interface VersionInfoDisplayProps {
  versionInfos: VersionResult[];
}

export function VersionInfoDisplay({ versionInfos }: VersionInfoDisplayProps) {
  return (
    <>
      {versionInfos.map((vi, i) => (
        <table key={i} class="data-table" lang={langToHtmlLang(vi.languageId) || undefined}>
          <tbody>
            {vi.fixedInfo && Object.entries(vi.fixedInfo).map(([key, val]) => (
              <tr key={key}>
                <th class="bg-gray-100 font-semibold whitespace-nowrap w-[1%]">{key}</th>
                <td>{val}</td>
              </tr>
            ))}
            {Object.entries(vi.strings).map(([key, val]) => (
              <tr key={key}>
                <th class="bg-gray-100 font-semibold whitespace-nowrap w-[1%]">{key}</th>
                <td>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </>
  );
}

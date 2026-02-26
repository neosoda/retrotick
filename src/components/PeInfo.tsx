import type { PEInfo } from '../lib/pe';

interface PeInfoProps {
  peInfo: PEInfo;
}

export function PeInfoDisplay({ peInfo }: PeInfoProps) {
  const machine = peInfo.isNE ? 'Win16'
    : peInfo.coffHeader.machine === 0x014C ? 'i386'
    : peInfo.coffHeader.machine === 0x8664 ? 'x86-64'
    : `0x${peInfo.coffHeader.machine.toString(16)}`;
  const format = peInfo.isNE ? 'NE (Win16)' : peInfo.optionalHeader.isPE32Plus ? 'PE32+' : 'PE32';
  const sectionNames = peInfo.isNE ? 'N/A' : peInfo.sections.map(s => s.name).join(', ');
  const typeList = peInfo.resources
    ? peInfo.resources.map(r => `${r.typeLabel} (${r.entries.length})`).join(', ')
    : 'None';

  return (
    <span style={{ font: '11px Tahoma, sans-serif', color: '#808080' }}>
      {format} | {machine}
    </span>
  );
}

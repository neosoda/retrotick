import type { ComponentChildren } from 'preact';

interface ResourceCardProps {
  label: string;
  children: ComponentChildren;
  textAlign?: 'center' | 'left';
}

export function ResourceCard({ label, children, textAlign = 'center' }: ResourceCardProps) {
  return (
    <div
      class="bg-white border border-gray-200 rounded-lg p-2 shadow-sm"
      style={{ textAlign }}
    >
      {children}
      <div class="text-[11px] text-gray-400 whitespace-nowrap">{label}</div>
    </div>
  );
}

import type { ComponentChildren } from 'preact';

interface GroupBoxProps {
  children: ComponentChildren;
  label: ComponentChildren;
  fontCSS: string;
  bgColor?: string | null;
}

export function GroupBox({ children, label, fontCSS, bgColor }: GroupBoxProps) {
  const m = fontCSS.match(/^(\d+)px/);
  const frameTop = Math.round((m ? parseInt(m[1]) : 11) / 2);
  const bg = bgColor || '#D4D0C8';

  return (
    <>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: `${frameTop}px`, bottom: 0,
        border: '1px solid', borderColor: '#808080 #FFF #FFF #808080',
        boxShadow: 'inset 1px 1px 0 #FFF, inset -1px -1px 0 #808080',
      }} />
      <span style={{
        position: 'absolute', top: 0, left: `${frameTop + 2}px`, background: bg,
        padding: '0 2px', font: fontCSS,
      }}>
        {label}
      </span>
      {children}
    </>
  );
}

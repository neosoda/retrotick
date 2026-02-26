interface HotKeyProps {
  fontCSS: string;
}

export function HotKey({ fontCSS }: HotKeyProps) {
  return (
    <div style={{
      width: '100%', height: '100%', background: '#FFF', boxSizing: 'border-box',
      border: '1px solid', borderColor: '#808080 #FFF #FFF #808080',
      boxShadow: 'inset 1px 1px 0 #404040, inset -1px -1px 0 #D4D0C8',
      padding: '1px 2px', font: fontCSS, color: '#000',
      display: 'flex', alignItems: 'center',
      overflow: 'hidden', whiteSpace: 'nowrap',
    }}>
      <span style={{ color: '#808080' }}>None</span>
    </div>
  );
}

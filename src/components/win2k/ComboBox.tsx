interface ComboBoxProps {
  text?: string;
  fontCSS: string;
  fontColor?: string | null;
}

export function ComboBox({ text, fontCSS, fontColor }: ComboBoxProps) {
  const fontPx = parseInt(fontCSS) || 11;
  return (
    <div style={{ display: 'flex', width: '100%', height: `${fontPx + 8}px` }}>
      <div style={{
        flex: 1, background: '#FFF', boxSizing: 'border-box',
        border: '1px solid', borderColor: '#808080 #FFF #FFF #808080',
        boxShadow: 'inset 1px 1px 0 #404040',
        padding: '1px 2px', font: fontCSS,
        ...(fontColor ? { color: fontColor } : {}),
        overflow: 'hidden', whiteSpace: 'nowrap',
      }}>
        {text || ''}
      </div>
      <div style={{
        width: '16px', background: '#D4D0C8', flexShrink: 0,
        border: '1px solid', borderColor: '#FFF #404040 #404040 #FFF',
        boxShadow: 'inset 1px 1px 0 #D4D0C8, inset -1px -1px 0 #808080',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        font: '8px/1 sans-serif', color: '#000',
      }}>
        {'\u25BC'}
      </div>
    </div>
  );
}

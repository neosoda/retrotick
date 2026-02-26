interface TreeViewProps {
  style: number;
  fontCSS: string;
}

const TVS_HASBUTTONS = 0x0001;
const TVS_HASLINES = 0x0002;
const TVS_LINESATROOT = 0x0004;

export function TreeView({ style, fontCSS }: TreeViewProps) {
  const hasButtons = !!(style & TVS_HASBUTTONS);
  const hasLines = !!(style & TVS_HASLINES);
  const linesAtRoot = !!(style & TVS_LINESATROOT);

  const indent = linesAtRoot ? 19 : 0;
  const lineColor = '#A0A0A0';
  const dotPattern = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg width='2' height='2' xmlns='http://www.w3.org/2000/svg'><rect x='0' y='0' width='1' height='1' fill='${lineColor}'/></svg>`
  )}")`;

  return (
    <div style={{
      width: '100%', height: '100%', background: '#FFF', boxSizing: 'border-box',
      border: '1px solid', borderColor: '#808080 #FFF #FFF #808080',
      boxShadow: 'inset 1px 1px 0 #404040, inset -1px -1px 0 #D4D0C8',
      overflow: 'hidden', position: 'relative', font: fontCSS,
    }}>
      {/* Decorative placeholder tree items */}
      <div style={{ padding: '2px 0' }}>
        {renderItem('Item 1', 0, true, true, hasButtons, hasLines, linesAtRoot, indent, dotPattern)}
        {renderItem('Sub-item', 1, false, false, hasButtons, hasLines, linesAtRoot, indent, dotPattern)}
      </div>
    </div>
  );
}

function renderItem(
  text: string, level: number, expanded: boolean, hasChildren: boolean,
  hasButtons: boolean, hasLines: boolean, linesAtRoot: boolean,
  rootIndent: number, dotPattern: string,
) {
  const itemIndent = rootIndent + level * 19;
  const btnSize = 9;
  const btnLeft = itemIndent + 5;
  const textLeft = itemIndent + 19;

  return (
    <div style={{
      position: 'relative', height: '16px',
      display: 'flex', alignItems: 'center',
      whiteSpace: 'nowrap', overflow: 'hidden',
    }}>
      {hasLines && (
        <div style={{
          position: 'absolute', left: `${btnLeft + 4}px`, top: 0,
          width: '1px', height: hasChildren ? '8px' : '50%',
          backgroundImage: dotPattern, backgroundRepeat: 'repeat-y',
        }} />
      )}
      {hasLines && (
        <div style={{
          position: 'absolute', left: `${btnLeft + 4}px`, top: '8px',
          width: `${textLeft - btnLeft - 4}px`, height: '1px',
          backgroundImage: dotPattern, backgroundRepeat: 'repeat-x',
        }} />
      )}
      {hasButtons && hasChildren && (
        <div style={{
          position: 'absolute', left: `${btnLeft}px`, top: '4px',
          width: `${btnSize}px`, height: `${btnSize}px`, boxSizing: 'border-box',
          border: '1px solid #808080', background: '#FFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '9px', lineHeight: '1', color: '#000', fontFamily: 'monospace',
        }}>
          {expanded ? '\u2212' : '+'}
        </div>
      )}
      <span style={{ marginLeft: `${textLeft}px`, fontSize: '11px' }}>{text}</span>
    </div>
  );
}

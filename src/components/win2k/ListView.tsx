interface ListViewProps {
  style: number;
  width: number;
  height: number;
  fontCSS: string;
}

const LVS_TYPEMASK = 0x0003;
const LVS_REPORT = 0x0001;
const LVS_NOCOLUMNHEADER = 0x4000;

export function ListView({ style, width, height, fontCSS }: ListViewProps) {
  const viewType = style & LVS_TYPEMASK;
  const isReport = viewType === LVS_REPORT;
  const noColumnHeader = !!(style & LVS_NOCOLUMNHEADER);
  const headerHeight = 18;

  return (
    <div style={{
      width: '100%', height: '100%', background: '#FFF', boxSizing: 'border-box',
      border: '1px solid', borderColor: '#808080 #FFF #FFF #808080',
      boxShadow: 'inset 1px 1px 0 #404040, inset -1px -1px 0 #D4D0C8',
      overflow: 'hidden', position: 'relative',
    }}>
      {isReport && !noColumnHeader && (
        <div style={{
          display: 'flex', height: `${headerHeight}px`, background: '#D4D0C8',
          borderBottom: '1px solid #808080', font: fontCSS,
        }}>
          <div style={{
            flex: 1, height: '100%', boxSizing: 'border-box',
            border: '1px solid', borderColor: '#FFF #404040 #404040 #FFF',
            boxShadow: 'inset -1px -1px 0 #808080',
            padding: '0 4px', display: 'flex', alignItems: 'center',
            whiteSpace: 'nowrap', overflow: 'hidden',
            fontSize: '11px',
          }}>
            Nom
          </div>
          {width > 120 && (
            <div style={{
              width: `${Math.min(80, Math.floor(width * 0.3))}px`, height: '100%',
              boxSizing: 'border-box',
              border: '1px solid', borderColor: '#FFF #404040 #404040 #FFF',
              boxShadow: 'inset -1px -1px 0 #808080',
              padding: '0 4px', display: 'flex', alignItems: 'center',
              whiteSpace: 'nowrap', overflow: 'hidden',
              fontSize: '11px',
            }}>
              Taille
            </div>
          )}
        </div>
      )}
    </div>
  );
}

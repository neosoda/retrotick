import type { ComponentChildren } from 'preact';

interface TabControlProps {
  tabs: { text: string }[];
  selectedIndex?: number;
  font?: string;
  height?: number;
  onTabClick?: (index: number) => void;
  children?: ComponentChildren;
}

const TAB_ROW_HEIGHT = 21;

export function TabControl({ tabs, selectedIndex = 0, font, height, onTabClick, children }: TabControlProps) {
  const fontStyle = font || '11px "Tahoma", "MS Sans Serif", sans-serif';

  const panelStyle = {
    background: '#D4D0C8',
    border: '1px solid',
    borderColor: '#FFF #404040 #404040 #FFF',
    boxShadow: 'inset 1px 1px 0 #D4D0C8, inset -1px -1px 0 #808080',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ background: '#D4D0C8', width: '100%', height: '100%', position: 'relative' }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        height: `${TAB_ROW_HEIGHT}px`,
        position: 'relative',
        zIndex: 1,
      }}>
        {tabs.map((tab, i) => {
          const active = i === selectedIndex;
          const first = i === 0;
          return (
            <div
              key={i}
              onClick={onTabClick ? () => onTabClick(i) : undefined}
              style={{
                font: fontStyle,
                cursor: 'var(--win2k-cursor)',
                whiteSpace: 'nowrap',
                background: '#D4D0C8',
                position: 'relative',
                zIndex: active ? 2 : 0,
                padding: active ? '3px 8px 2px' : '1px 6px 2px',
                marginTop: active ? '0px' : '2px',
                marginLeft: active ? (first ? '0px' : '-2px') : (first ? '2px' : '0px'),
                marginRight: active ? '-2px' : '0px',
                marginBottom: active ? '-1px' : '0px',
                borderTop: '1px solid #FFF',
                borderLeft: '1px solid #FFF',
                borderRight: '1px solid #404040',
                borderBottom: active ? '1px solid #D4D0C8' : 'none',
                boxShadow: 'inset 1px 1px 0 #D4D0C8, inset -1px 0 0 #808080',
              }}
            >
              {tab.text}
            </div>
          );
        })}
      </div>
      {height != null ? (
        <div style={{ ...panelStyle, position: 'relative', width: '100%', height: `${height - TAB_ROW_HEIGHT - 1}px`, overflow: 'hidden' }}>
          {children}
        </div>
      ) : (
        <div style={{ ...panelStyle, position: 'absolute', left: 0, right: 0, top: `${TAB_ROW_HEIGHT}px`, bottom: 0 }}>
          {children}
        </div>
      )}
    </div>
  );
}

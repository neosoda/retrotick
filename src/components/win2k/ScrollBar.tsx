interface ScrollBarProps {
  isVert: boolean;
}

function ScrollBtn({ ch, isVert }: { ch: string; isVert: boolean }) {
  return (
    <div style={{
      ...(isVert ? { width: '100%', height: '16px' } : { height: '100%', width: '16px' }),
      background: '#D4D0C8', border: '1px solid', borderColor: '#FFF #404040 #404040 #FFF',
      boxShadow: 'inset 1px 1px 0 #D4D0C8, inset -1px -1px 0 #808080',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      font: '8px/1 sans-serif', color: '#000', flexShrink: 0,
    }}>
      {ch}
    </div>
  );
}

export function ScrollBar({ isVert }: ScrollBarProps) {
  const track = (
    <div style={{
      flex: 1,
      background: 'repeating-conic-gradient(#D4D0C8 0% 25%, #FFF 0% 50%) 0 0/4px 4px',
    }} />
  );

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#D4D0C8', display: 'flex',
      flexDirection: isVert ? 'column' : 'row',
    }}>
      {isVert ? (
        <>
          <ScrollBtn ch={'\u25B2'} isVert />
          {track}
          <ScrollBtn ch={'\u25BC'} isVert />
        </>
      ) : (
        <>
          <ScrollBtn ch={'\u25C4'} isVert={false} />
          {track}
          <ScrollBtn ch={'\u25BA'} isVert={false} />
        </>
      )}
    </div>
  );
}

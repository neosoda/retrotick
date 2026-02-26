interface TrackbarProps {
  style: number;
  width: number;
  height: number;
  pos?: number;
  min?: number;
  max?: number;
}

export function Trackbar({ style: s, width, height, pos = 0, min = 0, max = 100 }: TrackbarProps) {
  const TBS_VERT = 0x02, TBS_NOTICKS = 0x10, TBS_BOTH = 0x08, TBS_TOP = 0x04;
  const isVert = !!(s & TBS_VERT);
  const noTicks = !!(s & TBS_NOTICKS);
  const ticksBoth = !!(s & TBS_BOTH);
  const ticksTop = !!(s & TBS_TOP);

  const trackLen = isVert ? height : width;
  const thumbW = 11;
  const thumbH = 21;
  const trackThick = 4;
  const usableLen = trackLen - 16 - thumbW;

  // Compute thumb position as fraction of range
  const range = max - min;
  const frac = range > 0 ? Math.max(0, Math.min(1, (pos - min) / range)) : 0;
  const thumbOffset = Math.round(frac * usableLen);

  const ticks = [];
  if (!noTicks) {
    const tickCount = 10;
    const len = trackLen - 16;
    for (let i = 0; i <= tickCount; i++) {
      const tpos = Math.round((i / tickCount) * (len - 2)) + 1;
      ticks.push(
        <div key={i} style={{
          position: 'absolute',
          ...(isVert
            ? {
                top: `${tpos}px`, height: '1px', background: '#000',
                ...(ticksBoth ? { left: 0, right: 0 } : ticksTop ? { left: 0, width: '4px' } : { right: 0, width: '4px' }),
              }
            : {
                left: `${tpos}px`, width: '1px', background: '#000',
                ...(ticksBoth ? { top: 0, bottom: 0 } : ticksTop ? { top: 0, height: '4px' } : { bottom: 0, height: '4px' }),
              }),
        }} />,
      );
    }
  }

  return (
    <div style={{
      width: '100%', height: '100%', background: '#D4D0C8',
      display: 'flex', flexDirection: isVert ? 'column' : 'row',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        position: 'relative',
        ...(isVert
          ? { height: `${trackLen - 16}px`, width: `${thumbH + 4}px` }
          : { width: `${trackLen - 16}px`, height: `${thumbH + 4}px` }),
      }}>
        {/* Channel */}
        <div style={{
          position: 'absolute',
          ...(isVert
            ? { left: '50%', top: '4px', bottom: '4px', width: `${trackThick}px`, marginLeft: `-${trackThick / 2}px` }
            : { top: '50%', left: '4px', right: '4px', height: `${trackThick}px`, marginTop: `-${trackThick / 2}px` }),
          border: '1px solid', borderColor: '#808080 #FFF #FFF #808080',
          boxShadow: 'inset 1px 1px 0 #404040',
        }} />
        {/* Thumb */}
        <div style={{
          position: 'absolute',
          ...(isVert
            ? { left: '50%', top: `${thumbOffset}px`, width: `${thumbH}px`, height: `${thumbW}px`, marginLeft: `-${thumbH / 2}px` }
            : { top: '50%', left: `${thumbOffset}px`, width: `${thumbW}px`, height: `${thumbH}px`, marginTop: `-${thumbH / 2}px` }),
          background: '#D4D0C8', border: '1px solid', borderColor: '#FFF #404040 #404040 #FFF',
          boxShadow: 'inset 1px 1px 0 #D4D0C8, inset -1px -1px 0 #808080',
        }} />
        {ticks}
      </div>
    </div>
  );
}

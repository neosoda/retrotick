interface ProgressProps {
  percent: number;
}

export function Progress({ percent }: ProgressProps) {
  return (
    <div style={{
      width: '100%', height: '100%',
      border: '1px solid', borderColor: '#808080 #FFF #FFF #808080',
      boxShadow: 'inset 1px 1px 0 #404040, inset -1px -1px 0 #D4D0C8',
      background: '#FFF', overflow: 'hidden', padding: '2px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: `${percent}%`, height: '100%',
        background: 'repeating-linear-gradient(to right, #316AC5 0px, #316AC5 8px, #FFF 8px, #FFF 10px)',
      }} />
    </div>
  );
}

interface UpDownProps {
  isHorz: boolean;
}

function UdBtn({ ch }: { ch: string }) {
  return (
    <div style={{
      flex: 1, background: '#D4D0C8',
      border: '1px solid', borderColor: '#FFF #404040 #404040 #FFF',
      boxShadow: 'inset 1px 1px 0 #D4D0C8, inset -1px -1px 0 #808080',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      font: '6px/1 sans-serif', color: '#000',
    }}>
      {ch}
    </div>
  );
}

export function UpDown({ isHorz }: UpDownProps) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: isHorz ? 'row' : 'column',
    }}>
      {isHorz ? (
        <>
          <UdBtn ch={'\u25C4'} />
          <UdBtn ch={'\u25BA'} />
        </>
      ) : (
        <>
          <UdBtn ch={'\u25B2'} />
          <UdBtn ch={'\u25BC'} />
        </>
      )}
    </div>
  );
}

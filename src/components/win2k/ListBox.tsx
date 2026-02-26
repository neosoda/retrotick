interface ListBoxProps {
  fontCSS: string;
}

export function ListBox({ fontCSS }: ListBoxProps) {
  return (
    <select multiple disabled style={{
      width: '100%', height: '100%', background: '#FFF', boxSizing: 'border-box',
      border: '1px solid', borderColor: '#808080 #FFF #FFF #808080',
      boxShadow: 'inset 1px 1px 0 #404040, inset -1px -1px 0 #D4D0C8',
      font: fontCSS,
    }} />
  );
}

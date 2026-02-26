const NAMED_COLORS: Record<string, string> = {
  clBlack: '#000', clMaroon: '#800000', clGreen: '#008000', clOlive: '#808000',
  clNavy: '#000080', clPurple: '#800080', clTeal: '#008080', clGray: '#808080',
  clSilver: '#C0C0C0', clRed: '#FF0000', clLime: '#00FF00', clYellow: '#FFFF00',
  clBlue: '#0000FF', clFuchsia: '#FF00FF', clAqua: '#00FFFF', clWhite: '#FFF',
  clNone: 'transparent', clDefault: '#D4D0C8',
  clScrollBar: '#C0C0C0', clBackground: '#0A246A', clActiveCaption: '#0A246A',
  clInactiveCaption: '#808080', clMenu: '#D4D0C8', clWindow: '#FFF',
  clWindowFrame: '#000', clMenuText: '#000', clWindowText: '#000',
  clCaptionText: '#FFF', clActiveBorder: '#D4D0C8', clInactiveBorder: '#D4D0C8',
  clAppWorkSpace: '#808080', clHighlight: '#0A246A', clHighlightText: '#FFF',
  clBtnFace: '#D4D0C8', clBtnShadow: '#808080', clGrayText: '#808080',
  clBtnText: '#000', clInactiveCaptionText: '#D4D0C8', clBtnHighlight: '#FFF',
  cl3DLight: '#D4D0C8', cl3DDkShadow: '#404040', clInfoText: '#000',
  clInfoBk: '#FFFFCC', clHotLight: '#0000FF',
  clMedGray: '#A0A0A0', clMoneyGreen: '#C0DCC0', clSkyBlue: '#A6CAF0', clCream: '#FFFBF0',
};

const SYS_COLORS: string[] = [
  '#C0C0C0', '#0A246A', '#0A246A', '#808080', '#D4D0C8', '#FFF',
  '#000', '#000', '#000', '#FFF', '#D4D0C8', '#D4D0C8',
  '#808080', '#0A246A', '#FFF', '#D4D0C8', '#808080', '#808080',
  '#000', '#D4D0C8', '#FFF', '#404040', '#000', '#FFFFCC',
  '#000', '#0000FF',
];

export function delphiColorToCSS(val: unknown): string | null {
  if (typeof val === 'string') {
    return NAMED_COLORS[val] || null;
  }
  if (typeof val !== 'number') return null;
  let c = val;
  if (c < 0) c = c + 0x100000000;
  if ((c & 0xFF000000) >= 0x80000000) {
    const idx = c & 0xFF;
    return SYS_COLORS[idx] || '#D4D0C8';
  }
  const r = c & 0xFF, g = (c >> 8) & 0xFF, b = (c >> 16) & 0xFF;
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

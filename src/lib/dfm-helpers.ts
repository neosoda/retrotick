import { delphiColorToCSS } from './delphi-colors';

export function dfmProp(props: Record<string, unknown>, name: string, def: unknown): unknown {
  return name in props ? props[name] : def;
}

export function dfmFontCSS(props: Record<string, unknown>): string {
  const name = dfmProp(props, 'Font.Name', 'Tahoma') as string;
  const height = dfmProp(props, 'Font.Height', -11) as number;
  const size = dfmProp(props, 'Font.Size', 0) as number;
  const styleSet = dfmProp(props, 'Font.Style', { set: [] }) as { set?: string[] };
  const styles = (styleSet && styleSet.set) ? styleSet.set : [];
  const px = size > 0 ? Math.round(size * 96 / 72) : (height < 0 ? -height : (height || 11));
  const bold = styles.includes('fsBold') ? 'bold ' : '';
  const italic = styles.includes('fsItalic') ? 'italic ' : '';
  return `${italic}${bold}${px}px "${name}", "Tahoma", sans-serif`;
}

export function dfmFontColor(props: Record<string, unknown>): string {
  const c = dfmProp(props, 'Font.Color', null);
  return c != null ? (delphiColorToCSS(c) || '#000') : '#000';
}

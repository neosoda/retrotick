import type { ComponentChildren } from 'preact';
import { formatMnemonic } from '../../lib/format';

interface StaticProps {
  style: number;
  text?: string;
  fontCSS?: string;
  bgColor?: string | null;
  /** Icon/bitmap content injected by caller (for SS_ICON/SS_BITMAP with live handles) */
  imageContent?: ComponentChildren;
  /** Icon URL for SS_ICON in resource preview mode */
  iconUrl?: string | null;
  /** Bitmap URL for SS_BITMAP in resource preview mode */
  bitmapUrl?: string | null;
}

// SS subtypes
const SS_LEFT = 0x00;
const SS_CENTER = 0x01;
const SS_RIGHT = 0x02;
const SS_ICON = 0x03;
const SS_BLACKRECT = 0x04;
const SS_GRAYRECT = 0x05;
const SS_WHITERECT = 0x06;
const SS_BLACKFRAME = 0x07;
const SS_GRAYFRAME = 0x08;
const SS_WHITEFRAME = 0x09;
const SS_SIMPLE = 0x0B;
const SS_LEFTNOWORDWRAP = 0x0C;
const SS_ETCHEDFRAME = 0x0D;
const SS_BITMAP = 0x0E;
const SS_ETCHEDHORZ = 0x10;
const SS_ETCHEDVERT = 0x11;
const SS_CENTERIMAGE = 0x0200;
const SS_SUNKEN = 0x1000;

const RECT_COLORS: Record<number, string> = {
  [SS_BLACKRECT]: '#000', [SS_BLACKFRAME]: '#000',
  [SS_GRAYRECT]: '#808080', [SS_GRAYFRAME]: '#808080',
  [SS_WHITERECT]: '#FFF', [SS_WHITEFRAME]: '#FFF',
};

export function Static({ style, text, fontCSS, bgColor, imageContent, iconUrl, bitmapUrl }: StaticProps) {
  const ssType = style & 0x1F;
  const sunken = !!(style & SS_SUNKEN);
  const vCenter = !!(style & SS_CENTERIMAGE);

  // Text types: left, center, right, simple, leftnowordwrap
  if (ssType === SS_LEFT || ssType === SS_CENTER || ssType === SS_RIGHT || ssType === SS_SIMPLE || ssType === SS_LEFTNOWORDWRAP) {
    const align = ssType === SS_CENTER ? 'center' : ssType === SS_RIGHT ? 'right' : 'left';
    const wrap = (ssType === SS_SIMPLE || ssType === SS_LEFTNOWORDWRAP) ? 'nowrap' : 'normal';
    return (
      <div style={{
        width: '100%', height: '100%', font: fontCSS,
        display: 'flex', alignItems: vCenter ? 'center' : 'flex-start',
        justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        whiteSpace: wrap, cursor: 'var(--win2k-cursor)', overflow: 'hidden', boxSizing: 'border-box',
        ...(bgColor ? { backgroundColor: bgColor } : {}),
        ...(sunken ? { borderTop: '1px solid #808080', borderLeft: '1px solid #808080', borderBottom: '1px solid #FFF', borderRight: '1px solid #FFF' } : {}),
      }}>
        {formatMnemonic(text || '')}
      </div>
    );
  }

  // SS_ICON
  if (ssType === SS_ICON) {
    if (imageContent) return <>{imageContent}</>;
    if (iconUrl) return <img src={iconUrl} style={{ maxWidth: '100%', maxHeight: '100%' }} />;
    return null;
  }

  // SS_BITMAP
  if (ssType === SS_BITMAP) {
    if (imageContent) return <>{imageContent}</>;
    if (bitmapUrl) return <img src={bitmapUrl} style={{ maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated' }} />;
    return null;
  }

  // Rect/frame types (4-9)
  if (ssType >= SS_BLACKRECT && ssType <= SS_WHITEFRAME) {
    const isFrame = ssType >= SS_BLACKFRAME;
    const color = RECT_COLORS[ssType] || '#000';
    return (
      <div style={{
        width: '100%', height: '100%', boxSizing: 'border-box',
        background: isFrame ? 'transparent' : color,
        border: isFrame ? `1px solid ${color}` : 'none',
      }} />
    );
  }

  // SS_ETCHEDHORZ, SS_ETCHEDVERT, SS_ETCHEDFRAME
  if (ssType === SS_ETCHEDHORZ || ssType === SS_ETCHEDVERT || ssType === SS_ETCHEDFRAME) {
    return (
      <div style={{
        width: '100%', height: '100%', boxSizing: 'border-box',
        ...(ssType === SS_ETCHEDHORZ ? { borderTop: '1px solid #808080', borderBottom: '1px solid #FFF', height: '2px' }
          : ssType === SS_ETCHEDVERT ? { borderLeft: '1px solid #808080', borderRight: '1px solid #FFF', width: '2px' }
          : { border: '1px solid', borderColor: '#808080 #FFF #FFF #808080', boxShadow: 'inset 1px 1px 0 #FFF, inset -1px -1px 0 #808080' }),
      }} />
    );
  }

  // Fallback: render text
  if (text) return <span>{formatMnemonic(text)}</span>;
  return null;
}

import type { Emulator } from './emulator';
import type { WindowInfo } from './win32/user32/index';
import type { BitmapInfo } from './win32/gdi32/types';
import { fillTextBitmap } from './emu-render';

export function renderButton(ctx: CanvasRenderingContext2D, child: WindowInfo): void {
  const { x, y, width, height, title } = child;
  const bsType = child.style & 0xF;

  // Win2K 3D border colors
  const BTNFACE   = '#C0C0C0';
  const HIGHLIGHT  = '#FFFFFF';
  const LIGHT      = '#DFDFDF';
  const SHADOW     = '#808080';
  const DKSHADOW   = '#404040';

  if (bsType === 7) {
    // BS_GROUPBOX — draw group frame with text
    ctx.save();
    ctx.font = '12px Tahoma, sans-serif';
    const textW = ctx.measureText(title).width;
    const textH = 12;
    const frameTop = y + textH / 2;

    // Draw group frame (etched)
    ctx.strokeStyle = SHADOW;
    ctx.lineWidth = 1;
    // top-left part
    ctx.beginPath();
    ctx.moveTo(x + 8, frameTop + 0.5);
    ctx.lineTo(x + 0.5, frameTop + 0.5);
    ctx.lineTo(x + 0.5, y + height - 0.5);
    ctx.lineTo(x + width - 0.5, y + height - 0.5);
    ctx.lineTo(x + width - 0.5, frameTop + 0.5);
    ctx.lineTo(x + 8 + textW + 4, frameTop + 0.5);
    ctx.stroke();

    // Inner highlight
    ctx.strokeStyle = HIGHLIGHT;
    ctx.beginPath();
    ctx.moveTo(x + 8, frameTop + 1.5);
    ctx.lineTo(x + 1.5, frameTop + 1.5);
    ctx.lineTo(x + 1.5, y + height - 1.5);
    ctx.lineTo(x + width - 1.5, y + height - 1.5);
    ctx.lineTo(x + width - 1.5, frameTop + 1.5);
    ctx.lineTo(x + 8 + textW + 4, frameTop + 1.5);
    ctx.stroke();

    // Draw text
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    fillTextBitmap(ctx, title, x + 10, y);
    ctx.restore();
    return;
  }

  if (bsType === 0xB) {
    // BS_OWNERDRAW — render 3D base only; app draws content via WM_DRAWITEM
    const BTNFACE   = '#D4D0C8';
    const HIGHLIGHT  = '#FFFFFF';
    const LIGHT      = '#DFDFDF';
    const SHADOW     = '#808080';
    const DKSHADOW   = '#404040';
    ctx.save();
    ctx.fillStyle = BTNFACE;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = HIGHLIGHT;
    ctx.fillRect(x, y, width, 1);
    ctx.fillRect(x, y, 1, height);
    ctx.fillStyle = LIGHT;
    ctx.fillRect(x + 1, y + 1, width - 2, 1);
    ctx.fillRect(x + 1, y + 1, 1, height - 2);
    ctx.fillStyle = DKSHADOW;
    ctx.fillRect(x, y + height - 1, width, 1);
    ctx.fillRect(x + width - 1, y, 1, height);
    ctx.fillStyle = SHADOW;
    ctx.fillRect(x + 1, y + height - 2, width - 2, 1);
    ctx.fillRect(x + width - 2, y + 1, 1, height - 2);
    ctx.restore();
    return;
  }

  if (bsType === 3 || bsType === 5 || bsType === 6 || bsType === 9) {
    // BS_AUTOCHECKBOX (3), BS_3STATE (5), BS_AUTO3STATE (6), BS_AUTORADIOBUTTON (9)
  }

  if (bsType === 2 || bsType === 3) {
    // BS_CHECKBOX / BS_AUTOCHECKBOX
    ctx.save();
    const boxSize = 13;
    const boxY = y + (height - boxSize) / 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, boxY, boxSize, boxSize);
    ctx.strokeStyle = SHADOW;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, boxY + 0.5, boxSize - 1, boxSize - 1);
    ctx.fillStyle = '#000000';
    ctx.font = '12px Tahoma, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    fillTextBitmap(ctx, title, x + boxSize + 4, y + height / 2);
    ctx.restore();
    return;
  }

  if (bsType === 4 || bsType === 9) {
    // BS_RADIOBUTTON / BS_AUTORADIOBUTTON
    ctx.save();
    const r = 6;
    const cx = x + r + 1;
    const cy = y + height / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = SHADOW;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#000000';
    ctx.font = '12px Tahoma, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    fillTextBitmap(ctx, title, x + r * 2 + 5, y + height / 2);
    ctx.restore();
    return;
  }

  // BS_PUSHBUTTON / BS_DEFPUSHBUTTON (0 or 1) — standard 3D button
  ctx.save();

  ctx.fillStyle = BTNFACE;
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = HIGHLIGHT;
  ctx.fillRect(x, y, width, 1);
  ctx.fillRect(x, y, 1, height);
  ctx.fillStyle = LIGHT;
  ctx.fillRect(x + 1, y + 1, width - 2, 1);
  ctx.fillRect(x + 1, y + 1, 1, height - 2);
  ctx.fillStyle = DKSHADOW;
  ctx.fillRect(x, y + height - 1, width, 1);
  ctx.fillRect(x + width - 1, y, 1, height);
  ctx.fillStyle = SHADOW;
  ctx.fillRect(x + 1, y + height - 2, width - 2, 1);
  ctx.fillRect(x + width - 2, y + 1, 1, height - 2);

  if (title) {
    ctx.fillStyle = '#000000';
    ctx.font = '12px Tahoma, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    fillTextBitmap(ctx, title, x + width / 2, y + height / 2);
  }

  ctx.restore();
}

export function renderStatic(ctx: CanvasRenderingContext2D, child: WindowInfo, emu?: Emulator): void {
  const { x, y, width, height, title } = child;
  const ssType = child.style & 0x1F;

  // SS_BITMAP (0x0E) — draw the bitmap set via STM_SETIMAGE
  if (ssType === 0x0E && emu && child.hImage) {
    const bmp = emu.handles.get<BitmapInfo>(child.hImage);
    if (bmp?.canvas) {
      ctx.drawImage(bmp.canvas, x, y, bmp.width, bmp.height);
      return;
    }
  }

  // SS_ICON (0x03) — draw icon set via STM_SETIMAGE
  if (ssType === 0x03 && emu && child.hImage) {
    const icon = emu.handles.get<{ canvas?: HTMLCanvasElement | OffscreenCanvas }>(child.hImage);
    if (icon?.canvas) {
      ctx.drawImage(icon.canvas, x, y);
      return;
    }
  }

  if (ssType <= 2 || ssType === 11) {
    ctx.save();
    ctx.fillStyle = (child.exStyle & 0x200) ? '#FFFFFF' : '#C0C0C0';
    ctx.fillRect(x, y, width, height);
    if (title) {
      ctx.fillStyle = '#000000';
      ctx.font = '12px Tahoma, sans-serif';
      ctx.textBaseline = 'top';
      if (ssType === 1) {
        ctx.textAlign = 'center';
        fillTextBitmap(ctx, title, x + width / 2, y + 1, width);
      } else if (ssType === 2) {
        ctx.textAlign = 'right';
        fillTextBitmap(ctx, title, x + width, y + 1, width);
      } else {
        ctx.textAlign = 'left';
        fillTextBitmap(ctx, title, x, y + 1, width);
      }
    }
    ctx.restore();
    return;
  }

  if (ssType === 4 || ssType === 5 || ssType === 6) {
    ctx.save();
    ctx.fillStyle = ssType === 4 ? '#000000' : ssType === 5 ? '#808080' : '#FFFFFF';
    ctx.fillRect(x, y, width, height);
    ctx.restore();
    return;
  }

  if (ssType === 7 || ssType === 8 || ssType === 9) {
    ctx.save();
    ctx.strokeStyle = ssType === 7 ? '#000000' : ssType === 8 ? '#808080' : '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    ctx.restore();
    return;
  }

  if (child.style & 0x1000) {
    ctx.save();
    ctx.fillStyle = '#808080';
    ctx.fillRect(x, y, width, 1);
    ctx.fillRect(x, y, 1, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y + height - 1, width, 1);
    ctx.fillRect(x + width - 1, y, 1, height);
    ctx.restore();
  }
}

export function renderEdit(ctx: CanvasRenderingContext2D, child: WindowInfo): void {
  const { x, y, width, height, title } = child;

  ctx.save();

  ctx.fillStyle = '#808080';
  ctx.fillRect(x, y, width, 1);
  ctx.fillRect(x, y, 1, height);
  ctx.fillStyle = '#404040';
  ctx.fillRect(x + 1, y + 1, width - 2, 1);
  ctx.fillRect(x + 1, y + 1, 1, height - 2);
  ctx.fillStyle = '#DFDFDF';
  ctx.fillRect(x, y + height - 1, width, 1);
  ctx.fillRect(x + width - 1, y, 1, height);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x + 1, y + height - 2, width - 2, 1);
  ctx.fillRect(x + width - 2, y + 1, 1, height - 2);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x + 2, y + 2, width - 4, height - 4);

  if (title) {
    ctx.fillStyle = '#000000';
    ctx.font = '12px Tahoma, sans-serif';
    ctx.textBaseline = 'middle';
    const ES_CENTER = 1;
    const ES_RIGHT = 2;
    const esAlign = child.style & 3;
    if (esAlign === ES_CENTER) {
      ctx.textAlign = 'center';
      fillTextBitmap(ctx, title, x + width / 2, y + height / 2, width - 6);
    } else if (esAlign === ES_RIGHT) {
      ctx.textAlign = 'right';
      fillTextBitmap(ctx, title, x + width - 4, y + height / 2, width - 6);
    } else {
      ctx.textAlign = 'left';
      fillTextBitmap(ctx, title, x + 3, y + height / 2, width - 6);
    }
  }

  ctx.restore();
}

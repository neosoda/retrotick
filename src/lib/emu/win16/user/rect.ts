import type { Emulator, Win16Module } from '../../emulator';
import type { Win16UserHelpers } from './index';

// Win16 USER module — Rectangle operations

export function registerWin16UserRect(emu: Emulator, user: Win16Module, h: Win16UserHelpers): void {
  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 72: SetRect(lpRect_ptr, left, top, right, bottom) — 12 bytes (4+2+2+2+2)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_72', 12, () => {
    const [lpRect, left, top, right, bottom] = emu.readPascalArgs16([4, 2, 2, 2, 2]);
    if (lpRect) {
      h.writeRect(lpRect, left, top, right, bottom);
    }
    return 1;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 74: CopyRect(lpDst_ptr, lpSrc_ptr) — 8 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_74', 8, () => {
    const [lpDst, lpSrc] = emu.readPascalArgs16([4, 4]);
    if (lpDst && lpSrc) {
      const r = h.readRect(lpSrc);
      h.writeRect(lpDst, r.left, r.top, r.right, r.bottom);
    }
    return 1;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 76: PtInRect(lpRect_ptr, point_long) — 8 bytes (4+4)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_76', 8, () => {
    const [lpRect, pointLong] = emu.readPascalArgs16([4, 4]);
    if (lpRect) {
      const px = pointLong & 0xFFFF;
      const py = (pointLong >>> 16) & 0xFFFF;
      const r = h.readRect(lpRect);
      if (px >= r.left && px < r.right && py >= r.top && py < r.bottom) {
        return 1;
      }
    }
    return 0;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 77: OffsetRect(lpRect_ptr, dx, dy) — 8 bytes (4+2+2)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_77', 8, () => {
    const [lpRect, dxRaw, dyRaw] = emu.readPascalArgs16([4, 2, 2]);
    const dx = (dxRaw << 16) >> 16;
    const dy = (dyRaw << 16) >> 16;
    if (lpRect) {
      const r = h.readRect(lpRect);
      h.writeRect(lpRect, r.left + dx, r.top + dy, r.right + dx, r.bottom + dy);
    }
    return 1;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 78: InflateRect(lpRect_ptr, dx, dy) — 8 bytes (4+2+2)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_78', 8, () => {
    const [lpRect, dxRaw, dyRaw] = emu.readPascalArgs16([4, 2, 2]);
    const dx = (dxRaw << 16) >> 16;
    const dy = (dyRaw << 16) >> 16;
    if (lpRect) {
      const r = h.readRect(lpRect);
      h.writeRect(lpRect, r.left - dx, r.top - dy, r.right + dx, r.bottom + dy);
    }
    return 1;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 79: IntersectRect(lpDst_ptr, lpSrc1_ptr, lpSrc2_ptr) — 12 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_79', 12, () => {
    const [lpDst, lpSrc1, lpSrc2] = emu.readPascalArgs16([4, 4, 4]);
    if (lpDst && lpSrc1 && lpSrc2) {
      const r1 = h.readRect(lpSrc1);
      const r2 = h.readRect(lpSrc2);
      const left = Math.max(r1.left, r2.left);
      const top = Math.max(r1.top, r2.top);
      const right = Math.min(r1.right, r2.right);
      const bottom = Math.min(r1.bottom, r2.bottom);
      if (left < right && top < bottom) {
        h.writeRect(lpDst, left, top, right, bottom);
        return 1;
      }
      h.writeRect(lpDst, 0, 0, 0, 0);
    }
    return 0;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 80: UnionRect(lpDst_ptr, lpSrc1_ptr, lpSrc2_ptr) — 12 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_80', 12, () => {
    const [lpDst, lpSrc1, lpSrc2] = emu.readPascalArgs16([4, 4, 4]);
    if (lpDst && lpSrc1 && lpSrc2) {
      const r1 = h.readRect(lpSrc1);
      const r2 = h.readRect(lpSrc2);
      const left = Math.min(r1.left, r2.left);
      const top = Math.min(r1.top, r2.top);
      const right = Math.max(r1.right, r2.right);
      const bottom = Math.max(r1.bottom, r2.bottom);
      h.writeRect(lpDst, left, top, right, bottom);
      return (left < right && top < bottom) ? 1 : 0;
    }
    return 0;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 81: FillRect(hDC, lpRect_ptr, hBrush) — 8 bytes (2+4+2)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_81', 8, () => {
    const [hDC, lpRect, hBrush] = emu.readPascalArgs16([2, 4, 2]);
    const dc = emu.getDC(hDC);
    if (dc && lpRect) {
      const r = h.readRect(lpRect);
      dc.ctx.fillRect(r.left, r.top, r.right - r.left, r.bottom - r.top);
    }
    return 1;
  });

  // Ordinal 82: InvertRect(hDC, lpRect_ptr) — 6 bytes
  user.register('ord_82', 6, () => 0);

  // Ordinal 83: FrameRect(hDC, lpRect_ptr, hBrush) — 8 bytes (2+4+2)
  user.register('ord_83', 8, () => 0);

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 244: EqualRect(lprc1, lprc2) — 8 bytes (4+4)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_244', 8, () => {
    const [lprc1, lprc2] = emu.readPascalArgs16([4, 4]);
    if (lprc1 && lprc2) {
      for (let i = 0; i < 8; i++) {
        if (emu.memory.readU8(lprc1 + i) !== emu.memory.readU8(lprc2 + i)) return 0;
      }
      return 1;
    }
    return 0;
  });
}

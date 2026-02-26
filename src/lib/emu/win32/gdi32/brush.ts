import type { Emulator } from '../../emulator';
import type { PenInfo, BrushInfo } from './types';

export function registerBrush(emu: Emulator): void {
  const gdi32 = emu.registerDll('GDI32.DLL');

  gdi32.register('CreateSolidBrush', 1, () => {
    const color = emu.readArg(0);
    const brush: BrushInfo = { color, isNull: false };
    return emu.handles.alloc('brush', brush);
  });

  gdi32.register('CreateBrushIndirect', 1, () => emu.handles.alloc('brush', {}));

  gdi32.register('CreatePen', 3, () => {
    const style = emu.readArg(0);
    const width = emu.readArg(1);
    const color = emu.readArg(2);
    const pen: PenInfo = { style, width: Math.max(1, width), color };
    return emu.handles.alloc('pen', pen);
  });

  gdi32.register('CreatePenIndirect', 1, () => emu.handles.alloc('pen', {}));

  gdi32.register('ExtCreatePen', 5, () => {
    const style = emu.readArg(0);
    const width = emu.readArg(1);
    const brushPtr = emu.readArg(2);
    // Read LOGBRUSH: lbStyle (DWORD), lbColor (COLORREF), lbHatch (ULONG_PTR)
    const color = brushPtr ? emu.memory.readU32(brushPtr + 4) : 0;
    const pen: PenInfo = { style, width: Math.max(1, width), color };
    return emu.handles.alloc('pen', pen);
  });

  gdi32.register('CreateHatchBrush', 2, () => {
    const _style = emu.readArg(0);
    const color = emu.readArg(1);
    return emu.handles.alloc('brush', { color });
  });

  gdi32.register('SetBrushOrgEx', 4, () => 1);

  gdi32.register('CreatePatternBrush', 1, () => {
    const _hBitmap = emu.readArg(0);
    return emu.handles.alloc('brush', { color: 0xFFFFFF });
  });

  gdi32.register('CreateDIBPatternBrushPt', 2, () => {
    const _data = emu.readArg(0);
    const _usage = emu.readArg(1);
    return emu.handles.alloc('brush', { color: 0xFFFFFF });
  });
}

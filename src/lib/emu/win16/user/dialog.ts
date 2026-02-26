import type { Emulator, Win16Module } from '../../emulator';
import type { WindowInfo } from '../../win32/user32/types';
import { getNonClientMetrics } from '../../win32/user32/_helpers';
import type { Win16UserHelpers } from './index';

// Win16 USER module — Dialogs & controls

export function registerWin16UserDialog(emu: Emulator, user: Win16Module, h: Win16UserHelpers): void {
  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 87: DialogBox(hInst, lpTemplate_ptr, hWndParent, dlgProc_segptr) — 12 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_87', 12, () => 0);

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 88: EndDialog(hDlg, nResult_sword) — 4 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_88', 4, () => 0);

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 90: IsDialogMessage(hDlg, lpMsg) — 6 bytes (2+4)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_90', 6, () => 0);

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 91: GetDlgItem(hDlg, nIDDlgItem) — 4 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_91', 4, () => 0);

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 92: SetDlgItemText(hDlg, nIDDlgItem, lpString) — 8 bytes (2+2+4)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_92', 8, () => 1);

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 94: SetDlgItemInt(hDlg, nID, wValue, bSigned) — 8 bytes (2+2+2+2)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_94', 8, () => 1);

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 96: CheckRadioButton(hDlg, nFirst, nLast, nCheck) — 8 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_96', 8, () => {
    const hDlg = emu.readArg16(0);
    const nFirst = emu.readArg16(2);
    const nLast = emu.readArg16(4);
    const nCheck = emu.readArg16(6);
    const wnd = emu.handles.get<WindowInfo>(hDlg);
    if (wnd?.children) {
      for (const [ctrlId, childHwnd] of wnd.children) {
        const child = emu.handles.get<WindowInfo>(childHwnd);
        if (child && ctrlId >= nFirst && ctrlId <= nLast) {
          child.checked = (ctrlId === nCheck) ? 1 : 0;
        }
      }
    }
    return 0;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 97: CheckDlgButton(hDlg, nID, uCheck) — 6 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_97', 6, () => {
    const hDlg = emu.readArg16(0);
    const nID = emu.readArg16(2);
    const uCheck = emu.readArg16(4);
    const wnd = emu.handles.get<WindowInfo>(hDlg);
    if (wnd?.children) {
      for (const [ctrlId, childHwnd] of wnd.children) {
        if (ctrlId === nID) {
          const child = emu.handles.get<WindowInfo>(childHwnd);
          if (child) child.checked = uCheck & 0x3;
        }
      }
    }
    return 0;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 98: IsDlgButtonChecked(hDlg, nID) — 4 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_98', 4, () => {
    const hDlg = emu.readArg16(0);
    const nID = emu.readArg16(2);
    const wnd = emu.handles.get<WindowInfo>(hDlg);
    if (wnd?.children) {
      for (const [ctrlId, childHwnd] of wnd.children) {
        if (ctrlId === nID) {
          const child = emu.handles.get<WindowInfo>(childHwnd);
          if (child) return child.checked ?? 0;
        }
      }
    }
    return 0;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 102: AdjustWindowRect(lpRect_ptr, dwStyle_long, bMenu) — 10 bytes (4+4+2)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_102', 10, () => {
    const [lpRect, dwStyle, bMenu] = emu.readPascalArgs16([4, 4, 2]);
    if (lpRect) {
      const { bw, captionH, menuH } = getNonClientMetrics(dwStyle, !!bMenu, true);
      const l = emu.memory.readI16(lpRect) - bw;
      const t = emu.memory.readI16(lpRect + 2) - bw - captionH - menuH;
      const r = emu.memory.readI16(lpRect + 4) + bw;
      const b = emu.memory.readI16(lpRect + 6) + bw;
      emu.memory.writeU16(lpRect, l & 0xFFFF);
      emu.memory.writeU16(lpRect + 2, t & 0xFFFF);
      emu.memory.writeU16(lpRect + 4, r & 0xFFFF);
      emu.memory.writeU16(lpRect + 6, b & 0xFFFF);
    }
    return 1;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 239: DialogBoxParam(hInst, lpTemplate, hWndParent, dlgProc, dwInitParam) — 16 bytes (2+4+2+4+4)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_239', 16, () => 0);

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 454: AdjustWindowRectEx(lpRect_ptr, dwStyle_long, bMenu, dwExStyle_long) — 14 bytes (4+4+2+4)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_454', 14, () => {
    const [lpRect, dwStyle, bMenu, _dwExStyle] = emu.readPascalArgs16([4, 4, 2, 4]);
    if (lpRect) {
      const { bw, captionH, menuH } = getNonClientMetrics(dwStyle, !!bMenu, true);
      const l = emu.memory.readI16(lpRect) - bw;
      const t = emu.memory.readI16(lpRect + 2) - bw - captionH - menuH;
      const r = emu.memory.readI16(lpRect + 4) + bw;
      const b = emu.memory.readI16(lpRect + 6) + bw;
      emu.memory.writeU16(lpRect, l & 0xFFFF);
      emu.memory.writeU16(lpRect + 2, t & 0xFFFF);
      emu.memory.writeU16(lpRect + 4, r & 0xFFFF);
      emu.memory.writeU16(lpRect + 6, b & 0xFFFF);
    }
    return 1;
  });
}

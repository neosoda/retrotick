import type { Emulator, Win16Module } from '../../emulator';
import type { WindowInfo } from '../../win32/user32/types';
import { findMenuItemById } from './index';
import type { Win16UserHelpers } from './index';

// Win16 USER module — Menu operations

export function registerWin16UserMenu(emu: Emulator, user: Win16Module, h: Win16UserHelpers): void {
  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 150: LoadMenu(hInstance, lpMenuName_ptr) — 6 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_150', 6, () => {
    const [hInstance, lpMenuName] = emu.readPascalArgs16([2, 4]);
    console.log(`[WIN16] LoadMenu hInst=0x${hInstance.toString(16)} menuName=0x${lpMenuName.toString(16)}`);
    return 1;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 151: CreateMenu() — 0 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_151', 0, () => emu.handles.alloc('menu', { items: [] }));

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 154: CheckMenuItem(hMenu, uIDCheckItem, uCheck) — 6 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_154', 6, () => {
    const [hMenu, uIDCheckItem, uCheck] = emu.readPascalArgs16([2, 2, 2]);
    if (!emu.menuItems) return -1;
    const MF_BYPOSITION = 0x400;
    const MF_CHECKED = 0x8;
    const byPos = !!(uCheck & MF_BYPOSITION);
    const item = byPos ? null : findMenuItemById(emu.menuItems, uIDCheckItem);
    if (!item) return -1;
    const prev = item.isChecked ? MF_CHECKED : 0;
    item.isChecked = !!(uCheck & MF_CHECKED);
    emu.onMenuChanged?.();
    return prev;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 155: EnableMenuItem(hMenu, uIDEnableItem, uEnable) — 6 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_155', 6, () => {
    const [_hMenu, uIDEnableItem, uEnable] = emu.readPascalArgs16([2, 2, 2]);
    if (!emu.menuItems) return -1;
    const MF_BYPOSITION = 0x400;
    const MF_GRAYED = 0x1;
    const byPos = !!(uEnable & MF_BYPOSITION);
    const item = byPos ? null : findMenuItemById(emu.menuItems, uIDEnableItem);
    if (!item) return -1;
    const prev = item.isGrayed ? MF_GRAYED : 0;
    item.isGrayed = !!(uEnable & MF_GRAYED);
    emu.onMenuChanged?.();
    return prev;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 157: GetMenu(hWnd) — 2 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_157', 2, () => 0);

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 158: SetMenu(hWnd, hMenu) — 4 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_158', 4, () => {
    const [hWnd, hMenu] = emu.readPascalArgs16([2, 2]);
    console.log(`[WIN16] SetMenu hwnd=0x${hWnd.toString(16)} hMenu=0x${hMenu.toString(16)}`);
    const wnd = emu.handles.get<WindowInfo>(hWnd);
    if (wnd) {
      wnd.hMenu = hMenu;
    }
    return 1;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 159: GetSubMenu(hMenu, nPos) — 4 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_159', 4, () => 0);

  // Ordinal 160: DrawMenuBar(hWnd) — 2 bytes
  user.register('ord_160', 2, () => 0);

  // Ordinal 263: GetMenuItemCount(hMenu) — 2 bytes
  user.register('ord_263', 2, () => 0);

  // Ordinal 410: InsertMenu — 12 bytes
  user.register('ord_410', 12, () => 1);

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 411: AppendMenu(hMenu, uFlags, uIDNewItem, lpNewItem) — 10 bytes (2+2+2+4)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_411', 10, () => 1);

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 412: RemoveMenu(hMenu, uPosition, uFlags) — 6 bytes (2+2+2)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_412', 6, () => 1);

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 413: DeleteMenu(hMenu, uPosition, uFlags) — 6 bytes (2+2+2)
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_413', 6, () => 1);

  // ───────────────────────────────────────────────────────────────────────────
  // Ordinal 415: CreatePopupMenu() — 0 bytes
  // ───────────────────────────────────────────────────────────────────────────
  user.register('ord_415', 0, () => emu.handles.alloc('menu', { items: [] }));

  // Ordinal 417: GetMenuCheckMarkDimensions() — 0 bytes → 16x16
  user.register('ord_417', 0, () => ((16 << 16) | 16));

  // Ordinal 418: SetMenuItemBitmaps — 10 bytes
  user.register('ord_418', 10, () => 1);
}

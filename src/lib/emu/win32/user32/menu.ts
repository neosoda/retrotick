import type { Emulator } from '../../emulator';
import type { WindowInfo } from './types';
import type { MenuItem } from '../../../pe/types';

function findMenuItemById(items: MenuItem[], id: number): MenuItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findMenuItemById(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

function findMenuItemByPos(items: MenuItem[], pos: number): MenuItem | null {
  let idx = 0;
  for (const item of items) {
    if (idx === pos) return item;
    idx++;
  }
  return null;
}

export function registerMenu(emu: Emulator): void {
  const user32 = emu.registerDll('USER32.DLL');

  user32.register('LoadMenuA', 2, () => {
    const _hInstance = emu.readArg(0);
    const menuNamePtr = emu.readArg(1);

    // menuNamePtr can be an integer resource ID (< 0x10000) or a string pointer
    let menuId: number | string;
    if (menuNamePtr < 0x10000) {
      menuId = menuNamePtr;
    } else {
      menuId = emu.memory.readCString(menuNamePtr);
    }

    // We'll return a pseudo handle; the actual menu will be extracted at render time
    return emu.handles.alloc('menu', { menuId });
  });

  // LoadMenuW - same as A (integer resource IDs)
  user32.register('LoadMenuW', 2, () => {
    const _hInstance = emu.readArg(0);
    const menuNamePtr = emu.readArg(1);
    let menuId: number | string;
    if (menuNamePtr < 0x10000) {
      menuId = menuNamePtr;
    } else {
      menuId = emu.memory.readUTF16String(menuNamePtr);
    }
    return emu.handles.alloc('menu', { menuId });
  });

  user32.register('SetMenu', 2, () => {
    const hwnd = emu.readArg(0);
    const hMenu = emu.readArg(1);
    const wnd = emu.handles.get<WindowInfo>(hwnd);
    if (wnd) wnd.hMenu = hMenu;
    return 1;
  });

  user32.register('DrawMenuBar', 1, () => 1);

  user32.register('CheckMenuItem', 3, () => {
    const _hMenu = emu.readArg(0);
    const uIDCheckItem = emu.readArg(1);
    const uCheck = emu.readArg(2);
    if (!emu.menuItems) return -1;
    const byPos = !!(uCheck & 0x400); // MF_BYPOSITION
    const item = byPos
      ? findMenuItemByPos(emu.menuItems, uIDCheckItem)
      : findMenuItemById(emu.menuItems, uIDCheckItem);
    if (!item) return -1;
    const prev = item.isChecked ? 0x8 : 0;
    item.isChecked = !!(uCheck & 0x8); // MF_CHECKED
    emu.onMenuChanged?.();
    return prev;
  });

  user32.register('EnableMenuItem', 3, () => {
    const _hMenu = emu.readArg(0);
    const uIDEnableItem = emu.readArg(1);
    const uEnable = emu.readArg(2);
    if (!emu.menuItems) return -1;
    const byPos = !!(uEnable & 0x400);
    const item = byPos
      ? findMenuItemByPos(emu.menuItems, uIDEnableItem)
      : findMenuItemById(emu.menuItems, uIDEnableItem);
    if (!item) return -1;
    const prev = item.isGrayed ? 0x1 : 0;
    item.isGrayed = !!(uEnable & 0x1); // MF_GRAYED
    emu.onMenuChanged?.();
    return prev;
  });

  user32.register('CheckMenuRadioItem', 5, () => {
    const _hMenu = emu.readArg(0);
    const idFirst = emu.readArg(1);
    const idLast = emu.readArg(2);
    const idCheck = emu.readArg(3);
    const uFlags = emu.readArg(4);
    if (!emu.menuItems) return 1;
    const byPos = !!(uFlags & 0x400);
    for (let i = idFirst; i <= idLast; i++) {
      const item = byPos
        ? findMenuItemByPos(emu.menuItems, i)
        : findMenuItemById(emu.menuItems, i);
      if (item) item.isChecked = (i === idCheck);
    }
    emu.onMenuChanged?.();
    return 1;
  });

  user32.register('GetMenu', 1, () => {
    const hwnd = emu.readArg(0);
    const wnd = emu.handles.get<WindowInfo>(hwnd);
    return wnd?.hMenu || 0;
  });

  user32.register('GetSubMenu', 2, () => {
    // Return a pseudo handle
    const hMenu = emu.readArg(0);
    const pos = emu.readArg(1);
    return (hMenu & 0xFFFF0000) | ((pos + 1) << 8);
  });

  user32.register('GetMenuItemCount', 1, () => 0);
  user32.register('GetMenuState', 3, () => 0);
  user32.register('GetMenuStringA', 5, () => 0);
  user32.register('GetMenuStringW', 5, () => 0);
  user32.register('ModifyMenuW', 5, () => 1);
  user32.register('InsertMenuW', 5, () => 1);

  // GetMenuItemRect
  user32.register('GetMenuItemRect', 4, () => {
    const _hwnd = emu.readArg(0);
    const _hMenu = emu.readArg(1);
    const _item = emu.readArg(2);
    const rectPtr = emu.readArg(3);
    if (rectPtr) {
      emu.memory.writeU32(rectPtr, 0);
      emu.memory.writeU32(rectPtr + 4, 0);
      emu.memory.writeU32(rectPtr + 8, 100);
      emu.memory.writeU32(rectPtr + 12, 20);
    }
    return 1;
  });

  user32.register('GetSystemMenu', 2, () => 0);
  user32.register('TrackPopupMenu', 7, () => 0);
  user32.register('TrackPopupMenuEx', 6, () => 0);
  user32.register('CreateMenu', 0, () => emu.handles.alloc('menu', {}));
  user32.register('CreatePopupMenu', 0, () => emu.handles.alloc('menu', {}));
  user32.register('DestroyMenu', 1, () => 1);
  user32.register('InsertMenuA', 5, () => 1);
  user32.register('InsertMenuItemA', 4, () => 1);
  user32.register('AppendMenuA', 4, () => 1);
  user32.register('AppendMenuW', 4, () => 1);
  user32.register('DeleteMenu', 3, () => 1);
  user32.register('RemoveMenu', 3, () => 1);
  user32.register('SetMenuItemBitmaps', 5, () => 1);
  user32.register('GetMenuItemID', 2, () => {
    // Return the menu item ID at the given position
    return 0xFFFFFFFF; // -1 = not found / separator
  });
  user32.register('ModifyMenuA', 5, () => 1);

  // CopyAcceleratorTableW(hAccelSrc, lpAccelDst, cAccelEntries) → int
  // Return 0 (no entries copied)
  user32.register('CopyAcceleratorTableW', 3, () => 0);
  user32.register('IsMenu', 1, () => 0);

  // SetMenuItemInfoW(hMenu, uItem, fByPosition, lpmii) — no-op stub
  user32.register('SetMenuItemInfoW', 4, () => 1);
}

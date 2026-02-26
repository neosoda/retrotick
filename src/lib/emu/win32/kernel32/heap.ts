import type { Emulator } from '../../emulator';
import { HEAP_ZERO_MEMORY } from '../types';

const HEAP_HANDLE = 0x10000;

function heapAlloc(emu: Emulator, size: number, flags: number): number {
  const addr = emu.allocHeap(size);
  // allocHeap already zero-fills, so HEAP_ZERO_MEMORY is always satisfied
  return addr;
}

export function registerHeap(emu: Emulator): void {
  const kernel32 = emu.registerDll('KERNEL32.DLL');

  kernel32.register('HeapCreate', 3, () => {
    return HEAP_HANDLE; // pseudo heap handle
  });

  kernel32.register('GetProcessHeap', 0, () => {
    return HEAP_HANDLE;
  });

  kernel32.register('HeapAlloc', 3, () => {
    const _hHeap = emu.readArg(0);
    const flags = emu.readArg(1);
    const size = emu.readArg(2);
    return heapAlloc(emu, size, flags);
  });

  kernel32.register('HeapReAlloc', 4, () => {
    const _hHeap = emu.readArg(0);
    const flags = emu.readArg(1);
    const ptr = emu.readArg(2);
    const size = emu.readArg(3);
    return emu.reallocHeap(ptr, size);
  });

  kernel32.register('HeapFree', 3, () => {
    // no-op
    return 1;
  });

  kernel32.register('HeapSize', 3, () => {
    const _hHeap = emu.readArg(0);
    const _flags = emu.readArg(1);
    const ptr = emu.readArg(2);
    return emu.heapSize(ptr);
  });

  kernel32.register('HeapDestroy', 1, () => 1);

  kernel32.register('HeapValidate', 3, () => 1); // always valid

  kernel32.register('GlobalAlloc', 2, () => {
    const _flags = emu.readArg(0);
    const size = emu.readArg(1);
    return heapAlloc(emu, size, HEAP_ZERO_MEMORY);
  });

  kernel32.register('GlobalLock', 1, () => {
    return emu.readArg(0); // Return same pointer
  });

  kernel32.register('GlobalUnlock', 1, () => {
    return 1;
  });

  kernel32.register('GlobalFree', 1, () => {
    return 0;
  });

  kernel32.register('GlobalReAlloc', 3, () => {
    const hMem = emu.readArg(0);
    const size = emu.readArg(1);
    return emu.reallocHeap(hMem, size);
  });

  kernel32.register('GlobalHandle', 1, () => emu.readArg(0));

  kernel32.register('GlobalSize', 1, () => {
    const hMem = emu.readArg(0);
    return emu.heapSize(hMem);
  });

  kernel32.register('GlobalCompact', 1, () => 0x1000000); // 16MB free
  kernel32.register('GlobalFlags', 1, () => 0); // GMEM_FIXED

  kernel32.register('LocalAlloc', 2, () => {
    const _flags = emu.readArg(0);
    const size = emu.readArg(1);
    return heapAlloc(emu, size, HEAP_ZERO_MEMORY);
  });

  kernel32.register('LocalFree', 1, () => {
    return 0;
  });

  kernel32.register('LocalReAlloc', 3, () => {
    const hMem = emu.readArg(0);
    const size = emu.readArg(1);
    const _flags = emu.readArg(2);
    return emu.reallocHeap(hMem, size);
  });

  kernel32.register('LocalLock', 1, () => {
    return emu.readArg(0);
  });

  kernel32.register('LocalUnlock', 1, () => {
    return 1;
  });

  kernel32.register('LocalSize', 1, () => {
    const hMem = emu.readArg(0);
    return emu.heapSize(hMem);
  });

  kernel32.register('VirtualAlloc', 4, () => {
    const addr = emu.readArg(0);
    const size = emu.readArg(1);
    const allocType = emu.readArg(2);
    const _protect = emu.readArg(3);
    // MEM_RESERVE=0x2000, MEM_COMMIT=0x1000
    // Must return page-aligned addresses (Delphi memory manager depends on this)
    const result = emu.allocVirtual(addr, size);
    console.log(`[HEAP] VirtualAlloc(0x${addr.toString(16)}, 0x${size.toString(16)}, 0x${allocType.toString(16)}) => 0x${result.toString(16)}`);
    return result;
  });

  kernel32.register('VirtualFree', 3, () => {
    return 1;
  });

  kernel32.register('VirtualProtect', 4, () => {
    const _addr = emu.readArg(0);
    const _size = emu.readArg(1);
    const _newProtect = emu.readArg(2);
    const oldProtectPtr = emu.readArg(3);
    if (oldProtectPtr) emu.memory.writeU32(oldProtectPtr, 0x40); // PAGE_EXECUTE_READWRITE
    return 1;
  });

  kernel32.register('IsBadReadPtr', 2, () => 0);
  kernel32.register('IsBadWritePtr', 2, () => 0);

  kernel32.register('IsBadStringPtrA', 2, () => {
    return 0;
  });

  kernel32.register('IsBadStringPtrW', 2, () => {
    return 0;
  });

  kernel32.register('GlobalMemoryStatus', 1, () => {
    const ptr = emu.readArg(0);
    if (ptr) {
      emu.memory.writeU32(ptr + 0, 32);          // dwLength
      emu.memory.writeU32(ptr + 4, 50);           // dwMemoryLoad (50%)
      emu.memory.writeU32(ptr + 8, 64 * 1024 * 1024);  // dwTotalPhys
      emu.memory.writeU32(ptr + 12, 32 * 1024 * 1024); // dwAvailPhys
      emu.memory.writeU32(ptr + 16, 128 * 1024 * 1024);// dwTotalPageFile
      emu.memory.writeU32(ptr + 20, 64 * 1024 * 1024); // dwAvailPageFile
      emu.memory.writeU32(ptr + 24, 0x7FFFFFFF);       // dwTotalVirtual
      emu.memory.writeU32(ptr + 28, 0x7FFF0000);       // dwAvailVirtual
    }
    return 0;
  });
}

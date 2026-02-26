import type { Emulator } from '../emulator';

export function registerOleaut32(emu: Emulator): void {
  const oleaut32 = emu.registerDll('OLEAUT32.DLL');

  // BSTR allocation helper: allocates [4-byte len][wchar data][null terminator]
  // Returns pointer to the string data (past the length prefix)
  function bstrAlloc(srcPtr: number, lenChars: number): number {
    const byteLen = lenChars * 2;
    const totalSize = 4 + byteLen + 2; // length prefix + data + null terminator
    const block = emu.allocHeap(totalSize);
    if (!block) return 0;
    // Write byte length prefix
    emu.memory.writeU32(block, byteLen);
    const bstr = block + 4;
    // Copy source data if provided
    if (srcPtr && lenChars > 0) {
      for (let i = 0; i < byteLen; i++) {
        emu.memory.writeU8(bstr + i, emu.memory.readU8(srcPtr + i));
      }
    } else {
      // Zero-fill
      for (let i = 0; i < byteLen; i++) {
        emu.memory.writeU8(bstr + i, 0);
      }
    }
    // Null terminator
    emu.memory.writeU16(bstr + byteLen, 0);
    return bstr;
  }

  // SysAllocStringLen(oleChar*, len) - allocates BSTR with given length
  oleaut32.register('SysAllocStringLen', 2, () => {
    const psz = emu.readArg(0);
    const len = emu.readArg(1);
    return bstrAlloc(psz, len);
  });

  // SysAllocString(oleChar*) - allocates BSTR from null-terminated wide string
  oleaut32.register('SysAllocString', 1, () => {
    const psz = emu.readArg(0);
    if (!psz) return 0;
    // Find length of null-terminated wide string
    let len = 0;
    while (emu.memory.readU16(psz + len * 2) !== 0) len++;
    return bstrAlloc(psz, len);
  });

  // SysReAllocStringLen(BSTR*, oleChar*, len)
  oleaut32.register('SysReAllocStringLen', 3, () => {
    const pbstr = emu.readArg(0);
    const psz = emu.readArg(1);
    const len = emu.readArg(2);
    const newBstr = bstrAlloc(psz, len);
    if (!newBstr) return 0; // FALSE
    // Free old BSTR (just overwrite pointer)
    if (pbstr) emu.memory.writeU32(pbstr, newBstr);
    return 1; // TRUE
  });

  // SysFreeString(BSTR)
  oleaut32.register('SysFreeString', 1, () => 0);

  // SysStringLen(BSTR) - returns length in characters
  oleaut32.register('SysStringLen', 1, () => {
    const bstr = emu.readArg(0);
    if (!bstr) return 0;
    const byteLen = emu.memory.readU32(bstr - 4);
    return byteLen >>> 1; // bytes to chars
  });

  oleaut32.register('VariantChangeTypeEx', 5, () => 0);
  oleaut32.register('VariantCopyInd', 2, () => 0);
  oleaut32.register('VariantClear', 1, () => 0);

  oleaut32.register('VariantInit', 1, () => {
    const ptr = emu.readArg(0);
    // VARIANT is 16 bytes, zero it out (VT_EMPTY = 0)
    if (ptr) for (let i = 0; i < 16; i++) emu.memory.writeU8(ptr + i, 0);
    return 0;
  });

  oleaut32.register('VariantCopy', 2, () => 0);
  oleaut32.register('VariantChangeType', 4, () => 0);

  // ord_277 = VarDateFromStr(strIn, lcid, dwFlags, pdateOut)
  oleaut32.register('ord_277', 4, () => {
    const pdateOut = emu.readArg(3);
    if (pdateOut) {
      // Write 0.0 as DATE (double) — epoch date
      emu.memory.writeU32(pdateOut, 0);
      emu.memory.writeU32(pdateOut + 4, 0);
    }
    return 0; // S_OK
  });
}

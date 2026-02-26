import type { Emulator } from '../../emulator';

export function registerLocale(emu: Emulator): void {
  const kernel32 = emu.registerDll('KERNEL32.DLL');

  kernel32.register('GetACP', 0, () => {
    return 1252; // Western European
  });

  kernel32.register('GetCPInfo', 2, () => {
    const _cp = emu.readArg(0);
    const ptr = emu.readArg(1);
    emu.memory.writeU32(ptr, 1); // MaxCharSize
    emu.memory.writeU8(ptr + 4, 0); // DefaultChar
    return 1;
  });

  kernel32.register('IsValidCodePage', 1, () => {
    return 1;
  });

  // BOOL GetStringTypeW(DWORD dwInfoType, LPCWSTR lpSrcStr, int cchSrc, LPWORD lpCharType)
  const CT_CTYPE1 = 0x00000001;
  const CT_CTYPE2 = 0x00000002;
  const CT_CTYPE3 = 0x00000003;

  // CT1 flags
  const C1_UPPER  = 0x0001;
  const C1_LOWER  = 0x0002;
  const C1_DIGIT  = 0x0004;
  const C1_SPACE  = 0x0008;
  const C1_PUNCT  = 0x0010;
  const C1_CNTRL  = 0x0020;
  const C1_BLANK  = 0x0040;
  const C1_XDIGIT = 0x0080;
  const C1_ALPHA  = 0x0100;
  const C1_DEFINED = 0x0200;

  kernel32.register('GetStringTypeW', 4, () => {
    const dwInfoType = emu.readArg(0);
    const lpSrcStr = emu.readArg(1);
    const cchSrc = emu.readArg(2) | 0; // signed
    const lpCharType = emu.readArg(3);

    let len = cchSrc;
    if (len < 0) {
      // -1 means null-terminated
      len = 0;
      while (emu.memory.readU16(lpSrcStr + len * 2) !== 0) len++;
      len++; // include null
    }

    for (let i = 0; i < len; i++) {
      const ch = emu.memory.readU16(lpSrcStr + i * 2);
      let flags = 0;
      if (dwInfoType === CT_CTYPE1) {
        if (ch >= 0x41 && ch <= 0x5A) flags |= C1_UPPER | C1_ALPHA | C1_DEFINED;
        else if (ch >= 0x61 && ch <= 0x7A) flags |= C1_LOWER | C1_ALPHA | C1_DEFINED;
        else if (ch >= 0x30 && ch <= 0x39) flags |= C1_DIGIT | C1_XDIGIT | C1_DEFINED;
        else if (ch === 0x20) flags |= C1_SPACE | C1_BLANK | C1_DEFINED;
        else if (ch === 0x09) flags |= C1_SPACE | C1_BLANK | C1_CNTRL | C1_DEFINED;
        else if (ch >= 0x0A && ch <= 0x0D) flags |= C1_SPACE | C1_CNTRL | C1_DEFINED;
        else if (ch < 0x20 || ch === 0x7F) flags |= C1_CNTRL | C1_DEFINED;
        else if (ch >= 0x21 && ch <= 0x2F) flags |= C1_PUNCT | C1_DEFINED;
        else if (ch >= 0x3A && ch <= 0x40) flags |= C1_PUNCT | C1_DEFINED;
        else if (ch >= 0x5B && ch <= 0x60) flags |= C1_PUNCT | C1_DEFINED;
        else if (ch >= 0x7B && ch <= 0x7E) flags |= C1_PUNCT | C1_DEFINED;
        else if (ch > 0x7F) flags |= C1_DEFINED; // non-ASCII: mark as defined
        // xdigit extras: A-F, a-f
        if ((ch >= 0x41 && ch <= 0x46) || (ch >= 0x61 && ch <= 0x66)) flags |= C1_XDIGIT;
      } else if (dwInfoType === CT_CTYPE2) {
        // simplified: return 0 (no strong directionality info)
        flags = 0;
      } else if (dwInfoType === CT_CTYPE3) {
        // simplified: return 0
        flags = 0;
      }
      emu.memory.writeU16(lpCharType + i * 2, flags);
    }
    return 1;
  });

  kernel32.register('GetStringTypeA', 5, () => {
    return 1;
  });

  kernel32.register('LCMapStringA', 6, () => {
    return 0;
  });

  kernel32.register('LCMapStringW', 6, () => {
    return 0;
  });

  kernel32.register('GetLocaleInfoA', 4, () => {
    const _lcid = emu.readArg(0);
    const lcType = emu.readArg(1);
    const buf = emu.readArg(2);
    const cchBuf = emu.readArg(3);
    const defaults: Record<number, string> = {
      0x0001: '0', 0x0002: 'English (United States)',
      0x000C: ';', 0x000D: '0', 0x000E: '.', 0x000F: ',', 0x0010: '3;0',
      0x0011: '2', 0x0012: '1',
      0x001D: '/', 0x001E: ':',
      0x001F: 'M/d/yyyy', 0x0028: 'AM', 0x0029: 'PM',
      0x0020: 'dddd, MMMM dd, yyyy', 0x0023: '0', 0x0025: '1', 0x1003: 'h:mm:ss tt', 0x1005: '0',
    };
    const str = defaults[lcType & 0xFFFF] || '';
    if (!str) return 0;
    if (cchBuf === 0) return str.length + 1;
    if (buf && cchBuf > 0) {
      for (let i = 0; i < Math.min(str.length, cchBuf - 1); i++) {
        emu.memory.writeU8(buf + i, str.charCodeAt(i) & 0xFF);
      }
      emu.memory.writeU8(buf + Math.min(str.length, cchBuf - 1), 0);
    }
    return Math.min(str.length + 1, cchBuf);
  });
  kernel32.register('GetLocaleInfoW', 4, () => {
    const _lcid = emu.readArg(0);
    const lcType = emu.readArg(1);
    const buf = emu.readArg(2);
    const cchBuf = emu.readArg(3);
    // Return simple defaults for common locale types
    const defaults: Record<number, string> = {
      0x0001: '0',     // LOCALE_ILANGUAGE
      0x0002: 'English (United States)', // LOCALE_SLANGUAGE
      0x000C: ';',     // LOCALE_SLIST
      0x000D: '0',     // LOCALE_IMEASURE
      0x000E: '.',     // LOCALE_SDECIMAL
      0x000F: ',',     // LOCALE_STHOUSAND
      0x0010: '3;0',   // LOCALE_SGROUPING
      0x0011: '2',     // LOCALE_IDIGITS
      0x0012: '1',     // LOCALE_ILZERO
      0x001D: '/',     // LOCALE_SDATE
      0x001E: ':',     // LOCALE_STIME
      0x001F: 'M/d/yyyy', // LOCALE_SSHORTDATE
      0x0020: 'dddd, MMMM dd, yyyy', // LOCALE_SLONGDATE
      0x0023: '0',     // LOCALE_ITIME (0=12hr)
      0x0025: '1',     // LOCALE_ITLZERO (leading zeros)
      0x0028: 'AM',    // LOCALE_S1159
      0x0029: 'PM',    // LOCALE_S2359
      0x1003: 'h:mm:ss tt', // LOCALE_STIMEFORMAT
      0x1005: '0',     // LOCALE_ITIMEMARKPOSN (0=suffix)
    };
    const str = defaults[lcType & 0xFFFF] || '';
    if (cchBuf === 0) return str.length + 1; // query size
    if (buf && cchBuf > 0) {
      for (let i = 0; i < Math.min(str.length, cchBuf - 1); i++) {
        emu.memory.writeU16(buf + i * 2, str.charCodeAt(i));
      }
      emu.memory.writeU16(buf + Math.min(str.length, cchBuf - 1) * 2, 0);
    }
    return Math.min(str.length + 1, cchBuf);
  });
  // GetNumberFormatW: format a number string with locale-specific grouping/separators
  // int GetNumberFormatW(LCID, DWORD, LPCWSTR lpValue, const NUMBERFMTW*, LPWSTR, int)
  kernel32.register('GetNumberFormatW', 6, () => {
    const _locale = emu.readArg(0);
    const _dwFlags = emu.readArg(1);
    const lpValue = emu.readArg(2);
    const lpFormat = emu.readArg(3);
    const lpBuf = emu.readArg(4);
    const cchBuf = emu.readArg(5);

    const valueStr = emu.memory.readUTF16String(lpValue);

    // Parse format or use defaults
    let numDigits = 0;
    let leadingZero = 1;
    let grouping = 3;
    let decSep = '.';
    let thousandSep = ',';
    let negOrder = 1;

    if (lpFormat) {
      numDigits = emu.memory.readU32(lpFormat);
      leadingZero = emu.memory.readU32(lpFormat + 4);
      grouping = emu.memory.readU32(lpFormat + 8);
      const decSepPtr = emu.memory.readU32(lpFormat + 12);
      const thousandSepPtr = emu.memory.readU32(lpFormat + 16);
      negOrder = emu.memory.readU32(lpFormat + 20);
      if (decSepPtr) decSep = emu.memory.readUTF16String(decSepPtr);
      if (thousandSepPtr) thousandSep = emu.memory.readUTF16String(thousandSepPtr);
    }

    // Format the number
    const num = parseFloat(valueStr);
    const isNeg = num < 0;
    const abs = Math.abs(num);
    let formatted = abs.toFixed(numDigits);

    // Apply thousand separators to integer part
    const parts = formatted.split('.');
    let intPart = parts[0];
    if (grouping > 0 && thousandSep) {
      let result = '';
      let count = 0;
      for (let i = intPart.length - 1; i >= 0; i--) {
        if (count > 0 && count % grouping === 0) result = thousandSep + result;
        result = intPart[i] + result;
        count++;
      }
      intPart = result;
    }
    formatted = parts.length > 1 ? intPart + decSep + parts[1] : intPart;

    // Handle leading zero
    if (!leadingZero && formatted.startsWith('0' + decSep)) {
      formatted = formatted.substring(1);
    }

    // Handle negative
    if (isNeg) {
      switch (negOrder) {
        case 0: formatted = '(' + formatted + ')'; break;
        case 1: formatted = '-' + formatted; break;
        case 2: formatted = '- ' + formatted; break;
        case 3: formatted = formatted + '-'; break;
        case 4: formatted = formatted + ' -'; break;
      }
    }

    if (cchBuf === 0) return formatted.length + 1;
    if (lpBuf && cchBuf > 0) {
      const toWrite = formatted.substring(0, cchBuf - 1);
      for (let i = 0; i < toWrite.length; i++) {
        emu.memory.writeU16(lpBuf + i * 2, toWrite.charCodeAt(i));
      }
      emu.memory.writeU16(lpBuf + toWrite.length * 2, 0);
    }
    return formatted.length + 1;
  });

  kernel32.register('GetOEMCP', 0, () => 437);
  kernel32.register('GetUserDefaultLCID', 0, () => 0x0409);
  kernel32.register('GetSystemDefaultLCID', 0, () => 0x0409);
  kernel32.register('GetThreadLocale', 0, () => 0x0409);
  kernel32.register('IsDBCSLeadByte', 1, () => 0);
  kernel32.register('IsDBCSLeadByteEx', 2, () => 0);
  kernel32.register('GetUserDefaultLangID', 0, () => 0x0409);
  kernel32.register('GetDateFormatW', 6, () => 0);
  kernel32.register('GetTimeFormatW', 6, () => 0);
  kernel32.register('FormatMessageW', 7, () => {
    const FORMAT_MESSAGE_FROM_STRING = 0x00000400;
    const FORMAT_MESSAGE_FROM_HMODULE = 0x00000800;
    const FORMAT_MESSAGE_FROM_SYSTEM = 0x00001000;
    const FORMAT_MESSAGE_IGNORE_INSERTS = 0x00000200;
    const FORMAT_MESSAGE_ARGUMENT_ARRAY = 0x00002000;
    const FORMAT_MESSAGE_ALLOCATE_BUFFER = 0x00000100;
    const RT_MESSAGETABLE = 11;

    const dwFlags = emu.readArg(0);
    const lpSource = emu.readArg(1);
    const dwMessageId = emu.readArg(2);
    const _dwLanguageId = emu.readArg(3);
    const lpBuffer = emu.readArg(4);
    const nSize = emu.readArg(5);
    const vaArgs = emu.readArg(6);

    // Try to find message from module's message table resource
    let msgText: string | null = null;
    if (dwFlags & FORMAT_MESSAGE_FROM_STRING) {
      // lpSource is a pointer to the format string
      if (lpSource) {
        msgText = emu.memory.readUTF16String(lpSource);
      }
    } else if (dwFlags & (FORMAT_MESSAGE_FROM_HMODULE | FORMAT_MESSAGE_FROM_SYSTEM)) {
      // Find RT_MESSAGETABLE resource (ID 1 is typical)
      const entry = emu.findResourceEntry(RT_MESSAGETABLE, 1);
      if (entry) {
        const dataAddr = (emu.pe.imageBase + entry.dataRva) >>> 0;
        const numBlocks = emu.memory.readU32(dataAddr);
        let blockOff = dataAddr + 4;
        for (let i = 0; i < numBlocks; i++) {
          const lowId = emu.memory.readU32(blockOff);
          const highId = emu.memory.readU32(blockOff + 4);
          const offsetToEntries = emu.memory.readU32(blockOff + 8);
          blockOff += 12;
          if (dwMessageId >= lowId && dwMessageId <= highId) {
            // Walk entries from lowId to dwMessageId
            let entryAddr = dataAddr + offsetToEntries;
            for (let id = lowId; id <= highId; id++) {
              const entryLen = emu.memory.readU16(entryAddr);
              const flags = emu.memory.readU16(entryAddr + 2); // 0=ANSI, 1=Unicode
              if (id === dwMessageId) {
                if (flags & 1) {
                  // Unicode
                  let s = '';
                  for (let k = 4; k < entryLen - 2; k += 2) {
                    const ch = emu.memory.readU16(entryAddr + k);
                    if (ch === 0) break;
                    s += String.fromCharCode(ch);
                  }
                  msgText = s;
                } else {
                  // ANSI
                  let s = '';
                  for (let k = 4; k < entryLen - 1; k++) {
                    const ch = emu.memory.readU8(entryAddr + k);
                    if (ch === 0) break;
                    s += String.fromCharCode(ch);
                  }
                  msgText = s;
                }
                break;
              }
              entryAddr += entryLen;
            }
            break;
          }
        }
      }
    }

    if (msgText === null) return 0;

    // Handle %0 — terminates output (truncate everything from %0 onwards)
    const pctZeroIdx = msgText.indexOf('%0');
    if (pctZeroIdx >= 0) msgText = msgText.substring(0, pctZeroIdx);

    // Handle argument substitution unless IGNORE_INSERTS
    if (!(dwFlags & FORMAT_MESSAGE_IGNORE_INSERTS) && vaArgs) {
      // Replace %1, %2, etc. with arguments (treat as string pointers)
      msgText = msgText.replace(/%(\d+)/g, (_match, numStr) => {
        const idx = parseInt(numStr) - 1;
        let argBase: number;
        if (dwFlags & FORMAT_MESSAGE_ARGUMENT_ARRAY) {
          // vaArgs points directly to an array of DWORD_PTR values
          argBase = vaArgs;
        } else {
          // vaArgs is a va_list* — dereference once to get the args base
          argBase = emu.memory.readU32(vaArgs);
        }
        const argVal = emu.memory.readU32(argBase + idx * 4);
        if (argVal) {
          try { return emu.memory.readUTF16String(argVal); } catch { /* */ }
        }
        return '';
      });
    }

    // Write to buffer
    if (dwFlags & FORMAT_MESSAGE_ALLOCATE_BUFFER) {
      const allocSize = (msgText.length + 1) * 2;
      const bufAddr = emu.allocHeap(allocSize);
      emu.memory.writeUTF16String(bufAddr, msgText);
      emu.memory.writeU32(lpBuffer, bufAddr);
    } else if (lpBuffer && nSize > 0) {
      const toWrite = msgText.substring(0, nSize - 1);
      emu.memory.writeUTF16String(lpBuffer, toWrite);
    }
    return msgText.length;
  });
  kernel32.register('FormatMessageA', 7, () => {
    // Simplified A variant - return 0 (failure) for now
    return 0;
  });
  kernel32.register('FoldStringW', 5, () => 0);

  // EnumSystemLocalesW: return TRUE without calling callback
  // CRT uses this to build locale tables; empty table still works
  kernel32.register('EnumSystemLocalesW', 2, () => 1);

  // IsValidLocale: return TRUE for any locale
  kernel32.register('IsValidLocale', 2, () => {
    return 1; // TRUE — locale is valid
  });

  // GetUserDefaultUILanguage: return 0x0409 (en-US)
  kernel32.register('GetUserDefaultUILanguage', 0, () => 0x0409);

  // SetThreadUILanguage: return the language passed in
  kernel32.register('SetThreadUILanguage', 1, () => {
    return emu.readArg(0) || 0x0409;
  });

  // GetCPInfoExW: fill CPINFOEXW struct
  kernel32.register('GetCPInfoExW', 3, () => {
    const codePage = emu.readArg(0);
    const _flags = emu.readArg(1);
    const lpCPInfoEx = emu.readArg(2);
    if (lpCPInfoEx) {
      emu.memory.writeU32(lpCPInfoEx, 1); // MaxCharSize
      emu.memory.writeU8(lpCPInfoEx + 4, 0x3F); // DefaultChar[0] = '?'
      emu.memory.writeU8(lpCPInfoEx + 5, 0);     // DefaultChar[1]
      // LeadByte[12] = all zeros (no lead bytes)
      for (let i = 0; i < 12; i++) emu.memory.writeU8(lpCPInfoEx + 6 + i, 0);
      // UnicodeDefaultChar
      emu.memory.writeU16(lpCPInfoEx + 18, 0x003F);
      // CodePage
      emu.memory.writeU32(lpCPInfoEx + 20, codePage);
      // CodePageName — empty string
      emu.memory.writeU16(lpCPInfoEx + 24, 0);
    }
    return 1;
  });

  // EnumSystemCodePagesW: just return TRUE without calling callback
  kernel32.register('EnumSystemCodePagesW', 2, () => 1);

  // GetConsoleCP: return code page 437
  kernel32.register('GetConsoleCP', 0, () => 437);

  // MulDiv(a, b, c) = (a * b) / c with 64-bit intermediate
  kernel32.register('MulDiv', 3, () => {
    const a = emu.readArg(0) | 0;
    const b = emu.readArg(1) | 0;
    const c = emu.readArg(2) | 0;
    if (c === 0) return -1;
    const result = Number(BigInt(a) * BigInt(b) / BigInt(c));
    return result | 0;
  });

  kernel32.register('GetStringTypeExW', 5, () => {
    return 1;
  });

  // EnumSystemLocalesA(LOCALE_ENUMPROCA, DWORD) — return TRUE without calling callback
  kernel32.register('EnumSystemLocalesA', 2, () => 1);

  // GetDateFormatA(LCID, DWORD, SYSTEMTIME*, LPCSTR, LPSTR, int) — return empty string
  kernel32.register('GetDateFormatA', 6, () => {
    const buf = emu.readArg(4);
    const cch = emu.readArg(5);
    if (buf && cch > 0) emu.memory.writeU8(buf, 0);
    return 1;
  });

  // GetTimeFormatA(LCID, DWORD, SYSTEMTIME*, LPCSTR, LPSTR, int) — return empty string
  kernel32.register('GetTimeFormatA', 6, () => {
    const buf = emu.readArg(4);
    const cch = emu.readArg(5);
    if (buf && cch > 0) emu.memory.writeU8(buf, 0);
    return 1;
  });
}

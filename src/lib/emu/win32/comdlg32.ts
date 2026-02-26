import type { Emulator } from '../emulator';
import { emuCompleteThunk } from '../emu-exec';

export function registerComdlg32(emu: Emulator): void {
  const comdlg32 = emu.registerDll('COMDLG32.DLL');

  // OPENFILENAME struct offsets (32-bit)
  const OFN_lpstrFilter = 0x0C;
  const OFN_lpstrFile = 0x1C;
  const OFN_nMaxFile = 0x20;
  const OFN_lpstrTitle = 0x30;
  const OFN_nFileOffset = 0x38;
  const OFN_nFileExtension = 0x3A;

  function parseFilter(filterPtr: number, isWide: boolean): string {
    if (!filterPtr) return '';
    // Filter is pairs of null-terminated strings (description\0pattern\0...\0\0)
    const parts: string[] = [];
    let ptr = filterPtr;
    for (let i = 0; i < 20; i++) { // safety limit
      const s = isWide ? emu.memory.readUTF16String(ptr) : emu.memory.readCString(ptr);
      if (!s) break;
      parts.push(s);
      ptr += isWide ? (s.length + 1) * 2 : s.length + 1;
    }
    return parts.join('|');
  }

  function doGetOpenFileName(isWide: boolean): number | undefined {
    const lpOfn = emu.readArg(0);
    if (!lpOfn) return 0;

    const filterPtr = emu.memory.readU32(lpOfn + OFN_lpstrFilter);
    const filePtr = emu.memory.readU32(lpOfn + OFN_lpstrFile);
    const nMaxFile = emu.memory.readU32(lpOfn + OFN_nMaxFile);
    const titlePtr = emu.memory.readU32(lpOfn + OFN_lpstrTitle);

    const filter = parseFilter(filterPtr, isWide);
    const title = titlePtr ? (isWide ? emu.memory.readUTF16String(titlePtr) : emu.memory.readCString(titlePtr)) : '';

    if (!emu.onFileDialog) return 0;

    // Show browser file picker — wait for result
    const stackBytes = emu._currentThunkStackBytes;
    emu.waitingForMessage = true;
    emu.onFileDialog('open', filter, title).then(result => {
      let retVal = 0;
      if (result) {
        // Store file data in externalFiles under Z:\<filename>
        const data = new Uint8Array(result.data);
        const zPath = 'Z:\\' + result.name;
        const zPathUpper = zPath.toUpperCase();
        emu.fs.externalFiles.set(zPathUpper, { data, name: result.name });

        // Write path to lpstrFile buffer
        if (filePtr && nMaxFile > 0) {
          if (isWide) {
            const toWrite = zPath.substring(0, nMaxFile - 1);
            for (let i = 0; i < toWrite.length; i++) {
              emu.memory.writeU16(filePtr + i * 2, toWrite.charCodeAt(i));
            }
            emu.memory.writeU16(filePtr + toWrite.length * 2, 0);
          } else {
            const toWrite = zPath.substring(0, nMaxFile - 1);
            for (let i = 0; i < toWrite.length; i++) {
              emu.memory.writeU8(filePtr + i, toWrite.charCodeAt(i) & 0xFF);
            }
            emu.memory.writeU8(filePtr + toWrite.length, 0);
          }
        }

        // Set nFileOffset (offset to filename part after last backslash)
        const lastSlash = zPath.lastIndexOf('\\');
        emu.memory.writeU16(lpOfn + OFN_nFileOffset, lastSlash + 1);

        // Set nFileExtension (offset to extension after last dot)
        const lastDot = zPath.lastIndexOf('.');
        emu.memory.writeU16(lpOfn + OFN_nFileExtension, lastDot >= 0 ? lastDot + 1 : 0);
        retVal = 1;
      }
      emu.waitingForMessage = false;
      emuCompleteThunk(emu, retVal, stackBytes);
      if (emu.running && !emu.halted) {
        requestAnimationFrame(emu.tick);
      }
    });
    return undefined;
  }

  function doGetSaveFileName(isWide: boolean): number | undefined {
    const lpOfn = emu.readArg(0);
    if (!lpOfn) return 0;

    const filterPtr = emu.memory.readU32(lpOfn + OFN_lpstrFilter);
    const filePtr = emu.memory.readU32(lpOfn + OFN_lpstrFile);
    const nMaxFile = emu.memory.readU32(lpOfn + OFN_nMaxFile);
    const titlePtr = emu.memory.readU32(lpOfn + OFN_lpstrTitle);

    const filter = parseFilter(filterPtr, isWide);
    const title = titlePtr ? (isWide ? emu.memory.readUTF16String(titlePtr) : emu.memory.readCString(titlePtr)) : '';

    // Read existing filename from lpstrFile as default name
    let defaultName = '';
    if (filePtr) {
      defaultName = isWide ? emu.memory.readUTF16String(filePtr) : emu.memory.readCString(filePtr);
    }

    if (!emu.onFileDialog) return 0;

    const stackBytes = emu._currentThunkStackBytes;
    emu.waitingForMessage = true;
    emu.onFileDialog('save', filter, title).then(result => {
      let retVal = 0;
      if (result) {
        // For save, just set up the path — actual data written later via WriteFile/CloseHandle
        const zPath = 'Z:\\' + result.name;
        const zPathUpper = zPath.toUpperCase();

        // Pre-create an empty entry so CreateFile can find it
        if (!emu.fs.externalFiles.has(zPathUpper)) {
          emu.fs.externalFiles.set(zPathUpper, { data: new Uint8Array(0), name: result.name });
        }

        // Write path to lpstrFile buffer
        if (filePtr && nMaxFile > 0) {
          if (isWide) {
            const toWrite = zPath.substring(0, nMaxFile - 1);
            for (let i = 0; i < toWrite.length; i++) {
              emu.memory.writeU16(filePtr + i * 2, toWrite.charCodeAt(i));
            }
            emu.memory.writeU16(filePtr + toWrite.length * 2, 0);
          } else {
            const toWrite = zPath.substring(0, nMaxFile - 1);
            for (let i = 0; i < toWrite.length; i++) {
              emu.memory.writeU8(filePtr + i, toWrite.charCodeAt(i) & 0xFF);
            }
            emu.memory.writeU8(filePtr + toWrite.length, 0);
          }
        }

        const lastSlash = zPath.lastIndexOf('\\');
        emu.memory.writeU16(lpOfn + OFN_nFileOffset, lastSlash + 1);
        const lastDot = zPath.lastIndexOf('.');
        emu.memory.writeU16(lpOfn + OFN_nFileExtension, lastDot >= 0 ? lastDot + 1 : 0);
        retVal = 1;
      }
      emu.waitingForMessage = false;
      emuCompleteThunk(emu, retVal, stackBytes);
      if (emu.running && !emu.halted) {
        requestAnimationFrame(emu.tick);
      }
    });
    return undefined;
  }

  comdlg32.register('GetOpenFileNameA', 1, () => doGetOpenFileName(false));
  comdlg32.register('GetSaveFileNameA', 1, () => doGetSaveFileName(false));
  comdlg32.register('GetOpenFileNameW', 1, () => doGetOpenFileName(true));
  comdlg32.register('GetSaveFileNameW', 1, () => doGetSaveFileName(true));
  comdlg32.register('ChooseFontW', 1, () => 0);
  comdlg32.register('FindTextW', 1, () => 0);
  comdlg32.register('ReplaceTextW', 1, () => 0);
  comdlg32.register('PrintDlgExW', 1, () => 1); // E_FAIL
  comdlg32.register('GetFileTitleW', 3, () => 0);
  comdlg32.register('PageSetupDlgW', 1, () => 0);
  comdlg32.register('CommDlgExtendedError', 0, () => 0);
}

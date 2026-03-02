import type { Emulator } from '../../emulator';
import { emuCompleteThunk } from '../../emu-exec';

const STD_INPUT_HANDLE = 0xFFFFFFF6;
const STD_OUTPUT_HANDLE = 0xFFFFFFF5;
const STD_ERROR_HANDLE = 0xFFFFFFF4;

export function registerConsole(emu: Emulator): void {
  const kernel32 = emu.registerDll('KERNEL32.DLL');

  kernel32.register('GetStdHandle', 1, () => {
    const n = emu.readArg(0);
    if (n === (STD_INPUT_HANDLE >>> 0)) return STD_INPUT_HANDLE;
    if (n === (STD_OUTPUT_HANDLE >>> 0)) return STD_OUTPUT_HANDLE;
    if (n === (STD_ERROR_HANDLE >>> 0)) return STD_ERROR_HANDLE;
    return 0xFFFFFFFF;
  });

  kernel32.register('GetConsoleMode', 2, () => {
    const hConsole = emu.readArg(0);
    const lpMode = emu.readArg(1);
    if (lpMode) {
      if (hConsole === (STD_INPUT_HANDLE >>> 0)) {
        emu.memory.writeU32(lpMode, emu.consoleInputMode);
      } else {
        emu.memory.writeU32(lpMode, emu.consoleMode);
      }
    }
    return 1;
  });

  kernel32.register('SetConsoleMode', 2, () => {
    const hConsole = emu.readArg(0);
    const dwMode = emu.readArg(1);
    if (hConsole === (STD_INPUT_HANDLE >>> 0)) {
      emu.consoleInputMode = dwMode;
    } else {
      emu.consoleMode = dwMode;
    }
    return 1;
  });

  kernel32.register('GetConsoleOutputCP', 0, () => 437);

  kernel32.register('GetConsoleScreenBufferInfo', 2, () => {
    const _hConsole = emu.readArg(0);
    const lpInfo = emu.readArg(1);
    if (lpInfo) {
      // CONSOLE_SCREEN_BUFFER_INFO (22 bytes)
      emu.memory.writeU16(lpInfo + 0, 80);  // dwSize.X
      emu.memory.writeU16(lpInfo + 2, 25);  // dwSize.Y
      emu.memory.writeU16(lpInfo + 4, emu.consoleCursorX); // dwCursorPosition.X
      emu.memory.writeU16(lpInfo + 6, emu.consoleCursorY); // dwCursorPosition.Y
      emu.memory.writeU16(lpInfo + 8, emu.consoleAttr);    // wAttributes
      // srWindow: left, top, right, bottom
      emu.memory.writeU16(lpInfo + 10, 0);   // Left
      emu.memory.writeU16(lpInfo + 12, 0);   // Top
      emu.memory.writeU16(lpInfo + 14, 79);  // Right
      emu.memory.writeU16(lpInfo + 16, 24);  // Bottom
      // dwMaximumWindowSize
      emu.memory.writeU16(lpInfo + 18, 80);
      emu.memory.writeU16(lpInfo + 20, 25);
    }
    return 1;
  });

  kernel32.register('SetConsoleCursorPosition', 2, () => {
    const _hConsole = emu.readArg(0);
    const dwCoord = emu.readArg(1); // packed COORD: low 16 = X, high 16 = Y
    emu.consoleCursorX = dwCoord & 0xFFFF;
    emu.consoleCursorY = (dwCoord >>> 16) & 0xFFFF;
    return 1;
  });

  kernel32.register('SetConsoleTextAttribute', 2, () => {
    const _hConsole = emu.readArg(0);
    const wAttr = emu.readArg(1);
    emu.consoleAttr = wAttr & 0xFF;
    return 1;
  });

  kernel32.register('FillConsoleOutputCharacterW', 5, () => {
    const _hConsole = emu.readArg(0);
    const cChar = emu.readArg(1) & 0xFFFF;
    const nLength = emu.readArg(2);
    const dwWriteCoord = emu.readArg(3); // packed COORD
    const lpWritten = emu.readArg(4);

    let x = dwWriteCoord & 0xFFFF;
    let y = (dwWriteCoord >>> 16) & 0xFFFF;
    let written = 0;
    for (let i = 0; i < nLength && y < 25; i++) {
      const idx = y * 80 + x;
      if (idx >= 0 && idx < emu.consoleBuffer.length) {
        emu.consoleBuffer[idx].char = cChar;
      }
      x++;
      if (x >= 80) { x = 0; y++; }
      written++;
    }
    if (lpWritten) emu.memory.writeU32(lpWritten, written);
    emu.onConsoleOutput?.();
    return 1;
  });

  kernel32.register('FillConsoleOutputAttribute', 5, () => {
    const _hConsole = emu.readArg(0);
    const wAttr = emu.readArg(1) & 0xFF;
    const nLength = emu.readArg(2);
    const dwWriteCoord = emu.readArg(3); // packed COORD
    const lpWritten = emu.readArg(4);

    let x = dwWriteCoord & 0xFFFF;
    let y = (dwWriteCoord >>> 16) & 0xFFFF;
    let written = 0;
    for (let i = 0; i < nLength && y < 25; i++) {
      const idx = y * 80 + x;
      if (idx >= 0 && idx < emu.consoleBuffer.length) {
        emu.consoleBuffer[idx].attr = wAttr;
      }
      x++;
      if (x >= 80) { x = 0; y++; }
      written++;
    }
    if (lpWritten) emu.memory.writeU32(lpWritten, written);
    emu.onConsoleOutput?.();
    return 1;
  });

  kernel32.register('WriteConsoleW', 5, () => {
    const _hConsole = emu.readArg(0);
    const bufPtr = emu.readArg(1);
    const nChars = emu.readArg(2);
    const writtenPtr = emu.readArg(3);

    if (bufPtr && nChars > 0) {
      let text = '';
      for (let i = 0; i < nChars; i++) {
        const ch = emu.memory.readU16(bufPtr + i * 2);
        text += String.fromCharCode(ch);
        emu.consoleWriteChar(ch);
      }
      console.log(`[WriteConsoleW] "${text.replace(/\r?\n/g, '\\n')}"`);
      emu.onConsoleOutput?.();
    }
    if (writtenPtr) emu.memory.writeU32(writtenPtr, nChars);
    return 1;
  });

  // Override WriteConsoleA to use console buffer too
  kernel32.register('WriteConsoleA', 5, () => {
    const _hConsole = emu.readArg(0);
    const bufPtr = emu.readArg(1);
    const nChars = emu.readArg(2);
    const writtenPtr = emu.readArg(3);

    if (bufPtr && nChars > 0) {
      for (let i = 0; i < nChars; i++) {
        const ch = emu.memory.readU8(bufPtr + i);
        emu.consoleWriteChar(ch);
      }
      emu.onConsoleOutput?.();
    }
    if (writtenPtr) emu.memory.writeU32(writtenPtr, nChars);
    return 1;
  });

  kernel32.register('ReadConsoleW', 5, () => {
    const _hConsole = emu.readArg(0);
    const bufPtr = emu.readArg(1);
    const nCharsToRead = emu.readArg(2);
    const charsReadPtr = emu.readArg(3);

    if (emu.consoleInputBuffer.length === 0) {
      // Block — need to wait for input
      emu._pendingReadConsole = { bufPtr, nCharsToRead, charsReadPtr };
      // Initialize line edit state
      emu._lineEditBuffer = [];
      emu._lineEditCursor = 0;
      emu._lineEditStartX = emu.consoleCursorX;
      emu._lineEditStartY = emu.consoleCursorY;
      emu._commandHistoryIndex = emu._commandHistory.length;
      const stackBytes = emu._currentThunkStackBytes;
      emu.waitingForMessage = true;
      emu._consoleInputResume = { stackBytes, completer: emuCompleteThunk };
      return undefined;
    }

    // Read available chars
    let count = 0;
    while (count < nCharsToRead && emu.consoleInputBuffer.length > 0) {
      const evt = emu.consoleInputBuffer.shift()!;
      emu.memory.writeU16(bufPtr + count * 2, evt.char);
      count++;
    }
    if (charsReadPtr) emu.memory.writeU32(charsReadPtr, count);
    return 1;
  });

  // ReadConsoleInputA/W — reads INPUT_RECORD structs (used by "pause" command)
  // INPUT_RECORD is 20 bytes: EventType(2) + padding(2) + union(16)
  // KEY_EVENT_RECORD: bKeyDown(4), wRepeatCount(2), wVirtualKeyCode(2), wVirtualScanCode(2), uChar(2), dwControlKeyState(4)
  function handleReadConsoleInput(isWide: boolean) {
    const _hConsole = emu.readArg(0);
    const bufPtr = emu.readArg(1);
    const nLength = emu.readArg(2);
    const eventsReadPtr = emu.readArg(3);

    console.log(`[ReadConsoleInput] bufLen=${emu.consoleInputBuffer.length}`);
    if (emu.consoleInputBuffer.length === 0) {
      emu._pendingReadConsoleInput = { bufPtr, nLength, eventsReadPtr, isWide };
      const stackBytes = emu._currentThunkStackBytes;
      emu.waitingForMessage = true;
      emu._consoleInputResume = { stackBytes, completer: emuCompleteThunk };
      return undefined;
    }

    // Fill one KEY_EVENT INPUT_RECORD from the first key event
    const evt = emu.consoleInputBuffer.shift()!;
    const KEY_EVENT = 0x0001;
    // Zero out the record (20 bytes)
    for (let i = 0; i < 20; i++) emu.memory.writeU8(bufPtr + i, 0);
    emu.memory.writeU16(bufPtr, KEY_EVENT);           // EventType
    emu.memory.writeU32(bufPtr + 4, 1);               // bKeyDown = TRUE
    emu.memory.writeU16(bufPtr + 8, 1);               // wRepeatCount
    emu.memory.writeU16(bufPtr + 10, evt.vk);         // wVirtualKeyCode
    emu.memory.writeU16(bufPtr + 12, evt.scan);       // wVirtualScanCode
    if (isWide) {
      emu.memory.writeU16(bufPtr + 14, evt.char);     // UnicodeChar
    } else {
      emu.memory.writeU8(bufPtr + 14, evt.char & 0xFF); // AsciiChar
    }
    if (eventsReadPtr) emu.memory.writeU32(eventsReadPtr, 1);
    return 1;
  }

  kernel32.register('ReadConsoleInputA', 4, () => handleReadConsoleInput(false));
  kernel32.register('ReadConsoleInputW', 4, () => handleReadConsoleInput(true));

  kernel32.register('FlushConsoleInputBuffer', 1, () => {
    emu.consoleInputBuffer.length = 0;
    return 1;
  });

  kernel32.register('SetConsoleTitleA', 1, () => {
    const lpTitle = emu.readArg(0);
    if (lpTitle) emu.consoleTitle = emu.memory.readCString(lpTitle);
    emu.onConsoleTitleChange?.();
    return 1;
  });

  kernel32.register('SetConsoleTitleW', 1, () => {
    const lpTitle = emu.readArg(0);
    if (lpTitle) emu.consoleTitle = emu.memory.readUTF16String(lpTitle);
    emu.onConsoleTitleChange?.();
    return 1;
  });

  kernel32.register('GetConsoleTitleW', 2, () => {
    const lpTitle = emu.readArg(0);
    const nSize = emu.readArg(1);
    if (lpTitle && nSize > 0) {
      emu.memory.writeUTF16String(lpTitle, emu.consoleTitle.substring(0, nSize - 1));
    }
    return emu.consoleTitle.length;
  });

  kernel32.register('SetConsoleCtrlHandler', 2, () => 1);

  // GetNumberOfConsoleInputEvents(hConsoleInput, lpcNumberOfEvents) → BOOL
  kernel32.register('GetNumberOfConsoleInputEvents', 2, () => {
    const _hConsole = emu.readArg(0);
    const lpEvents = emu.readArg(1);
    if (lpEvents) emu.memory.writeU32(lpEvents, emu.consoleInputBuffer.length);
    return 1;
  });

  // PeekConsoleInputA(hConsoleInput, lpBuffer, nLength, lpNumberOfEventsRead) → BOOL
  kernel32.register('PeekConsoleInputA', 4, () => {
    const _hConsole = emu.readArg(0);
    const lpBuffer = emu.readArg(1);
    const nLength = emu.readArg(2);
    const lpEventsRead = emu.readArg(3);
    const count = Math.min(nLength, emu.consoleInputBuffer.length);
    for (let i = 0; i < count; i++) {
      const evt = emu.consoleInputBuffer[i];
      const base = lpBuffer + i * 20;
      for (let j = 0; j < 20; j++) emu.memory.writeU8(base + j, 0);
      const KEY_EVENT = 0x0001;
      emu.memory.writeU16(base, KEY_EVENT);
      emu.memory.writeU32(base + 4, 1); // bKeyDown
      emu.memory.writeU16(base + 8, 1); // wRepeatCount
      emu.memory.writeU16(base + 10, evt.vk);
      emu.memory.writeU16(base + 12, evt.scan);
      emu.memory.writeU8(base + 14, evt.char & 0xFF);
    }
    if (lpEventsRead) emu.memory.writeU32(lpEventsRead, count);
    return 1;
  });

  // WriteConsoleOutputCharacterA(hConsoleOutput, lpCharacter, nLength, dwWriteCoord, lpNumberOfCharsWritten) → BOOL
  kernel32.register('WriteConsoleOutputCharacterA', 5, () => {
    const _hConsole = emu.readArg(0);
    const lpChar = emu.readArg(1);
    const nLength = emu.readArg(2);
    const dwCoord = emu.readArg(3);
    const lpWritten = emu.readArg(4);
    let x = dwCoord & 0xFFFF;
    let y = (dwCoord >>> 16) & 0xFFFF;
    let written = 0;
    for (let i = 0; i < nLength && y < 25; i++) {
      const idx = y * 80 + x;
      if (idx >= 0 && idx < emu.consoleBuffer.length) {
        emu.consoleBuffer[idx].char = emu.memory.readU8(lpChar + i);
      }
      x++; if (x >= 80) { x = 0; y++; }
      written++;
    }
    if (lpWritten) emu.memory.writeU32(lpWritten, written);
    emu.onConsoleOutput?.();
    return 1;
  });

  // WriteConsoleOutputCharacterW — same but reads UTF-16
  kernel32.register('WriteConsoleOutputCharacterW', 5, () => {
    const _hConsole = emu.readArg(0);
    const lpChar = emu.readArg(1);
    const nLength = emu.readArg(2);
    const dwCoord = emu.readArg(3);
    const lpWritten = emu.readArg(4);
    let x = dwCoord & 0xFFFF;
    let y = (dwCoord >>> 16) & 0xFFFF;
    let written = 0;
    for (let i = 0; i < nLength && y < 25; i++) {
      const idx = y * 80 + x;
      if (idx >= 0 && idx < emu.consoleBuffer.length) {
        emu.consoleBuffer[idx].char = emu.memory.readU16(lpChar + i * 2);
      }
      x++; if (x >= 80) { x = 0; y++; }
      written++;
    }
    if (lpWritten) emu.memory.writeU32(lpWritten, written);
    emu.onConsoleOutput?.();
    return 1;
  });

  // WriteConsoleOutputAttribute(hConsoleOutput, lpAttribute, nLength, dwWriteCoord, lpNumberOfAttrsWritten) → BOOL
  kernel32.register('WriteConsoleOutputAttribute', 5, () => {
    const _hConsole = emu.readArg(0);
    const lpAttr = emu.readArg(1);
    const nLength = emu.readArg(2);
    const dwCoord = emu.readArg(3);
    const lpWritten = emu.readArg(4);
    let x = dwCoord & 0xFFFF;
    let y = (dwCoord >>> 16) & 0xFFFF;
    let written = 0;
    for (let i = 0; i < nLength && y < 25; i++) {
      const idx = y * 80 + x;
      if (idx >= 0 && idx < emu.consoleBuffer.length) {
        emu.consoleBuffer[idx].attr = emu.memory.readU16(lpAttr + i * 2) & 0xFF;
      }
      x++; if (x >= 80) { x = 0; y++; }
      written++;
    }
    if (lpWritten) emu.memory.writeU32(lpWritten, written);
    emu.onConsoleOutput?.();
    return 1;
  });

  // WriteConsoleOutputA(hConsoleOutput, lpBuffer, dwBufferSize, dwBufferCoord, lpWriteRegion) → BOOL
  kernel32.register('WriteConsoleOutputA', 5, () => {
    const _hConsole = emu.readArg(0);
    const lpBuffer = emu.readArg(1);
    const dwBufferSize = emu.readArg(2);
    const dwBufferCoord = emu.readArg(3);
    const lpWriteRegion = emu.readArg(4);
    const bufW = dwBufferSize & 0xFFFF;
    const bufH = (dwBufferSize >>> 16) & 0xFFFF;
    const srcX = dwBufferCoord & 0xFFFF;
    const srcY = (dwBufferCoord >>> 16) & 0xFFFF;
    const dstLeft = emu.memory.readI16(lpWriteRegion);
    const dstTop = emu.memory.readI16(lpWriteRegion + 2);
    const dstRight = emu.memory.readI16(lpWriteRegion + 4);
    const dstBottom = emu.memory.readI16(lpWriteRegion + 6);
    // CHAR_INFO is 4 bytes: Char(2) + Attributes(2)
    for (let row = dstTop; row <= dstBottom && (row - dstTop + srcY) < bufH; row++) {
      for (let col = dstLeft; col <= dstRight && (col - dstLeft + srcX) < bufW; col++) {
        const bufIdx = ((row - dstTop + srcY) * bufW + (col - dstLeft + srcX)) * 4;
        const ch = emu.memory.readU8(lpBuffer + bufIdx); // AsciiChar
        const attr = emu.memory.readU16(lpBuffer + bufIdx + 2);
        const idx = row * 80 + col;
        if (idx >= 0 && idx < emu.consoleBuffer.length) {
          emu.consoleBuffer[idx].char = ch;
          emu.consoleBuffer[idx].attr = attr & 0xFF;
        }
      }
    }
    emu.onConsoleOutput?.();
    return 1;
  });

  // ReadConsoleOutputA(hConsoleOutput, lpBuffer, dwBufferSize, dwBufferCoord, lpReadRegion) → BOOL
  kernel32.register('ReadConsoleOutputA', 5, () => {
    const _hConsole = emu.readArg(0);
    const lpBuffer = emu.readArg(1);
    const dwBufferSize = emu.readArg(2);
    const dwBufferCoord = emu.readArg(3);
    const lpReadRegion = emu.readArg(4);
    const bufW = dwBufferSize & 0xFFFF;
    const bufH = (dwBufferSize >>> 16) & 0xFFFF;
    const srcX = dwBufferCoord & 0xFFFF;
    const srcY = (dwBufferCoord >>> 16) & 0xFFFF;
    const left = emu.memory.readI16(lpReadRegion);
    const top = emu.memory.readI16(lpReadRegion + 2);
    const right = emu.memory.readI16(lpReadRegion + 4);
    const bottom = emu.memory.readI16(lpReadRegion + 6);
    for (let row = top; row <= bottom && (row - top + srcY) < bufH; row++) {
      for (let col = left; col <= right && (col - left + srcX) < bufW; col++) {
        const bufIdx = ((row - top + srcY) * bufW + (col - left + srcX)) * 4;
        const idx = row * 80 + col;
        if (idx >= 0 && idx < emu.consoleBuffer.length) {
          emu.memory.writeU16(lpBuffer + bufIdx, emu.consoleBuffer[idx].char);
          emu.memory.writeU16(lpBuffer + bufIdx + 2, emu.consoleBuffer[idx].attr);
        } else {
          emu.memory.writeU16(lpBuffer + bufIdx, 0x20);
          emu.memory.writeU16(lpBuffer + bufIdx + 2, 0x07);
        }
      }
    }
    return 1;
  });

  // ReadConsoleOutputCharacterA(hConsoleOutput, lpCharacter, nLength, dwReadCoord, lpNumberOfCharsRead) → BOOL
  kernel32.register('ReadConsoleOutputCharacterA', 5, () => {
    const _hConsole = emu.readArg(0);
    const lpChar = emu.readArg(1);
    const nLength = emu.readArg(2);
    const dwCoord = emu.readArg(3);
    const lpRead = emu.readArg(4);
    let x = dwCoord & 0xFFFF;
    let y = (dwCoord >>> 16) & 0xFFFF;
    let count = 0;
    for (let i = 0; i < nLength && y < 25; i++) {
      const idx = y * 80 + x;
      const ch = (idx >= 0 && idx < emu.consoleBuffer.length) ? emu.consoleBuffer[idx].char & 0xFF : 0x20;
      emu.memory.writeU8(lpChar + i, ch);
      x++; if (x >= 80) { x = 0; y++; }
      count++;
    }
    if (lpRead) emu.memory.writeU32(lpRead, count);
    return 1;
  });

  // ReadConsoleOutputAttribute(hConsoleOutput, lpAttribute, nLength, dwReadCoord, lpNumberOfAttrsRead) → BOOL
  kernel32.register('ReadConsoleOutputAttribute', 5, () => {
    const _hConsole = emu.readArg(0);
    const lpAttr = emu.readArg(1);
    const nLength = emu.readArg(2);
    const dwCoord = emu.readArg(3);
    const lpRead = emu.readArg(4);
    let x = dwCoord & 0xFFFF;
    let y = (dwCoord >>> 16) & 0xFFFF;
    let count = 0;
    for (let i = 0; i < nLength && y < 25; i++) {
      const idx = y * 80 + x;
      const attr = (idx >= 0 && idx < emu.consoleBuffer.length) ? emu.consoleBuffer[idx].attr : 0x07;
      emu.memory.writeU16(lpAttr + i * 2, attr);
      x++; if (x >= 80) { x = 0; y++; }
      count++;
    }
    if (lpRead) emu.memory.writeU32(lpRead, count);
    return 1;
  });

  // GetConsoleTitleA(lpConsoleTitle, nSize) → DWORD
  kernel32.register('GetConsoleTitleA', 2, () => {
    const lpTitle = emu.readArg(0);
    const nSize = emu.readArg(1);
    if (lpTitle && nSize > 0) {
      const title = emu.consoleTitle;
      const len = Math.min(title.length, nSize - 1);
      for (let i = 0; i < len; i++) emu.memory.writeU8(lpTitle + i, title.charCodeAt(i) & 0xFF);
      emu.memory.writeU8(lpTitle + len, 0);
      return len;
    }
    return 0;
  });

  // SetConsoleCP(wCodePageID) → BOOL
  kernel32.register('SetConsoleCP', 1, () => 1);

  // SetConsoleOutputCP(wCodePageID) → BOOL
  kernel32.register('SetConsoleOutputCP', 1, () => 1);

  // GetConsoleCP() → UINT
  kernel32.register('GetConsoleCP', 0, () => 437);

  // SetConsoleScreenBufferSize(hConsoleOutput, dwSize) → BOOL
  kernel32.register('SetConsoleScreenBufferSize', 2, () => 1);

  // SetConsoleWindowInfo(hConsoleOutput, bAbsolute, lpConsoleWindow) → BOOL
  kernel32.register('SetConsoleWindowInfo', 3, () => 1);

  // SetConsoleCursorInfo(hConsoleOutput, lpConsoleCursorInfo) → BOOL
  kernel32.register('SetConsoleCursorInfo', 2, () => {
    const _hConsole = emu.readArg(0);
    const lpInfo = emu.readArg(1);
    if (lpInfo) {
      emu.consoleCursorSize = emu.memory.readU32(lpInfo);
      emu.consoleCursorVisible = emu.memory.readU32(lpInfo + 4) !== 0;
    }
    return 1;
  });

  // GetConsoleCursorInfo(hConsoleOutput, lpConsoleCursorInfo) → BOOL
  kernel32.register('GetConsoleCursorInfo', 2, () => {
    const _hConsole = emu.readArg(0);
    const lpInfo = emu.readArg(1);
    if (lpInfo) {
      emu.memory.writeU32(lpInfo, emu.consoleCursorSize ?? 25);
      emu.memory.writeU32(lpInfo + 4, (emu.consoleCursorVisible ?? true) ? 1 : 0);
    }
    return 1;
  });

  // Beep(dwFreq, dwDuration) → BOOL
  kernel32.register('Beep', 2, () => 1);

  // SetFileApisToOEM() → void
  kernel32.register('SetFileApisToOEM', 0, () => 0);

  // Comm port stubs — no serial ports available
  kernel32.register('GetCommModemStatus', 2, () => 0);
  kernel32.register('ClearCommError', 3, () => 0);
  kernel32.register('GetCommState', 2, () => 0);
  kernel32.register('SetCommState', 2, () => 0);
  kernel32.register('GetCommProperties', 2, () => 0);
  kernel32.register('EscapeCommFunction', 2, () => 0);

  kernel32.register('ScrollConsoleScreenBufferW', 5, () => {
    const _hConsole = emu.readArg(0);
    const lpScrollRect = emu.readArg(1);
    const lpClipRect = emu.readArg(2);
    const dwDestOrigin = emu.readArg(3); // packed COORD
    const lpFill = emu.readArg(4);

    const srcLeft = emu.memory.readI16(lpScrollRect);
    const srcTop = emu.memory.readI16(lpScrollRect + 2);
    const srcRight = emu.memory.readI16(lpScrollRect + 4);
    const srcBottom = emu.memory.readI16(lpScrollRect + 6);

    const dstX = dwDestOrigin & 0xFFFF;
    const dstY = (dwDestOrigin >>> 16) & 0xFFFF;

    const fillChar = lpFill ? emu.memory.readU16(lpFill) : 0x20;
    const fillAttr = lpFill ? emu.memory.readU16(lpFill + 2) : emu.consoleAttr;

    // Copy region
    const w = srcRight - srcLeft + 1;
    const h = srcBottom - srcTop + 1;
    const temp: { char: number; attr: number }[] = [];
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const srcIdx = (srcTop + row) * 80 + (srcLeft + col);
        if (srcIdx >= 0 && srcIdx < emu.consoleBuffer.length) {
          temp.push({ ...emu.consoleBuffer[srcIdx] });
        } else {
          temp.push({ char: 0x20, attr: fillAttr });
        }
      }
    }

    // Clear source region
    for (let row = srcTop; row <= srcBottom; row++) {
      for (let col = srcLeft; col <= srcRight; col++) {
        const idx = row * 80 + col;
        if (idx >= 0 && idx < emu.consoleBuffer.length) {
          emu.consoleBuffer[idx] = { char: fillChar, attr: fillAttr };
        }
      }
    }

    // Write to destination
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const dstIdx = (dstY + row) * 80 + (dstX + col);
        if (dstIdx >= 0 && dstIdx < emu.consoleBuffer.length) {
          emu.consoleBuffer[dstIdx] = temp[row * w + col];
        }
      }
    }
    emu.onConsoleOutput?.();
    return 1;
  });
}

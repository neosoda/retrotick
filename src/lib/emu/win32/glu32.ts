import type { Emulator } from '../emulator';

function readDouble(emu: Emulator, argIdx: number): number {
  const lo = emu.readArg(argIdx);
  const hi = emu.readArg(argIdx + 1);
  const buf = new DataView(new ArrayBuffer(8));
  buf.setUint32(0, lo, true);
  buf.setUint32(4, hi, true);
  return buf.getFloat64(0, true);
}

export function registerGlu32(emu: Emulator): void {
  const glu32 = emu.registerDll('GLU32.DLL');

  glu32.register('gluPerspective', 8, () => {
    // gluPerspective(fovy, aspect, zNear, zFar) — 4 doubles = 8 dwords
    const fovy = readDouble(emu, 0);
    const aspect = readDouble(emu, 2);
    const zNear = readDouble(emu, 4);
    const zFar = readDouble(emu, 6);
    emu.glContext?.perspective(fovy, aspect, zNear, zFar);
    return 0;
  });

  glu32.register('gluOrtho2D', 8, () => {
    // gluOrtho2D(left, right, bottom, top) — 4 doubles = 8 dwords
    const left = readDouble(emu, 0);
    const right = readDouble(emu, 2);
    const bottom = readDouble(emu, 4);
    const top = readDouble(emu, 6);
    emu.glContext?.ortho2D(left, right, bottom, top);
    return 0;
  });

  glu32.register('gluLookAt', 18, () => {
    // gluLookAt(eyeX,eyeY,eyeZ, centerX,centerY,centerZ, upX,upY,upZ) — 9 doubles = 18 dwords
    const eyeX = readDouble(emu, 0), eyeY = readDouble(emu, 2), eyeZ = readDouble(emu, 4);
    const centerX = readDouble(emu, 6), centerY = readDouble(emu, 8), centerZ = readDouble(emu, 10);
    const upX = readDouble(emu, 12), upY = readDouble(emu, 14), upZ = readDouble(emu, 16);
    emu.glContext?.lookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ);
    return 0;
  });

  glu32.register('gluScaleImage', 9, () => {
    const format = emu.readArg(0);
    const wIn = emu.readArg(1), hIn = emu.readArg(2);
    const wOut = emu.readArg(5), hOut = emu.readArg(6);
    const dataIn = emu.readArg(4);
    const dataOut = emu.readArg(8);
    // Simple nearest-neighbor scale
    let bpp = 4;
    if (format === 0x1907) bpp = 3; // GL_RGB
    else if (format === 0x1909) bpp = 1; // GL_LUMINANCE
    if (dataIn && dataOut && wIn > 0 && hIn > 0 && wOut > 0 && hOut > 0) {
      for (let y = 0; y < hOut; y++) {
        const sy = Math.floor(y * hIn / hOut);
        for (let x = 0; x < wOut; x++) {
          const sx = Math.floor(x * wIn / wOut);
          for (let c = 0; c < bpp; c++) {
            emu.memory.writeU8(dataOut + (y * wOut + x) * bpp + c,
                               emu.memory.readU8(dataIn + (sy * wIn + sx) * bpp + c));
          }
        }
      }
    }
    return 0;
  });
}

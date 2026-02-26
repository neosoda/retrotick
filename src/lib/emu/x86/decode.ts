import type { CPU } from './cpu';

// Register indices
const EBX = 3, ESP = 4, EBP = 5, ESI = 6, EDI = 7;

export function decodeModRM(cpu: CPU, sizeBits: number): { isReg: boolean; regField: number; val: number; addr: number; ea?: number } {
  // Dispatch to 16-bit addressing mode if active
  if (cpu._addrSize16) return decodeModRM16(cpu, sizeBits);

  const modrm = cpu.fetch8();
  const mod = (modrm >> 6) & 3;
  const regField = (modrm >> 3) & 7;
  const rm = modrm & 7;

  if (mod === 3) {
    // Register direct
    let val: number;
    if (sizeBits === 8) val = cpu.getReg8(rm);
    else if (sizeBits === 16) val = cpu.getReg16(rm);
    else val = cpu.reg[rm] | 0;
    return { isReg: true, regField, val, addr: rm };
  }

  // Memory addressing
  let addr: number;
  if (rm === 4) {
    // SIB byte
    addr = decodeSIB(cpu, mod);
  } else if (rm === 5 && mod === 0) {
    // disp32
    addr = cpu.fetch32();
  } else {
    addr = cpu.reg[rm] | 0;
  }

  if (mod === 1) {
    addr = (addr + cpu.fetchI8()) | 0;
  } else if (mod === 2) {
    addr = (addr + cpu.fetchI32()) | 0;
  }

  // Apply FS segment base if override is active
  if (cpu._segOverride === 0x64) {
    addr = (addr + cpu.fsBase) | 0;
  }

  const ea = addr >>> 0;
  let val: number;
  if (sizeBits === 8) val = cpu.mem.readU8(ea);
  else if (sizeBits === 16) val = cpu.mem.readU16(ea);
  else val = cpu.mem.readU32(ea);

  return { isReg: false, regField, val, addr: ea };
}

export function decodeSIB(cpu: CPU, mod: number): number {
  const sib = cpu.fetch8();
  const scale = (sib >> 6) & 3;
  const index = (sib >> 3) & 7;
  const base = sib & 7;

  let addr: number;
  if (base === 5 && mod === 0) {
    addr = cpu.fetchI32();
  } else {
    addr = cpu.reg[base] | 0;
  }

  if (index !== 4) {
    addr = (addr + ((cpu.reg[index] | 0) << scale)) | 0;
  }

  return addr;
}

export function getSegOverrideSel(cpu: CPU): number {
  switch (cpu._segOverride) {
    case 0x26: return cpu.es;
    case 0x2E: return cpu.cs;
    case 0x36: return cpu.ss;
    case 0x3E: return cpu.ds;
    case 0x64: return 0; // FS — handled via fsBase
    default: return cpu.ds;
  }
}

export function decodeModRM16(cpu: CPU, sizeBits: number): { isReg: boolean; regField: number; val: number; addr: number; ea?: number } {
  const modrm = cpu.fetch8();
  const mod = (modrm >> 6) & 3;
  const regField = (modrm >> 3) & 7;
  const rm = modrm & 7;

  if (mod === 3) {
    let val: number;
    if (sizeBits === 8) val = cpu.getReg8(rm);
    else if (sizeBits === 16) val = cpu.getReg16(rm);
    else val = cpu.reg[rm] | 0;
    return { isReg: true, regField, val, addr: rm };
  }

  let ea = 0;
  let useSSeg = false; // BP-based addressing defaults to SS

  if (mod === 0 && rm === 6) {
    ea = cpu.fetch16(); // direct disp16
  } else {
    switch (rm) {
      case 0: ea = (cpu.getReg16(EBX) + cpu.getReg16(ESI)) & 0xFFFF; break;
      case 1: ea = (cpu.getReg16(EBX) + cpu.getReg16(EDI)) & 0xFFFF; break;
      case 2: ea = (cpu.getReg16(EBP) + cpu.getReg16(ESI)) & 0xFFFF; useSSeg = true; break;
      case 3: ea = (cpu.getReg16(EBP) + cpu.getReg16(EDI)) & 0xFFFF; useSSeg = true; break;
      case 4: ea = cpu.getReg16(ESI); break;
      case 5: ea = cpu.getReg16(EDI); break;
      case 6: ea = cpu.getReg16(EBP); useSSeg = true; break;
      case 7: ea = cpu.getReg16(EBX); break;
    }
    if (mod === 1) {
      ea = (ea + cpu.fetchI8()) & 0xFFFF;
    } else if (mod === 2) {
      ea = (ea + cpu.fetch16()) & 0xFFFF;
    }
  }

  // Apply segment base
  let base: number;
  if (cpu._segOverride === 0x64) {
    base = cpu.fsBase; // FS override
  } else if (cpu._segOverride) {
    const segSel = getSegOverrideSel(cpu);
    base = cpu.segBase(segSel);
  } else {
    const segSel = useSSeg ? cpu.ss : cpu.ds;
    base = cpu.segBase(segSel);
  }
  const linearAddr = (base + ea) >>> 0;

  let val: number;
  if (sizeBits === 8) val = cpu.mem.readU8(linearAddr);
  else if (sizeBits === 16) val = cpu.mem.readU16(linearAddr);
  else val = cpu.mem.readU32(linearAddr);

  return { isReg: false, regField, val, addr: linearAddr, ea };
}

export function writeModRM(cpu: CPU, decoded: { isReg: boolean; addr: number }, val: number, sizeBits: number): void {
  if (decoded.isReg) {
    if (sizeBits === 8) cpu.setReg8(decoded.addr, val);
    else if (sizeBits === 16) cpu.setReg16(decoded.addr, val);
    else cpu.reg[decoded.addr] = val | 0;
  } else {
    if (sizeBits === 8) cpu.mem.writeU8(decoded.addr, val);
    else if (sizeBits === 16) cpu.mem.writeU16(decoded.addr, val);
    else cpu.mem.writeU32(decoded.addr, val >>> 0);
  }
}

export function decodeFPUModRM(cpu: CPU): { mod: number; regField: number; rm: number; addr: number } {
  // In 16-bit address mode, use decodeModRM16 and extract fields
  if (cpu._addrSize16) {
    const d = decodeModRM16(cpu, 32); // sizeBits doesn't matter for FPU, addr matters
    return { mod: d.isReg ? 3 : 0, regField: d.regField, rm: d.isReg ? d.addr : 0, addr: d.addr };
  }

  const modrm = cpu.fetch8();
  const mod = (modrm >> 6) & 3;
  const regField = (modrm >> 3) & 7;
  const rm = modrm & 7;

  if (mod === 3) {
    return { mod, regField, rm, addr: 0 };
  }

  let addr: number;
  if (rm === 4) {
    addr = decodeSIB(cpu, mod);
  } else if (rm === 5 && mod === 0) {
    addr = cpu.fetch32();
  } else {
    addr = cpu.reg[rm] | 0;
  }

  if (mod === 1) addr = (addr + cpu.fetchI8()) | 0;
  else if (mod === 2) addr = (addr + cpu.fetchI32()) | 0;

  // Apply FS segment base if override is active
  if (cpu._segOverride === 0x64) {
    addr = (addr + cpu.fsBase) | 0;
  }

  return { mod, regField, rm, addr: addr >>> 0 };
}

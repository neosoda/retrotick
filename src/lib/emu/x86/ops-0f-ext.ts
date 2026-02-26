import type { CPU } from './cpu';
import { doShld, doShrd } from './shift';
import { LazyOp } from './lazy-op';

// Flag bits
const CF = 0x001;
const ZF = 0x040;

// Register indices
const EAX = 0, ECX = 1, EDX = 2, EBX = 3, ESP = 4, EBP = 5, ESI = 6, EDI = 7;

export function exec0FExt(
  cpu: CPU,
  op2: number,
  opSize: number,
): boolean {
  switch (op2) {
    // BT r/m32, reg32
    case 0xA3: {
      const d = cpu.decodeModRM(opSize);
      const bit = (opSize === 16 ? cpu.getReg16(d.regField) : cpu.reg[d.regField]) & (opSize - 1);
      const cf = (d.val >> bit) & 1;
      const f = cpu.getFlags() & ~CF;
      cpu.setFlags(f | (cf ? CF : 0));
      return true;
    }

    // BTS r/m32, reg32
    case 0xAB: {
      const d = cpu.decodeModRM(opSize);
      const bit = (opSize === 16 ? cpu.getReg16(d.regField) : cpu.reg[d.regField]) & (opSize - 1);
      const cf = (d.val >> bit) & 1;
      cpu.writeModRM(d, d.val | (1 << bit), opSize);
      const f = cpu.getFlags() & ~CF;
      cpu.setFlags(f | (cf ? CF : 0));
      return true;
    }

    // BTR r/m32, reg32
    case 0xB3: {
      const d = cpu.decodeModRM(opSize);
      const bit = (opSize === 16 ? cpu.getReg16(d.regField) : cpu.reg[d.regField]) & (opSize - 1);
      const cf = (d.val >> bit) & 1;
      cpu.writeModRM(d, d.val & ~(1 << bit), opSize);
      const f = cpu.getFlags() & ~CF;
      cpu.setFlags(f | (cf ? CF : 0));
      return true;
    }

    // BT/BTS/BTR/BTC r/m, imm8 (0F BA)
    case 0xBA: {
      const d = cpu.decodeModRM(opSize);
      const bit = cpu.fetch8() & (opSize - 1);
      const cf = (d.val >> bit) & 1;
      const f = cpu.getFlags() & ~CF;
      cpu.setFlags(f | (cf ? CF : 0));
      if (d.regField === 5) cpu.writeModRM(d, d.val | (1 << bit), opSize);
      else if (d.regField === 6) cpu.writeModRM(d, d.val & ~(1 << bit), opSize);
      else if (d.regField === 7) cpu.writeModRM(d, d.val ^ (1 << bit), opSize);
      return true;
    }

    // BSF r32, r/m32
    case 0xBC: {
      const d = cpu.decodeModRM(opSize);
      if (d.val === 0) {
        cpu.setFlags(cpu.getFlags() | ZF);
      } else {
        cpu.setFlags(cpu.getFlags() & ~ZF);
        let bit = 0;
        let v = d.val >>> 0;
        while ((v & 1) === 0) { v >>>= 1; bit++; }
        if (opSize === 16) cpu.setReg16(d.regField, bit);
        else cpu.reg[d.regField] = bit;
      }
      return true;
    }

    // BSR r32, r/m32
    case 0xBD: {
      const d = cpu.decodeModRM(opSize);
      if (d.val === 0) {
        cpu.setFlags(cpu.getFlags() | ZF);
      } else {
        cpu.setFlags(cpu.getFlags() & ~ZF);
        let bit = opSize - 1;
        const v = d.val >>> 0;
        while (bit > 0 && !((v >>> bit) & 1)) bit--;
        if (opSize === 16) cpu.setReg16(d.regField, bit);
        else cpu.reg[d.regField] = bit;
      }
      return true;
    }

    // SHLD r/m32, r32, imm8
    case 0xA4: {
      const d = cpu.decodeModRM(opSize);
      const count = cpu.fetch8() & 0x1F;
      if (count) {
        const regVal = opSize === 16 ? cpu.getReg16(d.regField) : cpu.reg[d.regField];
        const result = doShld(d.val, regVal, count, opSize);
        cpu.writeModRM(d, result, opSize);
      }
      return true;
    }

    // SHLD r/m32, r32, CL
    case 0xA5: {
      const d = cpu.decodeModRM(opSize);
      const count = cpu.getReg8(ECX) & 0x1F;
      if (count) {
        const regVal = opSize === 16 ? cpu.getReg16(d.regField) : cpu.reg[d.regField];
        const result = doShld(d.val, regVal, count, opSize);
        cpu.writeModRM(d, result, opSize);
      }
      return true;
    }

    // SHRD r/m32, r32, imm8
    case 0xAC: {
      const d = cpu.decodeModRM(opSize);
      const count = cpu.fetch8() & 0x1F;
      if (count) {
        const regVal = opSize === 16 ? cpu.getReg16(d.regField) : cpu.reg[d.regField];
        const result = doShrd(d.val, regVal, count, opSize);
        cpu.writeModRM(d, result, opSize);
      }
      return true;
    }

    // SHRD r/m32, r32, CL
    case 0xAD: {
      const d = cpu.decodeModRM(opSize);
      const count = cpu.getReg8(ECX) & 0x1F;
      if (count) {
        const regVal = opSize === 16 ? cpu.getReg16(d.regField) : cpu.reg[d.regField];
        const result = doShrd(d.val, regVal, count, opSize);
        cpu.writeModRM(d, result, opSize);
      }
      return true;
    }

    // CPUID
    case 0xA2:
      cpu.reg[EAX] = 0;
      cpu.reg[EBX] = 0;
      cpu.reg[ECX] = 0;
      cpu.reg[EDX] = 0;
      return true;

    // XADD r/m32, r32
    case 0xC1: {
      const d = cpu.decodeModRM(opSize);
      if (opSize === 16) {
        const sum = (d.val + cpu.getReg16(d.regField)) & 0xFFFF;
        cpu.setReg16(d.regField, d.val);
        cpu.writeModRM(d, sum, 16);
        cpu.setLazy(LazyOp.ADD16, sum, d.val, cpu.getReg16(d.regField));
      } else {
        const sum = (d.val + cpu.reg[d.regField]) | 0;
        cpu.reg[d.regField] = d.val | 0;
        cpu.writeModRM(d, sum, 32);
        cpu.setLazy(LazyOp.ADD32, sum, d.val, cpu.reg[d.regField]);
      }
      return true;
    }

    // XADD r/m8, r8
    case 0xC0: {
      const d = cpu.decodeModRM(8);
      const sum = (d.val + cpu.getReg8(d.regField)) & 0xFF;
      cpu.setReg8(d.regField, d.val);
      cpu.writeModRM(d, sum, 8);
      cpu.setLazy(LazyOp.ADD8, sum, d.val, cpu.getReg8(d.regField));
      return true;
    }

    // CMPXCHG r/m32, r32 (0F B1)
    case 0xB1: {
      const d = cpu.decodeModRM(opSize);
      if (opSize === 16) {
        if (cpu.getReg16(EAX) === (d.val & 0xFFFF)) {
          cpu.setFlags(cpu.getFlags() | ZF);
          cpu.writeModRM(d, cpu.getReg16(d.regField), 16);
        } else {
          cpu.setFlags(cpu.getFlags() & ~ZF);
          cpu.setReg16(EAX, d.val & 0xFFFF);
        }
      } else {
        if ((cpu.reg[EAX] | 0) === (d.val | 0)) {
          cpu.setFlags(cpu.getFlags() | ZF);
          cpu.writeModRM(d, cpu.reg[d.regField], 32);
        } else {
          cpu.setFlags(cpu.getFlags() & ~ZF);
          cpu.reg[EAX] = d.val | 0;
        }
      }
      return true;
    }

    // CMPXCHG r/m8, r8 (0F B0)
    case 0xB0: {
      const d = cpu.decodeModRM(8);
      if (cpu.getReg8(EAX) === (d.val & 0xFF)) {
        cpu.setFlags(cpu.getFlags() | ZF);
        cpu.writeModRM(d, cpu.getReg8(d.regField), 8);
      } else {
        cpu.setFlags(cpu.getFlags() & ~ZF);
        cpu.setReg8(EAX, d.val);
      }
      return true;
    }

    // BSWAP r32 (0F C8+rd)
    case 0xC8: case 0xC9: case 0xCA: case 0xCB:
    case 0xCC: case 0xCD: case 0xCE: case 0xCF: {
      const r = op2 - 0xC8;
      const v = cpu.reg[r] >>> 0;
      cpu.reg[r] = (((v & 0xFF) << 24) | ((v & 0xFF00) << 8) |
        ((v >> 8) & 0xFF00) | ((v >> 24) & 0xFF)) | 0;
      return true;
    }

    // 0F 3F xx xx — undocumented (used by CPU-Z for CPU detection); treat as 4-byte NOP
    case 0x3F: {
      cpu.eip = (cpu.eip + 2) >>> 0; // skip 2 extra bytes
      return true;
    }

    // 0F 31 — RDTSC
    case 0x31: {
      const t = Date.now();
      cpu.reg[EAX] = t & 0xFFFFFFFF;
      cpu.reg[EDX] = 0;
      return true;
    }

    default:
      return false;
  }
}

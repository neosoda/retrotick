// Lazy flag operation types — shared across CPU modules
export const enum LazyOp {
  NONE,
  ADD8, ADD16, ADD32,
  SUB8, SUB16, SUB32,
  AND8, AND16, AND32,
  OR8, OR16, OR32,
  XOR8, XOR16, XOR32,
  INC8, INC16, INC32,
  DEC8, DEC16, DEC32,
  SHL8, SHL16, SHL32,
  SHR8, SHR16, SHR32,
  SAR8, SAR16, SAR32,
  NEG8, NEG16, NEG32,
}

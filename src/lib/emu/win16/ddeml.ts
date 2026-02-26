import type { Emulator } from '../emulator';

// Win16 DDEML module — all stubs (network play not supported)

export function registerWin16Ddeml(emu: Emulator): void {
  const ddeml = emu.registerModule16('DDEML');

  // All DDEML functions return 0 (failure/no-op)
  ddeml.register('ord_2', 16, () => 0);   // DdeInitialize
  ddeml.register('ord_3', 4, () => 0);   // DdeUninitialize
  ddeml.register('ord_5', 12, () => 0);   // DdeConnect
  ddeml.register('ord_6', 2, () => 0);   // DdeDisconnect
  ddeml.register('ord_11', 24, () => 0);  // DdeClientTransaction
  ddeml.register('ord_14', 10, () => 0);  // DdeCreateStringHandle
  ddeml.register('ord_15', 6, () => 0);  // DdeFreeStringHandle
  ddeml.register('ord_16', 6, () => 0);  // DdeKeepStringHandle
  ddeml.register('ord_18', 4, () => 0);  // DdeGetLastError
  ddeml.register('ord_19', 8, () => 0);  // DdePostAdvise
  ddeml.register('ord_20', 10, () => 0);  // DdeNameService
  ddeml.register('ord_26', 20, () => 0);  // DdeCreateDataHandle
  ddeml.register('ord_7', 16, () => 0);   // DdeReconnect
  ddeml.register('ord_8', 4, () => 0);   // DdeDisconnectList
  ddeml.register('ord_13', 12, () => 0);  // DdePostAdvise (different ordinal)
  ddeml.register('ord_21', 10, () => 0);  // DdeCreateStringHandle (alt)
  ddeml.register('ord_22', 8, () => 0);  // DdeFreeStringHandle (alt)
  ddeml.register('ord_27', 14, () => 0);  // DdeNameService (alt)
}

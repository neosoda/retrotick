import type { Emulator } from '../emulator';

// IP_ADAPTER_INFO layout (640 bytes total):
//   +0   Next                  DWORD  (pointer to next adapter)
//   +4   ComboIndex            DWORD
//   +8   AdapterName           char[260]  (MAX_ADAPTER_NAME_LENGTH+4)
//   +268 Description           char[132]  (MAX_ADAPTER_DESCRIPTION_LENGTH+4)
//   +400 AddressLength         UINT
//   +404 Address               BYTE[8]    (MAX_ADAPTER_ADDRESS_LENGTH)
//   +412 Index                 DWORD
//   +416 Type                  UINT
//   +420 DhcpEnabled           UINT
//   +424 CurrentIpAddress      DWORD  (pointer, NULL)
//   +428 IpAddressList         IP_ADDR_STRING (40 bytes)
//   +468 GatewayList           IP_ADDR_STRING (40 bytes)
//   +508 PrimaryWinsServer     IP_ADDR_STRING (40 bytes)
//   +548 SecondaryWinsServer   IP_ADDR_STRING (40 bytes)
//   +588 LeaseObtained         DWORD
//   +592 LeaseExpires          DWORD
//   = 596 bytes total, padded to 640 for alignment
const IP_ADAPTER_INFO_SIZE = 640;

// IP_ADDR_STRING layout (40 bytes):
//   +0  Next        DWORD  (pointer)
//   +4  IpAddress   char[16]
//   +20 IpMask      char[16]
//   +36 Context     DWORD
const IP_ADDR_STRING_SIZE = 40;

// MIB_IF_TYPE_ETHERNET = 6
const MIB_IF_TYPE_ETHERNET = 6;

// Return codes
const ERROR_SUCCESS        = 0;
const ERROR_BUFFER_OVERFLOW = 111;
const ERROR_NO_DATA        = 232;

function writeIpAddrString(mem: Emulator['memory'], ptr: number, ip: string, mask: string, next: number): void {
  mem.writeU32(ptr + 0, next);
  for (let i = 0; i < 16; i++) mem.writeU8(ptr + 4 + i, 0);
  for (let i = 0; i < ip.length; i++) mem.writeU8(ptr + 4 + i, ip.charCodeAt(i));
  for (let i = 0; i < 16; i++) mem.writeU8(ptr + 20 + i, 0);
  for (let i = 0; i < mask.length; i++) mem.writeU8(ptr + 20 + i, mask.charCodeAt(i));
  mem.writeU32(ptr + 36, 0);
}

export function registerIphlpapi(emu: Emulator): void {
  const iphlpapi = emu.registerDll('IPHLPAPI.DLL');

  // GetAdaptersInfo(pAdapterInfo: DWORD, pOutBufLen: DWORD) → DWORD
  // pAdapterInfo: pointer to buffer to receive IP_ADAPTER_INFO linked list
  // pOutBufLen:   pointer to DWORD holding buffer size (in/out)
  iphlpapi.register('GetAdaptersInfo', 2, () => {
    const pAdapterInfo = emu.readArg(0);
    const pOutBufLen   = emu.readArg(1);

    if (!pOutBufLen) return ERROR_NO_DATA;

    const required = IP_ADAPTER_INFO_SIZE;
    const provided = pAdapterInfo ? emu.memory.readU32(pOutBufLen) : 0;

    emu.memory.writeU32(pOutBufLen, required);

    if (!pAdapterInfo || provided < required) return ERROR_BUFFER_OVERFLOW;

    const base = pAdapterInfo;

    // Zero the whole structure first
    for (let i = 0; i < IP_ADAPTER_INFO_SIZE; i++) emu.memory.writeU8(base + i, 0);

    // Next = NULL (single adapter)
    emu.memory.writeU32(base + 0, 0);

    // ComboIndex = 0
    emu.memory.writeU32(base + 4, 0);

    // AdapterName (GUID-style string)
    const adapterName = '{12345678-1234-1234-1234-123456789ABC}';
    emu.memory.writeCString(base + 8, adapterName);

    // Description
    const description = 'Realtek RTL8139 Family PCI Fast Ethernet NIC';
    emu.memory.writeCString(base + 268, description);

    // AddressLength = 6 (Ethernet MAC is 6 bytes)
    emu.memory.writeU32(base + 400, 6);

    // Address: fake MAC 00:50:56:C0:00:01
    const mac = [0x00, 0x50, 0x56, 0xC0, 0x00, 0x01];
    for (let i = 0; i < 6; i++) emu.memory.writeU8(base + 404 + i, mac[i]);

    // Index = 1
    emu.memory.writeU32(base + 412, 1);

    // Type = MIB_IF_TYPE_ETHERNET
    emu.memory.writeU32(base + 416, MIB_IF_TYPE_ETHERNET);

    // DhcpEnabled = 1
    emu.memory.writeU32(base + 420, 1);

    // CurrentIpAddress = NULL
    emu.memory.writeU32(base + 424, 0);

    // IpAddressList: 192.168.1.100 / 255.255.255.0
    writeIpAddrString(emu.memory, base + 428, '192.168.1.100', '255.255.255.0', 0);

    // GatewayList: 192.168.1.1
    writeIpAddrString(emu.memory, base + 468, '192.168.1.1', '255.255.255.0', 0);

    // PrimaryWinsServer / SecondaryWinsServer: empty
    writeIpAddrString(emu.memory, base + 508, '', '', 0);
    writeIpAddrString(emu.memory, base + 548, '', '', 0);

    // LeaseObtained / LeaseExpires: 0
    emu.memory.writeU32(base + 588, 0);
    emu.memory.writeU32(base + 592, 0);

    return ERROR_SUCCESS;
  });

  iphlpapi.register('GetAdaptersAddresses', 5, () => ERROR_NO_DATA);
  iphlpapi.register('GetNetworkParams', 2, () => ERROR_NO_DATA);
  iphlpapi.register('GetIpAddrTable', 3, () => ERROR_NO_DATA);
  iphlpapi.register('GetIfTable', 3, () => ERROR_NO_DATA);
  iphlpapi.register('GetBestInterface', 2, () => ERROR_NO_DATA);
  iphlpapi.register('GetIpForwardTable', 3, () => ERROR_NO_DATA);
}

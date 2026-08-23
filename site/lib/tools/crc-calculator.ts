/**
 * 参数化 CRC 的纯计算核心。
 *
 * 本模块采用 Ross Williams 参数模型的常用字段。`poly` 始终接收省略
 * 最高次隐含 1 的普通方向表示，例如 CRC-32/ISO-HDLC 使用 0x04C11DB7。
 * 当 RefIn 为 true 时，内部才把它反射成右移算法所需的表示。这样界面、
 * 规格和常见参数目录能够使用同一套写法，避免用户手工反转多项式。
 */

export type CrcWidth = 8 | 16 | 32;

export interface CrcModel {
  name: string;
  width: CrcWidth;
  poly: bigint;
  init: bigint;
  refIn: boolean;
  refOut: boolean;
  xorOut: bigint;
  check?: bigint;
}
export type CrcError =
  | { code: 'EMPTY_DATA' }
  | { code: 'DATA_TOO_LARGE'; maxBytes: number }
  | { code: 'INVALID_BYTE'; index: number; value: number }
  | { code: 'PARAMETER_OUT_OF_RANGE'; parameter: 'poly' | 'init' | 'xorOut'; width: CrcWidth }
  | { code: 'ZERO_POLYNOMIAL' };

export type CrcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: CrcError };

export interface CrcCalculation {
  value: bigint;
  hexadecimal: string;
  byteCount: number;
  model: CrcModel;
}

export const MAX_CRC_BYTES = 4096;

export const CRC_PRESETS: readonly CrcModel[] = [
  {
    name: 'CRC-8/SMBUS',
    width: 8,
    poly: 0x07n,
    init: 0x00n,
    refIn: false,
    refOut: false,
    xorOut: 0x00n,
    check: 0xf4n,
  },
  {
    name: 'CRC-16/ARC',
    width: 16,
    poly: 0x8005n,
    init: 0x0000n,
    refIn: true,
    refOut: true,
    xorOut: 0x0000n,
    check: 0xbb3dn,
  },
  {
    name: 'CRC-16/MODBUS',
    width: 16,
    poly: 0x8005n,
    init: 0xffffn,
    refIn: true,
    refOut: true,
    xorOut: 0x0000n,
    check: 0x4b37n,
  },
  {
    name: 'CRC-32/ISO-HDLC',
    width: 32,
    poly: 0x04c11db7n,
    init: 0xffffffffn,
    refIn: true,
    refOut: true,
    xorOut: 0xffffffffn,
    check: 0xcbf43926n,
  },
] as const;

function maskFor(width: CrcWidth): bigint {
  return (1n << BigInt(width)) - 1n;
}

/** 把 `width` bit 内的位顺序完全反转。 */
export function reflectBits(value: bigint, width: CrcWidth): bigint {
  let source = value;
  let reflected = 0n;

  for (let bit = 0; bit < width; bit += 1) {
    reflected = (reflected << 1n) | (source & 1n);
    source >>= 1n;
  }

  return reflected;
}

/**
 * 按完整模型参数计算 CRC。
 *
 * 反射输入使用右移寄存器和反射后的多项式；非反射输入使用左移寄存器。
 * 最终仅当 RefOut 与 RefIn 不同才反射，因为右移分支已经让寄存器保持在
 * 反射方向。这个关系是很多“结果几乎正确”缺陷的来源，因此有独立测试。
 */
export function calculateCrc(
  bytes: readonly number[],
  model: CrcModel,
): CrcResult<CrcCalculation> {
  if (bytes.length === 0) {
    return { ok: false, error: { code: 'EMPTY_DATA' } };
  }
  if (bytes.length > MAX_CRC_BYTES) {
    return { ok: false, error: { code: 'DATA_TOO_LARGE', maxBytes: MAX_CRC_BYTES } };
  }

  const mask = maskFor(model.width);
  for (const parameter of ['poly', 'init', 'xorOut'] as const) {
    const value = model[parameter];
    if (value < 0n || value > mask) {
      return {
        ok: false,
        error: { code: 'PARAMETER_OUT_OF_RANGE', parameter, width: model.width },
      };
    }
  }
  if (model.poly === 0n) {
    return { ok: false, error: { code: 'ZERO_POLYNOMIAL' } };
  }

  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index];
    if (!Number.isInteger(byte) || byte < 0 || byte > 0xff) {
      return { ok: false, error: { code: 'INVALID_BYTE', index, value: byte } };
    }
  }

  let register = model.init & mask;

  if (model.refIn) {
    const reflectedPoly = reflectBits(model.poly, model.width);
    for (const byte of bytes) {
      register ^= BigInt(byte);
      for (let bit = 0; bit < 8; bit += 1) {
        register = (register & 1n) !== 0n
          ? (register >> 1n) ^ reflectedPoly
          : register >> 1n;
      }
    }
  } else {
    const topBit = 1n << BigInt(model.width - 1);
    for (const byte of bytes) {
      register ^= BigInt(byte) << BigInt(model.width - 8);
      for (let bit = 0; bit < 8; bit += 1) {
        register = (register & topBit) !== 0n
          ? ((register << 1n) ^ model.poly) & mask
          : (register << 1n) & mask;
      }
    }
  }

  if (model.refOut !== model.refIn) {
    register = reflectBits(register, model.width);
  }

  const value = (register ^ model.xorOut) & mask;
  return {
    ok: true,
    value: {
      value,
      hexadecimal: formatCrcHex(value, model.width),
      byteCount: bytes.length,
      model,
    },
  };
}

/** 按 CRC 宽度补齐前导零，便于与协议和检查向量逐位比较。 */
export function formatCrcHex(value: bigint, width: CrcWidth): string {
  return `0x${value.toString(16).toUpperCase().padStart(width / 4, '0')}`;
}

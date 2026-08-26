/** 大小端与字节交换转换器的纯计算核心。 */

export type IntegerRadix = 'decimal' | 'hexadecimal';
export type IntegerByteWidth = 1 | 2 | 4 | 8;

export type EndiannessError =
  | { code: 'EMPTY_INPUT' }
  | { code: 'INVALID_HEX_CHARACTER'; character: string; position: number }
  | { code: 'EMPTY_PREFIX'; position: number }
  | { code: 'ODD_HEX_DIGITS'; digitCount: number }
  | { code: 'TOO_MANY_BYTES'; maxBytes: number }
  | { code: 'INVALID_INTEGER_CHARACTER'; character: string; position: number; radix: IntegerRadix }
  | { code: 'NEGATIVE_INTEGER' }
  | { code: 'VALUE_OUT_OF_RANGE'; byteWidth: IntegerByteWidth };

export type EndiannessResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: EndiannessError };

export interface ByteSequenceAnalysis {
  bytes: number[];
  byteCount: number;
  normalizedBytes: string;
  reversedBytes: string;
  bigEndianHex: string;
  bigEndianDecimal: string;
  littleEndianHex: string;
  littleEndianDecimal: string;
}

export interface EncodedInteger {
  valueHex: string;
  valueDecimal: string;
  byteWidth: IntegerByteWidth;
  bigEndianBytes: string;
  littleEndianBytes: string;
}

export const MAX_ENDIANNESS_BYTES = 8;

const HEX_DIGIT = /^[0-9a-fA-F]$/;
const DECIMAL_DIGIT = /^[0-9]$/;
const SEPARATOR = /^[\s,;:_-]$/;

/**
 * 把 HEX 文本严格解析为 1～8 个 byte，并同时给出两种字节序解释。
 *
 * 这里不先把完整输入转成 JavaScript Number，因为 Number 只能精确表示到
 * 53 bit。逐 byte 使用 BigInt 累积后，8 byte 的 `0xFFFFFFFFFFFFFFFF`
 * 仍可得到准确结果。
 */
export function analyzeEndianBytes(input: string): EndiannessResult<ByteSequenceAnalysis> {
  const parsed = parseByteSequence(input);
  if (!parsed.ok) {
    return parsed;
  }

  const bytes = parsed.value;
  const reversed = [...bytes].reverse();
  const bigEndianValue = bytesToUnsigned(bytes);
  const littleEndianValue = bytesToUnsigned(reversed);
  const hexWidth = bytes.length * 2;

  return {
    ok: true,
    value: {
      bytes,
      byteCount: bytes.length,
      normalizedBytes: formatBytes(bytes),
      reversedBytes: formatBytes(reversed),
      bigEndianHex: formatHex(bigEndianValue, hexWidth),
      bigEndianDecimal: bigEndianValue.toString(10),
      littleEndianHex: formatHex(littleEndianValue, hexWidth),
      littleEndianDecimal: littleEndianValue.toString(10),
    },
  };
}

/**
 * 将非负整数编码为固定宽度的大端与小端 byte 序列。
 *
 * 小端数组按最低有效 byte 到最高有效 byte生成；大端只是同一组 byte 的
 * 反向排列。函数拒绝溢出，不会像某些 C 窄化转换一样静默丢弃高位。
 */
export function encodeUnsignedInteger(
  input: string,
  radix: IntegerRadix,
  byteWidth: IntegerByteWidth,
): EndiannessResult<EncodedInteger> {
  const parsed = parseUnsignedInteger(input, radix);
  if (!parsed.ok) {
    return parsed;
  }

  const value = parsed.value;
  const maxValue = (1n << BigInt(byteWidth * 8)) - 1n;
  if (value > maxValue) {
    return { ok: false, error: { code: 'VALUE_OUT_OF_RANGE', byteWidth } };
  }

  const littleEndian: number[] = [];
  let remaining = value;
  for (let index = 0; index < byteWidth; index += 1) {
    littleEndian.push(Number(remaining & 0xffn));
    remaining >>= 8n;
  }

  const bigEndian = [...littleEndian].reverse();
  return {
    ok: true,
    value: {
      valueHex: formatHex(value, byteWidth * 2),
      valueDecimal: value.toString(10),
      byteWidth,
      bigEndianBytes: formatBytes(bigEndian),
      littleEndianBytes: formatBytes(littleEndian),
    },
  };
}

function parseByteSequence(input: string): EndiannessResult<number[]> {
  const digits: string[] = [];

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (SEPARATOR.test(character)) {
      continue;
    }

    if (character === '0' && (input[index + 1] === 'x' || input[index + 1] === 'X')) {
      const prefixPosition = index + 2;
      index += 1;
      let lookahead = index + 1;
      while (lookahead < input.length && SEPARATOR.test(input[lookahead])) {
        lookahead += 1;
      }
      if (lookahead >= input.length || !HEX_DIGIT.test(input[lookahead])) {
        return { ok: false, error: { code: 'EMPTY_PREFIX', position: prefixPosition } };
      }
      continue;
    }

    if (!HEX_DIGIT.test(character)) {
      return {
        ok: false,
        error: { code: 'INVALID_HEX_CHARACTER', character, position: index + 1 },
      };
    }
    digits.push(character);
  }

  if (digits.length === 0) {
    return { ok: false, error: { code: 'EMPTY_INPUT' } };
  }
  if (digits.length % 2 !== 0) {
    return { ok: false, error: { code: 'ODD_HEX_DIGITS', digitCount: digits.length } };
  }
  if (digits.length / 2 > MAX_ENDIANNESS_BYTES) {
    return { ok: false, error: { code: 'TOO_MANY_BYTES', maxBytes: MAX_ENDIANNESS_BYTES } };
  }

  const bytes: number[] = [];
  for (let index = 0; index < digits.length; index += 2) {
    bytes.push(Number.parseInt(`${digits[index]}${digits[index + 1]}`, 16));
  }
  return { ok: true, value: bytes };
}

function parseUnsignedInteger(
  input: string,
  radix: IntegerRadix,
): EndiannessResult<bigint> {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: { code: 'EMPTY_INPUT' } };
  }
  if (trimmed.startsWith('-')) {
    return { ok: false, error: { code: 'NEGATIVE_INTEGER' } };
  }

  let digits = trimmed;
  if (radix === 'hexadecimal' && /^0x/i.test(digits)) {
    digits = digits.slice(2);
  }
  digits = digits.replaceAll('_', '');
  if (digits.length === 0) {
    return { ok: false, error: { code: 'EMPTY_INPUT' } };
  }

  const validDigit = radix === 'hexadecimal' ? HEX_DIGIT : DECIMAL_DIGIT;
  for (let index = 0; index < digits.length; index += 1) {
    if (!validDigit.test(digits[index])) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INTEGER_CHARACTER',
          character: digits[index],
          position: index + 1,
          radix,
        },
      };
    }
  }

  return { ok: true, value: BigInt(`${radix === 'hexadecimal' ? '0x' : ''}${digits}`) };
}

function bytesToUnsigned(bytes: readonly number[]): bigint {
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  return value;
}

function formatBytes(bytes: readonly number[]): string {
  return bytes.map((byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

function formatHex(value: bigint, digitWidth: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(digitWidth, '0')}`;
}

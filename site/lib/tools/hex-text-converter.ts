/** HEX、ASCII 与字符串转换器的纯计算核心。 */

export type TextEncoding = 'utf-8' | 'ascii';

export type HexTextError =
  | { code: 'EMPTY_INPUT' }
  | { code: 'INVALID_HEX_CHARACTER'; character: string; position: number }
  | { code: 'EMPTY_PREFIX'; position: number }
  | { code: 'ODD_HEX_DIGITS'; digitCount: number }
  | { code: 'INPUT_TOO_LARGE'; maxBytes: number }
  | { code: 'NON_ASCII_CHARACTER'; character: string; position: number }
  | { code: 'NON_ASCII_BYTE'; byte: number; index: number }
  | { code: 'INVALID_UTF8' }
  | { code: 'UNPAIRED_SURROGATE'; position: number };

export type HexTextResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: HexTextError };

export interface ByteAnalysis {
  bytes: number[];
  hexadecimal: string;
  decimal: string;
  asciiPreview: string;
  byteCount: number;
}
export interface EncodedText extends ByteAnalysis {
  text: string;
  encoding: TextEncoding;
}

export interface DecodedBytes extends ByteAnalysis {
  text: string;
  encoding: TextEncoding;
}

export const MAX_HEX_TEXT_BYTES = 4096;

const HEX_DIGIT = /^[0-9a-fA-F]$/;
const SEPARATOR = /^[\s,;:_-]$/;

/**
 * 把人类常见的 HEX 文本解析成字节数组。
 *
 * 解析器只忽略规格中明确列出的分隔符，并逐字符定位错误。这样既能接受
 * `41 42` 与 `0x41,0x42`，也不会用宽松正则静默吞掉未知字符。
 */
export function parseHexBytes(input: string): HexTextResult<ByteAnalysis> {
  const digits: string[] = [];

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (SEPARATOR.test(character)) {
      continue;
    }

    if (
      character === '0' &&
      index + 1 < input.length &&
      (input[index + 1] === 'x' || input[index + 1] === 'X')
    ) {
      const prefixPosition = index + 1;
      index += 1;
      let lookahead = index + 1;
      while (lookahead < input.length && SEPARATOR.test(input[lookahead])) {
        lookahead += 1;
      }
      if (lookahead >= input.length || !HEX_DIGIT.test(input[lookahead])) {
        return {
          ok: false,
          error: { code: 'EMPTY_PREFIX', position: prefixPosition },
        };
      }
      continue;
    }

    if (!HEX_DIGIT.test(character)) {
      return {
        ok: false,
        error: {
          code: 'INVALID_HEX_CHARACTER',
          character,
          position: index + 1,
        },
      };
    }

    digits.push(character);
  }

  if (digits.length === 0) {
    return { ok: false, error: { code: 'EMPTY_INPUT' } };
  }

  if (digits.length % 2 !== 0) {
    return {
      ok: false,
      error: { code: 'ODD_HEX_DIGITS', digitCount: digits.length },
    };
  }

  const byteCount = digits.length / 2;
  if (byteCount > MAX_HEX_TEXT_BYTES) {
    return {
      ok: false,
      error: { code: 'INPUT_TOO_LARGE', maxBytes: MAX_HEX_TEXT_BYTES },
    };
  }

  const bytes: number[] = [];
  for (let index = 0; index < digits.length; index += 2) {
    bytes.push(Number.parseInt(`${digits[index]}${digits[index + 1]}`, 16));
  }

  return { ok: true, value: analyzeBytes(bytes) };
}

/** 将 Unicode 文本严格编码为 ASCII 或 UTF-8 字节。 */
export function encodeText(
  text: string,
  encoding: TextEncoding,
): HexTextResult<EncodedText> {
  if (text.length === 0) {
    return { ok: false, error: { code: 'EMPTY_INPUT' } };
  }

  const surrogatePosition = findUnpairedSurrogate(text);
  if (surrogatePosition !== undefined) {
    return {
      ok: false,
      error: { code: 'UNPAIRED_SURROGATE', position: surrogatePosition },
    };
  }

  let bytes: number[];
  if (encoding === 'ascii') {
    bytes = [];
    let position = 0;
    for (const character of text) {
      position += 1;
      const codePoint = character.codePointAt(0)!;
      if (codePoint > 0x7f) {
        return {
          ok: false,
          error: { code: 'NON_ASCII_CHARACTER', character, position },
        };
      }
      bytes.push(codePoint);
    }
  } else {
    bytes = Array.from(new TextEncoder().encode(text));
  }

  if (bytes.length > MAX_HEX_TEXT_BYTES) {
    return {
      ok: false,
      error: { code: 'INPUT_TOO_LARGE', maxBytes: MAX_HEX_TEXT_BYTES },
    };
  }

  return {
    ok: true,
    value: { ...analyzeBytes(bytes), text, encoding },
  };
}

/** 将字节严格解码为 ASCII 或 UTF-8，不用替换字符掩盖坏数据。 */
export function decodeHexText(
  input: string,
  encoding: TextEncoding,
): HexTextResult<DecodedBytes> {
  const parsed = parseHexBytes(input);
  if (!parsed.ok) {
    return parsed;
  }

  const { bytes } = parsed.value;
  let text: string;

  if (encoding === 'ascii') {
    const invalidIndex = bytes.findIndex((byte) => byte > 0x7f);
    if (invalidIndex !== -1) {
      return {
        ok: false,
        error: {
          code: 'NON_ASCII_BYTE',
          byte: bytes[invalidIndex],
          index: invalidIndex,
        },
      };
    }
    text = String.fromCodePoint(...bytes);
  } else {
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(
        Uint8Array.from(bytes),
      );
    } catch {
      return { ok: false, error: { code: 'INVALID_UTF8' } };
    }
  }

  return { ok: true, value: { ...parsed.value, text, encoding } };
}

function analyzeBytes(bytes: readonly number[]): ByteAnalysis {
  return {
    bytes: [...bytes],
    hexadecimal: bytes
      .map((byte) => byte.toString(16).padStart(2, '0').toUpperCase())
      .join(' '),
    decimal: bytes.join(' '),
    asciiPreview: bytes
      .map((byte) => (byte >= 0x20 && byte <= 0x7e ? String.fromCodePoint(byte) : '.'))
      .join(''),
    byteCount: bytes.length,
  };
}

/** 返回第一个未配对代理项的 1-based UTF-16 code-unit 位置。 */
function findUnpairedSurrogate(text: string): number | undefined {
  for (let index = 0; index < text.length; index += 1) {
    const codeUnit = text.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = text.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        return index + 1;
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return index + 1;
    }
  }
  return undefined;
}

import { describe, expect, it } from 'vitest';

import {
  decodeHexText,
  encodeText,
  MAX_HEX_TEXT_BYTES,
  parseHexBytes,
} from '../../site/lib/tools/hex-text-converter';

describe('parseHexBytes', () => {
  it('解析连续和带分隔符的 HEX', () => {
    expect(parseHexBytes('414243')).toMatchObject({
      ok: true,
      value: { hexadecimal: '41 42 43', asciiPreview: 'ABC', byteCount: 3 },
    });
    expect(parseHexBytes('0x41, 42:43')).toMatchObject({
      ok: true,
      value: { bytes: [0x41, 0x42, 0x43] },
    });
  });

  it('拒绝空输入、非法字符、空前缀和奇数位', () => {
    expect(parseHexBytes('  ')).toMatchObject({ ok: false, error: { code: 'EMPTY_INPUT' } });
    expect(parseHexBytes('41G2')).toMatchObject({
      ok: false,
      error: { code: 'INVALID_HEX_CHARACTER', character: 'G', position: 3 },
    });
    expect(parseHexBytes('41 0x')).toMatchObject({ ok: false, error: { code: 'EMPTY_PREFIX' } });
    expect(parseHexBytes('ABC')).toMatchObject({
      ok: false,
      error: { code: 'ODD_HEX_DIGITS', digitCount: 3 },
    });
  });

  it('拒绝超过本地工具上限的数据', () => {
    const oversizedHex = '00'.repeat(MAX_HEX_TEXT_BYTES + 1);
    expect(parseHexBytes(oversizedHex)).toMatchObject({
      ok: false,
      error: { code: 'INPUT_TOO_LARGE', maxBytes: MAX_HEX_TEXT_BYTES },
    });
  });
});

describe('encodeText', () => {
  it('编码 ASCII、中文和补充平面字符', () => {
    expect(encodeText('ABC', 'ascii')).toMatchObject({
      ok: true,
      value: { hexadecimal: '41 42 43', byteCount: 3 },
    });
    expect(encodeText('中', 'utf-8')).toMatchObject({
      ok: true,
      value: { hexadecimal: 'E4 B8 AD', byteCount: 3 },
    });
    expect(encodeText('😀', 'utf-8')).toMatchObject({
      ok: true,
      value: { hexadecimal: 'F0 9F 98 80', byteCount: 4 },
    });
  });

  it('拒绝非 ASCII 字符和未配对代理项', () => {
    expect(encodeText('A中', 'ascii')).toMatchObject({
      ok: false,
      error: { code: 'NON_ASCII_CHARACTER', character: '中', position: 2 },
    });
    expect(encodeText('\ud800', 'utf-8')).toMatchObject({
      ok: false,
      error: { code: 'UNPAIRED_SURROGATE', position: 1 },
    });
  });
});

describe('decodeHexText', () => {
  it('严格解码 ASCII 和 UTF-8', () => {
    expect(decodeHexText('41 42 43', 'ascii')).toMatchObject({ ok: true, value: { text: 'ABC' } });
    expect(decodeHexText('E4 B8 AD', 'utf-8')).toMatchObject({ ok: true, value: { text: '中' } });
  });

  it('拒绝 ASCII 外字节和非法 UTF-8', () => {
    expect(decodeHexText('80', 'ascii')).toMatchObject({
      ok: false,
      error: { code: 'NON_ASCII_BYTE', byte: 0x80, index: 0 },
    });
    expect(decodeHexText('C0 AF', 'utf-8')).toMatchObject({ ok: false, error: { code: 'INVALID_UTF8' } });
    expect(decodeHexText('E4 B8', 'utf-8')).toMatchObject({ ok: false, error: { code: 'INVALID_UTF8' } });
  });
});

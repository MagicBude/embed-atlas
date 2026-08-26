import { describe, expect, it } from 'vitest';

import {
  analyzeEndianBytes,
  encodeUnsignedInteger,
} from '../../site/lib/tools/endianness-converter';

describe('analyzeEndianBytes', () => {
  it('分别解释 32 bit byte 序列并给出反转结果', () => {
    expect(analyzeEndianBytes('12 34 56 78')).toEqual({
      ok: true,
      value: {
        bytes: [0x12, 0x34, 0x56, 0x78],
        byteCount: 4,
        normalizedBytes: '12 34 56 78',
        reversedBytes: '78 56 34 12',
        bigEndianHex: '0x12345678',
        bigEndianDecimal: '305419896',
        littleEndianHex: '0x78563412',
        littleEndianDecimal: '2018915346',
      },
    });
  });

  it('保持 64 bit 前导零和整数精度', () => {
    expect(analyzeEndianBytes('01 23 45 67 89 AB CD EF')).toMatchObject({
      ok: true,
      value: {
        bigEndianHex: '0x0123456789ABCDEF',
        bigEndianDecimal: '81985529216486895',
        littleEndianHex: '0xEFCDAB8967452301',
      },
    });
  });

  it('接受常见分隔符与逐 byte 前缀', () => {
    expect(analyzeEndianBytes('0x34, 0x12')).toMatchObject({
      ok: true,
      value: { bigEndianHex: '0x3412', littleEndianHex: '0x1234' },
    });
  });

  it('拒绝空输入、非法字符、奇数位和超过 8 byte', () => {
    expect(analyzeEndianBytes(' ')).toMatchObject({ ok: false, error: { code: 'EMPTY_INPUT' } });
    expect(analyzeEndianBytes('12 G4')).toMatchObject({
      ok: false,
      error: { code: 'INVALID_HEX_CHARACTER', character: 'G', position: 4 },
    });
    expect(analyzeEndianBytes('123')).toMatchObject({
      ok: false,
      error: { code: 'ODD_HEX_DIGITS' },
    });
    expect(analyzeEndianBytes('00 '.repeat(9))).toMatchObject({
      ok: false,
      error: { code: 'TOO_MANY_BYTES', maxBytes: 8 },
    });
  });
});

describe('encodeUnsignedInteger', () => {
  it('把 32 bit 整数编码为大端和小端 byte', () => {
    expect(encodeUnsignedInteger('0x12345678', 'hexadecimal', 4)).toEqual({
      ok: true,
      value: {
        valueHex: '0x12345678',
        valueDecimal: '305419896',
        byteWidth: 4,
        bigEndianBytes: '12 34 56 78',
        littleEndianBytes: '78 56 34 12',
      },
    });
  });

  it('保留固定宽度前导零并支持 64 bit 最大值', () => {
    expect(encodeUnsignedInteger('1', 'decimal', 4)).toMatchObject({
      ok: true,
      value: { valueHex: '0x00000001', bigEndianBytes: '00 00 00 01' },
    });
    expect(encodeUnsignedInteger('FFFFFFFFFFFFFFFF', 'hexadecimal', 8)).toMatchObject({
      ok: true,
      value: { valueDecimal: '18446744073709551615' },
    });
  });

  it('拒绝负数、非法数字和字段溢出', () => {
    expect(encodeUnsignedInteger('-1', 'decimal', 1)).toMatchObject({
      ok: false,
      error: { code: 'NEGATIVE_INTEGER' },
    });
    expect(encodeUnsignedInteger('12G4', 'hexadecimal', 2)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_INTEGER_CHARACTER', character: 'G' },
    });
    expect(encodeUnsignedInteger('256', 'decimal', 1)).toMatchObject({
      ok: false,
      error: { code: 'VALUE_OUT_OF_RANGE', byteWidth: 1 },
    });
  });
});

import { describe, expect, it } from 'vitest';

import {
  calculateBaseBit,
  formatFixedWidthInteger,
  parseFixedWidthInteger,
  type BaseBitCalculationInput,
  type BaseBitCalculationOutput,
  type ConverterResult,
} from '../../site/lib/tools/base-bit-converter';

function expectSuccess<T>(result: ConverterResult<T>): T {
  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error(`Expected success, received ${result.error.code}`);
  }

  return result.value;
}

function calculate(input: BaseBitCalculationInput): BaseBitCalculationOutput {
  return expectSuccess(calculateBaseBit(input));
}

describe('parseFixedWidthInteger', () => {
  it('解析带匹配前缀和分隔符的十六进制输入', () => {
    const parsed = expectSuccess(parseFixedWidthInteger('  0xFF_FF  ', 16, 16));

    expect(parsed.mathematicalValue).toBe(65_535n);
    expect(parsed.unsignedValue).toBe(65_535n);
    expect(parsed.signedValue).toBe(-1n);
  });

  it('把十进制负数规范化为相同位宽的补码位模式', () => {
    const parsed = expectSuccess(parseFixedWidthInteger('-128', 10, 8));

    expect(parsed.unsignedValue).toBe(128n);
    expect(parsed.signedValue).toBe(-128n);
  });

  it('接受 64 位最大无符号值且不损失精度', () => {
    const parsed = expectSuccess(
      parseFixedWidthInteger('0xFFFFFFFFFFFFFFFF', 16, 64),
    );

    expect(parsed.unsignedValue).toBe(18_446_744_073_709_551_615n);
    expect(parsed.signedValue).toBe(-1n);
  });

  it('拒绝空输入', () => {
    expect(parseFixedWidthInteger('   ', 10, 8)).toEqual({
      ok: false,
      error: { code: 'EMPTY_INPUT', field: 'operandA' },
    });
  });

  it('报告非法字符及其一基位置', () => {
    expect(parseFixedWidthInteger('102', 2, 8)).toEqual({
      ok: false,
      error: {
        code: 'INVALID_DIGIT',
        field: 'operandA',
        character: '2',
        position: 3,
        radix: 2,
      },
    });
  });

  it.each(['_FF', 'FF_', 'F__F'])('拒绝错误的下划线位置：%s', (text) => {
    const result = parseFixedWidthInteger(text, 16, 16);

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SEPARATOR' },
    });
  });

  it('拒绝与所选进制不一致的前缀', () => {
    expect(parseFixedWidthInteger('0x10', 10, 8)).toEqual({
      ok: false,
      error: {
        code: 'PREFIX_BASE_MISMATCH',
        field: 'operandA',
        prefixRadix: 16,
        selectedRadix: 10,
      },
    });
  });

  it('拒绝非十进制负数写法', () => {
    expect(parseFixedWidthInteger('-01', 16, 8)).toEqual({
      ok: false,
      error: { code: 'NEGATIVE_NON_DECIMAL', field: 'operandA' },
    });
  });

  it.each([
    ['256', 10],
    ['-129', 10],
  ] as const)('拒绝超出 8 位有效范围的输入：%s', (text, radix) => {
    expect(parseFixedWidthInteger(text, radix, 8)).toMatchObject({
      ok: false,
      error: {
        code: 'OUT_OF_RANGE',
        bitWidth: 8,
        minSigned: -128n,
        maxUnsigned: 255n,
      },
    });
  });

  it('拒绝超过安全长度限制的输入', () => {
    expect(parseFixedWidthInteger('1'.repeat(129), 2, 64)).toMatchObject({
      ok: false,
      error: { code: 'INPUT_TOO_LONG', maxLength: 128 },
    });
  });
});

describe('formatFixedWidthInteger', () => {
  it('按 8 位宽度输出全部进制并补齐高位零', () => {
    const formatted = formatFixedWidthInteger(0x2an, 8);

    expect(formatted).toMatchObject({
      binary: '0b00101010',
      octal: '0o052',
      unsignedDecimal: '42',
      signedDecimal: '42',
      hexadecimal: '0x2A',
    });
  });

  it('同时输出同一位模式的无符号值和补码有符号值', () => {
    const formatted = formatFixedWidthInteger(0xffn, 8);

    expect(formatted.unsignedDecimal).toBe('255');
    expect(formatted.signedDecimal).toBe('-1');
  });

  it('从最高位到最低位生成可视化位列表', () => {
    const formatted = formatFixedWidthInteger(0x81n, 8);

    expect(formatted.bits).toHaveLength(8);
    expect(formatted.bits[0]).toEqual({ index: 7, value: 1 });
    expect(formatted.bits[7]).toEqual({ index: 0, value: 1 });
  });
});

describe('calculateBaseBit', () => {
  const binaryInput = (operation: BaseBitCalculationInput['operation']) => ({
    bitWidth: 8 as const,
    operandA: { text: '0xA5', radix: 16 as const },
    operandB: { text: '0x0F', radix: 16 as const },
    operation,
  });

  it.each([
    ['and', '0x05'],
    ['or', '0xAF'],
    ['xor', '0xAA'],
  ] as const)('计算 %s 的逐位结果', (operation, expectedHex) => {
    const result = calculate(binaryInput(operation));

    expect(result.result.hexadecimal).toBe(expectedHex);
  });

  it('NOT 只反转所选位宽内的位', () => {
    const result = calculate({
      bitWidth: 8,
      operandA: { text: '0x0F', radix: 16 },
      operation: 'not',
    });

    expect(result.result.hexadecimal).toBe('0xF0');
  });

  it('左移保留低 N 位并报告非零高位被截断', () => {
    const result = calculate({
      bitWidth: 8,
      operandA: { text: '0x81', radix: 16 },
      operation: 'shift-left',
      shiftCount: 1,
    });

    expect(result.result.hexadecimal).toBe('0x02');
    expect(result.wasTruncated).toBe(true);
  });

  it('逻辑右移把输入作为非负位模式并在高位补零', () => {
    const result = calculate({
      bitWidth: 8,
      operandA: { text: '0x80', radix: 16 },
      operation: 'shift-right-logical',
      shiftCount: 1,
    });

    expect(result.result.hexadecimal).toBe('0x40');
    expect(result.result.signedDecimal).toBe('64');
  });

  it('算术右移按补码符号位补一', () => {
    const result = calculate({
      bitWidth: 8,
      operandA: { text: '0x80', radix: 16 },
      operation: 'shift-right-arithmetic',
      shiftCount: 1,
    });

    expect(result.result.hexadecimal).toBe('0xC0');
    expect(result.result.signedDecimal).toBe('-64');
  });

  it('转换模式直接格式化 A 且不报告截断', () => {
    const result = calculate({
      bitWidth: 8,
      operandA: { text: '0x2A', radix: 16 },
      operation: 'convert',
    });

    expect(result.result.hexadecimal).toBe('0x2A');
    expect(result.wasTruncated).toBe(false);
  });

  it('二元运算缺少 B 时返回结构化错误', () => {
    expect(
      calculateBaseBit({
        bitWidth: 8,
        operandA: { text: '0xA5', radix: 16 },
        operation: 'and',
      }),
    ).toEqual({
      ok: false,
      error: { code: 'MISSING_SECOND_OPERAND', field: 'operandB' },
    });
  });

  it.each([-1, 1.5, 8, undefined])('拒绝非法移位量：%s', (shiftCount) => {
    expect(
      calculateBaseBit({
        bitWidth: 8,
        operandA: { text: '1', radix: 10 },
        operation: 'shift-left',
        shiftCount,
      }),
    ).toEqual({
      ok: false,
      error: {
        code: 'INVALID_SHIFT_COUNT',
        field: 'shiftCount',
        maxShift: 7,
      },
    });
  });
});

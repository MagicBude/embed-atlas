/**
 * 进制与位运算转换器的纯计算核心。
 *
 * 本模块只处理“数学整数”和“固定宽度位模式”，不读取 DOM、Vue 状态或
 * 浏览器存储。界面层应把输入原样传入，并根据结构化错误代码显示对应语言
 * 的提示。这种边界既便于单元测试，也为未来中英文切换保留了空间。
 *
 * 固定宽度语义：
 * - 支持 8、16、32、64 位；
 * - 正输入按无符号范围校验，负输入按补码有符号范围校验；
 * - 位运算结果保留低 N 位；
 * - 64 位整数始终使用 BigInt，不能经过会损失精度的 number。
 */

export type BitWidth = 8 | 16 | 32 | 64;

export type Radix = 2 | 8 | 10 | 16;

export type BitwiseOperation =
  | 'convert'
  | 'and'
  | 'or'
  | 'xor'
  | 'not'
  | 'shift-left'
  | 'shift-right-logical'
  | 'shift-right-arithmetic';

export type ConverterField = 'operandA' | 'operandB' | 'shiftCount';

export type ConverterError =
  | {
      code: 'EMPTY_INPUT';
      field: 'operandA' | 'operandB';
    }
  | {
      code: 'INVALID_DIGIT';
      field: 'operandA' | 'operandB';
      character: string;
      position: number;
      radix: Radix;
    }
  | {
      code: 'INVALID_SEPARATOR';
      field: 'operandA' | 'operandB';
      position: number;
    }
  | {
      code: 'PREFIX_BASE_MISMATCH';
      field: 'operandA' | 'operandB';
      prefixRadix: Radix;
      selectedRadix: Radix;
    }
  | {
      code: 'NEGATIVE_NON_DECIMAL';
      field: 'operandA' | 'operandB';
    }
  | {
      code: 'OUT_OF_RANGE';
      field: 'operandA' | 'operandB';
      bitWidth: BitWidth;
      minSigned: bigint;
      maxUnsigned: bigint;
    }
  | {
      code: 'MISSING_SECOND_OPERAND';
      field: 'operandB';
    }
  | {
      code: 'INVALID_SHIFT_COUNT';
      field: 'shiftCount';
      maxShift: number;
    }
  | {
      code: 'INPUT_TOO_LONG';
      field: 'operandA' | 'operandB';
      maxLength: number;
    };

export type ConverterResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ConverterError };

export interface OperandInput {
  text: string;
  radix: Radix;
}

export interface ParsedInteger {
  /** 用户输入表达的数学整数，例如十进制 -1 仍然保留为 -1n。 */
  mathematicalValue: bigint;
  /** 规范化后的 N 位非负位模式，范围为 0～2^N-1。 */
  unsignedValue: bigint;
  /** 同一位模式按 N 位二进制补码解释后的有符号值。 */
  signedValue: bigint;
}

export interface FormattedInteger {
  unsignedValue: bigint;
  signedValue: bigint;
  binary: string;
  octal: string;
  unsignedDecimal: string;
  signedDecimal: string;
  hexadecimal: string;
  bits: ReadonlyArray<{
    index: number;
    value: 0 | 1;
  }>;
}

export interface BaseBitCalculationInput {
  bitWidth: BitWidth;
  operandA: OperandInput;
  operation: BitwiseOperation;
  operandB?: OperandInput;
  shiftCount?: number;
}

export interface BaseBitCalculationOutput {
  bitWidth: BitWidth;
  operation: BitwiseOperation;
  operandA: FormattedInteger;
  operandB?: FormattedInteger;
  result: FormattedInteger;
  shiftCount?: number;
  /** 当前只在左移确实丢弃非零高位时为 true。 */
  wasTruncated: boolean;
}

const MAX_INPUT_LENGTH = 128;

const PREFIX_RADIX: Readonly<Record<string, Radix>> = {
  '0b': 2,
  '0o': 8,
  '0x': 16,
};

function trimAsciiWhitespace(value: string): string {
  return value.replace(/^[\t\n\f\r ]+|[\t\n\f\r ]+$/g, '');
}

function getDigitValue(character: string): number {
  const code = character.toUpperCase().charCodeAt(0);

  if (code >= 48 && code <= 57) {
    return code - 48;
  }

  if (code >= 65 && code <= 70) {
    return code - 65 + 10;
  }

  return -1;
}

export function getIntegerRange(bitWidth: BitWidth): {
  minSigned: bigint;
  maxUnsigned: bigint;
} {
  const width = BigInt(bitWidth);

  return {
    minSigned: -(1n << (width - 1n)),
    maxUnsigned: (1n << width) - 1n,
  };
}

/**
 * 把用户字符串解析成固定宽度整数。
 *
 * 这里手动逐位累积，而不直接把输入交给 `BigInt(string)`：前者可以严格
 * 执行项目自己的前缀和下划线规则，并准确报告非法字符位置。输入越界时
 * 返回错误而不是自动截断，因为静默截断会掩盖寄存器值或协议字段错误。
 */
export function parseFixedWidthInteger(
  input: string,
  radix: Radix,
  bitWidth: BitWidth,
  field: 'operandA' | 'operandB' = 'operandA',
): ConverterResult<ParsedInteger> {
  if (input.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      error: { code: 'INPUT_TOO_LONG', field, maxLength: MAX_INPUT_LENGTH },
    };
  }

  const normalizedInput = trimAsciiWhitespace(input);

  if (normalizedInput.length === 0) {
    return { ok: false, error: { code: 'EMPTY_INPUT', field } };
  }

  let cursor = 0;
  let isNegative = false;

  if (normalizedInput[cursor] === '-') {
    if (radix !== 10) {
      return { ok: false, error: { code: 'NEGATIVE_NON_DECIMAL', field } };
    }

    isNegative = true;
    cursor += 1;
  }

  const possiblePrefix = normalizedInput.slice(cursor, cursor + 2).toLowerCase();
  const prefixRadix = PREFIX_RADIX[possiblePrefix];

  if (prefixRadix !== undefined) {
    if (prefixRadix !== radix) {
      return {
        ok: false,
        error: {
          code: 'PREFIX_BASE_MISMATCH',
          field,
          prefixRadix,
          selectedRadix: radix,
        },
      };
    }

    cursor += 2;
  }

  const digits = normalizedInput.slice(cursor);

  if (digits.length === 0) {
    return { ok: false, error: { code: 'EMPTY_INPUT', field } };
  }

  for (let index = 0; index < digits.length; index += 1) {
    if (digits[index] !== '_') {
      continue;
    }

    const isInvalidSeparator =
      index === 0 || index === digits.length - 1 || digits[index - 1] === '_';

    if (isInvalidSeparator) {
      return {
        ok: false,
        error: {
          code: 'INVALID_SEPARATOR',
          field,
          position: cursor + index + 1,
        },
      };
    }
  }

  let mathematicalValue = 0n;
  const radixValue = BigInt(radix);

  for (let index = 0; index < digits.length; index += 1) {
    const character = digits[index];

    if (character === '_') {
      continue;
    }

    const digitValue = getDigitValue(character);

    if (digitValue < 0 || digitValue >= radix) {
      return {
        ok: false,
        error: {
          code: 'INVALID_DIGIT',
          field,
          character,
          position: cursor + index + 1,
          radix,
        },
      };
    }

    mathematicalValue = mathematicalValue * radixValue + BigInt(digitValue);
  }

  if (isNegative) {
    mathematicalValue = -mathematicalValue;
  }

  const { minSigned, maxUnsigned } = getIntegerRange(bitWidth);

  if (mathematicalValue < minSigned || mathematicalValue > maxUnsigned) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_RANGE',
        field,
        bitWidth,
        minSigned,
        maxUnsigned,
      },
    };
  }

  const unsignedValue = BigInt.asUintN(bitWidth, mathematicalValue);

  return {
    ok: true,
    value: {
      mathematicalValue,
      unsignedValue,
      signedValue: BigInt.asIntN(bitWidth, unsignedValue),
    },
  };
}

/**
 * 把一个整数格式化为 N 位位模式的所有公开表示。
 *
 * 输入会先通过 `BigInt.asUintN` 规范化，因此该函数也能安全格式化运算后
 * 产生的负 BigInt。二、八、十六进制按位宽补零，让不同值可以逐位比较；
 * 十进制不补零，因为它表达数值而不是内存布局。
 */
export function formatFixedWidthInteger(
  value: bigint,
  bitWidth: BitWidth,
): FormattedInteger {
  const unsignedValue = BigInt.asUintN(bitWidth, value);
  const signedValue = BigInt.asIntN(bitWidth, unsignedValue);
  const binaryDigits = unsignedValue.toString(2).padStart(bitWidth, '0');
  const octalWidth = Math.ceil(bitWidth / 3);
  const hexadecimalWidth = bitWidth / 4;

  const bits = Array.from({ length: bitWidth }, (_, offset) => {
    const index = bitWidth - offset - 1;
    const bit = Number((unsignedValue >> BigInt(index)) & 1n) as 0 | 1;

    return { index, value: bit };
  });

  return {
    unsignedValue,
    signedValue,
    binary: `0b${binaryDigits}`,
    octal: `0o${unsignedValue.toString(8).padStart(octalWidth, '0')}`,
    unsignedDecimal: unsignedValue.toString(10),
    signedDecimal: signedValue.toString(10),
    hexadecimal: `0x${unsignedValue
      .toString(16)
      .toUpperCase()
      .padStart(hexadecimalWidth, '0')}`,
    bits,
  };
}

function parseOperand(
  operand: OperandInput,
  bitWidth: BitWidth,
  field: 'operandA' | 'operandB',
): ConverterResult<ParsedInteger> {
  return parseFixedWidthInteger(operand.text, operand.radix, bitWidth, field);
}

/**
 * 执行一次转换或位运算。
 *
 * 所有操作数先转换为 0～2^N-1 的非负位模式，再执行运算。逻辑右移因此
 * 可以用 BigInt 的 `>>` 得到高位补零效果；算术右移则必须先用
 * `BigInt.asIntN` 恢复负数含义，才能让右移补入符号位。
 */
export function calculateBaseBit(
  input: BaseBitCalculationInput,
): ConverterResult<BaseBitCalculationOutput> {
  const parsedA = parseOperand(input.operandA, input.bitWidth, 'operandA');

  if (!parsedA.ok) {
    return parsedA;
  }

  const operandAValue = parsedA.value.unsignedValue;
  let operandBValue: bigint | undefined;
  let formattedOperandB: FormattedInteger | undefined;

  if (input.operation === 'and' || input.operation === 'or' || input.operation === 'xor') {
    if (input.operandB === undefined) {
      return {
        ok: false,
        error: { code: 'MISSING_SECOND_OPERAND', field: 'operandB' },
      };
    }

    const parsedB = parseOperand(input.operandB, input.bitWidth, 'operandB');

    if (!parsedB.ok) {
      return parsedB;
    }

    operandBValue = parsedB.value.unsignedValue;
    formattedOperandB = formatFixedWidthInteger(operandBValue, input.bitWidth);
  }

  const isShiftOperation =
    input.operation === 'shift-left' ||
    input.operation === 'shift-right-logical' ||
    input.operation === 'shift-right-arithmetic';

  if (
    isShiftOperation &&
    (input.shiftCount === undefined ||
      !Number.isInteger(input.shiftCount) ||
      input.shiftCount < 0 ||
      input.shiftCount >= input.bitWidth)
  ) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SHIFT_COUNT',
        field: 'shiftCount',
        maxShift: input.bitWidth - 1,
      },
    };
  }

  const shiftCount = isShiftOperation ? input.shiftCount : undefined;
  const shift = BigInt(shiftCount ?? 0);
  const { maxUnsigned: mask } = getIntegerRange(input.bitWidth);
  let resultValue = operandAValue;
  let wasTruncated = false;

  switch (input.operation) {
    case 'convert':
      break;
    case 'and':
      resultValue = operandAValue & operandBValue!;
      break;
    case 'or':
      resultValue = operandAValue | operandBValue!;
      break;
    case 'xor':
      resultValue = operandAValue ^ operandBValue!;
      break;
    case 'not':
      resultValue = ~operandAValue & mask;
      break;
    case 'shift-left': {
      const unmaskedResult = operandAValue << shift;
      wasTruncated = unmaskedResult > mask;
      resultValue = unmaskedResult & mask;
      break;
    }
    case 'shift-right-logical':
      resultValue = operandAValue >> shift;
      break;
    case 'shift-right-arithmetic': {
      const signedOperand = BigInt.asIntN(input.bitWidth, operandAValue);
      resultValue = BigInt.asUintN(input.bitWidth, signedOperand >> shift);
      break;
    }
  }

  return {
    ok: true,
    value: {
      bitWidth: input.bitWidth,
      operation: input.operation,
      operandA: formatFixedWidthInteger(operandAValue, input.bitWidth),
      operandB: formattedOperandB,
      result: formatFixedWidthInteger(resultValue, input.bitWidth),
      shiftCount,
      wasTruncated,
    },
  };
}

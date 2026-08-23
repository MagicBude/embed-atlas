import type {
  BitwiseOperation,
  ConverterError,
  Radix,
} from '../../../lib/tools/base-bit-converter';

/**
 * 进制与位运算转换器的简体中文界面资源。
 *
 * 目前站点只有中文，但文案仍与组件分离。未来增加英文时，只需要提供同样
 * 结构的资源，并由 locale 注册表选择；计算核心和 Vue 交互状态无需复制。
 */
export const baseBitConverterZhCN = {
  localOnly: '仅在本地浏览器计算',
  tested: '29 项核心测试通过',
  bitWidth: '位宽',
  operandA: '操作数 A',
  operandB: '操作数 B',
  radix: '输入进制',
  operation: '运算',
  shiftCount: '移位量',
  shiftUnit: 'bit',
  loadExample: '载入 XOR 示例',
  reset: '重置',
  result: '计算结果',
  resultUnavailable: '请先修正输入错误，结果会自动更新。',
  unsignedDecimal: '无符号十进制',
  signedDecimal: '补码有符号十进制',
  hexadecimal: '十六进制',
  binary: '二进制',
  octal: '八进制',
  bitView: '位模式',
  operandComparison: '逐位比较',
  truncated: '左移结果超出当前位宽，非零高位已被舍弃。',
  copy: '复制',
  copySuccess: '已复制{label}',
  copyFailure: '复制失败，请手动选择结果。',
  operandHelp: '支持匹配的 0b、0o、0x 前缀和数字间下划线。',
  shiftHelp: '移位量必须小于当前位宽，不会自动对 32 取模。',
  operationLabels: {
    convert: '仅转换进制',
    and: 'AND（按位与）',
    or: 'OR（按位或）',
    xor: 'XOR（按位异或）',
    not: 'NOT（按位取反）',
    'shift-left': '左移',
    'shift-right-logical': '逻辑右移',
    'shift-right-arithmetic': '算术右移',
  } satisfies Record<BitwiseOperation, string>,
  radixLabels: {
    2: '二进制',
    8: '八进制',
    10: '十进制',
    16: '十六进制',
  } satisfies Record<Radix, string>,
} as const;

/** 把语言无关的核心错误转换为可以直接指导用户修正的中文提示。 */
export function formatBaseBitConverterError(error: ConverterError): string {
  switch (error.code) {
    case 'EMPTY_INPUT':
      return '请输入一个整数。';
    case 'INVALID_DIGIT':
      return `字符“${error.character}”不能用于 ${error.radix} 进制，位置 ${error.position}。`;
    case 'INVALID_SEPARATOR':
      return `位置 ${error.position} 的下划线无效；下划线只能放在两个数字之间。`;
    case 'PREFIX_BASE_MISMATCH':
      return `输入前缀表示 ${error.prefixRadix} 进制，但当前选择的是 ${error.selectedRadix} 进制。`;
    case 'NEGATIVE_NON_DECIMAL':
      return '负数请使用十进制输入；二、八、十六进制用于输入原始位模式。';
    case 'OUT_OF_RANGE':
      return `该值超出 ${error.bitWidth} 位范围：正数最大为 ${error.maxUnsigned.toString(10)}，负数最小为 ${error.minSigned.toString(10)}。`;
    case 'MISSING_SECOND_OPERAND':
      return '当前运算还需要操作数 B。';
    case 'INVALID_SHIFT_COUNT':
      return `移位量必须是 0 到 ${error.maxShift} 之间的整数。`;
    case 'INPUT_TOO_LONG':
      return `输入过长；最多接受 ${error.maxLength} 个字符，并且只处理 64 位整数。`;
  }
}

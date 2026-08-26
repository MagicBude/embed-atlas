import type { EndiannessError } from '../../../lib/tools/endianness-converter';

export function formatEndiannessError(error: EndiannessError): string {
  switch (error.code) {
    case 'EMPTY_INPUT':
      return '请输入要转换的 byte 序列或整数。';
    case 'INVALID_HEX_CHARACTER':
      return `HEX 输入第 ${error.position} 个字符“${error.character}”无效。`;
    case 'EMPTY_PREFIX':
      return `第 ${error.position} 个字符处的 0x 后面缺少 HEX 数字。`;
    case 'ODD_HEX_DIGITS':
      return `当前有 ${error.digitCount} 个 HEX 数字；每个 byte 必须恰好包含两个。`;
    case 'TOO_MANY_BYTES':
      return `首版一次最多处理 ${error.maxBytes} byte。`;
    case 'INVALID_INTEGER_CHARACTER':
      return `${error.radix === 'decimal' ? '十进制' : '十六进制'}整数第 ${error.position} 个字符“${error.character}”无效。`;
    case 'NEGATIVE_INTEGER':
      return '首版只编码非负无符号整数。';
    case 'VALUE_OUT_OF_RANGE':
      return `该数值超出 ${error.byteWidth} byte 无符号整数范围。`;
  }
}

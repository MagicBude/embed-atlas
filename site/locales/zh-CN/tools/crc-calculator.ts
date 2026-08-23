import type { CrcError } from '../../../lib/tools/crc-calculator';

export function formatCrcError(error: CrcError): string {
  switch (error.code) {
    case 'EMPTY_DATA':
      return '请输入至少一个用于计算的字节。';
    case 'DATA_TOO_LARGE':
      return `输入过大；一次最多计算 ${error.maxBytes} byte。`;
    case 'INVALID_BYTE':
      return `第 ${error.index + 1} 个数据值不是 0～255 的整数。`;
    case 'PARAMETER_OUT_OF_RANGE':
      return `${error.parameter} 超出 ${error.width} bit 可表示范围。`;
    case 'ZERO_POLYNOMIAL':
      return 'Poly 不能为 0。';
  }
}

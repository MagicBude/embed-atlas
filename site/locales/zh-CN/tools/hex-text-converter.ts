import type { HexTextError } from '../../../lib/tools/hex-text-converter';

export const hexTextConverterZhCN = {
  localOnly: '仅在本地浏览器处理',
  encoding: '字符编码',
  textToHex: '文本 → HEX',
  hexToText: 'HEX → 文本',
  textInput: '文本输入',
  hexInput: 'HEX 字节输入',
  textPlaceholder: '例如：Hello, 中!',
  hexPlaceholder: '例如：48 65 6C 6C 6F',
  loadExample: '载入 UTF-8 示例',
  reset: '重置',
  result: '转换结果',
  hexadecimal: 'HEX 字节',
  decodedText: '解码文本',
  decimalBytes: '十进制字节',
  asciiPreview: '可打印 ASCII 预览',
  byteCount: '字节数',
  copy: '复制',
  copySuccess: '已复制结果',
  copyFailure: '复制失败，请手动选择结果。',
} as const;

export function formatHexTextError(error: HexTextError): string {
  switch (error.code) {
    case 'EMPTY_INPUT':
      return '请输入要转换的内容。';
    case 'INVALID_HEX_CHARACTER':
      return `字符“${error.character}”不是十六进制数字或允许的分隔符，位置 ${error.position}。`;
    case 'EMPTY_PREFIX':
      return `位置 ${error.position} 的 0x 前缀后面没有十六进制数字。`;
    case 'ODD_HEX_DIGITS':
      return `共有 ${error.digitCount} 个十六进制数字；一个字节必须恰好由两个数字组成。`;
    case 'INPUT_TOO_LARGE':
      return `输入过大；一次最多处理 ${error.maxBytes} byte。`;
    case 'NON_ASCII_CHARACTER':
      return `字符“${error.character}”不属于 ASCII，字符位置 ${error.position}；请选择 UTF-8。`;
    case 'NON_ASCII_BYTE':
      return `第 ${error.index + 1} 个字节 0x${error.byte.toString(16).padStart(2, '0').toUpperCase()} 超出 ASCII 范围。`;
    case 'INVALID_UTF8':
      return '这些字节不是完整、合法的 UTF-8 序列；未使用替换字符掩盖错误。';
    case 'UNPAIRED_SURROGATE':
      return `文本在 UTF-16 位置 ${error.position} 含未配对代理项，无法无损编码。`;
  }
}

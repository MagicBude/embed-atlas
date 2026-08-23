# CRC 计算器需求规格

## 1. 用户问题

嵌入式工程师需要用完整模型参数计算循环冗余校验（Cyclic Redundancy Check，CRC），并能回答结果不一致究竟来自数据字节、参数、反射规则还是显示宽度。

## 2. 首版范围

- 支持 8、16、32 bit CRC。
- 支持 `Poly`、`Init`、`RefIn`、`RefOut`、`XorOut` 完整参数。
- 输入支持 UTF-8 文本或严格 HEX 字节，最多 4096 byte。
- 提供 CRC-8/SMBUS、CRC-16/ARC、CRC-16/MODBUS、CRC-32/ISO-HDLC 预设。
- 结果按宽度补齐 HEX，并显示参与计算的 byte 数和标准检查值提示。
- 所有输入只在浏览器本地处理。

首版不支持自动识别未知 CRC、宽度小于 8 bit、增强参数 `Augment`、文件上传或硬件指令加速。

## 3. 参数语义

- `Width`：寄存器与结果宽度。
- `Poly`：省略最高次隐含 `1` 后的普通方向多项式表示。
- `Init`：处理第一个输入 byte 前的寄存器值。
- `RefIn`：逐 byte 先从最低有效 bit 方向参与计算。
- `RefOut`：输出相对普通方向是否反射；实现中仅在它与 `RefIn` 不同时额外反射寄存器。
- `XorOut`：返回结果前执行的最终异或值。

所有数值参数必须落在 `0`～`2^Width - 1`；`Poly` 不得为零。

## 4. 公开检查向量

输入均为 ASCII 文本 `123456789`：

| 模型 | Width | Poly | Init | RefIn | RefOut | XorOut | Check |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| CRC-8/SMBUS | 8 | `07` | `00` | false | false | `00` | `F4` |
| CRC-16/ARC | 16 | `8005` | `0000` | true | true | `0000` | `BB3D` |
| CRC-16/MODBUS | 16 | `8005` | `FFFF` | true | true | `0000` | `4B37` |
| CRC-32/ISO-HDLC | 32 | `04C11DB7` | `FFFFFFFF` | true | true | `FFFFFFFF` | `CBF43926` |

参数与检查值依据 AUTOSAR CRC 例程规范、Ross Williams 参数模型及 CRC RevEng 参数目录交叉核对。

## 5. 错误模型

- 输入为空、超过 4096 byte 或 HEX 无效。
- 参数为空、含非 HEX 字符、超出选定宽度。
- 多项式为零。
- 输入 byte 不是 `0`～`255` 的整数。

## 6. 验收条件

- [ ] 核心计算不依赖 Vue、DOM 或浏览器状态。
- [ ] 四个公开检查向量全部通过。
- [ ] 覆盖空数据、单字节、无效 byte、越界参数和独立 RefIn/RefOut。
- [ ] 页面允许载入预设后继续修改参数。
- [ ] 参数和结果都按宽度显示，不丢失前导零。
- [ ] 与 CRC 原理文章双向链接。
- [ ] 桌面与 390px 窄屏无整页横向溢出，错误可被辅助技术读取。

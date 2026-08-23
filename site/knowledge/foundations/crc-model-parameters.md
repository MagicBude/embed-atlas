---
title: CRC 模型参数与标准检查值
description: 用统一参数模型解释 CRC 的多项式、初值、输入输出反射、最终异或与 Check，帮助定位同名算法结果不一致。
category: foundations
tags:
  - crc
  - checksum
  - protocol
level: beginner
status: review
---

# CRC 模型参数与标准检查值

## 本文解决什么问题

“CRC-16”不足以唯一确定算法。两个实现即使都使用 16 bit 结果，也可能因多项式、初值、位处理方向或最终异或不同而得到完全不同的值。本文用参数模型把这些差异逐项固定下来。

## 阅读前需要知道什么

- [位运算、位掩码与寄存器字段](./bitwise-mask-register-field)中的异或和移位。
- [HEX 文本与原始二进制数据](./hex-text-binary-data)中的原始 byte 与 HEX 文本区别。

## CRC 能做什么

循环冗余校验把输入 bit 序列视为 GF(2) 上的多项式，并对生成多项式做除法，保留固定宽度余数。GF(2) 中加减法都等价于 XOR，没有进位和借位。

CRC 擅长发现通信或存储中的常见突发错误，但它不是密码学哈希：攻击者可以有目的地同时修改数据和 CRC。CRC 也不能仅凭校验值恢复原始数据。

## 六个核心参数

| 参数 | 含义 | 常见误区 |
| --- | --- | --- |
| Width | CRC 寄存器和结果宽度 | 只写 CRC-16 就以为已唯一确定 |
| Poly | 生成多项式省略最高次 `1` 后的表示 | 混用普通值和反射值 |
| Init | 第一个 byte 进入前的寄存器值 | 默认总是 0 |
| RefIn | 输入 byte 的 bit 处理方向 | 与 byte 顺序或 CPU 大小端混淆 |
| RefOut | 输出相对普通方向是否反射 | 认为必然等于 RefIn |
| XorOut | 返回前与寄存器异或的值 | 忘记最后一步 |

例如 Width=16、Poly=`0x8005` 表示多项式：

```text
x^16 + x^15 + x^2 + 1
```

最高次 `x^16` 的系数必然为 1，所以参数只保存剩余 16 bit。某些右移实现会使用反射后的 `0xA001`；两者是同一多项式的不同实现表示，不能同时把 `Poly=0xA001` 和 `RefIn=true` 套入只接受普通 Poly 的模型。

## RefIn 与 RefOut

非反射实现通常把输入 byte 放到寄存器高端，检查最高 bit 后左移。反射输入实现通常从最低 bit 方向处理，检查最低 bit 后右移，并使用反射多项式。

这里的“反射”针对 bit 编号与计算方向，不是把整段报文 byte 倒序，也不是 CPU 的小端字节序。报文 `31 32 33` 仍按原顺序进入 CRC。

`RefOut` 描述最终余数相对普通方向是否反射。高质量实现应允许它与 `RefIn` 独立，即使许多常见模型中二者相同。

## Check 是参数指纹

模型目录通常提供 `Check`：对 9 个 ASCII byte `31 32 33 34 35 36 37 38 39`，也就是文本 `123456789` 计算得到的结果。

| 模型 | 参数摘要 | Check |
| --- | --- | --- |
| CRC-8/SMBUS | `width=8 poly=07 init=00 refin=false refout=false xorout=00` | `F4` |
| CRC-16/ARC | `width=16 poly=8005 init=0000 refin=true refout=true xorout=0000` | `BB3D` |
| CRC-16/MODBUS | `width=16 poly=8005 init=FFFF refin=true refout=true xorout=0000` | `4B37` |
| CRC-32/ISO-HDLC | `width=32 poly=04C11DB7 init=FFFFFFFF refin=true refout=true xorout=FFFFFFFF` | `CBF43926` |

Check 不证明所有输入都正确，但能快速发现参数、bit 方向和最终处理是否一致。实现新模型时，第一项测试就应固定这个向量。

## 为什么相同参数仍可能不同

依次检查：

1. 输入的是原始 byte 还是 HEX 文本字符。
2. CRC 覆盖范围是否包含帧头、长度、已有 CRC 字段。
3. Poly 是否使用了模型要求的普通或反射表示。
4. Init、RefIn、RefOut、XorOut 是否完整。
5. 输出 byte 的传输字节序是否另有规定。
6. 增量计算 API 是否把前一段“最终 CRC”误当成内部寄存器。

CRC 数值的计算方向和 CRC 字段在报文中的两个 byte 顺序仍是两个问题。例如得到 `0x4B37` 后，协议可能发送 `37 4B`，但 Check 仍写作 `4B37`。

## 逐 bit 算法骨架

非反射 8 bit CRC 的教学骨架如下：

```c
uint8_t crc8(const uint8_t *data, size_t length)
{
    uint8_t crc = 0x00;

    while (length-- > 0U) {
        crc ^= *data++;
        for (unsigned bit = 0; bit < 8U; ++bit) {
            /* 0x07 是省略 x^8 后的生成多项式。 */
            crc = (crc & 0x80U) != 0U
                ? (uint8_t)((crc << 1U) ^ 0x07U)
                : (uint8_t)(crc << 1U);
        }
    }

    return crc;
}
```

逐 bit 实现易于审阅和验证；查表实现速度更高，但应先用同一检查向量证明等价。

## 常见错误与排查

| 现象 | 常见原因 | 检查方法 |
| --- | --- | --- |
| 所有结果都不对 | 选错模型或 Poly 表示 | 先计算 `123456789` Check |
| 只有多 byte 数据不对 | bit/byte 顺序或覆盖范围错误 | 用 1 byte、2 byte 梯度向量定位 |
| 数值正确但线上两个 byte 反了 | CRC 字段传输字节序不同 | 区分“计算结果”和“序列化结果” |
| 分段计算与一次计算不同 | 错把 XorOut 后的值当内部状态 | 使用明确的增量 API 状态 |
| 硬件 CRC 与软件不同 | 硬件固定字宽、反射或进料方式 | 阅读外设手册并逐 byte 比较 |

## 关联工具与延伸阅读

- 使用 [CRC 计算器](/tools/crc-calculator)载入预设、修改单个参数并观察结果。
- 回顾[字节序与多字节整数](./endianness-multibyte-integer)，避免把输出字段顺序和 CRC 反射混淆。
- 下一篇协议基础：[UART 帧格式、波特率与实际传输位数](../protocols/uart-frame-basics)。

## 自测

1. 为什么“CRC-16”不能唯一确定算法？
2. CRC-16/MODBUS 的 `Poly=0x8005` 与右移代码常见的 `0xA001`是什么关系？
3. Check 匹配后，实际帧 CRC 仍不匹配，应继续检查什么？

<details>
<summary>查看答案</summary>

1. 还缺 Poly、Init、RefIn、RefOut、XorOut 等参数。
2. 后者是前者在 16 bit 内的反射表示；参数模型和实现必须约定使用哪一种。
3. 检查原始输入 byte、覆盖范围、分段状态和结果在帧中的 byte 顺序。

</details>

## 参考资料

- [Ross N. Williams：A Painless Guide to CRC Error Detection Algorithms](https://zlib.net/crc_v3.txt)，参数化模型与参考实现原始资料。
- [AUTOSAR Specification of CRC Routines R22-11](https://www.autosar.org/fileadmin/standards/R22-11/CP/AUTOSAR_SWS_CRCLibrary.pdf)，常用 CRC 参数与 `123456789` 检查值。
- [CRC RevEng 参数目录](https://reveng.sourceforge.io/crc-catalogue/)，模型别名、参数和来源索引；使用时应继续核对其列出的原始规范。

## 审阅记录

- 内容状态：等待独立同行审阅（review）。
- 已核对：四个模型检查值、反射多项式关系和逐 bit 示例。
- 待验证：独立嵌入式工程师复核硬件 CRC 与增量 API 排查建议。

---
title: 字节序与多字节整数
description: 从数值、字节序列和地址顺序三个层次解释大端与小端，并给出可移植的序列化方法。
category: foundations
tags:
  - endianness
  - bytes
  - serialization
  - protocol
level: beginner
status: review
---

# 字节序与多字节整数

## 本文解决什么问题

同一个 32 位数值 `0x12345678` 在内存、协议帧和日志中可能出现 `12 34 56 78` 或 `78 56 34 12`。本文区分数值本身、对象表示和传输顺序，并给出不依赖 CPU 字节序的编码方式。

## 阅读前需要知道什么

- [HEX 文本与原始二进制数据](./hex-text-binary-data)中，HEX 只是显示字节的方式。
- [C 定宽整数、整数提升与溢出边界](../c-language/c-fixed-width-integers)中，`uint32_t` 在提供时恰好为 32 bit。

## 数值没有字节序

抽象整数 `305419896` 可以写作十六进制 `0x12345678`。这只是一个数值；只有把它存成多个 byte，才需要决定各 byte 的顺序。

先拆出四个 byte：

```text
最高有效 byte                           最低有效 byte
    0x12          0x34          0x56          0x78
```

- 大端序（big-endian）：最高有效 byte 放在最低地址或最先传输。
- 小端序（little-endian）：最低有效 byte 放在最低地址；协议若采用小端，通常也先传输它。

```text
地址偏移        +0    +1    +2    +3
大端内存        12    34    56    78
小端内存        78    56    34    12
```

字节序不改变数值的数学意义，只改变对象表示或序列化结果。

## 字节序、位序与显示方向

三个概念必须分开：

1. **字节序**：多字节字段中 byte 的排列。
2. **位发送顺序**：一个 byte 在线路上先发最高位还是最低位，由具体协议规定。
3. **HEX 显示方向**：人类通常从最高有效数字向最低有效数字书写数值。

例如某协议把 16 位字段以小端 byte 顺序发送为 `34 12`，并不意味着 `0x34` 在物理线上一定先发送 bit 0；那由 UART、SPI 等链路层规则另行决定。

## 网络字节序

互联网协议传统上把网络字节序定义为大端。主机 API 中的 `htons`、`htonl`、`ntohs` 和 `ntohl` 用于在主机表示和网络表示之间转换。

但“通信协议都用大端”是错误的。Modbus 寄存器、CAN 信号、USB 字段和厂商私有协议可能采用不同约定，甚至在更大的复合字段里混合“寄存器顺序”和“寄存器内部字节序”。必须阅读对应规范，而不能从 CPU 类型猜测。

## 用移位显式解码

以下函数从大端 byte 序列读取无符号 32 位整数：

```c
#include <stdint.h>

uint32_t read_u32_be(const uint8_t bytes[4])
{
    /*
     * 每个 byte 先转换为 uint32_t，再移到目标位置。显式转换避免
     * uint8_t 经整数提升为有符号 int 后参与移位时产生平台边界问题。
     * 该写法只依赖数值运算，不读取未对齐的 uint32_t，也不依赖 CPU 字节序。
     */
    return ((uint32_t)bytes[0] << 24)
         | ((uint32_t)bytes[1] << 16)
         | ((uint32_t)bytes[2] << 8)
         |  (uint32_t)bytes[3];
}
```

小端版本把 `bytes[0]` 放在最低 8 bit：

```c
uint32_t read_u32_le(const uint8_t bytes[4])
{
    return  (uint32_t)bytes[0]
         | ((uint32_t)bytes[1] << 8)
         | ((uint32_t)bytes[2] << 16)
         | ((uint32_t)bytes[3] << 24);
}
```

这种实现比把 `uint8_t *` 强制转换为 `uint32_t *` 更可移植。后者还可能同时违反对齐要求、有效类型或别名规则。

## 用 `memcpy` 查看对象表示

如果目标是检查本机对象表示，可以把字节复制出来：

```c
#include <stdint.h>
#include <string.h>

uint32_t value = UINT32_C(0x12345678);
uint8_t bytes[sizeof value];
memcpy(bytes, &value, sizeof bytes);
```

`memcpy` 避免未对齐访问和类型别名问题，但得到的是**本机表示**，不是指定协议格式。发送前仍需按协议明确序列化。

## 位域和结构体不能替代协议编码

C 结构体可能包含填充，位域的分配顺序和对齐具有实现定义部分。把结构体内存直接发送会把 ABI、编译器设置、CPU 字节序和填充字节一起变成协议的一部分。

工程建议是：

- 协议字段使用定宽整数表达数值范围。
- 用移位、掩码或经过验证的序列化函数逐字段编码。
- 对线上 byte 序列写黄金向量测试。
- 不用 `packed` 结构体掩盖未对齐访问与可移植性问题。

## 常见错误与排查

| 现象 | 常见原因 | 检查方法 |
| --- | --- | --- |
| `0x1234` 被解析成 `0x3412` | 编解码采用相反字节序 | 把字段拆成 `12 34` 两个 byte 核对规范 |
| x86 正常、另一 MCU 异常 | 直接发送了本机整数内存 | 改为显式序列化并测试字节向量 |
| 读取协议缓冲区触发总线错误 | 强转指针导致未对齐访问 | 使用逐 byte 组合或 `memcpy` |
| 结构体大小超过字段总和 | 编译器插入对齐填充 | 查看 `sizeof`/`offsetof`，不要直接上线路 |
| 把 `12` 显示成 `21` | 混淆字节序与半字节/位序 | 先确定字段边界，再逐 byte 标注 |

## 示例推导

收到小端字节 `78 56 34 12`，组合规则为：

```text
value = 0x78
      | 0x56 << 8
      | 0x34 << 16
      | 0x12 << 24
      = 0x12345678
```

这里的移位以 bit 为单位；每移动一个 byte 就是 8 bit。

## 关联工具与延伸阅读

- 用[大小端与字节交换转换器](/tools/endianness-converter)直接比较同一 byte 序列的两种解释，或生成固定宽度协议字段。
- 用[进制与位运算转换器](/tools/base-bit-converter)检查移位与掩码结果。
- 用 [HEX、ASCII 与字符串转换器](/tools/hex-text-converter)规范化输入字节；它不会替你猜字段字节序。
- 下一组内容：[CRC 模型参数与标准检查值](./crc-model-parameters)。

## 自测

1. `0x01020304` 在小端内存的最低地址 byte 是什么？
2. 为什么 `*(uint32_t *)&buffer[1]` 不是通用的协议解码写法？
3. 大端字段的“先发 `0x12`”能否推出这个 byte 内一定先发 bit 7？

<details>
<summary>查看答案</summary>

1. `0x04`。
2. 它可能未对齐、依赖 CPU 字节序，并涉及类型别名/有效类型规则；显式逐 byte 组合更可靠。
3. 不能。字节序只规定 byte 之间的顺序，一个 byte 内的线路位序由具体总线协议规定。

</details>

## 参考资料

- [ISO/IEC 9899:2024 draft N3096](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3096.pdf)，对象表示、字符类型访问与 `memcpy` 相关语义。
- [RFC 1700：Assigned Numbers](https://www.rfc-editor.org/rfc/rfc1700)，互联网协议中的网络字节序约定。
- [The Unicode Standard 17.0，Chapter 2](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-2/)，UTF-8 的 8 位编码单元与 UTF-16/32 字节序区别。

## 审阅记录

- 内容状态：等待独立同行审阅（review）。
- 已核对：大小端示例、移位组合结果、C 访问风险和网络字节序定义。
- 待验证：由独立嵌入式工程师复核实际 MCU 未对齐访问故障表述。

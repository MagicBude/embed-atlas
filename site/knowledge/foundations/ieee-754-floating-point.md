---
title: IEEE 754 单精度与双精度浮点数表示
description: 从符号位、阶码和小数部分推导 binary32 与 binary64，并解释次正规数、无穷、NaN、负零和精度边界。
category: foundations
tags:
  - ieee-754
  - floating-point
  - binary32
  - binary64
  - precision
level: intermediate
status: review
---

# IEEE 754 单精度与双精度浮点数表示

## 本文解决什么问题

为什么十进制 `0.1` 往往不能被二进制浮点数精确保存？`float` 的 32 个 bit 怎样得到 `1.0`、`-2.5`、无穷和 NaN？为什么 `16777216.0f + 1.0f` 可能仍是 `16777216.0f`？

本文从 IEEE 754 的 binary32 和 binary64 交换格式出发，把“一个浮点数”拆成可手算、可在调试器中核对的位字段。浮点运算的舍入环境、异常标志和编译器优化是更大的主题，本文只建立表示模型与最常见的工程边界。

## 阅读前需要知道什么

- [整数、进制与位模式](./integer-radix-bit-pattern)：同一组 bit 可以按不同规则解释。
- [位运算、位掩码与寄存器字段](./bitwise-mask-register-field)：会提取固定位宽字段。
- [字节序与多字节整数](./endianness-multibyte-integer)：数值位模式与内存 byte 顺序不是一回事。

## binary32 与 binary64 的字段

IEEE 754 的两种常见二进制交换格式如下：

| 格式 | 总宽度 | 符号位 | 阶码字段 | 小数部分 | 正常数精度 |
| --- | ---: | ---: | ---: | ---: | ---: |
| binary32（常称单精度） | 32 bit | 1 bit | 8 bit | 23 bit | 24 个二进制有效位 |
| binary64（常称双精度） | 64 bit | 1 bit | 11 bit | 52 bit | 53 个二进制有效位 |

binary32 的位布局：

```text
bit 31        bit 30                      bit 23 bit 22                     bit 0
┌──────┬────────────────────────────────────────┬──────────────────────────────┐
│ sign │          exponent（8 bit）              │       fraction（23 bit）      │
└──────┴────────────────────────────────────────┴──────────────────────────────┘
```

- `sign` 为 `0` 表示正号，为 `1` 表示负号。
- `exponent` 保存经过偏置（bias）的阶码；binary32 偏置为 127，binary64 为 1023。
- `fraction` 保存有效数的小数部分。正常数最高位固定为 `1`，因此通常不需要存入字段，这一位常称隐藏位或隐含前导 `1`。

“小数部分 23 bit”并不意味着 binary32 只有 23 bit 精度；正常数还包含隐含前导 `1`，所以有效精度是 24 bit。

## 正常数怎样计算

当阶码字段既不全为 `0`，也不全为 `1` 时，它表示正常数（normal number）：

```text
value = (-1)^sign × (1 + fraction / 2^fractionBits) × 2^(exponent - bias)
```

以 binary32 位模式 `0x3FC00000` 为例：

```text
sign     = 0
exponent = 0x7F = 127
fraction = 0x400000

value = (+1) × (1 + 0x400000 / 2^23) × 2^(127 - 127)
      = 1 × (1 + 0.5) × 1
      = 1.5
```

几个常用检查值：

| binary32 位模式 | 数值 | 关键字段 |
| --- | ---: | --- |
| `0x3F800000` | `1.0` | sign=0，exponent=127，fraction=0 |
| `0xBF800000` | `-1.0` | 只把 sign 置 1 |
| `0xC0200000` | `-2.5` | 有效数 `1.25`，实际阶码 1 |
| `0x3DCCCCCD` | 最接近 `0.1` 的常用 binary32 值 | 十进制 `0.1` 不能有限表示 |

## 为什么 `0.1` 不能精确表示

十进制有限小数能否在二进制中有限结束，取决于约分后分母是否只有因子 2。`0.5 = 1/2` 可以写成二进制 `0.1₂`，但：

```text
0.1₁₀ = 1/10 = 1/(2 × 5)
```

分母含有因子 5，所以它的二进制展开无限循环。binary32 或 binary64 只能保存有限个有效 bit，必须舍入到邻近的可表示数。因此浮点误差不是“CPU 算错了”，而是有限格式对无限展开的必然近似。

工程上不要用 `a == b` 判断经过多步计算的测量值是否“足够接近”。容差必须结合量纲、传感器误差、算法累计误差和数值大小设计；随手写一个固定 `0.000001` 也不具有普适性。

## 阶码全零：零与次正规数

当阶码字段全为 `0` 时，不再使用隐含前导 `1`：

```text
value = (-1)^sign × (fraction / 2^fractionBits) × 2^(1 - bias)
```

- fraction 也全为 `0`：表示正零或负零。
- fraction 不为 `0`：表示次正规数（subnormal number，也称 denormal）。

次正规数填补了最小正常数与零之间的间隔，使结果可以逐渐下溢（gradual underflow），但有效精度会随着数值接近零而降低。一些 MCU、FPU 配置或编译选项可能采用 flush-to-zero，把次正规输入或结果当作零处理；这属于运行环境行为，不能只从源代码类型判断。

正零和负零比较时通常相等，但符号仍保留在位模式中，某些运算可以区分它们。例如在遵循相应 IEEE 754 运算语义的环境里，`1 / +0` 与 `1 / -0` 的无穷符号不同。

## 阶码全一：无穷与 NaN

当阶码字段全为 `1` 时：

| fraction | 分类 | binary32 示例 |
| --- | --- | --- |
| 全零 | 正无穷或负无穷 | `0x7F800000`、`0xFF800000` |
| 非零 | NaN（Not a Number） | `0x7FC00000` 是常见 quiet NaN 编码之一 |

NaN 不是一个普通的“特殊数值”。同一格式可以存在多个 NaN 位模式，fraction 的部分 bit 可以作为 payload。不同处理器、语言运行时和操作可能规范化 NaN，因此不要把 payload 当作跨平台可靠的业务数据通道。

NaN 与有序比较的关系也容易造成控制流错误：检查 `value < limit` 为假，并不能推出 `value >= limit`，因为 `value` 可能是 NaN。处理外部传感器或协议浮点字段时，应明确检查有限性与 NaN，而不是只做范围比较。

## 精度不是固定“小数位数”

二进制浮点数保存固定数量的**有效 bit**，相邻可表示数的距离随阶码变化。binary32 有 24 bit 正常数精度，因此：

- 从 `0` 到 `2^24 = 16777216` 的整数都可以精确表示。
- 在 `2^24` 附近，相邻 binary32 数的间隔变为 2。
- `16777217` 夹在两个可表示值之间，转换到 binary32 时需要舍入。

数值越大，绝对间隔通常越大；数值越接近零，绝对间隔越小。这就是为什么“float 大约 7 位十进制有效数字”只是便于记忆的量级描述，不表示小数点后永远有 7 位可靠数字。

## 字节序与浮点位布局必须分开

位模式 `0x3F800000` 表示 binary32 的 `1.0`，但它在内存中的 byte 顺序仍由存储约定决定：

```text
大端 byte：3F 80 00 00
小端 byte：00 00 80 3F
```

字节序改变 byte 的排列，不会把 sign、exponent 和 fraction 的字段定义倒过来。解析协议时应先按照协议字节序还原 32/64 bit 位模式，再按 IEEE 754 字段解释；不能直接把日志中第一个 byte 当作符号位所在 byte。

## 在 C 中安全查看位模式

如果实现的 `float` 确实采用 binary32，可以用 `memcpy` 复制对象表示，而不是通过不兼容指针强制转换：

```c
#include <stdint.h>
#include <string.h>

uint32_t float_bits(float value)
{
    uint32_t bits;
    _Static_assert(sizeof value == sizeof bits, "requires 32-bit float");

    /*
     * memcpy 复制对象表示，不通过 uint32_t * 解引用 float 对象，因此避免
     * 类型别名问题。尺寸相同仍不能单独证明 float 是 IEEE 754 binary32；
     * 工程代码还应核对实现文档及 <float.h> 的基数、精度和阶码参数。
     */
    memcpy(&bits, &value, sizeof bits);
    return bits;
}
```

C 标准允许实现提供不同浮点格式；`sizeof(float) == 4` 也不能单独证明其所有值与运算符合 IEEE 754 binary32。跨 MCU 传输时，协议应明确规定格式与 byte 顺序，并使用黄金 byte 向量测试。

## 常见错误与排查

| 现象 | 常见原因 | 排查方向 |
| --- | --- | --- |
| `0.1 + 0.2` 与预期十进制不完全相等 | 两个输入和结果都经过二进制舍入 | 查看实际位模式，采用有依据的容差 |
| 大数加 `1` 没变化 | 相邻浮点数间隔已经大于 1 | 检查有效精度和当前阶码 |
| 抓包浮点数完全异常 | byte 顺序与协议不一致 | 先还原 32/64 bit 位模式，再解析字段 |
| 极小结果突然变成零 | 下溢或 flush-to-zero | 检查 FPU 状态、编译选项和次正规支持 |
| 范围判断全部落入意外分支 | 输入是 NaN | 先检查 `isfinite`/`isnan` 或平台等价接口 |
| 用指针强转读取位模式出现优化差异 | 违反别名或对齐要求 | 使用 `memcpy` 或语言提供的 bit-cast 接口 |

## 关联工具与后续内容

- [大小端与字节交换转换器](/tools/endianness-converter)：先还原协议字段的 byte 顺序。
- [进制与位运算转换器](/tools/base-bit-converter)：手工提取 sign、exponent 和 fraction。
- 下一步将提供 IEEE 754 浮点数解析器，在十进制、位模式和字段之间双向检查。

## 自测

1. binary32 的 fraction 字段只有 23 bit，为什么正常数精度是 24 bit？
2. 阶码全零且 fraction 非零表示什么？它是否使用隐含前导 `1`？
3. 为什么 binary32 位模式 `0x3F800000` 在小端内存中常显示为 `00 00 80 3F`？
4. `sizeof(float) == 4` 能否单独证明它是 IEEE 754 binary32？

<details>
<summary>查看答案</summary>

1. 正常数有效数最高位固定为 `1`，这一个 bit 隐含而不存入 fraction。
2. 表示次正规数；它不使用隐含前导 `1`，有效数从 `0.fraction` 开始。
3. 位模式字段定义没有改变，小端只把最低有效 byte `00` 放在最低地址。
4. 不能。尺寸只说明存储宽度，还要核对实现的基数、精度、阶码范围和格式承诺。

</details>

## 参考资料

- [ISO/IEC 9899:2023 draft N3096](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3096.pdf)，5.2.4.2.2、Annex F 与 Annex H 的浮点模型和 IEC 60559 绑定。
- [Oracle Numerical Computation Guide：Data Representations](https://docs.oracle.com/cd/E19957-01/806-3594/C_datarep.html)，单精度、双精度、无穷和 NaN 的字段说明。
- [Java Language Specification：Types, Values, and Variables](https://docs.oracle.com/javase/specs/jls/se6/html/typesValues.html)，NaN、正负零与 binary32/binary64 值集合的语言级示例。

## 审阅记录

- 内容状态：等待独立同行审阅（review）。
- 已核对：binary32/binary64 字段宽度、偏置、正常/次正规公式、特殊值和示例位模式。
- 待验证：由独立嵌入式工程师复核不同 MCU 的次正规数与 flush-to-zero 工程表述。

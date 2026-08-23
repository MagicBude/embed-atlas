---
title: 字节、字符、编码与字符串
description: 区分字符、Unicode 码点、编码单元、UTF-8 字节和 C 字符串终止符，避免把字符数量与存储字节数混为一谈。
category: foundations
tags:
  - bytes
  - unicode
  - utf-8
  - string
level: beginner
status: review
---

# 字节、字符、编码与字符串

## 本文解决什么问题

串口收到 `E4 B8 AD` 时，为什么它可能只表示一个“中”字？JavaScript 中 `"😀".length` 为什么是 `2`，而 UTF-8 却占 `4 byte`？C 字符串里的 `\0` 又是不是普通数据？

这些问题都来自同一个误区：把“人看到的字符”“程序里的编码单元”和“存储或传输的字节”当成同一层概念。本文建立一套可以用于日志、协议、文件和固件接口的术语。

## 阅读前需要知道什么

- 一个 byte 通常包含 8 bit。
- 十六进制只是数值的书写方式；`0x41` 表示一个数值，不自动带有字符含义。
- 可以先阅读[整数、进制与位模式](./integer-radix-bit-pattern)。

## 从字符到线路字节

文本变成可存储或传输的数据，至少经历以下层次：

```text
抽象字符 “中”
    ↓ Unicode 分配
码点 U+4E2D
    ↓ 选择 UTF-8 编码
编码单元 / 字节 E4 B8 AD
    ↓ HEX 文本显示
字符序列 "E4 B8 AD"
```

四层不能互换：

| 层次 | 含义 | “中”的例子 |
| --- | --- | --- |
| 字符（character） | 文本系统中的抽象元素 | 中 |
| 码点（code point） | Unicode 码空间中的编号 | `U+4E2D` |
| 编码单元（code unit） | 某种编码格式使用的最小单元 | UTF-8 的 `E4`、`B8`、`AD` |
| 字节（byte） | 存储和传输单位 | `0xE4 0xB8 0xAD` |

Unicode 还区分“码点”和用户感知的字形。例如 `e` 加组合重音可以由多个码点组成，但用户可能把它看成一个字符。统计界面光标位置时，不能只数 byte 或码点。

## ASCII 与 UTF-8

ASCII 定义了 `0x00`～`0x7F` 的 128 个值，包括英文字母、数字、标点和控制字符。UTF-8 对这一区间保持兼容：ASCII 字符在 UTF-8 中仍然只占一个相同值的 byte。

UTF-8 是变长编码，一个 Unicode 标量值使用 1～4 byte：

| 文本 | 码点 | UTF-8 字节 | byte 数 |
| --- | --- | --- | ---: |
| `A` | `U+0041` | `41` | 1 |
| `é` | `U+00E9` | `C3 A9` | 2 |
| `中` | `U+4E2D` | `E4 B8 AD` | 3 |
| `😀` | `U+1F600` | `F0 9F 98 80` | 4 |

因此，“字符串长度是 10”必须继续追问：10 个什么？可能是 10 byte、10 个码点、10 个 UTF-16 编码单元，或 10 个用户感知字符。

## UTF-8 怎样携带一个码点

以 `中`（`U+4E2D`）为例，它属于三字节范围。三字节模板是：

```text
1110xxxx 10xxxxxx 10xxxxxx
```

把码点的有效位从右向左填入 `x`，得到：

```text
11100100 10111000 10101101
   E4       B8       AD
```

前缀既告诉解码器序列长度，也让后续字节与首字节可区分。`C0 AF` 等非最短形式不是合法 UTF-8；严格解码器应当报告错误，不应假装它表示某个字符。

## C 字符串不是任意字节数组

C 语言的字符串是一段以空字符（null character）终止的字符序列，终止字节值为 `0`，通常写成 `\0`。例如：

```c
/* UTF-8 源文件中，数组通常包含 E4 B8 AD 00；具体执行字符集由实现决定。 */
const char text[] = "中";
```

如果执行字符集为 UTF-8，`sizeof text` 为 `4`，而 `strlen(text)` 为 `3`：前者包含结尾的 `0x00`，后者返回终止符之前的 byte 数。两者都不等于“字符数”。

二进制协议载荷可以合法包含 `0x00`，所以不能用 `strlen` 推断其长度：

```c
const uint8_t payload[] = {0x41, 0x00, 0x42};
const size_t payload_len = sizeof payload; /* 3 byte，而不是 1。 */
```

工程接口应把缓冲区指针和明确的 byte 长度一起传递。

## JavaScript 的 `length` 为什么也会误导

JavaScript 字符串使用 UTF-16 编码单元。基本多文种平面之外的码点用一对代理项表示：

```js
"A".length   // 1
"中".length  // 1
"😀".length  // 2：两个 UTF-16 code unit
```

`TextEncoder` 把字符串编码为 UTF-8 后，`new TextEncoder().encode("😀").length` 才得到传输所需的 `4 byte`。这也是本站转换器在计算串口或文件长度时采用的语义。

## 常见错误与排查

| 现象 | 常见原因 | 检查方法 |
| --- | --- | --- |
| 中文显示成乱码 | 发送端和接收端编码不同 | 同时记录原始 HEX 与双方声明的编码 |
| 缓冲区只为中文字符数分配同样多 byte | 把字符数当成 UTF-8 byte 数 | 先编码，再按实际 byte 长度分配 |
| 二进制数据在第一个 `00` 处截断 | 把字节数组交给 C 字符串函数 | 传递显式长度，使用二进制安全 API |
| 解码结果出现 `�` | 解码器用替换字符掩盖了非法序列 | 调试协议时启用严格解码并保留原始字节 |
| `"😀".length` 得到 2 | 统计的是 UTF-16 编码单元 | 根据目标分别统计 byte、码点或字素簇 |

## 工程检查清单

- 接口文档明确写出编码名称，而不是只写“字符串”。
- 长度字段明确单位是 byte、code unit 还是字符。
- 原始协议数据使用“缓冲区 + byte 长度”，不依赖 `NUL`。
- 调试日志同时保留原始 HEX，避免乱码后丢失证据。
- 处理外部输入时拒绝或明确替换非法编码序列。

## 关联工具与延伸阅读

- 使用 [HEX、ASCII 与字符串转换器](/tools/hex-text-converter)观察文本实际编码后的字节。
- 下一篇：[HEX 文本与原始二进制数据](./hex-text-binary-data)。
- 进一步阅读：[字节序与多字节整数](./endianness-multibyte-integer)。

## 自测

1. `A中` 按 UTF-8 编码占多少 byte？
2. 为什么 `41 00 42` 不能直接交给 `strlen` 计算完整长度？
3. `"E4 B8 AD"` 这 8 个可见字符与三个原始字节是什么关系？

<details>
<summary>查看答案</summary>

1. `A` 为 1 byte，`中` 为 3 byte，共 4 byte。
2. `strlen` 在第一个 `0x00` 停止，只会返回 1；二进制数据必须携带显式长度。
3. 前者是用于显示 HEX 的文本，若按 ASCII/UTF-8 保存需要 8 byte；解析它才能得到 `E4 B8 AD` 三个 byte，再按 UTF-8 解码为“中”。

</details>

## 参考资料

- [The Unicode Standard 17.0，Chapter 2：General Structure](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-2/)，码点、编码单元与 UTF-8 的定义。
- [The Unicode Standard 17.0，Chapter 3：Conformance](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-3/)，良构编码序列与错误处理要求。
- [RFC 3629：UTF-8, a transformation format of ISO 10646](https://www.rfc-editor.org/rfc/rfc3629)，UTF-8 字节序列定义。
- [ISO/IEC 9899:2024 draft N3096](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3096.pdf)，C 字符串、数组与库函数语义参考。

## 审阅记录

- 内容状态：等待独立同行审阅（review）。
- 已核对：Unicode 术语、UTF-8 示例、非法序列、C `NUL` 与长度示例。
- 待验证：由独立嵌入式工程师复核不同编译器执行字符集示例的表达。

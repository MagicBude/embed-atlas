---
title: 学习路线
description: 按前置关系和实践目标组织嵌入式学习内容。
---

# 学习路线

学习路线解决“应该先学什么、后学什么”的问题。它不会复制知识文章，而是说明每个阶段的目标、前置知识、推荐文章、配套工具和实践任务。

## 第一批路线

| 路线 | 适合谁 | 状态 |
| --- | --- | --- |
| [嵌入式入门基础](#嵌入式入门基础) | 准备开始学习 C、数字表示和 MCU 的读者 | 首批可学习 |
| MCU 与常用外设 | 已掌握 C 基础，希望理解 GPIO、中断、定时器和 ADC 的读者 | 规划中 |
| [通信协议基础](#通信协议基础) | 需要学习 UART、I2C、SPI 和 CAN 的读者 | UART、I²C 基础可学习 |
| FreeRTOS 基础 | 已有裸机开发经验，希望进入实时系统的读者 | 规划中 |
| 嵌入式调试基础 | 希望建立系统化排错方法的读者 | 规划中 |

## 嵌入式入门基础

1. [整数、进制与位模式](/knowledge/foundations/integer-radix-bit-pattern)：分清数值、写法和固定位宽。
2. [二进制补码与有符号整数范围](/knowledge/foundations/twos-complement-signed-range)：理解负数和溢出边界。
3. [位运算、位掩码与寄存器字段](/knowledge/foundations/bitwise-mask-register-field)：把位操作用于寄存器字段。
4. [C 定宽整数、整数提升与溢出边界](/knowledge/c-language/c-fixed-width-integers)：连接 C 表达式规则。
5. [字节、字符、编码与字符串](/knowledge/foundations/bytes-characters-encoding)：进入真实数据缓冲区。
6. [HEX 文本与原始二进制数据](/knowledge/foundations/hex-text-binary-data)：学会读日志和抓包。
7. [字节序与多字节整数](/knowledge/foundations/endianness-multibyte-integer)：可靠地序列化协议字段。
8. [IEEE 754 单精度与双精度浮点数表示](/knowledge/foundations/ieee-754-floating-point)：理解传感器和协议中的浮点位模式、特殊值与精度边界。

每一步都可使用对应的[在线工具箱](/tools/)手算并交叉验证。

## 通信协议基础

1. 先完成上方入门路线中的字节、HEX 和字节序三篇。
2. [UART 帧格式、波特率与实际传输位数](/knowledge/protocols/uart-frame-basics)：从异步帧和传输时间入门。
3. [I²C 7 位地址与读写位](/knowledge/protocols/i2c-address-read-write)：理解地址阶段与组合事务。
4. [CRC 模型参数与标准检查值](/knowledge/foundations/crc-model-parameters)：为带消息校验的上层协议建立模型。

SPI、CAN 与更完整的协议实践将在后续阶段接入，不用空页面占位。

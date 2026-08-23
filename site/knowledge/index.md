---
title: 知识库
description: 从通用原理到具体平台的中文嵌入式知识体系。
---

# 知识库

知识库优先讲清可以跨芯片、跨平台迁移的原理，再补充 STM32、ESP32、RISC-V 和其他平台的具体差异。

## 已发布内容

### 基础知识

| 文章 | 难度 | 状态 | 关联工具 |
| --- | --- | --- | --- |
| [整数、进制与位模式](./foundations/integer-radix-bit-pattern) | 入门 | 待同行审阅 | [进制与位运算转换器](/tools/base-bit-converter) |
| [二进制补码与有符号整数范围](./foundations/twos-complement-signed-range) | 入门 | 待同行审阅 | [进制与位运算转换器](/tools/base-bit-converter) |
| [位运算、位掩码与寄存器字段](./foundations/bitwise-mask-register-field) | 入门 | 待同行审阅 | [进制与位运算转换器](/tools/base-bit-converter) |

### C 语言

| 文章 | 难度 | 状态 | 关联工具 |
| --- | --- | --- | --- |
| [C 定宽整数、整数提升与溢出边界](./c-language/c-fixed-width-integers) | 进阶 | 待同行审阅 | [进制与位运算转换器](/tools/base-bit-converter) |

## 规划分类

| 分类 | 主要内容 | 首版状态 |
| --- | --- | --- |
| 基础知识 | 数制、位运算、计算机组成和电子基础 | 首批建设 |
| C 语言 | 指针、内存、结构体、`volatile` 和位操作 | 首批建设 |
| MCU 与体系结构 | Cortex-M、存储器、启动流程和中断 | 后续扩展 |
| 常用外设 | GPIO、定时器、ADC、DMA 和看门狗 | 后续扩展 |
| 通信协议 | UART、I2C、SPI、CAN 和 Modbus | 首批建设 |
| 实时操作系统 | 任务、调度、同步、内存和中断交互 | 后续扩展 |
| 调试与排错 | 日志、调试器、HardFault 和故障清单 | 后续扩展 |
| 工程实践 | Git、代码规范、测试、静态分析和 CI | 后续扩展 |

随着正式内容增加，知识库会逐步开放分类页和学习路线，不提前展示空目录。

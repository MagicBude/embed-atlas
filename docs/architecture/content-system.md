# 知识内容系统

## 1. 目标

知识库既要适合初学者按顺序学习，也要适合工程师按关键词快速查阅。内容结构不能完全依赖某一款芯片或开发板。

## 2. 初始分类

以下为长期一级分类，第一版只创建有实际内容的部分：

| 标识 | 中文名称 | 示例内容 |
| --- | --- | --- |
| `foundations` | 基础知识 | 数制、位运算、计算机组成、电子基础 |
| `c-language` | C 语言 | 指针、内存、结构体、volatile、位域 |
| `mcu` | MCU 与体系结构 | Cortex-M、启动流程、存储器、中断 |
| `peripherals` | 常用外设 | GPIO、定时器、ADC、DMA、看门狗 |
| `protocols` | 通信协议 | UART、I2C、SPI、CAN、Modbus |
| `rtos` | 实时操作系统 | 任务、调度、同步、内存与中断交互 |
| `debugging` | 调试与排错 | HardFault、日志、调试器、故障清单 |
| `boot-firmware` | 启动与固件 | Bootloader、IAP、镜像、升级与回滚 |
| `embedded-linux` | 嵌入式 Linux | 驱动、设备树、构建系统、系统调试 |
| `engineering` | 工程实践 | Git、代码规范、测试、静态分析与 CI |

## 3. 内容层级

- `入门`：不假设读者已经了解主题，解释必要术语。
- `进阶`：假设读者具备基础，关注机制、权衡和常见实现。
- `参考`：强调准确、快速查询和完整参数，不承担完整教学路径。

文章难度和文章类型是两个不同维度，不要混用。

## 4. 文章最小元数据

正式站点初始化后，每篇文章至少提供：

```yaml
---
title: UART 帧格式与传输时间
description: 解释 UART 数据位、校验位和停止位如何影响实际传输时间。
category: protocols
tags:
  - uart
  - serial
level: beginner
status: draft
---
```

字段约束：

- `category` 使用已登记的英文标识。
- `level` 为 `beginner`、`intermediate` 或 `reference`。
- `status` 为 `draft`、`review`、`verified` 或 `deprecated`。
- 标签使用小写英文标识，显示名称由统一映射生成。

## 5. 标准文章结构

文章按需要选用以下章节：

1. 本文解决什么问题。
2. 阅读前需要知道什么。
3. 核心概念。
4. 原理或工作过程。
5. 公式、时序或数据结构。
6. 可运行示例。
7. 常见错误与排查。
8. 平台差异。
9. 关联工具和延伸阅读。
10. 参考资料。

模板见 `docs/templates/knowledge-article.md`。

## 6. 关联方式

- 文章可以关联多个工具，但必须说明工具解决哪个具体问题。
- 工具页面必须返回至少一篇原理文章。
- 学习路线只保存文章标识和顺序，不复制文章内容。
- 速查页面链接深入文章，深入文章可以链接速查表。

## 7. 质量状态

```text
draft → review → verified
   └────────────→ deprecated
```

- `draft`：结构或事实仍可能明显变化。
- `review`：内容完成，等待技术与表达审阅。
- `verified`：来源、示例和关键结论已经检查。
- `deprecated`：内容不再推荐，页面保留迁移说明。

只有 `verified` 内容才能在未来被标记为“已验证”。


---
title: 大小端与字节交换转换器
description: 把 HEX byte 序列按大端或小端解释，或把无符号整数编码为固定宽度 byte 序列。
outline: [2, 3]
---

<script setup lang="ts">
import EndiannessConverter from '../components/tools/EndiannessConverter.vue'
</script>

# 大小端与字节交换转换器

同一组 byte 在大端和小端规则下可能表示不同整数。本工具保留原始 byte 顺序，同时展示两种解释；也可以把无符号整数编码为 1、2、4 或 8 byte 的大端与小端序列。全部计算在当前浏览器完成。

<EndiannessConverter />

## 使用时先确认字段边界

字节序只对“同一个多字节字段”有意义。不要把整个协议帧一键反转：帧中的地址、长度、数据和校验可能采用不同宽度与不同规则。先按协议划分字段，再分别转换。

## 完整反转不等于所有字交换

工具的“完整反转”把第一个 byte 与最后一个互换。某些设备文档中的 `byte swap`、`word swap` 或 `ABCD/CDAB/BADC/DCBA` 可能只交换 16-bit word，或只交换 word 内部 byte；首版不会猜测这些混合格式。

## 原理与相关工具

- [字节序与多字节整数](/knowledge/foundations/endianness-multibyte-integer)
- [HEX 文本与原始二进制数据](/knowledge/foundations/hex-text-binary-data)
- [进制与位运算转换器](/tools/base-bit-converter)

核心使用 `BigInt` 保存 64 bit 精度，越界输入会报错而不是静默截断。

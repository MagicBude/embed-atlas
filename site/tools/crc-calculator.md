---
title: CRC 计算器
description: 使用完整 CRC 参数模型计算 UTF-8 文本或 HEX 字节，并核对四种常用预设的标准检查值。
outline: [2, 3]
---

<script setup lang="ts">
import CrcCalculator from '../components/tools/CrcCalculator.vue'
</script>

# CRC 计算器

CRC 名称相似不代表算法相同。选择模型预设或修改 `Width`、`Poly`、`Init`、`RefIn`、`RefOut`、`XorOut`，再输入 UTF-8 文本或原始 HEX 字节。数据只在当前浏览器计算，一次最多 4096 byte。

<CrcCalculator />

## 如何验证参数

1. 先选择模型预设。
2. 保持输入为 UTF-8 文本 `123456789`。
3. 比较即时结果与页面显示的 Check。
4. 再替换成实际报文字节；协议若写的是 HEX，切换到 HEX 输入，不能直接输入可见字符。

## 重要边界

- `Poly` 使用普通方向且省略最高次隐含 `1` 的表示，不要手工输入反射多项式。
- `RefIn` 与 `RefOut` 是两个参数；不能只写“反转 CRC”。
- 结果按 Width 补齐前导零，避免复制时丢失字段宽度。
- CRC 用于检错，不提供加密真实性，也不能修复数据。

## 原理与来源

- [CRC 模型参数与标准检查值](/knowledge/foundations/crc-model-parameters)
- [HEX 文本与原始二进制数据](/knowledge/foundations/hex-text-binary-data)

核心逻辑与 Vue 界面分离，四个预设都用公开 `123456789` 检查值自动测试。

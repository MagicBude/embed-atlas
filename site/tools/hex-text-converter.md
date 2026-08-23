---
title: HEX、ASCII 与字符串转换器
description: 在 ASCII 或 UTF-8 文本与十六进制字节之间严格转换，并查看字节数与可打印预览。
outline: [2, 3]
---

<script setup lang="ts">
import HexTextConverter from '../components/tools/HexTextConverter.vue'
</script>

# HEX、ASCII 与字符串转换器

把文本按 ASCII 或 UTF-8 编码为原始字节，也可以把 HEX 字节严格解码为文本。输入只在当前浏览器处理，不会上传；一次最多处理 4096 byte。

<HexTextConverter />

## 输入与错误规则

- HEX 支持连续形式、常用分隔符和可选 `0x` 前缀。
- 一个 byte 必须有两个十六进制数字，不自动补零。
- ASCII 只允许 `U+0000`～`U+007F`。
- UTF-8 解码采用严格模式，非法或截断序列直接报错，不用 `�` 假装成功。
- 控制字节可以转换，但可打印 ASCII 预览使用 `.` 占位。

## 怎样理解转换结果

- [字节、字符、编码与字符串](/knowledge/foundations/bytes-characters-encoding)：区分字符、码点、编码单元和 C 字符串终止符。
- [HEX 文本与原始二进制数据](/knowledge/foundations/hex-text-binary-data)：理解 `41 42` 为什么是文本表示而不是两个已经存在的字节。

## 验证状态

计算核心与 Vue 界面分离，覆盖 ASCII、中文、补充平面字符、分隔 HEX、奇数位、非法 UTF-8、ASCII 越界和未配对代理项。工具用于学习和数据检查，不自动猜测未知设备的字符编码。

# Git 提交规范

## 1. 基本格式

提交信息采用 Conventional Commits 风格：

```text
<type>(<scope>): <中文或英文简述>
```

示例：

```text
docs(uart): 添加 UART 帧格式说明
feat(base-converter): 添加进制转换核心逻辑
test(crc): 增加 CRC-16/MODBUS 检查向量
fix(hex-parser): 拒绝不完整的十六进制字节
chore(site): 初始化 VitePress 配置
```

## 2. 类型

| 类型 | 用途 |
| --- | --- |
| `feat` | 新增用户可见功能 |
| `fix` | 修复错误 |
| `docs` | 只修改文档或知识内容 |
| `test` | 新增或修改测试 |
| `refactor` | 不改变外部行为的代码重构 |
| `style` | 不影响逻辑的格式调整 |
| `perf` | 性能改进 |
| `build` | 构建系统或依赖变化 |
| `ci` | 自动化流程变化 |
| `chore` | 其他维护工作 |
| `revert` | 撤销已有提交 |

## 3. Scope

Scope 使用稳定的模块标识，例如：

```text
site
docs
architecture
base-converter
hex-converter
crc
uart
```

没有明确模块时可以省略，不为了满足格式创造无意义 scope。

## 4. 简述

- 使用祈使或直接描述，清楚说明完成了什么。
- 不在结尾加句号。
- 避免“更新内容”“修复问题”等无法判断范围的表达。
- 一次提交只有一个主要目的。

## 5. 正文与破坏性变化

需要解释原因时，在空行后增加正文：

```text
fix(crc): 统一反射输入的位处理顺序

此前实现先交换字节再反射单字节，导致非对称测试向量结果错误。
本次按 CRC 模型的 RefIn 定义逐字节处理，并加入公开检查向量。
```

存在不兼容变化时增加：

```text
BREAKING CHANGE: tool result field `value` renamed to `valueHex`.
```

## 6. 提交边界

- 不混合无关格式化和功能开发。
- 不把生成目录、缓存、编辑器配置或密钥提交进仓库。
- 提交前检查 `git diff --check` 和 `git status`。
- 未通过必要测试时不宣称提交完成。
- AI 助手只有在用户明确要求时才可以创建提交或推送。


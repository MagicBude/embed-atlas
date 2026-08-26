# 架构决策记录（ADR）

ADR 用来保存会长期影响项目的技术或产品决定，避免重要原因只存在于聊天、提交信息或某位维护者的记忆中。

## 状态

- `Proposed`：正在讨论。
- `Accepted`：已经采用。
- `Superseded`：被另一份 ADR 替代。
- `Rejected`：讨论后未采用，保留原因。

## 命名

```text
NNNN-short-title.md
```

编号只递增，不复用。新 ADR 应说明：背景、决定、理由、影响、替代方案和复审条件。

## 已有决策

- [ADR-0001：使用 VitePress、Vue 和 TypeScript 构建第一阶段网站](0001-website-foundation.md)
- [ADR-0002：中文优先并为路径式多语言预留架构](0002-internationalization-strategy.md)
- [ADR-0003：使用 GitHub Pages 发布第一阶段网站](0003-github-pages-deployment.md)

# 开始开发

## 当前说明

仓库目前处于 Phase 0，尚未初始化 Node.js 项目，因此现在没有可运行的网站命令。完成基础规划审阅后，将按照 ADR-0001 创建 VitePress、Vue 和 TypeScript 脚手架，并在本文件记录准确命令。

## 当前可以做的工作

- 审阅和修正文档。
- 使用知识文章模板起草候选内容。
- 使用工具需求模板定义输入、输出和测试向量。
- 讨论许可证、导航和第一批文章选题。

## 计划环境

正式初始化后预计需要：

- Git
- Node.js 的受支持 LTS 版本
- 项目锁定的包管理器
- 支持 EditorConfig、Vue 和 Markdown 的编辑器

版本必须在初始化时写入项目配置，不应要求贡献者猜测。

## 首次接手仓库

```powershell
git clone https://github.com/MagicBude/embed-atlas.git
Set-Location embed-atlas
git status
```

然后按根目录 `AGENTS.md` 的顺序阅读项目状态、路线图和相关规范。

## 待网站初始化后补充

- 依赖安装命令。
- 本地开发服务器命令。
- 类型检查、格式检查和测试命令。
- 生产构建与本地预览命令。
- 常见 Windows、Linux 和 macOS 环境问题。

在命令真正存在之前，不在文档中提供看似可用但未经验证的占位命令。


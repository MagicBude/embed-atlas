# 开始开发

## 环境要求

- Git。
- Node.js 22 或更高版本。
- npm（随 Node.js 安装）。
- 推荐使用支持 EditorConfig、Vue、TypeScript 和 Markdown 的编辑器。

项目使用 `package-lock.json` 锁定完整依赖树。不要删除锁文件，也不要混用其他包管理器生成新的锁文件。

## 首次接手仓库

```powershell
git clone https://github.com/MagicBude/embed-atlas.git
Set-Location embed-atlas
git status
```

然后按根目录 `AGENTS.md` 的顺序阅读项目状态、路线图和相关规范。

## 安装依赖

```powershell
npm install
```

普通开发应使用 `npm install` 以保留锁文件约束；自动化环境以后使用 `npm ci` 做全新、可复现安装。

## 本地开发

```powershell
npm run dev
```

命令启动 VitePress 开发服务器，并且只监听 `127.0.0.1`。终端会显示本机访问地址，修改 Markdown、Vue 或样式文件后页面会自动刷新。

网站源码位于 `site/`，项目规划、规范和架构文档位于 `docs/`，不要混淆两者职责。

## 检查与构建

```powershell
# 只执行 TypeScript 和 Vue 类型检查
npm run typecheck

# 执行一次全部单元测试
npm run test

# 开发计算核心时持续监听测试文件
npm run test:watch

# 只执行生产构建
npm run build

# 按顺序执行类型检查、单元测试和生产构建，提交前优先使用此命令
npm run check
```

测试分为两层：

- `tests/tools/` 在 Node 环境验证纯计算核心、边界和公开参考向量。
- `tests/components/` 使用 Vue Test Utils 与 Happy DOM 挂载真实 Vue 组件，验证输入、选项切换、错误提示、重置和复制反馈。

推送到 `main` 或创建 Pull Request 后，GitHub Actions 会在 Node.js 22 环境执行 `npm ci` 和 `npm run check`。CI 使用与本地相同的类型检查、测试和生产构建入口，不维护另一套隐藏命令。

生产文件生成到 `site/.vitepress/dist/`。该目录是构建产物，已被 Git 忽略，不应提交。

## 本地预览生产结果

先构建，再启动预览服务器：

```powershell
npm run build
npm run preview
```

预览服务器同样只监听 `127.0.0.1`。它用于检查生产构建结果，不代替日常开发命令。

## 技术版本说明

当前直接依赖固定为：

- VitePress 1.6.4。
- Vue 3.5.41。
- TypeScript 5.9.3。
- Vitest 3.2.7。
- vue-tsc 3.3.11。
- Vue Test Utils 2.4.11。
- Happy DOM 20.11.6。
- Vite Vue Plugin 5.2.4。

选择固定版本是为了让不同设备和自动化环境得到一致结果。升级依赖前应先阅读发布说明，执行 `npm run check`，并检查桌面与窄屏页面。

## 常见问题

### PowerShell 阻止运行 npm 脚本

优先确认自己运行的是可信 Node.js 安装。如果系统策略阻止 `npm.ps1`，可以使用 `npm.cmd` 执行相同命令，不要为了本项目永久放宽整台设备的脚本策略。

### 端口已被占用

VitePress 通常会尝试下一个可用端口。以终端实际显示的地址为准，不要假定端口始终是 5173。

### 安装结果异常

先确认 Node.js 版本满足要求，再查看 `git diff -- package-lock.json`。不要直接删除锁文件或运行跨主版本自动修复；依赖变更需要作为独立、可审阅的修改处理。

- 依赖安装命令。
- 本地开发服务器命令。
- 类型检查、格式检查和测试命令。
- 生产构建与本地预览命令。
- 常见 Windows、Linux 和 macOS 环境问题。

在命令真正存在之前，不在文档中提供看似可用但未经验证的占位命令。

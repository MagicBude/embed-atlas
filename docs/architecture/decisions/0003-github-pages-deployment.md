# ADR-0003：使用 GitHub Pages 发布第一阶段网站

- 状态：Accepted
- 日期：2026-08-26
- 决策者：项目维护者

## 背景

EmbedAtlas 第一阶段是完全静态的 VitePress 网站，不需要账号、数据库或服务端运行环境。仓库托管在 `MagicBude/embed-atlas`，需要一个公开、低维护成本且能复用现有 GitHub Actions 质量检查的发布方式。

GitHub Pages 的项目站点地址位于 `https://<owner>.github.io/<repository>/`，不是域名根路径。若构建时仍使用 `/` 作为基础路径，浏览器会错误地从域名根目录请求资源和页面。

## 决定

1. Phase 1 使用 GitHub Pages 和官方 GitHub Actions 发布流程。
2. 公开地址采用 `https://magicbude.github.io/embed-atlas/`，VitePress 生产构建的 `base` 为 `/embed-atlas/`。
3. 本地开发默认继续使用 `/`；部署及 Pages 等价预览通过 `VITEPRESS_BASE=/embed-atlas/` 注入基础路径。
4. 工作流在 `main` 分支更新或人工触发时执行 `npm ci`、统一质量检查、构建并上传 Pages artifact。
5. 构建任务只有仓库读取权限；部署任务仅增加 `pages: write` 和 `id-token: write`，不使用长期个人令牌。

## 理由

- 与现有 GitHub 仓库、Issue、Pull Request 和 Actions 集中管理，初期维护成本低。
- 静态 artifact 与当前 VitePress 架构匹配，不引入服务端或额外平台账号。
- 官方 Pages Actions 使用短期身份令牌，可保持最小权限边界。
- 环境变量隔离部署路径，使日常本地开发不必始终带仓库前缀。

## 影响

- 所有部署构建必须使用 `/embed-atlas/`，并在公开 URL 上复查导航、资源、搜索和工具页面。
- 工作流只能发布静态文件，未来需要账号、数据库或动态 API 时必须重新评估托管架构。
- 如果以后启用自定义域名，需要同步调整 `base`、部署文档和公开 URL，并通过新的 ADR 或本 ADR 的替代决策记录原因。
- GitHub 仓库必须在 **Settings → Pages → Build and deployment** 中选择 **GitHub Actions** 作为发布源。

## 替代方案

### 从分支直接发布

没有采用。构建产物将与源码混在分支或需要额外 `gh-pages` 分支，发布过程也难以与现有质量门槛绑定。

### 其他静态托管平台

Cloudflare Pages、Netlify 和 Vercel 均可满足静态部署，但 Phase 1 暂无必须引入额外平台的需求。未来若需要自定义预览、边缘能力或平台级分析，可重新评估。

## 复审条件

- 启用自定义域名。
- 出现 GitHub Pages 无法满足的构建、流量或可用性限制。
- 项目引入必须由服务端执行的能力。

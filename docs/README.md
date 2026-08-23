# EmbedAtlas 文档导航

`docs/` 保存项目自身的规划、架构和协作规范，不保存正式发布给读者的知识库正文。未来的网站内容计划放在 `site/`，避免项目治理文档与站点内容混杂。

## 项目方向

- [项目愿景](vision.md)：为什么做、为谁做、坚持什么原则。
- [长期路线图](roadmap.md)：从基础规划到可持续社区的阶段目标。
- [当前状态](project/status.md)：现在做到哪里、下一步做什么。

## 产品规划

- [产品信息架构](product/information-architecture.md)
- [UI 与交互设计原则](product/ui-ux-guidelines.md)
- [在线工具路线图](product/tool-roadmap.md)
- [Phase 1 首批知识内容计划](product/initial-content-plan.md)

## 调研

- [参考网站研究](research/reference-sites.md)

## 架构

- [总体架构](architecture/overview.md)
- [知识内容系统](architecture/content-system.md)
- [在线工具系统](architecture/tool-system.md)
- [架构决策记录](architecture/decisions/README.md)

## 开发

- [开始开发](development/getting-started.md)
- [开发工作流](development/workflow.md)

## 规范

- [代码规范](standard/code-style.md)
- [教材级注释规范](standard/comment-guidelines.md)
- [Git 提交规范](standard/git-commits.md)
- [知识与项目文档规范](standard/documentation.md)

## 模板

- [知识文章模板](templates/knowledge-article.md)
- [在线工具需求模板](templates/tool-spec.md)

## 维护规则

- 稳定原则写入 `vision.md` 和 `architecture/`。
- 产品页面、交互和功能顺序写入 `product/`。
- 外部参考、竞品观察和调研证据写入 `research/`。
- 阶段目标写入 `roadmap.md`。
- 当前事实和最近下一步只写入 `project/status.md`。
- 已发生的用户可见变化写入根目录 `CHANGELOG.md`。
- 不在多个文件重复维护同一份任务清单。

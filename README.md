# EmbedAtlas（嵌入式图谱）

面向中文嵌入式工程师的开源知识库与在线工具箱。

EmbedAtlas 希望把分散在芯片手册、协议标准、厂商文档、个人笔记和在线计算器中的知识，整理为结构清晰、可以验证、方便查阅的中文内容。项目同时提供与知识文章相互关联的在线工具，让读者不仅知道“是什么”，还可以立即计算、转换和验证。

> 当前状态：项目处于 `Phase 1：最小可用网站`，正在完成首批 10 篇知识文章和 3 个经过测试的在线工具。实时进展见 [`PROJECT_STATUS.md`](PROJECT_STATUS.md)。

## 项目目标

- 建立循序渐进的中文嵌入式知识体系。
- 提供可靠、透明、可验证的在线工程工具。
- 让知识文章、示例代码和在线工具互相连接。
- 保持模块化，允许独立增加、替换或删除内容与工具。
- 降低社区贡献门槛，逐步发展为由嵌入式工程师共同维护的项目。

## 规划模块

| 模块 | 主要内容 | 当前阶段 |
| --- | --- | --- |
| 知识库 | C 语言、MCU、外设、通信协议、RTOS、调试与工程实践 | 规划中 |
| 在线工具箱 | 进制、位运算、HEX/ASCII、CRC、大小端、UART 等 | 规划中 |
| 学习路线 | 按基础、方向和项目组织学习顺序 | 规划中 |
| 速查资料 | 数据类型、ASCII、协议字段和常见故障清单 | 规划中 |
| 项目案例 | 可复现的小型嵌入式实践项目 | 远期规划 |
| 调试工作台 | 日志、数据和调试会话管理 | 远期探索 |

## 文档入口

- [文档导航](docs/README.md)
- [项目愿景](docs/vision.md)
- [长期路线图](docs/roadmap.md)
- [项目状态总览](PROJECT_STATUS.md)
- [详细当前状态与下一步](docs/project/status.md)
- [追加式工作日志](docs/work-log.md)
- [总体架构](docs/architecture/overview.md)
- [产品信息架构](docs/product/information-architecture.md)
- [UI 与交互设计原则](docs/product/ui-ux-guidelines.md)
- [参考网站研究](docs/research/reference-sites.md)
- [参与贡献](CONTRIBUTING.md)
- [变更记录](CHANGELOG.md)

## 技术方向

第一阶段计划使用 VitePress、Vue 和 TypeScript 构建静态网站：Markdown 负责知识内容，独立的 Vue 组件负责交互式工具。正式初始化前，以架构决策记录为准。

## 许可证

项目采用双许可证，区分程序代码与知识内容：

| 范围 | 许可证 |
| --- | --- |
| 源代码、配置、脚本、测试、工具实现和代码示例 | [MIT License](LICENSE) |
| 教程正文、项目文档、原创图表和其他非软件内容 | [CC BY-SA 4.0](LICENSE-CONTENT) |

第三方材料仍遵循其原有权利与许可；具体文件另有声明时，以文件声明为准。

## 项目名称

- 英文名：EmbedAtlas
- 中文名：嵌入式图谱
- 仓库名：`embed-atlas`

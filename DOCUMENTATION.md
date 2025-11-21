# PandaWiki 文档索引

本文档提供 PandaWiki 项目的完整文档索引。

## 📖 主要文档

### 项目概览
- **[README.md](./README.md)** - 项目介绍、安装指南、快速开始
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - 项目结构详细说明
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - 贡献指南
- **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)** - 行为准则
- **[SECURITY.md](./SECURITY.md)** - 安全政策

### 后端文档 (Backend)
位置: `backend/docs/`

- **[README.md](./backend/docs/README.md)** - 后端文档导航和开发指南
- **[BACKEND_ARCHITECTURE.md](./backend/docs/BACKEND_ARCHITECTURE.md)** - 后端架构详细文档
- **[MCP_INTEGRATION.md](./backend/docs/MCP_INTEGRATION.md)** - MCP 集成实现文档
- **[MCP_CLIENT_CONFIG.md](./backend/docs/MCP_CLIENT_CONFIG.md)** - MCP 客户端配置指南

### 前端文档 (Frontend)
- **[web/admin/README.md](./web/admin/README.md)** - 管理后台前端文档
- **[web/app/README.md](./web/app/README.md)** - 用户端前端文档

## 🎯 按主题导航

### 快速开始
1. [安装 PandaWiki](./README.md#安装-pandawiki) - 使用 Docker 快速部署
2. [配置 AI 模型](./README.md#配置-ai-模型) - 接入大语言模型
3. [创建知识库](./README.md#创建知识库) - 开始使用

### 开发相关
1. [后端开发](./backend/docs/README.md#开发指南) - Go 后端开发指南
2. [前端开发](./web/admin/README.md) - React 前端开发指南
3. [项目结构](./PROJECT_STRUCTURE.md) - 了解项目组织方式

### 架构设计
1. [后端架构](./backend/docs/BACKEND_ARCHITECTURE.md) - 分层架构、依赖注入、数据库设计
2. [技术栈](./backend/docs/BACKEND_ARCHITECTURE.md#技术栈) - 使用的框架和库
3. [AI 集成](./backend/docs/BACKEND_ARCHITECTURE.md#ai-集成) - RAG、Chat、多模型支持

### MCP 集成
1. [MCP 介绍](./backend/docs/MCP_INTEGRATION.md#什么是-mcp) - 理解 MCP 协议
2. [MCP 实现](./backend/docs/MCP_INTEGRATION.md#技术实现) - PandaWiki 的实现方式
3. [客户端配置](./backend/docs/MCP_CLIENT_CONFIG.md) - Claude Desktop、Cline 等配置

### 配置管理
1. [后端配置](./backend/docs/BACKEND_ARCHITECTURE.md#配置管理) - 配置文件和环境变量
2. [配置示例](./backend/config/config.example.yml) - 完整的配置模板
3. [MCP 配置](./backend/docs/MCP_INTEGRATION.md#配置) - MCP 相关配置

### 部署运维
1. [Docker 部署](./README.md#安装-pandawiki) - 使用 Docker 部署
2. [环境要求](./backend/docs/BACKEND_ARCHITECTURE.md#环境要求) - 依赖服务
3. [监控追踪](./backend/docs/README.md#监控和追踪) - OpenTelemetry、Sentry

### 故障排除
1. [后端常见问题](./backend/docs/BACKEND_ARCHITECTURE.md#常见问题) - 数据库连接、AI 模型等
2. [MCP 故障排除](./backend/docs/MCP_INTEGRATION.md#故障排除) - MCP 相关问题
3. [客户端问题](./backend/docs/MCP_CLIENT_CONFIG.md#故障排除) - 客户端配置问题

## 📚 技术文档详情

### 后端架构文档 (512 行)
涵盖内容：
- ✅ 技术栈和框架选择
- ✅ 项目目录结构
- ✅ 分层架构设计 (Handler → Usecase → Repository → Store → Domain)
- ✅ 依赖注入 (Google Wire)
- ✅ 配置管理系统 (Viper)
- ✅ 数据库迁移 (golang-migrate)
- ✅ API 文档生成 (Swagger)
- ✅ 消息队列 (NATS)
- ✅ AI 集成 (ModelKit, Eino, OpenAI, DeepSeek 等)
- ✅ RAG 实现和 Chat 流程
- ✅ 日志系统 (slog)
- ✅ 安全特性 (认证、授权、加密)
- ✅ 性能优化
- ✅ 测试和构建
- ✅ 扩展开发指南

### MCP 集成文档 (523 行)
涵盖内容：
- ✅ MCP 协议介绍
- ✅ PandaWiki MCP 功能特性
- ✅ 技术实现详解 (mcp-go)
- ✅ MCPHandler 源码解析
- ✅ chat_with_pandawiki 工具实现
- ✅ AppType 定义和扩展
- ✅ 配置方式 (config.yml + 环境变量)
- ✅ 完整工作流程图
- ✅ 安全考虑 (访问控制、速率限制、审计)
- ✅ 扩展开发指南 (添加新工具、Resources、Prompts)
- ✅ 故障排除
- ✅ 未来规划

### MCP 客户端配置指南 (483 行)
涵盖内容：
- ✅ 前置要求
- ✅ Claude Desktop 配置 (Python + Node.js 脚本)
- ✅ Cline (VS Code) 配置
- ✅ 通用 MCP 客户端配置
- ✅ Docker 部署场景
- ✅ HTTPS 和认证配置
- ✅ 环境变量管理
- ✅ 测试脚本 (curl, Python)
- ✅ 故障排除
- ✅ 最佳实践

### 后端文档索引 (321 行)
涵盖内容：
- ✅ 文档列表和简介
- ✅ 快速开始指南
- ✅ 开发流程详解
- ✅ 常用命令速查
- ✅ 调试技巧
- ✅ 监控和追踪
- ✅ 贡献指南
- ✅ 相关资源链接

## 🔧 配置文件

### 后端配置示例
- **[backend/config/config.example.yml](./backend/config/config.example.yml)** - 完整的配置模板
  - 包含所有配置项的说明
  - 提供合理的默认值
  - 标注环境变量覆盖方式

## 📊 文档统计

| 文档 | 行数 | 字数（估算） | 主题数 |
|------|------|--------------|--------|
| 后端架构文档 | 512 | ~9,500 | 52 |
| MCP 集成文档 | 523 | ~10,700 | 42 |
| MCP 客户端配置 | 483 | ~8,700 | 40 |
| 后端文档索引 | 321 | ~5,200 | 61 |
| **总计** | **1,839** | **~34,100** | **195** |

## 🎓 学习路径建议

### 入门路径（新用户）
1. 阅读主 [README.md](./README.md) 了解项目
2. 按照安装指南部署 PandaWiki
3. 配置 AI 模型并创建知识库
4. 浏览 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) 了解项目组成

### 开发路径（后端开发）
1. 阅读 [后端架构文档](./backend/docs/BACKEND_ARCHITECTURE.md)
2. 了解技术栈和分层架构
3. 按照 [开发指南](./backend/docs/README.md#开发指南) 搭建环境
4. 学习添加新功能的流程
5. 查看现有代码示例

### 开发路径（前端开发）
1. 阅读 [web/admin/README.md](./web/admin/README.md)
2. 阅读 [web/app/README.md](./web/app/README.md)
3. 了解前端技术栈 (React, TypeScript)
4. 搭建前端开发环境

### MCP 集成路径
1. 阅读 [MCP 集成文档](./backend/docs/MCP_INTEGRATION.md) 了解实现
2. 查看 [MCP 客户端配置指南](./backend/docs/MCP_CLIENT_CONFIG.md)
3. 配置 Claude Desktop 或其他 MCP 客户端
4. 测试 MCP 功能
5. 如需扩展，参考扩展开发指南

## 🤝 贡献文档

欢迎完善和改进文档！

### 如何贡献
1. Fork 项目
2. 创建文档分支
3. 编辑 Markdown 文件
4. 提交 Pull Request

### 文档规范
- 使用清晰的标题层级
- 添加目录链接
- 提供代码示例
- 包含实际命令
- 添加故障排除建议
- 保持中文友好

## 📞 获取帮助

- 查看 [Issues](https://github.com/chaitin/PandaWiki/issues) - 已知问题和讨论
- 提交新 [Issue](https://github.com/chaitin/PandaWiki/issues/new) - 报告问题或建议
- 微信交流群 - 见主 README 中的二维码

## 📄 许可证

本项目及文档采用 GNU Affero General Public License v3.0 (AGPL-3.0) 许可证。

---

**文档版本**: 1.0  
**最后更新**: 2025-11-20  
**维护者**: PandaWiki 开发团队

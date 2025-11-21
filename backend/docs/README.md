# PandaWiki 后端文档

本目录包含 PandaWiki 后端的详细技术文档。

## 📚 文档列表

### 架构文档

- **[BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)** - 后端架构详细文档
  - 技术栈介绍
  - 项目结构说明
  - 分层架构设计 (Handler → Usecase → Repository → Store)
  - 依赖注入 (Wire) 使用
  - 配置管理系统
  - 中间件机制
  - 数据库迁移
  - AI 集成
  - 日志系统
  - 安全特性
  - 性能优化
  - 测试和部署

### MCP 集成文档

- **[MCP_INTEGRATION.md](./MCP_INTEGRATION.md)** - MCP 服务端集成文档
  - MCP 协议介绍
  - PandaWiki MCP 功能特性
  - 技术实现细节
  - MCP Handler 源码解析
  - 配置方式
  - 工作流程图
  - 安全考虑
  - 扩展开发指南
  - 故障排除
  - 未来规划

- **[MCP_CLIENT_CONFIG.md](./MCP_CLIENT_CONFIG.md)** - MCP 客户端配置指南
  - Claude Desktop 配置
  - Cline (VS Code) 配置
  - 通用 MCP 客户端配置
  - Docker 部署场景
  - 安全配置
  - 测试方法
  - 故障排除
  - 最佳实践

### API 文档

- **[swagger.yaml](./swagger.yaml)** - Swagger/OpenAPI 规范文档
  - 自动生成，通过 `make generate` 更新
  - 在本地开发环境访问: `http://localhost:8000/swagger/index.html`

## 🚀 快速开始

### 1. 了解后端架构

从 [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) 开始，了解：
- 整体技术栈
- 项目目录结构
- 分层架构设计
- 核心概念和术语

### 2. 配置开发环境

参考后端架构文档中的"构建和部署"章节：

```bash
# 克隆仓库
git clone https://github.com/chaitin/PandaWiki.git
cd PandaWiki/backend

# 安装依赖
go mod download

# 生成代码 (wire, swagger)
make generate

# 复制配置文件
cp config/config.example.yml config/config.yml
# 编辑 config.yml 或设置环境变量

# 运行 API 服务
go run cmd/api/main.go
```

### 3. 配置 MCP 集成 (可选)

如果需要使用 MCP 功能：

1. 阅读 [MCP_INTEGRATION.md](./MCP_INTEGRATION.md) 了解 MCP 功能
2. 阅读 [MCP_CLIENT_CONFIG.md](./MCP_CLIENT_CONFIG.md) 配置客户端
3. 测试 MCP 端点: `http://localhost:8000/mcp`

### 4. 探索 API

访问 Swagger 文档查看所有可用的 API:

```bash
# 设置开发环境
export ENV=local

# 启动服务后访问
open http://localhost:8000/swagger/index.html
```

## 📖 开发指南

### 添加新功能

1. **定义领域模型** (`domain/`)
   - 创建数据结构
   - 添加验证标签
   - 定义业务常量

2. **设计数据访问接口** (`repo/`)
   - 定义 Repository 接口
   - 考虑查询需求和性能

3. **实现存储层** (`store/pg/`)
   - 实现 Repository 接口
   - 使用 GORM 操作数据库
   - 添加必要的索引

4. **编写业务逻辑** (`usecase/`)
   - 实现 Usecase
   - 编排多个 Repository
   - 集成第三方服务

5. **添加 HTTP 处理器** (`handler/v1/`)
   - 创建 Handler
   - 添加 Swagger 注释
   - 处理请求/响应

6. **注册依赖** (`handler/v1/provider.go`)
   - 添加到 ProviderSet
   - 运行 `make generate`

7. **编写测试**
   - 单元测试 (Usecase)
   - 集成测试 (API)

8. **更新文档**
   - 更新相关 Markdown 文档
   - 确保 Swagger 注释准确

### 代码规范

```bash
# 格式化代码
go fmt ./...

# 运行 linter
make lint

# 运行测试
go test ./...

# 生成覆盖率报告
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### 数据库迁移

```bash
# 创建新迁移
make migrate_sql SEQ_NAME=add_new_feature

# 编辑 migration 文件
vim store/pg/migration/NNNNNN_add_new_feature.up.sql
vim store/pg/migration/NNNNNN_add_new_feature.down.sql

# 运行迁移（通过 migrate 命令行工具）
migrate -database "postgres://..." -path store/pg/migration up
```

## 🔧 常用命令

```bash
# 生成代码（Wire + Swagger）
make generate

# 构建开发镜像
make dev

# 运行 linter
make lint

# 创建数据库迁移
make migrate_sql SEQ_NAME=your_feature_name

# 运行测试
go test ./...

# 运行特定包的测试
go test ./usecase

# 查看测试覆盖率
go test -cover ./...
```

## 🐛 调试技巧

### 启用调试模式

```bash
export ENV=local
export LOG_LEVEL=-4  # debug 级别
go run cmd/api/main.go
```

### 使用 Delve 调试器

```bash
# 安装 Delve
go install github.com/go-delve/delve/cmd/dlv@latest

# 调试 API 服务
dlv debug cmd/api/main.go

# 在调试器中
(dlv) break main.main
(dlv) continue
(dlv) step
```

### 查看日志

```bash
# 实时查看日志
tail -f /var/log/pandawiki/api.log

# 搜索错误
grep ERROR /var/log/pandawiki/api.log

# 查看特定模块的日志
grep "handler.v1.mcp" /var/log/pandawiki/api.log
```

## 📊 监控和追踪

### OpenTelemetry 集成

PandaWiki 支持 OpenTelemetry 进行分布式追踪：

```yaml
# config.yml
apm:
  enabled: true
  service_name: "panda-wiki-api"
  endpoint: "http://localhost:4318"
```

### Sentry 错误追踪

```yaml
# config.yml
sentry:
  enabled: true
  dsn: "your-sentry-dsn"
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### Pull Request 检查清单

- [ ] 代码已格式化 (`go fmt`)
- [ ] 通过 linter 检查 (`make lint`)
- [ ] 所有测试通过 (`go test ./...`)
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 添加了 Swagger 注释
- [ ] 运行了 `make generate`

## 📚 相关资源

### Go 语言资源

- [Go 官方文档](https://golang.org/doc/)
- [Effective Go](https://golang.org/doc/effective_go)
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)

### 框架和库文档

- [Echo Web Framework](https://echo.labstack.com/)
- [GORM ORM](https://gorm.io/)
- [Google Wire (依赖注入)](https://github.com/google/wire)
- [Viper (配置管理)](https://github.com/spf13/viper)
- [Swagger/OpenAPI](https://swagger.io/)

### AI 和 RAG

- [ModelKit (长亭科技)](https://github.com/chaitin/ModelKit)
- [Eino (字节跳动)](https://github.com/cloudwego/eino)
- [OpenAI API](https://platform.openai.com/docs/api-reference)

### MCP 协议

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [mcp-go 库](https://github.com/mark3labs/mcp-go)
- [Claude Desktop MCP](https://docs.anthropic.com/claude/docs/model-context-protocol)

## ❓ 获取帮助

- 查看 [Issue](https://github.com/chaitin/PandaWiki/issues) 获取已知问题
- 提交新 [Issue](https://github.com/chaitin/PandaWiki/issues/new) 报告问题
- 加入微信交流群讨论 (见项目主 README)

## 📄 许可证

本项目采用 GNU Affero General Public License v3.0 (AGPL-3.0) 许可证。

---

**最后更新**: 2025-11-20

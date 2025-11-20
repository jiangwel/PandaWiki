# PandaWiki 后端架构文档

## 概述

PandaWiki 后端使用 Go 语言开发，采用 Echo Web 框架，遵循分层架构设计模式，使用 Google Wire 进行依赖注入管理。

## 技术栈

- **语言**: Go 1.24+
- **Web 框架**: Echo v4
- **数据库**: PostgreSQL (使用 GORM)
- **消息队列**: NATS
- **缓存**: Redis
- **对象存储**: MinIO (S3 兼容)
- **依赖注入**: Google Wire
- **API 文档**: Swagger/OpenAPI
- **AI 集成**: 
  - ModelKit (长亭科技)
  - Eino (字节跳动)
  - 多种 LLM 支持 (OpenAI, DeepSeek, Gemini, Ollama 等)
- **MCP 集成**: mcp-go (Model Context Protocol)

## 项目结构

```
backend/
├── api/                  # API 定义和接口实现
├── apm/                  # 应用性能监控 (APM)
├── cmd/                  # 应用入口点
│   ├── api/             # API 服务器
│   ├── consumer/        # 消息消费者服务
│   └── migrate/         # 数据库迁移工具
├── config/              # 配置管理
├── consts/              # 常量定义
├── docs/                # 文档和 Swagger 定义
├── domain/              # 领域模型 (业务实体)
├── handler/             # HTTP 请求处理器
│   └── v1/             # API v1 处理器
├── log/                 # 日志管理
├── middleware/          # 中间件
├── migration/           # 数据库迁移脚本
├── mq/                  # 消息队列
├── pkg/                 # 公共工具库
├── pro/                 # 专业版功能
├── repo/                # 数据访问层 (Repository)
├── server/              # 服务器初始化
│   └── http/           # HTTP 服务器配置
├── setup/               # 系统初始化
├── store/               # 存储层抽象
├── telemetry/           # 遥测和监控
├── usecase/             # 用例层 (业务逻辑)
└── utils/               # 工具函数
```

## 架构分层

PandaWiki 后端采用经典的分层架构，从外到内依次为：

### 1. Handler 层 (handler/)

**职责**: 处理 HTTP 请求，参数验证，响应格式化

**特点**:
- 位于 `handler/v1/` 目录
- 使用 Echo 框架的 Context
- 负责请求/响应的序列化和反序列化
- 进行基本的参数验证 (使用 validator)
- 调用 usecase 层处理业务逻辑

**主要处理器**:
- `user.go` - 用户管理
- `knowledge_base.go` - 知识库管理
- `node.go` - 文档节点管理
- `conversation.go` - 对话管理
- `app.go` - 应用管理
- `model.go` - AI 模型配置
- `mcp.go` - MCP 服务端点
- 等等...

**示例代码**:
```go
func (h *NodeHandler) CreateNode(c echo.Context) error {
    var req domain.CreateNodeRequest
    if err := c.Bind(&req); err != nil {
        return err
    }
    // 调用 usecase
    node, err := h.nodeUsecase.CreateNode(c.Request().Context(), &req)
    if err != nil {
        return err
    }
    return c.JSON(http.StatusOK, node)
}
```

### 2. Usecase 层 (usecase/)

**职责**: 实现业务逻辑，编排多个 repo 的调用

**特点**:
- 包含核心业务逻辑
- 协调多个 repository 的调用
- 处理事务管理
- 集成第三方服务 (AI, 消息队列等)
- 不依赖于具体的 HTTP 框架

**主要 Usecase**:
- `chat.go` - 聊天和 AI 对话逻辑
- `node.go` - 文档节点业务逻辑
- `knowledge_base.go` - 知识库业务逻辑
- `rag.go` - RAG (检索增强生成) 逻辑
- `crawler.go` - 内容爬取逻辑
- 等等...

**示例代码**:
```go
type NodeUsecase struct {
    nodeRepo repo.NodeRepository
    kbRepo   repo.KnowledgeBaseRepository
    logger   *log.Logger
}

func (u *NodeUsecase) CreateNode(ctx context.Context, req *domain.CreateNodeRequest) (*domain.Node, error) {
    // 业务逻辑验证
    kb, err := u.kbRepo.GetByID(ctx, req.KBID)
    if err != nil {
        return nil, err
    }
    // 创建节点
    node := &domain.Node{...}
    if err := u.nodeRepo.Create(ctx, node); err != nil {
        return nil, err
    }
    return node, nil
}
```

### 3. Repository 层 (repo/)

**职责**: 数据访问的抽象接口

**特点**:
- 定义数据访问接口
- 不包含具体实现
- 面向接口编程，便于测试和替换实现
- 每个领域实体对应一个 repository 接口

**示例接口**:
```go
type NodeRepository interface {
    Create(ctx context.Context, node *domain.Node) error
    GetByID(ctx context.Context, id string) (*domain.Node, error)
    Update(ctx context.Context, node *domain.Node) error
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, filter *domain.NodeFilter) ([]*domain.Node, error)
}
```

### 4. Store 层 (store/)

**职责**: 数据访问的具体实现

**特点**:
- 实现 repository 接口
- 使用 GORM 操作 PostgreSQL
- 处理数据库事务
- SQL 优化

**目录结构**:
```
store/
├── pg/              # PostgreSQL 实现
│   ├── migration/  # 数据库迁移文件
│   ├── node.go
│   ├── user.go
│   └── ...
└── redis/          # Redis 缓存实现
```

### 5. Domain 层 (domain/)

**职责**: 定义领域模型和业务实体

**特点**:
- 纯粹的数据结构定义
- 不包含业务逻辑
- 在各层之间传递
- 包含验证标签和序列化标签

**主要模型**:
- `user.go` - 用户模型
- `knowledge_base.go` - 知识库模型
- `node.go` - 文档节点模型
- `app.go` - 应用模型 (AppType 定义)
- `chat.go` - 聊天请求/响应模型
- `conversation.go` - 对话模型
- 等等...

## 依赖注入 (Wire)

PandaWiki 使用 Google Wire 进行依赖注入管理，配置文件位于：

- `cmd/api/wire.go` - API 服务的依赖配置
- `cmd/consumer/wire.go` - 消费者服务的依赖配置
- `cmd/migrate/wire.go` - 迁移工具的依赖配置

**Wire 工作流程**:
1. 在 `wire.go` 中定义 `createApp()` 函数和依赖关系
2. 运行 `wire` 命令生成 `wire_gen.go`
3. `wire_gen.go` 包含自动生成的依赖注入代码

**示例 Provider Set**:
```go
// handler/v1/provider.go
var ProviderSet = wire.NewSet(
    middleware.ProviderSet,
    usecase.ProviderSet,
    
    handler.NewBaseHandler,
    NewNodeHandler,
    NewUserHandler,
    NewMCPHandler,
    // ...
    
    wire.Struct(new(APIHandlers), "*"),
)
```

## 配置管理

配置系统位于 `config/` 目录，使用 Viper 库进行配置管理。

### 配置加载顺序

1. **默认配置** - 在 `config.go` 中定义的 `defaultConfig`
2. **配置文件** - 读取 `config.yml` (可选)
3. **环境变量** - 覆盖敏感信息 (优先级最高)

### 配置结构

```go
type Config struct {
    Log           LogConfig
    HTTP          HTTPConfig
    MCP           MCPConfig      // MCP 服务配置
    AdminPassword string
    PG            PGConfig       // PostgreSQL
    MQ            MQConfig       // 消息队列
    RAG           RAGConfig      // RAG 服务
    Redis         RedisConfig
    Auth          AuthConfig
    S3            S3Config
    Sentry        SentryConfig
    CaddyAPI      string
    SubnetPrefix  string
}
```

### 环境变量支持

常用环境变量:
- `POSTGRES_PASSWORD` - 数据库密码
- `REDIS_PASSWORD` - Redis 密码
- `JWT_SECRET` - JWT 密钥
- `S3_SECRET_KEY` - S3 访问密钥
- `ADMIN_PASSWORD` - 管理员密码
- `LOG_LEVEL` - 日志级别 (-4=debug, 0=info, 4=warn, 8=error)
- `SENTRY_ENABLED` - 是否启用 Sentry
- `SENTRY_DSN` - Sentry DSN

## 中间件

中间件位于 `middleware/` 目录，提供横切关注点的功能：

- **认证中间件** - JWT 令牌验证
- **会话中间件** - Session 管理
- **只读模式中间件** - 限制写操作
- **日志中间件** - 请求日志记录 (Echo 内置)
- **CORS 中间件** - 跨域资源共享
- **OpenTelemetry 中间件** - 链路追踪

## 数据库迁移

数据库迁移使用 `golang-migrate` 库：

```bash
# 创建新迁移
make migrate_sql SEQ_NAME=add_mcp_settings

# 执行迁移
./migrate -database "postgres://..." -path store/pg/migration up
```

迁移文件位于 `store/pg/migration/`，按序号命名:
- `000001_init.up.sql`
- `000001_init.down.sql`
- `000002_add_feature.up.sql`
- `000002_add_feature.down.sql`

## API 文档

API 文档使用 Swagger/OpenAPI 规范：

1. 在 handler 函数上添加 Swagger 注释
2. 运行 `make generate` 生成文档
3. 访问 `/swagger/index.html` 查看 API 文档

**示例注释**:
```go
// CreateNode godoc
// @Summary 创建文档节点
// @Description 在知识库中创建新的文档节点
// @Tags node
// @Accept json
// @Produce json
// @Param request body domain.CreateNodeRequest true "节点信息"
// @Success 200 {object} domain.Node
// @Failure 400 {object} domain.ErrorResponse
// @Router /api/v1/nodes [post]
// @Security bearerAuth
func (h *NodeHandler) CreateNode(c echo.Context) error {
    // ...
}
```

## 消息队列

使用 NATS 作为消息队列，支持异步任务处理：

- **发布者**: 在 usecase 中发布消息
- **订阅者**: consumer 服务订阅并处理消息

**常见任务**:
- 内容爬取
- 文档索引更新
- AI 内容生成
- 邮件发送
- Webhook 调用

## AI 集成

### 支持的 AI 模型

PandaWiki 集成了多个 AI 模型提供商：

1. **OpenAI** (GPT-3.5, GPT-4, GPT-4o, etc.)
2. **DeepSeek** (DeepSeek-V3, DeepSeek-R1, etc.)
3. **Google Gemini** (Gemini Pro, Gemini Flash, etc.)
4. **Ollama** (本地部署)
5. **百智云** (ModelKit 聚合平台)

### RAG (检索增强生成)

RAG 功能实现位于 `usecase/rag.go`，流程如下：

1. **检索**: 从向量数据库检索相关文档片段
2. **重排序**: 对检索结果进行相关性排序
3. **生成**: 将检索结果作为上下文，调用 LLM 生成回答

### Chat 流程

聊天功能实现位于 `usecase/chat.go`：

1. 接收用户消息
2. 检索相关知识库内容 (RAG)
3. 构造提示词 (Prompt)
4. 调用 LLM 生成回答
5. 流式返回响应 (SSE)

## 日志系统

日志系统位于 `log/` 目录，基于标准库 `log/slog`：

**日志级别**:
- Debug (-4): 调试信息
- Info (0): 一般信息
- Warn (4): 警告信息
- Error (8): 错误信息

**使用示例**:
```go
logger := log.NewLogger(log.LevelInfo)
logger.Info("Server started", log.Int("port", 8000))
logger.Error("Failed to connect", log.Error(err))
```

## 安全特性

1. **认证**: JWT 令牌认证
2. **授权**: 基于角色的访问控制 (RBAC)
3. **密码加密**: bcrypt 加密存储
4. **SQL 注入防护**: 使用 GORM 参数化查询
5. **XSS 防护**: HTML 内容清理 (bluemonday)
6. **CSRF 防护**: CSRF 令牌验证
7. **速率限制**: 防止暴力攻击
8. **Sentry 集成**: 错误追踪和报警

## 性能优化

1. **数据库索引**: 关键字段建立索引
2. **Redis 缓存**: 热点数据缓存
3. **连接池**: 数据库和 Redis 连接池
4. **异步处理**: 使用消息队列处理耗时任务
5. **流式响应**: AI 对话使用 SSE 流式传输
6. **CDN**: 静态资源使用 CDN 加速

## 测试

```bash
# 运行所有测试
go test ./...

# 运行特定包的测试
go test ./usecase

# 运行测试并显示覆盖率
go test -cover ./...

# 生成覆盖率报告
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

## 构建和部署

### 本地开发

```bash
# 安装依赖
go mod download

# 生成代码 (wire, swagger)
make generate

# 运行 API 服务
go run cmd/api/main.go

# 运行 consumer 服务
go run cmd/consumer/main.go
```

### Docker 构建

```bash
# 构建开发镜像
make dev

# 构建生产镜像
make push-prod-images
```

### 环境要求

- Go 1.24+
- PostgreSQL 12+
- Redis 6+
- NATS 2.x
- MinIO (或 S3)

## 扩展开发

### 添加新的 API 端点

1. 在 `domain/` 定义新的数据模型
2. 在 `repo/` 定义 repository 接口
3. 在 `store/pg/` 实现 repository
4. 在 `usecase/` 实现业务逻辑
5. 在 `handler/v1/` 添加 HTTP 处理器
6. 在 `handler/v1/provider.go` 注册处理器
7. 运行 `make generate` 生成依赖注入代码

### 添加新的配置项

1. 在 `config/config.go` 的 `Config` 结构体添加字段
2. 在 `defaultConfig` 设置默认值
3. 在 `overrideWithEnv()` 添加环境变量支持 (可选)

### 添加数据库表

1. 运行 `make migrate_sql SEQ_NAME=your_feature`
2. 编辑生成的 `.up.sql` 和 `.down.sql` 文件
3. 在 domain/ 添加对应的 Go 结构体

## 常见问题

### 如何调试？

1. 设置 `ENV=local` 环境变量启用调试模式
2. 设置 `LOG_LEVEL=-4` 启用 debug 日志
3. 使用 Delve 调试器: `dlv debug cmd/api/main.go`

### 如何添加新的 AI 模型？

1. 在 `domain/llm.go` 添加模型定义
2. 在相关 usecase 中添加模型调用逻辑
3. 参考现有的 OpenAI/DeepSeek 集成方式

### 数据库连接失败？

检查:
1. PostgreSQL 是否运行
2. `PG_DSN` 环境变量或配置文件是否正确
3. 网络连接是否正常
4. 数据库用户权限是否足够

## 相关资源

- [Echo 框架文档](https://echo.labstack.com/)
- [GORM 文档](https://gorm.io/)
- [Wire 依赖注入](https://github.com/google/wire)
- [Swagger 规范](https://swagger.io/)
- [NATS 消息队列](https://nats.io/)

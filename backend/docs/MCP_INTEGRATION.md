# PandaWiki MCP 集成文档

## 什么是 MCP？

MCP (Model Context Protocol) 是由 Anthropic 开发的开放协议，用于在 AI 应用程序和外部数据源之间建立标准化连接。它使 AI 助手能够安全、受控地访问工具、资源和提示。

## PandaWiki 中的 MCP 集成

PandaWiki 已经集成了 MCP 服务端功能，允许 AI 助手 (如 Claude Desktop、Cline 等) 通过 MCP 协议访问 PandaWiki 知识库，实现智能问答功能。

### 核心特性

- ✅ **标准 MCP 协议支持** - 兼容所有支持 MCP 的 AI 客户端
- ✅ **知识库访问** - 通过自定义 header 指定知识库 ID
- ✅ **AI 对话工具** - 提供 `chat_with_pandawiki` 工具
- ✅ **RAG 支持** - 自动检索相关文档并生成回答
- ✅ **流式响应** - 支持实时返回 AI 生成内容

## 技术实现

### 使用的库

PandaWiki 使用 [mcp-go](https://github.com/mark3labs/mcp-go) 库实现 MCP 服务端：

```go
github.com/mark3labs/mcp-go v0.43.0
```

### MCP Handler 实现

MCP Handler 位于 `backend/handler/v1/mcp.go`，核心代码如下：

```go
type MCPHandler struct {
    logger      *log.Logger
    httpServer  *server.StreamableHTTPServer
    chatUsecase *usecase.ChatUsecase
}

func NewMCPHandler(echo *echo.Echo, logger *log.Logger, chatUsecase *usecase.ChatUsecase) *MCPHandler {
    // 创建 MCP 服务器
    mcpServer := server.NewMCPServer("PandaWiki MCP Server", "1.0.0",
        server.WithToolCapabilities(true),
        server.WithLogging(),
        server.WithInstructions("当用户提问时, 使用pandawiki_conversation工具从PandaWiki知识库中检索答案并进行回答"),
    )
    
    h := &MCPHandler{
        logger:      logger.WithModule("handler.v1.mcp"),
        chatUsecase: chatUsecase,
    }
    
    // 注册工具
    h.registerTools(mcpServer)
    
    // 创建 HTTP 服务器，支持从 header 提取知识库 ID
    h.httpServer = server.NewStreamableHTTPServer(mcpServer,
        server.WithHTTPContextFunc(func(ctx context.Context, r *http.Request) context.Context {
            kbID := r.Header.Get("X-KB-ID")
            return context.WithValue(ctx, kbIDContextKey, kbID)
        }),
    )
    
    // 注册路由
    echo.Any("/mcp", h.MCPHandler)
    return h
}
```

### 提供的工具

#### chat_with_pandawiki

与 PandaWiki 知识库进行对话的工具。

**参数**:
- `message` (必需): 用户消息

**实现**:
```go
func (h *MCPHandler) registerTools(mcpServer *server.MCPServer) {
    mcpServer.AddTool(
        mcp.NewTool("chat_with_pandawiki",
            mcp.WithDescription("使用此工具与 PandaWiki 对话, 从其人工智能知识库中检索答案"),
            mcp.WithString("message", mcp.Required(), mcp.Description("User message")),
        ),
        h.handleChat,
    )
}

func (h *MCPHandler) handleChat(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
    message := req.GetString("message", "")
    kbID, ok := ctx.Value(kbIDContextKey).(string)
    
    // 创建聊天请求
    chatReq := &domain.ChatRequest{
        KBID:    kbID,
        Message: message,
        AppType: domain.AppTypeMcpServer, // MCP 专用应用类型
    }
    
    // 调用聊天 usecase
    eventCh, err := h.chatUsecase.Chat(ctx, chatReq)
    if err != nil {
        return nil, fmt.Errorf("failed to start chat: %w", err)
    }
    
    // 收集响应
    var responseBuilder strings.Builder
    for event := range eventCh {
        if event.Type == "data" {
            responseBuilder.WriteString(event.Content)
        }
        if event.Type == "done" || event.Type == "error" {
            break
        }
    }
    
    result := map[string]interface{}{
        "response": responseBuilder.String(),
    }
    
    data, err := json.Marshal(result)
    return mcp.NewToolResultText(string(data)), nil
}
```

### AppType 定义

在 `domain/app.go` 中，MCP Server 被定义为一种应用类型：

```go
const (
    AppTypeWeb AppType = iota + 1
    AppTypeWidget
    AppTypeDingTalkBot
    AppTypeFeishuBot
    AppTypeWechatBot
    AppTypeWechatServiceBot
    AppTypeDisCordBot
    AppTypeWechatOfficialAccount
    AppTypeOpenAIAPI
    AppTypeWecomAIBot
    AppTypeLarkBot
    AppTypeMcpServer  // MCP 服务器应用类型
)
```

这允许在统计和日志中区分来自 MCP 的请求。

## 配置

### 配置结构

MCP 配置在 `config/config.go` 中定义：

```go
type MCPConfig struct {
    Port int `mapstructure:"port"`
}
```

### 默认配置

```go
MCP: MCPConfig{
    Port: 8001,  // MCP 服务端口（目前未使用独立端口，集成在主 API 中）
},
```

**注意**: 当前实现中，MCP 端点集成在主 API 服务器中 (`/mcp`)，而不是独立的端口。`Port` 配置保留用于未来可能的独立服务部署。

### 配置方式

#### 1. 使用配置文件 (config.yml)

在项目根目录或 `config/` 目录下创建 `config.yml`:

```yaml
mcp:
  port: 8001
```

#### 2. 使用环境变量

```bash
# 目前 MCP 配置较简单，主要依赖主 API 配置
export HTTP_PORT=8000

# 如果需要自定义 MCP 端口（未来支持）
# export MCP_PORT=8001
```

### 当前架构说明

目前 MCP 服务**集成在主 API 服务器中**，而不是独立运行：

- **API 服务器**: 运行在 `HTTP.Port` (默认 8000)
- **MCP 端点**: `http://localhost:8000/mcp`
- **主要好处**: 
  - 简化部署
  - 共享认证和会话
  - 统一的日志和监控

未来如果需要独立的 MCP 服务器，可以：
1. 创建新的 `cmd/mcp/main.go`
2. 监听 `MCP.Port` (8001)
3. 只注册 MCP handler

## 客户端配置

### Claude Desktop 配置

在 Claude Desktop 的配置文件中添加 PandaWiki MCP 服务器：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pandawiki": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-H", "X-KB-ID: your-kb-id-here",
        "http://your-pandawiki-server:8000/mcp"
      ]
    }
  }
}
```

**注意**: 上述配置是示例。实际的 MCP 客户端配置取决于客户端的实现方式。某些客户端可能需要使用 SSE (Server-Sent Events) 或 WebSocket 连接。

### 使用 HTTP 客户端测试

```bash
# 测试 MCP 端点
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -H "X-KB-ID: your-knowledge-base-id" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }'

# 调用 chat_with_pandawiki 工具
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -H "X-KB-ID: your-knowledge-base-id" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "chat_with_pandawiki",
      "arguments": {
        "message": "什么是 PandaWiki？"
      }
    },
    "id": 2
  }'
```

### 获取知识库 ID

知识库 ID 可以通过以下方式获取：

1. **从管理后台**: 
   - 登录 PandaWiki 控制台
   - 进入知识库设置
   - 查看知识库详情，ID 通常显示在 URL 或设置页面

2. **从 API**:
   ```bash
   curl -X GET http://localhost:8000/api/v1/knowledge-bases \
     -H "Authorization: Bearer your-token"
   ```

3. **从数据库**:
   ```sql
   SELECT id, name FROM knowledge_bases;
   ```

## 工作流程

```
┌─────────────┐
│ MCP 客户端  │ (Claude Desktop, Cline, etc.)
│ (AI 助手)   │
└─────┬───────┘
      │
      │ 1. 发送 MCP 请求 (tools/call)
      │    Header: X-KB-ID: kb-123
      ▼
┌─────────────────────────────┐
│  PandaWiki API Server       │
│  (http://localhost:8000)    │
│                             │
│  ┌──────────────────────┐   │
│  │  /mcp 端点           │   │
│  │  (MCPHandler)        │   │
│  └──────┬───────────────┘   │
│         │                   │
│         │ 2. 提取 KB-ID     │
│         │    从 header      │
│         ▼                   │
│  ┌──────────────────────┐   │
│  │  handleChat()        │   │
│  │  创建 ChatRequest    │   │
│  │  AppType: MCP        │   │
│  └──────┬───────────────┘   │
│         │                   │
│         │ 3. 调用 Chat      │
│         │    Usecase        │
│         ▼                   │
│  ┌──────────────────────┐   │
│  │  ChatUsecase         │   │
│  │  ┌───────────────┐   │   │
│  │  │ RAG 检索      │   │   │
│  │  │ - 向量搜索    │   │   │
│  │  │ - 文档重排序  │   │   │
│  │  └───────────────┘   │   │
│  │  ┌───────────────┐   │   │
│  │  │ LLM 生成      │   │   │
│  │  │ - 构造 Prompt │   │   │
│  │  │ - 调用模型    │   │   │
│  │  │ - 流式返回    │   │   │
│  │  └───────────────┘   │   │
│  └──────┬───────────────┘   │
│         │                   │
│         │ 4. 返回响应       │
│         ▼                   │
└─────────────────────────────┘
      │
      │ 5. MCP 格式化响应
      ▼
┌─────────────┐
│ MCP 客户端  │ 显示 AI 回答
└─────────────┘
```

## 安全考虑

### 知识库访问控制

当前实现通过 `X-KB-ID` header 指定知识库 ID，但**没有实现访问控制验证**。在生产环境中，建议：

1. **添加认证**: 
   ```go
   // 从 header 获取 token
   token := r.Header.Get("Authorization")
   // 验证 token 是否有权访问该知识库
   if !h.authUsecase.CanAccessKB(ctx, token, kbID) {
       return errors.New("unauthorized")
   }
   ```

2. **使用 API Token**:
   - 为每个知识库生成专用的 API Token
   - 在 MCP 配置中使用该 Token
   - 在 MCPHandler 中验证 Token

3. **IP 白名单**:
   - 限制只允许特定 IP 访问 MCP 端点
   - 在 Nginx/Caddy 配置中设置

### 速率限制

建议添加速率限制，防止滥用：

```go
// 使用 Redis 实现速率限制
if !h.rateLimiter.Allow(kbID) {
    return errors.New("rate limit exceeded")
}
```

### 日志审计

MCP 请求会自动记录在系统日志中，包含：
- 请求时间
- 知识库 ID
- 用户消息
- AI 响应
- 应用类型 (AppTypeMcpServer)

可以通过日志分析工具监控 MCP 使用情况。

## 扩展开发

### 添加新的 MCP 工具

```go
func (h *MCPHandler) registerTools(mcpServer *server.MCPServer) {
    // 现有工具
    mcpServer.AddTool(
        mcp.NewTool("chat_with_pandawiki", ...),
        h.handleChat,
    )
    
    // 添加新工具: 搜索文档
    mcpServer.AddTool(
        mcp.NewTool("search_documents",
            mcp.WithDescription("在知识库中搜索文档"),
            mcp.WithString("query", mcp.Required(), mcp.Description("搜索关键词")),
            mcp.WithInt("limit", mcp.Description("返回结果数量")),
        ),
        h.handleSearch,
    )
}

func (h *MCPHandler) handleSearch(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
    query := req.GetString("query", "")
    limit := req.GetInt("limit", 10)
    kbID, _ := ctx.Value(kbIDContextKey).(string)
    
    // 实现搜索逻辑
    results, err := h.searchUsecase.Search(ctx, kbID, query, limit)
    if err != nil {
        return nil, err
    }
    
    data, _ := json.Marshal(results)
    return mcp.NewToolResultText(string(data)), nil
}
```

### 支持 MCP Resources

MCP 协议还支持 Resources (资源) 和 Prompts (提示)，可以扩展实现：

```go
// 注册资源
mcpServer.AddResource(
    mcp.NewResource(
        "kb://documents",
        "知识库文档列表",
        "text/plain",
    ),
    h.handleDocumentsResource,
)

// 注册提示
mcpServer.AddPrompt(
    mcp.NewPrompt(
        "summarize",
        "总结文档内容",
        mcp.WithPromptArg("document_id", "文档 ID", true),
    ),
    h.handleSummarizePrompt,
)
```

## 故障排除

### 问题: MCP 端点返回 404

**原因**: 路由未正确注册

**解决**:
1. 检查 `cmd/api/wire_gen.go` 是否包含 `NewMCPHandler`
2. 运行 `make generate` 重新生成依赖注入代码
3. 重启 API 服务器

### 问题: 无法获取知识库 ID

**原因**: `X-KB-ID` header 未设置或格式错误

**解决**:
1. 确保在请求中设置 `X-KB-ID` header
2. 使用有效的知识库 ID (UUID 格式)
3. 检查日志查看接收到的 header 值

### 问题: AI 回答质量不佳

**原因**: 
- RAG 检索效果不好
- LLM 模型配置不当
- 知识库内容不足

**解决**:
1. 在管理后台配置更强大的 Chat 模型 (如 GPT-4)
2. 确保知识库已建立索引
3. 检查知识库内容的质量和完整性
4. 调整 RAG 参数 (检索数量、重排序等)

### 问题: 响应速度慢

**原因**:
- LLM 模型响应慢
- RAG 检索耗时
- 网络延迟

**解决**:
1. 使用更快的模型 (如 GPT-3.5-Turbo)
2. 优化向量数据库索引
3. 使用本地部署的模型 (Ollama)
4. 启用 Redis 缓存常见问题的答案

## 未来规划

- [ ] **独立 MCP 服务器**: 支持在独立端口运行 MCP 服务
- [ ] **更多工具**: 文档搜索、创建、更新等
- [ ] **认证和授权**: 完善的访问控制机制
- [ ] **WebSocket 支持**: 实现双向通信
- [ ] **多知识库支持**: 在单个请求中查询多个知识库
- [ ] **MCP Sampling**: 支持模型采样能力
- [ ] **自定义指令**: 允许为每个知识库配置专属的 MCP 指令

## 参考资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [mcp-go 库](https://github.com/mark3labs/mcp-go)
- [Claude Desktop MCP 配置](https://docs.anthropic.com/claude/docs/model-context-protocol)
- [PandaWiki 后端架构](./BACKEND_ARCHITECTURE.md)

## 贡献

欢迎提交 Issue 和 Pull Request 来改进 MCP 集成功能！

# MCP 客户端配置指南

本文档介绍如何在各种 MCP 客户端中配置 PandaWiki MCP 服务器。

## 前置要求

1. **PandaWiki 服务器已部署并运行**
   - API 服务地址: `http://your-server:8000`
   - MCP 端点: `http://your-server:8000/mcp`

2. **获取知识库 ID**
   - 从 PandaWiki 管理后台获取知识库 ID
   - 格式通常为: `01971b5e-5bea-76d2-9f89-a95f98347bb0` (UUID)

## Claude Desktop

### 配置文件位置

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### 配置方式 1: 使用 Python 脚本 (推荐)

创建一个 Python 脚本作为 MCP 服务器包装器：

**mcp_pandawiki.py**:
```python
#!/usr/bin/env python3
import sys
import json
import requests

MCP_URL = "http://your-pandawiki-server:8000/mcp"
KB_ID = "your-knowledge-base-id"

def main():
    # 从标准输入读取 MCP 请求
    for line in sys.stdin:
        try:
            request = json.loads(line)
            
            # 发送到 PandaWiki MCP 端点
            response = requests.post(
                MCP_URL,
                json=request,
                headers={
                    "Content-Type": "application/json",
                    "X-KB-ID": KB_ID
                }
            )
            
            # 返回响应到标准输出
            print(response.text)
            sys.stdout.flush()
            
        except Exception as e:
            error_response = {
                "jsonrpc": "2.0",
                "error": {
                    "code": -32603,
                    "message": str(e)
                },
                "id": request.get("id")
            }
            print(json.dumps(error_response))
            sys.stdout.flush()

if __name__ == "__main__":
    main()
```

**claude_desktop_config.json**:
```json
{
  "mcpServers": {
    "pandawiki": {
      "command": "python3",
      "args": ["/path/to/mcp_pandawiki.py"]
    }
  }
}
```

### 配置方式 2: 使用 Node.js 脚本

**mcp-pandawiki.js**:
```javascript
#!/usr/bin/env node
const readline = require('readline');
const https = require('https');

const MCP_URL = 'http://your-pandawiki-server:8000/mcp';
const KB_ID = 'your-knowledge-base-id';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  try {
    const request = JSON.parse(line);
    
    const postData = JSON.stringify(request);
    const url = new URL(MCP_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-KB-ID': KB_ID
      }
    };
    
    const req = (url.protocol === 'https:' ? https : require('http')).request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(data);
      });
    });
    
    req.on('error', (e) => {
      const errorResponse = {
        jsonrpc: '2.0',
        error: { code: -32603, message: e.message },
        id: request.id
      };
      console.log(JSON.stringify(errorResponse));
    });
    
    req.write(postData);
    req.end();
    
  } catch (e) {
    const errorResponse = {
      jsonrpc: '2.0',
      error: { code: -32700, message: e.message },
      id: null
    };
    console.log(JSON.stringify(errorResponse));
  }
});
```

**claude_desktop_config.json**:
```json
{
  "mcpServers": {
    "pandawiki": {
      "command": "node",
      "args": ["/path/to/mcp-pandawiki.js"]
    }
  }
}
```

### 验证配置

1. 保存配置文件后，重启 Claude Desktop
2. 在 Claude 对话中，应该能看到 PandaWiki 工具可用
3. 尝试提问: "使用 PandaWiki 工具查询 XXX"

## Cline (VS Code 扩展)

### 配置步骤

1. 打开 VS Code
2. 安装 Cline 扩展
3. 打开 Cline 设置
4. 添加 MCP 服务器配置:

```json
{
  "cline.mcpServers": {
    "pandawiki": {
      "command": "python3",
      "args": ["/path/to/mcp_pandawiki.py"]
    }
  }
}
```

或使用 Node.js:

```json
{
  "cline.mcpServers": {
    "pandawiki": {
      "command": "node",
      "args": ["/path/to/mcp-pandawiki.js"]
    }
  }
}
```

## 通用 MCP 客户端配置

对于支持标准 MCP 协议的客户端，通常需要配置：

### 环境变量

```bash
export PANDAWIKI_MCP_URL="http://your-server:8000/mcp"
export PANDAWIKI_KB_ID="your-knowledge-base-id"
```

### 配置文件

```json
{
  "servers": {
    "pandawiki": {
      "type": "http",
      "url": "http://your-server:8000/mcp",
      "headers": {
        "X-KB-ID": "your-knowledge-base-id"
      }
    }
  }
}
```

## Docker 部署场景

如果 PandaWiki 运行在 Docker 中，需要确保 MCP 客户端能够访问：

### 方式 1: 使用 Host 网络

```bash
docker run --network host pandawiki/api
```

MCP URL: `http://localhost:8000/mcp`

### 方式 2: 端口映射

```bash
docker run -p 8000:8000 pandawiki/api
```

MCP URL: `http://localhost:8000/mcp`

### 方式 3: Docker Compose 网络

```yaml
services:
  pandawiki-api:
    image: pandawiki/api
    networks:
      - pandawiki
    ports:
      - "8000:8000"

  mcp-client:
    image: your-mcp-client
    networks:
      - pandawiki
    environment:
      - MCP_URL=http://pandawiki-api:8000/mcp
      - KB_ID=your-kb-id

networks:
  pandawiki:
```

MCP URL: `http://pandawiki-api:8000/mcp`

## 安全配置

### 使用 HTTPS

如果 PandaWiki 部署在 HTTPS 上:

```python
MCP_URL = "https://your-pandawiki-server.com/mcp"
```

### 添加认证 (如果已启用)

修改脚本添加认证 header:

**Python**:
```python
response = requests.post(
    MCP_URL,
    json=request,
    headers={
        "Content-Type": "application/json",
        "X-KB-ID": KB_ID,
        "Authorization": f"Bearer {API_TOKEN}"  # 添加认证
    }
)
```

**Node.js**:
```javascript
headers: {
  'Content-Type': 'application/json',
  'X-KB-ID': KB_ID,
  'Authorization': `Bearer ${process.env.API_TOKEN}`  // 添加认证
}
```

### 使用环境变量保护敏感信息

**Python**:
```python
import os

MCP_URL = os.getenv("PANDAWIKI_MCP_URL", "http://localhost:8000/mcp")
KB_ID = os.getenv("PANDAWIKI_KB_ID")
API_TOKEN = os.getenv("PANDAWIKI_API_TOKEN")
```

**Node.js**:
```javascript
const MCP_URL = process.env.PANDAWIKI_MCP_URL || 'http://localhost:8000/mcp';
const KB_ID = process.env.PANDAWIKI_KB_ID;
const API_TOKEN = process.env.PANDAWIKI_API_TOKEN;
```

然后在启动时设置环境变量:

```bash
export PANDAWIKI_MCP_URL="https://your-server.com/mcp"
export PANDAWIKI_KB_ID="your-kb-id"
export PANDAWIKI_API_TOKEN="your-token"
```

## 测试配置

### 使用 curl 测试

```bash
# 列出可用工具
curl -X POST http://your-server:8000/mcp \
  -H "Content-Type: application/json" \
  -H "X-KB-ID: your-kb-id" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }'

# 调用 chat_with_pandawiki 工具
curl -X POST http://your-server:8000/mcp \
  -H "Content-Type: application/json" \
  -H "X-KB-ID: your-kb-id" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "chat_with_pandawiki",
      "arguments": {
        "message": "你好，请介绍一下 PandaWiki"
      }
    },
    "id": 2
  }'
```

### 使用 Python 测试脚本

```python
#!/usr/bin/env python3
import requests
import json

MCP_URL = "http://localhost:8000/mcp"
KB_ID = "your-kb-id"

# 测试 1: 列出工具
response = requests.post(
    MCP_URL,
    json={
        "jsonrpc": "2.0",
        "method": "tools/list",
        "params": {},
        "id": 1
    },
    headers={
        "Content-Type": "application/json",
        "X-KB-ID": KB_ID
    }
)
print("Available tools:", json.dumps(response.json(), indent=2))

# 测试 2: 调用工具
response = requests.post(
    MCP_URL,
    json={
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "chat_with_pandawiki",
            "arguments": {
                "message": "什么是 PandaWiki？"
            }
        },
        "id": 2
    },
    headers={
        "Content-Type": "application/json",
        "X-KB-ID": KB_ID
    }
)
print("Response:", json.dumps(response.json(), indent=2))
```

## 故障排除

### 问题: 连接被拒绝

**可能原因**:
- PandaWiki API 服务未运行
- 端口未正确映射
- 防火墙阻止连接

**解决方法**:
```bash
# 检查服务是否运行
curl http://localhost:8000/

# 检查端口是否开放
netstat -tulpn | grep 8000
```

### 问题: 401 Unauthorized

**可能原因**:
- 需要认证但未提供 token
- Token 过期或无效

**解决方法**:
- 在请求中添加 `Authorization` header
- 获取新的 API token

### 问题: 404 Not Found

**可能原因**:
- MCP 端点路径错误
- API 版本不匹配

**解决方法**:
- 确认端点路径为 `/mcp` (不是 `/api/v1/mcp`)
- 检查 PandaWiki 版本是否支持 MCP

### 问题: 知识库 ID 无效

**可能原因**:
- KB_ID 格式错误
- 知识库不存在
- 没有访问权限

**解决方法**:
```bash
# 获取所有知识库
curl -X GET http://localhost:8000/api/v1/knowledge-bases \
  -H "Authorization: Bearer your-token"
```

## 最佳实践

1. **使用环境变量**: 不要在代码中硬编码 URL 和 ID
2. **错误处理**: 添加完善的错误处理和重试逻辑
3. **日志记录**: 记录 MCP 请求和响应，便于调试
4. **超时设置**: 设置合理的请求超时时间
5. **连接池**: 对于高频使用，使用连接池
6. **缓存**: 对常见问题的答案进行缓存

## 参考资源

- [MCP 协议规范](https://modelcontextprotocol.io/)
- [PandaWiki MCP 集成文档](./MCP_INTEGRATION.md)
- [PandaWiki 后端架构](./BACKEND_ARCHITECTURE.md)

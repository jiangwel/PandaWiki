package share

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/handler"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/usecase"
)

type MCPHandler struct {
	*handler.BaseHandler
	logger      *log.Logger
	httpServer  *server.StreamableHTTPServer
	chatUsecase *usecase.ChatUsecase
	appUsecase  *usecase.AppUsecase
}

// contextKey is used to store kbID in context
type contextKey string

const kbIDContextKey contextKey = "kb_id"
const authContextKey contextKey = "authorization"

func NewMCPHandler(echo *echo.Echo, baseHandler *handler.BaseHandler, logger *log.Logger, chatUsecase *usecase.ChatUsecase, appUsecase *usecase.AppUsecase) *MCPHandler {
	h := &MCPHandler{
		BaseHandler: baseHandler,
		logger:      logger.WithModule("handler.v1.mcp"),
		chatUsecase: chatUsecase,
		appUsecase:  appUsecase,
	}

	mcpServer := h.createMCPServer()

	// Create HTTP server with context function to extract kbID and auth token from header
	h.httpServer = server.NewStreamableHTTPServer(mcpServer,
		server.WithHTTPContextFunc(func(ctx context.Context, r *http.Request) context.Context {
			kbID := r.Header.Get("X-KB-ID")
			authHeader := r.Header.Get("Authorization")
			token := strings.TrimPrefix(authHeader, "Bearer ")
			ctx = context.WithValue(ctx, kbIDContextKey, kbID)
			ctx = context.WithValue(ctx, authContextKey, token)
			return ctx
		}),
	)

	echo.Any("/mcp", h.MCP)
	return h
}

func (h *MCPHandler) MCP(c echo.Context) error {
	h.httpServer.ServeHTTP(c.Response(), c.Request())
	return nil
}

func (h *MCPHandler) createMCPServer() *server.MCPServer {
	var srv *server.MCPServer
	hooks := &server.Hooks{}
	hooks.AddOnRegisterSession(func(ctx context.Context, session server.ClientSession) {
		kbID, _ := ctx.Value(kbIDContextKey).(string)
		defaultName := "get_docs"
		defaultDesc := "为解决用户的问题从知识库中检索文档"

		toolName := defaultName
		toolDesc := defaultDesc

		if kbID != "" {
			info, err := h.appUsecase.GetMCPServerAppInfo(ctx, kbID)
			if err == nil {
				name := info.Settings.MCPServerSettings.GetDocsToolSettings.Name
				desc := info.Settings.MCPServerSettings.GetDocsToolSettings.Desc
				if name != "" {
					toolName = name
				}
				if desc != "" {
					toolDesc = desc
				}
			} else {
				h.logger.Warn("createMCPHooks", log.Any("kbID:", kbID), log.Any("failed to get mcp settings, use default name and desc", err))
			}
		} else {
			h.logger.Warn("createMCPHooks", log.Any("kbID:", kbID), log.Any("kb is empty, use default name and desc", nil))
		}

		if srv != nil {
			srv.AddSessionTool(session.SessionID(),
				mcp.NewTool(toolName,
					mcp.WithDescription(toolDesc),
					mcp.WithString("message", mcp.Required(), mcp.Description("User message")),
				),
				h.authWrapper(h.handleGetDocs),
			)
		}
	})

	srv = server.NewMCPServer("PandaWiki MCP Server", "1.0.0",
		server.WithToolCapabilities(true),
		server.WithLogging(),
		server.WithHooks(hooks),
	)
	return srv
}

func (h *MCPHandler) authWrapper(next func(context.Context, mcp.CallToolRequest) (*mcp.CallToolResult, error)) func(context.Context, mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		kbID, _ := ctx.Value(kbIDContextKey).(string)
		if kbID == "" {
			return nil, fmt.Errorf("kb_id is required")
		}
		info, err := h.appUsecase.GetMCPServerAppInfo(ctx, kbID)
		if err != nil {
			return nil, fmt.Errorf("failed to get mcp settings: %w", err)
		}
		if !info.Settings.MCPServerSettings.IsEnabled {
			return nil, fmt.Errorf("mcp server is not enabled")
		}
		if info.Settings.MCPServerSettings.SampleAuth.Enabled {
			token, _ := ctx.Value(authContextKey).(string)
			if token == "" || token != info.Settings.MCPServerSettings.SampleAuth.Password {
				return nil, fmt.Errorf("unauthorized: invalid token")
			}
		}
		return next(ctx, req)
	}
}

func (h *MCPHandler) handleGetDocs(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	message := req.GetString("message", "")
	if message == "" {
		return nil, fmt.Errorf("message is required")
	}

	// Get kbID from context (injected by HTTPContextFunc)
	kbID, ok := ctx.Value(kbIDContextKey).(string)
	if !ok || kbID == "" {
		return nil, fmt.Errorf("kb_id is required")
	}

	// Create chat request
	chatReq := &domain.ChatRequest{
		KBID:    kbID,
		Message: message,
		AppType: domain.AppTypeMcpServer, // Use MCP server app type
	}

	// Call chat usecase
	eventCh, err := h.chatUsecase.ChatRagOnly(ctx, chatReq)
	if err != nil {
		return nil, fmt.Errorf("failed to start chat: %w", err)
	}

	// Collect all events from the channel
	var responseBuilder strings.Builder
	for event := range eventCh {
		if event.Type == "error" {
			return nil, fmt.Errorf("chat error: %s", event.Content)
		}
		if event.Type == "data" {
			// Accumulate response content
			responseBuilder.WriteString(event.Content)
		}
		// Stop processing if we encounter done or error
		if event.Type == "done" || event.Type == "error" {
			break
		}
	}

	response := responseBuilder.String()
	if response == "" {
		return nil, fmt.Errorf("no response received from chat")
	}

	// Return the complete response
	result := map[string]interface{}{
		"response": response,
	}

	data, err := json.Marshal(result)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal result: %w", err)
	}

	return mcp.NewToolResultText(string(data)), nil
}

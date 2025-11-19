package http

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/getsentry/sentry-go"
	sentryecho "github.com/getsentry/sentry-go/echo"
	"github.com/go-playground/validator"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
	echoSwagger "github.com/swaggo/echo-swagger"
	middlewareOtel "go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho"

	_ "github.com/chaitin/panda-wiki/docs"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/usecase"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/log"
	PWMiddleware "github.com/chaitin/panda-wiki/middleware"
)

type HTTPServer struct {
	Echo      *echo.Echo
	MCPServer *server.StreamableHTTPServer
}

type echoValidator struct {
	validator *validator.Validate
}

func (v *echoValidator) Validate(i any) error {
	if err := v.validator.Struct(i); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return nil
}

func NewEcho(
	logger *log.Logger,
	config *config.Config,
	pwMiddleware *PWMiddleware.ReadOnlyMiddleware,
	sessionMiddleware *PWMiddleware.SessionMiddleware,
) *echo.Echo {

	// Initialize Sentry if enabled
	if config.Sentry.Enabled && config.Sentry.DSN != "" {
		err := sentry.Init(sentry.ClientOptions{
			Dsn: config.Sentry.DSN,
		})
		if err != nil {
			logger.Error("Failed to initialize Sentry", log.Error(err))
		} else {
			logger.Info("Sentry initialized successfully")
			// Flush buffered events on the default client before the program terminates.
			defer sentry.Flush(2 * time.Second)
		}
	}

	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	e.Binder = &MyBinder{}

	if os.Getenv("ENV") == "local" {
		e.Debug = true
		e.GET("/swagger/*", echoSwagger.WrapHandler)
	}
	// register validator
	e.Validator = &echoValidator{validator: validator.New()}

	// Add Sentry middleware if enabled
	if config.Sentry.Enabled && config.Sentry.DSN != "" {
		e.Use(sentryecho.New(sentryecho.Options{
			Repanic: true,
			Timeout: 5 * time.Second,
		}))
		sentry.CaptureMessage("It works!")
	}

	if config.GetBool("apm.enabled") {
		e.Use(middlewareOtel.Middleware(config.GetString("apm.service_name")))
	}

	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogStatus:   true,
		LogURI:      true,
		LogLatency:  true,
		LogError:    true,
		LogMethod:   true,
		LogRemoteIP: true,
		HandleError: true, // forwards error to the global error handler, so it can decide appropriate status code
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			// Get the real IP address
			realIP := c.RealIP()
			method := c.Request().Method
			uri := v.URI
			status := v.Status
			latency := v.Latency.Milliseconds()
			if v.Error == nil {
				logger.LogAttrs(context.Background(), slog.LevelInfo, "REQUEST",
					slog.String("remote_ip", realIP),
					slog.String("method", method),
					slog.String("uri", uri),
					slog.Int("status", status),
					slog.Int("latency", int(latency)),
				)
			} else {
				logger.LogAttrs(context.Background(), slog.LevelError, "REQUEST_ERROR",
					slog.String("remote_ip", realIP),
					slog.String("method", method),
					slog.String("uri", uri),
					slog.Int("status", status),
					slog.Int("latency", int(latency)),
					slog.String("err", v.Error.Error()),
				)
			}
			return nil
		},
	}))

	e.Use(pwMiddleware.ReadOnly)
	e.Use(sessionMiddleware.Session())

	return e
}

type MyBinder struct {
	echo.DefaultBinder
}

func (b *MyBinder) Bind(i interface{}, c echo.Context) (err error) {
	if err := b.BindPathParams(c, i); err != nil {
		return err
	}

	method := c.Request().Method
	if method == http.MethodGet || method == http.MethodDelete || method == http.MethodHead {
		if err = b.BindQueryParams(c, i); err != nil {
			return err
		}
		return nil
	}
	return b.BindBody(c, i)
}

type MCPServer struct {
	server      *server.MCPServer
	chatUsecase *usecase.ChatUsecase
	logger      *log.Logger
	KBID        string
}

func NewMCPServer(
	chatUsecase *usecase.ChatUsecase,
	logger *log.Logger,
) *server.StreamableHTTPServer {
	s := server.NewMCPServer("PandaWiki MCP Server", "1.0.0",
		server.WithToolCapabilities(true),
		server.WithLogging(),
		server.WithInstructions("当用户提问时, 使用pandawiki_conversation工具从PandaWiki知识库中检索答案并进行回答"),
	)

	mcpServer := &MCPServer{
		server:      s,
		chatUsecase: chatUsecase,
		logger:      logger.WithModule("mcp.server"),
		KBID:        "b89b2793-7280-46d9-b33a-e0dfcf67cac2",
	}

	mcpServer.registerTools()

	httpServer := server.NewStreamableHTTPServer(mcpServer.server)

	return httpServer
}

func (m *MCPServer) registerTools() {
	// Conversation tools
	m.server.AddTool(
		mcp.NewTool("pandawiki_conversation",
			mcp.WithDescription("使用此工具与 PandaWiki 对话, 从其人工智能知识库中检索答案"),
			mcp.WithString("message", mcp.Required(), mcp.Description("User message")),
		),
		m.handleChat,
	)
}

func (m *MCPServer) handleChat(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	message := req.GetString("message", "")

	if message == "" {
		return nil, fmt.Errorf("message are required")
	}

	// Create chat request
	chatReq := &domain.ChatRequest{
		KBID:    m.KBID,
		Message: message,
		AppType: domain.AppTypeMcpServer, // Use MCP server app type
	}

	// Call chat usecase
	eventCh, err := m.chatUsecase.Chat(ctx, chatReq)
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

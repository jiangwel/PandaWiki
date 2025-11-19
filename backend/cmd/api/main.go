package main

import (
	"fmt"

	"github.com/chaitin/panda-wiki/setup"
)

// @title panda-wiki API
// @version 1.0
// @description panda-wiki API documentation
// @BasePath /
// @securityDefinitions.apikey	bearerAuth
// @in	header
// @name	Authorization
// @description	Type "Bearer" + a space + your token to authorize
func main() {
	app, err := createApp()
	if err != nil {
		panic(err)
	}
	if err := setup.CheckInitCert(); err != nil {
		panic(err)
	}
	go func() {
		app.Logger.Info(fmt.Sprintf("Starting MCP server on port %d", app.Config.MCP.Port))
		if err := app.HTTPServer.MCPServer.Start(fmt.Sprintf(":%d", app.Config.MCP.Port)); err != nil {
			app.Logger.Error("Failed to start MCP server", "error", err)
		} else {
			app.Logger.Info(fmt.Sprintf("MCP server started on port %d", app.Config.MCP.Port))
		}
	}()
	port := app.Config.HTTP.Port
	app.Logger.Info(fmt.Sprintf("Starting server on port %d", port))
	app.HTTPServer.Echo.Logger.Fatal(app.HTTPServer.Echo.Start(fmt.Sprintf(":%d", port)))
}

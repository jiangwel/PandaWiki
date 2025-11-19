package http

import (
	"github.com/google/wire"
)

var ProviderSet = wire.NewSet(
	NewEcho,
	NewMCPServer,	
	wire.Struct(new(HTTPServer), "*"),
)

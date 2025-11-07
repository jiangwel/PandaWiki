package migration

import (
	"github.com/chaitin/panda-wiki/migration/fns"
)

type MigrationFuncs struct {
	NodeMigration         *fns.MigrationNodeVersion
	BotAuthMigration      *fns.MigrationCreateBotAuth
	ModelSettingMigration *fns.MigrationAddModelSettingMode
}

func (mf *MigrationFuncs) GetMigrationFuncs() []MigrationFunc {
	funcs := []MigrationFunc{}
	funcs = append(funcs, MigrationFunc{
		Name: mf.NodeMigration.Name,
		Fn:   mf.NodeMigration.Execute,
	})
	funcs = append(funcs, MigrationFunc{
		Name: mf.BotAuthMigration.Name,
		Fn:   mf.BotAuthMigration.Execute,
	})
	funcs = append(funcs, MigrationFunc{
		Name: mf.ModelSettingMigration.Name,
		Fn:   mf.ModelSettingMigration.Execute,
	})
	return funcs
}

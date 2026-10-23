import { Module } from '@nestjs/common';
import { AppConfigModule } from '@/config/app/app.module';
import { PluginsModule } from './plugins/plugins.module';
import { ModulesModule } from './modules/modules.module';

@Module({
  imports: [AppConfigModule, PluginsModule, ModulesModule],
})
export class AppModule {}

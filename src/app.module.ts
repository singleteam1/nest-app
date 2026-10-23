import { Module } from '@nestjs/common';
import { AppConfigModule } from '@/config/app/app.module';
import { PluginsModule } from './plugins/plugins.module';

@Module({
  imports: [AppConfigModule, PluginsModule],
})
export class AppModule {}

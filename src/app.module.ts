import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppConfigModule } from '@/config/app/app.module';
import { PluginsModule } from './plugins/plugins.module';
import { ModulesModule } from './modules/modules.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [AppConfigModule, PluginsModule, ModulesModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

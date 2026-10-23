import { Module } from '@nestjs/common';
import { AppConfig } from '@/config/app/app-config.service';
import { getThrottlerConfig } from '@/config/loaders';
import { ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './custom-throttler.guard';

@Module({
  imports: [
    NestThrottlerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => getThrottlerConfig(config),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class ThrottlerModule {}

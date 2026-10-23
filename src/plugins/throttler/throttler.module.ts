import { Module } from '@nestjs/common';
import { AppConfig } from '@/config/app/app-config.service';
import { getThrottlerConfig } from '@/config/loaders';
import {
  ThrottlerModule as NestThrottlerModule,
  ThrottlerGuard,
} from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

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
      useClass: ThrottlerGuard,
    },
  ],
})
export class ThrottlerModule {}

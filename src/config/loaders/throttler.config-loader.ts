import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { AppConfig } from '../app/app-config.service';

export function getThrottlerConfig(config: AppConfig): ThrottlerModuleOptions {
  return [
    {
      ttl: config.throttler.windowMs,
      limit: config.throttler.limitMax,
    },
  ];
}

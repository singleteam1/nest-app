import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { AppConfig } from '../app/app-config.service';

export function getCorsConfig(config: AppConfig): CorsOptions {
  return {
    origin: config.cors.allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  };
}

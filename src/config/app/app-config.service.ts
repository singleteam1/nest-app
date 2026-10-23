import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../env.validation.types';

@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  get database() {
    return {
      url: this.config.get('DATABASE_URL', { infer: true }),
    };
  }

  get auth() {
    return {
      secret: this.config.get('JWT_SECRET', { infer: true }),
      accessTTL: this.config.get('ACCESS_TOKEN_TTL', { infer: true }),
      refreshTTL: this.config.get('REFRESH_TOKEN_TTL', { infer: true }),
    };
  }

  get cookie() {
    return {
      domain: this.config.get('COOKIE_DOMAIN', { infer: true }),
      secret: this.config.get('COOKIE_SECRET', { infer: true }),
      expireTTL: this.config.get('COOKIE_EXPIRE_TTL', { infer: true }),
    };
  }

  get cors() {
    const allowedOrigins = this.config.get('ALLOWED_ORIGINS', { infer: true });
    return {
      allowedOrigins: allowedOrigins.split(','),
    };
  }

  get throttler() {
    return {
      limitMax: this.config.get('RATE_LIMIT_MAX', { infer: true }),
      windowMs: this.config.get('RATE_LIMIT_WINDOW_MS', { infer: true }),
    };
  }

  get app() {
    return {
      host: this.config.get('HOST', { infer: true }),
      port: this.config.get('PORT', { infer: true }),
    };
  }

  get isProduction(): boolean {
    return this.config.get('NODE_ENV', { infer: true }) === 'production';
  }
}

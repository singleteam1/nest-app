import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { AppConfig } from '@/config/app/app-config.service';
import { REQUEST_ID_KEY } from '../filters/global-exception.filter';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly config: AppConfig) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const fromCookie =
      req.cookies?.[REQUEST_ID_KEY] ?? req.signedCookies?.[REQUEST_ID_KEY];

    const fromHeader = req.headers?.[REQUEST_ID_KEY];

    const requestId =
      (typeof fromCookie === 'string' && fromCookie.trim().length > 0
        ? fromCookie.trim()
        : null) ??
      (typeof fromHeader === 'string' && fromHeader.trim().length > 0
        ? fromHeader.trim()
        : null) ??
      randomUUID();

    (req as unknown as Record<string, unknown>)['requestId'] = requestId;

    if (!res.headersSent) {
      res.setHeader(REQUEST_ID_KEY, requestId);
      res.cookie(REQUEST_ID_KEY, requestId, {
        httpOnly: false,
        secure: this.config.isProduction,
        sameSite: 'lax',
        path: '/',
        domain: this.config.cookie.domain || undefined,
      });
    }

    next();
  }
}

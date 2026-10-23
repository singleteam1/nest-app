import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  Optional,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { AppConfig } from '@/config/app/app-config.service';
import { ErrorResponse } from '../interfaces/error-response.interface';

export const REQUEST_ID_KEY = 'x-request-id';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    @Optional()
    private readonly config?: AppConfig,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = this.resolveRequestId(request);
    this.setRequestIdCookieAndHeader(response, requestId);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorTitle = this.resolveErrorTitle(exception, status);
    const messages = this.normalizeMessages(exception);

    const errorResponse: ErrorResponse = {
      statusCode: status,
      error: errorTitle,
      messages,
    };

    this.logError(exception, status, requestId, request.url, messages);
    response.status(status).json(errorResponse);
  }

  private resolveRequestId(request: Request): string {
    const fromCookie =
      request.cookies?.[REQUEST_ID_KEY] ??
      request.signedCookies?.[REQUEST_ID_KEY];

    if (typeof fromCookie === 'string' && fromCookie.trim().length > 0) {
      return fromCookie.trim();
    }

    const fromHeader = request.headers?.[REQUEST_ID_KEY];
    if (typeof fromHeader === 'string' && fromHeader.trim().length > 0) {
      return fromHeader.trim();
    }

    const fromReqProp = (request as unknown as Record<string, unknown>)?.[
      'requestId'
    ];
    if (typeof fromReqProp === 'string' && fromReqProp.trim().length > 0) {
      return fromReqProp.trim();
    }

    return randomUUID();
  }

  private setRequestIdCookieAndHeader(
    response: Response,
    requestId: string,
  ): void {
    if (response.headersSent) {
      return;
    }

    const isProduction =
      this.config?.isProduction ?? process.env['NODE_ENV'] === 'production';

    response.setHeader(REQUEST_ID_KEY, requestId);

    response.cookie(REQUEST_ID_KEY, requestId, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      domain: this.config?.cookie?.domain || undefined,
    });
  }

  private resolveErrorTitle(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (
        typeof res === 'object' &&
        res !== null &&
        'error' in res &&
        typeof (res as { error?: unknown }).error === 'string'
      ) {
        return (res as { error: string }).error;
      }
      if (
        exception.name === 'ThrottlerException' ||
        status === HttpStatus.TOO_MANY_REQUESTS
      ) {
        return 'Too Many Requests';
      }
      return exception.name.replace(/Exception$/, '') || 'Http Error';
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'Internal Server Error';
    }

    return HttpStatus[status] ?? 'Internal Server Error';
  }

  private normalizeMessages(exception: unknown): string[] {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();

      if (typeof res === 'string') {
        return [res];
      }

      if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;

        if (Array.isArray(body['message'])) {
          return body['message'].map((m) =>
            typeof m === 'string' ? m : JSON.stringify(m),
          );
        }

        if (typeof body['message'] === 'string') {
          return [body['message']];
        }

        if (Array.isArray(body['messages'])) {
          return body['messages'].map((m) =>
            typeof m === 'string' ? m : JSON.stringify(m),
          );
        }

        if (typeof body['messages'] === 'string') {
          return [body['messages']];
        }
      }

      return [exception.message || 'An error occurred'];
    }

    if (exception instanceof Error) {
      const isProduction =
        this.config?.isProduction ?? process.env['NODE_ENV'] === 'production';

      if (isProduction) {
        return ['Internal server error'];
      }

      return [exception.message || 'Internal server error'];
    }

    return ['Internal server error'];
  }

  private logError(
    exception: unknown,
    status: number,
    requestId: string,
    url: string,
    messages: string[],
  ): void {
    const isServerError = status >= HttpStatus.INTERNAL_SERVER_ERROR;

    if (isServerError) {
      const stack =
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception);
      this.logger.error(
        `[${requestId}] ${status} ${url} - ${messages.join('; ')}`,
        stack,
      );
    } else {
      this.logger.warn(
        `[${requestId}] ${status} ${url} - ${messages.join('; ')}`,
      );
    }
  }
}

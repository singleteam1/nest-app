import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenService } from '@/plugins/tokens/tokens.service';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers['authorization'];

    if (!authorization || !authorization.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException('Authentication required');
    }

    const token = authorization.slice(BEARER_PREFIX.length).trim();
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const payload = await this.tokenService.verifyAccessToken(token);
    (request as any).user = payload;

    return true;
  }
}

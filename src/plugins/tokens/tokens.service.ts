import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import type { CookieOptions } from 'express';
import { AppConfig } from '@/config/app/app-config.service';
import { GeneratedRefreshToken } from '@/common/interfaces/auth.interface';
import { AccessTokenPayload } from '@/common/interfaces/jwt-payload.interface';
import { Role } from '@prisma/generated/enums';

@Injectable()
export class TokenService {
  readonly refreshCookieName = 'refreshToken';

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: AppConfig,
  ) {}

  generateRefreshToken(): GeneratedRefreshToken {
    const token = randomBytes(32).toString('base64url');
    return {
      token,
      hash: this.hashRefreshToken(token),
    };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async signAccessToken(
    payload: Omit<AccessTokenPayload, 'type'>,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { ...payload, type: 'access' },
      {
        secret: this.config.auth.secret,
        expiresIn: this.config.auth.accessTTL as any,
      },
    );
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret: this.config.auth.secret,
        },
      );

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string' ||
        (payload.role !== 'USER' && payload.role !== 'ADMIN') ||
        (payload.type !== undefined && payload.type !== 'access')
      ) {
        throw new Error('Malformed token payload');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        role: payload.role as Role,
        type: 'access',
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  getRefreshCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: this.config.cookie.expireTTL,
    };
  }

  getClearCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'lax',
      path: '/',
    };
  }
}

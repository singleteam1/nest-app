import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AppConfig } from '@/config/app/app-config.service';
import { PasswordService } from '../../plugins/password/password.service';
import { TokenService } from '@/plugins/tokens/tokens.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResult, UserResponse } from '@/common/interfaces/auth.interface';
import { Role } from '@prisma/generated/enums';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly config: AppConfig,
  ) {}

  private getRefreshExpiresAt(): Date {
    return new Date(Date.now() + this.config.cookie.expireTTL);
  }

  private async issueTokenPair(user: {
    id: string;
    email: string;
    role: Role;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const refresh = this.tokenService.generateRefreshToken();
    const familyId = randomUUID();

    await this.repository.createRefreshToken({
      familyId,
      tokenHash: refresh.hash,
      userId: user.id,
      expiresAt: this.getRefreshExpiresAt(),
    });

    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken: refresh.token,
    };
  }

  async register(input: RegisterDto): Promise<AuthResult> {
    const existing = await this.repository.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await this.passwordService.hash(input.password);

    const user = await this.repository.createUser({
      email: input.email,
      passwordHash,
      name: input.name,
      role: Role.USER,
    });

    const tokens = await this.issueTokenPair(user);

    return {
      ...tokens,
      user,
    };
  }

  async login(input: LoginDto): Promise<AuthResult> {
    const user = await this.repository.findUserByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await this.passwordService.verify(
      input.password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const userData: UserResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      createdAt: user.createdAt,
    };

    const tokens = await this.issueTokenPair(userData);

    return {
      ...tokens,
      user: userData,
    };
  }

  async refreshSession(
    rawRefreshToken: string | undefined,
  ): Promise<AuthResult> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    const tokenHash = this.tokenService.hashRefreshToken(rawRefreshToken);
    const existing = await this.repository.findRefreshTokenByHash(tokenHash);

    if (!existing || existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (existing.revokedAt) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    if (existing.usedAt) {
      await this.repository.revokeRefreshTokenFamily(existing.familyId);
      throw new UnauthorizedException(
        'Refresh token reuse detected. All sessions terminated.',
      );
    }

    const user = await this.repository.findUserById(existing.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const nextRefresh = this.tokenService.generateRefreshToken();
    await this.repository.rotateRefreshToken(existing.id, {
      familyId: existing.familyId,
      tokenHash: nextRefresh.hash,
      userId: user.id,
      expiresAt: this.getRefreshExpiresAt(),
    });

    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as Role,
    });

    return {
      accessToken,
      refreshToken: nextRefresh.token,
      user: user as UserResponse,
    };
  }

  async logout(
    rawRefreshToken: string | undefined,
  ): Promise<{ message: string }> {
    if (rawRefreshToken) {
      const tokenHash = this.tokenService.hashRefreshToken(rawRefreshToken);
      const existing = await this.repository.findRefreshTokenByHash(tokenHash);

      if (existing && !existing.revokedAt) {
        await this.repository.revokeRefreshToken(existing.id);
      }
    }

    return { message: 'Logged out successfully' };
  }

  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user as UserResponse;
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { TokenService } from '@/plugins/tokens/tokens.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);

    res.cookie(
      this.tokenService.refreshCookieName,
      result.refreshToken,
      this.tokenService.getRefreshCookieOptions(),
    );

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto);

    res.cookie(
      this.tokenService.refreshCookieName,
      result.refreshToken,
      this.tokenService.getRefreshCookieOptions(),
    );

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const rawRefreshToken =
      req.cookies?.[this.tokenService.refreshCookieName] ??
      req.signedCookies?.[this.tokenService.refreshCookieName];

    try {
      const result = await this.authService.refreshSession(rawRefreshToken);

      res.cookie(
        this.tokenService.refreshCookieName,
        result.refreshToken,
        this.tokenService.getRefreshCookieOptions(),
      );

      return {
        accessToken: result.accessToken,
        user: result.user,
      };
    } catch (err) {
      res.clearCookie(
        this.tokenService.refreshCookieName,
        this.tokenService.getClearCookieOptions(),
      );
      throw err;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MessageResponseDto> {
    const rawRefreshToken =
      req.cookies?.[this.tokenService.refreshCookieName] ??
      req.signedCookies?.[this.tokenService.refreshCookieName];

    const result = await this.authService.logout(rawRefreshToken);

    res.clearCookie(
      this.tokenService.refreshCookieName,
      this.tokenService.getClearCookieOptions(),
    );

    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser('sub') userId: string): Promise<UserResponseDto> {
    return this.authService.getCurrentUser(userId);
  }
}

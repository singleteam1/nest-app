import { Module } from '@nestjs/common';
import { ThrottlerModule } from './throttler/throttler.module';
import { PrismaModule } from './prisma/prisma.module';
import { TokensModule } from './tokens/tokens.module';
import { PasswordModule } from './password/password.module';
@Module({
  imports: [ThrottlerModule, PrismaModule, TokensModule, PasswordModule],
})
export class PluginsModule {}

import { Module } from '@nestjs/common';
import { ThrottlerModule } from './throttler/throttler.module';

@Module({
  imports: [ThrottlerModule],
})
export class PluginsModule {}

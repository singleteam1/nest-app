import { Module } from '@nestjs/common';
import { AppConfigModule } from '@/config/app/app.module';

@Module({
  imports: [AppConfigModule],
})
export class AppModule {}

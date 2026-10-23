import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from '@/config/app/app-config.service';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { getCorsConfig, getValidationPipeConfig } from '@/config/loaders';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = new Logger(AppModule.name);
  const config = app.get(AppConfig);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.use(cookieParser(config.cookie.secret));
  app.useGlobalFilters(new GlobalExceptionFilter(config));
  app.useGlobalPipes(new ValidationPipe(getValidationPipeConfig()));
  app.enableCors(getCorsConfig(config));

  try {
    const { host, port } = config.app;
    await app.listen(port);
    logger.log(`🚀 Server is running at: ${host}:${port}`);
    logger.log(
      `🚀 Server is working in ${config.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`,
    );
  } catch (error: any) {
    logger.error(
      `❌ Failed to start server: ${error.message ?? 'unknows issue'}`,
      error,
    );
    process.exit(1);
  }
}

bootstrap();

import type { ValidationPipeOptions } from '@nestjs/common';

export function getValidationPipeConfig(): ValidationPipeOptions {
  return {
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  };
}

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/generated/client';
import { AppConfig } from '@/config/app/app-config.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  public constructor(private readonly config: AppConfig) {
    const adapter = new PrismaPg({
      connectionString: config.database.url,
    });
    super({ adapter });
  }

  public async onModuleInit() {
    try {
      this.logger.log('🔄 Initializing database connection...');
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
      this.logger.log('✅ Database connection established successfully.');
    } catch (error) {
      this.logger.error('❌ Failed to establish database connection.', error);
      throw error;
    }
  }

  public async onModuleDestroy() {
    try {
      this.logger.log('🔻 Closing database connection...');
      await this.$disconnect();
      this.logger.log('🟢 Database connection closed successfully.');
    } catch (error) {
      this.logger.error(
        '⚠️ Error occurred while closing the database connection.',
        error,
      );
      throw error;
    }
  }
}

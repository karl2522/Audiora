import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

// Load environment variables
config();

const configService = new ConfigService();

const databaseUrl = configService.get<string>('DATABASE_URL');

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(databaseUrl
    ? { url: databaseUrl }
    : {
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'audiora'),
      }),
  entities: [User, RefreshToken],
  migrations: ['src/migrations/*.ts', 'dist/migrations/*.js'],
  synchronize: false, // Always false - use migrations instead
  logging: configService.get<string>('DB_LOGGING') === 'true',
  ssl:
    configService.get<string>('NODE_ENV') === 'production'
      ? { rejectUnauthorized: false }
      : false,
});


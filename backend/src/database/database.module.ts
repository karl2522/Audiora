import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('database.url');
        
        // If DATABASE_URL is provided, use it directly
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [User, RefreshToken],
            synchronize: configService.get<boolean>('database.synchronize', false),
            logging: configService.get<boolean>('database.logging', false),
            ssl: configService.get<string>('nodeEnv') === 'production' ? { rejectUnauthorized: false } : false,
          };
        }
        
        // Otherwise, use individual connection parameters
        return {
          type: 'postgres',
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.database'),
          entities: [User, RefreshToken],
          synchronize: configService.get<boolean>('database.synchronize', false),
          logging: configService.get<boolean>('database.logging', false),
          ssl: configService.get<string>('nodeEnv') === 'production' ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, RefreshToken]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}


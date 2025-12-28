import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { JwtModuleOptions } from '@nestjs/jwt/dist/interfaces/jwt-module-options.interface';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';
import { AuthController } from './auth.controller';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { UserRepository } from './repositories/user.repository';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: 900000, // 15 minutes
        limit: 5, // 5 attempts per 15 minutes for auth endpoints
      },
      {
        name: 'refresh',
        ttl: 60000, // 1 minute
        limit: 10, // 10 refresh requests per minute
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not configured');
        }
        const expiresIn = configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') || '15m';
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    GoogleStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    UserRepository,
    RefreshTokenRepository,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get('REDIS_URL');
        return redisUrl
          ? new Redis(redisUrl)
          : new Redis({
            host: config.get('REDIS_HOST', 'localhost'),
            port: config.get('REDIS_PORT', 6379),
            password: config.get('REDIS_PASSWORD', undefined),
          });
      },
      inject: [ConfigService],
    },
  ],
  exports: [AuthService, TokenService, UserRepository, RefreshTokenRepository],
})
export class AuthModule { }

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { MusicModule } from './music/music.module';

// Custom Redis Storage for Throttler using rate-limiter-flexible
class RedisThrottlerStorage implements ThrottlerStorage {
  private rateLimiter: RateLimiterRedis;

  constructor(redis: Redis) {
    this.rateLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'throttle:',
      points: 20, // Default points
      duration: 60, // Default duration in seconds
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{ totalHits: number; timeToExpire: number; isBlocked: boolean; timeToBlockExpire: number }> {
    try {
      const result = await this.rateLimiter.consume(key, 1);
      return {
        totalHits: result.consumedPoints,
        timeToExpire: Math.ceil(result.msBeforeNext / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch (rejRes: any) {
      // Rate limit exceeded
      return {
        totalHits: rejRes.consumedPoints,
        timeToExpire: Math.ceil(rejRes.msBeforeNext / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(rejRes.msBeforeNext / 1000),
      };
    }
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Railway provides REDIS_URL, local dev uses REDIS_HOST/PORT/PASSWORD
        const redisUrl = config.get('REDIS_URL');

        const redis = redisUrl
          ? new Redis(redisUrl, {
            retryStrategy: (times) => {
              const delay = Math.min(times * 50, 2000);
              return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: false,
          })
          : new Redis({
            host: config.get('REDIS_HOST', 'localhost'),
            port: config.get('REDIS_PORT', 6379),
            password: config.get('REDIS_PASSWORD', undefined),
            retryStrategy: (times) => {
              const delay = Math.min(times * 50, 2000);
              return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: false,
          });

        // Handle Redis connection errors gracefully
        redis.on('error', (err) => {
          console.error('Redis connection error:', err.message);
        });

        redis.on('connect', () => {
          console.log('✅ Redis connected successfully');
        });

        redis.on('ready', () => {
          console.log('✅ Redis ready to accept commands');
        });

        redis.on('reconnecting', () => {
          console.log('🔄 Redis reconnecting...');
        });

        return {
          throttlers: [
            {
              ttl: 60000, // 1 minute
              limit: 20, // Conservative default for auth endpoints
            },
          ],
          storage: new RedisThrottlerStorage(redis),
        };
      },
    }),
    DatabaseModule,
    AuthModule,
    MusicModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }


import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration with validation
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const corsOrigin = configService.get<string>('corsOrigin');

  // Validate CORS origin in production
  if (nodeEnv === 'production' && !corsOrigin) {
    throw new Error('CORS_ORIGIN must be set in production');
  }

  const allowedOrigins = corsOrigin
    ? corsOrigin.split(',').map(origin => origin.trim())
    : ['http://localhost:3000']; // Only allow localhost in development

  console.log('🔒 CORS Configuration:');
  console.log('   Environment:', nodeEnv);
  console.log('   Allowed origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('✅ CORS: Allowing request with no origin');
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS: Allowing origin: ${origin}`);
        callback(null, true);
        return;
      }

      // In production, also allow Vercel preview deployments
      if (nodeEnv === 'production' && origin.endsWith('.vercel.app')) {
        console.log(`✅ CORS: Allowing Vercel preview: ${origin}`);
        callback(null, true);
        return;
      }

      // Block the request
      console.error(`❌ CORS BLOCKED: ${origin}`);
      console.error(`   Allowed origins: ${allowedOrigins.join(', ')}`);
      console.error(`   Environment: ${nodeEnv}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Cookie parser
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('port') || 3001;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
}
bootstrap();

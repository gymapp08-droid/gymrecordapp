import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Serve ALPHA Web Performance Dashboard on root / and /dashboard
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && (req.path === '/' || req.path === '/dashboard' || req.path === '/index.html')) {
      const candidates = [
        path.join(process.cwd(), 'apps', 'web', 'index.html'),
        path.join(__dirname, '..', '..', 'web', 'index.html'),
        path.join(__dirname, '..', '..', '..', 'apps', 'web', 'index.html'),
        path.join(__dirname, '..', '..', '..', '..', 'apps', 'web', 'index.html'),
      ];
      const htmlPath = candidates.find((c) => fs.existsSync(c));
      if (htmlPath) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.sendFile(htmlPath);
      }
    }
    next();
  });

  app.setGlobalPrefix('api/v1');

  // Security Headers Middleware
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:;",
    );
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Security: Global input validation & sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global standard response & error formatting
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformResponseInterceptor(),
  );

  // Security: Strict CORS
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  const allowedOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:19006', 'http://localhost:8081'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or in non-prod
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization,X-Request-ID,X-Device-ID,X-Platform,X-Session-ID',
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`ALPHA API running on port ${port} [prefix: /api/v1]`);
}

bootstrap();

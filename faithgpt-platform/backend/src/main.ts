import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

/**
 * Application bootstrap (docs/08-backend-architecture.md §1 / docs/09 §1-3).
 *
 * - Global prefix `api/v1`, with `/health` excluded so load balancers /
 *   orchestrators can probe liveness without the versioned path.
 * - `ValidationPipe` (whitelist + transform + forbidNonWhitelisted) enforces
 *   DTO contracts on every route.
 * - `HttpExceptionFilter` + `ResponseInterceptor` implement the standard
 *   `{ data, meta }` / `{ error: { code, message, details } }` envelopes
 *   (docs/09 §2-3).
 * - `helmet` + CORS for baseline HTTP security (docs/12-security-framework.md).
 * - `nestjs-pino` for structured request logging.
 * - Swagger UI served at `/api/docs` (outside the versioned prefix).
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: -1 as any }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const config = new DocumentBuilder()
    .setTitle('FaithGPT API')
    .setDescription(
      'AI-powered Christian Bible study & devotion platform — backend API (see /faithgpt-platform/docs and /faithgpt-platform/api/openapi.yaml).',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Standard error envelope per docs/09-api-architecture.md §3:
 *   { "error": { "code": "...", "message": "...", "details": { ... } } }
 *
 * Error code taxonomy (docs/09 §3.1 / docs/08 §5.2):
 *   400 VALIDATION_ERROR | BAD_REQUEST
 *   401 UNAUTHENTICATED | INVALID_CREDENTIALS
 *   403 FORBIDDEN | TENANT_MISMATCH
 *   404 NOT_FOUND
 *   409 RESOURCE_CONFLICT | ALREADY_ENROLLED
 *   422 UNPROCESSABLE_CONTENT
 *   429 RATE_LIMITED
 *   451 CONTENT_BLOCKED
 *   500 INTERNAL_ERROR
 *   502 AI_PROVIDER_ERROR
 *   503 SERVICE_UNAVAILABLE
 */
interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | null;
  };
}

const STATUS_TO_CODE: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'RESOURCE_CONFLICT',
  422: 'UNPROCESSABLE_CONTENT',
  429: 'RATE_LIMITED',
  451: 'CONTENT_BLOCKED',
  500: 'INTERNAL_ERROR',
  502: 'AI_PROVIDER_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, envelope } = this.resolve(exception);

    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json(envelope);
  }

  private resolve(exception: unknown): { status: number; envelope: ErrorEnvelope } {
    // Prisma known-request errors -> map to standard codes (docs/08 §5.2)
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrismaError(exception);
    }

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    // Unhandled error -> 500 INTERNAL_ERROR
    const message = exception instanceof Error ? exception.message : 'Internal server error';
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      envelope: {
        error: {
          code: 'INTERNAL_ERROR',
          message,
        },
      },
    };
  }

  private fromHttpException(exception: HttpException): { status: number; envelope: ErrorEnvelope } {
    const status = exception.getStatus();
    const response = exception.getResponse();

    // If a service threw with a pre-shaped { code, message, details } body,
    // preserve it (allows services to use codes not derivable from status alone,
    // e.g. ALREADY_ENROLLED, TIER_REQUIRED, AI_PROVIDER_ERROR).
    if (typeof response === 'object' && response !== null && 'code' in (response as object)) {
      const body = response as { code: string; message?: string; details?: Record<string, unknown> };
      return {
        status,
        envelope: {
          error: {
            code: body.code,
            message: body.message ?? exception.message,
            details: body.details ?? null,
          },
        },
      };
    }

    // class-validator ValidationPipe errors arrive as { message: string[], error: 'Bad Request' }
    if (
      status === HttpStatus.BAD_REQUEST &&
      typeof response === 'object' &&
      response !== null &&
      Array.isArray((response as { message?: unknown }).message)
    ) {
      const messages = (response as { message: string[] }).message;
      return {
        status,
        envelope: {
          error: {
            code: 'VALIDATION_ERROR',
            message: messages.join('; '),
            details: { fields: messages },
          },
        },
      };
    }

    const message =
      typeof response === 'string'
        ? response
        : (response as { message?: string })?.message ?? exception.message;

    return {
      status,
      envelope: {
        error: {
          code: STATUS_TO_CODE[status] ?? 'INTERNAL_ERROR',
          message,
        },
      },
    };
  }

  private fromPrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): { status: number; envelope: ErrorEnvelope } {
    switch (exception.code) {
      case 'P2002': // unique constraint violation
        return {
          status: HttpStatus.CONFLICT,
          envelope: {
            error: {
              code: 'RESOURCE_CONFLICT',
              message: 'A record with these values already exists.',
              details: { target: exception.meta?.target ?? null },
            },
          },
        };
      case 'P2025': // record not found
        return {
          status: HttpStatus.NOT_FOUND,
          envelope: {
            error: {
              code: 'NOT_FOUND',
              message: 'The requested resource was not found.',
            },
          },
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          envelope: {
            error: {
              code: 'INTERNAL_ERROR',
              message: 'A database error occurred.',
              details: { prismaCode: exception.code },
            },
          },
        };
    }
  }
}

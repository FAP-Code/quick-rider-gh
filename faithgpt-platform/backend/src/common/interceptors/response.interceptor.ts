import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Envelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Wraps every successful response body in the standard `{ data, meta }`
 * envelope (docs/09-api-architecture.md §2). Controllers/services may return
 * a plain DTO/entity/array, or — for paginated collections — an object that
 * already has a `data` key (and optionally `meta`), which is passed through
 * unchanged so services can attach pagination metadata themselves.
 *
 * SSE responses (handled via @Sse() or a raw Response stream, see
 * DevotionsController) bypass this interceptor's wrapping because Nest does
 * not pipe @Sse() observables through interceptors' `map` in the same way —
 * regardless, event payloads are not envelope-wrapped per docs/09 §6.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Envelope<T> | T> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<Envelope<T> | T> {
    return next.handle().pipe(
      map((body) => {
        // Already enveloped (e.g. paginated collections set their own `data`/`meta`)
        if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
          const candidate = body as unknown as Envelope<T>;
          return {
            data: candidate.data,
            ...(candidate.meta !== undefined ? { meta: candidate.meta } : {}),
          };
        }

        // No content (e.g. 204) — pass through untouched
        if (body === undefined || body === null) {
          return body as T;
        }

        return { data: body };
      }),
    );
  }
}

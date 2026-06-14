import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as not requiring authentication.
 * JwtAuthGuard checks for this metadata and skips the JWT check when present.
 * Mirrors `security: []` overrides in api/openapi.yaml (docs/09-api-architecture.md §5.4).
 *
 * @example
 *   @Public()
 *   @Post('login')
 *   login() {}
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { SubscriptionTier, UserRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Access token JWT payload shape, signed by AuthService on login/refresh
 * (docs/09-api-architecture.md §5.1): `sub` (user id), `role`, `tier`, `iat`, `exp`.
 */
export interface JwtPayload {
  sub: string;
  email?: string | null;
  role: string;
  tier: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') as string,
    });
  }

  /**
   * Return value is attached to `request.user` (consumed via @CurrentUser()).
   * Per docs/09 §5.1, role/tier claims live in the token so common
   * authorization checks don't require a DB round trip.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return {
      userId: payload.sub,
      email: payload.email ?? null,
      role: payload.role as UserRole,
      tier: payload.tier as SubscriptionTier,
    };
  }
}

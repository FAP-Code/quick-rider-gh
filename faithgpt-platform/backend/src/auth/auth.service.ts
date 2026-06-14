import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AuthProviderType, SubscriptionTier, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokenResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { OAuthCallbackDto } from './dto/oauth-callback.dto';
import { PasswordResetConfirmDto, PasswordResetRequestDto } from './dto/password-reset.dto';

const BCRYPT_ROUNDS = 12;

/**
 * AuthService — registration, login, OAuth, phone OTP, JWT issuance/refresh,
 * password reset, email/phone verification (docs/10-authentication-system.md).
 *
 * Token model (docs/09 §5.1 / docs/10 §2):
 *  - Access token: 15 min, signed with JWT_SECRET, claims {sub, role, tier}.
 *  - Refresh token: 30 days, opaque random string, stored as a SHA-256 hash in
 *    `refresh_tokens` (tokenHash), bound to deviceInfo, rotated on every use.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokenResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({
        code: 'RESOURCE_CONFLICT',
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        denominationLens: dto.denominationLens ?? null,
        authProviders: {
          create: { provider: AuthProviderType.PASSWORD, providerId: dto.email },
        },
        subscription: {
          create: { tier: SubscriptionTier.FREE },
        },
      },
    });

    return this.issueTokenPair(user, null);
  }

  async login(dto: LoginDto): Promise<AuthTokenResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.passwordHash || !(await this.comparePassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect.',
      });
    }

    return this.issueTokenPair(user, dto.deviceInfo ?? null);
  }

  async refresh(refreshToken: string): Promise<AuthTokenResponseDto> {
    const tokenHash = this.hashToken(refreshToken);

    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Refresh token is invalid, expired, or has been revoked.',
      });
    }

    const user = await this.prisma.user.findUnique({ where: { id: existing.userId } });
    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'User not found.' });
    }

    // Rotation: revoke the old refresh token before issuing a new pair.
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(user, existing.deviceInfo);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Exchanges a Google/Apple/Facebook identity token for a FaithGPT session
   * (docs/10 §8.2). Stub: does not verify the token signature against the
   * provider — a full implementation verifies `idToken` via the provider's
   * SDK/JWKS, extracts {sub, email, name, emailVerified}, then finds-or-creates
   * the AuthAccount/User per the sequence diagram in docs/10 §8.2.
   */
  async oauthCallback(
    provider: 'google' | 'apple' | 'facebook',
    _dto: OAuthCallbackDto,
  ): Promise<AuthTokenResponseDto> {
    throw new UnauthorizedException({
      code: 'UNAUTHENTICATED',
      message: `OAuth provider '${provider}' verification is not implemented in this scaffold.`,
    });
  }

  /**
   * Verifies a phone OTP (Twilio Verify, 6-digit/10-min/5-attempts per docs/10 §6)
   * and signs in/up the PHONE_OTP account. Stub: does not call Twilio.
   */
  async verifyPhone(_dto: VerifyPhoneDto): Promise<AuthTokenResponseDto> {
    throw new Error('not implemented: Twilio Verify OTP integration');
  }

  /**
   * Verifies a single-use email verification token (24h expiry, docs/10 §6)
   * and sets `User.emailVerifiedAt`. Stub.
   */
  async verifyEmail(_token: string): Promise<void> {
    throw new Error('not implemented: email verification token lookup');
  }

  /**
   * Always returns (no account-existence leakage, docs/10 §7). Stub: does not
   * send an email; a full implementation creates a single-use 1h reset token
   * and emails it if an account exists for `dto.email`.
   */
  async requestPasswordReset(_dto: PasswordResetRequestDto): Promise<void> {
    // Intentionally a no-op stub. Always resolves (202 Accepted at controller).
    return;
  }

  /**
   * Confirms a password reset: updates passwordHash, revokes all refresh
   * tokens (forces re-login everywhere), sends confirmation email (docs/10 §7).
   * Stub: token lookup not implemented.
   */
  async confirmPasswordReset(_dto: PasswordResetConfirmDto): Promise<void> {
    throw new Error('not implemented: password reset token lookup');
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /** Refresh tokens are stored as a SHA-256 hash, never the raw token (docs/12 §1). */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async issueTokenPair(
    user: User,
    deviceInfo: string | null,
  ): Promise<AuthTokenResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: user.id },
    });
    const tier = subscription?.tier ?? SubscriptionTier.FREE;

    const payload = { sub: user.id, email: user.email, role: user.role, tier };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL') ?? '15m',
    });

    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL') ?? '30d';
    const expiresAt = new Date(Date.now() + this.parseTtlMs(refreshTtl));

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(rawRefreshToken),
        deviceInfo,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: this.toUserResponse(user, tier),
    };
  }

  toUserResponse(user: User, tier: SubscriptionTier): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      tier,
      denominationLens: user.denominationLens,
      locale: user.locale,
      timezone: user.timezone,
      defaultBibleVersionId: user.defaultBibleVersionId,
      emailVerifiedAt: user.emailVerifiedAt,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  /** Parses simple TTL strings like "30d", "15m", "1h" into milliseconds. */
  private parseTtlMs(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl.trim());
    if (!match) {
      this.logger.warn(`Unrecognized TTL format "${ttl}", defaulting to 30 days`);
      return 30 * 24 * 60 * 60 * 1000;
    }
    const value = Number(match[1]);
    const unit = match[2];
    const unitMs: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * unitMs[unit];
  }
}

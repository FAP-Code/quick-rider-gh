import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionTier, UserRole } from '@prisma/client';

/**
 * Mirrors `components/schemas/User` in api/openapi.yaml. `passwordHash` is
 * never included (docs/12-security-framework.md §1/§2).
 */
export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ format: 'email', nullable: true })
  email: string | null;

  @ApiProperty({ nullable: true })
  phone: string | null;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ enum: SubscriptionTier })
  tier: SubscriptionTier;

  @ApiProperty({ nullable: true, example: 'NEUTRAL' })
  denominationLens: string | null;

  @ApiProperty({ example: 'en' })
  locale: string;

  @ApiProperty({ example: 'UTC' })
  timezone: string;

  @ApiProperty({ nullable: true })
  defaultBibleVersionId: string | null;

  @ApiProperty()
  emailVerifiedAt: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}

/** Mirrors `components/schemas/AuthTokenResponse.properties.data` in api/openapi.yaml. */
export class AuthTokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

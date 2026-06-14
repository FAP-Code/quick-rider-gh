import { ApiProperty } from '@nestjs/swagger';

/** Mirrors `components/schemas/RefreshTokenSummary` in api/openapi.yaml. */
export class RefreshTokenSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  deviceInfo: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  isCurrent: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class OAuthCallbackParamsDto {
  @ApiProperty({ enum: ['google', 'apple', 'facebook'] })
  @IsIn(['google', 'apple', 'facebook'])
  provider: 'google' | 'apple' | 'facebook';
}

export class OAuthCallbackDto {
  @ApiProperty()
  @IsString()
  idToken: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  deviceInfo?: string | null;
}

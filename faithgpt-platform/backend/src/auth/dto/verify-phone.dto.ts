import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class VerifyPhoneDto {
  @ApiProperty({ example: '+233201234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  deviceInfo?: string | null;
}

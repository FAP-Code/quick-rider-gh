import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10)
  password: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ nullable: true, example: 'NEUTRAL' })
  @IsOptional()
  @IsString()
  denominationLens?: string | null;
}

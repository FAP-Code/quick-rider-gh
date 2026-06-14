import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class PasswordResetRequestDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  email: string;
}

export class PasswordResetConfirmDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10)
  newPassword: string;
}

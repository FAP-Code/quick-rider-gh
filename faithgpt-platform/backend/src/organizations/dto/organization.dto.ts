import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'CHURCH' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ format: 'email', nullable: true })
  @IsOptional()
  @IsEmail()
  billingEmail?: string | null;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  seatLimit?: number;

  @ApiPropertyOptional({ format: 'email', nullable: true })
  @IsOptional()
  @IsEmail()
  billingEmail?: string | null;
}

export class AddOrganizationMemberDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ['ADMIN', 'STAFF'] })
  @IsIn(['ADMIN', 'STAFF'])
  roleInOrg: 'ADMIN' | 'STAFF';
}

export class OrganizationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: 'CHURCH' })
  type: string;

  @ApiProperty()
  seatLimit: number;

  @ApiProperty({ nullable: true, format: 'email' })
  billingEmail: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class OrganizationMemberDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: ['ADMIN', 'STAFF'] })
  roleInOrg: string;

  @ApiProperty()
  joinedAt: Date;
}

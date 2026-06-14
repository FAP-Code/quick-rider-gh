import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { GroupRole } from '@prisma/client';

/** Body of `POST /groups`. */
export class CreateGroupDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}

/** Group (api/openapi.yaml `Group` schema). */
export class GroupDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  memberCount!: number;

  @ApiProperty()
  createdAt!: Date;
}

/** GroupMembership (api/openapi.yaml `GroupMembership` schema). */
export class GroupMembershipDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  groupId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: GroupRole })
  role!: GroupRole;

  @ApiProperty()
  joinedAt!: Date;
}

/** Query params for `GET /groups`. */
export class ListGroupsQueryDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  mine?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

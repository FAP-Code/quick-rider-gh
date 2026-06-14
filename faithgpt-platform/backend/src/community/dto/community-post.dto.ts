import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CommunityPostType, ModerationStatus } from '@prisma/client';
import { UserResponseDto } from '../../auth/dto/auth-response.dto';

/** Body of `POST /community/posts`. */
export class CreatePostDto {
  @ApiProperty({ enum: CommunityPostType })
  @IsEnum(CommunityPostType)
  type!: CommunityPostType;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  devotionId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  imageGenerationId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  groupId?: string | null;
}

/** CommunityPost (api/openapi.yaml `CommunityPost` schema). */
export class CommunityPostDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: CommunityPostType })
  type!: CommunityPostType;

  @ApiProperty()
  content!: string;

  @ApiProperty({ enum: ModerationStatus })
  moderationStatus!: ModerationStatus;

  @ApiProperty()
  likeCount!: number;

  @ApiProperty()
  commentCount!: number;

  @ApiProperty({ type: UserResponseDto })
  author!: UserResponseDto;

  @ApiProperty()
  createdAt!: Date;
}

/** Body of `POST /community/posts/{id}/comments`. */
export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  content!: string;
}

/** PostComment (api/openapi.yaml `PostComment` schema). */
export class PostCommentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  postId!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ type: UserResponseDto })
  author!: UserResponseDto;

  @ApiProperty()
  createdAt!: Date;
}

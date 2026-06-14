import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AIQuestionCategory, MessageRole } from '@prisma/client';

/** AIConversation (api/openapi.yaml `AIConversation` schema). */
export class AIConversationDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  title!: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'ROM.8.28-39' })
  contextPassageKey!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

/** AIMessage (api/openapi.yaml `AIMessage` schema). */
export class AIMessageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  conversationId!: string;

  @ApiProperty({ enum: MessageRole })
  role!: MessageRole;

  @ApiPropertyOptional({ enum: AIQuestionCategory, nullable: true })
  category!: AIQuestionCategory | null;

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional({ nullable: true, type: 'array', items: { type: 'object' } })
  citations!: Array<{ ref: string; versionCode: string }> | null;

  @ApiProperty()
  createdAt!: Date;
}

/** AIConversationDetail (api/openapi.yaml `AIConversationDetail` schema). */
export class AIConversationDetailDto extends AIConversationDto {
  @ApiProperty({ type: [AIMessageDto] })
  messages!: AIMessageDto[];
}

/** Body of `POST /ai-conversations`. */
export class CreateConversationDto {
  @ApiPropertyOptional({ nullable: true, example: 'ROM.8.28-39' })
  @IsOptional()
  @IsString()
  contextPassageKey?: string | null;
}

/** Body of `POST /ai-conversations/{id}/messages`. */
export class PostMessageDto {
  @ApiProperty({ example: "What does it mean that 'all things work together for good'?" })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ enum: AIQuestionCategory })
  @IsOptional()
  category?: AIQuestionCategory;
}

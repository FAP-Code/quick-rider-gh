import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { ImageStyle } from '@prisma/client';
import { ImageGenerationDto } from './image-generation.dto';

/** Output formats for `POST /story-visualizations` (api/openapi.yaml `outputType` enum). */
export enum StoryVisualizationOutputType {
  STORYBOARD = 'STORYBOARD',
  COMIC = 'COMIC',
  STORYBOOK = 'STORYBOOK',
  TEACHING_SLIDES = 'TEACHING_SLIDES',
}

/** Body of `POST /story-visualizations`. */
export class GenerateStoryVisualizationDto {
  @ApiProperty({ example: 'david-and-goliath' })
  @IsString()
  storyKey!: string;

  @ApiProperty({ enum: ImageStyle })
  @IsEnum(ImageStyle)
  style!: ImageStyle;

  @ApiProperty({ enum: StoryVisualizationOutputType })
  @IsEnum(StoryVisualizationOutputType)
  outputType!: StoryVisualizationOutputType;
}

/** BibleStoryVisualization (api/openapi.yaml `BibleStoryVisualization` schema). */
export class BibleStoryVisualizationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'david-and-goliath' })
  storyKey!: string;

  @ApiProperty({ enum: ImageStyle })
  style!: ImageStyle;

  @ApiProperty({ enum: StoryVisualizationOutputType })
  outputType!: StoryVisualizationOutputType;

  @ApiProperty()
  createdAt!: Date;
}

export class StoryboardFrameDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sequence!: number;

  @ApiProperty()
  caption!: string;

  @ApiProperty({ type: ImageGenerationDto, nullable: true })
  imageGeneration!: ImageGenerationDto | null;
}

/** BibleStoryVisualizationDetail (api/openapi.yaml `BibleStoryVisualizationDetail` schema). */
export class BibleStoryVisualizationDetailDto extends BibleStoryVisualizationDto {
  @ApiProperty({ type: [StoryboardFrameDto] })
  frames!: StoryboardFrameDto[];
}

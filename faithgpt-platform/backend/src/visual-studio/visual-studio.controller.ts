import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { VisualStudioService } from './visual-studio.service';
import { GenerateImageRequestDto, ImageGenerationDto } from './dto/image-generation.dto';
import {
  BibleStoryVisualizationDetailDto,
  BibleStoryVisualizationDto,
  GenerateStoryVisualizationDto,
} from './dto/story-visualization.dto';
import { GenerateMemoryVerseCardDto, MemoryVerseCardDto } from './dto/memory-verse-card.dto';

/**
 * VisualStudioModule (api/openapi.yaml `Visual Studio` tag): AI Scripture
 * Image Generator™, Bible Story Visualizer™, and Memory Verse Visualizer™.
 *
 * Per the spec, `POST /images/generate`, `POST /story-visualizations`, and
 * `POST /memory-verse-cards` return `202 Accepted` (job queued, BullMQ
 * `image-generation` queue) in production. This scaffold's service resolves
 * synchronously and returns the completed resource; the controller still
 * documents `202` per the OpenAPI contract.
 */
@ApiTags('Visual Studio')
@Controller()
export class VisualStudioController {
  constructor(private readonly visualStudioService: VisualStudioService) {}

  @Get('images')
  @ApiOperation({ summary: 'List "My Images"' })
  @ApiResponse({ status: 200, type: [ImageGenerationDto] })
  listImages(@CurrentUser() user: AuthenticatedUser, @Query() query: CursorPaginationDto) {
    return this.visualStudioService.listImages(user.userId, query.limit ?? 20, query.cursor);
  }

  @Post('images/generate')
  @ApiOperation({ summary: 'Queue an AI Scripture Image Generator™ job (async, BullMQ `image-generation` queue)' })
  @ApiResponse({ status: 202, type: ImageGenerationDto })
  generateImage(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateImageRequestDto) {
    return this.visualStudioService.generateImage(user.userId, dto);
  }

  @Get('images/:id')
  @ApiOperation({ summary: 'Get image generation status/result' })
  @ApiResponse({ status: 200, type: ImageGenerationDto })
  getImage(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.visualStudioService.getImage(user.userId, id);
  }

  @Post('story-visualizations')
  @ApiOperation({ summary: 'Generate an AI Bible Story Visualizer™ sequence (async, multi-frame)' })
  @ApiResponse({ status: 202, type: BibleStoryVisualizationDto })
  generateStoryVisualization(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateStoryVisualizationDto,
  ) {
    return this.visualStudioService.generateStoryVisualization(user.userId, dto);
  }

  @Get('story-visualizations/:id')
  @ApiOperation({ summary: 'Get a story visualization with its frames' })
  @ApiResponse({ status: 200, type: BibleStoryVisualizationDetailDto })
  getStoryVisualization(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.visualStudioService.getStoryVisualization(user.userId, id);
  }

  @Post('memory-verse-cards')
  @ApiOperation({ summary: 'Generate a Memory Verse Visualizer™ card' })
  @ApiResponse({ status: 202, type: MemoryVerseCardDto })
  generateMemoryVerseCard(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateMemoryVerseCardDto) {
    return this.visualStudioService.generateMemoryVerseCard(user.userId, dto);
  }

  @Get('memory-verse-cards')
  @ApiOperation({ summary: 'List "My Memory Verse Cards"' })
  @ApiResponse({ status: 200, type: [MemoryVerseCardDto] })
  listMemoryVerseCards(@CurrentUser() user: AuthenticatedUser, @Query() query: CursorPaginationDto) {
    return this.visualStudioService.listMemoryVerseCards(user.userId, query.limit ?? 20, query.cursor);
  }
}

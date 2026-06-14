import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ScriptureAnalysisService } from './scripture-analysis.service';
import { ScriptureAnalysisRequestDto, ScriptureAnalysisResultDto } from './dto/scripture-analysis.dto';

/**
 * Scripture Analysis Engine (api/openapi.yaml `Scripture Analysis` tag).
 * See bible.module.ts for placement notes — this endpoint is conceptually
 * part of BibleModule's content surface but exposed alongside AiStudyModule
 * in this scaffold.
 */
@ApiTags('Scripture Analysis')
@Controller('scripture-analysis')
export class ScriptureAnalysisController {
  constructor(private readonly scriptureAnalysisService: ScriptureAnalysisService) {}

  @Post()
  @ApiOperation({ summary: 'Run (or retrieve cached) Scripture Analysis for a passage' })
  @ApiResponse({ status: 200, type: ScriptureAnalysisResultDto })
  analyze(@CurrentUser() user: AuthenticatedUser, @Body() dto: ScriptureAnalysisRequestDto) {
    return this.scriptureAnalysisService.analyze(user.userId, dto);
  }
}

import { Module } from '@nestjs/common';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { AiStudyController } from './ai-study.controller';
import { ScriptureAnalysisController } from './scripture-analysis.controller';
import { AiStudyService } from './ai-study.service';
import { ScriptureAnalysisService } from './scripture-analysis.service';

/**
 * AIStudyModule — AI Bible Study Assistant™ + Scripture Analysis Engine
 * (docs/08-backend-architecture.md §2; api/openapi.yaml `AI Study` and
 * `Scripture Analysis` tags).
 */
@Module({
  imports: [AiGatewayModule],
  controllers: [AiStudyController, ScriptureAnalysisController],
  providers: [AiStudyService, ScriptureAnalysisService],
  exports: [AiStudyService, ScriptureAnalysisService],
})
export class AiStudyModule {}

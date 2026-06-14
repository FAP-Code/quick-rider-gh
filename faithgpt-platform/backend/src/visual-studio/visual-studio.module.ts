import { Module } from '@nestjs/common';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { VisualStudioController } from './visual-studio.controller';
import { VisualStudioService } from './visual-studio.service';

@Module({
  imports: [AiGatewayModule],
  controllers: [VisualStudioController],
  providers: [VisualStudioService],
  exports: [VisualStudioService],
})
export class VisualStudioModule {}

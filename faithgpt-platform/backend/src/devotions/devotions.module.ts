import { Module } from '@nestjs/common';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { DevotionsController } from './devotions.controller';
import { DevotionsService } from './devotions.service';

@Module({
  imports: [AiGatewayModule],
  controllers: [DevotionsController],
  providers: [DevotionsService],
  exports: [DevotionsService],
})
export class DevotionsModule {}

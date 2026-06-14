import { Module } from '@nestjs/common';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { SermonsController } from './sermons.controller';
import { SermonsService } from './sermons.service';

@Module({
  imports: [AiGatewayModule],
  controllers: [SermonsController],
  providers: [SermonsService],
  exports: [SermonsService],
})
export class SermonsModule {}

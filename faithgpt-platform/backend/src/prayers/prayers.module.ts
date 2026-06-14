import { Module } from '@nestjs/common';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { PrayersController } from './prayers.controller';
import { PrayersService } from './prayers.service';

@Module({
  imports: [AiGatewayModule],
  controllers: [PrayersController],
  providers: [PrayersService],
  exports: [PrayersService],
})
export class PrayersModule {}

import { Module } from '@nestjs/common';
import { ReadingPlansController } from './reading-plans.controller';
import { ReadingPlansService } from './reading-plans.service';

@Module({
  controllers: [ReadingPlansController],
  providers: [ReadingPlansService],
  exports: [ReadingPlansService],
})
export class ReadingPlansModule {}

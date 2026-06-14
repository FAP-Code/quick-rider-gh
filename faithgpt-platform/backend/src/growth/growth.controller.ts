import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { GrowthService } from './growth.service';
import { AchievementWithProgressDto, GrowthDashboardDto } from './dto/growth-dashboard.dto';

/** GrowthModule (api/openapi.yaml `Growth` tag): Spiritual Growth Dashboard™. */
@ApiTags('Growth')
@Controller('growth')
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get the Spiritual Growth Dashboard™ summary (streaks, stats, achievements)' })
  @ApiResponse({ status: 200, type: GrowthDashboardDto })
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.growthService.getDashboard(user.userId);
  }

  @Get('achievements')
  @ApiOperation({ summary: "List all achievements with the user's unlock status" })
  @ApiResponse({ status: 200, type: [AchievementWithProgressDto] })
  listAchievements(@CurrentUser() user: AuthenticatedUser) {
    return this.growthService.listAchievements(user.userId);
  }
}

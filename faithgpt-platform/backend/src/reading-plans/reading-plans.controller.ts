import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ReadingPlansService } from './reading-plans.service';
import { ListReadingPlansQueryDto } from './dto/reading-plan.dto';

/** ReadingPlansModule (api/openapi.yaml `Reading Plans` tag). */
@ApiTags('Reading Plans')
@Controller('reading-plans')
export class ReadingPlansController {
  constructor(private readonly readingPlansService: ReadingPlansService) {}

  @Get()
  @ApiOperation({ summary: 'List the reading plan library' })
  @ApiResponse({ status: 200, description: 'Reading plans' })
  list(@Query() query: ListReadingPlansQueryDto) {
    return this.readingPlansService.list(query);
  }

  @Get('my')
  @ApiOperation({ summary: "List the authenticated user's active/completed plans" })
  @ApiResponse({ status: 200, description: 'User reading plans' })
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.readingPlansService.listMine(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reading plan with its day-by-day passages' })
  @ApiResponse({ status: 200, description: 'Reading plan detail' })
  findOne(@Param('id') id: string) {
    return this.readingPlansService.findOne(id);
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll the authenticated user in a reading plan' })
  @ApiResponse({ status: 201, description: 'Enrolled' })
  @ApiResponse({ status: 409, description: 'Already enrolled' })
  enroll(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.readingPlansService.enroll(user.userId, id);
  }
}

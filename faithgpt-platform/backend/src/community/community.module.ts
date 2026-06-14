import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { GroupsController } from './groups.controller';
import { CommunityService } from './community.service';
import { GroupsService } from './groups.service';

/**
 * CommunityModule (docs/08-backend-architecture.md §2): community feed,
 * posts/comments/likes/follows, plus the Groups sub-resource
 * (api/openapi.yaml `Groups` tag).
 */
@Module({
  controllers: [CommunityController, GroupsController],
  providers: [CommunityService, GroupsService],
  exports: [CommunityService, GroupsService],
})
export class CommunityModule {}

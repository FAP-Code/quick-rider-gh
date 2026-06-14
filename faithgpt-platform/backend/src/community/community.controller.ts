import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { CommunityService } from './community.service';
import { CommunityPostDto, CreateCommentDto, CreatePostDto, PostCommentDto } from './dto/community-post.dto';

/** CommunityModule (api/openapi.yaml `Community` tag): feed, posts, comments, likes, follows. */
@ApiTags('Community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Get the community feed' })
  @ApiResponse({ status: 200, type: [CommunityPostDto] })
  getFeed(@Query() query: CursorPaginationDto) {
    return this.communityService.getFeed(query.limit ?? 20, query.cursor);
  }

  @Post('posts')
  @ApiOperation({ summary: 'Create a community post (share devotion/testimony/prayer/image/insight)' })
  @ApiResponse({ status: 201, description: 'Post created (moderationStatus=PENDING until auto-moderation completes)', type: CommunityPostDto })
  createPost(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePostDto) {
    return this.communityService.createPost(user.userId, dto);
  }

  @Post('posts/:id/comments')
  @ApiOperation({ summary: 'Comment on a post' })
  @ApiResponse({ status: 201, type: PostCommentDto })
  createComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.communityService.createComment(user.userId, id, dto);
  }

  @Post('posts/:id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Like a post (idempotent)' })
  @ApiResponse({ status: 204, description: 'Liked' })
  async likePost(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.communityService.likePost(user.userId, id);
  }

  @Delete('posts/:id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiResponse({ status: 204, description: 'Unliked' })
  async unlikePost(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.communityService.unlikePost(user.userId, id);
  }

  @Post('follow/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 204, description: 'Followed' })
  async followUser(@CurrentUser() user: AuthenticatedUser, @Param('userId') userId: string): Promise<void> {
    await this.communityService.followUser(user.userId, userId);
  }

  @Delete('follow/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 204, description: 'Unfollowed' })
  async unfollowUser(@CurrentUser() user: AuthenticatedUser, @Param('userId') userId: string): Promise<void> {
    await this.communityService.unfollowUser(user.userId, userId);
  }
}

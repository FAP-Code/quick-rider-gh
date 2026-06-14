import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommunityPost, PostComment, SubscriptionTier, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { CreateCommentDto, CreatePostDto } from './dto/community-post.dto';

/**
 * CommunityModule — community feed, posts, comments, likes, follows
 * (docs/08-backend-architecture.md §2). Newly created posts/comments default
 * to ModerationStatus.PENDING per docs/19 §1 (pre-generation content
 * filter handled by a moderation worker, out of scope for this stub).
 */
@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(limit: number, cursor?: string) {
    const rows = await this.prisma.communityPost.findMany({
      where: { moderationStatus: 'APPROVED' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { user: { include: { subscription: true } }, _count: { select: { likes: true, comments: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      data: page.map((post) => this.toPostDto(post)),
      meta: {
        pagination: {
          nextCursor: hasMore ? page[page.length - 1].id : null,
          hasMore,
        },
      },
    };
  }

  async createPost(userId: string, dto: CreatePostDto) {
    const post = await this.prisma.communityPost.create({
      data: {
        userId,
        type: dto.type,
        content: dto.content,
        relatedDevotionId: dto.devotionId ?? null,
        relatedImageId: dto.imageGenerationId ?? null,
        groupId: dto.groupId ?? null,
        moderationStatus: 'PENDING',
      },
      include: { user: { include: { subscription: true } }, _count: { select: { likes: true, comments: true } } },
    });

    return this.toPostDto(post);
  }

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Post not found.' });
    }

    const comment = await this.prisma.postComment.create({
      data: {
        postId,
        userId,
        content: dto.content,
        moderationStatus: 'PENDING',
      },
      include: { user: { include: { subscription: true } } },
    });

    return this.toCommentDto(comment);
  }

  async likePost(userId: string, postId: string): Promise<void> {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Post not found.' });
    }

    await this.prisma.postLike.upsert({
      where: { postId_userId: { postId, userId } },
      create: { postId, userId },
      update: {},
    });
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    await this.prisma.postLike.deleteMany({ where: { postId, userId } });
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new ConflictException({ code: 'RESOURCE_CONFLICT', message: 'You cannot follow yourself.' });
    }

    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
  }

  // ---------------------------------------------------------------------
  // Mappers
  // ---------------------------------------------------------------------

  private toPostDto(post: CommunityPost & { user: User & { subscription: { tier: SubscriptionTier } | null }; _count: { likes: number; comments: number } }) {
    return {
      id: post.id,
      type: post.type,
      content: post.content,
      moderationStatus: post.moderationStatus,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      author: this.toAuthorDto(post.user),
      createdAt: post.createdAt,
    };
  }

  private toCommentDto(comment: PostComment & { user: User & { subscription: { tier: SubscriptionTier } | null } }) {
    return {
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      author: this.toAuthorDto(comment.user),
      createdAt: comment.createdAt,
    };
  }

  private toAuthorDto(user: User & { subscription: { tier: SubscriptionTier } | null }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      tier: user.subscription?.tier ?? SubscriptionTier.FREE,
      denominationLens: user.denominationLens,
      locale: user.locale,
      timezone: user.timezone,
      defaultBibleVersionId: user.defaultBibleVersionId,
      emailVerifiedAt: user.emailVerifiedAt,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}

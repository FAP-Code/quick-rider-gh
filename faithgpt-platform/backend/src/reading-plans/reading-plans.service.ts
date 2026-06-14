import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListReadingPlansQueryDto } from './dto/reading-plan.dto';

/**
 * ReadingPlansModule (docs/08-backend-architecture.md §2): plan library,
 * enrollment, progress tracking.
 */
@Injectable()
export class ReadingPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListReadingPlansQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = query.category ? { category: query.category } : {};

    const [plans, total] = await Promise.all([
      this.prisma.readingPlan.findMany({ where, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.readingPlan.count({ where }),
    ]);

    return {
      data: plans,
      meta: { pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } },
    };
  }

  async findOne(id: string) {
    const plan = await this.prisma.readingPlan.findUnique({
      where: { id },
      include: { days: { include: { passages: true }, orderBy: { dayNumber: 'asc' } } },
    });
    if (!plan) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Reading plan not found.' });
    }
    return plan;
  }

  async enroll(userId: string, planId: string) {
    await this.findOne(planId);

    const existing = await this.prisma.userReadingPlan.findUnique({
      where: { userId_planId: { userId, planId } },
    });

    if (existing) {
      throw new ConflictException({
        code: 'ALREADY_ENROLLED',
        message: 'You are already enrolled in this reading plan.',
      });
    }

    return this.prisma.userReadingPlan.create({
      data: { userId, planId },
      include: { plan: true },
    });
  }

  async listMine(userId: string) {
    return this.prisma.userReadingPlan.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { startedAt: 'desc' },
    });
  }
}

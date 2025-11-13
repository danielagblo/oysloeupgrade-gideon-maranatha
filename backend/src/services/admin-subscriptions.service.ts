import { AppDataSource } from '../config/database.js';
import { Subscription } from '../entities/Subscription.js';
import { NotFoundError } from '../utils/errors.js';
import type { z } from 'zod';
import type { GetSubscriptionsQuerySchema, UpdateSubscriptionStatusSchema } from '../schemas/admin.js';

type GetSubscriptionsQuery = z.infer<typeof GetSubscriptionsQuerySchema>;
type UpdateSubscriptionStatus = z.infer<typeof UpdateSubscriptionStatusSchema>;

export class AdminSubscriptionsService {
  private get subscriptionRepository() {
    return AppDataSource.getRepository(Subscription);
  }

  async getSubscriptions(query: GetSubscriptionsQuery) {
    const {
      page = 1,
      limit = 10,
      planType,
      status,
      userId,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const queryBuilder = this.subscriptionRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.user', 'u');

    if (planType) {
      queryBuilder.andWhere('s.planType = :planType', { planType });
    }

    if (status) {
      queryBuilder.andWhere('s.status = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('s.userId = :userId', { userId });
    }

    if (dateFrom) {
      queryBuilder.andWhere('s.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('s.createdAt <= :dateTo', { dateTo });
    }

    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`s.${sortBy}`, order);

    const offset = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(offset).take(Number(limit));

    const [subscriptions, total] = await queryBuilder.getManyAndCount();

    const planTypeFilters = await this.subscriptionRepository
      .createQueryBuilder('s')
      .select('s.planType', 'planType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('s.planType')
      .getRawMany();

    const statusFilters = await this.subscriptionRepository
      .createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('s.status')
      .getRawMany();

    return {
      subscriptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
        hasNext: offset + Number(limit) < total,
        hasPrev: Number(page) > 1,
      },
      filters: {
        planTypes: planTypeFilters.map((f: { planType: string; count: string }) => ({
          value: f.planType,
          count: parseInt(f.count, 10),
        })),
        statuses: statusFilters.map((f: { status: string; count: string }) => ({
          value: f.status,
          count: parseInt(f.count, 10),
        })),
      },
    };
  }

  async getSubscription(id: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    return subscription;
  }

  async updateSubscriptionStatus(id: string, input: UpdateSubscriptionStatus) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    subscription.status = input.status;

    if (input.status === 'cancelled' && input.cancellationReason) {
      subscription.cancellationReason = input.cancellationReason;
      subscription.cancelledAt = new Date();
    }

    return await this.subscriptionRepository.save(subscription);
  }

  async getSubscriptionStats() {
    const total = await this.subscriptionRepository.count();
    const active = await this.subscriptionRepository.count({
      where: { status: 'active' },
    });
    const expired = await this.subscriptionRepository.count({
      where: { status: 'expired' },
    });
    const cancelled = await this.subscriptionRepository.count({
      where: { status: 'cancelled' },
    });
    const pending = await this.subscriptionRepository.count({
      where: { status: 'pending' },
    });

    const byPlanType = await this.subscriptionRepository
      .createQueryBuilder('s')
      .select('s.planType', 'planType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('s.planType')
      .getRawMany();

    const byStatus = await this.subscriptionRepository
      .createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('s.status')
      .getRawMany();

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newToday = await this.subscriptionRepository
      .createQueryBuilder('s')
      .where('s.createdAt >= :dayAgo', { dayAgo })
      .getCount();

    const newWeek = await this.subscriptionRepository
      .createQueryBuilder('s')
      .where('s.createdAt >= :weekAgo', { weekAgo })
      .getCount();

    const newMonth = await this.subscriptionRepository
      .createQueryBuilder('s')
      .where('s.createdAt >= :monthAgo', { monthAgo })
      .getCount();

    const totalRevenue = await this.subscriptionRepository
      .createQueryBuilder('s')
      .select('SUM(s.price)', 'total')
      .where('s.status = :status', { status: 'active' })
      .getRawOne();

    return {
      total,
      active,
      expired,
      cancelled,
      pending,
      byPlanType: byPlanType.reduce(
        (acc, curr: { planType: string; count: string }) => {
          acc[curr.planType] = parseInt(curr.count, 10);
          return acc;
        },
        {} as Record<string, number>
      ),
      byStatus: byStatus.reduce(
        (acc, curr: { status: string; count: string }) => {
          acc[curr.status] = parseInt(curr.count, 10);
          return acc;
        },
        {} as Record<string, number>
      ),
      growth: {
        today: newToday,
        week: newWeek,
        month: newMonth,
      },
      totalRevenue: parseFloat(totalRevenue?.total || '0'),
    };
  }
}



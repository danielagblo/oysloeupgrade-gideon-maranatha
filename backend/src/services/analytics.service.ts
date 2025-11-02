import { AppDataSource } from '@config/database.js';
import { Product } from '@entities/Product.js';
import { type EntityType, type EventType, UserAnalytics } from '@entities/UserAnalytics.js';
import { logError, logInfo } from '@utils/logger.js';
import { In, MoreThanOrEqual } from 'typeorm';

export class AnalyticsService {
  private get userAnalyticsRepository() {
    return AppDataSource.getRepository(UserAnalytics);
  }

  private get productRepository() {
    return AppDataSource.getRepository(Product);
  }

  async trackEvent(
    eventType: EventType,
    entityType: EntityType,
    entityId?: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const analyticsRecord = this.userAnalyticsRepository.create({
        userId,
        eventType,
        entityType,
        entityId,
        metadata,
      });

      await this.userAnalyticsRepository.save(analyticsRecord);
      logInfo(`Analytics event tracked: ${eventType} on ${entityType}:${entityId}`);
    } catch (error) {
      logError('Failed to track analytics event', error as Error);
    }
  }

  async trackProductView(
    userId: string | undefined,
    productId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent('product_view', 'product', productId, userId, metadata);
  }

  async trackProductClick(
    userId: string | undefined,
    productId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent('product_click', 'product', productId, userId, metadata);
  }

  async trackSearch(
    userId: string | undefined,
    query: string,
    resultsCount: number
  ): Promise<void> {
    await this.trackEvent('search', 'search', undefined, userId, {
      query,
      resultsCount,
    });
  }

  async trackFavoriteAdd(userId: string, productId: string): Promise<void> {
    await this.trackEvent('favorite_add', 'product', productId, userId);
  }

  async trackFavoriteRemove(userId: string, productId: string): Promise<void> {
    await this.trackEvent('favorite_remove', 'product', productId, userId);
  }

  async trackReviewCreate(userId: string, productId: string, rating: number): Promise<void> {
    await this.trackEvent('review_create', 'product', productId, userId, {
      rating,
    });
  }

  async trackChatStart(userId: string, chatRoomId: string): Promise<void> {
    await this.trackEvent('chat_start', 'chat', chatRoomId, userId);
  }

  async trackCouponRedeem(userId: string, couponId: string): Promise<void> {
    await this.trackEvent('coupon_redeem', 'coupon', couponId, userId);
  }

  async getUserEngagementStats(
    userId: string,
    days = 30
  ): Promise<{
    totalEvents: number;
    productViews: number;
    productClicks: number;
    searches: number;
    favoritesAdded: number;
    reviewsCreated: number;
    recentActivity: UserAnalytics[];
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await this.userAnalyticsRepository.find({
        where: {
          userId,
          createdAt: MoreThanOrEqual(startDate),
        },
        order: { createdAt: 'DESC' },
        take: 100,
      });

      const stats = {
        totalEvents: analytics.length,
        productViews: analytics.filter((a) => a.eventType === 'product_view').length,
        productClicks: analytics.filter((a) => a.eventType === 'product_click').length,
        searches: analytics.filter((a) => a.eventType === 'search').length,
        favoritesAdded: analytics.filter((a) => a.eventType === 'favorite_add').length,
        reviewsCreated: analytics.filter((a) => a.eventType === 'review_create').length,
        recentActivity: analytics.slice(0, 20),
      };

      return stats;
    } catch (error) {
      logError('Failed to get user engagement stats', error as Error);
      return {
        totalEvents: 0,
        productViews: 0,
        productClicks: 0,
        searches: 0,
        favoritesAdded: 0,
        reviewsCreated: 0,
        recentActivity: [],
      };
    }
  }

  async getProductAnalytics(
    productId: string,
    days = 30
  ): Promise<{
    totalViews: number;
    totalClicks: number;
    uniqueViewers: number;
    conversionRate: number;
    recentActivity: UserAnalytics[];
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await this.userAnalyticsRepository.find({
        where: {
          entityId: productId,
          entityType: 'product',
          createdAt: MoreThanOrEqual(startDate),
        },
        order: { createdAt: 'DESC' },
      });

      const views = analytics.filter((a) => a.eventType === 'product_view');
      const clicks = analytics.filter((a) => a.eventType === 'product_click');
      const uniqueViewers = new Set(views.map((v) => v.userId).filter(Boolean)).size;
      const conversionRate = views.length > 0 ? (clicks.length / views.length) * 100 : 0;

      return {
        totalViews: views.length,
        totalClicks: clicks.length,
        uniqueViewers,
        conversionRate: Math.round(conversionRate * 100) / 100,
        recentActivity: analytics.slice(0, 50),
      };
    } catch (error) {
      logError('Failed to get product analytics', error as Error);
      return {
        totalViews: 0,
        totalClicks: 0,
        uniqueViewers: 0,
        conversionRate: 0,
        recentActivity: [],
      };
    }
  }

  async getTopProducts(
    limit = 10,
    days = 7
  ): Promise<
    Array<{
      productId: string;
      product?: Product;
      views: number;
      clicks: number;
      uniqueViewers: number;
    }>
  > {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const topProducts = await this.userAnalyticsRepository
        .createQueryBuilder('analytics')
        .select('analytics.entity_id', 'productId')
        .addSelect("COUNT(CASE WHEN analytics.event_type = 'product_view' THEN 1 END)", 'views')
        .addSelect("COUNT(CASE WHEN analytics.event_type = 'product_click' THEN 1 END)", 'clicks')
        .addSelect(
          "COUNT(DISTINCT CASE WHEN analytics.event_type = 'product_view' THEN analytics.user_id END)",
          'uniqueViewers'
        )
        .where('analytics.entity_type = :entityType', { entityType: 'product' })
        .andWhere('analytics.created_at >= :startDate', { startDate })
        .andWhere('analytics.entity_id IS NOT NULL')
        .groupBy('analytics.entity_id')
        .orderBy('views', 'DESC')
        .addOrderBy('clicks', 'DESC')
        .limit(limit)
        .getRawMany();

      const productIds = topProducts.map((p) => p.productId);
      const products = await this.productRepository.findBy({
        id: In(productIds),
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      return topProducts.map((tp) => ({
        productId: tp.productId,
        product: productMap.get(tp.productId),
        views: parseInt(tp.views, 10),
        clicks: parseInt(tp.clicks, 10),
        uniqueViewers: parseInt(tp.uniqueViewers, 10),
      }));
    } catch (error) {
      logError('Failed to get top products', error as Error);
      return [];
    }
  }

  async getTrendingSearchTerms(
    limit = 10,
    days = 7
  ): Promise<
    Array<{
      query: string;
      searchCount: number;
      avgResults: number;
    }>
  > {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trendingSearches = await this.userAnalyticsRepository
        .createQueryBuilder('analytics')
        .select("analytics.metadata->>'query'", 'query')
        .addSelect('COUNT(*)', 'searchCount')
        .addSelect("AVG(CAST(analytics.metadata->>'resultsCount' AS INTEGER))", 'avgResults')
        .where('analytics.event_type = :eventType', { eventType: 'search' })
        .andWhere('analytics.created_at >= :startDate', { startDate })
        .andWhere("analytics.metadata->>'query' IS NOT NULL")
        .groupBy("analytics.metadata->>'query'")
        .orderBy('searchCount', 'DESC')
        .limit(limit)
        .getRawMany();

      return trendingSearches.map((ts) => ({
        query: ts.query,
        searchCount: parseInt(ts.searchCount, 10),
        avgResults: Math.round(parseFloat(ts.avgResults) || 0),
      }));
    } catch (error) {
      logError('Failed to get trending search terms', error as Error);
      return [];
    }
  }
}

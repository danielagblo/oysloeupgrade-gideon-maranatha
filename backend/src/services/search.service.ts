import { AppDataSource } from '@config/database.js';
import { Product } from '@entities/Product.js';
import { RecentlyViewed } from '@entities/RecentlyViewed.js';
import { SearchHistory } from '@entities/SearchHistory.js';
import { logError, logInfo } from '@utils/logger.js';

export class SearchService {
  private get searchHistoryRepository() {
    return AppDataSource.getRepository(SearchHistory);
  }

  private get recentlyViewedRepository() {
    return AppDataSource.getRepository(RecentlyViewed);
  }

  private get productRepository() {
    return AppDataSource.getRepository(Product);
  }

  async saveSearchQuery(
    userId: string | undefined,
    query: string,
    resultsCount: number
  ): Promise<void> {
    try {
      if (!userId) return;

      const searchRecord = this.searchHistoryRepository.create({
        userId,
        query,
        resultsCount,
      });

      await this.searchHistoryRepository.save(searchRecord);
      logInfo(`Search query saved: ${query} (${resultsCount} results)`);
    } catch (error) {
      logError('Failed to save search query', error as Error);
    }
  }

  async getSearchSuggestions(query?: string, limit = 10): Promise<string[]> {
    try {
      if (!query) return [];

      const productSuggestions = await this.productRepository
        .createQueryBuilder('product')
        .select('DISTINCT product.name', 'name')
        .where('product.name ILIKE :q', { q: `${query}%` })
        .orderBy('product.createdAt', 'DESC')
        .limit(limit)
        .getRawMany();

      const history = await this.searchHistoryRepository
        .createQueryBuilder('search')
        .select('search.query', 'name')
        .addSelect('COUNT(*) as count')
        .where('search.query ILIKE :q', { q: `${query}%` })
        .groupBy('search.query')
        .orderBy('count', 'DESC')
        .limit(limit)
        .getRawMany();

      const merged = [...productSuggestions, ...history]
        .map((r) => r.name as string)
        .filter(Boolean);

      const seen = new Set<string>();
      const deduped: string[] = [];
      for (const s of merged) {
        const lower = s.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          deduped.push(s);
          if (deduped.length >= limit) break;
        }
      }

      return deduped;
    } catch (error) {
      logError('Error getting search suggestions:', error as Error);
      return [];
    }
  }

  async getSearchHistory(userId: string, limit = 20): Promise<SearchHistory[]> {
    try {
      return await this.searchHistoryRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
      });
    } catch (error) {
      logError('Failed to get search history', error as Error);
      return [];
    }
  }

  async trackRecentlyViewed(userId: string, productId: string): Promise<void> {
    try {
      await this.recentlyViewedRepository
        .createQueryBuilder()
        .insert()
        .into(RecentlyViewed)
        .values({ userId, productId, viewedAt: () => 'CURRENT_TIMESTAMP' })
        .orUpdate(['viewedAt'], ['userId', 'productId'])
        .execute();

      await this.recentlyViewedRepository
        .createQueryBuilder()
        .delete()
        .where('userId = :userId', { userId })
        .andWhere(
          `id NOT IN (
          SELECT id FROM recently_viewed
          WHERE user_id = :userId
          ORDER BY viewed_at DESC
          LIMIT 50
        )`
        )
        .execute();

      logInfo(`Recently viewed tracked: ${productId} for user ${userId}`);
    } catch (error) {
      logError('Failed to track recently viewed', error as Error);
    }
  }

  async getRecentlyViewed(userId: string, limit = 20): Promise<Product[]> {
    try {
      const recentlyViewed = await this.recentlyViewedRepository.find({
        where: { userId },
        relations: ['product'],
        order: { viewedAt: 'DESC' },
        take: limit,
      });

      return recentlyViewed.map((rv) => rv.product).filter(Boolean) as Product[];
    } catch (error) {
      logError('Failed to get recently viewed', error as Error);
      return [];
    }
  }

  async getTrendingProducts(limit = 10): Promise<Product[]> {
    try {
      const trending = await this.productRepository
        .createQueryBuilder('product')
        .innerJoin('product.recentlyViewed', 'rv')
        .where('rv.viewedAt > :date', {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        })
        .addSelect('COUNT(rv.id) as view_count')
        .groupBy('product.id')
        .orderBy('view_count', 'DESC')
        .addOrderBy('product.favoritesCount', 'DESC')
        .limit(limit)
        .getMany();

      return trending;
    } catch (error) {
      logError('Failed to get trending products', error as Error);
      return [];
    }
  }

  async enhancedSearch(
    query: string,
    options: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      condition?: string;
      page?: number;
      limit?: number;
      userId?: string;
    } = {}
  ): Promise<{
    products: Product[];
    total: number;
    suggestions: string[];
  }> {
    try {
      const { page = 1, limit = 20, userId } = options;
      const offset = (page - 1) * limit;

      let queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.subcategory', 'subcategory');

      if (query) {
        queryBuilder = queryBuilder.where(
          '(product.name ILIKE :query OR product.description ILIKE :query)',
          { query: `%${query}%` }
        );
      }

      if (options.category) {
        queryBuilder = queryBuilder.andWhere('category.name ILIKE :category', {
          category: `%${options.category}%`,
        });
      }

      if (options.minPrice) {
        queryBuilder = queryBuilder.andWhere('product.price >= :minPrice', {
          minPrice: options.minPrice,
        });
      }

      if (options.maxPrice) {
        queryBuilder = queryBuilder.andWhere('product.price <= :maxPrice', {
          maxPrice: options.maxPrice,
        });
      }

      if (options.condition) {
        queryBuilder = queryBuilder.andWhere('product.condition = :condition', {
          condition: options.condition,
        });
      }

      const total = await queryBuilder.getCount();

      const products = await queryBuilder
        .orderBy('product.createdAt', 'DESC')
        .skip(offset)
        .take(limit)
        .getMany();

      await this.saveSearchQuery(userId, query, total);

      const suggestions = await this.getSearchSuggestions(query, 5);

      return { products, total, suggestions };
    } catch (error) {
      logError('Enhanced search failed', error as Error);
      return { products: [], total: 0, suggestions: [] };
    }
  }

  async clearSearchHistory(userId: string): Promise<void> {
    try {
      await this.searchHistoryRepository.delete({ userId });
      logInfo(`Search history cleared for user ${userId}`);
    } catch (error) {
      logError('Failed to clear search history', error as Error);
    }
  }

  async clearRecentlyViewed(userId: string): Promise<void> {
    try {
      await this.recentlyViewedRepository.delete({ userId });
      logInfo(`Recently viewed cleared for user ${userId}`);
    } catch (error) {
      logError('Failed to clear recently viewed', error as Error);
    }
  }
}

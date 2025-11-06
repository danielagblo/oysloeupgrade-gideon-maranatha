import type { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Category } from '../entities/Category.js';
import { Favorite } from '../entities/Favorite.js';
import { Feature } from '../entities/Feature.js';
import { Product } from '../entities/Product.js';
import { ProductFeature } from '../entities/ProductFeature.js';
import { Review } from '../entities/Review.js';
import { Subcategory } from '../entities/Subcategory.js';
import { AnalyticsService } from '../services/analytics.service.js';
import { SearchService } from '../services/search.service.js';
import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';
import { logError, logInfo } from '../utils/logger.js';
import { notificationHelper } from '../utils/notification-helper.js';

export class ProductController {
  constructor(
    private analyticsService = new AnalyticsService(),
    private searchService = new SearchService()
  ) {}

  private get productRepository() {
    return AppDataSource.getRepository(Product);
  }

  private get categoryRepository() {
    return AppDataSource.getRepository(Category);
  }

  private get subcategoryRepository() {
    return AppDataSource.getRepository(Subcategory);
  }

  private get productFeatureRepository() {
    return AppDataSource.getRepository(ProductFeature);
  }

  private get featureRepository() {
    return AppDataSource.getRepository(Feature);
  }

  private get reviewRepository() {
    return AppDataSource.getRepository(Review);
  }

  private get favoriteRepository() {
    return AppDataSource.getRepository(Favorite);
  }

  private checkDataSourceInitialized(res: Response, isWriteOperation = false): boolean {
    if (!AppDataSource.isInitialized) {
      if (isWriteOperation) {
        res.status(503).json({
          success: false,
          message: 'Service temporarily unavailable',
        });
      }
      return false;
    }
    return true;
  }

  async createProduct(req: Request, res: Response) {
    try {
      if (!this.checkDataSourceInitialized(res, true)) {
        return;
      }

      const productData = this.extractProductData(req.validated?.body || req.body);
      this.validateProductData(productData);

      await this.validateCategories(
        productData.categoryId as string | undefined,
        productData.subcategoryId as string | undefined
      );

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const product = await this.createProductRecord(req.user.id, productData);
      await this.addProductFeatures(product.id, (productData.features as string[]) || []);

      logInfo(`Product ${product.id} created by user ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product: this.formatProductResponse(product) },
      });
    } catch (error) {
      this.handleProductError(res, error, 'creating product');
    }
  }

  async getProducts(req: Request, res: Response) {
    try {
      if (!this.checkDataSourceInitialized(res, false)) {
        res.json({
          success: true,
          data: {
            products: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              pages: 0,
            },
          },
        });
        return;
      }

      const {
        page = 1,
        limit = 20,
        search,
        categoryId,
        subcategoryId,
        status = 'active',
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.user', 'user')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.subcategory', 'subcategory')
        .leftJoinAndSelect('product.images', 'image')
        .leftJoinAndSelect('product.productFeatures', 'productFeature')
        .leftJoinAndSelect('productFeature.feature', 'feature')
        .where('product.deleted = false');

      if (search) {
        queryBuilder.andWhere('(product.name ILIKE :search OR product.description ILIKE :search)', {
          search: `%${search}%`,
        });
      }

      if (categoryId) {
        queryBuilder.andWhere('product.categoryId = :categoryId', {
          categoryId,
        });
      }

      if (subcategoryId) {
        queryBuilder.andWhere('product.subcategoryId = :subcategoryId', {
          subcategoryId,
        });
      }

      if (status) {
        queryBuilder.andWhere('product.status = :status', { status });
      }

      if (minPrice) {
        queryBuilder.andWhere('product.price >= :minPrice', {
          minPrice: Number(minPrice),
        });
      }

      if (maxPrice) {
        queryBuilder.andWhere('product.price <= :maxPrice', {
          maxPrice: Number(maxPrice),
        });
      }

      const validSortFields = ['createdAt', 'price', 'name', 'viewsCount'];
      const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
      const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

      queryBuilder.orderBy(`product.${sortField}`, order);

      const [products, total] = await queryBuilder
        .skip(offset)
        .take(Number(limit))
        .getManyAndCount();

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logError('Error getting products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get products',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getProduct(req: Request, res: Response) {
    try {
      if (!this.checkDataSourceInitialized(res, false)) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      const { id } = req.params as { id: string };

      const product = await this.productRepository.findOne({
        where: { id, deleted: false },
        relations: [
          'user',
          'category',
          'subcategory',
          'images',
          'productFeatures',
          'productFeatures.feature',
          'reviews',
          'reviews.user',
        ],
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      product.viewsCount += 1;
      await this.productRepository.save(product);

      const userId = req.user?.id;
      if (userId) {
        try {
          await this.analyticsService.trackProductView(userId, id);
          await this.searchService.trackRecentlyViewed(userId, id);
        } catch (error) {
          logInfo(`Failed to track analytics: ${error}`);
        }
      }

      const reviews = Array.isArray(product.reviews) ? product.reviews : [];
      const ratingCount = reviews.length;
      const ratingAverage = ratingCount
        ? reviews.reduce((sum: number, r: Review) => sum + (r.rating || 0), 0) / ratingCount
        : 0;

      res.json({
        success: true,
        data: {
          product,
          rating: { average: ratingAverage, count: ratingCount },
        },
      });
    } catch (error) {
      this.handleProductError(res, error, 'getting product');
    }
  }

  async getRelatedProducts(req: Request, res: Response) {
    try {
      logInfo('getRelatedProducts called with query:', req.query);

      res.json({
        success: true,
        data: { products: [], total: 0 },
      });
    } catch (error) {
      logError('Error getting related products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get related products',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, price, categoryId, subcategoryId, status, features } = req.body;

      const product = await this.productRepository.findOne({
        where: { id, deleted: false },
        relations: ['productFeatures'],
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      if (product.userId !== req.user.id && !req.user.isStaff && !req.user.isSuperuser) {
        throw new ForbiddenError('You can only update your own products');
      }

      if (name !== undefined) product.name = name;
      if (description !== undefined) product.description = description;
      if (price !== undefined) {
        if (price <= 0) {
          throw new BadRequestError('Price must be greater than 0');
        }
        product.price = Number(price);
      }
      if (categoryId !== undefined) product.categoryId = categoryId;
      if (subcategoryId !== undefined) product.subcategoryId = subcategoryId;
      if (status !== undefined) {
        if (!['draft', 'active', 'paused', 'archived', 'sold'].includes(status)) {
          throw new BadRequestError('Invalid status');
        }
        product.status = status;
      }

      if (features !== undefined) {
        await this.productFeatureRepository.delete({ productId: id });
        if (features.length > 0) {
          const featureRecords = features.map((featureId: string) =>
            this.productFeatureRepository.create({
              productId: id,
              featureId,
            })
          );
          await this.productFeatureRepository.save(featureRecords);
        }
      }

      await this.productRepository.save(product);

      logInfo(`Product ${id} updated by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: { product },
      });
    } catch (error) {
      this.handleProductError(res, error, 'updating product');
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await this.productRepository.findOne({
        where: { id, deleted: false },
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      if (product.userId !== req.user.id && !req.user.isStaff && !req.user.isSuperuser) {
        throw new ForbiddenError('You can only delete your own products');
      }

      product.deleted = true;
      product.deletedAt = new Date();

      await this.productRepository.save(product);

      logInfo(`Product ${id} deleted by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      this.handleProductError(res, error, 'deleting product');
    }
  }

  async getCategories(_req: Request, res: Response) {
    try {
      if (!this.checkDataSourceInitialized(res, false)) {
        res.json({
          success: true,
          data: { categories: [] },
        });
        return;
      }

      const categories = await this.categoryRepository.find({
        where: { archived: false },
        relations: ['subcategories'],
        order: { displayOrder: 'ASC', name: 'ASC' },
      });

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      logError('Error getting categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get categories',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getFeatures(req: Request, res: Response) {
    try {
      const { subcategoryId } = req.params;

      const features = await this.featureRepository.find({
        where: { subcategoryId },
        order: { name: 'ASC' },
      });

      res.json({
        success: true,
        data: { features },
      });
    } catch (error) {
      logError('Error getting features:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get features',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private extractProductData(body: Record<string, unknown>) {
    const { name, description, price, categoryId, subcategoryId, features = [] } = body;
    return { name, description, price, categoryId, subcategoryId, features };
  }

  private validateProductData(data: Record<string, unknown>) {
    if (!data.name || !data.description || !data.price) {
      throw new BadRequestError('Name, description, and price are required');
    }
    const price = Number(data.price);
    if (Number.isNaN(price) || price <= 0) {
      throw new BadRequestError('Price must be a valid number greater than 0');
    }
  }

  private async validateCategories(categoryId?: string, subcategoryId?: string): Promise<void> {
    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId, archived: false },
      });
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    if (subcategoryId) {
      const subcategory = await this.subcategoryRepository.findOne({
        where: { id: subcategoryId, archived: false },
      });
      if (!subcategory) {
        throw new NotFoundError('Subcategory not found');
      }
    }
  }

  private async createProductRecord(
    userId: string,
    data: Record<string, unknown>
  ): Promise<Product> {
    const product = this.productRepository.create({
      userId,
      name: data.name as string,
      description: data.description as string,
      price: Number(data.price),
      categoryId: (data.categoryId as string) || undefined,
      subcategoryId: (data.subcategoryId as string) || undefined,
      status: 'draft' as const,
    });

    return await this.productRepository.save(product);
  }

  private async addProductFeatures(productId: string, features: string[]): Promise<void> {
    if (features.length === 0) return;

    const featureRecords = features.map((featureId: string) =>
      this.productFeatureRepository.create({
        productId,
        featureId,
      })
    );
    await this.productFeatureRepository.save(featureRecords);
  }

  private formatProductResponse(product: Product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      status: product.status,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      createdAt: product.createdAt,
    };
  }

  async createReview(req: Request, res: Response) {
    try {
      const { productId, rating, comment } = req.validated?.body || req.body;

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const product = await this.productRepository.findOne({
        where: { id: productId, deleted: false },
        relations: ['user'],
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      const existingReview = await this.reviewRepository.findOne({
        where: { productId, userId: req.user.id },
      });

      if (existingReview) {
        throw new ConflictError('You have already reviewed this product');
      }

      const review = this.reviewRepository.create({
        productId,
        userId: req.user.id,
        rating,
        comment,
      });

      const savedReview = await this.reviewRepository.save(review);

      if (product.user && product.userId !== req.user.id) {
        try {
          await notificationHelper.notifyProductReview(
            product.userId,
            product.id,
            product.name,
            rating,
            req.user.id
          );
        } catch (error) {
          logInfo(`Failed to send review notification: ${error}`);
        }
      }

      logInfo(`Review created for product ${productId} by user ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: { review: savedReview },
      });
    } catch (error) {
      this.handleProductError(res, error, 'creating review');
    }
  }

  async updateReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.validated?.body || req.body;

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const review = await this.reviewRepository.findOne({
        where: { id },
        relations: ['product'],
      });

      if (!review) {
        throw new NotFoundError('Review not found');
      }

      if (review.userId !== req.user.id) {
        throw new ForbiddenError('You can only update your own reviews');
      }

      if (rating !== undefined) review.rating = rating;
      if (comment !== undefined) review.comment = comment;

      const updatedReview = await this.reviewRepository.save(review);

      logInfo(`Review ${id} updated by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Review updated successfully',
        data: { review: updatedReview },
      });
    } catch (error) {
      this.handleProductError(res, error, 'updating review');
    }
  }

  async deleteReview(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const review = await this.reviewRepository.findOne({
        where: { id },
      });

      if (!review) {
        throw new NotFoundError('Review not found');
      }

      if (review.userId !== req.user.id) {
        throw new ForbiddenError('You can only delete your own reviews');
      }

      await this.reviewRepository.remove(review);

      logInfo(`Review ${id} deleted by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error) {
      this.handleProductError(res, error, 'deleting review');
    }
  }

  async listProductReviews(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const { page = 1, limit = 20 } = req.query as {
        page?: string | number;
        limit?: string | number;
      };

      const offset = (Number(page) - 1) * Number(limit);

      const [items, total] = await this.reviewRepository
        .createQueryBuilder('review')
        .leftJoinAndSelect('review.user', 'user')
        .where('review.productId = :productId', { productId: id })
        .orderBy('review.createdAt', 'DESC')
        .skip(offset)
        .take(Number(limit))
        .getManyAndCount();

      res.json({
        success: true,
        data: {
          reviews: items,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      this.handleProductError(res, error, 'listing product reviews');
    }
  }

  async markAsSold(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };

      const product = await this.productRepository.findOne({
        where: { id, deleted: false },
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      if (product.userId !== req.user.id && !req.user.isStaff && !req.user.isSuperuser) {
        throw new ForbiddenError('You can only update your own products');
      }

      product.status = 'sold' as const;
      await this.productRepository.save(product);

      res.json({
        success: true,
        message: 'Product marked as sold',
        data: { product },
      });
    } catch (error) {
      this.handleProductError(res, error, 'marking product as sold');
    }
  }

  async pauseProduct(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };

      const product = await this.productRepository.findOne({
        where: { id, deleted: false },
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      if (product.userId !== req.user.id && !req.user.isStaff && !req.user.isSuperuser) {
        throw new ForbiddenError('You can only update your own products');
      }

      product.status = 'paused' as const;
      await this.productRepository.save(product);

      res.json({
        success: true,
        message: 'Product paused',
        data: { product },
      });
    } catch (error) {
      this.handleProductError(res, error, 'pausing product');
    }
  }

  async activateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };

      const product = await this.productRepository.findOne({
        where: { id, deleted: false },
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      if (product.userId !== req.user.id && !req.user.isStaff && !req.user.isSuperuser) {
        throw new ForbiddenError('You can only update your own products');
      }

      product.status = 'active' as const;
      await this.productRepository.save(product);

      res.json({
        success: true,
        message: 'Product activated',
        data: { product },
      });
    } catch (error) {
      this.handleProductError(res, error, 'activating product');
    }
  }

  private handleProductError(res: Response, error: unknown, operation: string) {
    logError(`Error ${operation}:`, error);

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to ${operation}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async addToFavorites(req: Request, res: Response) {
    try {
      const { id: productId } = (req.validated?.params || req.params) as {
        id: string;
      };
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      const existingFavorite = await this.favoriteRepository.findOne({
        where: { userId, productId },
      });

      if (existingFavorite) {
        return res.json({
          success: true,
          message: 'Product already in favorites',
        });
      }

      const favorite = this.favoriteRepository.create({ userId, productId });
      await this.favoriteRepository.save(favorite);

      await this.productRepository.increment({ id: productId }, 'favoritesCount', 1);

      res.json({ success: true, message: 'Product added to favorites' });
    } catch (error) {
      this.handleProductError(res, error, 'adding to favorites');
    }
  }

  async removeFromFavorites(req: Request, res: Response) {
    try {
      const { id: productId } = (req.validated?.params || req.params) as {
        id: string;
      };
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      const existingFavorite = await this.favoriteRepository.findOne({
        where: { userId, productId },
      });

      if (!existingFavorite) {
        return res.json({ success: true, message: 'Product not in favorites' });
      }

      await this.favoriteRepository.delete({ userId, productId });

      await this.productRepository.decrement({ id: productId }, 'favoritesCount', 1);

      res.json({ success: true, message: 'Product removed from favorites' });
    } catch (error) {
      this.handleProductError(res, error, 'removing from favorites');
    }
  }

  async checkFavoriteStatus(req: Request, res: Response) {
    try {
      const { id: productId } = (req.validated?.params || req.params) as {
        id: string;
      };
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const favorite = await this.favoriteRepository.findOne({
        where: { userId, productId },
      });

      res.json({
        success: true,
        data: { isFavorite: !!favorite },
      });
    } catch (error) {
      this.handleProductError(res, error, 'checking favorite status');
    }
  }
}

import { BadRequestError } from "../utils/errors.js";
import { logError } from "../utils/logger.js";
import type { Request, Response } from "express";
import { AnalyticsService } from "../services/analytics.service.js";

export class AnalyticsController {
  private analyticsService = new AnalyticsService();

  async trackProductView(req: Request, res: Response) {
    try {
      const { id: productId } = (req.validated?.params ||
        req.params) as Partial<Record<string, string>>;
      const userId = req.user?.id;
      const metadata = req.validated?.body || req.body;

      await this.analyticsService.trackProductView(
        userId,
        productId as string,
        metadata
      );

      res.json({
        success: true,
        message: "Product view tracked",
      });
    } catch (error) {
      logError("Failed to track product view", error as Error);
      const statusCode = error instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message:
          error instanceof BadRequestError
            ? error.message
            : "Failed to track product view",
      });
    }
  }

  async trackProductClick(req: Request, res: Response) {
    try {
      const { id: productId } = (req.validated?.params ||
        req.params) as Partial<Record<string, string>>;
      const userId = req.user?.id;
      const metadata = req.validated?.body || req.body;

      await this.analyticsService.trackProductClick(
        userId,
        productId as string,
        metadata
      );

      res.json({
        success: true,
        message: "Product click tracked",
      });
    } catch (error) {
      logError("Failed to track product click", error as Error);
      const statusCode = error instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message:
          error instanceof BadRequestError
            ? error.message
            : "Failed to track product click",
      });
    }
  }

  async getUserEngagement(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError("User not authenticated");
      }

      const { days } = (req.validated?.query || req.query) as Partial<
        Record<string, string>
      >;
      const numDays = days ? parseInt(days as string, 10) : 30;
      if (Number.isNaN(numDays) || numDays <= 0) {
        throw new BadRequestError("Invalid days parameter");
      }

      const stats = await this.analyticsService.getUserEngagementStats(
        userId,
        numDays
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logError("Failed to get user engagement", error as Error);
      const statusCode = error instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message:
          error instanceof BadRequestError
            ? error.message
            : "Failed to get user engagement",
      });
    }
  }

  async getProductAnalytics(req: Request, res: Response) {
    try {
      const { productId, days } = (req.validated?.query ||
        req.query) as Partial<Record<string, string>>;

      if (!productId) {
        throw new BadRequestError("Product ID is required");
      }

      const numDays = days ? parseInt(days as string, 10) : 30;
      if (Number.isNaN(numDays) || numDays <= 0) {
        throw new BadRequestError("Invalid days parameter");
      }
      const analytics = await this.analyticsService.getProductAnalytics(
        productId as string,
        numDays
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logError("Failed to get product analytics", error as Error);
      const statusCode = error instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message:
          error instanceof BadRequestError
            ? error.message
            : "Failed to get product analytics",
      });
    }
  }

  async getTopProducts(req: Request, res: Response) {
    try {
      const { limit, days } = (req.validated?.query || req.query) as Partial<
        Record<string, string>
      >;

      const numLimit = limit ? parseInt(limit as string, 10) : 10;
      const numDays = days ? parseInt(days as string, 10) : 7;

      if (Number.isNaN(numLimit) || numLimit <= 0 || numLimit > 100) {
        throw new BadRequestError("Invalid limit parameter (1-100)");
      }
      if (Number.isNaN(numDays) || numDays <= 0) {
        throw new BadRequestError("Invalid days parameter");
      }

      const topProducts = await this.analyticsService.getTopProducts(
        numLimit,
        numDays
      );

      res.json({
        success: true,
        data: { products: topProducts },
      });
    } catch (error) {
      logError("Failed to get top products", error as Error);
      const statusCode = error instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message:
          error instanceof BadRequestError
            ? error.message
            : "Failed to get top products",
      });
    }
  }

  async getTrendingSearches(req: Request, res: Response) {
    try {
      const { limit, days } = (req.validated?.query || req.query) as Partial<
        Record<string, string>
      >;

      const numLimit = limit ? parseInt(limit as string, 10) : 10;
      const numDays = days ? parseInt(days as string, 10) : 7;

      if (Number.isNaN(numLimit) || numLimit <= 0 || numLimit > 100) {
        throw new BadRequestError("Invalid limit parameter (1-100)");
      }
      if (Number.isNaN(numDays) || numDays <= 0) {
        throw new BadRequestError("Invalid days parameter");
      }

      const trendingSearches =
        await this.analyticsService.getTrendingSearchTerms(numLimit, numDays);

      res.json({
        success: true,
        data: { searches: trendingSearches },
      });
    } catch (error) {
      logError("Failed to get trending searches", error as Error);
      const statusCode = error instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message:
          error instanceof BadRequestError
            ? error.message
            : "Failed to get trending searches",
      });
    }
  }
}

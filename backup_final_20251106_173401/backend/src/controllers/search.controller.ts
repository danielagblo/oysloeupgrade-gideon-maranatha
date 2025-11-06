import { BadRequestError } from "../utils/errors.js";
import { logError } from "../utils/logger.js";
import type { Request, Response } from "express";
import { SearchService } from "../services/search.service.js";

export class SearchController {
  private searchService = new SearchService();

  async getSearchSuggestions(req: Request, res: Response) {
    try {
      const { q: query, limit } = (req.validated?.query ||
        req.query) as Partial<Record<string, string>>;

      if (!query) {
        throw new BadRequestError("Query parameter 'q' is required");
      }

      const suggestions = await this.searchService.getSearchSuggestions(
        query as string,
        (() => {
          if (!limit) return 10;
          const parsed = parseInt(limit as string, 10);
          if (Number.isNaN(parsed) || parsed < 1)
            throw new BadRequestError("Invalid limit parameter");
          return parsed;
        })()
      );

      res.json({
        success: true,
        data: { suggestions },
      });
    } catch (error) {
      logError("Failed to get search suggestions", error as Error);
      if (error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          message: (error as BadRequestError).message,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Failed to get search suggestions",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getSearchHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError("User not authenticated");
      }

      const { limit } = (req.validated?.query || req.query) as Partial<
        Record<string, string>
      >;

      const history = await this.searchService.getSearchHistory(
        userId,
        (() => {
          if (!limit) return 20;
          const parsed = parseInt(limit as string, 10);
          if (Number.isNaN(parsed) || parsed < 1)
            throw new BadRequestError("Invalid limit parameter");
          return parsed;
        })()
      );

      res.json({
        success: true,
        data: { history },
      });
    } catch (error) {
      logError("Failed to get search history", error as Error);
      if (error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          message: (error as BadRequestError).message,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Failed to get search history",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getRecentlyViewed(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError("User not authenticated");
      }

      const { limit } = (req.validated?.query || req.query) as Partial<
        Record<string, string>
      >;

      const products = await this.searchService.getRecentlyViewed(
        userId,
        (() => {
          if (!limit) return 20;
          const parsed = parseInt(limit as string, 10);
          if (Number.isNaN(parsed) || parsed < 1)
            throw new BadRequestError("Invalid limit parameter");
          return parsed;
        })()
      );

      res.json({
        success: true,
        data: { products },
      });
    } catch (error) {
      logError("Failed to get recently viewed", error as Error);
      if (error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          message: (error as BadRequestError).message,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Failed to get recently viewed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getTrending(req: Request, res: Response) {
    try {
      const { limit } = (req.validated?.query || req.query) as Partial<
        Record<string, string>
      >;

      const products = await this.searchService.getTrendingProducts(
        limit ? parseInt(limit as string, 10) : 10
      );

      res.json({
        success: true,
        data: { products },
      });
    } catch (error) {
      logError("Failed to get trending products", error as Error);
      res.status(500).json({
        success: false,
        message: "Failed to get trending products",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async enhancedSearch(req: Request, res: Response) {
    try {
      const {
        q: query,
        category,
        minPrice,
        maxPrice,
        condition,
        page,
        limit,
      } = (req.validated?.query || req.query) as Partial<
        Record<string, string>
      >;

      if (!query) {
        throw new BadRequestError("Query parameter 'q' is required");
      }

      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;

      if (
        (page && Number.isNaN(pageNum)) ||
        (limit && Number.isNaN(limitNum))
      ) {
        throw new BadRequestError("Invalid page or limit parameter");
      }

      const minPriceNum = minPrice ? parseFloat(minPrice as string) : undefined;
      const maxPriceNum = maxPrice ? parseFloat(maxPrice as string) : undefined;

      if (
        (typeof minPriceNum === "number" && Number.isNaN(minPriceNum)) ||
        (typeof maxPriceNum === "number" && Number.isNaN(maxPriceNum))
      ) {
        throw new BadRequestError("Invalid price parameter");
      }

      const result = await this.searchService.enhancedSearch(query as string, {
        category: category as string,
        minPrice: minPriceNum,
        maxPrice: maxPriceNum,
        condition: condition as string,
        page: pageNum,
        limit: limitNum,
        userId: req.user?.id,
      });

      res.json({
        success: true,
        data: {
          ...result,
          page: pageNum,
          limit: limitNum,
        },
      });
    } catch (error) {
      logError("Enhanced search failed", error as Error);
      if (error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          message: (error as BadRequestError).message,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Search failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async clearSearchHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError("User not authenticated");
      }

      await this.searchService.clearSearchHistory(userId);

      res.json({
        success: true,
        message: "Search history cleared",
      });
    } catch (error) {
      logError("Failed to clear search history", error as Error);
      if (error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          message: (error as BadRequestError).message,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Failed to clear search history",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async clearRecentlyViewed(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError("User not authenticated");
      }

      await this.searchService.clearRecentlyViewed(userId);

      res.json({
        success: true,
        message: "Recently viewed cleared",
      });
    } catch (error) {
      logError("Failed to clear recently viewed", error as Error);
      if (error instanceof BadRequestError) {
        res.status(400).json({
          success: false,
          message: (error as BadRequestError).message,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Failed to clear recently viewed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

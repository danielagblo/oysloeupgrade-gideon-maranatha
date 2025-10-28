import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { SearchController } from "../controllers/search.controller.js";

const router = Router();
const searchController = new SearchController();

const getSearchSuggestionsSchema = z.object({
  query: z.object({
    q: z.string().min(1).describe("Search query"),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe("Number of suggestions to return"),
  }),
});

const getSearchHistorySchema = z.object({
  query: z.object({
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe("Number of history items to return"),
  }),
});

const getRecentlyViewedSchema = z.object({
  query: z.object({
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe("Number of products to return"),
  }),
});

const getTrendingSchema = z.object({
  query: z.object({
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe("Number of trending products to return"),
  }),
});

const enhancedSearchSchema = z.object({
  query: z.object({
    q: z.string().min(1).describe("Search query"),
    category: z.string().optional().describe("Category filter"),
    minPrice: z.coerce
      .number()
      .nonnegative()
      .optional()
      .describe("Minimum price filter"),
    maxPrice: z.coerce
      .number()
      .nonnegative()
      .optional()
      .describe("Maximum price filter"),
    condition: z.string().optional().describe("Product condition filter"),
    page: z.coerce.number().int().positive().optional().describe("Page number"),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe("Number of results per page"),
  }),
});

router.get(
  "/suggestions",
  validateRequest(getSearchSuggestionsSchema),
  searchController.getSearchSuggestions.bind(searchController)
);

router.get(
  "/enhanced",
  validateRequest(enhancedSearchSchema),
  searchController.enhancedSearch.bind(searchController)
);

router.get(
  "/history",
  authenticate,
  validateRequest(getSearchHistorySchema),
  searchController.getSearchHistory.bind(searchController)
);

router.get(
  "/recently-viewed",
  authenticate,
  validateRequest(getRecentlyViewedSchema),
  searchController.getRecentlyViewed.bind(searchController)
);

router.get(
  "/trending",
  validateRequest(getTrendingSchema),
  searchController.getTrending.bind(searchController)
);

router.delete(
  "/history",
  authenticate,
  searchController.clearSearchHistory.bind(searchController)
);

router.delete(
  "/recently-viewed",
  authenticate,
  searchController.clearRecentlyViewed.bind(searchController)
);

export default router;

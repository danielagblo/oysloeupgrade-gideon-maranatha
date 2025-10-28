import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { AnalyticsController } from "../controllers/analytics.controller.js";

const router = Router();
const analyticsController = new AnalyticsController();

const trackProductViewSchema = z.object({
  params: z.object({
    id: z.string().uuid().describe("Product ID"),
  }),
  body: z.record(z.unknown()).optional().describe("Additional metadata"),
});

const trackProductClickSchema = z.object({
  params: z.object({
    id: z.string().uuid().describe("Product ID"),
  }),
  body: z.record(z.unknown()).optional().describe("Additional metadata"),
});

const getUserEngagementSchema = z.object({
  query: z.object({
    days: z.string().optional().describe("Number of days to analyze"),
  }),
});

const getProductAnalyticsSchema = z.object({
  query: z.object({
    productId: z.string().uuid().describe("Product ID"),
    days: z.string().optional().describe("Number of days to analyze"),
  }),
});

const getTopProductsSchema = z.object({
  query: z.object({
    limit: z.string().optional().describe("Number of products to return"),
    days: z.string().optional().describe("Number of days to analyze"),
  }),
});

const getTrendingSearchesSchema = z.object({
  query: z.object({
    limit: z.string().optional().describe("Number of search terms to return"),
    days: z.string().optional().describe("Number of days to analyze"),
  }),
});

router.post(
  "/products/:id/track-view",
  validateRequest(trackProductViewSchema),
  analyticsController.trackProductView.bind(analyticsController)
);

router.post(
  "/products/:id/track-click",
  validateRequest(trackProductClickSchema),
  analyticsController.trackProductClick.bind(analyticsController)
);

router.get(
  "/user-engagement",
  authenticate,
  validateRequest(getUserEngagementSchema),
  analyticsController.getUserEngagement.bind(analyticsController)
);

router.get(
  "/products",
  validateRequest(getProductAnalyticsSchema),
  analyticsController.getProductAnalytics.bind(analyticsController)
);

router.get(
  "/top-products",
  validateRequest(getTopProductsSchema),
  analyticsController.getTopProducts.bind(analyticsController)
);

router.get(
  "/trending-searches",
  validateRequest(getTrendingSearchesSchema),
  analyticsController.getTrendingSearches.bind(analyticsController)
);

export default router;

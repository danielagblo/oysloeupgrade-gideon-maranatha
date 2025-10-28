import { z } from "zod";

export const userEngagementAnalyticsSchema = z.object({
  totalEvents: z.number().int().min(0),
  productViews: z.number().int().min(0),
  productClicks: z.number().int().min(0),
  searches: z.number().int().min(0),
  favoritesAdded: z.number().int().min(0),
  reviewsCreated: z.number().int().min(0),
  recentActivity: z.array(
    z.object({
      id: z.string().uuid(),
      eventType: z.string(),
      entityType: z.string(),
      entityId: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
      createdAt: z.date(),
    })
  ),
});

export const productAnalyticsSchema = z.object({
  totalViews: z.number().int().min(0),
  totalClicks: z.number().int().min(0),
  uniqueViewers: z.number().int().min(0),
  conversionRate: z.number().min(0).max(100),
  recentActivity: z.array(
    z.object({
      id: z.string().uuid(),
      eventType: z.string(),
      userId: z.string().uuid().optional(),
      createdAt: z.date(),
    })
  ),
});

export const trackProductViewSchema = z.object({
  params: z.object({
    id: z.string().uuid().describe("Product ID"),
  }),
  body: z.record(z.unknown()).optional().describe("Additional metadata"),
});

export const trackProductClickSchema = z.object({
  params: z.object({
    id: z.string().uuid().describe("Product ID"),
  }),
  body: z.record(z.unknown()).optional().describe("Additional metadata"),
});

export const getUserEngagementSchema = z.object({
  query: z.object({
    days: z.string().optional().describe("Number of days to analyze"),
  }),
});

export const getProductAnalyticsSchema = z.object({
  query: z.object({
    productId: z.string().uuid().describe("Product ID"),
    days: z.string().optional().describe("Number of days to analyze"),
  }),
});

export const getTopProductsSchema = z.object({
  query: z.object({
    limit: z.string().optional().describe("Number of products to return"),
    days: z.string().optional().describe("Number of days to analyze"),
  }),
});

export const getTrendingSearchesSchema = z.object({
  query: z.object({
    limit: z.string().optional().describe("Number of search terms to return"),
    days: z.string().optional().describe("Number of days to analyze"),
  }),
});

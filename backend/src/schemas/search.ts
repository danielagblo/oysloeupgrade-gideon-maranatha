import { z } from "zod";

export const searchHistoryItemSchema = z.object({
  id: z.string().uuid(),
  query: z.string(),
  resultsCount: z.number().int().min(0),
  createdAt: z.date(),
});

export const searchSuggestionSchema = z.object({
  suggestions: z.array(z.string()),
});

export const enhancedSearchResponseSchema = z.object({
  products: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      description: z.string(),
      price: z.number().min(0),
      currency: z.string(),
      condition: z.string(),
      status: z.string(),
      images: z.array(
        z.object({
          id: z.string().uuid(),
          url: z.string(),
          altText: z.string().optional(),
        })
      ),
    })
  ),
  total: z.number().int().min(0),
  suggestions: z.array(z.string()),
});

export const getSearchSuggestionsSchema = z.object({
  query: z.object({
    q: z.string().min(1).describe("Search query"),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe("Number of suggestions"),
  }),
});

export const getSearchHistorySchema = z.object({
  query: z.object({
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe("Number of history items"),
  }),
});

export const getRecentlyViewedSchema = z.object({
  query: z.object({
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe("Number of products"),
  }),
});

export const getTrendingSchema = z.object({
  query: z.object({
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe("Number of trending products"),
  }),
});

export const enhancedSearchSchema = z.object({
  query: z.object({
    q: z.string().min(1).describe("Search query"),
    category: z.string().optional().describe("Category filter"),
    minPrice: z.coerce.number().min(0).optional().describe("Minimum price"),
    maxPrice: z.coerce.number().min(0).optional().describe("Maximum price"),
    condition: z.string().optional().describe("Product condition"),
    page: z.coerce.number().int().positive().optional().describe("Page number"),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe("Results per page"),
  }),
});

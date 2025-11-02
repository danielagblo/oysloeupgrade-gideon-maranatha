import type { Request, Response, NextFunction } from "express";
import { AdminSearchService } from "../services/admin-search.service.js";
import { GlobalSearchQuerySchema, FilterRequestSchema } from "../schemas/admin.js";

type GlobalSearchQuery = Zod.infer<typeof GlobalSearchQuerySchema>;
type FilterRequest = Zod.infer<typeof FilterRequestSchema>;

const searchService = new AdminSearchService();

export const globalSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query: GlobalSearchQuery = GlobalSearchQuerySchema.parse(req.query);
    const result = await searchService.globalSearch(query);

    res.json({
      success: true,
      data: {
        results: result.results,
        total: result.total,
        query: result.query,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const advancedFilter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body: FilterRequest = FilterRequestSchema.parse(req.body);
    const result = await searchService.advancedFilter(
      body.filters,
      body.sort,
      body.page,
      body.limit
    );

    res.json({
      success: true,
      data: {
        data: result.data,
        total: result.total,
        filters: result.filters,
        appliedFilters: result.appliedFilters,
      },
    });
  } catch (error) {
    next(error);
  }
};



import type { Request, Response, NextFunction } from "express";
import { AdminCategoriesService } from "../services/admin-categories.service.js";
import { CreateCategorySchema, UpdateCategorySchema, CreateSubcategorySchema, UpdateSubcategorySchema } from "../schemas/admin.js";

const categoriesService = new AdminCategoriesService();

export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await categoriesService.getCategories();

    res.json({
      success: true,
      data: {
        categories: result.categories,
        hierarchy: result.hierarchy,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = CreateCategorySchema.parse(req.body);
    const category = await categoriesService.createCategory({
      ...body,
      iconUrl: req.file?.url,
    });

    res.json({
      success: true,
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryId = req.params.id;
    const body = UpdateCategorySchema.parse(req.body);
    const category = await categoriesService.updateCategory(categoryId, {
      ...body,
      iconUrl: req.file?.url,
    });

    res.json({
      success: true,
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const createSubcategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryId = req.params.id;
    const body = CreateSubcategorySchema.parse(req.body);
    const subcategory = await categoriesService.createSubcategory(categoryId, body);

    res.json({
      success: true,
      data: { subcategory },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubcategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryId = req.params.catId;
    const subcategoryId = req.params.subId;
    const body = UpdateSubcategorySchema.parse(req.body);
    const subcategory = await categoriesService.updateSubcategory(
      categoryId,
      subcategoryId,
      body
    );

    res.json({
      success: true,
      data: { subcategory },
    });
  } catch (error) {
    next(error);
  }
};


import type { NextFunction, Request, Response } from 'express';
import {
  CreateCategorySchema,
  CreateSubcategorySchema,
  UpdateCategorySchema,
  UpdateSubcategorySchema,
} from '../schemas/admin.js';
import { AdminCategoriesService } from '../services/admin-categories.service.js';

const categoriesService = new AdminCategoriesService();

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
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

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
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

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
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

export const createSubcategory = async (req: Request, res: Response, next: NextFunction) => {
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

export const updateSubcategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoryId = req.params.catId;
    const subcategoryId = req.params.subId;
    const body = UpdateSubcategorySchema.parse(req.body);
    const subcategory = await categoriesService.updateSubcategory(categoryId, subcategoryId, body);

    res.json({
      success: true,
      data: { subcategory },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoryId = req.params.id;
    const result = await categoriesService.deleteCategory(categoryId);

    req.oldValues = { categoryId };
    req.newValues = { deleted: true };

    res.json({
      success: true,
      data: result,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubcategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoryId = req.params.catId;
    const subcategoryId = req.params.subId;
    const result = await categoriesService.deleteSubcategory(categoryId, subcategoryId);

    req.oldValues = { categoryId, subcategoryId };
    req.newValues = { deleted: true };

    res.json({
      success: true,
      data: result,
      message: 'Subcategory deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFeature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoryId = req.params.catId;
    const subcategoryId = req.params.subId;
    const featureId = req.params.featureId;
    const result = await categoriesService.deleteFeature(categoryId, subcategoryId, featureId);

    req.oldValues = { categoryId, subcategoryId, featureId };
    req.newValues = { deleted: true };

    res.json({
      success: true,
      data: result,
      message: 'Feature deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const reorderCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orders } = req.body;
    
    if (!Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: orders must be an array',
        error: { code: 'INVALID_INPUT' },
      });
    }

    const result = await categoriesService.reorderCategories(orders);

    res.json({
      success: true,
      data: result,
      message: `Successfully reordered ${result.updated} categories`,
    });
  } catch (error) {
    next(error);
  }
};

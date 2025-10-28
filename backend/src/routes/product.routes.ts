import { Router } from "express";
import { z } from "zod";
import { ProductController } from "../controllers/product.controller.js";
import { authenticate, optionalAuth } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";

const router = Router();
const productController = new ProductController();

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(2000),
    price: z.number().positive(),
    categoryId: z.string().uuid().optional(),
    subcategoryId: z.string().uuid().optional(),
    features: z.array(z.string().uuid()).optional(),
  }),
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().min(1).max(2000).optional(),
    price: z.number().positive().optional(),
    categoryId: z.string().uuid().optional(),
    subcategoryId: z.string().uuid().optional(),
    status: z
      .enum(["draft", "active", "paused", "archived", "sold"])
      .optional(),
    features: z.array(z.string().uuid()).optional(),
  }),
});

const getProductsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    subcategoryId: z.string().uuid().optional(),
    status: z
      .enum(["draft", "active", "paused", "archived", "sold"])
      .optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    sortBy: z.enum(["createdAt", "price", "name", "viewsCount"]).optional(),
    sortOrder: z.enum(["ASC", "DESC"]).optional(),
  }),
});

const getProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const updateProductParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const deleteProductParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const _uploadImagesParamsSchema = z.object({
  params: z.object({
    productId: z.string().uuid(),
  }),
});

const _deleteImageParamsSchema = z.object({
  params: z.object({
    productId: z.string().uuid(),
    imageId: z.string().uuid(),
  }),
});

const getFeaturesParamsSchema = z.object({
  params: z.object({
    subcategoryId: z.string().uuid(),
  }),
});

const getRelatedProductsSchema = z.object({
  query: z.object({
    categoryId: z.string().uuid().optional(),
  }),
});

router.post(
  "/",
  authenticate,
  validateRequest(createProductSchema),
  productController.createProduct.bind(productController)
);

router.get(
  "/",
  optionalAuth,
  validateRequest(getProductsSchema),
  productController.getProducts.bind(productController)
);

router.get(
  "/categories",
  productController.getCategories.bind(productController)
);

router.get(
  "/features/:subcategoryId",
  validateRequest(getFeaturesParamsSchema),
  productController.getFeatures.bind(productController)
);

router.get(
  "/related",
  optionalAuth,
  validateRequest(getRelatedProductsSchema),
  productController.getRelatedProducts.bind(productController)
);

router.get(
  "/:id",
  optionalAuth,
  validateRequest(getProductSchema),
  productController.getProduct.bind(productController)
);

router.put(
  "/:id",
  authenticate,
  validateRequest(updateProductSchema),
  validateRequest(updateProductParamsSchema),
  productController.updateProduct.bind(productController)
);

router.delete(
  "/:id",
  authenticate,
  validateRequest(deleteProductParamsSchema),
  productController.deleteProduct.bind(productController)
);

const favoriteParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

router.post(
  "/:id/favorite",
  authenticate,
  validateRequest(favoriteParamsSchema),
  productController.addToFavorites.bind(productController)
);

router.delete(
  "/:id/favorite",
  authenticate,
  validateRequest(favoriteParamsSchema),
  productController.removeFromFavorites.bind(productController)
);

router.get(
  "/:id/is-favorite",
  authenticate,
  validateRequest(favoriteParamsSchema),
  productController.checkFavoriteStatus.bind(productController)
);

export default router;

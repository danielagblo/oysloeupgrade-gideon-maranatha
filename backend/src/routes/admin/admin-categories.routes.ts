import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  createSubcategory,
  updateSubcategory,
} from "../../controllers/admin-categories.controller.js";
import {
  requireAdminPermissions,
  auditLog,
} from "../../middlewares/admin.middleware.js";

const router = Router();

// GET /api-v1/admin/categories
router.get(
  "/",
  requireAdminPermissions("content:manage"),
  getCategories
);

// POST /api-v1/admin/categories
router.post(
  "/",
  requireAdminPermissions("content:manage"),
  auditLog("create_category", "category"),
  createCategory
);

// PUT /api-v1/admin/categories/:id
router.put(
  "/:id",
  requireAdminPermissions("content:manage"),
  auditLog("update_category", "category"),
  updateCategory
);

// POST /api-v1/admin/categories/:id/subcategories
router.post(
  "/:id/subcategories",
  requireAdminPermissions("content:manage"),
  auditLog("create_subcategory", "subcategory"),
  createSubcategory
);

// PUT /api-v1/admin/categories/:catId/subcategories/:subId
router.put(
  "/:catId/subcategories/:subId",
  requireAdminPermissions("content:manage"),
  auditLog("update_subcategory", "subcategory"),
  updateSubcategory
);

export default router;


import { Router } from 'express';
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteFeature,
  deleteSubcategory,
  getCategories,
  reorderCategories,
  updateCategory,
  updateSubcategory,
} from '../../controllers/admin-categories.controller.js';
import { auditLog, requireAdminPermissions } from '../../middlewares/admin.middleware.js';

const router = Router();

router.get('/', requireAdminPermissions('content:manage'), getCategories);

router.post(
  '/',
  requireAdminPermissions('content:manage'),
  auditLog('create_category', 'category'),
  createCategory
);

router.put(
  '/:id',
  requireAdminPermissions('content:manage'),
  auditLog('update_category', 'category'),
  updateCategory
);

router.post(
  '/:id/subcategories',
  requireAdminPermissions('content:manage'),
  auditLog('create_subcategory', 'subcategory'),
  createSubcategory
);

router.put(
  '/:catId/subcategories/:subId',
  requireAdminPermissions('content:manage'),
  auditLog('update_subcategory', 'subcategory'),
  updateSubcategory
);

router.put(
  '/reorder',
  requireAdminPermissions('content:manage'),
  auditLog('reorder_categories', 'category'),
  reorderCategories
);

router.delete(
  '/:id',
  requireAdminPermissions('content:manage'),
  auditLog('delete_category', 'category'),
  deleteCategory
);

router.delete(
  '/:catId/subcategories/:subId',
  requireAdminPermissions('content:manage'),
  auditLog('delete_subcategory', 'subcategory'),
  deleteSubcategory
);

router.delete(
  '/:catId/subcategories/:subId/features/:featureId',
  requireAdminPermissions('content:manage'),
  auditLog('delete_feature', 'feature'),
  deleteFeature
);

export default router;




import { Router } from 'express';
import {
  createCategory,
  createSubcategory,
  getCategories,
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

export default router;




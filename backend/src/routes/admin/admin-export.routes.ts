import { Router } from 'express';
import {
  exportAds,
  exportReports,
  exportSupport,
  exportUsers,
} from '../../controllers/admin-export.controller.js';
import { requireAdminPermissions } from '../../middlewares/admin.middleware.js';

const router = Router();

// GET /api-v1/admin/export/users
router.get('/users', requireAdminPermissions('system:reports'), exportUsers);

// GET /api-v1/admin/export/ads
router.get('/ads', requireAdminPermissions('system:reports'), exportAds);

// GET /api-v1/admin/export/support
router.get('/support', requireAdminPermissions('system:reports'), exportSupport);

// GET /api-v1/admin/export/reports
router.get('/reports', requireAdminPermissions('system:reports'), exportReports);

export default router;

import { Router } from "express";
import {
  getDashboardOverview,
  getUserAnalytics,
  getAdsAnalytics,
  getRevenueAnalytics,
  getSupportAnalytics,
} from "../../controllers/admin-analytics.controller.js";
import {
  requireAdminPermissions
} from "../../middlewares/admin.middleware.js";

const router = Router();

// GET /api-v1/admin/analytics/overview
router.get('/overview',
  requireAdminPermissions('system:reports'),
  getDashboardOverview
);

// GET /api-v1/admin/analytics/users
router.get('/users',
  requireAdminPermissions('system:reports'),
  getUserAnalytics
);

// GET /api-v1/admin/analytics/ads
router.get('/ads',
  requireAdminPermissions('system:reports'),
  getAdsAnalytics
);

// GET /api-v1/admin/analytics/revenue
router.get('/revenue',
  requireAdminPermissions('system:reports'),
  getRevenueAnalytics
);

// GET /api-v1/admin/analytics/support
router.get('/support',
  requireAdminPermissions('system:reports'),
  getSupportAnalytics
);

export default router;

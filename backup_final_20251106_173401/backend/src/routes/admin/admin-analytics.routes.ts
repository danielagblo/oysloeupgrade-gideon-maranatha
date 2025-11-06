import { Router } from 'express';
import {
  getAdsAnalytics,
  getDashboardOverview,
  getRevenueAnalytics,
  getSupportAnalytics,
  getUserAnalytics,
} from '../../controllers/admin-analytics.controller.js';
import { requireAdminPermissions } from '../../middlewares/admin.middleware.js';

const router = Router();

router.get('/overview', requireAdminPermissions('system:reports'), getDashboardOverview);

router.get('/users', requireAdminPermissions('system:reports'), getUserAnalytics);

router.get('/ads', requireAdminPermissions('system:reports'), getAdsAnalytics);

router.get('/revenue', requireAdminPermissions('system:reports'), getRevenueAnalytics);

router.get('/support', requireAdminPermissions('system:reports'), getSupportAnalytics);

export default router;

import { Router } from 'express';
import { authenticateAdmin } from '../middlewares/admin.middleware.js';
import adminAdsRoutes from './admin/admin-ads.routes.js';
import adminAlertsRoutes from './admin/admin-alerts.routes.js';
import adminAnalyticsRoutes from './admin/admin-analytics.routes.js';
import adminApplicationsRoutes from './admin/admin-applications.routes.js';
// Import admin route modules
import adminAuthRoutes from './admin/admin-auth.routes.js';
import adminCategoriesRoutes from './admin/admin-categories.routes.js';
import adminExportRoutes from './admin/admin-export.routes.js';
import adminLocationsRoutes from './admin/admin-locations.routes.js';
import adminReportsRoutes from './admin/admin-reports.routes.js';
import adminSearchRoutes from './admin/admin-search.routes.js';
import adminSettingsRoutes from './admin/admin-settings.routes.js';
import adminSupportRoutes from './admin/admin-support.routes.js';
import adminUploadsRoutes from './admin/admin-uploads.routes.js';
import adminUsersRoutes from './admin/admin-users.routes.js';

const router = Router();

// Apply admin authentication to all admin routes
router.use(authenticateAdmin);

// Admin authentication routes (no auth required for login)
router.use('/auth', adminAuthRoutes);

// User management routes
router.use('/users', adminUsersRoutes);

// Ads moderation routes
router.use('/ads', adminAdsRoutes);

// Analytics routes
router.use('/analytics', adminAnalyticsRoutes);

// Support system routes
router.use('/support', adminSupportRoutes);

// Settings routes
router.use('/settings', adminSettingsRoutes);

// Reports routes
router.use('/reports', adminReportsRoutes);

// Categories management routes
router.use('/categories', adminCategoriesRoutes);

// Locations management routes
router.use('/locations', adminLocationsRoutes);

// Alerts & notifications routes
router.use('/alerts', adminAlertsRoutes);

// Applications management routes
router.use('/applications', adminApplicationsRoutes);

// Search routes
router.use('/search', adminSearchRoutes);

// Export routes
router.use('/export', adminExportRoutes);

// File upload routes
router.use('/uploads', adminUploadsRoutes);

export default router;

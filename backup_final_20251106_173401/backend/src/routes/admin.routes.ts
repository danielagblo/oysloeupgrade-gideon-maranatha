import { Router } from "express";
import { authenticateAdmin } from "../middlewares/admin.middleware.js";
import {
  adminRateLimit,
  authRateLimit,
} from "../middlewares/rate-limit.middleware.js";
import adminAdsRoutes from "./admin/admin-ads.routes.js";
import adminAlertsRoutes from "./admin/admin-alerts.routes.js";
import adminAnalyticsRoutes from "./admin/admin-analytics.routes.js";
import adminApplicationsRoutes from "./admin/admin-applications.routes.js";
import adminAuthRoutes from "./admin/admin-auth.routes.js";
import adminCategoriesRoutes from "./admin/admin-categories.routes.js";
import adminExportRoutes from "./admin/admin-export.routes.js";
import adminLocationsRoutes from "./admin/admin-locations.routes.js";
import adminReportsRoutes from "./admin/admin-reports.routes.js";
import adminSearchRoutes from "./admin/admin-search.routes.js";
import adminSettingsRoutes from "./admin/admin-settings.routes.js";
import adminSupportRoutes from "./admin/admin-support.routes.js";
import adminUploadsRoutes from "./admin/admin-uploads.routes.js";
import adminUsersRoutes from "./admin/admin-users.routes.js";

const router = Router();

router.use("/auth", adminAuthRoutes);

router.use(authenticateAdmin);

router.use(adminRateLimit);

router.use("/users", adminUsersRoutes);

router.use("/ads", adminAdsRoutes);

router.use("/analytics", adminAnalyticsRoutes);

router.use("/support", adminSupportRoutes);

router.use("/settings", adminSettingsRoutes);

router.use("/reports", adminReportsRoutes);

router.use("/categories", adminCategoriesRoutes);

router.use("/locations", adminLocationsRoutes);

router.use("/alerts", adminAlertsRoutes);

router.use("/applications", adminApplicationsRoutes);

router.use("/search", adminSearchRoutes);

router.use("/export", adminExportRoutes);

router.use("/uploads", adminUploadsRoutes);

export default router;

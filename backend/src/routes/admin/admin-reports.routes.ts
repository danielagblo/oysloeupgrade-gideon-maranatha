import { Router } from "express";
import {
  getReports,
  getReport,
  resolveReport,
  getFeedback,
} from "../../controllers/admin-reports.controller.js";
import {
  requireAdminPermissions,
  auditLog,
} from "../../middlewares/admin.middleware.js";

const router = Router();

// GET /api-v1/admin/reports
router.get(
  "/",
  requireAdminPermissions("system:reports"),
  getReports
);

// GET /api-v1/admin/reports/:id
router.get(
  "/:id",
  requireAdminPermissions("system:reports"),
  getReport
);

// PUT /api-v1/admin/reports/:id/resolve
router.put(
  "/:id/resolve",
  requireAdminPermissions("system:reports"),
  auditLog("resolve_report", "user_report"),
  resolveReport
);

// GET /api-v1/admin/feedback
router.get(
  "/feedback/list",
  requireAdminPermissions("system:reports"),
  getFeedback
);

export default router;


import { Router } from "express";
import {
  getFeedback,
  getReport,
  getReports,
  resolveReport,
} from "../../controllers/admin-reports.controller.js";
import {
  auditLog,
  requireAdminPermissions,
} from "../../middlewares/admin.middleware.js";

const router = Router();

router.get("/", requireAdminPermissions("system:reports"), getReports);

router.get("/:id", requireAdminPermissions("system:reports"), getReport);

router.put(
  "/:id/resolve",
  requireAdminPermissions("system:reports"),
  auditLog("resolve_report", "user_report"),
  resolveReport
);

router.get(
  "/feedback/list",
  requireAdminPermissions("system:reports"),
  getFeedback
);

export default router;

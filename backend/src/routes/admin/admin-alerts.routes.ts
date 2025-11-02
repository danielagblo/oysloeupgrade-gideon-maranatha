import { Router } from "express";
import {
  sendAlert,
  createCoupon,
  getAlertsHistory,
} from "../../controllers/admin-alerts.controller.js";
import {
  requireAdminPermissions,
  auditLog,
} from "../../middlewares/admin.middleware.js";

const router = Router();

// POST /api-v1/admin/alerts/send
router.post(
  "/send",
  requireAdminPermissions("system:config"),
  auditLog("send_alert", "alert"),
  sendAlert
);

// POST /api-v1/admin/alerts/coupon/create
router.post(
  "/coupon/create",
  requireAdminPermissions("system:config"),
  auditLog("create_coupon_alert", "coupon"),
  createCoupon
);

// GET /api-v1/admin/alerts/history
router.get(
  "/history",
  requireAdminPermissions("system:reports"),
  getAlertsHistory
);

export default router;



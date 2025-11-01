import { Router } from "express";
import {
  getAds,
  updateAdStatus,
  bulkUpdateAds,
  getAdsStats,
  deleteAdImage,
} from "../../controllers/admin-ads.controller.js";
import {
  requireAdminPermissions,
  auditLog,
} from "../../middlewares/admin.middleware.js";

const router = Router();

// GET /api-v1/admin/ads
router.get("/", requireAdminPermissions("ads:read"), getAds);

// GET /api-v1/admin/ads/stats
router.get("/stats", requireAdminPermissions("ads:read"), getAdsStats);

// PUT /api-v1/admin/ads/:id/status
router.put(
  "/:id/status",
  requireAdminPermissions("ads:moderate"),
  auditLog("update_ad_status", "product"),
  updateAdStatus
);

// POST /api-v1/admin/ads/bulk/status
router.post(
  "/bulk/status",
  requireAdminPermissions("ads:moderate"),
  auditLog("bulk_update_ads", "product"),
  bulkUpdateAds
);

// DELETE /api-v1/admin/ads/:id/images/:imageId
router.delete(
  "/:id/images/:imageId",
  requireAdminPermissions("ads:moderate"),
  auditLog("delete_ad_image", "product"),
  deleteAdImage
);

export default router;

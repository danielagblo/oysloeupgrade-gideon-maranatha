import { Router } from "express";
import {
  getPrivacyPolicy,
  updatePrivacyPolicy,
  getTermsConditions,
  updateTermsConditions,
} from "../../controllers/admin-settings.controller.js";
import {
  requireAdminPermissions,
  auditLog,
} from "../../middlewares/admin.middleware.js";

const router = Router();

// GET /api-v1/admin/settings/privacy-policy
router.get(
  "/privacy-policy",
  requireAdminPermissions("system:config"),
  getPrivacyPolicy
);

// PUT /api-v1/admin/settings/privacy-policy
router.put(
  "/privacy-policy",
  requireAdminPermissions("system:config"),
  auditLog("update_privacy_policy", "system_setting"),
  updatePrivacyPolicy
);

// GET /api-v1/admin/settings/terms-conditions
router.get(
  "/terms-conditions",
  requireAdminPermissions("system:config"),
  getTermsConditions
);

// PUT /api-v1/admin/settings/terms-conditions
router.put(
  "/terms-conditions",
  requireAdminPermissions("system:config"),
  auditLog("update_terms_conditions", "system_setting"),
  updateTermsConditions
);

export default router;


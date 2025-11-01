import { Router } from "express";
import { sign, confirm, destroy } from "../../modules/uploads/controller.js";
import {
  requireAdminPermissions,
} from "../../middlewares/admin.middleware.js";

const router = Router();

// POST /api-v1/admin/uploads/profile-image
router.post(
  "/profile-image",
  requireAdminPermissions("system:config"),
  sign
);

// POST /api-v1/admin/uploads/business-logo
router.post(
  "/business-logo",
  requireAdminPermissions("system:config"),
  sign
);

// POST /api-v1/admin/uploads/ad-image
router.post(
  "/ad-image",
  requireAdminPermissions("ads:moderate"),
  sign
);

// POST /api-v1/admin/uploads/support-file
router.post(
  "/support-file",
  requireAdminPermissions("support:manage"),
  sign
);

// POST /api-v1/admin/uploads/category-image
router.post(
  "/category-image",
  requireAdminPermissions("content:manage"),
  sign
);

// POST /api-v1/admin/uploads/application-doc
router.post(
  "/application-doc",
  requireAdminPermissions("content:manage"),
  sign
);

// POST /api-v1/admin/uploads/confirm
router.post(
  "/confirm",
  requireAdminPermissions("system:config"),
  confirm
);

// DELETE /api-v1/admin/uploads/:publicId
router.delete(
  "/:publicId",
  requireAdminPermissions("system:config"),
  destroy
);

export default router;


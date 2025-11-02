import { Router } from "express";
import {
  globalSearch,
  advancedFilter,
} from "../../controllers/admin-search.controller.js";
import {
  requireAdminPermissions,
} from "../../middlewares/admin.middleware.js";

const router = Router();

// GET /api-v1/admin/search
router.get(
  "/",
  requireAdminPermissions("system:reports"),
  globalSearch
);

// POST /api-v1/admin/search/filter
router.post(
  "/filter",
  requireAdminPermissions("system:reports"),
  advancedFilter
);

export default router;



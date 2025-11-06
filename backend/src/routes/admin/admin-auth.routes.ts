import { Router } from "express";
import {
  createAdmin,
  getSession,
  login,
  logout,
  refreshToken,
  verifyRole,
} from "../../controllers/admin-auth.controller.js";
import {
  auditLog,
  authenticateAdmin,
  requireAdminPermissions,
  requireSuperAdmin,
} from "../../middlewares/admin.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { authRateLimit } from "../../middlewares/rate-limit.middleware.js";
import {
  AdminLoginSchema,
  RefreshTokenSchema,
  VerifyRoleSchema,
} from "../../schemas/admin.js";

const router = Router();

router.post("/login", authRateLimit, validate(AdminLoginSchema), login);

router.use(authenticateAdmin);

router.post("/logout", logout);

router.get("/session", getSession);

router.post("/refresh-token", validate(RefreshTokenSchema), refreshToken);

router.post("/verify-role", validate(VerifyRoleSchema), verifyRole);

export default router;

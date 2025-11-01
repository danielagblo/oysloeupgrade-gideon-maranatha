import { Router } from "express";
import {
  login,
  logout,
  getSession,
  refreshToken,
  verifyRole,
  createAdmin
} from "../../controllers/admin-auth.controller.js";
import {
  authenticateAdmin,
  auditLog,
  requireAdminPermissions,
  requireSuperAdmin
} from "../../middlewares/admin.middleware.js";

const router = Router();

// POST /api-v1/admin/auth/login (no auth required)
router.post('/login', login);

// All other routes require authentication
router.use(authenticateAdmin);

// POST /api-v1/admin/auth/logout
router.post('/logout', logout);

// GET /api-v1/admin/auth/session
router.get('/session', getSession);

// POST /api-v1/admin/auth/refresh-token
router.post('/refresh-token', refreshToken);

// POST /api-v1/admin/auth/verify-role
router.post('/verify-role', verifyRole);

// POST /api-v1/admin/auth/create-admin
router.post('/create-admin',
  requireSuperAdmin,
  auditLog('create_admin', 'admin_user'),
  createAdmin
);

export default router;

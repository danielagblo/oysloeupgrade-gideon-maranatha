import { Router } from 'express';
import {
  deleteUser,
  exportUsers,
  getUser,
  getUserStats,
  getUsers,
  muteUser,
  updateUserLevel,
  verifyUser,
} from '../../controllers/admin-users.controller.js';
import { createAdmin } from '../../controllers/admin-auth.controller.js';
import { auditLog, requireAdminPermissions, requireSuperAdmin } from '../../middlewares/admin.middleware.js';

const router = Router();

router.get('/', requireAdminPermissions('user:read'), getUsers);

router.get('/stats', requireAdminPermissions('user:read'), getUserStats);

router.get('/export', requireAdminPermissions('user:read'), exportUsers);

router.get('/:id', requireAdminPermissions('user:read'), getUser);

router.post(
  '/:id/verify',
  requireAdminPermissions('user:verify'),
  auditLog('verify_user', 'user'),
  verifyUser
);

router.put(
  '/:id/level',
  requireAdminPermissions('user:update'),
  auditLog('update_user_level', 'user'),
  updateUserLevel
);

router.post(
  '/:id/mute',
  requireAdminPermissions('user:mute'),
  auditLog('mute_user', 'user'),
  muteUser
);

router.delete(
  '/:id',
  requireAdminPermissions('user:delete'),
  auditLog('delete_user', 'user'),
  deleteUser
);

router.post(
  '/admin/create',
  requireSuperAdmin,
  auditLog('create_admin', 'admin_user'),
  createAdmin
);

export default router;

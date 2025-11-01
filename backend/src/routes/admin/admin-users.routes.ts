import { Router } from "express";
import {
  getUsers,
  getUser,
  verifyUser,
  updateUserLevel,
  muteUser,
  deleteUser,
  getUserStats,
  exportUsers
} from "../../controllers/admin-users.controller.js";
import {
  requireAdminPermissions,
  auditLog
} from "../../middlewares/admin.middleware.js";

const router = Router();

// GET /api-v1/admin/users
router.get('/',
  requireAdminPermissions('user:read'),
  getUsers
);

// GET /api-v1/admin/users/stats
router.get('/stats',
  requireAdminPermissions('user:read'),
  getUserStats
);

// POST /api-v1/admin/users/export
router.post('/export',
  requireAdminPermissions('user:read'),
  exportUsers
);

// GET /api-v1/admin/users/:id
router.get('/:id',
  requireAdminPermissions('user:read'),
  getUser
);

// POST /api-v1/admin/users/:id/verify
router.post('/:id/verify',
  requireAdminPermissions('user:verify'),
  auditLog('verify_user', 'user'),
  verifyUser
);

// PUT /api-v1/admin/users/:id/level
router.put('/:id/level',
  requireAdminPermissions('user:update'),
  auditLog('update_user_level', 'user'),
  updateUserLevel
);

// POST /api-v1/admin/users/:id/mute
router.post('/:id/mute',
  requireAdminPermissions('user:mute'),
  auditLog('mute_user', 'user'),
  muteUser
);

// DELETE /api-v1/admin/users/:id
router.delete('/:id',
  requireAdminPermissions('user:delete'),
  auditLog('delete_user', 'user'),
  deleteUser
);


export default router;

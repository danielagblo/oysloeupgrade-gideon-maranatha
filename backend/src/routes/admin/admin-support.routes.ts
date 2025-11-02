import { Router } from 'express';
import {
  assignCase,
  getCase,
  getCases,
  getOnlineUsers,
  sendMessage,
  updateStatus,
} from '../../controllers/admin-support.controller.js';
import { auditLog, requireAdminPermissions } from '../../middlewares/admin.middleware.js';

const router = Router();

// GET /api-v1/admin/support/cases
router.get('/cases', requireAdminPermissions('support:read'), getCases);

// GET /api-v1/admin/support/cases/:id
router.get('/cases/:id', requireAdminPermissions('support:read'), getCase);

// POST /api-v1/admin/support/cases/:id/messages
router.post(
  '/cases/:id/messages',
  requireAdminPermissions('support:manage'),
  auditLog('send_support_message', 'support_case'),
  sendMessage
);

// PUT /api-v1/admin/support/cases/:id/status
router.put(
  '/cases/:id/status',
  requireAdminPermissions('support:manage'),
  auditLog('update_case_status', 'support_case'),
  updateStatus
);

// POST /api-v1/admin/support/cases/:id/assign
router.post(
  '/cases/:id/assign',
  requireAdminPermissions('support:manage'),
  auditLog('assign_case', 'support_case'),
  assignCase
);

// GET /api-v1/admin/support/users/online
router.get('/users/online', requireAdminPermissions('support:read'), getOnlineUsers);

export default router;

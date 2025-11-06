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

router.get('/cases', requireAdminPermissions('support:read'), getCases);

router.get('/cases/:id', requireAdminPermissions('support:read'), getCase);

router.post(
  '/cases/:id/messages',
  requireAdminPermissions('support:manage'),
  auditLog('send_support_message', 'support_case'),
  sendMessage
);

router.put(
  '/cases/:id/status',
  requireAdminPermissions('support:manage'),
  auditLog('update_case_status', 'support_case'),
  updateStatus
);

router.post(
  '/cases/:id/assign',
  requireAdminPermissions('support:manage'),
  auditLog('assign_case', 'support_case'),
  assignCase
);

router.get('/users/online', requireAdminPermissions('support:read'), getOnlineUsers);

export default router;




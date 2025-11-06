import { Router } from 'express';
import {
  downloadDocument,
  getApplication,
  getApplications,
  updateStatus,
} from '../../controllers/admin-applications.controller.js';
import { auditLog, requireAdminPermissions } from '../../middlewares/admin.middleware.js';

const router = Router();

router.get('/', requireAdminPermissions('content:manage'), getApplications);

router.get('/:id', requireAdminPermissions('content:manage'), getApplication);

router.post('/:id/download', requireAdminPermissions('content:manage'), downloadDocument);

router.put(
  '/:id/status',
  requireAdminPermissions('content:manage'),
  auditLog('update_application_status', 'job_application'),
  updateStatus
);

export default router;




import { Router } from 'express';
import {
  downloadDocument,
  getApplication,
  getApplications,
  updateStatus,
} from '../../controllers/admin-applications.controller.js';
import { auditLog, requireAdminPermissions } from '../../middlewares/admin.middleware.js';

const router = Router();

// GET /api-v1/admin/applications
router.get('/', requireAdminPermissions('content:manage'), getApplications);

// GET /api-v1/admin/applications/:id
router.get('/:id', requireAdminPermissions('content:manage'), getApplication);

// POST /api-v1/admin/applications/:id/download
router.post('/:id/download', requireAdminPermissions('content:manage'), downloadDocument);

// PUT /api-v1/admin/applications/:id/status
router.put(
  '/:id/status',
  requireAdminPermissions('content:manage'),
  auditLog('update_application_status', 'job_application'),
  updateStatus
);

export default router;


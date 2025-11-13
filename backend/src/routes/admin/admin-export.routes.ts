import { Router } from 'express';
import {
  exportAds,
  exportReports,
  exportSubscriptions,
  exportSupport,
  exportUsers,
} from '../../controllers/admin-export.controller.js';
import { requireAdminPermissions } from '../../middlewares/admin.middleware.js';

const router = Router();

router.get('/users', requireAdminPermissions('system:reports'), exportUsers);

router.get('/ads', requireAdminPermissions('system:reports'), exportAds);

router.get('/support', requireAdminPermissions('system:reports'), exportSupport);

router.get('/reports', requireAdminPermissions('system:reports'), exportReports);

router.get('/subscriptions', requireAdminPermissions('system:reports'), exportSubscriptions);

export default router;




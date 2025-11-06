import { Router } from 'express';
import {
  createCoupon,
  getAlertsHistory,
  getSelectableAds,
  getSelectableUsers,
  sendAlert,
} from '../../controllers/admin-alerts.controller.js';
import { auditLog, requireAdminPermissions } from '../../middlewares/admin.middleware.js';

const router = Router();

router.post(
  '/send',
  requireAdminPermissions('system:config'),
  auditLog('send_alert', 'alert'),
  sendAlert
);

router.post(
  '/coupon/create',
  requireAdminPermissions('system:config'),
  auditLog('create_coupon_alert', 'coupon'),
  createCoupon
);

router.get('/history', requireAdminPermissions('system:reports'), getAlertsHistory);

router.get('/users/selectable', requireAdminPermissions('system:config'), getSelectableUsers);

router.get('/ads/selectable', requireAdminPermissions('system:config'), getSelectableAds);

export default router;




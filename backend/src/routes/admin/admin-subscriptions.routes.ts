import { Router } from 'express';
import {
  getSubscription,
  getSubscriptions,
  getSubscriptionStats,
  updateSubscriptionStatus,
} from '../../controllers/admin-subscriptions.controller.js';
import {
  auditLog,
  requireAdminPermissions,
} from '../../middlewares/admin.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { UpdateSubscriptionStatusSchema } from '../../schemas/admin.js';

const router = Router();

router.get(
  '/',
  requireAdminPermissions('system:reports'),
  getSubscriptions
);

router.get(
  '/stats',
  requireAdminPermissions('system:reports'),
  getSubscriptionStats
);

router.get(
  '/:id',
  requireAdminPermissions('system:reports'),
  getSubscription
);

router.put(
  '/:id/status',
  requireAdminPermissions('system:reports'),
  validate(UpdateSubscriptionStatusSchema),
  auditLog('update_subscription_status', 'subscription'),
  updateSubscriptionStatus
);

export default router;



import { Router } from 'express';
import {
  getPrivacyPolicy,
  getTermsConditions,
  updatePrivacyPolicy,
  updateTermsConditions,
} from '../../controllers/admin-settings.controller.js';
import { auditLog, requireAdminPermissions } from '../../middlewares/admin.middleware.js';

const router = Router();

router.get('/privacy-policy', requireAdminPermissions('system:config'), getPrivacyPolicy);

router.put(
  '/privacy-policy',
  requireAdminPermissions('system:config'),
  auditLog('update_privacy_policy', 'system_setting'),
  updatePrivacyPolicy
);

router.get('/terms-conditions', requireAdminPermissions('system:config'), getTermsConditions);

router.put(
  '/terms-conditions',
  requireAdminPermissions('system:config'),
  auditLog('update_terms_conditions', 'system_setting'),
  updateTermsConditions
);

export default router;




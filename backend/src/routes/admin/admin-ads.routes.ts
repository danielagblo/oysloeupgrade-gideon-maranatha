import { Router } from 'express';
import {
  bulkUpdateAds,
  deleteAdImage,
  getAds,
  getAdsStats,
  updateAdStatus,
} from '../../controllers/admin-ads.controller.js';
import { auditLog, requireAdminPermissions } from '../../middlewares/admin.middleware.js';

const router = Router();

router.get('/', requireAdminPermissions('ads:read'), getAds);

router.get('/stats', requireAdminPermissions('ads:read'), getAdsStats);

router.put(
  '/:id/status',
  requireAdminPermissions('ads:moderate'),
  auditLog('update_ad_status', 'product'),
  updateAdStatus
);

router.post(
  '/bulk/status',
  requireAdminPermissions('ads:moderate'),
  auditLog('bulk_update_ads', 'product'),
  bulkUpdateAds
);

router.delete(
  '/:id/images/:imageId',
  requireAdminPermissions('ads:moderate'),
  auditLog('delete_ad_image', 'product'),
  deleteAdImage
);

export default router;

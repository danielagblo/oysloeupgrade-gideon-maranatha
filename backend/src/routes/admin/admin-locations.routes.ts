import { Router } from 'express';
import {
  addTown,
  createRegion,
  getLocations,
  updateTown,
} from '../../controllers/admin-locations.controller.js';
import { auditLog, requireAdminPermissions } from '../../middlewares/admin.middleware.js';

const router = Router();

// GET /api-v1/admin/locations
router.get('/', requireAdminPermissions('content:manage'), getLocations);

// POST /api-v1/admin/locations/regions
router.post(
  '/regions',
  requireAdminPermissions('content:manage'),
  auditLog('create_region', 'region'),
  createRegion
);

// POST /api-v1/admin/locations/regions/:regionId/towns
router.post(
  '/regions/:regionId/towns',
  requireAdminPermissions('content:manage'),
  auditLog('add_town', 'town'),
  addTown
);

// PUT /api-v1/admin/locations/regions/:regionId/towns/:townId
router.put(
  '/regions/:regionId/towns/:townId',
  requireAdminPermissions('content:manage'),
  auditLog('update_town', 'town'),
  updateTown
);

export default router;

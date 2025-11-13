import { Router } from 'express';
import {
  addTown,
  createRegion,
  deleteRegion,
  deleteTown,
  getLocations,
  updateTown,
} from '../../controllers/admin-locations.controller.js';
import { auditLog, requireAdminPermissions } from '../../middlewares/admin.middleware.js';

const router = Router();

router.get('/', requireAdminPermissions('content:manage'), getLocations);

router.post(
  '/regions',
  requireAdminPermissions('content:manage'),
  auditLog('create_region', 'region'),
  createRegion
);

router.post(
  '/regions/:regionId/towns',
  requireAdminPermissions('content:manage'),
  auditLog('add_town', 'town'),
  addTown
);

router.put(
  '/regions/:regionId/towns/:townId',
  requireAdminPermissions('content:manage'),
  auditLog('update_town', 'town'),
  updateTown
);

router.delete(
  '/regions/:regionId/towns/:townId',
  requireAdminPermissions('content:manage'),
  auditLog('delete_town', 'town'),
  deleteTown
);

router.delete(
  '/regions/:regionId',
  requireAdminPermissions('content:manage'),
  auditLog('delete_region', 'region'),
  deleteRegion
);

export default router;




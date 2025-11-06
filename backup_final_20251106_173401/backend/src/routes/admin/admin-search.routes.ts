import { Router } from 'express';
import { advancedFilter, globalSearch } from '../../controllers/admin-search.controller.js';
import { requireAdminPermissions } from '../../middlewares/admin.middleware.js';

const router = Router();

router.get('/', requireAdminPermissions('system:reports'), globalSearch);

router.post('/filter', requireAdminPermissions('system:reports'), advancedFilter);

export default router;




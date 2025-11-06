import { Router } from 'express';
import { requireAdminPermissions } from '../../middlewares/admin.middleware.js';
import { confirm, destroy, sign } from '../../modules/uploads/controller.js';

const router = Router();

router.post('/profile-image', requireAdminPermissions('system:config'), sign);

router.post('/business-logo', requireAdminPermissions('system:config'), sign);

router.post('/ad-image', requireAdminPermissions('ads:moderate'), sign);

router.post('/support-file', requireAdminPermissions('support:manage'), sign);

router.post('/category-image', requireAdminPermissions('content:manage'), sign);

router.post('/application-doc', requireAdminPermissions('content:manage'), sign);

router.post('/confirm', requireAdminPermissions('system:config'), confirm);

router.delete('/:publicId', requireAdminPermissions('system:config'), destroy);

export default router;




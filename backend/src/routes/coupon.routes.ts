import { Router } from 'express';
import { z } from 'zod';
import { CouponController } from '../controllers/coupon.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';

const router = Router();
const couponController = new CouponController();

const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(50),
    description: z.string().min(1).max(500),
    discountType: z.enum(['percent', 'fixed']),
    discountValue: z.number().positive(),
    minOrderAmount: z.number().positive().optional(),
    maxDiscountAmount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    validFrom: z.string().datetime(),
    validUntil: z.string().datetime(),
    isActive: z.boolean().optional(),
  }),
});

const updateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(50).optional(),
    description: z.string().min(1).max(500).optional(),
    discountType: z.enum(['percent', 'fixed']).optional(),
    discountValue: z.number().positive().optional(),
    minOrderAmount: z.number().positive().optional(),
    maxDiscountAmount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
  }),
});

const getCouponsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    isActive: z.string().optional(),
    createdBy: z.string().uuid().optional(),
  }),
});

const getCouponSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const updateCouponParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const deleteCouponParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const expireCouponParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const redeemCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    orderAmount: z.number().positive(),
    orderId: z.string().uuid().optional(),
  }),
});

const validateCouponSchema = z.object({
  query: z.object({
    code: z.string().min(1),
    orderAmount: z.string().min(1),
  }),
});

const getUserRedemptionsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

const getCouponStatsParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

router.post(
  '/',
  authenticate,
  validateRequest(createCouponSchema),
  couponController.createCoupon.bind(couponController)
);

router.get(
  '/',
  authenticate,
  validateRequest(getCouponsSchema),
  couponController.getCoupons.bind(couponController)
);

router.get(
  '/validate',
  authenticate,
  validateRequest(validateCouponSchema),
  couponController.validateCoupon.bind(couponController)
);

router.get(
  '/user/redemptions',
  authenticate,
  validateRequest(getUserRedemptionsSchema),
  couponController.getUserRedemptions.bind(couponController)
);

router.get(
  '/:id',
  authenticate,
  validateRequest(getCouponSchema),
  couponController.getCoupon.bind(couponController)
);

router.put(
  '/:id',
  authenticate,
  validateRequest(updateCouponSchema),
  validateRequest(updateCouponParamsSchema),
  couponController.updateCoupon.bind(couponController)
);

router.delete(
  '/:id',
  authenticate,
  validateRequest(deleteCouponParamsSchema),
  couponController.deleteCoupon.bind(couponController)
);

router.post(
  '/:id/expire',
  authenticate,
  validateRequest(expireCouponParamsSchema),
  couponController.expireCoupon.bind(couponController)
);

router.post(
  '/redeem',
  authenticate,
  validateRequest(redeemCouponSchema),
  couponController.redeemCoupon.bind(couponController)
);

router.get(
  '/:id/stats',
  authenticate,
  validateRequest(getCouponStatsParamsSchema),
  couponController.getCouponStats.bind(couponController)
);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { ReferralController } from '../controllers/referral.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';

const router = Router();
const referralController = new ReferralController();

const createReferralSchema = z.object({
  body: z.object({
    referrerId: z.string().uuid(),
    referredUserId: z.string().uuid(),
    referralCode: z.string().min(1),
  }),
});

const confirmReferralParamsSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
});

const redeemPointsSchema = z.object({
  body: z.object({
    points: z.number().int().positive(),
    reason: z.string().min(1).max(255).optional(),
  }),
});

const getUserReferralHistorySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

const getUserRedemptionHistorySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

const getAllReferralsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  }),
});

const cancelReferralParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const getLeaderboardSchema = z.object({
  query: z.object({
    limit: z.string().optional(),
    period: z.enum(['week', 'month', 'year', 'all']).optional(),
  }),
});

router.post(
  '/',
  authenticate,
  validateRequest(createReferralSchema),
  referralController.createReferral.bind(referralController)
);

router.post(
  '/confirm/:userId',
  authenticate,
  validateRequest(confirmReferralParamsSchema),
  referralController.confirmReferral.bind(referralController)
);

router.post(
  '/redeem',
  authenticate,
  validateRequest(redeemPointsSchema),
  asyncHandler(referralController.redeemPoints.bind(referralController))
);

router.get('/stats', authenticate, referralController.getUserStats.bind(referralController));

router.get(
  '/history',
  authenticate,
  validateRequest(getUserReferralHistorySchema),
  referralController.getUserReferralHistory.bind(referralController)
);

router.get(
  '/redemptions',
  authenticate,
  validateRequest(getUserRedemptionHistorySchema),
  referralController.getUserRedemptionHistory.bind(referralController)
);

router.get(
  '/all',
  authenticate,
  requireAdmin,
  validateRequest(getAllReferralsSchema),
  referralController.getAllReferrals.bind(referralController)
);

router.delete(
  '/:id',
  authenticate,
  validateRequest(cancelReferralParamsSchema),
  referralController.cancelReferral.bind(referralController)
);

router.get(
  '/leaderboard',
  validateRequest(getLeaderboardSchema),
  referralController.getLeaderboard.bind(referralController)
);

router.post(
  '/generate-code',
  authenticate,
  referralController.generateReferralCode.bind(referralController)
);

export default router;

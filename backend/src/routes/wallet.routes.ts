import { Router } from 'express';
import { z } from 'zod';
import { WalletController } from '../controllers/wallet.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';

const router = Router();
const walletController = new WalletController();

const transferFundsSchema = z.object({
  body: z.object({
    toUserId: z.string().uuid(),
    amount: z.number().positive(),
    reason: z.string().min(1).max(255),
  }),
});

const getTransactionsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    type: z.enum(['credit', 'debit', 'referral', 'coupon', 'purchase', 'refund']).optional(),
  }),
});

router.get('/balance', authenticate, walletController.getBalance.bind(walletController));

router.get(
  '/transactions',
  authenticate,
  validateRequest(getTransactionsSchema),
  walletController.getTransactions.bind(walletController)
);

router.get('/summary', authenticate, walletController.getSummary.bind(walletController));

router.post(
  '/transfer',
  authenticate,
  validateRequest(transferFundsSchema),
  walletController.transferFunds.bind(walletController)
);

export default router;

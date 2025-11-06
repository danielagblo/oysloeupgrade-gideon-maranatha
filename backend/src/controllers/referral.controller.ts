import type { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { ReferralService } from '../services/referral.service.js';
import { AppError, BadRequestError } from '../utils/errors.js';
import { logError } from '../utils/logger.js';

export class ReferralController {
  private referralService = new ReferralService();

  private get userRepository() {
    return AppDataSource.getRepository(User);
  }

  async createReferral(req: Request, res: Response) {
    try {
      const { referrerId, referredUserId, referralCode } = req.body;

      if (!referrerId || !referredUserId || !referralCode) {
        throw new BadRequestError('referrerId, referredUserId, and referralCode are required');
      }

      const referral = await this.referralService.createReferral({
        referrerId,
        referredUserId,
        referralCode,
      });

      res.status(201).json({
        success: true,
        message: 'Referral created successfully',
        data: { referral },
      });
    } catch (error) {
      logError('Error creating referral:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create referral',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async confirmReferral(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      if (!userId) {
        throw new BadRequestError('User ID is required');
      }

      const result = await this.referralService.confirmReferral(userId);

      res.json({
        success: true,
        message: 'Referral confirmed successfully',
        data: result,
      });
    } catch (error) {
      logError('Error confirming referral:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm referral',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async redeemPoints(req: Request, res: Response) {
    try {
      const { points, reason } = req.body;

      if (!points) {
        throw new BadRequestError('Points are required');
      }

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const result = await this.referralService.redeemPoints({
        userId: req.user.id,
        points: Number(points),
        reason,
      });

      res.json({
        success: true,
        message: 'Points redeemed successfully',
        data: result,
      });
    } catch (error) {
      logError('Error redeeming points:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: error.code,
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to redeem points',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getUserStats(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const stats = await this.referralService.getUserReferralStats(req.user.id);

      const user = await this.userRepository.findOne({
        where: { id: req.user.id },
      });

      res.json({
        success: true,
        data: {
          ...stats,
          referralCode: user?.referralCode,
        },
      });
    } catch (error) {
      logError('Error getting user referral stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get referral statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getUserReferralHistory(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const { referrals, total } = await this.referralService.getUserReferralHistory(
        req.user.id,
        Number(page),
        Number(limit)
      );

      res.json({
        success: true,
        data: {
          referrals,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logError('Error getting user referral history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get referral history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getUserRedemptionHistory(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const { redemptions, total } = await this.referralService.getUserRedemptionHistory(
        req.user.id,
        Number(page),
        Number(limit)
      );

      res.json({
        success: true,
        data: {
          redemptions,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logError('Error getting user redemption history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get redemption history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getAllReferrals(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, status } = req.query;

      const { referrals, total } = await this.referralService.getAllReferrals(
        Number(page),
        Number(limit),
        status as 'pending' | 'confirmed' | 'cancelled' | undefined
      );

      res.json({
        success: true,
        data: {
          referrals,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logError('Error getting all referrals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get referrals',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async cancelReferral(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Referral ID is required');
      }

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const referral = await this.referralService.cancelReferral(id, req.user.id);

      res.json({
        success: true,
        message: 'Referral cancelled successfully',
        data: { referral },
      });
    } catch (error) {
      logError('Error cancelling referral:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel referral',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getLeaderboard(req: Request, res: Response) {
    try {
      const { limit = 10, period = 'all' } = req.query;

      const leaderboard = await this.referralService.getReferralLeaderboard(
        Number(limit),
        period as 'week' | 'month' | 'year' | 'all' | undefined
      );

      res.json({
        success: true,
        data: { leaderboard },
      });
    } catch (error) {
      logError('Error getting referral leaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get referral leaderboard',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async generateReferralCode(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const referralCode = await this.referralService.generateReferralCode(req.user.id);

      res.json({
        success: true,
        message: 'Referral code generated successfully',
        data: { referralCode },
      });
    } catch (error) {
      logError('Error generating referral code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate referral code',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

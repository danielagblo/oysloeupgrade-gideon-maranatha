import type { Request, Response } from 'express';
import { CouponService } from '../services/coupon.service.js';
import { AppError, BadRequestError } from '../utils/errors.js';
import { logError } from '../utils/logger.js';

export class CouponController {
  private couponService = new CouponService();

  async createCoupon(req: Request, res: Response) {
    try {
      const {
        code,
        description,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        usageLimit,
        validFrom,
        validUntil,
        isActive = true,
      } = req.body;

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const coupon = await this.couponService.createCoupon(
        {
          code,
          description,
          discountType,
          discountValue,
          minOrderAmount,
          maxDiscountAmount,
          usageLimit,
          validFrom: new Date(validFrom),
          validUntil: new Date(validUntil),
          isActive,
        },
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        data: { coupon },
      });
    } catch (error) {
      logError('Error creating coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create coupon',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getCoupons(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, isActive, createdBy } = req.query;

      const { coupons, total } = await this.couponService.getCoupons(
        Number(page),
        Number(limit),
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        createdBy as string
      );

      res.json({
        success: true,
        data: {
          coupons,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logError('Error getting coupons:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get coupons',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getCoupon(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Coupon ID is required');
      }

      const coupon = await this.couponService.getCouponById(id);

      res.json({
        success: true,
        data: { coupon },
      });
    } catch (error) {
      logError('Error getting coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get coupon',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateCoupon(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Coupon ID is required');
      }
      const updates = req.body;

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const coupon = await this.couponService.updateCoupon(id, updates, req.user.id);

      res.json({
        success: true,
        message: 'Coupon updated successfully',
        data: { coupon },
      });
    } catch (error) {
      logError('Error updating coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update coupon',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteCoupon(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Coupon ID is required');
      }

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      await this.couponService.deleteCoupon(id, req.user.id);

      res.json({
        success: true,
        message: 'Coupon deleted successfully',
      });
    } catch (error) {
      logError('Error deleting coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete coupon',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async expireCoupon(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Coupon ID is required');
      }

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const coupon = await this.couponService.expireCoupon(id, req.user.id);

      res.json({
        success: true,
        message: 'Coupon expired successfully',
        data: { coupon },
      });
    } catch (error) {
      logError('Error expiring coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to expire coupon',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async redeemCoupon(req: Request, res: Response) {
    try {
      const { code, orderAmount, orderId } = req.body;

      if (!code || !orderAmount) {
        throw new BadRequestError('Code and orderAmount are required');
      }

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const result = await this.couponService.redeemCoupon({
        code,
        userId: req.user.id,
        orderAmount: Number(orderAmount),
        orderId,
      });

      res.json({
        success: true,
        message: 'Coupon redeemed successfully',
        data: {
          coupon: result.coupon,
          discountAmount: result.discountAmount,
          redemption: result.redemption,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to redeem coupon',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async validateCoupon(req: Request, res: Response) {
    try {
      const { code, orderAmount } = req.query;

      if (!code || !orderAmount) {
        throw new BadRequestError('Code and orderAmount are required');
      }

      const result = await this.couponService.validateCoupon(code as string, Number(orderAmount));

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logError('Error validating coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate coupon',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getUserRedemptions(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;

      if (!req.user?.id) {
        throw new BadRequestError('User not authenticated');
      }

      const { redemptions, total } = await this.couponService.getUserRedemptions(
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
      logError('Error getting user redemptions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user redemptions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getCouponStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Coupon ID is required');
      }

      const stats = await this.couponService.getCouponStats(id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logError('Error getting coupon stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get coupon statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

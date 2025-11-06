import { AppDataSource } from '../config/database.js';
import { Coupon } from '../entities/Coupon.js';
import { CouponRedemption } from '../entities/CouponRedemption.js';
import { User } from '../entities/User.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import { logInfo } from '../utils/logger.js';
import { notificationHelper } from '../utils/notification-helper.js';
import { WalletService } from './wallet.service.js';

export interface CreateCouponInput {
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
}

export interface RedeemCouponInput {
  code: string;
  userId: string;
  orderAmount: number;
  orderId?: string;
}

export class CouponService {
  private get couponRepository() {
    return AppDataSource.getRepository(Coupon);
  }

  private get redemptionRepository() {
    return AppDataSource.getRepository(CouponRedemption);
  }

  private get userRepository() {
    return AppDataSource.getRepository(User);
  }
  private walletService = new WalletService();

  async createCoupon(input: CreateCouponInput, createdBy: string): Promise<Coupon> {
    if (input.discountValue <= 0) {
      throw new BadRequestError('Discount value must be greater than 0');
    }

    if (input.discountType === 'percent' && input.discountValue > 100) {
      throw new BadRequestError('Percentage discount cannot exceed 100%');
    }

    if (input.validUntil <= input.validFrom) {
      throw new BadRequestError('Valid until date must be after valid from date');
    }

    const existingCoupon = await this.couponRepository.findOne({
      where: { code: input.code },
    });

    if (existingCoupon) {
      throw new ConflictError('Coupon code already exists');
    }

    const coupon = this.couponRepository.create({
      ...input,
      createdBy,
    });

    const savedCoupon = await this.couponRepository.save(coupon);

    logInfo(`Coupon ${input.code} created by user ${createdBy}`);

    return savedCoupon;
  }

  async getCoupons(
    page: number = 1,
    limit: number = 20,
    isActive?: boolean,
    createdBy?: string
  ): Promise<{ coupons: Coupon[]; total: number }> {
    const offset = (page - 1) * limit;

    const queryBuilder = this.couponRepository
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.redemptions', 'redemption')
      .leftJoinAndSelect('redemption.user', 'user')
      .orderBy('coupon.createdAt', 'DESC');

    if (isActive !== undefined) {
      queryBuilder.andWhere('coupon.isActive = :isActive', { isActive });
    }

    if (createdBy) {
      queryBuilder.andWhere('coupon.createdBy = :createdBy', { createdBy });
    }

    const [coupons, total] = await queryBuilder.skip(offset).take(limit).getManyAndCount();

    return { coupons, total };
  }

  async getCouponById(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
      relations: ['redemptions', 'redemptions.user'],
    });

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    return coupon;
  }

  async getCouponByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { code },
      relations: ['redemptions'],
    });

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    return coupon;
  }

  async updateCoupon(
    id: string,
    updates: Partial<CreateCouponInput>,
    updatedBy: string
  ): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    if (coupon.createdBy !== updatedBy) {
      const user = await this.userRepository.findOne({
        where: { id: updatedBy },
      });
      if (!user?.isStaff && !user?.isSuperuser) {
        throw new ForbiddenError('You can only update coupons you created');
      }
    }

    if (updates.discountValue !== undefined && updates.discountValue <= 0) {
      throw new BadRequestError('Discount value must be greater than 0');
    }

    if (
      updates.discountType === 'percent' &&
      updates.discountValue &&
      updates.discountValue > 100
    ) {
      throw new BadRequestError('Percentage discount cannot exceed 100%');
    }

    Object.assign(coupon, updates);
    const updatedCoupon = await this.couponRepository.save(coupon);

    logInfo(`Coupon ${id} updated by user ${updatedBy}`);

    return updatedCoupon;
  }

  async deleteCoupon(id: string, deletedBy: string): Promise<void> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    if (coupon.createdBy !== deletedBy) {
      const user = await this.userRepository.findOne({
        where: { id: deletedBy },
      });
      if (!user?.isStaff && !user?.isSuperuser) {
        throw new ForbiddenError('You can only delete coupons you created');
      }
    }

    await this.couponRepository.remove(coupon);

    logInfo(`Coupon ${id} deleted by user ${deletedBy}`);
  }

  async expireCoupon(id: string, userId: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    if (coupon.createdBy !== userId) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user?.isStaff && !user?.isSuperuser) {
        throw new ForbiddenError('You can only expire coupons you created');
      }
    }

    coupon.isActive = false;
    coupon.validUntil = new Date();

    const updated = await this.couponRepository.save(coupon);
    logInfo(`Coupon ${id} expired by user ${userId}`);

    return updated;
  }

  async redeemCoupon(input: RedeemCouponInput): Promise<{
    coupon: Coupon;
    discountAmount: number;
    redemption: CouponRedemption;
  }> {
    const { code, userId, orderAmount, orderId } = input;

    const coupon = await this.getCouponByCode(code);

    if (!coupon.isActive) {
      throw new BadRequestError('Coupon is not active');
    }

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      throw new BadRequestError('Coupon is not valid yet');
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      throw new BadRequestError('Coupon has expired');
    }

    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      throw new BadRequestError(
        `Minimum order amount of ${coupon.minOrderAmount} required for this coupon`
      );
    }

    if (coupon.usageLimit) {
      const redemptionCount = await this.redemptionRepository.count({
        where: { couponId: coupon.id },
      });

      if (redemptionCount >= coupon.usageLimit) {
        throw new BadRequestError('Coupon usage limit exceeded');
      }
    }

    const existingRedemption = await this.redemptionRepository.findOne({
      where: { couponId: coupon.id, userId },
    });

    if (existingRedemption) {
      throw new ConflictError('You have already used this coupon');
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }

    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

    return await AppDataSource.transaction(async (manager) => {
      const redemption = manager.create(CouponRedemption, {
        couponId: coupon.id,
        userId,
        discountAmount,
        orderAmount,
        orderId,
      });

      const savedRedemption = await manager.save(redemption);

      await this.walletService.creditWallet(userId, discountAmount, 'coupon_discount', coupon.id, {
        couponId: coupon.id,
        orderId,
        discountType: coupon.discountType,
        originalDiscountValue: coupon.discountValue,
      });

      logInfo(`Coupon ${code} redeemed by user ${userId} for ${discountAmount}`);

      try {
        await notificationHelper.notifyCouponRedemption(userId, code, discountAmount, orderId);
      } catch (error) {
        logInfo(`Failed to send coupon redemption notification: ${error}`);
      }

      return {
        coupon,
        discountAmount,
        redemption: savedRedemption,
      };
    });
  }

  async getUserRedemptions(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ redemptions: CouponRedemption[]; total: number }> {
    const offset = (page - 1) * limit;

    const [redemptions, total] = await this.redemptionRepository.findAndCount({
      where: { userId },
      relations: ['coupon'],
      order: { redeemedAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { redemptions, total };
  }

  async getCouponStats(couponId: string): Promise<{
    totalRedemptions: number;
    totalDiscountGiven: number;
    uniqueUsers: number;
    averageOrderAmount: number;
  }> {
    const redemptions = await this.redemptionRepository.find({
      where: { couponId },
    });

    const totalRedemptions = redemptions.length;
    const totalDiscountGiven = redemptions.reduce((sum, r) => sum + Number(r.discountAmount), 0);
    const uniqueUsers = new Set(redemptions.map((r) => r.userId)).size;
    const averageOrderAmount =
      redemptions.length > 0
        ? redemptions.reduce((sum, r) => sum + Number(r.orderAmount), 0) / redemptions.length
        : 0;

    return {
      totalRedemptions,
      totalDiscountGiven,
      uniqueUsers,
      averageOrderAmount,
    };
  }

  async validateCoupon(
    code: string,
    orderAmount: number
  ): Promise<{
    valid: boolean;
    discountAmount: number;
    message?: string;
  }> {
    try {
      const coupon = await this.getCouponByCode(code);

      if (!coupon.isActive) {
        return {
          valid: false,
          discountAmount: 0,
          message: 'Coupon is not active',
        };
      }

      const now = new Date();
      if (coupon.validFrom && now < coupon.validFrom) {
        return {
          valid: false,
          discountAmount: 0,
          message: 'Coupon is not yet valid',
        };
      }
      if (coupon.validUntil && now > coupon.validUntil) {
        return {
          valid: false,
          discountAmount: 0,
          message: 'Coupon has expired',
        };
      }

      if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
        return {
          valid: false,
          discountAmount: 0,
          message: `Minimum order amount of ${coupon.minOrderAmount} required`,
        };
      }

      let discountAmount = 0;
      if (coupon.discountType === 'percent') {
        discountAmount = (orderAmount * coupon.discountValue) / 100;
      } else {
        discountAmount = coupon.discountValue;
      }

      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }

      if (discountAmount > orderAmount) {
        discountAmount = orderAmount;
      }

      return { valid: true, discountAmount };
    } catch (_error) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Invalid coupon code',
      };
    }
  }
}

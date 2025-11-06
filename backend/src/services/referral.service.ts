import { AppDataSource } from '../config/database.js';
import { Referral } from '../entities/Referral.js';
import { ReferralRedemption } from '../entities/ReferralRedemption.js';
import { User } from '../entities/User.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import { logInfo } from '../utils/logger.js';
import { notificationHelper } from '../utils/notification-helper.js';
import { WalletService } from './wallet.service.js';

export interface CreateReferralInput {
  referrerId: string;
  referredUserId: string;
  referralCode: string;
}

export interface RedeemReferralInput {
  userId: string;
  points: number;
  reason?: string;
}

export class ReferralService {
  private get referralRepository() {
    return AppDataSource.getRepository(Referral);
  }

  private get redemptionRepository() {
    return AppDataSource.getRepository(ReferralRedemption);
  }

  private get userRepository() {
    return AppDataSource.getRepository(User);
  }
  private walletService = new WalletService();

  private readonly REFERRAL_BONUS_POINTS = 2500;
  private readonly REDEMPTION_RATE = 500;
  private readonly MIN_REDEMPTION_POINTS = 2500;

  async createReferral(input: CreateReferralInput): Promise<Referral> {
    const { referrerId, referredUserId, referralCode } = input;

    const referrer = await this.userRepository.findOne({
      where: { id: referrerId },
    });
    const referredUser = await this.userRepository.findOne({
      where: { id: referredUserId },
    });

    if (!referrer) {
      throw new NotFoundError('Referrer not found');
    }
    if (!referredUser) {
      throw new NotFoundError('Referred user not found');
    }

    if (referrerId === referredUserId) {
      throw new BadRequestError('Cannot refer yourself');
    }

    if (referrer.referralCode !== referralCode) {
      throw new BadRequestError('Invalid referral code');
    }

    const existingReferral = await this.referralRepository.findOne({
      where: { referredUserId },
    });

    if (existingReferral) {
      throw new ConflictError('User has already been referred');
    }

    const reverseReferral = await this.referralRepository.findOne({
      where: { referrerId: referredUserId, referredUserId: referrerId },
    });

    if (reverseReferral) {
      throw new BadRequestError('Cannot refer someone who referred you');
    }

    const referral = new Referral();
    referral.referrerId = referrerId;
    referral.referredUserId = referredUserId;
    referral.status = 'pending';

    const savedReferral = await this.referralRepository.save(referral);

    logInfo(`Referral created: ${referrerId} -> ${referredUserId}`);

    return savedReferral;
  }

  async confirmReferral(referredUserId: string): Promise<{
    referral: Referral;
    bonusPoints: number;
  }> {
    const referral = await this.referralRepository.findOne({
      where: { referredUserId, status: 'pending' },
    });

    if (!referral) {
      throw new NotFoundError('Pending referral not found');
    }

    return await AppDataSource.transaction(async (manager) => {
      referral.status = 'confirmed';
      referral.confirmedAt = new Date();
      await manager.save(referral);

      const referrer = await this.userRepository.findOne({
        where: { id: referral.referrerId },
      });

      if (referrer) {
        referrer.referralPoints += this.REFERRAL_BONUS_POINTS;
        await manager.save(referrer);

        await this.walletService.creditWallet(
          referral.referrerId,
          this.REFERRAL_BONUS_POINTS,
          'referral_bonus',
          referral.id,
          {
            referredUserId,
            bonusType: 'referral_confirmation',
            points: this.REFERRAL_BONUS_POINTS,
          }
        );
      }

      logInfo(
        `Referral confirmed: ${referral.referrerId} -> ${referredUserId}. Bonus: ${this.REFERRAL_BONUS_POINTS} points`
      );

      try {
        await notificationHelper.notifyReferralBonus(
          referral.referrerId,
          this.REFERRAL_BONUS_POINTS,
          referredUserId,
          referral.id
        );
      } catch (error) {
        logInfo(`Failed to send referral bonus notification: ${error}`);
      }

      return {
        referral,
        bonusPoints: this.REFERRAL_BONUS_POINTS,
      };
    });
  }

  async redeemPoints(input: RedeemReferralInput): Promise<{
    redemption: ReferralRedemption;
    walletCredit: number;
  }> {
    const { userId, points } = input;

    if (points < this.MIN_REDEMPTION_POINTS) {
      throw new BadRequestError(
        `Minimum ${this.MIN_REDEMPTION_POINTS} points required for redemption`
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.referralPoints < points) {
      throw new BadRequestError('Insufficient referral points');
    }

    return await AppDataSource.transaction(async (manager) => {
      const walletCredit = Math.floor(points / this.REDEMPTION_RATE) * 100;
      const actualPointsUsed = Math.floor(points / this.REDEMPTION_RATE) * this.REDEMPTION_RATE;

      user.referralPoints -= actualPointsUsed;
      await manager.save(user);

      const redemption = manager.create(ReferralRedemption, {
        userId,
        redeemedPoints: actualPointsUsed,
        cashAmount: walletCredit,
        walletBalanceAfter: 0,
      });

      const savedRedemption = await manager.save(redemption);

      await this.walletService.creditWallet(
        userId,
        walletCredit,
        'referral_redemption',
        savedRedemption.id,
        {
          redemptionId: savedRedemption.id,
          pointsUsed: actualPointsUsed,
          redemptionRate: this.REDEMPTION_RATE,
        }
      );

      const finalBalance = await this.walletService.getBalance(userId);
      savedRedemption.walletBalanceAfter = Number(finalBalance);
      await manager.save(savedRedemption);

      logInfo(
        `User ${userId} redeemed ${actualPointsUsed} points for ${walletCredit} wallet credit`
      );

      try {
        await notificationHelper.notifyReferralRedemption(
          userId,
          actualPointsUsed,
          walletCredit,
          Number(finalBalance)
        );
      } catch (error) {
        logInfo(`Failed to send referral redemption notification: ${error}`);
      }

      return {
        redemption: savedRedemption,
        walletCredit,
      };
    });
  }

  async getUserReferralStats(userId: string): Promise<{
    totalReferrals: number;
    confirmedReferrals: number;
    pendingReferrals: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    availablePoints: number;
  }> {
    const [referrals, redemptions, user] = await Promise.all([
      this.referralRepository.find({ where: { referrerId: userId } }),
      this.redemptionRepository.find({ where: { userId } }),
      this.userRepository.findOne({ where: { id: userId } }),
    ]);

    const confirmedReferrals = referrals.filter((r) => r.status === 'confirmed');
    const pendingReferrals = referrals.filter((r) => r.status === 'pending');

    const totalPointsEarned = confirmedReferrals.length * this.REFERRAL_BONUS_POINTS;
    const totalPointsRedeemed = redemptions.reduce((sum, r) => sum + Number(r.redeemedPoints), 0);
    const availablePoints = user?.referralPoints || 0;

    return {
      totalReferrals: referrals.length,
      confirmedReferrals: confirmedReferrals.length,
      pendingReferrals: pendingReferrals.length,
      totalPointsEarned,
      totalPointsRedeemed,
      availablePoints,
    };
  }

  async getUserReferralHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ referrals: Referral[]; total: number }> {
    const offset = (page - 1) * limit;

    const [referrals, total] = await this.referralRepository.findAndCount({
      where: { referrerId: userId },
      relations: ['referredUser'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { referrals, total };
  }

  async getUserRedemptionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ redemptions: ReferralRedemption[]; total: number }> {
    const offset = (page - 1) * limit;

    const [redemptions, total] = await this.redemptionRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { redemptions, total };
  }

  async getAllReferrals(
    page: number = 1,
    limit: number = 20,
    status?: 'pending' | 'confirmed' | 'cancelled'
  ): Promise<{ referrals: Referral[]; total: number }> {
    const offset = (page - 1) * limit;

    const queryBuilder = this.referralRepository
      .createQueryBuilder('referral')
      .leftJoinAndSelect('referral.referrer', 'referrer')
      .leftJoinAndSelect('referral.referredUser', 'referredUser')
      .orderBy('referral.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('referral.status = :status', { status });
    }

    const [referrals, total] = await queryBuilder.skip(offset).take(limit).getManyAndCount();

    return { referrals, total };
  }

  async cancelReferral(referralId: string, cancelledBy: string): Promise<Referral> {
    const referral = await this.referralRepository.findOne({
      where: { id: referralId },
    });

    if (!referral) {
      throw new NotFoundError('Referral not found');
    }

    if (referral.referrerId !== cancelledBy) {
      const user = await this.userRepository.findOne({
        where: { id: cancelledBy },
      });
      if (!user?.isStaff && !user?.isSuperuser) {
        throw new ForbiddenError('You can only cancel your own referrals');
      }
    }

    if (referral.status !== 'pending') {
      throw new BadRequestError('Only pending referrals can be cancelled');
    }

    referral.status = 'cancelled';
    referral.cancelledAt = new Date();
    referral.cancelledBy = cancelledBy;

    const updatedReferral = await this.referralRepository.save(referral);

    logInfo(`Referral ${referralId} cancelled by user ${cancelledBy}`);

    return updatedReferral;
  }

  async getReferralLeaderboard(
    limit: number = 10,
    period?: 'week' | 'month' | 'year' | 'all'
  ): Promise<
    Array<{
      user: User;
      totalReferrals: number;
      confirmedReferrals: number;
      totalPointsEarned: number;
    }>
  > {
    let dateFilter = '';
    if (period && period !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      dateFilter = `AND referral.created_at >= '${startDate.toISOString()}'`;
    }

    const query = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.avatar,
        COUNT(r.id) as total_referrals,
        COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END) as confirmed_referrals,
        COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END) * ${this.REFERRAL_BONUS_POINTS} as total_points_earned
      FROM users u
      LEFT JOIN referrals r ON u.id = r.referrer_id ${dateFilter}
      WHERE u.deleted = false
      GROUP BY u.id, u.name, u.email, u.avatar
      HAVING COUNT(r.id) > 0
      ORDER BY confirmed_referrals DESC, total_referrals DESC
      LIMIT ${limit}
    `;

    const results = await AppDataSource.query(query);

    return results.map((row: Record<string, unknown>) => ({
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        avatar: row.avatar,
      } as User,
      totalReferrals: parseInt(String(row.total_referrals), 10),
      confirmedReferrals: parseInt(String(row.confirmed_referrals), 10),
      totalPointsEarned: parseInt(String(row.total_points_earned), 10),
    }));
  }

  async generateReferralCode(userId: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.referralCode) {
      return user.referralCode;
    }

    let referralCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await this.userRepository.findOne({
        where: { referralCode },
      });
      isUnique = !existing;
      attempts++;
    } while (!isUnique && attempts < maxAttempts);

    if (!isUnique) {
      throw new BadRequestError('Failed to generate unique referral code');
    }

    user.referralCode = referralCode;
    await this.userRepository.save(user);

    logInfo(`Generated referral code ${referralCode} for user ${userId}`);

    return referralCode;
  }
}

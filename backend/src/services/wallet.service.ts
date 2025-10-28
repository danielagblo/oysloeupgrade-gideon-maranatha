import { AppDataSource } from "../config/database.js";
import { User } from "../entities/User.js";
import { Wallet } from "../entities/Wallet.js";
import { WalletLedger } from "../entities/WalletLedger.js";
import {
  BadRequestError,
  InsufficientFundsError,
  NotFoundError,
} from "../utils/errors.js";
import { logInfo } from "../utils/logger.js";
import { notificationHelper } from "../utils/notification-helper.js";

export type TransactionType =
  | "credit"
  | "debit"
  | "referral"
  | "coupon"
  | "purchase"
  | "refund";

export interface WalletTransaction {
  amount: number;
  transactionType: TransactionType;
  reason: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

export class WalletService {
  private get walletRepository() {
    return AppDataSource.getRepository(Wallet);
  }

  private get ledgerRepository() {
    return AppDataSource.getRepository(WalletLedger);
  }

  private get userRepository() {
    return AppDataSource.getRepository(User);
  }

  async getBalance(userId: string): Promise<number> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    return wallet?.balance || 0;
  }

  async getOrCreateWallet(userId: string): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      wallet = this.walletRepository.create({
        userId,
        balance: 0,
      });
      await this.walletRepository.save(wallet);
      logInfo(`Created wallet for user ${userId}`);
    }

    return wallet;
  }

  async creditWallet(
    userId: string,
    amount: number,
    reason: string,
    referenceId?: string,
    metadata?: Record<string, unknown>
  ): Promise<WalletLedger> {
    if (amount <= 0) {
      throw new BadRequestError("Amount must be greater than 0");
    }

    return await AppDataSource.transaction(async (manager) => {
      const wallet = await this.getOrCreateWallet(userId);

      const newBalance = Number(wallet.balance) + amount;

      await manager.update(Wallet, { userId }, { balance: newBalance });

      const ledgerEntry = manager.create(WalletLedger, {
        userId,
        amount,
        balanceAfter: newBalance,
        transactionType: "credit",
        reason,
        referenceId,
        metadata,
      });

      const savedEntry = await manager.save(ledgerEntry);

      logInfo(
        `Credited ${amount} to user ${userId} wallet. New balance: ${newBalance}`
      );

      try {
        await notificationHelper.notifyWalletTransaction(
          userId,
          "credit",
          amount,
          reason,
          newBalance,
          referenceId
        );
      } catch (error) {
        logInfo(`Failed to send wallet credit notification: ${error}`);
      }

      return savedEntry;
    });
  }

  async debitWallet(
    userId: string,
    amount: number,
    reason: string,
    referenceId?: string,
    metadata?: Record<string, unknown>
  ): Promise<WalletLedger> {
    if (amount <= 0) {
      throw new BadRequestError("Amount must be greater than 0");
    }

    return await AppDataSource.transaction(async (manager) => {
      const wallet = await this.getOrCreateWallet(userId);

      if (Number(wallet.balance) < amount) {
        throw new InsufficientFundsError("Insufficient wallet balance");
      }

      const newBalance = Number(wallet.balance) - amount;

      await manager.update(Wallet, { userId }, { balance: newBalance });

      const ledgerEntry = manager.create(WalletLedger, {
        userId,
        amount: -amount,
        balanceAfter: newBalance,
        transactionType: "debit",
        reason,
        referenceId,
        metadata,
      });

      const savedEntry = await manager.save(ledgerEntry);

      logInfo(
        `Debited ${amount} from user ${userId} wallet. New balance: ${newBalance}`
      );

      try {
        await notificationHelper.notifyWalletTransaction(
          userId,
          "debit",
          amount,
          reason,
          newBalance,
          referenceId
        );
      } catch (error) {
        logInfo(`Failed to send wallet debit notification: ${error}`);
      }

      return savedEntry;
    });
  }

  async transferFunds(
    fromUserId: string,
    toUserId: string,
    amount: number,
    _reason: string,
    metadata?: Record<string, unknown>
  ): Promise<{ fromEntry: WalletLedger; toEntry: WalletLedger }> {
    if (amount <= 0) {
      throw new BadRequestError("Amount must be greater than 0");
    }

    if (fromUserId === toUserId) {
      throw new BadRequestError("Cannot transfer to the same user");
    }

    return await AppDataSource.transaction(async (manager) => {
      const fromUser = await this.userRepository.findOne({
        where: { id: fromUserId },
      });
      const toUser = await this.userRepository.findOne({
        where: { id: toUserId },
      });

      if (!fromUser) {
        throw new NotFoundError("Sender user not found");
      }
      if (!toUser) {
        throw new NotFoundError("Recipient user not found");
      }

      const fromWallet = await this.getOrCreateWallet(fromUserId);
      const toWallet = await this.getOrCreateWallet(toUserId);

      if (Number(fromWallet.balance) < amount) {
        throw new InsufficientFundsError("Insufficient wallet balance");
      }

      const fromNewBalance = Number(fromWallet.balance) - amount;
      const toNewBalance = Number(toWallet.balance) + amount;

      await manager.update(
        Wallet,
        { userId: fromUserId },
        { balance: fromNewBalance }
      );
      await manager.update(
        Wallet,
        { userId: toUserId },
        { balance: toNewBalance }
      );

      const fromEntry = manager.create(WalletLedger, {
        userId: fromUserId,
        amount: -amount,
        balanceAfter: fromNewBalance,
        transactionType: "debit",
        reason: `Transfer to ${toUser.name}`,
        metadata: { ...metadata, transferTo: toUserId },
      });

      const toEntry = manager.create(WalletLedger, {
        userId: toUserId,
        amount,
        balanceAfter: toNewBalance,
        transactionType: "credit",
        reason: `Transfer from ${fromUser.name}`,
        metadata: { ...metadata, transferFrom: fromUserId },
      });

      const savedFromEntry = await manager.save(fromEntry);
      const savedToEntry = await manager.save(toEntry);

      logInfo(
        `Transferred ${amount} from user ${fromUserId} to user ${toUserId}`
      );

      return { fromEntry: savedFromEntry, toEntry: savedToEntry };
    });
  }

  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    transactionType?: TransactionType
  ): Promise<{ transactions: WalletLedger[]; total: number }> {
    const offset = (page - 1) * limit;

    const queryBuilder = this.ledgerRepository
      .createQueryBuilder("ledger")
      .where("ledger.userId = :userId", { userId })
      .orderBy("ledger.createdAt", "DESC");

    if (transactionType) {
      queryBuilder.andWhere("ledger.transactionType = :transactionType", {
        transactionType,
      });
    }

    const [transactions, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { transactions, total };
  }

  async processReferralBonus(
    referrerId: string,
    referredUserId: string,
    bonusAmount: number = 500
  ): Promise<WalletLedger> {
    return await this.creditWallet(
      referrerId,
      bonusAmount,
      "referral_bonus",
      referredUserId,
      {
        referredUserId,
        bonusType: "referral",
        amount: bonusAmount,
      }
    );
  }

  async processCouponDiscount(
    userId: string,
    discountAmount: number,
    couponId: string,
    orderId?: string
  ): Promise<WalletLedger> {
    return await this.creditWallet(
      userId,
      discountAmount,
      "coupon_discount",
      couponId,
      {
        couponId,
        orderId,
        discountType: "coupon",
        amount: discountAmount,
      }
    );
  }

  async processPurchase(
    userId: string,
    amount: number,
    productId: string,
    orderId?: string
  ): Promise<WalletLedger> {
    return await this.debitWallet(userId, amount, "purchase", productId, {
      productId,
      orderId,
      paymentType: "wallet",
      amount,
    });
  }

  async processRefund(
    userId: string,
    amount: number,
    originalTransactionId: string,
    reason: string = "refund"
  ): Promise<WalletLedger> {
    return await this.creditWallet(
      userId,
      amount,
      reason,
      originalTransactionId,
      {
        originalTransactionId,
        refundType: "purchase_refund",
        amount,
      }
    );
  }

  async getWalletSummary(userId: string): Promise<{
    balance: number;
    totalCredits: number;
    totalDebits: number;
    transactionCount: number;
  }> {
    const wallet = await this.getOrCreateWallet(userId);

    const [creditStats, debitStats] = await Promise.all([
      this.ledgerRepository
        .createQueryBuilder("ledger")
        .select("SUM(ledger.amount)", "total")
        .addSelect("COUNT(*)", "count")
        .where("ledger.userId = :userId", { userId })
        .andWhere("ledger.transactionType = 'credit'")
        .getRawOne(),

      this.ledgerRepository
        .createQueryBuilder("ledger")
        .select("SUM(ABS(ledger.amount))", "total")
        .addSelect("COUNT(*)", "count")
        .where("ledger.userId = :userId", { userId })
        .andWhere("ledger.transactionType = 'debit'")
        .getRawOne(),
    ]);

    return {
      balance: Number(wallet.balance),
      totalCredits: Number(creditStats.total) || 0,
      totalDebits: Number(debitStats.total) || 0,
      transactionCount:
        (Number(creditStats.count) || 0) + (Number(debitStats.count) || 0),
    };
  }
}

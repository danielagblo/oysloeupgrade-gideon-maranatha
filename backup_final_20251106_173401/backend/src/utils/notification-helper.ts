import { AppDataSource } from '../config/database.js';
import { FCMDevice } from '../entities/FCMDevice.js';
import { NotificationService } from '../services/notification.service.js';
import { logError, logInfo } from './logger.js';

export enum NotificationType {
  CHAT_MESSAGE = 'chat_message',
  WALLET_CREDIT = 'wallet_credit',
  WALLET_DEBIT = 'wallet_debit',
  WELCOME = 'welcome',
  ACCOUNT_CREATED = 'account_created',
  COUPON_REDEMPTION = 'coupon_redemption',
  REFERRAL_BONUS = 'referral_bonus',
  REFERRAL_REDEMPTION = 'referral_redemption',
  PRODUCT_REVIEW = 'product_review',
}

export interface NotificationData {
  type: NotificationType;
  [key: string]: string;
}

export class NotificationHelper {
  private notificationService: NotificationService;
  private rateLimitMap = new Map<string, number>();
  private fcmDeviceRepository = AppDataSource.getRepository(FCMDevice);
  private testMode = false;

  public clearRateLimit(): void {
    this.rateLimitMap.clear();
  }

  public setTestMode(enabled: boolean): void {
    this.testMode = enabled;
    if (enabled) {
      this.clearRateLimit();
    }
  }

  constructor() {
    this.notificationService = new NotificationService();
  }

  private checkRateLimit(recipientId: string, type: NotificationType, senderId?: string): boolean {
    if (this.testMode) return true;

    const now = Date.now();

    const key =
      type === NotificationType.CHAT_MESSAGE && senderId
        ? `${recipientId}:${senderId}:${type}`
        : `${recipientId}:${type}`;

    const lastSent = this.rateLimitMap.get(key) || 0;
    if (now - lastSent < 30_000) return false;
    this.rateLimitMap.set(key, now);
    return true;
  }

  private truncateMessage(message: string): string {
    return message.length > 50 ? `${message.slice(0, 47)}...` : message;
  }

  private formatAmount(pesewas: number): string {
    return `₵${(pesewas / 100).toFixed(2)}`;
  }

  private async isUserOffline(_userId: string): Promise<boolean> {
    return true;
  }

  private async hasUnreadInRoom(_userId: string, _roomId?: string): Promise<boolean> {
    return false;
  }

  private async sendNotificationIfOffline(
    userId: string,
    title: string,
    body: string,
    data: NotificationData,
    type: NotificationType,
    opts?: { roomId?: string; senderId?: string; priority?: 'high' | 'normal' }
  ): Promise<boolean> {
    try {
      if (!this.checkRateLimit(userId, type, opts?.senderId)) {
        logInfo(`Rate limited: user=${userId}, type=${type}`);
        return false;
      }

      if (!(await this.isUserOffline(userId))) {
        logInfo(`User online; suppressing push: user=${userId}, type=${type}`);
        return false;
      }
      if (
        type === NotificationType.CHAT_MESSAGE &&
        (await this.hasUnreadInRoom(userId, opts?.roomId))
      ) {
        logInfo(`Unread in room; suppressing push: user=${userId}, room=${opts?.roomId}`);
        return false;
      }

      const devices = await this.fcmDeviceRepository.find({
        where: { userId },
      });
      if (!devices.length) {
        logInfo(`No FCM devices for user ${userId}`);
        return false;
      }

      const priority: 'high' | 'normal' =
        opts?.priority ??
        (type === NotificationType.WALLET_CREDIT || type === NotificationType.WALLET_DEBIT
          ? 'high'
          : 'normal');

      await this.notificationService.sendPushNotification(userId, title, body, data, { priority });

      logInfo(`Notification sent: user=${userId}, type=${type}, title="${title}"`);
      return true;
    } catch (error) {
      logError(`Failed to send notification to user ${userId}:`, error);
      return false;
    }
  }

  async notifyNewMessage(
    recipientId: string,
    senderName: string,
    message: string,
    roomId: string,
    senderId: string,
    messageId: string
  ): Promise<boolean> {
    const title = `New message from ${senderName}`;
    const body = this.truncateMessage(message);
    const data: NotificationData = {
      type: NotificationType.CHAT_MESSAGE,
      roomId,
      senderId,
      senderName,
      messageId,
      preview: body,
    };

    return this.sendNotificationIfOffline(
      recipientId,
      title,
      body,
      data,
      NotificationType.CHAT_MESSAGE,
      { roomId, senderId, priority: 'normal' }
    );
  }

  async notifyWalletTransaction(
    userId: string,
    type: 'credit' | 'debit',
    amountPesewas: number,
    source: string,
    balancePesewas: number,
    referenceId?: string
  ): Promise<boolean> {
    const amountFormatted = this.formatAmount(amountPesewas);
    const balanceFormatted = this.formatAmount(balancePesewas);

    const title = type === 'credit' ? 'Wallet Credited' : 'Wallet Debited';
    const sign = type === 'credit' ? '+' : '-';
    const body = `${sign}${amountFormatted} ${
      type === 'credit' ? 'added to' : 'deducted from'
    } your wallet. Balance: ${balanceFormatted}`;
    const notificationType =
      type === 'credit' ? NotificationType.WALLET_CREDIT : NotificationType.WALLET_DEBIT;

    const data: NotificationData = {
      type: notificationType,
      source,
      referenceId: referenceId || '',
      amountFormatted,
      balanceFormatted,
      amountPesewas: String(amountPesewas),
      balancePesewas: String(balancePesewas),
    };

    return this.sendNotificationIfOffline(userId, title, body, data, notificationType, {
      priority: 'high',
    });
  }

  async notifyWelcome(userId: string, name: string, referralCode: string): Promise<boolean> {
    const title = 'Welcome to Oysloe!';
    const body = `Welcome ${name}! Your referral code is ${referralCode}`;
    const data: NotificationData = {
      type: NotificationType.WELCOME,
      referralCode,
      userId,
      name,
    };

    return this.sendNotificationIfOffline(userId, title, body, data, NotificationType.WELCOME, {
      priority: 'normal',
    });
  }

  async notifyAccountCreated(userId: string, phone: string): Promise<boolean> {
    const title = 'Account Created!';
    const body = 'Complete your profile to start shopping';
    const data: NotificationData = {
      type: NotificationType.ACCOUNT_CREATED,
      phone,
      userId,
      nextStep: 'complete_profile',
    };

    return this.sendNotificationIfOffline(
      userId,
      title,
      body,
      data,
      NotificationType.ACCOUNT_CREATED,
      { priority: 'high' }
    );
  }

  async notifyCouponRedemption(
    userId: string,
    couponCode: string,
    discountPesewas: number,
    orderId?: string
  ): Promise<boolean> {
    const discountFormatted = this.formatAmount(discountPesewas);
    const title = 'Coupon Redeemed!';
    const body = `You saved ${discountFormatted} with ${couponCode}`;
    const data: NotificationData = {
      type: NotificationType.COUPON_REDEMPTION,
      couponCode,
      discountPesewas: String(discountPesewas),
      discountFormatted,
      orderId: orderId || '',
    };

    return this.sendNotificationIfOffline(
      userId,
      title,
      body,
      data,
      NotificationType.COUPON_REDEMPTION,
      { priority: 'normal' }
    );
  }

  async notifyReferralBonus(
    userId: string,
    points: number,
    referredUserId: string,
    referralId: string
  ): Promise<boolean> {
    const title = 'Referral Bonus!';
    const body = `You earned ${points} points for your referral`;
    const data: NotificationData = {
      type: NotificationType.REFERRAL_BONUS,
      points: String(points),
      referredUserId,
      referralId,
    };

    return this.sendNotificationIfOffline(
      userId,
      title,
      body,
      data,
      NotificationType.REFERRAL_BONUS,
      { priority: 'normal' }
    );
  }

  async notifyReferralRedemption(
    userId: string,
    pointsUsed: number,
    walletCreditPesewas: number,
    newBalancePesewas: number
  ): Promise<boolean> {
    const creditFormatted = this.formatAmount(walletCreditPesewas);
    const balanceFormatted = this.formatAmount(newBalancePesewas);

    const title = 'Points Redeemed!';
    const body = `${creditFormatted} added to your wallet`;
    const data: NotificationData = {
      type: NotificationType.REFERRAL_REDEMPTION,
      pointsUsed: String(pointsUsed),
      walletCreditPesewas: String(walletCreditPesewas),
      walletCreditFormatted: creditFormatted,
      newBalancePesewas: String(newBalancePesewas),
      newBalanceFormatted: balanceFormatted,
    };

    return this.sendNotificationIfOffline(
      userId,
      title,
      body,
      data,
      NotificationType.REFERRAL_REDEMPTION,
      { priority: 'normal' }
    );
  }

  async notifyProductReview(
    productOwnerId: string,
    productId: string,
    productName: string,
    rating: number,
    reviewerId: string
  ): Promise<boolean> {
    const title = 'New Product Review';
    const body = `${rating}-star review on '${productName}'`;
    const data: NotificationData = {
      type: NotificationType.PRODUCT_REVIEW,
      productId,
      productName,
      rating: String(rating),
      reviewerId,
    };

    return this.sendNotificationIfOffline(
      productOwnerId,
      title,
      body,
      data,
      NotificationType.PRODUCT_REVIEW,
      { priority: 'normal' }
    );
  }
}

export const notificationHelper = new NotificationHelper();

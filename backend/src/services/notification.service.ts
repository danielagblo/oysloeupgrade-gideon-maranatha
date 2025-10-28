import { In } from "typeorm";
import { AppDataSource } from "../config/database.js";
import { config } from "../config/env.js";
import { FCMDevice } from "../entities/FCMDevice.js";
import {
  NotificationHistory,
  type NotificationType,
} from "../entities/NotificationHistory.js";
import { logError, logInfo } from "../utils/logger.js";

export interface SMSResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface PushNotificationResult {
  success: boolean;
  deviceCount: number;
  error?: string;
}

interface ArkeselSMSResponse {
  message?: string;
  status?: string;
  code?: number;
  [key: string]: unknown;
}

interface FCMResponse {
  success: boolean;
  messageId?: string;
  error?: {
    code: string;
    message: string;
  };
}

interface FCMMulticastResponse {
  responses: FCMResponse[];
  successCount: number;
  failureCount: number;
}

export class NotificationService {
  private get fcmDeviceRepository() {
    return AppDataSource.getRepository(FCMDevice);
  }

  private get notificationHistoryRepository() {
    return AppDataSource.getRepository(NotificationHistory);
  }

  async sendSMS(
    phone: string,
    message: string,
    sender?: string
  ): Promise<SMSResult> {
    try {
      const senderId = sender || config.sms.senderId || "Oysloe";

      const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
        method: "POST",
        headers: {
          "api-key": config.sms.arkeselApiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: senderId,
          message,
          recipients: [phone],
        }),
      });

      const data = (await response.json()) as ArkeselSMSResponse;

      if (!response.ok) {
        logError(`SMS sending failed: ${JSON.stringify(data)}`);
        return {
          success: false,
          error: data.message || "SMS sending failed",
          data,
        };
      }

      logInfo(`SMS sent successfully to ${phone}`);
      return {
        success: true,
        data,
      };
    } catch (error) {
      logError(`SMS sending error: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    _options?: { priority?: "high" | "normal" }
  ): Promise<PushNotificationResult> {
    try {
      const devices = await this.fcmDeviceRepository.find({
        where: { userId },
      });

      if (devices.length === 0) {
        logInfo(`No FCM devices found for user ${userId}`);
        return {
          success: true,
          deviceCount: 0,
        };
      }

      const { getMessaging } = await import("../config/firebase.js");
      const messaging = getMessaging();

      const tokens = devices.map((device) => device.token);

      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        tokens,
      };

      const response = (await messaging.sendEachForMulticast(
        message
      )) as FCMMulticastResponse;

      const invalidTokens: string[] = [];
      response.responses.forEach((resp: FCMResponse, index: number) => {
        const token = tokens[index];
        if (!resp.success && token !== undefined) {
          invalidTokens.push(token);
        }
      });

      if (invalidTokens.length > 0) {
        await this.fcmDeviceRepository.delete({
          token: In(invalidTokens),
        });
        logInfo(`Removed ${invalidTokens.length} invalid FCM tokens`);
      }

      logInfo(
        `Push notification sent to ${response.successCount}/${tokens.length} devices for user ${userId}`
      );

      return {
        success: true,
        deviceCount: response.successCount,
      };
    } catch (error) {
      logError(`Push notification error: ${error}`);
      return {
        success: false,
        deviceCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendOTP(phone: string, code: string): Promise<SMSResult> {
    const message = `Welcome to Oysloe Marketplace.\n\nYour OTP is ${code}\n\nRegards,\nOysloe Team`;
    return this.sendSMS(phone, message);
  }

  async sendBulkNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<PushNotificationResult> {
    let successCount = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      try {
        const result = await this.sendPushNotification(
          userId,
          title,
          body,
          data
        );
        if (result.success) {
          successCount += result.deviceCount;
        } else if (result.error) {
          errors.push(`User ${userId}: ${result.error}`);
        }
      } catch (error) {
        errors.push(
          `User ${userId}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return {
      success: errors.length === 0,
      deviceCount: successCount,
      error: errors.length > 0 ? errors.join("; ") : undefined,
    };
  }

  async isUserOnline(userId: string): Promise<boolean> {
    try {
      const devices = await this.fcmDeviceRepository.find({
        where: { userId },
      });
      return devices.length > 0;
    } catch (error) {
      logError(`Error checking user online status: ${error}`);
      return false;
    }
  }

  async saveNotificationHistory(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<NotificationHistory | null> {
    try {
      const notification = this.notificationHistoryRepository.create({
        userId,
        type,
        title,
        body,
        data,
      });

      const savedNotification = await this.notificationHistoryRepository.save(
        notification
      );
      logInfo(`Notification history saved for user ${userId}: ${type}`);
      return savedNotification;
    } catch (error) {
      logError("Failed to save notification history", error as Error);
      return null;
    }
  }

  async getNotificationHistory(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false
  ): Promise<{
    notifications: NotificationHistory[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const offset = (page - 1) * limit;
      const whereConditions: Record<string, unknown> = { userId };

      if (unreadOnly) {
        whereConditions.isRead = false;
      }

      const [notifications, total] =
        await this.notificationHistoryRepository.findAndCount({
          where: whereConditions,
          order: { createdAt: "DESC" },
          skip: offset,
          take: limit,
        });

      return {
        notifications,
        total,
        hasMore: offset + notifications.length < total,
      };
    } catch (error) {
      logError("Failed to get notification history", error as Error);
      return {
        notifications: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      const result = await this.notificationHistoryRepository.update(
        { id: notificationId, userId },
        { isRead: true, readAt: new Date() }
      );

      return result.affected ? result.affected > 0 : false;
    } catch (error) {
      logError("Failed to mark notification as read", error as Error);
      return false;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.notificationHistoryRepository.count({
        where: { userId, isRead: false },
      });
    } catch (error) {
      logError("Failed to get unread count", error as Error);
      return 0;
    }
  }

  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await this.notificationHistoryRepository.update(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      return result.affected || 0;
    } catch (error) {
      logError("Failed to mark all notifications as read", error as Error);
      return 0;
    }
  }

  async sendPushNotificationWithHistory(
    userId: string,
    title: string,
    body: string,
    type: NotificationType,
    data?: Record<string, string>
  ): Promise<PushNotificationResult & { historyId?: string }> {
    const pushResult = await this.sendPushNotification(
      userId,
      title,
      body,
      data
    );

    if (pushResult.success) {
      const historyRecord = await this.saveNotificationHistory(
        userId,
        type,
        title,
        body,
        data
      );

      return {
        ...pushResult,
        historyId: historyRecord?.id,
      };
    }

    return pushResult;
  }
}

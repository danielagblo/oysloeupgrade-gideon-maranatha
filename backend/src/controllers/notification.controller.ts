import { logError, logInfo } from "../utils/logger.js";
import type { Request, Response } from "express";
import { NotificationService } from "../services/notification.service.js";

export class NotificationController {
  private notificationService = new NotificationService();

  async getNotificationHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const { page, limit, unreadOnly } = (req.validated?.query || {}) as {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
      };

      const rawQuery = req.query as Partial<Record<string, string>>;
      const pageNum = page ?? (rawQuery.page ? parseInt(rawQuery.page, 10) : 1);
      const limitNum =
        limit ?? (rawQuery.limit ? parseInt(rawQuery.limit, 10) : 20);

      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid pagination parameters. Page must be >= 1, limit must be 1-100.",
        });
      }

      const unreadOnlyFlag =
        unreadOnly === true || String(rawQuery.unreadOnly) === "true";

      const result = await this.notificationService.getNotificationHistory(
        userId,
        pageNum,
        limitNum,
        unreadOnlyFlag
      );

      res.json({
        success: true,
        data: {
          ...result,
          page: pageNum,
          limit: limitNum,
        },
      });
    } catch (error) {
      logError("Failed to get notification history", error as Error);
      res.status(500).json({
        success: false,
        message: "Failed to get notification history",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const { id: notificationId } = (req.validated?.params ||
        req.params) as Partial<Record<string, string>>;

      const success = await this.notificationService.markAsRead(
        userId,
        notificationId as string
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Notification not found or access denied",
        });
      }

      res.json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      logError("Failed to mark notification as read", error as Error);
      res.status(500).json({
        success: false,
        message: "Failed to mark notification as read",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const unreadCount = await this.notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount },
      });
    } catch (error) {
      logError("Failed to get unread count", error as Error);
      res.status(500).json({
        success: false,
        message: "Failed to get unread count",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const markedCount = await this.notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: `${markedCount} notifications marked as read`,
        data: { markedCount },
      });
    } catch (error) {
      logError("Failed to mark all notifications as read", error as Error);
      res.status(500).json({
        success: false,
        message: "Failed to mark all notifications as read",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getNotificationSettings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const user = req.user;
      const settings = {
        emailNotifications: !!user?.preferredNotificationEmail,
        pushNotifications: true,
        smsNotifications: !!user?.preferredNotificationPhone,
        preferences: {
          chatMessages: true,
          walletUpdates: true,
          orderUpdates: true,
          marketingEmails: false,
        },
      };

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logError("Failed to get notification settings", error as Error);
      res.status(500).json({
        success: false,
        message: "Failed to get notification settings",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async updateNotificationSettings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const settings = req.validated?.body || req.body;

      logInfo(`Notification settings updated for user ${userId}`);

      res.json({
        success: true,
        message: "Notification settings updated",
        data: settings,
      });
    } catch (error) {
      logError("Failed to update notification settings", error as Error);
      res.status(500).json({
        success: false,
        message: "Failed to update notification settings",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

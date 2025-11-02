import type { Request, Response } from "express";
import { AppDataSource } from "../config/database.js";
import { FCMDevice } from "../entities/FCMDevice.js";
import { logError, logInfo } from "../utils/logger.js";

export interface RegisterDeviceRequest {
  token: string;
  deviceInfo?: Record<string, unknown>;
}

export class FCMController {
  private get fcmDeviceRepository() {
    return AppDataSource.getRepository(FCMDevice);
  }

  async registerDevice(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id!;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { token, deviceInfo }: RegisterDeviceRequest = req.body;

      if (!token) {
        res
          .status(400)
          .json({ success: false, message: "FCM token is required" });
        return;
      }

      const existingDevice = await this.fcmDeviceRepository.findOne({
        where: { token },
      });

      if (existingDevice) {
        existingDevice.userId = userId;
        existingDevice.deviceInfo = deviceInfo;
        await this.fcmDeviceRepository.save(existingDevice);

        logInfo(`FCM device updated for user ${userId}`);
        res.json({ success: true, message: "Device updated successfully" });
        return;
      }

      const device = this.fcmDeviceRepository.create({
        userId,
        token,
        deviceInfo,
      });

      await this.fcmDeviceRepository.save(device);

      logInfo(`FCM device registered for user ${userId}`);
      res.json({ success: true, message: "Device registered successfully" });
    } catch (error) {
      logError(`FCM device registration error: ${error}`);
      res
        .status(500)
        .json({ success: false, message: "Failed to register device" });
    }
  }

  async unregisterDevice(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id!;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { token } = req.params;

      if (!token) {
        res.status(400).json({ success: false, message: "Token is required" });
        return;
      }

      const device = await this.fcmDeviceRepository.findOne({
        where: { token, userId },
      });

      if (!device) {
        res.status(404).json({ success: false, message: "Device not found" });
        return;
      }

      await this.fcmDeviceRepository.remove(device);

      logInfo(`FCM device removed for user ${userId}`);
      res.json({ success: true, message: "Device removed successfully" });
    } catch (error) {
      logError(`FCM device removal error: ${error}`);
      res
        .status(500)
        .json({ success: false, message: "Failed to remove device" });
    }
  }

  async getDevices(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id!;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const devices = await this.fcmDeviceRepository.find({
        where: { userId },
        select: ["id", "token", "deviceInfo", "createdAt"],
      });

      res.json({
        success: true,
        devices: devices.map((device) => ({
          id: device.id,
          token: `${device.token.substring(0, 20)}...`,
          deviceInfo: device.deviceInfo,
          createdAt: device.createdAt,
        })),
      });
    } catch (error) {
      logError(`FCM devices fetch error: ${error}`);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch devices" });
    }
  }

  async testNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id!;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { NotificationService } = await import(
        "../services/notification.service.js"
      );
      const notificationService = new NotificationService();

      const result = await notificationService.sendPushNotification(
        userId,
        "Test Notification",
        "This is a test notification from Oysloe Marketplace",
        { type: "test" }
      );

      if (result.success) {
        res.json({
          success: true,
          message: `Test notification sent to ${result.deviceCount} devices`,
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.error || "Failed to send test notification",
        });
      }
    } catch (error) {
      logError(`Test notification error: ${error}`);
      res
        .status(500)
        .json({ success: false, message: "Failed to send test notification" });
    }
  }
}

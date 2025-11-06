import { Router } from 'express';
import { z } from 'zod';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';

const router = Router();
const notificationController = new NotificationController();

const getNotificationHistorySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1).describe('Page number'),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .optional()
      .default(20)
      .describe('Number of notifications per page'),
    unreadOnly: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => val === 'true')
      .describe('Filter to unread notifications only'),
  }),
});

const markAsReadSchema = z.object({
  params: z.object({
    id: z.string().uuid().describe('Notification ID'),
  }),
});

const updateNotificationSettingsSchema = z.object({
  body: z.object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    preferences: z
      .object({
        chatMessages: z.boolean().optional(),
        walletUpdates: z.boolean().optional(),
        orderUpdates: z.boolean().optional(),
        marketingEmails: z.boolean().optional(),
      })
      .optional(),
  }),
});

router.get(
  '/history',
  authenticate,
  validateRequest(getNotificationHistorySchema),
  notificationController.getNotificationHistory.bind(notificationController)
);

router.put(
  '/:id/read',
  authenticate,
  validateRequest(markAsReadSchema),
  notificationController.markAsRead.bind(notificationController)
);

router.get(
  '/unread-count',
  authenticate,
  notificationController.getUnreadCount.bind(notificationController)
);

router.put(
  '/mark-all-read',
  authenticate,
  notificationController.markAllAsRead.bind(notificationController)
);

router.get(
  '/settings',
  authenticate,
  notificationController.getNotificationSettings.bind(notificationController)
);

router.put(
  '/settings',
  authenticate,
  validateRequest(updateNotificationSettingsSchema),
  notificationController.updateNotificationSettings.bind(notificationController)
);

export default router;

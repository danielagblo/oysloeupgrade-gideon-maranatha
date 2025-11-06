import { z } from 'zod';

export const notificationHistoryItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum([
    'chat_message',
    'wallet_credit',
    'wallet_debit',
    'welcome',
    'account_created',
    'coupon_redemption',
    'referral_bonus',
    'referral_redemption',
    'product_review',
  ]),
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()).optional(),
  isRead: z.boolean(),
  readAt: z.date().optional(),
  createdAt: z.date(),
});

export const getNotificationHistorySchema = z.object({
  query: z.object({
    page: z.string().optional().describe('Page number'),
    limit: z.string().optional().describe('Number of notifications per page'),
    unreadOnly: z.string().optional().describe('Filter to unread notifications only'),
  }),
});

export const markAsReadSchema = z.object({
  params: z.object({
    id: z.string().uuid().describe('Notification ID'),
  }),
});

export const updateNotificationSettingsSchema = z.object({
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

export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  preferences: z.object({
    chatMessages: z.boolean(),
    walletUpdates: z.boolean(),
    orderUpdates: z.boolean(),
    marketingEmails: z.boolean(),
  }),
});

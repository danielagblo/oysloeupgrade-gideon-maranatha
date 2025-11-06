import { logError, logInfo } from '../utils/logger.js';
import type { INotification } from './notification.port';

export class FirebaseNotificationService implements INotification {
  private projectId: string;
  private privateKey: string;
  private clientEmail: string;

  constructor(config: {
    projectId?: string;
    privateKey?: string;
    clientEmail?: string;
  }) {
    if (!config.projectId || !config.privateKey || !config.clientEmail) {
      throw new Error('Firebase configuration missing required fields');
    }
    this.projectId = config.projectId;
    this.privateKey = config.privateKey;
    this.clientEmail = config.clientEmail;
  }

  async send(to: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const { getMessaging } = await import('../config/firebase.js');
      const messaging = getMessaging();

      const data: Record<string, string> = {};
      if (payload.data && typeof payload.data === 'object') {
        for (const [key, value] of Object.entries(payload.data)) {
          if (typeof value !== 'string') {
            throw new Error(`Data field "${key}" must be a string, got ${typeof value}`);
          }
          data[key] = value;
        }
      }

      const message = {
        notification: {
          title: (payload.title as string) || 'Notification',
          body: (payload.body as string) || 'You have a new notification',
        },
        data,
        token: to,
      };

      const response = await messaging.send(message);
      logInfo(`Firebase notification sent successfully: ${response}`);
    } catch (error) {
      logError(`Firebase notification failed: ${error}`);
      throw new Error(
        `Failed to send Firebase notification: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging as getMessagingFunction, type Messaging } from 'firebase-admin/messaging';
import { logError, logInfo } from '../utils/logger.js';
import { config } from './env.js';

let messaging: Messaging | null = null;

export function getMessaging(): Messaging {
  if (!messaging) {
    throw new Error('Firebase Admin not initialized. Call initializeFirebase() first.');
  }
  return messaging;
}

export async function initializeFirebase(): Promise<void> {
  try {

    if (getApps().length > 0) {
      messaging = getMessaging();
      logInfo('Firebase Admin already initialized');
      return;
    }

    if (!config.firebase.projectId || !config.firebase.privateKey || !config.firebase.clientEmail) {
      logInfo('Firebase configuration is incomplete. Skipping Firebase initialization.');
      return;
    }

    const serviceAccount = {
      projectId: config.firebase.projectId,
      privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
      clientEmail: config.firebase.clientEmail,
    };

    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });

    messaging = getMessagingFunction(app);
    logInfo('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logError(`Firebase initialization failed: ${error}`);
    throw error;
  }
}

export async function sendTestNotification(token: string): Promise<boolean> {
  try {
    const messagingInstance = getMessaging();

    const message = {
      notification: {
        title: 'Test Notification',
        body: 'This is a test notification from Oysloe Marketplace',
      },
      token,
    };

    const response = await messagingInstance.send(message);
    logInfo(`Test notification sent successfully: ${response}`);
    return true;
  } catch (error) {
    logError(`Test notification failed: ${error}`);
    return false;
  }
}

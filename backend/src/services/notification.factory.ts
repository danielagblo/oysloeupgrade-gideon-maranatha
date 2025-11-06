import { FirebaseNotificationService } from './notification.firebase';
import { NoopNotificationService } from './notification.noop';
import type { INotification } from './notification.port';

export function makeNotificationService(env: NodeJS.ProcessEnv = process.env): INotification {
  const mode = env.APP_MODE ?? env.NODE_ENV ?? 'development';

  if (mode === 'test') {
    return new NoopNotificationService();
  }

  const hasFirebaseConfig = !!(
    env.FIREBASE_PROJECT_ID &&
    env.FIREBASE_PRIVATE_KEY &&
    env.FIREBASE_CLIENT_EMAIL
  );

  if (hasFirebaseConfig) {
    try {
      return new FirebaseNotificationService({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      });
    } catch (error) {
      console.warn(
        'Firebase notification service initialization failed, falling back to Noop:',
        error
      );
      return new NoopNotificationService();
    }
  }

  return new NoopNotificationService();
}

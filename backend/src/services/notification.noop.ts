import type { INotification } from "./notification.port";

export class NoopNotificationService implements INotification {
  async send(_to: string, _payload: Record<string, unknown>): Promise<void> {
  }
}

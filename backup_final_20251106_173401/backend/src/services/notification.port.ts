export interface INotification {
  send(to: string, payload: Record<string, unknown>): Promise<void>;
}

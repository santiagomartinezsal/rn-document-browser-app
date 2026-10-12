import type { Notification } from './notification';

export interface NotificationsSource {
  subscribe(onNotification: (notification: Notification) => void): void;
  start(): void;
  stop(): void;
}

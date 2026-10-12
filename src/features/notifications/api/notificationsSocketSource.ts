import { createReconnectingWebSocket } from '@/shared/ws/reconnectingWebSocket';
import type { WebSocketFactory } from '@/shared/ws/reconnectingWebSocket';

import type { Notification } from '../domain/notification';
import type { NotificationsSource } from '../domain/notificationsSource';
import { InvalidNotificationError, parseNotification } from './notificationParser';

export function createNotificationsSocketSource(
  url: string,
  createWebSocket?: WebSocketFactory,
): NotificationsSource {
  let listener: ((notification: Notification) => void) | null = null;

  const socket = createReconnectingWebSocket({
    url,
    createWebSocket,
    onMessage: (data) => {
      let notification: Notification;
      try {
        notification = parseNotification(data);
      } catch (error) {
        if (!(error instanceof InvalidNotificationError)) {
          throw error;
        }
        console.warn(error.message);
        return;
      }
      listener?.(notification);
    },
  });

  return {
    subscribe(onNotification) {
      listener = onNotification;
    },
    start: socket.start,
    stop: socket.stop,
  };
}

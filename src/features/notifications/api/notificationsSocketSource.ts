import { WebSocket as PartySocket } from 'partysocket';

import type { Notification } from '../domain/notification';
import type { NotificationsSource } from '../domain/notificationsSource';
import { InvalidNotificationError, parseNotification } from './notificationParser';

interface PartySocketLike {
  onmessage: ((event: { data: string }) => void) | null;
  reconnect(): void;
  close(): void;
}

type PartySocketFactory = (url: string) => PartySocketLike;

// partysocket's `onmessage` carries a full MessageEvent; this module only
// reads `.data`, so the cast narrows it to PartySocketLike at this one seam.
function createDefaultPartySocket(url: string): PartySocketLike {
  return new PartySocket(url, [], { startClosed: true }) as unknown as PartySocketLike;
}

export function createNotificationsSocketSource(
  url: string,
  createPartySocket: PartySocketFactory = createDefaultPartySocket,
): NotificationsSource {
  let listener: ((notification: Notification) => void) | null = null;
  const socket = createPartySocket(url);

  socket.onmessage = (event) => {
    let notification: Notification;
    try {
      notification = parseNotification(event.data);
    } catch (error) {
      if (!(error instanceof InvalidNotificationError)) {
        throw error;
      }
      console.warn(error.message);
      return;
    }
    listener?.(notification);
  };

  return {
    subscribe(onNotification) {
      listener = onNotification;
    },
    start() {
      socket.reconnect();
    },
    stop() {
      socket.close();
    },
  };
}

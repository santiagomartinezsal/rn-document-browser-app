import { getWsBaseUrl } from '@/shared/http/serverConfig';

import { createNotificationsSocketSource } from './api/notificationsSocketSource';
import type { Notification } from './domain/notification';
import type { NotificationsSource } from './domain/notificationsSource';
import { NotificationsProvider } from './state/NotificationsSourceContext';
import { useNotifications } from './state/useNotifications';
import { NotificationBell } from './ui/NotificationBell';
import { NotificationsPanel } from './ui/NotificationsPanel';

export { NotificationBell, NotificationsPanel, NotificationsProvider, useNotifications };
export type { Notification, NotificationsSource };

export function createNotificationsSource(): NotificationsSource {
  return createNotificationsSocketSource(`${getWsBaseUrl()}/notifications`);
}

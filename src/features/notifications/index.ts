import { getWsBaseUrl } from '@/shared/http/serverConfig';

import { createNotificationsSocketSource } from './api/notificationsSocketSource';
import type { Notification } from './domain/notification';
import type { NotificationsSource } from './domain/notificationsSource';
import { NotificationsProvider } from './state/NotificationsSourceContext';
import { useNotifications } from './state/useNotifications';

export { NotificationsProvider, useNotifications };
export type { Notification };

export function createNotificationsSource(): NotificationsSource {
  return createNotificationsSocketSource(`${getWsBaseUrl()}/notifications`);
}

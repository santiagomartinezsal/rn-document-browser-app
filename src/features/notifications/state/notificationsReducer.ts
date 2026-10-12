import type { Notification } from '../domain/notification';

export interface NotificationsState {
  items: Notification[];
  unreadCount: number;
}

export type NotificationsAction =
  { type: 'NOTIFICATION_RECEIVED'; notification: Notification } | { type: 'NOTIFICATIONS_READ' };

export const initialNotificationsState: NotificationsState = { items: [], unreadCount: 0 };

export function notificationsReducer(
  state: NotificationsState,
  action: NotificationsAction,
): NotificationsState {
  switch (action.type) {
    case 'NOTIFICATION_RECEIVED':
      return {
        items: [action.notification, ...state.items],
        unreadCount: state.unreadCount + 1,
      };
    case 'NOTIFICATIONS_READ':
      return { ...state, unreadCount: 0 };
  }
}

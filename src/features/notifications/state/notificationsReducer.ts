import type { Notification } from '../domain/notification';

export interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  isPanelOpen: boolean;
}

export type NotificationsAction =
  | { type: 'NOTIFICATION_RECEIVED'; notification: Notification }
  | { type: 'PANEL_OPENED' }
  | { type: 'PANEL_CLOSED' };

export const initialNotificationsState: NotificationsState = {
  items: [],
  unreadCount: 0,
  isPanelOpen: false,
};

export function notificationsReducer(
  state: NotificationsState,
  action: NotificationsAction,
): NotificationsState {
  switch (action.type) {
    case 'NOTIFICATION_RECEIVED':
      return {
        ...state,
        items: [action.notification, ...state.items],
        // While the panel is open, the notification is already visible live
        // in the list, so it isn't counted as unread.
        unreadCount: state.isPanelOpen ? state.unreadCount : state.unreadCount + 1,
      };
    case 'PANEL_OPENED':
      return { ...state, isPanelOpen: true, unreadCount: 0 };
    case 'PANEL_CLOSED':
      return { ...state, isPanelOpen: false };
  }
}

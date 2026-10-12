import { useEffect, useReducer } from 'react';

import { useNotificationsSource } from './NotificationsSourceContext';
import { initialNotificationsState, notificationsReducer } from './notificationsReducer';
import type { NotificationsState } from './notificationsReducer';

export interface UseNotificationsResult {
  items: NotificationsState['items'];
  unreadCount: NotificationsState['unreadCount'];
  isPanelOpen: NotificationsState['isPanelOpen'];
  openPanel: () => void;
  closePanel: () => void;
}

export function useNotifications(): UseNotificationsResult {
  const source = useNotificationsSource();
  const [state, dispatch] = useReducer(notificationsReducer, initialNotificationsState);

  const openPanel = () => {
    dispatch({ type: 'PANEL_OPENED' });
  };

  const closePanel = () => {
    dispatch({ type: 'PANEL_CLOSED' });
  };

  useEffect(() => {
    source.subscribe((notification) => {
      dispatch({ type: 'NOTIFICATION_RECEIVED', notification });
    });
    source.start();

    return () => {
      source.stop();
    };
  }, [source]);

  return {
    items: state.items,
    unreadCount: state.unreadCount,
    isPanelOpen: state.isPanelOpen,
    openPanel,
    closePanel,
  };
}

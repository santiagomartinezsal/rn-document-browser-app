import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type { NotificationsSource } from '../domain/notificationsSource';

const NotificationsSourceContext = createContext<NotificationsSource | null>(null);

export interface NotificationsProviderProps {
  /**
   * Must stay the same reference across renders (e.g. constructed outside
   * the component) — useNotifications subscribes to it once on mount.
   */
  source: NotificationsSource;
  children: ReactNode;
}

export function NotificationsProvider({ source, children }: NotificationsProviderProps) {
  return (
    <NotificationsSourceContext.Provider value={source}>
      {children}
    </NotificationsSourceContext.Provider>
  );
}

export function useNotificationsSource(): NotificationsSource {
  const source = useContext(NotificationsSourceContext);
  if (!source) {
    throw new Error('useNotificationsSource must be used within a NotificationsProvider');
  }
  return source;
}

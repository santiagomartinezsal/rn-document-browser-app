import type { Notification } from '../domain/notification';
import { initialNotificationsState, notificationsReducer } from './notificationsReducer';

const sampleNotification: Notification = {
  userName: 'Hazle Kuhlman',
  documentTitle: 'Two Hearted Ale',
  documentId: 'doc-1',
  timestamp: '2026-10-09T16:15:42.570Z',
};

describe('notificationsReducer', () => {
  it('prepends the notification and increments unreadCount on NOTIFICATION_RECEIVED', () => {
    const state = notificationsReducer(initialNotificationsState, {
      type: 'NOTIFICATION_RECEIVED',
      notification: sampleNotification,
    });

    expect(state).toEqual({ items: [sampleNotification], unreadCount: 1, isPanelOpen: false });
  });

  it('keeps earlier notifications when another one is received', () => {
    const firstState = notificationsReducer(initialNotificationsState, {
      type: 'NOTIFICATION_RECEIVED',
      notification: sampleNotification,
    });
    const secondNotification: Notification = { ...sampleNotification, documentId: 'doc-2' };

    const state = notificationsReducer(firstState, {
      type: 'NOTIFICATION_RECEIVED',
      notification: secondNotification,
    });

    expect(state).toEqual({
      items: [secondNotification, sampleNotification],
      unreadCount: 2,
      isPanelOpen: false,
    });
  });

  it('does not increment unreadCount for a notification received while the panel is open', () => {
    const openState = notificationsReducer(initialNotificationsState, { type: 'PANEL_OPENED' });

    const state = notificationsReducer(openState, {
      type: 'NOTIFICATION_RECEIVED',
      notification: sampleNotification,
    });

    expect(state).toEqual({ items: [sampleNotification], unreadCount: 0, isPanelOpen: true });
  });

  it('opens the panel and resets unreadCount to 0 on PANEL_OPENED', () => {
    const receivedState = notificationsReducer(initialNotificationsState, {
      type: 'NOTIFICATION_RECEIVED',
      notification: sampleNotification,
    });

    const state = notificationsReducer(receivedState, { type: 'PANEL_OPENED' });

    expect(state).toEqual({ items: [sampleNotification], unreadCount: 0, isPanelOpen: true });
  });

  it('closes the panel on PANEL_CLOSED without touching items or unreadCount', () => {
    const openState = notificationsReducer(initialNotificationsState, { type: 'PANEL_OPENED' });

    const state = notificationsReducer(openState, { type: 'PANEL_CLOSED' });

    expect(state).toEqual({ items: [], unreadCount: 0, isPanelOpen: false });
  });
});

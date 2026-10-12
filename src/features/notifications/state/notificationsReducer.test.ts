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

    expect(state).toEqual({ items: [sampleNotification], unreadCount: 1 });
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
    });
  });

  it('resets unreadCount to 0 on NOTIFICATIONS_READ without touching items', () => {
    const receivedState = notificationsReducer(initialNotificationsState, {
      type: 'NOTIFICATION_RECEIVED',
      notification: sampleNotification,
    });

    const state = notificationsReducer(receivedState, { type: 'NOTIFICATIONS_READ' });

    expect(state).toEqual({ items: [sampleNotification], unreadCount: 0 });
  });
});

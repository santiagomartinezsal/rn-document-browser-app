import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { Notification, NotificationsSource } from '@/features/notifications';
import { NotificationsProvider } from '@/features/notifications';

import { AppHeader } from './AppHeader';

const sampleNotification: Notification = {
  userName: 'Hazle Kuhlman',
  documentTitle: 'Two Hearted Ale',
  documentId: 'notif-doc-1',
  timestamp: '2026-10-09T16:15:42.570Z',
};

function buildNotificationsSource(
  overrides: Partial<NotificationsSource> = {},
): NotificationsSource {
  return {
    subscribe: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    ...overrides,
  };
}

async function renderHeader(notificationsSource: NotificationsSource = buildNotificationsSource()) {
  return render(
    <NotificationsProvider source={notificationsSource}>
      <AppHeader title="Documents" />
    </NotificationsProvider>,
  );
}

describe('AppHeader', () => {
  it('shows the given title', async () => {
    await renderHeader();

    expect(screen.getByText('Documents')).toBeOnTheScreen();
  });

  it('opens the notifications panel when the bell is pressed', async () => {
    await renderHeader();

    await fireEvent.press(screen.getByTestId('notification-bell'));

    expect(screen.getByTestId('notifications-panel-close-button')).toBeOnTheScreen();
  });

  it('clears the unread badge when the panel is opened', async () => {
    let emit: ((notification: Notification) => void) | undefined;
    const notificationsSource = buildNotificationsSource({
      subscribe: jest.fn((onNotification) => {
        emit = onNotification;
      }),
    });

    await renderHeader(notificationsSource);
    await act(() => {
      emit?.(sampleNotification);
    });

    expect(screen.getByTestId('notification-bell-badge')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('notification-bell'));

    expect(screen.queryByTestId('notification-bell-badge')).not.toBeOnTheScreen();
  });
});

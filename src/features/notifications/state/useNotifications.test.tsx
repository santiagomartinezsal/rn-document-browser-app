import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { Notification } from '../domain/notification';
import type { NotificationsSource } from '../domain/notificationsSource';
import { NotificationsProvider } from './NotificationsSourceContext';
import { useNotifications } from './useNotifications';

const sampleNotification: Notification = {
  userName: 'Hazle Kuhlman',
  documentTitle: 'Two Hearted Ale',
  documentId: 'doc-1',
  timestamp: '2026-10-09T16:15:42.570Z',
};

function buildSource(overrides: Partial<NotificationsSource> = {}): NotificationsSource {
  return {
    subscribe: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    ...overrides,
  };
}

function renderWithSource(source: NotificationsSource) {
  function wrapper({ children }: { children: ReactNode }) {
    return <NotificationsProvider source={source}>{children}</NotificationsProvider>;
  }

  return renderHook(() => useNotifications(), { wrapper });
}

describe('useNotifications', () => {
  it('starts the source on mount', async () => {
    const source = buildSource();

    await renderWithSource(source);

    expect(source.start).toHaveBeenCalled();
  });

  it('increments unreadCount and prepends the notification when the source emits one', async () => {
    let emit: ((notification: Notification) => void) | undefined;
    const source = buildSource({
      subscribe: jest.fn((onNotification) => {
        emit = onNotification;
      }),
    });
    const { result } = await renderWithSource(source);

    await act(() => {
      emit?.(sampleNotification);
    });

    expect(result.current.items).toEqual([sampleNotification]);
    expect(result.current.unreadCount).toBe(1);
  });

  it('resets unreadCount but keeps items when openPanel is called', async () => {
    let emit: ((notification: Notification) => void) | undefined;
    const source = buildSource({
      subscribe: jest.fn((onNotification) => {
        emit = onNotification;
      }),
    });
    const { result } = await renderWithSource(source);

    await act(() => {
      emit?.(sampleNotification);
    });
    await act(() => {
      result.current.openPanel();
    });

    expect(result.current.items).toEqual([sampleNotification]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.isPanelOpen).toBe(true);
  });

  it('does not increment unreadCount for a notification received while the panel is open', async () => {
    let emit: ((notification: Notification) => void) | undefined;
    const source = buildSource({
      subscribe: jest.fn((onNotification) => {
        emit = onNotification;
      }),
    });
    const { result } = await renderWithSource(source);

    await act(() => {
      result.current.openPanel();
    });
    await act(() => {
      emit?.(sampleNotification);
    });

    expect(result.current.items).toEqual([sampleNotification]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('closes the panel when closePanel is called', async () => {
    const source = buildSource();
    const { result } = await renderWithSource(source);

    await act(() => {
      result.current.openPanel();
    });
    await act(() => {
      result.current.closePanel();
    });

    expect(result.current.isPanelOpen).toBe(false);
  });

  it('stops the source on unmount', async () => {
    const source = buildSource();
    const { unmount } = await renderWithSource(source);

    await unmount();

    expect(source.stop).toHaveBeenCalled();
  });

  it('throws when rendered outside a NotificationsProvider', async () => {
    await expect(renderHook(() => useNotifications())).rejects.toThrow(
      'useNotificationsSource must be used within a NotificationsProvider',
    );
  });
});

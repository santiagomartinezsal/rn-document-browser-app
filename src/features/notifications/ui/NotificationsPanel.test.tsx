import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Notification } from '../domain/notification';
import { NotificationsPanel } from './NotificationsPanel';

const sampleNotifications: Notification[] = [
  {
    userName: 'Hazle Kuhlman',
    documentTitle: 'Two Hearted Ale',
    documentId: 'doc-1',
    timestamp: '2026-10-09T16:15:42.570Z',
  },
  {
    userName: 'Antonina Marquardt',
    documentTitle: 'Schneider Aventinus',
    documentId: 'doc-2',
    timestamp: '2026-10-09T16:15:43.572Z',
  },
];

describe('NotificationsPanel', () => {
  it('renders one row per notification', async () => {
    await render(
      <NotificationsPanel visible notifications={sampleNotifications} onClose={jest.fn()} />,
    );

    expect(screen.getByText('Two Hearted Ale')).toBeOnTheScreen();
    expect(screen.getByText('Hazle Kuhlman')).toBeOnTheScreen();
    expect(screen.getByText('Schneider Aventinus')).toBeOnTheScreen();
    expect(screen.getByText('Antonina Marquardt')).toBeOnTheScreen();
  });

  it('shows the empty state message when there are no notifications', async () => {
    await render(<NotificationsPanel visible notifications={[]} onClose={jest.fn()} />);

    expect(screen.getByTestId('notifications-panel-empty')).toBeOnTheScreen();
    expect(screen.getByText('No notifications yet.')).toBeOnTheScreen();
  });

  it('calls onClose when the close button is pressed', async () => {
    const onClose = jest.fn();
    await render(
      <NotificationsPanel visible notifications={sampleNotifications} onClose={onClose} />,
    );

    await fireEvent.press(screen.getByTestId('notifications-panel-close-button'));

    expect(onClose).toHaveBeenCalled();
  });
});

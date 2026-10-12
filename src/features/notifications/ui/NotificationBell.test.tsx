import { fireEvent, render, screen } from '@testing-library/react-native';

import { NotificationBell } from './NotificationBell';

describe('NotificationBell', () => {
  it('hides the badge when unreadCount is 0', async () => {
    await render(<NotificationBell unreadCount={0} onPress={jest.fn()} />);

    expect(screen.queryByTestId('notification-bell-badge')).not.toBeOnTheScreen();
  });

  it('shows the unread count when greater than 0', async () => {
    await render(<NotificationBell unreadCount={3} onPress={jest.fn()} />);

    expect(screen.getByTestId('notification-bell-badge')).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  it('caps the displayed count at 99 when the unread count exceeds it', async () => {
    await render(<NotificationBell unreadCount={100} onPress={jest.fn()} />);

    expect(screen.getByText('99')).toBeOnTheScreen();
  });

  it('shows the exact count at the 99 boundary', async () => {
    await render(<NotificationBell unreadCount={99} onPress={jest.fn()} />);

    expect(screen.getByText('99')).toBeOnTheScreen();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<NotificationBell unreadCount={0} onPress={onPress} />);

    await fireEvent.press(screen.getByTestId('notification-bell'));

    expect(onPress).toHaveBeenCalled();
  });
});

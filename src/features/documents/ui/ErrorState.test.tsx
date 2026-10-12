import { fireEvent, render, screen } from '@testing-library/react-native';

import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('shows the error message', async () => {
    await render(<ErrorState message="network down" onRetry={jest.fn()} />);

    expect(screen.getByTestId('documents-error')).toBeOnTheScreen();
    expect(screen.getByText('network down')).toBeOnTheScreen();
  });

  it('calls onRetry when the retry button is pressed', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState message="network down" onRetry={onRetry} />);

    await fireEvent.press(screen.getByTestId('documents-retry-button'));

    expect(onRetry).toHaveBeenCalled();
  });
});

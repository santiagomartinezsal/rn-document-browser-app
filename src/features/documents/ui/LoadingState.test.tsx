import { render, screen } from '@testing-library/react-native';

import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('shows the loading message', async () => {
    await render(<LoadingState />);

    expect(screen.getByTestId('documents-loading')).toBeOnTheScreen();
    expect(screen.getByText('Loading documents…')).toBeOnTheScreen();
  });
});

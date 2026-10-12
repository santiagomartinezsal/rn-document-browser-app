import { render, screen } from '@testing-library/react-native';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('shows the empty-list message', async () => {
    await render(<EmptyState />);

    expect(screen.getByTestId('documents-empty')).toBeOnTheScreen();
    expect(screen.getByText('No documents yet.')).toBeOnTheScreen();
  });
});

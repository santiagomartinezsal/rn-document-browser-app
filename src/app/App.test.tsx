import { render, screen } from '@testing-library/react-native';

import App from '@/app/App';

describe('App', () => {
  it('renders without crashing', async () => {
    await render(<App />);

    expect(screen.getByTestId('app-root')).toBeOnTheScreen();
  });
});

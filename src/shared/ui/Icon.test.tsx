import { render, screen } from '@testing-library/react-native';

import { Icon } from './Icon';

describe('Icon', () => {
  it('renders without crashing', async () => {
    await render(<Icon name="bell" size={22} color="#000000" />);

    expect(screen.toJSON()).not.toBeNull();
  });
});

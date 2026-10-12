import { render, screen } from '@testing-library/react-native';

import App from '@/app/App';

const serverResponse = [
  {
    ID: '43afce49-5867-4b28-8385-40c0be6437ab',
    CreatedAt: '2024-01-01T00:00:00Z',
    UpdatedAt: '2024-01-01T00:00:00Z',
    Title: 'Chimay Grande Réserve',
    Attachments: ['Porter'],
    Contributors: [{ ID: '51fea9fb-9f4a-45e8-82aa-12c560bfeb2c', Name: 'Brendon Ward' }],
    Version: '4.8.12',
  },
];

describe('App', () => {
  it('renders the documents fetched from the server', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(serverResponse),
    }) as typeof fetch;

    await render(<App />);

    expect(await screen.findByText(serverResponse[0].Title)).toBeOnTheScreen();
  });
});

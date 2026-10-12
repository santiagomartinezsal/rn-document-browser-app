import { render, screen } from '@testing-library/react-native';

import type { Document } from '../domain/document';
import { DocumentGridCard } from './DocumentGridCard';

function buildDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-1',
    title: 'Hop Rod Rye',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    attachments: [],
    contributors: [],
    version: '2.6.16',
    ...overrides,
  };
}

describe('DocumentGridCard', () => {
  it('renders the title and version', async () => {
    const document = buildDocument();

    await render(<DocumentGridCard document={document} />);

    expect(screen.getByTestId('document-grid-doc-1')).toBeOnTheScreen();
    expect(screen.getByText('Hop Rod Rye')).toBeOnTheScreen();
    expect(screen.getByText('Version 2.6.16')).toBeOnTheScreen();
  });

  it('does not render contributors or attachments', async () => {
    const document = buildDocument({
      contributors: [{ id: 'c-1', name: 'Carlie Abott' }],
      attachments: ['Light Lager'],
    });

    await render(<DocumentGridCard document={document} />);

    expect(screen.queryByText('Contributors')).not.toBeOnTheScreen();
    expect(screen.queryByText('Attachments')).not.toBeOnTheScreen();
  });
});

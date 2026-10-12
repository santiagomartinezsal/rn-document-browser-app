import { render, screen } from '@testing-library/react-native';

import type { Document } from '../domain/document';
import { DocumentCard } from './DocumentCard';

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

describe('DocumentCard', () => {
  it('renders the title, version, contributors, and attachments', async () => {
    const document = buildDocument({
      contributors: [
        { id: 'c-1', name: 'Carlie Abott' },
        { id: 'c-2', name: 'Zoe Buckridge' },
      ],
      attachments: ['Light Lager', 'Porter'],
    });

    await render(<DocumentCard document={document} />);

    expect(screen.getByTestId('document-doc-1')).toBeOnTheScreen();
    expect(screen.getByText('Hop Rod Rye')).toBeOnTheScreen();
    expect(screen.getByText('Version 2.6.16')).toBeOnTheScreen();
    expect(screen.getByText('Contributors')).toBeOnTheScreen();
    expect(screen.getByText('Carlie Abott')).toBeOnTheScreen();
    expect(screen.getByText('Zoe Buckridge')).toBeOnTheScreen();
    expect(screen.getByText('Attachments')).toBeOnTheScreen();
    expect(screen.getByText('Light Lager')).toBeOnTheScreen();
    expect(screen.getByText('Porter')).toBeOnTheScreen();
  });

  it('shows the column labels with no items when contributors and attachments are empty', async () => {
    const document = buildDocument({ contributors: [], attachments: [] });

    await render(<DocumentCard document={document} />);

    expect(screen.getByTestId('document-doc-1')).toBeOnTheScreen();
    expect(screen.getByText('Contributors')).toBeOnTheScreen();
    expect(screen.getByText('Attachments')).toBeOnTheScreen();
  });
});

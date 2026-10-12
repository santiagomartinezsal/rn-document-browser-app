import { render, screen } from '@testing-library/react-native';

import type { Document } from '../domain/document';
import { DocumentGrid } from './DocumentGrid';

const sampleDocuments: Document[] = [
  {
    id: 'doc-1',
    title: 'Hop Rod Rye',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    attachments: [],
    contributors: [],
    version: '2.6.16',
  },
  {
    id: 'doc-2',
    title: 'Stone IPA',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    attachments: [],
    contributors: [],
    version: '3.8.11',
  },
];

describe('DocumentGrid', () => {
  it('renders a grid card for each document', async () => {
    await render(<DocumentGrid documents={sampleDocuments} />);

    expect(screen.getByTestId('document-grid-doc-1')).toBeOnTheScreen();
    expect(screen.getByTestId('document-grid-doc-2')).toBeOnTheScreen();
    expect(screen.getByText('Hop Rod Rye')).toBeOnTheScreen();
    expect(screen.getByText('Stone IPA')).toBeOnTheScreen();
  });

  it('renders every document when the count is odd', async () => {
    const oddDocuments = [...sampleDocuments, { ...sampleDocuments[0], id: 'doc-3' }];

    await render(<DocumentGrid documents={oddDocuments} />);

    expect(screen.getByTestId('document-grid-doc-1')).toBeOnTheScreen();
    expect(screen.getByTestId('document-grid-doc-2')).toBeOnTheScreen();
    expect(screen.getByTestId('document-grid-doc-3')).toBeOnTheScreen();
  });
});

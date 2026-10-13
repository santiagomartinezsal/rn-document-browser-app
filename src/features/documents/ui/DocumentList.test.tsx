import { render, screen } from '@testing-library/react-native';

import type { Document } from '../domain/document';
import { DocumentList } from './DocumentList';

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

describe('DocumentList', () => {
  it('renders a card for each document', async () => {
    await render(
      <DocumentList documents={sampleDocuments} refreshing={false} onRefresh={() => {}} />,
    );

    expect(screen.getByTestId('document-doc-1')).toBeOnTheScreen();
    expect(screen.getByTestId('document-doc-2')).toBeOnTheScreen();
    expect(screen.getByText('Hop Rod Rye')).toBeOnTheScreen();
    expect(screen.getByText('Stone IPA')).toBeOnTheScreen();
  });

  it('wires the refreshControl to the given refreshing and onRefresh props', async () => {
    const onRefresh = jest.fn();
    await render(
      <DocumentList documents={sampleDocuments} refreshing={true} onRefresh={onRefresh} />,
    );

    const refreshControl = screen.getByTestId('documents-list').props.refreshControl;
    expect(refreshControl.props.refreshing).toBe(true);

    refreshControl.props.onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

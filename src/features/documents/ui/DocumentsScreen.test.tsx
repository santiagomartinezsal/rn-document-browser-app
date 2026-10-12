import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Document } from '../domain/document';
import type { DocumentsRepository } from '../domain/documentsRepository';
import { DocumentsProvider } from '../state/DocumentsRepositoryContext';
import { DocumentsScreen } from './DocumentsScreen';

const sampleDocuments: Document[] = [
  {
    id: 'doc-1',
    title: 'First Document',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    attachments: [],
    contributors: [],
    version: '1.0.0',
  },
  {
    id: 'doc-2',
    title: 'Second Document',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    attachments: [],
    contributors: [],
    version: '1.0.0',
  },
];

function renderScreen(repository: DocumentsRepository) {
  return render(
    <DocumentsProvider repository={repository}>
      <DocumentsScreen />
    </DocumentsProvider>,
  );
}

function getRenderedDocumentIds(): string[] {
  return screen.getAllByTestId(/^document-/).map((card) => card.props.testID as string);
}

describe('DocumentsScreen', () => {
  it('shows each document title once the repository resolves', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    };

    await renderScreen(repository);

    expect(await screen.findByText('First Document')).toBeOnTheScreen();
    expect(screen.getByText('Second Document')).toBeOnTheScreen();
  });

  it('shows the sort menu and re-sorts the list when a different option is picked', async () => {
    const documentsWithMismatchedDateAndTitleOrder: Document[] = [
      { ...sampleDocuments[0], title: 'Zebra', updatedAt: '2024-01-02T00:00:00Z' },
      { ...sampleDocuments[1], title: 'Apple', updatedAt: '2024-01-01T00:00:00Z' },
    ];
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(documentsWithMismatchedDateAndTitleOrder),
    };

    await renderScreen(repository);
    await screen.findByText('Zebra');

    expect(getRenderedDocumentIds()).toEqual(['document-doc-1', 'document-doc-2']);

    await fireEvent.press(screen.getByTestId('sort-menu-button'));
    await fireEvent.press(screen.getByTestId('sort-menu-option-title'));

    expect(getRenderedDocumentIds()).toEqual(['document-doc-2', 'document-doc-1']);
  });

  it('shows the view mode toggle with list selected by default', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    };

    await renderScreen(repository);
    await screen.findByText('First Document');

    expect(screen.getByTestId('view-mode-button-list').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId('view-mode-button-grid').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('selects the grid segment when pressed', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    };

    await renderScreen(repository);
    await screen.findByText('First Document');

    await fireEvent.press(screen.getByTestId('view-mode-button-grid'));

    expect(screen.getByTestId('view-mode-button-grid').props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('shows a loading state before the repository resolves', async () => {
    let resolveGetAll: (documents: Document[]) => void = () => {};
    const pendingGetAll = new Promise<Document[]>((resolve) => {
      resolveGetAll = resolve;
    });
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockReturnValue(pendingGetAll),
    };

    await renderScreen(repository);

    expect(screen.getByTestId('documents-loading')).toBeOnTheScreen();

    resolveGetAll(sampleDocuments);
    expect(await screen.findByText('First Document')).toBeOnTheScreen();
  });

  it('shows the "Documents" header while still loading', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockReturnValue(new Promise<Document[]>(() => {})),
    };

    await renderScreen(repository);

    expect(screen.getByText('Documents')).toBeOnTheScreen();
    expect(screen.getByTestId('documents-loading')).toBeOnTheScreen();
  });

  it('shows an error message and a retry button when the repository rejects', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockRejectedValue(new Error('network down')),
    };

    await renderScreen(repository);

    expect(await screen.findByTestId('documents-error')).toBeOnTheScreen();
    expect(screen.getByText('network down')).toBeOnTheScreen();
    expect(screen.getByTestId('documents-retry-button')).toBeOnTheScreen();
  });

  it('reaches the document list when retry is pressed after a failure', async () => {
    const getAll = jest
      .fn<ReturnType<DocumentsRepository['getAll']>, []>()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(sampleDocuments);
    const repository: DocumentsRepository = { getAll };

    await renderScreen(repository);

    await screen.findByTestId('documents-error');
    await fireEvent.press(screen.getByTestId('documents-retry-button'));

    expect(await screen.findByText('First Document')).toBeOnTheScreen();
    expect(getAll).toHaveBeenCalledTimes(2);
  });

  it('shows an empty state when the repository resolves with no documents', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue([]),
    };

    await renderScreen(repository);

    expect(await screen.findByTestId('documents-empty')).toBeOnTheScreen();
    expect(screen.getByText('No documents yet.')).toBeOnTheScreen();
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';

import type { Notification, NotificationsSource } from '@/features/notifications';
import { NotificationsProvider } from '@/features/notifications';

import { createInMemoryLocalDocumentsSource } from '../api/inMemoryLocalDocumentsSource';
import { createMergingDocumentsRepository } from '../api/mergingDocumentsRepository';
import type { Document } from '../domain/document';
import type { DocumentsRepository } from '../domain/documentsRepository';
import { DocumentsProvider } from '../state/DocumentsRepositoryContext';
import { DocumentsScreen } from './DocumentsScreen';

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

const sampleNotification: Notification = {
  userName: 'Hazle Kuhlman',
  documentTitle: 'Two Hearted Ale',
  documentId: 'notif-doc-1',
  timestamp: '2026-10-09T16:15:42.570Z',
};

function buildNotificationsSource(
  overrides: Partial<NotificationsSource> = {},
): NotificationsSource {
  return {
    subscribe: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    ...overrides,
  };
}

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

function renderScreen(
  server: DocumentsRepository,
  notificationsSource: NotificationsSource = buildNotificationsSource(),
) {
  const repository = createMergingDocumentsRepository(server, createInMemoryLocalDocumentsSource());
  return render(
    <DocumentsProvider repository={repository}>
      <NotificationsProvider source={notificationsSource}>
        <DocumentsScreen />
      </NotificationsProvider>
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

  it('shows the grid and hides the list when the grid segment is pressed', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    };

    await renderScreen(repository);
    await screen.findByText('First Document');

    await fireEvent.press(screen.getByTestId('view-mode-button-grid'));

    expect(screen.getByTestId('view-mode-button-grid').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId('document-grid-doc-1')).toBeOnTheScreen();
    expect(screen.queryByTestId('documents-list')).not.toBeOnTheScreen();
  });

  it('shows the list again when the list segment is pressed after switching to grid', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    };

    await renderScreen(repository);
    await screen.findByText('First Document');

    await fireEvent.press(screen.getByTestId('view-mode-button-grid'));
    await screen.findByTestId('document-grid-doc-1');
    await fireEvent.press(screen.getByTestId('view-mode-button-list'));

    expect(screen.getByTestId('documents-list')).toBeOnTheScreen();
    expect(screen.queryByTestId('document-grid-doc-1')).not.toBeOnTheScreen();
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

  it('shows the Add document button even when the list is empty', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue([]),
    };

    await renderScreen(repository);

    expect(await screen.findByTestId('documents-empty')).toBeOnTheScreen();
    expect(screen.getByTestId('add-document-button')).toBeOnTheScreen();
  });

  it('adds the created document to the top of the list after a successful submit', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ name: 'manual.pdf', uri: 'file:///manual.pdf', lastModified: 0 }],
    });
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    };

    await renderScreen(repository);
    await screen.findByText('First Document');

    await fireEvent.press(screen.getByTestId('add-document-button'));
    await fireEvent.changeText(screen.getByTestId('add-document-title-input'), 'Third Document');
    await fireEvent.changeText(screen.getByTestId('add-document-version-input'), '1.0.0');
    await fireEvent.press(screen.getByTestId('add-document-choose-file-button'));
    await screen.findByText('manual.pdf');
    await fireEvent.press(screen.getByTestId('add-document-submit-button'));

    expect(await screen.findByText('Third Document')).toBeOnTheScreen();
    const renderedIds = getRenderedDocumentIds();
    expect(renderedIds[0]).not.toEqual('document-doc-1');
    expect(renderedIds[0]).not.toEqual('document-doc-2');
  });

  it('opens the notifications panel when the bell is pressed', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    };

    await renderScreen(repository);
    await screen.findByText('First Document');

    await fireEvent.press(screen.getByTestId('notification-bell'));

    expect(screen.getByTestId('notifications-panel-close-button')).toBeOnTheScreen();
  });

  it('clears the unread badge when the panel is opened', async () => {
    let emit: ((notification: Notification) => void) | undefined;
    const notificationsSource = buildNotificationsSource({
      subscribe: jest.fn((onNotification) => {
        emit = onNotification;
      }),
    });
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    };

    await renderScreen(repository, notificationsSource);
    await screen.findByText('First Document');
    await act(() => {
      emit?.(sampleNotification);
    });

    expect(screen.getByTestId('notification-bell-badge')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('notification-bell'));

    expect(screen.queryByTestId('notification-bell-badge')).not.toBeOnTheScreen();
  });
});

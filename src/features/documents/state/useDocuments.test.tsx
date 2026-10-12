import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { Document } from '../domain/document';
import type { DocumentsRepository } from '../domain/documentsRepository';
import type { LocalDocumentsSource } from '../domain/localDocumentsSource';
import { DEFAULT_SORT_KEY } from '../domain/sortDocuments';
import { DocumentsProvider } from './DocumentsRepositoryContext';
import { LocalDocumentsSourceProvider } from './LocalDocumentsSourceContext';
import { useDocuments } from './useDocuments';

const sampleDocuments: Document[] = [
  {
    id: 'doc-1',
    title: 'Sample',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    attachments: [],
    contributors: [],
    version: '1.0.0',
  },
];

function buildLocalSource(overrides: Partial<LocalDocumentsSource> = {}): LocalDocumentsSource {
  return {
    add: jest.fn(),
    getAll: jest.fn().mockReturnValue([]),
    ...overrides,
  };
}

function renderWithRepository(
  repository: DocumentsRepository,
  localSource: LocalDocumentsSource = buildLocalSource(),
) {
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <DocumentsProvider repository={repository}>
        <LocalDocumentsSourceProvider localSource={localSource}>
          {children}
        </LocalDocumentsSourceProvider>
      </DocumentsProvider>
    );
  }

  return renderHook(() => useDocuments(), { wrapper });
}

describe('useDocuments', () => {
  it('resolves to success with the repository documents', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    };

    const { result } = await renderWithRepository(repository);

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: 'success', documents: sampleDocuments });
    });
  });

  it('resolves to error with the failure message when the repository rejects', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockRejectedValue(new Error('network down')),
    };

    const { result } = await renderWithRepository(repository);

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: 'error', message: 'network down' });
    });
  });

  it('refetches from the repository when retry is called after a failure', async () => {
    const getAll = jest
      .fn<ReturnType<DocumentsRepository['getAll']>, []>()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(sampleDocuments);
    const repository: DocumentsRepository = { getAll };

    const { result } = await renderWithRepository(repository);

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: 'error', message: 'network down' });
    });

    await act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: 'success', documents: sampleDocuments });
    });
    expect(getAll).toHaveBeenCalledTimes(2);
  });

  it('throws when rendered outside a DocumentsProvider', async () => {
    await expect(renderHook(() => useDocuments())).rejects.toThrow(
      'useDocumentsRepository must be used within a DocumentsProvider',
    );
  });

  it('defaults sortBy to DEFAULT_SORT_KEY', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    };

    const { result } = await renderWithRepository(repository);

    expect(result.current.sortBy).toBe(DEFAULT_SORT_KEY);
  });

  it('updates sortBy when setSortBy is called', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    };

    const { result } = await renderWithRepository(repository);

    await act(() => {
      result.current.setSortBy('title');
    });

    expect(result.current.sortBy).toBe('title');
  });

  it('preserves sortBy across a retry that refetches documents', async () => {
    const getAll = jest
      .fn<ReturnType<DocumentsRepository['getAll']>, []>()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(sampleDocuments);
    const repository: DocumentsRepository = { getAll };

    const { result } = await renderWithRepository(repository);

    await act(() => {
      result.current.setSortBy('title');
    });

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: 'error', message: 'network down' });
    });

    await act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: 'success', documents: sampleDocuments });
    });
    expect(result.current.sortBy).toBe('title');
  });

  it('defaults viewMode to list', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    };

    const { result } = await renderWithRepository(repository);

    expect(result.current.viewMode).toBe('list');
  });

  it('updates viewMode when setViewMode is called', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    };

    const { result } = await renderWithRepository(repository);

    await act(() => {
      result.current.setViewMode('grid');
    });

    expect(result.current.viewMode).toBe('grid');
  });

  it('preserves viewMode across a retry that refetches documents', async () => {
    const getAll = jest
      .fn<ReturnType<DocumentsRepository['getAll']>, []>()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(sampleDocuments);
    const repository: DocumentsRepository = { getAll };

    const { result } = await renderWithRepository(repository);

    await act(() => {
      result.current.setViewMode('grid');
    });

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: 'error', message: 'network down' });
    });

    await act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: 'success', documents: sampleDocuments });
    });
    expect(result.current.viewMode).toBe('grid');
  });

  it('prepends the document returned by the local source when addDocument is called', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    };
    const createdDocument: Document = {
      id: 'local-123',
      title: 'New Doc',
      version: '1.0.0',
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
      attachments: ['manual.pdf'],
      contributors: [],
    };
    const localSource = buildLocalSource({ add: jest.fn().mockReturnValue(createdDocument) });

    const { result } = await renderWithRepository(repository, localSource);
    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });

    const input = { title: 'New Doc', version: '1.0.0', fileName: 'manual.pdf' };
    await act(() => {
      result.current.addDocument(input);
    });

    expect(localSource.add).toHaveBeenCalledWith(input);
    expect(result.current.state).toEqual({
      status: 'success',
      documents: [createdDocument, ...sampleDocuments],
    });
  });
});

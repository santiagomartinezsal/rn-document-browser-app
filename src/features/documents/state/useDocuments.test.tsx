import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { Document } from '../domain/document';
import type { DocumentsRepository, DocumentsWriter } from '../domain/documentsRepository';
import { DEFAULT_SORT_KEY } from '../domain/sortDocuments';
import { DocumentsProvider } from './DocumentsRepositoryContext';
import { useDocuments } from './useDocuments';

type WritableDocumentsRepository = DocumentsRepository & DocumentsWriter;

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

function buildRepository(
  overrides: Partial<WritableDocumentsRepository> = {},
): WritableDocumentsRepository {
  return {
    getAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    ...overrides,
  };
}

function renderWithRepository(repository: WritableDocumentsRepository) {
  function wrapper({ children }: { children: ReactNode }) {
    return <DocumentsProvider repository={repository}>{children}</DocumentsProvider>;
  }

  return renderHook(() => useDocuments(), { wrapper });
}

describe('useDocuments', () => {
  it('resolves to success with the repository documents', async () => {
    const repository = buildRepository({
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    });

    const { result } = await renderWithRepository(repository);

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: 'success', documents: sampleDocuments });
    });
  });

  it('resolves to error with the failure message when the repository rejects', async () => {
    const repository = buildRepository({
      getAll: jest.fn().mockRejectedValue(new Error('network down')),
    });

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
    const repository = buildRepository({ getAll });

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

  it('defaults isRefreshing to false', async () => {
    const repository = buildRepository({
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    });

    const { result } = await renderWithRepository(repository);

    expect(result.current.isRefreshing).toBe(false);
  });

  it('replaces the documents with the refreshed result when refresh succeeds', async () => {
    const refreshedDocuments: Document[] = [{ ...sampleDocuments[0], id: 'doc-2' }];
    const getAll = jest
      .fn<ReturnType<DocumentsRepository['getAll']>, []>()
      .mockResolvedValueOnce(sampleDocuments)
      .mockResolvedValueOnce(refreshedDocuments);
    const repository = buildRepository({ getAll });

    const { result } = await renderWithRepository(repository);
    await waitFor(() => {
      expect(result.current.state).toEqual({ status: 'success', documents: sampleDocuments });
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.state).toEqual({ status: 'success', documents: refreshedDocuments });
  });

  it('sets isRefreshing while the refresh request is in flight', async () => {
    const repository = buildRepository({
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    });

    const { result } = await renderWithRepository(repository);
    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });

    let resolveRefresh: (documents: Document[]) => void = () => {};
    jest
      .mocked(repository.getAll)
      .mockReturnValueOnce(new Promise((resolve) => (resolveRefresh = resolve)));

    let refreshPromise: Promise<void> = Promise.resolve();
    await act(() => {
      refreshPromise = result.current.refresh();
    });

    expect(result.current.isRefreshing).toBe(true);

    await act(async () => {
      resolveRefresh(sampleDocuments);
      await refreshPromise;
    });

    expect(result.current.isRefreshing).toBe(false);
  });

  it('keeps the current documents and warns when refresh fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const getAll = jest
      .fn<ReturnType<DocumentsRepository['getAll']>, []>()
      .mockResolvedValueOnce(sampleDocuments)
      .mockRejectedValueOnce(new Error('network down'));
    const repository = buildRepository({ getAll });

    const { result } = await renderWithRepository(repository);
    await waitFor(() => {
      expect(result.current.state).toEqual({ status: 'success', documents: sampleDocuments });
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.state).toEqual({ status: 'success', documents: sampleDocuments });
    expect(result.current.isRefreshing).toBe(false);
    expect(warn).toHaveBeenCalledWith('network down');
    warn.mockRestore();
  });

  it('throws when rendered outside a DocumentsProvider', async () => {
    await expect(renderHook(() => useDocuments())).rejects.toThrow(
      'useDocumentsRepository must be used within a DocumentsProvider',
    );
  });

  it('defaults sortBy to DEFAULT_SORT_KEY', async () => {
    const repository = buildRepository({
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    });

    const { result } = await renderWithRepository(repository);

    expect(result.current.sortBy).toBe(DEFAULT_SORT_KEY);
  });

  it('updates sortBy when setSortBy is called', async () => {
    const repository = buildRepository({
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    });

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
    const repository = buildRepository({ getAll });

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
    const repository = buildRepository({
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    });

    const { result } = await renderWithRepository(repository);

    expect(result.current.viewMode).toBe('list');
  });

  it('updates viewMode when setViewMode is called', async () => {
    const repository = buildRepository({
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
    });

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
    const repository = buildRepository({ getAll });

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

  it('prepends the document returned by repository.create when addDocument is called', async () => {
    const createdDocument: Document = {
      id: 'local-123',
      title: 'New Doc',
      version: '1.0.0',
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
      attachments: ['manual.pdf'],
      contributors: [],
    };
    const repository = buildRepository({
      getAll: jest.fn().mockResolvedValue(sampleDocuments),
      create: jest.fn().mockResolvedValue(createdDocument),
    });

    const { result } = await renderWithRepository(repository);
    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });

    const input = { title: 'New Doc', version: '1.0.0', fileName: 'manual.pdf' };
    await act(async () => {
      await result.current.addDocument(input);
    });

    expect(repository.create).toHaveBeenCalledWith(input);
    expect(result.current.state).toEqual({
      status: 'success',
      documents: [createdDocument, ...sampleDocuments],
    });
  });
});

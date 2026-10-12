import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { Document } from '../domain/document';
import type { DocumentsRepository } from '../domain/documentsRepository';
import { DocumentsProvider } from './DocumentsRepositoryContext';
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

function renderWithRepository(repository: DocumentsRepository) {
  function wrapper({ children }: { children: ReactNode }) {
    return <DocumentsProvider repository={repository}>{children}</DocumentsProvider>;
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
      expect(result.current).toEqual({ status: 'success', documents: sampleDocuments });
    });
  });

  it('resolves to error with the failure message when the repository rejects', async () => {
    const repository: DocumentsRepository = {
      getAll: jest.fn().mockRejectedValue(new Error('network down')),
    };

    const { result } = await renderWithRepository(repository);

    await waitFor(() => {
      expect(result.current).toEqual({ status: 'error', message: 'network down' });
    });
  });

  it('throws when rendered outside a DocumentsProvider', async () => {
    await expect(renderHook(() => useDocuments())).rejects.toThrow(
      'useDocumentsRepository must be used within a DocumentsProvider',
    );
  });
});

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type { DocumentsRepository } from '../domain/documentsRepository';

const DocumentsRepositoryContext = createContext<DocumentsRepository | null>(null);

export interface DocumentsProviderProps {
  /**
   * Must stay the same reference across renders (e.g. constructed outside the
   * component, or memoized) — useDocuments depends on it, so a new reference
   * on every render would refetch on every render.
   */
  repository: DocumentsRepository;
  children: ReactNode;
}

export function DocumentsProvider({ repository, children }: DocumentsProviderProps) {
  return (
    <DocumentsRepositoryContext.Provider value={repository}>
      {children}
    </DocumentsRepositoryContext.Provider>
  );
}

export function useDocumentsRepository(): DocumentsRepository {
  const repository = useContext(DocumentsRepositoryContext);
  if (!repository) {
    throw new Error('useDocumentsRepository must be used within a DocumentsProvider');
  }
  return repository;
}

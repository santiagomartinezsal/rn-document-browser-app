import { useEffect, useReducer, useState } from 'react';

import type { CreateDocumentInput, Document } from '../domain/document';
import { DEFAULT_SORT_KEY } from '../domain/sortDocuments';
import type { SortKey } from '../domain/sortDocuments';
import { useDocumentsRepository } from './DocumentsRepositoryContext';
import { documentsReducer, initialDocumentsState } from './documentsReducer';
import type { DocumentsState } from './documentsReducer';

export type ViewMode = 'list' | 'grid';

const DEFAULT_VIEW_MODE: ViewMode = 'list';

export interface UseDocumentsResult {
  state: DocumentsState;
  retry: () => void;
  sortBy: SortKey;
  setSortBy: (sortBy: SortKey) => void;
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
  addDocument: (input: CreateDocumentInput) => void;
}

export function useDocuments(): UseDocumentsResult {
  const repository = useDocumentsRepository();
  const [state, dispatch] = useReducer(documentsReducer, initialDocumentsState);
  const [fetchAttempt, setFetchAttempt] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>(DEFAULT_SORT_KEY);
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);

  const retry = () => {
    setFetchAttempt((previousAttempt) => previousAttempt + 1);
  };

  const addDocument = (input: CreateDocumentInput) => {
    dispatch({ type: 'DOCUMENT_CREATED', document: buildLocalDocument(input) });
  };

  useEffect(() => {
    // Prevents a slow fetch from dispatching after the component unmounts or
    // a newer fetch has started, since repository.getAll() can't be cancelled.
    let isFetchStillCurrent = true;

    dispatch({ type: 'FETCH_STARTED' });
    repository
      .getAll()
      .then((documents) => {
        if (isFetchStillCurrent) {
          dispatch({ type: 'FETCH_SUCCEEDED', documents });
        }
      })
      .catch((error: unknown) => {
        if (isFetchStillCurrent) {
          dispatch({ type: 'FETCH_FAILED', message: toErrorMessage(error) });
        }
      });

    return () => {
      isFetchStillCurrent = false;
    };
  }, [repository, fetchAttempt]);

  return { state, retry, sortBy, setSortBy, viewMode, setViewMode, addDocument };
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to load documents';
}

// Deliberately temporary: builds the Document inline instead of going through a
// repository. docs/plans/06-create-document.md's commit 2 extracts this into a
// LocalDocumentsSource.
function buildLocalDocument(input: CreateDocumentInput): Document {
  const now = new Date().toISOString();

  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    version: input.version.trim(),
    createdAt: now,
    updatedAt: now,
    attachments: [input.fileName],
    contributors: [],
  };
}

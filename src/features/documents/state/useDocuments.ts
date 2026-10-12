import { useEffect, useReducer, useState } from 'react';

import { DEFAULT_SORT_KEY } from '../domain/sortDocuments';
import type { SortKey } from '../domain/sortDocuments';
import { useDocumentsRepository } from './DocumentsRepositoryContext';
import { documentsReducer, initialDocumentsState } from './documentsReducer';
import type { DocumentsState } from './documentsReducer';

export interface UseDocumentsResult {
  state: DocumentsState;
  retry: () => void;
  sortBy: SortKey;
  setSortBy: (sortBy: SortKey) => void;
}

export function useDocuments(): UseDocumentsResult {
  const repository = useDocumentsRepository();
  const [state, dispatch] = useReducer(documentsReducer, initialDocumentsState);
  const [fetchAttempt, setFetchAttempt] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>(DEFAULT_SORT_KEY);

  const retry = () => {
    setFetchAttempt((previousAttempt) => previousAttempt + 1);
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

  return { state, retry, sortBy, setSortBy };
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to load documents';
}

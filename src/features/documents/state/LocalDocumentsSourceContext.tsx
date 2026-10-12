import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type { LocalDocumentsSource } from '../domain/localDocumentsSource';

const LocalDocumentsSourceContext = createContext<LocalDocumentsSource | null>(null);

export interface LocalDocumentsSourceProviderProps {
  /**
   * Must stay the same reference across renders (e.g. constructed outside the
   * component, or memoized) — useDocuments depends on it, so a new reference
   * on every render would lose previously created documents.
   */
  localSource: LocalDocumentsSource;
  children: ReactNode;
}

export function LocalDocumentsSourceProvider({
  localSource,
  children,
}: LocalDocumentsSourceProviderProps) {
  return (
    <LocalDocumentsSourceContext.Provider value={localSource}>
      {children}
    </LocalDocumentsSourceContext.Provider>
  );
}

export function useLocalDocumentsSource(): LocalDocumentsSource {
  const localSource = useContext(LocalDocumentsSourceContext);
  if (!localSource) {
    throw new Error('useLocalDocumentsSource must be used within a LocalDocumentsSourceProvider');
  }
  return localSource;
}

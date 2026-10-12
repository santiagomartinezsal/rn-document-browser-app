import { getHttpBaseUrl } from '@/shared/http/serverConfig';

import { createInMemoryLocalDocumentsSource } from './api/inMemoryLocalDocumentsSource';
import { createServerDocumentsRepository } from './api/serverDocumentsRepository';
import type { DocumentsRepository } from './domain/documentsRepository';
import type { LocalDocumentsSource } from './domain/localDocumentsSource';
import { DocumentsProvider } from './state/DocumentsRepositoryContext';
import { LocalDocumentsSourceProvider } from './state/LocalDocumentsSourceContext';
import { DocumentsScreen } from './ui/DocumentsScreen';

export { DocumentsProvider, DocumentsScreen, LocalDocumentsSourceProvider };
export type { DocumentsRepository, LocalDocumentsSource };

export function createDocumentsRepository(): DocumentsRepository {
  return createServerDocumentsRepository(getHttpBaseUrl());
}

export function createLocalDocumentsSource(): LocalDocumentsSource {
  return createInMemoryLocalDocumentsSource();
}

import { getHttpBaseUrl } from '@/shared/http/serverConfig';

import { createInMemoryLocalDocumentsSource } from './api/inMemoryLocalDocumentsSource';
import { createMergingDocumentsRepository } from './api/mergingDocumentsRepository';
import { createServerDocumentsRepository } from './api/serverDocumentsRepository';
import type { DocumentsRepository, DocumentsWriter } from './domain/documentsRepository';
import { DocumentsProvider } from './state/DocumentsRepositoryContext';
import { DocumentsScreen } from './ui/DocumentsScreen';

export { DocumentsProvider, DocumentsScreen };
export type { DocumentsRepository };

export function createDocumentsRepository(): DocumentsRepository & DocumentsWriter {
  return createMergingDocumentsRepository(
    createServerDocumentsRepository(getHttpBaseUrl()),
    createInMemoryLocalDocumentsSource(),
  );
}

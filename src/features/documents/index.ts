import { getHttpBaseUrl } from '@/shared/http/serverConfig';

import { createServerDocumentsRepository } from './api/serverDocumentsRepository';
import type { DocumentsRepository } from './domain/documentsRepository';
import { DocumentsProvider } from './state/DocumentsRepositoryContext';
import { DocumentsScreen } from './ui/DocumentsScreen';

export { DocumentsProvider, DocumentsScreen };
export type { DocumentsRepository };

export function createDocumentsRepository(): DocumentsRepository {
  return createServerDocumentsRepository(getHttpBaseUrl());
}

import { fetchJson } from '@/shared/http/httpClient';

import type { DocumentsRepository } from '../domain/documentsRepository';
import { mapDocuments } from './documentMapper';

export function createServerDocumentsRepository(baseUrl: string): DocumentsRepository {
  return {
    async getAll() {
      const payload = await fetchJson(`${baseUrl}/documents`);
      return mapDocuments(payload);
    },
  };
}

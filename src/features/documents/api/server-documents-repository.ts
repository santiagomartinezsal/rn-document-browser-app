import { fetchJson } from '@/shared/http/http-client';

import type { DocumentsRepository } from '../domain/documents-repository';
import { mapDocuments } from './document-mapper';

export function createServerDocumentsRepository(baseUrl: string): DocumentsRepository {
  return {
    async getAll() {
      const payload = await fetchJson(`${baseUrl}/documents`);
      return mapDocuments(payload);
    },
  };
}

import type { CreateDocumentInput, Document } from '../domain/document';
import type { DocumentsRepository, DocumentsWriter } from '../domain/documentsRepository';
import type { LocalDocumentsSource } from '../domain/localDocumentsSource';
import { mergeDocuments } from '../domain/mergeDocuments';

export function createMergingDocumentsRepository(
  server: DocumentsRepository,
  local: LocalDocumentsSource,
): DocumentsRepository & DocumentsWriter {
  return {
    async getAll(): Promise<Document[]> {
      const serverDocuments = await server.getAll();
      return mergeDocuments(local.getAll(), serverDocuments);
    },
    async create(input: CreateDocumentInput): Promise<Document> {
      return local.add(input);
    },
  };
}

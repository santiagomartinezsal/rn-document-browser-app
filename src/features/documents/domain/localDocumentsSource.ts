import type { CreateDocumentInput, Document } from './document';

export interface LocalDocumentsSource {
  add(input: CreateDocumentInput): Document;
  getAll(): Document[];
}

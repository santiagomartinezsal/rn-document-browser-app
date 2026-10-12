import type { CreateDocumentInput, Document } from './document';

export interface DocumentsRepository {
  getAll(): Promise<Document[]>;
}

export interface DocumentsWriter {
  create(input: CreateDocumentInput): Promise<Document>;
}

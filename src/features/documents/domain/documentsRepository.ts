import type { Document } from './document';

export interface DocumentsRepository {
  getAll(): Promise<Document[]>;
}

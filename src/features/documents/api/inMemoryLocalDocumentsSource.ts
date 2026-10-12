import type { CreateDocumentInput, Document } from '../domain/document';
import type { LocalDocumentsSource } from '../domain/localDocumentsSource';

export function createInMemoryLocalDocumentsSource(): LocalDocumentsSource {
  const documents: Document[] = [];

  return {
    add(input: CreateDocumentInput): Document {
      const document = buildDocument(input);
      documents.unshift(document);
      return document;
    },
    getAll(): Document[] {
      return [...documents];
    },
  };
}

function buildDocument(input: CreateDocumentInput): Document {
  const now = new Date().toISOString();

  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    version: input.version.trim(),
    createdAt: now,
    updatedAt: now,
    attachments: [input.fileName],
    contributors: [],
  };
}

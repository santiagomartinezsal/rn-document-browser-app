import type { Document } from './document';

export function mergeDocuments(local: Document[], server: Document[]): Document[] {
  const localIds = new Set(local.map((document) => document.id));
  return [...local, ...server.filter((document) => !localIds.has(document.id))];
}

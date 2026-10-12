import { compareVersions } from './compareVersions';
import type { Document } from './document';

export type SortKey = 'date' | 'title' | 'version';

export const DEFAULT_SORT_KEY: SortKey = 'date';

function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function effectiveDate(document: Document): string {
  return isValidDate(document.updatedAt) ? document.updatedAt : document.createdAt;
}

export function sortDocuments(documents: Document[], sortBy: SortKey): Document[] {
  switch (sortBy) {
    case 'date':
      return [...documents].sort(
        (a, b) => new Date(effectiveDate(b)).getTime() - new Date(effectiveDate(a)).getTime(),
      );
    case 'title':
      return [...documents].sort((a, b) => a.title.localeCompare(b.title));
    case 'version':
      return [...documents].sort((a, b) => compareVersions(b.version, a.version));
  }
}

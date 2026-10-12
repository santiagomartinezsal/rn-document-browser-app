import type { Document } from './document';
import { DEFAULT_SORT_KEY, sortDocuments } from './sortDocuments';

function buildDocument(overrides: Partial<Document>): Document {
  return {
    id: 'doc',
    title: 'Untitled',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    attachments: [],
    contributors: [],
    version: '1.0.0',
    ...overrides,
  };
}

const documents: Document[] = [
  buildDocument({ id: 'a', title: 'Banana', updatedAt: '2024-01-02T00:00:00Z', version: '1.2.0' }),
  buildDocument({ id: 'b', title: 'Apple', updatedAt: '2024-01-01T00:00:00Z', version: '1.10.0' }),
  buildDocument({
    id: 'c',
    title: 'Cherry',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '',
    version: '1.9.5',
  }),
];

describe('sortDocuments', () => {
  it('defaults to sorting by date', () => {
    expect(DEFAULT_SORT_KEY).toBe('date');
  });

  it('sorts by date, newest effective date first', () => {
    const sorted = sortDocuments(documents, 'date');

    expect(sorted.map((document) => document.id)).toEqual(['c', 'a', 'b']);
  });

  it('falls back to createdAt when updatedAt is missing or unparseable', () => {
    const withInvalidUpdatedAt = [
      buildDocument({ id: 'older', createdAt: '2024-01-01T00:00:00Z', updatedAt: 'not-a-date' }),
      buildDocument({ id: 'newer', createdAt: '2024-02-01T00:00:00Z', updatedAt: '' }),
    ];

    const sorted = sortDocuments(withInvalidUpdatedAt, 'date');

    expect(sorted.map((document) => document.id)).toEqual(['newer', 'older']);
  });

  it('sorts by title ascending', () => {
    const sorted = sortDocuments(documents, 'title');

    expect(sorted.map((document) => document.id)).toEqual(['b', 'a', 'c']);
  });

  it('sorts by version descending', () => {
    const sorted = sortDocuments(documents, 'version');

    expect(sorted.map((document) => document.id)).toEqual(['b', 'c', 'a']);
  });

  it('does not mutate the input array', () => {
    const original = [...documents];

    sortDocuments(documents, 'title');

    expect(documents).toEqual(original);
  });
});

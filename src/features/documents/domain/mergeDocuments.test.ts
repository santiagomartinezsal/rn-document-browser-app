import type { Document } from './document';
import { mergeDocuments } from './mergeDocuments';

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

describe('mergeDocuments', () => {
  it('returns local documents before server documents', () => {
    const local = [buildDocument({ id: 'local-1', title: 'Local' })];
    const server = [buildDocument({ id: 'server-1', title: 'Server' })];

    expect(mergeDocuments(local, server)).toEqual([local[0], server[0]]);
  });

  it('dedupes a server document sharing an id with a local one, keeping the local copy', () => {
    const local = [buildDocument({ id: 'doc-1', title: 'Local copy' })];
    const server = [buildDocument({ id: 'doc-1', title: 'Server copy' })];

    expect(mergeDocuments(local, server)).toEqual([local[0]]);
  });

  it('keeps every distinct document from both sources', () => {
    const local = [buildDocument({ id: 'local-1' }), buildDocument({ id: 'local-2' })];
    const server = [buildDocument({ id: 'server-1' }), buildDocument({ id: 'server-2' })];

    expect(mergeDocuments(local, server).map((document) => document.id)).toEqual([
      'local-1',
      'local-2',
      'server-1',
      'server-2',
    ]);
  });
});

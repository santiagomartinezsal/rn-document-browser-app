import type { CreateDocumentInput, Document } from '../domain/document';
import type { DocumentsRepository } from '../domain/documentsRepository';
import type { LocalDocumentsSource } from '../domain/localDocumentsSource';
import { createMergingDocumentsRepository } from './mergingDocumentsRepository';

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

describe('createMergingDocumentsRepository', () => {
  it('merges local and server documents in getAll, deduping by id with local first', async () => {
    const sharedDocument = buildDocument({ id: 'shared', title: 'Local copy' });
    const serverOnlyDocument = buildDocument({ id: 'server-only' });
    const server: DocumentsRepository = {
      getAll: jest
        .fn()
        .mockResolvedValue([
          buildDocument({ id: 'shared', title: 'Server copy' }),
          serverOnlyDocument,
        ]),
    };
    const local: LocalDocumentsSource = {
      add: jest.fn(),
      getAll: jest.fn().mockReturnValue([sharedDocument]),
    };
    const repository = createMergingDocumentsRepository(server, local);

    const documents = await repository.getAll();

    expect(documents).toEqual([sharedDocument, serverOnlyDocument]);
  });

  it('delegates create to the local source', async () => {
    const createdDocument = buildDocument({ id: 'local-1' });
    const server: DocumentsRepository = { getAll: jest.fn().mockResolvedValue([]) };
    const local: LocalDocumentsSource = {
      add: jest.fn().mockReturnValue(createdDocument),
      getAll: jest.fn().mockReturnValue([]),
    };
    const repository = createMergingDocumentsRepository(server, local);
    const input: CreateDocumentInput = { title: 'New', version: '1.0.0', fileName: 'a.pdf' };

    const result = await repository.create(input);

    expect(local.add).toHaveBeenCalledWith(input);
    expect(result).toEqual(createdDocument);
  });

  it('shows a just-created document first in a subsequent getAll', async () => {
    const serverDocuments = [buildDocument({ id: 'server-1', title: 'Server doc' })];
    const server: DocumentsRepository = { getAll: jest.fn().mockResolvedValue(serverDocuments) };
    const createdDocument = buildDocument({ id: 'local-1', title: 'New doc' });
    const local: LocalDocumentsSource = {
      add: jest.fn().mockReturnValue(createdDocument),
      getAll: jest.fn().mockReturnValue([createdDocument]),
    };
    const repository = createMergingDocumentsRepository(server, local);

    await repository.create({ title: 'New doc', version: '1.0.0', fileName: 'a.pdf' });
    const documents = await repository.getAll();

    expect(documents[0]).toEqual(createdDocument);
  });
});

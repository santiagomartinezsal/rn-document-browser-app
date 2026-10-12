import type { CreateDocumentInput } from '../domain/document';
import { createInMemoryLocalDocumentsSource } from './inMemoryLocalDocumentsSource';

function buildInput(overrides: Partial<CreateDocumentInput> = {}): CreateDocumentInput {
  return {
    title: 'Hop Rod Rye',
    version: '2.6.16',
    fileName: 'manual.pdf',
    ...overrides,
  };
}

describe('createInMemoryLocalDocumentsSource', () => {
  it('starts empty', () => {
    const source = createInMemoryLocalDocumentsSource();

    expect(source.getAll()).toEqual([]);
  });

  it('returns the created document from add', () => {
    const source = createInMemoryLocalDocumentsSource();

    const document = source.add(buildInput());

    expect(document).toMatchObject({
      title: 'Hop Rod Rye',
      version: '2.6.16',
      attachments: ['manual.pdf'],
      contributors: [],
    });
    expect(document.id).toMatch(/^local-/);
  });

  it('returns additions newest-first from getAll', () => {
    const source = createInMemoryLocalDocumentsSource();

    const first = source.add(buildInput({ title: 'First' }));
    const second = source.add(buildInput({ title: 'Second' }));

    expect(source.getAll()).toEqual([second, first]);
  });
});

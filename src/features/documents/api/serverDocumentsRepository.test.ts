import { fetchJson } from '@/shared/http/httpClient';

import fixture from './documents-response.fixture.json';
import { createServerDocumentsRepository } from './serverDocumentsRepository';

jest.mock('@/shared/http/httpClient');

const mockedFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

describe('createServerDocumentsRepository', () => {
  const baseUrl = 'http://localhost:8080';
  const repository = createServerDocumentsRepository(baseUrl);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('requests the /documents endpoint', async () => {
    mockedFetchJson.mockResolvedValue(fixture);

    await repository.getAll();

    expect(mockedFetchJson).toHaveBeenCalledWith(`${baseUrl}/documents`);
  });

  it('returns the mapped documents from the fetched payload', async () => {
    mockedFetchJson.mockResolvedValue(fixture);

    const documents = await repository.getAll();

    expect(documents).toHaveLength(fixture.length);
  });

  it('propagates errors from fetchJson', async () => {
    const error = new Error('network down');
    mockedFetchJson.mockRejectedValue(error);

    await expect(repository.getAll()).rejects.toThrow(error);
  });
});

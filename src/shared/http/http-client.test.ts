import { DEFAULT_TIMEOUT_MS, fetchJson } from './http-client';
import {
  HttpNetworkError,
  HttpParseError,
  HttpResponseError,
  HttpTimeoutError,
} from './http-errors';

const url = 'http://localhost:8080/documents';

describe('fetchJson', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('resolves with the parsed JSON body when the response is ok', async () => {
    const body = [{ Title: 'Example' }];
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(body),
    }) as typeof fetch;

    const result = await fetchJson(url);

    expect(result).toEqual(body);
  });

  it('rejects with HttpResponseError carrying the response status when not ok', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: jest.fn(),
    }) as typeof fetch;

    const error: unknown = await fetchJson(url).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpResponseError);
    expect((error as HttpResponseError).status).toBe(404);
  });

  it('rejects with HttpParseError when the response body is not valid JSON', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    }) as typeof fetch;

    await expect(fetchJson(url)).rejects.toThrow(HttpParseError);
  });

  it('rejects with HttpNetworkError when fetch itself rejects', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    await expect(fetchJson(url)).rejects.toThrow(HttpNetworkError);
  });

  it('rejects with HttpTimeoutError when the request exceeds the timeout', async () => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    }) as typeof fetch;

    const assertion = expect(fetchJson(url, { timeoutMs: DEFAULT_TIMEOUT_MS })).rejects.toThrow(
      HttpTimeoutError,
    );
    jest.advanceTimersByTime(DEFAULT_TIMEOUT_MS);

    await assertion;
  });
});

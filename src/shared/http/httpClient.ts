import {
  HttpNetworkError,
  HttpParseError,
  HttpResponseError,
  HttpTimeoutError,
} from './httpErrors';

export const DEFAULT_TIMEOUT_MS = 10_000;

export interface FetchJsonOptions {
  timeoutMs?: number;
}

export async function fetchJson(url: string, options: FetchJsonOptions = {}): Promise<unknown> {
  const response = await performFetch(url, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  return parseJsonBody(url, response);
}

async function performFetch(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new HttpResponseError(
        `Request to ${url} failed with status ${response.status}`,
        response.status,
      );
    }
    return response;
  } catch (error) {
    if (error instanceof HttpResponseError) {
      throw error;
    }
    if (isAbortError(error)) {
      throw new HttpTimeoutError(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw new HttpNetworkError(`Request to ${url} failed: ${String(error)}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

async function parseJsonBody(url: string, response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new HttpParseError(`Response from ${url} was not valid JSON: ${String(error)}`);
  }
}

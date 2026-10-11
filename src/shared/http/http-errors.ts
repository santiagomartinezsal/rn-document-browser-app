export class HttpError extends Error {}

export class HttpTimeoutError extends HttpError {}

export class HttpNetworkError extends HttpError {}

export class HttpParseError extends HttpError {}

export class HttpResponseError extends HttpError {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

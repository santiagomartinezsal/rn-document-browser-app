const DEFAULT_INITIAL_DELAY_MS = 500;
const DEFAULT_MAX_DELAY_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;

export interface WebSocketLike {
  onopen: ((event: unknown) => void) | null;
  onclose: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  close(): void;
}

export type WebSocketFactory = (url: string) => WebSocketLike;

export interface ReconnectingWebSocketOptions {
  url: string;
  onMessage: (data: string) => void;
  createWebSocket?: WebSocketFactory;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

export interface ReconnectingWebSocket {
  start(): void;
  stop(): void;
}

type ConnectionState = 'idle' | 'connecting' | 'open' | 'waitingToRetry';

// The platform WebSocket's event objects carry far more fields than this
// module reads, so the default factory narrows them to WebSocketLike here,
// at the one seam where the wider platform type meets this internal contract.
function createPlatformWebSocket(url: string): WebSocketLike {
  return new WebSocket(url) as unknown as WebSocketLike;
}

export function createReconnectingWebSocket(
  options: ReconnectingWebSocketOptions,
): ReconnectingWebSocket {
  const {
    url,
    onMessage,
    createWebSocket = createPlatformWebSocket,
    initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
    maxDelayMs = DEFAULT_MAX_DELAY_MS,
  } = options;

  let state: ConnectionState = 'idle';
  let socket: WebSocketLike | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryAttempt = 0;

  function computeRetryDelay(): number {
    return Math.min(initialDelayMs * BACKOFF_MULTIPLIER ** retryAttempt, maxDelayMs);
  }

  function scheduleRetry() {
    state = 'waitingToRetry';
    const delay = computeRetryDelay();
    retryAttempt += 1;
    retryTimer = setTimeout(connect, delay);
  }

  function handleDisconnect() {
    if (state === 'idle' || state === 'waitingToRetry') {
      return;
    }
    socket = null;
    scheduleRetry();
  }

  function connect() {
    retryTimer = null;
    state = 'connecting';
    socket = createWebSocket(url);
    socket.onopen = () => {
      state = 'open';
      retryAttempt = 0;
    };
    socket.onmessage = (event) => onMessage(event.data);
    socket.onclose = handleDisconnect;
    socket.onerror = handleDisconnect;
  }

  function start() {
    if (state !== 'idle') {
      return;
    }
    connect();
  }

  function stop() {
    state = 'idle';
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (socket) {
      const activeSocket = socket;
      socket = null;
      activeSocket.onclose = null;
      activeSocket.onerror = null;
      activeSocket.close();
    }
  }

  return { start, stop };
}

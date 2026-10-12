import { createReconnectingWebSocket } from './reconnectingWebSocket';
import type { WebSocketFactory, WebSocketLike } from './reconnectingWebSocket';

interface FakeSocket extends WebSocketLike {
  readonly url: string;
}

function createFakeWebSocketFactory(): {
  createWebSocket: WebSocketFactory;
  sockets: FakeSocket[];
} {
  const sockets: FakeSocket[] = [];
  const createWebSocket: WebSocketFactory = (url) => {
    const socket: FakeSocket = {
      url,
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
      close: jest.fn(),
    };
    sockets.push(socket);
    return socket;
  };
  return { createWebSocket, sockets };
}

const URL = 'ws://localhost:8080/notifications';
const INITIAL_DELAY_MS = 500;
const MAX_DELAY_MS = 2000;

describe('createReconnectingWebSocket', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a socket for the given url when started', () => {
    const { createWebSocket, sockets } = createFakeWebSocketFactory();
    const reconnectingSocket = createReconnectingWebSocket({
      url: URL,
      onMessage: jest.fn(),
      createWebSocket,
    });

    reconnectingSocket.start();

    expect(sockets).toHaveLength(1);
    expect(sockets[0].url).toBe(URL);
  });

  it('forwards messages received after the socket opens', () => {
    const onMessage = jest.fn();
    const { createWebSocket, sockets } = createFakeWebSocketFactory();
    const reconnectingSocket = createReconnectingWebSocket({
      url: URL,
      onMessage,
      createWebSocket,
    });

    reconnectingSocket.start();
    sockets[0].onopen?.(undefined);
    sockets[0].onmessage?.({ data: '{"hello":"world"}' });

    expect(onMessage).toHaveBeenCalledWith('{"hello":"world"}');
  });

  it('schedules a reconnect after the initial delay when the socket closes', () => {
    const { createWebSocket, sockets } = createFakeWebSocketFactory();
    const reconnectingSocket = createReconnectingWebSocket({
      url: URL,
      onMessage: jest.fn(),
      createWebSocket,
      initialDelayMs: INITIAL_DELAY_MS,
    });

    reconnectingSocket.start();
    sockets[0].onclose?.(undefined);
    expect(sockets).toHaveLength(1);

    jest.advanceTimersByTime(INITIAL_DELAY_MS);

    expect(sockets).toHaveLength(2);
  });

  it('escalates the retry delay on repeated failures, capped at the maximum', () => {
    const { createWebSocket, sockets } = createFakeWebSocketFactory();
    const reconnectingSocket = createReconnectingWebSocket({
      url: URL,
      onMessage: jest.fn(),
      createWebSocket,
      initialDelayMs: INITIAL_DELAY_MS,
      maxDelayMs: MAX_DELAY_MS,
    });

    reconnectingSocket.start();
    sockets[0].onclose?.(undefined); // 1st failure: retries after 500ms
    jest.advanceTimersByTime(INITIAL_DELAY_MS);
    expect(sockets).toHaveLength(2);

    sockets[1].onclose?.(undefined); // 2nd failure: retries after 1000ms
    jest.advanceTimersByTime(INITIAL_DELAY_MS);
    expect(sockets).toHaveLength(2);
    jest.advanceTimersByTime(INITIAL_DELAY_MS);
    expect(sockets).toHaveLength(3);

    sockets[2].onclose?.(undefined); // 3rd failure: would be 2000ms, already at the cap
    jest.advanceTimersByTime(MAX_DELAY_MS - 1);
    expect(sockets).toHaveLength(3);
    jest.advanceTimersByTime(1);
    expect(sockets).toHaveLength(4);
  });

  it('resets the retry delay to the initial value after a successful connection', () => {
    const { createWebSocket, sockets } = createFakeWebSocketFactory();
    const reconnectingSocket = createReconnectingWebSocket({
      url: URL,
      onMessage: jest.fn(),
      createWebSocket,
      initialDelayMs: INITIAL_DELAY_MS,
      maxDelayMs: MAX_DELAY_MS,
    });

    reconnectingSocket.start();
    sockets[0].onclose?.(undefined); // 1st failure
    jest.advanceTimersByTime(INITIAL_DELAY_MS);
    sockets[1].onopen?.(undefined); // recovers, resets the attempt counter

    sockets[1].onclose?.(undefined); // next failure should retry at the initial delay again, not 1000ms
    jest.advanceTimersByTime(INITIAL_DELAY_MS - 1);
    expect(sockets).toHaveLength(2);
    jest.advanceTimersByTime(1);
    expect(sockets).toHaveLength(3);
  });

  it('cancels a pending retry so stop prevents the scheduled reconnect', () => {
    const { createWebSocket, sockets } = createFakeWebSocketFactory();
    const reconnectingSocket = createReconnectingWebSocket({
      url: URL,
      onMessage: jest.fn(),
      createWebSocket,
      initialDelayMs: INITIAL_DELAY_MS,
    });

    reconnectingSocket.start();
    sockets[0].onclose?.(undefined); // schedules a retry
    reconnectingSocket.stop();
    jest.advanceTimersByTime(INITIAL_DELAY_MS * 10);

    expect(sockets).toHaveLength(1);
  });

  it('ignores the active socket closing after stop', () => {
    const { createWebSocket, sockets } = createFakeWebSocketFactory();
    const reconnectingSocket = createReconnectingWebSocket({
      url: URL,
      onMessage: jest.fn(),
      createWebSocket,
      initialDelayMs: INITIAL_DELAY_MS,
    });

    reconnectingSocket.start();
    reconnectingSocket.stop();
    sockets[0].onclose?.(undefined); // the real close event, arriving after our own close() call
    jest.advanceTimersByTime(INITIAL_DELAY_MS * 10);

    expect(sockets).toHaveLength(1);
  });

  it('closes the active socket when stopped', () => {
    const { createWebSocket, sockets } = createFakeWebSocketFactory();
    const reconnectingSocket = createReconnectingWebSocket({
      url: URL,
      onMessage: jest.fn(),
      createWebSocket,
    });

    reconnectingSocket.start();
    reconnectingSocket.stop();

    expect(sockets[0].close).toHaveBeenCalled();
  });

  it('reconnects from the beginning after stop and start', () => {
    const { createWebSocket, sockets } = createFakeWebSocketFactory();
    const reconnectingSocket = createReconnectingWebSocket({
      url: URL,
      onMessage: jest.fn(),
      createWebSocket,
      initialDelayMs: INITIAL_DELAY_MS,
      maxDelayMs: MAX_DELAY_MS,
    });

    reconnectingSocket.start();
    reconnectingSocket.stop();
    reconnectingSocket.start();
    expect(sockets).toHaveLength(2);

    sockets[1].onclose?.(undefined);
    jest.advanceTimersByTime(INITIAL_DELAY_MS - 1);
    expect(sockets).toHaveLength(2);
    jest.advanceTimersByTime(1);
    expect(sockets).toHaveLength(3);
  });
});

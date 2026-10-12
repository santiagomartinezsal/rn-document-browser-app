import type { WebSocketFactory, WebSocketLike } from '@/shared/ws/reconnectingWebSocket';

import fixture from './notifications-messages.fixture.json';
import { createNotificationsSocketSource } from './notificationsSocketSource';

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

describe('createNotificationsSocketSource', () => {
  it('notifies the subscriber with the parsed notification on a valid message', () => {
    const { createWebSocket, sockets } = createFakeWebSocketFactory();
    const source = createNotificationsSocketSource(URL, createWebSocket);
    const onNotification = jest.fn();
    source.subscribe(onNotification);

    source.start();
    sockets[0].onmessage?.({ data: JSON.stringify(fixture[0]) });

    expect(onNotification).toHaveBeenCalledWith({
      userName: fixture[0].UserName,
      documentTitle: fixture[0].DocumentTitle,
      documentId: fixture[0].DocumentID,
      timestamp: fixture[0].Timestamp,
    });
  });

  it('drops a malformed message, warns, and keeps the stream running for later messages', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { createWebSocket, sockets } = createFakeWebSocketFactory();
    const source = createNotificationsSocketSource(URL, createWebSocket);
    const onNotification = jest.fn();
    source.subscribe(onNotification);

    source.start();
    sockets[0].onmessage?.({ data: 'not json' });
    sockets[0].onmessage?.({ data: JSON.stringify(fixture[0]) });

    expect(onNotification).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('delegates start to the underlying reconnecting socket', () => {
    const { createWebSocket, sockets } = createFakeWebSocketFactory();
    const source = createNotificationsSocketSource(URL, createWebSocket);

    source.start();

    expect(sockets).toHaveLength(1);
    expect(sockets[0].url).toBe(URL);
  });

  it('delegates stop to the underlying reconnecting socket', () => {
    const { createWebSocket, sockets } = createFakeWebSocketFactory();
    const source = createNotificationsSocketSource(URL, createWebSocket);

    source.start();
    source.stop();

    expect(sockets[0].close).toHaveBeenCalled();
  });
});

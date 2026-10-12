import fixture from './notifications-messages.fixture.json';
import { createNotificationsSocketSource } from './notificationsSocketSource';

function buildFakeSocket() {
  return {
    onmessage: null as ((event: { data: string }) => void) | null,
    reconnect: jest.fn(),
    close: jest.fn(),
  };
}

const URL = 'ws://localhost:8080/notifications';

describe('createNotificationsSocketSource', () => {
  it('notifies the subscriber with the parsed notification on a valid message', () => {
    const socket = buildFakeSocket();
    const source = createNotificationsSocketSource(URL, () => socket);
    const onNotification = jest.fn();
    source.subscribe(onNotification);

    socket.onmessage?.({ data: JSON.stringify(fixture[0]) });

    expect(onNotification).toHaveBeenCalledWith({
      userName: fixture[0].UserName,
      documentTitle: fixture[0].DocumentTitle,
      documentId: fixture[0].DocumentID,
      timestamp: fixture[0].Timestamp,
    });
  });

  it('drops a malformed message, warns, and keeps the stream running for later messages', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const socket = buildFakeSocket();
    const source = createNotificationsSocketSource(URL, () => socket);
    const onNotification = jest.fn();
    source.subscribe(onNotification);

    socket.onmessage?.({ data: 'not json' });
    socket.onmessage?.({ data: JSON.stringify(fixture[0]) });

    expect(onNotification).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('delegates start to the socket', () => {
    const socket = buildFakeSocket();
    const source = createNotificationsSocketSource(URL, () => socket);

    source.start();

    expect(socket.reconnect).toHaveBeenCalled();
  });

  it('delegates stop to the socket', () => {
    const socket = buildFakeSocket();
    const source = createNotificationsSocketSource(URL, () => socket);

    source.stop();

    expect(socket.close).toHaveBeenCalled();
  });
});

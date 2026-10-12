import fixture from './notifications-messages.fixture.json';
import { InvalidNotificationError, parseNotification } from './notificationParser';

describe('parseNotification', () => {
  it('maps DTO fields to their camelCase domain equivalents', () => {
    const [dto] = fixture;

    const notification = parseNotification(JSON.stringify(dto));

    expect(notification).toEqual({
      userName: dto.UserName,
      documentTitle: dto.DocumentTitle,
      documentId: dto.DocumentID,
      timestamp: dto.Timestamp,
    });
  });

  it('maps every message in the server fixture', () => {
    for (const dto of fixture) {
      expect(() => parseNotification(JSON.stringify(dto))).not.toThrow();
    }
  });

  it('throws InvalidNotificationError when the raw message is not valid JSON', () => {
    expect(() => parseNotification('not json')).toThrow(InvalidNotificationError);
  });

  it('throws InvalidNotificationError when a required field is missing', () => {
    const { UserName, ...dtoMissingUserName } = fixture[0];

    expect(() => parseNotification(JSON.stringify(dtoMissingUserName))).toThrow(
      InvalidNotificationError,
    );
  });

  it('throws InvalidNotificationError when a field has the wrong type', () => {
    const invalidDto = { ...fixture[0], DocumentID: 42 };

    expect(() => parseNotification(JSON.stringify(invalidDto))).toThrow(InvalidNotificationError);
  });
});

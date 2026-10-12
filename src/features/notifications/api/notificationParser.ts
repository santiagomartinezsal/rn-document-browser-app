import type { Notification } from '../domain/notification';
import type { NotificationDto } from './notificationDto';

export class InvalidNotificationError extends Error {}

function isNotificationDto(value: unknown): value is NotificationDto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as NotificationDto;
  return (
    typeof candidate.Timestamp === 'string' &&
    typeof candidate.UserID === 'string' &&
    typeof candidate.UserName === 'string' &&
    typeof candidate.DocumentID === 'string' &&
    typeof candidate.DocumentTitle === 'string'
  );
}

function mapNotification(dto: NotificationDto): Notification {
  return {
    userName: dto.UserName,
    documentTitle: dto.DocumentTitle,
    documentId: dto.DocumentID,
    timestamp: dto.Timestamp,
  };
}

export function parseNotification(raw: string): Notification {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new InvalidNotificationError(`Invalid notification JSON: ${raw}`);
  }

  if (!isNotificationDto(payload)) {
    throw new InvalidNotificationError(`Invalid notification payload: ${raw}`);
  }

  return mapNotification(payload);
}

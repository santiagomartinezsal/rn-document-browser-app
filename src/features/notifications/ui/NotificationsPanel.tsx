import { FlatList, StyleSheet, Text, View } from 'react-native';

import { BottomSheetModal } from '@/shared/ui/BottomSheetModal';
import { colors, fontSize, spacing } from '@/shared/ui/theme';

import type { Notification } from '../domain/notification';

export interface NotificationsPanelProps {
  visible: boolean;
  notifications: Notification[];
  onClose: () => void;
}

function NotificationRow({ notification }: { notification: Notification }) {
  return (
    <View
      testID={`notification-row-${notification.documentId}-${notification.timestamp}`}
      style={styles.row}
    >
      <Text style={styles.rowTitle}>{notification.documentTitle}</Text>
      <Text style={styles.rowSubtitle}>{notification.userName}</Text>
      <Text style={styles.rowTimestamp}>{new Date(notification.timestamp).toLocaleString()}</Text>
    </View>
  );
}

export function NotificationsPanel({ visible, notifications, onClose }: NotificationsPanelProps) {
  return (
    <BottomSheetModal
      visible={visible}
      title="Notifications"
      onClose={onClose}
      closeButtonTestID="notifications-panel-close-button"
    >
      {notifications.length === 0 ? (
        <Text testID="notifications-panel-empty" style={styles.emptyText}>
          No notifications yet.
        </Text>
      ) : (
        <FlatList
          testID="notifications-panel-list"
          data={notifications}
          keyExtractor={(notification) => `${notification.documentId}-${notification.timestamp}`}
          renderItem={({ item }) => <NotificationRow notification={item} />}
        />
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  rowTimestamp: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

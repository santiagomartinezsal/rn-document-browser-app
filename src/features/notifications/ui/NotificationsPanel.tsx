import { Feather } from '@expo/vector-icons';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, fontSize, iconSize, spacing } from '@/shared/ui/theme';

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Pressable
              testID="notifications-panel-close-button"
              accessibilityRole="button"
              onPress={onClose}
            >
              <Feather name="x" size={iconSize.sm} color={colors.textSecondary} />
            </Pressable>
          </View>

          {notifications.length === 0 ? (
            <Text testID="notifications-panel-empty" style={styles.emptyText}>
              No notifications yet.
            </Text>
          ) : (
            <FlatList
              testID="notifications-panel-list"
              data={notifications}
              keyExtractor={(notification) =>
                `${notification.documentId}-${notification.timestamp}`
              }
              renderItem={({ item }) => <NotificationRow notification={item} />}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
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

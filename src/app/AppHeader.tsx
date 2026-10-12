import { StyleSheet, Text, View } from 'react-native';

import { NotificationBell, NotificationsPanel, useNotifications } from '@/features/notifications';
import { colors, fontSize, spacing } from '@/shared/ui/theme';

export interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { items, unreadCount, isPanelOpen, openPanel, closePanel } = useNotifications();

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <NotificationBell unreadCount={unreadCount} onPress={openPanel} />
      <NotificationsPanel visible={isPanelOpen} notifications={items} onClose={closePanel} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

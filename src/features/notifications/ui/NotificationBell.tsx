import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, fontSize, iconSize, spacing } from '@/shared/ui/theme';

export interface NotificationBellProps {
  unreadCount: number;
  onPress: () => void;
}

export function NotificationBell({ unreadCount, onPress }: NotificationBellProps) {
  return (
    <Pressable
      testID="notification-bell"
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
    >
      <Feather name="bell" size={iconSize.sm} color={colors.textPrimary} />
      {unreadCount > 0 && (
        <View testID="notification-bell-badge" style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: iconSize.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs / 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error,
  },
  badgeText: {
    color: colors.surface,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});

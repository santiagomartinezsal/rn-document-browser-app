import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/shared/ui/Icon';
import { colors, iconSize, spacing } from '@/shared/ui/theme';

const MAX_DISPLAYED_UNREAD_COUNT = 99;
// Sized (and font-sized) to fit "99" — the widest value formatUnreadCount
// can produce — while staying a perfect circle, rather than a pill that
// stretches with the digit count.
const BADGE_SIZE = 20;
const BADGE_FONT_SIZE = 11;

export interface NotificationBellProps {
  unreadCount: number;
  onPress: () => void;
}

function formatUnreadCount(unreadCount: number): string {
  return `${Math.min(unreadCount, MAX_DISPLAYED_UNREAD_COUNT)}`;
}

export function NotificationBell({ unreadCount, onPress }: NotificationBellProps) {
  return (
    <Pressable
      testID="notification-bell"
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
    >
      <Icon name="bell" size={iconSize.md} color={colors.textPrimary} />
      {unreadCount > 0 && (
        <View testID="notification-bell-badge" style={styles.badge}>
          <Text style={styles.badgeText}>{formatUnreadCount(unreadCount)}</Text>
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
    top: -spacing.xs,
    right: -spacing.xs,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  badgeText: {
    color: colors.surface,
    fontSize: BADGE_FONT_SIZE,
    fontWeight: '700',
    textAlign: 'center',
    // Android pads a Text's line box with extra ascent/descent space that
    // throws off vertical centering inside a tightly-sized circle like this.
    includeFontPadding: false,
  },
});

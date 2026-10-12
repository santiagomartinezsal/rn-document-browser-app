import { Pressable, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, spacing } from '@/shared/ui/theme';

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View testID="documents-error" style={styles.centered}>
      <Text>{message}</Text>
      <Pressable
        testID="documents-retry-button"
        accessibilityRole="button"
        onPress={onRetry}
        style={styles.retryButton}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.surface,
  },
});

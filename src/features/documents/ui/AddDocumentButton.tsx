import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { borderRadius, colors, fontSize, iconSize, spacing } from '@/shared/ui/theme';

export interface AddDocumentButtonProps {
  onPress: () => void;
}

export function AddDocumentButton({ onPress }: AddDocumentButtonProps) {
  return (
    <Pressable
      testID="add-document-button"
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
    >
      <Feather name="plus" size={iconSize.sm} color={colors.surface} />
      <Text style={styles.text}>Add document</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    margin: spacing.lg,
  },
  text: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});

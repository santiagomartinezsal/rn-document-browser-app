import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/shared/ui/theme';

export function EmptyState() {
  return (
    <View testID="documents-empty" style={styles.centered}>
      <Text>No documents yet.</Text>
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
});

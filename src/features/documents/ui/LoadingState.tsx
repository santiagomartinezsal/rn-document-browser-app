import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/shared/ui/theme';

export function LoadingState() {
  return (
    <View testID="documents-loading" style={styles.centered}>
      <Text>Loading documents…</Text>
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

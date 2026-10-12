import { StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, fontSize, spacing } from '@/shared/ui/theme';

import type { Document } from '../domain/document';

export interface DocumentGridCardProps {
  document: Document;
}

export function DocumentGridCard({ document }: DocumentGridCardProps) {
  return (
    <View testID={`document-grid-${document.id}`} style={styles.card}>
      <Text style={styles.title} numberOfLines={1}>
        {document.title}
      </Text>
      <Text style={styles.version}>Version {document.version}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%', // approximates 50% minus half the row gap; RN has no calc() to compute it exactly
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  version: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

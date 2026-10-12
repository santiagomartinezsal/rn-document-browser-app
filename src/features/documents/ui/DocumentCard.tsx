import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, fontSize, iconSize, spacing } from '@/shared/ui/theme';

import type { Document } from '../domain/document';

export interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  return (
    <View testID={`document-${document.id}`} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {document.title}
        </Text>
        <Text style={styles.version}>Version {document.version}</Text>
      </View>
      <View style={styles.columns}>
        <View style={styles.column}>
          <View style={styles.columnLabel}>
            <Feather name="users" size={iconSize.sm} color={colors.textSecondary} />
            <Text style={styles.columnLabelText}>Contributors</Text>
          </View>
          {document.contributors.map((contributor) => (
            <Text key={contributor.id} style={styles.itemText}>
              {contributor.name}
            </Text>
          ))}
        </View>
        <View style={styles.column}>
          <View style={styles.columnLabel}>
            <Feather name="link" size={iconSize.sm} color={colors.textSecondary} />
            <Text style={styles.columnLabelText}>Attachments</Text>
          </View>
          {document.attachments.map((attachment, index) => (
            <Text key={`${document.id}-attachment-${index}`} style={styles.itemText}>
              {attachment}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  version: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  columns: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  columnLabelText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

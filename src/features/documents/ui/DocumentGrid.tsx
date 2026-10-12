import { FlatList, StyleSheet } from 'react-native';

import { colors, spacing } from '@/shared/ui/theme';

import type { Document } from '../domain/document';
import { DocumentGridCard } from './DocumentGridCard';

export interface DocumentGridProps {
  documents: Document[];
}

export function DocumentGrid({ documents }: DocumentGridProps) {
  return (
    <FlatList
      testID="documents-grid-list"
      numColumns={2}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.row}
      data={documents}
      keyExtractor={(document) => document.id}
      renderItem={({ item }) => <DocumentGridCard document={item} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    justifyContent: 'space-between',
  },
});

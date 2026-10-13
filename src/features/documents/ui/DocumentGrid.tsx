import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { colors, spacing } from '@/shared/ui/theme';

import type { Document } from '../domain/document';
import { DocumentGridCard } from './DocumentGridCard';

export interface DocumentGridProps {
  documents: Document[];
  refreshing: boolean;
  onRefresh: () => void;
}

export function DocumentGrid({ documents, refreshing, onRefresh }: DocumentGridProps) {
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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
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

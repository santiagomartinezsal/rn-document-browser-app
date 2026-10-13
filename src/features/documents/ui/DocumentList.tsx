import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { colors, spacing } from '@/shared/ui/theme';

import type { Document } from '../domain/document';
import { DocumentCard } from './DocumentCard';

export interface DocumentListProps {
  documents: Document[];
  refreshing: boolean;
  onRefresh: () => void;
}

export function DocumentList({ documents, refreshing, onRefresh }: DocumentListProps) {
  return (
    <FlatList
      testID="documents-list"
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={documents}
      keyExtractor={(document) => document.id}
      renderItem={({ item }) => <DocumentCard document={item} />}
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
  },
});

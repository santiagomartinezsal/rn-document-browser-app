import { FlatList, StyleSheet } from 'react-native';

import { colors, spacing } from '@/shared/ui/theme';

import type { Document } from '../domain/document';
import { DocumentCard } from './DocumentCard';

export interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  return (
    <FlatList
      testID="documents-list"
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={documents}
      keyExtractor={(document) => document.id}
      renderItem={({ item }) => <DocumentCard document={item} />}
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

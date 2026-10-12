import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, spacing } from '@/shared/ui/theme';

import type { Document } from '../domain/document';
import { useDocuments } from '../state/useDocuments';
import { DocumentCard } from './DocumentCard';

function LoadingState() {
  return (
    <View testID="documents-loading" style={styles.centered}>
      <Text>Loading documents…</Text>
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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

function EmptyState() {
  return (
    <View testID="documents-empty" style={styles.centered}>
      <Text>No documents yet.</Text>
    </View>
  );
}

function DocumentList({ documents }: { documents: Document[] }) {
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

export function DocumentsScreen() {
  const { state, retry } = useDocuments();

  if (state.status === 'error') {
    return <ErrorState message={state.message} onRetry={retry} />;
  }

  if (state.status !== 'success') {
    return <LoadingState />;
  }

  if (state.documents.length === 0) {
    return <EmptyState />;
  }

  return <DocumentList documents={state.documents} />;
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
  list: {
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
  },
});

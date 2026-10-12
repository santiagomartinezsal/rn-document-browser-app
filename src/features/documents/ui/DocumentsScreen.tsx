import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { borderRadius, colors, fontSize, iconSize, spacing } from '@/shared/ui/theme';

import type { Document } from '../domain/document';
import { sortDocuments } from '../domain/sortDocuments';
import { useDocuments } from '../state/useDocuments';
import { AddDocumentModal } from './AddDocumentModal';
import { DocumentCard } from './DocumentCard';
import { DocumentGrid } from './DocumentGrid';
import { SortMenu } from './SortMenu';
import { ViewModeToggle } from './ViewModeToggle';

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Documents</Text>
    </View>
  );
}

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

function AddDocumentButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      testID="add-document-button"
      accessibilityRole="button"
      onPress={onPress}
      style={styles.addDocumentButton}
    >
      <Feather name="plus" size={iconSize.sm} color={colors.surface} />
      <Text style={styles.addDocumentButtonText}>Add document</Text>
    </Pressable>
  );
}

function DocumentsBody() {
  const { state, retry, sortBy, setSortBy, viewMode, setViewMode, addDocument } = useDocuments();
  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);

  if (state.status === 'error') {
    return <ErrorState message={state.message} onRetry={retry} />;
  }

  if (state.status !== 'success') {
    return <LoadingState />;
  }

  const documents = sortDocuments(state.documents, sortBy);

  return (
    <View style={styles.body}>
      {documents.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <View style={styles.toolbar}>
            <SortMenu selected={sortBy} onChange={setSortBy} />
            <ViewModeToggle selected={viewMode} onChange={setViewMode} />
          </View>
          <View style={styles.listArea}>
            {viewMode === 'grid' ? (
              <DocumentGrid documents={documents} />
            ) : (
              <DocumentList documents={documents} />
            )}
          </View>
        </>
      )}
      <AddDocumentButton onPress={() => setIsAddDocumentModalOpen(true)} />
      <AddDocumentModal
        visible={isAddDocumentModalOpen}
        onClose={() => setIsAddDocumentModalOpen(false)}
        onSubmit={addDocument}
      />
    </View>
  );
}

export function DocumentsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <DocumentsBody />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  body: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
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
  listArea: {
    flex: 1,
  },
  addDocumentButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    margin: spacing.lg,
  },
  addDocumentButtonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});

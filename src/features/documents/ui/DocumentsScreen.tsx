import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/shared/ui/theme';

import { sortDocuments } from '../domain/sortDocuments';
import { useDocuments } from '../state/useDocuments';
import { AddDocumentButton } from './AddDocumentButton';
import { AddDocumentModal } from './AddDocumentModal';
import { DocumentGrid } from './DocumentGrid';
import { DocumentList } from './DocumentList';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';
import { SortMenu } from './SortMenu';
import { ViewModeToggle } from './ViewModeToggle';

export function DocumentsScreen() {
  const {
    state,
    retry,
    isRefreshing,
    refresh,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    addDocument,
  } = useDocuments();
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
              <DocumentGrid
                documents={documents}
                refreshing={isRefreshing}
                onRefresh={() => void refresh()}
              />
            ) : (
              <DocumentList
                documents={documents}
                refreshing={isRefreshing}
                onRefresh={() => void refresh()}
              />
            )}
          </View>
        </>
      )}
      <AddDocumentButton onPress={() => setIsAddDocumentModalOpen(true)} />
      <AddDocumentModal
        visible={isAddDocumentModalOpen}
        onClose={() => setIsAddDocumentModalOpen(false)}
        onSubmit={(input) => void addDocument(input)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  listArea: {
    flex: 1,
  },
});

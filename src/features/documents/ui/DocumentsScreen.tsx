import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotificationBell, NotificationsPanel, useNotifications } from '@/features/notifications';
import { colors, fontSize, spacing } from '@/shared/ui/theme';

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

function Header() {
  const { items, unreadCount, isPanelOpen, openPanel, closePanel } = useNotifications();

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Documents</Text>
      <NotificationBell unreadCount={unreadCount} onPress={openPanel} />
      <NotificationsPanel visible={isPanelOpen} notifications={items} onClose={closePanel} />
    </View>
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
        onSubmit={(input) => void addDocument(input)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  listArea: {
    flex: 1,
  },
});

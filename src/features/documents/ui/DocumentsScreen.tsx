import { FlatList, Text, View } from 'react-native';

import type { Document } from '../domain/document';
import { useDocuments } from '../state/useDocuments';

function DocumentRow({ document }: { document: Document }) {
  return (
    <View testID={`document-${document.id}`}>
      <Text>{document.title}</Text>
    </View>
  );
}

export function DocumentsScreen() {
  const state = useDocuments();

  if (state.status === 'error') {
    return (
      <View testID="documents-error">
        <Text>{state.message}</Text>
      </View>
    );
  }

  if (state.status !== 'success') {
    return (
      <View testID="documents-loading">
        <Text>Loading documents…</Text>
      </View>
    );
  }

  return (
    <FlatList
      testID="documents-list"
      data={state.documents}
      keyExtractor={(document) => document.id}
      renderItem={({ item }) => <DocumentRow document={item} />}
    />
  );
}

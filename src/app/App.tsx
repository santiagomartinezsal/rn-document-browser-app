import { StatusBar } from 'expo-status-bar';

import {
  createDocumentsRepository,
  DocumentsProvider,
  DocumentsScreen,
} from '@/features/documents';

const repository = createDocumentsRepository();

export default function App() {
  return (
    <DocumentsProvider repository={repository}>
      <DocumentsScreen />
      <StatusBar style="auto" />
    </DocumentsProvider>
  );
}

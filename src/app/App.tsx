import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  createDocumentsRepository,
  DocumentsProvider,
  DocumentsScreen,
} from '@/features/documents';

const repository = createDocumentsRepository();

export default function App() {
  return (
    <SafeAreaProvider>
      <DocumentsProvider repository={repository}>
        <DocumentsScreen />
        <StatusBar style="auto" />
      </DocumentsProvider>
    </SafeAreaProvider>
  );
}

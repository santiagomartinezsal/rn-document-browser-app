import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  createDocumentsRepository,
  createLocalDocumentsSource,
  DocumentsProvider,
  DocumentsScreen,
  LocalDocumentsSourceProvider,
} from '@/features/documents';

const repository = createDocumentsRepository();
const localDocumentsSource = createLocalDocumentsSource();

export default function App() {
  return (
    <SafeAreaProvider>
      <DocumentsProvider repository={repository}>
        <LocalDocumentsSourceProvider localSource={localDocumentsSource}>
          <DocumentsScreen />
          <StatusBar style="auto" />
        </LocalDocumentsSourceProvider>
      </DocumentsProvider>
    </SafeAreaProvider>
  );
}

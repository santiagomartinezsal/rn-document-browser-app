import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  createDocumentsRepository,
  DocumentsProvider,
  DocumentsScreen,
} from '@/features/documents';
import { createNotificationsSource, NotificationsProvider } from '@/features/notifications';

const repository = createDocumentsRepository();
const notificationsSource = createNotificationsSource();

export default function App() {
  return (
    <SafeAreaProvider>
      <DocumentsProvider repository={repository}>
        <NotificationsProvider source={notificationsSource}>
          <DocumentsScreen />
          <StatusBar style="auto" />
        </NotificationsProvider>
      </DocumentsProvider>
    </SafeAreaProvider>
  );
}

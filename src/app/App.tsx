import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {
  createDocumentsRepository,
  DocumentsProvider,
  DocumentsScreen,
} from '@/features/documents';
import { createNotificationsSource, NotificationsProvider } from '@/features/notifications';

import { AppHeader } from './AppHeader';

const repository = createDocumentsRepository();
const notificationsSource = createNotificationsSource();

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <NotificationsProvider source={notificationsSource}>
          <AppHeader title="Documents" />
        </NotificationsProvider>
        <DocumentsProvider repository={repository}>
          <DocumentsScreen />
        </DocumentsProvider>
      </SafeAreaView>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});

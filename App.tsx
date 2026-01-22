import './global.css';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import AppNavigator from '@/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SidebarProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </SidebarProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

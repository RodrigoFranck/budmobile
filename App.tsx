import './global.css';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { Platform } from 'react-native';
import { ElevenLabsProvider } from '@elevenlabs/react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import AppNavigator from '@/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    'InriaSerif-Regular': require('./assets/fonts/InriaSerif-Regular.ttf'),
    'InriaSerif-Bold': require('./assets/fonts/InriaSerif-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <ActivityIndicator size="large" color="#466080" />
      </View>
    );
  }

  const content = (
    <SafeAreaProvider>
      <AuthProvider>
        <SidebarProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </SidebarProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );

  if (Platform.OS !== 'web') {
    return (
      <ElevenLabsProvider
        audioSessionConfig={{ allowMixingWithOthers: false }}
      >
        {content}
      </ElevenLabsProvider>
    );
  }

  return content;
}

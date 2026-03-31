import './global.css';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces';
import { ActivityIndicator, View } from 'react-native';
import { Platform } from 'react-native';
import { ElevenLabsProvider } from '@elevenlabs/react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AppNavigator from '@/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    'InriaSerif-Regular': require('./assets/fonts/InriaSerif-Regular.ttf'),
    'InriaSerif-Bold': require('./assets/fonts/InriaSerif-Bold.ttf'),
    InstrumentSans: require('./assets/fonts/InstrumentSans-Variable.ttf'),
    Fraunces_400Regular,
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
        <ThemeProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </ThemeProvider>
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

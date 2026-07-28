import './global.css';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces';
import { Audio } from 'expo-av';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { ConversationProvider } from '@elevenlabs/react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppAlertProvider } from '@/contexts/AppAlertContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AppNavigator from '@/navigation/AppNavigator';
import { AppQueryProvider } from '@/providers/AppQueryProvider';

export default function App() {
  const [fontsLoaded] = useFonts({
    'InriaSerif-Regular': require('./assets/fonts/InriaSerif-Regular.ttf'),
    'InriaSerif-Bold': require('./assets/fonts/InriaSerif-Bold.ttf'),
    InstrumentSans: require('./assets/fonts/InstrumentSans-Variable.ttf'),
    Fraunces_400Regular,
  });

  useEffect(() => {
    if (Platform.OS === 'web') return;
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
  }, []);

  if (!fontsLoaded) {
    // Match native / Figma splash (#1D1916) — do not flash light theme while fonts load.
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1D1916',
        }}
      >
        <ActivityIndicator size="large" color="#77716C" />
      </View>
    );
  }

  const content = (
    <SafeAreaProvider>
      <AppQueryProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppAlertProvider>
              <AppNavigator />
              <StatusBar style="auto" />
            </AppAlertProvider>
          </ThemeProvider>
        </AuthProvider>
      </AppQueryProvider>
    </SafeAreaProvider>
  );

  if (Platform.OS !== 'web') {
    return (
      <ConversationProvider>
        {content}
      </ConversationProvider>
    );
  }

  return content;
}

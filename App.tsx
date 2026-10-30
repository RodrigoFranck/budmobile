import './global.css';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Fraunces_400Regular, Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces';
import {
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { Audio } from 'expo-av';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConversationProvider } from '@elevenlabs/react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppAlertProvider } from '@/contexts/AppAlertContext';
import { AppLockProvider } from '@/contexts/AppLockContext';
import { BootSplashLayer, BootSplashProvider } from '@/contexts/BootSplashContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AnalyticsUserSync, initAnalytics } from '@/analytics';
import AppNavigator from '@/navigation/AppNavigator';
import { AppQueryProvider } from '@/providers/AppQueryProvider';
import { v3DarkColors } from '@/theme';

function ThemedStatusBar() {
  const { isDarkMode } = useTheme();
  return <StatusBar style={isDarkMode ? 'light' : 'dark'} />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'InriaSerif-Regular': require('./assets/fonts/InriaSerif-Regular.ttf'),
    'InriaSerif-Bold': require('./assets/fonts/InriaSerif-Bold.ttf'),
    InstrumentSans: require('./assets/fonts/InstrumentSans-Variable.ttf'),
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    DMSans_400Regular,
    DMSans_400Regular_Italic,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    void initAnalytics();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
  }, []);

  const tree = (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: v3DarkColors.bg }}>
      <AppQueryProvider>
        <AuthProvider>
          <ThemeProvider>
            <BootSplashProvider>
              <AnalyticsUserSync />
              <AppAlertProvider>
                <AppLockProvider>
                  <AppNavigator />
                  <ThemedStatusBar />
                </AppLockProvider>
              </AppAlertProvider>
              <BootSplashLayer fontsLoaded={fontsLoaded} />
            </BootSplashProvider>
          </ThemeProvider>
        </AuthProvider>
      </AppQueryProvider>
    </SafeAreaProvider>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: v3DarkColors.bg }}>
      {Platform.OS !== 'web' ? <ConversationProvider>{tree}</ConversationProvider> : tree}
    </GestureHandlerRootView>
  );
}

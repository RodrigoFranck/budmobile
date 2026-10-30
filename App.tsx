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
import { ActivityIndicator, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConversationProvider } from '@elevenlabs/react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppAlertProvider } from '@/contexts/AppAlertContext';
import { AppLockProvider } from '@/contexts/AppLockContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AnalyticsUserSync, initAnalytics } from '@/analytics';
import AppNavigator from '@/navigation/AppNavigator';
import { AppQueryProvider } from '@/providers/AppQueryProvider';

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

  if (!fontsLoaded) {
    // Match native / Figma splash (#171310) — do not flash light theme while fonts load.
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#171310',
        }}
      >
        <ActivityIndicator size="large" color="#77716C" />
      </View>
    );
  }

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppQueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <AnalyticsUserSync />
              <AppAlertProvider>
                <AppLockProvider>
                  <AppNavigator />
                  <ThemedStatusBar />
                </AppLockProvider>
              </AppAlertProvider>
            </ThemeProvider>
          </AuthProvider>
        </AppQueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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

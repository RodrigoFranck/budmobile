import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DefaultTheme, DarkTheme, NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { InteractionManager, View } from 'react-native';

import { SplashScreen } from '@/components/SplashScreen';
import AuthScreen from '@/pages/Auth/Auth';
import ForgotPasswordScreen from '@/pages/ForgotPassword';
import OnboardingNavigator from '@/navigation/OnboardingNavigator';
import SettingsScreen from '@/pages/Settings';
import CrisisResourcesScreen from '@/pages/CrisisResources';
import SupportFeedbackScreen from '@/pages/SupportFeedback';
import PsychologicalAssessmentNavigator from '@/navigation/PsychologicalAssessmentNavigator';
import MainTabs from '@/navigation/MainTabs';
import type { RootStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function BootstrapScreen() {
  return null;
}

export default function AppNavigator() {
  const { user, loading, onboardingCompleted, onboardingStatusLoaded } = useAuth();
  const { mode } = useTheme();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  usePushNotifications(navigationRef);
  const isLoading = Boolean(loading);
  const waitOnboarding = Boolean(user && !onboardingStatusLoaded);
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  const [interactionsDone, setInteractionsDone] = useState(false);
  const splashStartMsRef = useRef<number>(Date.now());

  useEffect(() => {
    const minDurationMs = 700;
    const elapsed = Date.now() - splashStartMsRef.current;
    const remaining = Math.max(0, minDurationMs - elapsed);
    const timer = setTimeout(() => setMinSplashElapsed(true), remaining);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setInteractionsDone(true);
    });
    return () => task.cancel();
  }, []);

  const appBootstrapDone = !isLoading && !waitOnboarding;
  const showSplash = useMemo(
    () => !(appBootstrapDone && minSplashElapsed && interactionsDone),
    [appBootstrapDone, minSplashElapsed, interactionsDone],
  );

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef} theme={mode === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {!user ? (
            <>
              <Stack.Screen name="Auth" component={AuthScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </>
          ) : !onboardingStatusLoaded ? (
            <Stack.Screen name="Bootstrap" component={BootstrapScreen} />
          ) : !onboardingCompleted ? (
            <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="CrisisResources" component={CrisisResourcesScreen} />
              <Stack.Screen name="SupportFeedback" component={SupportFeedbackScreen} />
              <Stack.Screen
                name="PsychologicalAssessment"
                component={PsychologicalAssessmentNavigator}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      <SplashScreen visible={showSplash} />
    </View>
  );
}


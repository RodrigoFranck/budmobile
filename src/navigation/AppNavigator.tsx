import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DefaultTheme,
  DarkTheme,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import {
  getActiveRoutePath,
  logScreenView,
  resolveScreenAnalytics,
} from '@/analytics';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { View } from 'react-native';
import { v3DarkColors, v3LightColors } from '@/theme';
import AccountDeletedScreen from '@/pages/menu/AccountDeletedScreen';
import {
  clearAccountDeletedName,
  peekAccountDeletedName,
} from '@/pages/menu/accountDeletedGate';

import AuthScreen from '@/pages/Auth/Auth';
import ForgotPasswordScreen from '@/pages/ForgotPassword';
import ResetPasswordScreen from '@/pages/ResetPassword';
import OnboardingNavigator from '@/navigation/OnboardingNavigator';
import SettingsScreen from '@/pages/Settings';
import CrisisResourcesScreen from '@/pages/CrisisResources';
import CheckInNavigator from '@/navigation/CheckInNavigator';
import PsychologicalAssessmentNavigator from '@/navigation/PsychologicalAssessmentNavigator';
import MainTabs from '@/navigation/MainTabs';
import type { RootStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function BootstrapScreen() {
  return null;
}

export default function AppNavigator() {
  const {
    user,
    onboardingCompleted,
    onboardingStatusLoaded,
    passwordRecoveryPending,
  } = useAuth();
  const { mode } = useTheme();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const navTheme = useMemo(() => {
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: mode === 'dark' ? v3DarkColors.bg : v3LightColors.bg,
      },
    };
  }, [mode]);
  const routePathRef = useRef<string | undefined>(undefined);
  usePushNotifications(navigationRef);

  const trackNavigationScreen = useCallback(async () => {
    const rootState = navigationRef.getRootState();
    if (!rootState) {
      return;
    }

    const routePath = getActiveRoutePath(rootState);
    if (!routePath || routePathRef.current === routePath) {
      return;
    }

    routePathRef.current = routePath;
    const screen = resolveScreenAnalytics(routePath);
    await logScreenView(screen);
  }, [navigationRef]);
  const [accountDeletedName, setDeletedAccountName] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (user) {
      setDeletedAccountName(undefined);
      return;
    }
    const pending = peekAccountDeletedName();
    if (pending) {
      setDeletedAccountName(pending.name);
    }
  }, [user]);
  return (
    <View style={{ flex: 1, backgroundColor: v3DarkColors.bg }}>
      <NavigationContainer
        ref={navigationRef}
        theme={navTheme}
        onReady={() => {
          void trackNavigationScreen();
        }}
        onStateChange={() => {
          void trackNavigationScreen();
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            freezeOnBlur: false,
            contentStyle: {
              backgroundColor: mode === 'dark' ? '#171310' : '#F1E6DB',
            },
          }}
        >
          {passwordRecoveryPending ? (
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          ) : accountDeletedName !== undefined && !user ? (
            <Stack.Screen name="AccountDeleted">
              {() => (
                <AccountDeletedScreen
                  name={accountDeletedName}
                  onClose={() => {
                    clearAccountDeletedName();
                    setDeletedAccountName(undefined);
                  }}
                />
              )}
            </Stack.Screen>
          ) : !user ? (
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
              <Stack.Screen
                name="PsychologicalAssessment"
                component={PsychologicalAssessmentNavigator}
              />
              <Stack.Screen name="CheckIn" component={CheckInNavigator} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}


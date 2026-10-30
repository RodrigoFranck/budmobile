import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { TabScreenProvider } from '@/contexts/TabScreenContext';
import ChatNavigator from '@/navigation/ChatNavigator';
import HomeScreen from '@/pages/home/HomeScreen';
import HistoryScreen from '@/pages/History';
import MenuScreen from '@/pages/menu/MenuScreen';
import VoiceSelectScreen from '@/pages/menu/VoiceSelectScreen';
import PreferencesScreen from '@/pages/menu/PreferencesScreen';
import OnboardingReplayScreen from '@/pages/onboardingV3/OnboardingReplayScreen';
import AboutMeScreen from '@/pages/menu/AboutMeScreen';
import MotivesScreen from '@/pages/menu/MotivesScreen';
import PrefEditScreen from '@/pages/menu/PrefEditScreen';
import NotificationsScreen from '@/pages/menu/NotificationsScreen';
import AccountScreen from '@/pages/menu/AccountScreen';
import DeleteAccountScreen from '@/pages/menu/DeleteAccountScreen';
import AboutBudScreen from '@/pages/menu/AboutBudScreen';
import SupportScreen from '@/pages/menu/SupportScreen';
import SupportSentScreen from '@/pages/menu/SupportSentScreen';
import LetterScreen from '@/pages/letter/LetterScreen';
import LetterOpenScreen from '@/pages/letter/LetterOpenScreen';
import PaywallScreen from '@/pages/paywall/PaywallScreen';
import ActivitiesHomeV3 from '@/pages/activitiesV3/ActivitiesHomeV3';
import ActivityFlowScreen from '@/pages/activitiesV3/ActivityFlowScreen';
import HealthSurveyScreen from '@/pages/institution/HealthSurveyScreen';
import InstitutionOptionalScreen from '@/pages/institution/InstitutionOptionalScreen';
import SleepCheckInScreen from '@/pages/institution/SleepCheckInScreen';
import ScreeningFlowScreen from '@/pages/institution/ScreeningFlowScreen';
import type { MainTabParamList } from '@/types/navigation';
import { useV3Colors } from '@/theme';

const Stack = createNativeStackNavigator<MainTabParamList>();

function MainShellNavigator() {
  const colors = useV3Colors();

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Chat" component={ChatNavigator} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen
        name="Activities"
        component={ActivitiesHomeV3}
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          presentation: 'containedTransparentModal',
          animation: 'none',
          gestureEnabled: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="VoiceSelect" component={VoiceSelectScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen
        name="OnboardingReplay"
        component={OnboardingReplayScreen}
        options={{ gestureEnabled: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen name="AboutMe" component={AboutMeScreen} />
      <Stack.Screen name="Motives" component={MotivesScreen} />
      <Stack.Screen name="PrefEdit" component={PrefEditScreen} />
      <Stack.Screen name="NotificationsPrefs" component={NotificationsScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <Stack.Screen name="AboutBud" component={AboutBudScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="SupportSent" component={SupportSentScreen} />
      <Stack.Screen
        name="Letter"
        component={LetterScreen}
        options={{ animation: 'fade', animationDuration: 420 }}
      />
      <Stack.Screen
        name="LetterOpen"
        component={LetterOpenScreen}
        options={{ animation: 'fade', animationDuration: 500 }}
      />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
      <Stack.Screen name="ActivityFlow" component={ActivityFlowScreen} />
      <Stack.Screen name="Institution" component={HealthSurveyScreen} />
      <Stack.Screen name="InstitutionOptional" component={InstitutionOptionalScreen} />
      <Stack.Screen name="SleepCheckIn" component={SleepCheckInScreen} />
      <Stack.Screen name="Screening" component={ScreeningFlowScreen} />
      <Stack.Screen name="Explore" component={HomeScreen} />
    </Stack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <TabScreenProvider>
      <MainShellNavigator />
    </TabScreenProvider>
  );
}

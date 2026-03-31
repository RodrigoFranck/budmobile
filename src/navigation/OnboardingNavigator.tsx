import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingFlowProvider } from '@/contexts/OnboardingFlowContext';
import type { OnboardingStackParamList } from '@/types/onboardingNavigation';

import OnboardingNameScreen from '@/pages/onboarding/OnboardingNameScreen';
import OnboardingAgeScreen from '@/pages/onboarding/OnboardingAgeScreen';
import OnboardingThoughtsScreen from '@/pages/onboarding/OnboardingThoughtsScreen';
import OnboardingExpectationsScreen from '@/pages/onboarding/OnboardingExpectationsScreen';
import OnboardingCommitmentScreen from '@/pages/onboarding/OnboardingCommitmentScreen';
import OnboardingNotificationsScreen from '@/pages/onboarding/OnboardingNotificationsScreen';
import OnboardingReadyScreen from '@/pages/onboarding/OnboardingReadyScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <OnboardingFlowProvider>
      <Stack.Navigator
        initialRouteName="OnboardingName"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#1C1917' },
        }}
      >
        <Stack.Screen name="OnboardingName" component={OnboardingNameScreen} />
        <Stack.Screen name="OnboardingAge" component={OnboardingAgeScreen} />
        <Stack.Screen name="OnboardingThoughts" component={OnboardingThoughtsScreen} />
        <Stack.Screen name="OnboardingExpectations" component={OnboardingExpectationsScreen} />
        <Stack.Screen name="OnboardingCommitment" component={OnboardingCommitmentScreen} />
        <Stack.Screen name="OnboardingNotifications" component={OnboardingNotificationsScreen} />
        <Stack.Screen name="OnboardingReady" component={OnboardingReadyScreen} />
      </Stack.Navigator>
    </OnboardingFlowProvider>
  );
}

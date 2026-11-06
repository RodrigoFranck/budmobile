import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OnboardingAbandonmentTracker } from '@/analytics';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingFlowProvider } from '@/contexts/OnboardingFlowContext';
import { useOnboardingColors } from '@/constants/onboardingTheme';
import { useAppProfileQuery } from '@/hooks/useAppProfileQuery';
import { parseV3Preferences } from '@/hooks/useV3Preferences';
import OnboardingV3Screen from '@/pages/onboardingV3/OnboardingV3Screen';

const Stack = createNativeStackNavigator();

function OnboardingStack() {
  const colors = useOnboardingColors();

  return (
    <>
      <OnboardingAbandonmentTracker />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="OnboardingV3" component={OnboardingV3Screen} />
      </Stack.Navigator>
    </>
  );
}

export default function OnboardingNavigator() {
  const { user } = useAuth();
  const { data: profile, isFetched } = useAppProfileQuery();
  const ready = !user?.id || isFetched;
  const shareConversations =
    parseV3Preferences(profile?.v3_preferences).shareConversations !== false;

  if (!ready) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <OnboardingFlowProvider initial={{ shareConversations }}>
      <OnboardingStack />
    </OnboardingFlowProvider>
  );
}

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OnboardingAbandonmentTracker } from '@/analytics';
import { OnboardingFlowProvider } from '@/contexts/OnboardingFlowContext';
import { useOnboardingColors } from '@/constants/onboardingTheme';
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
  return (
    <OnboardingFlowProvider>
      <OnboardingStack />
    </OnboardingFlowProvider>
  );
}

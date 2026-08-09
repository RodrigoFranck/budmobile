import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CheckInActivities from '@/pages/activities/CheckInActivities';
import CheckInFlowScreen from '@/pages/activities/CheckInFlowScreen';
import CheckInIntro from '@/pages/activities/CheckInIntro';
import CheckInResultScreen from '@/pages/activities/CheckInResultScreen';
import type { CheckInStackParamList } from '@/types/checkInNavigation.types';

const Stack = createNativeStackNavigator<CheckInStackParamList>();

export default function CheckInNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CheckInIntro" component={CheckInIntro} />
      <Stack.Screen name="CheckInActivities" component={CheckInActivities} />
      <Stack.Screen
        name="CheckInFlow"
        component={CheckInFlowScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="CheckInResult"
        component={CheckInResultScreen}
        options={{ animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}

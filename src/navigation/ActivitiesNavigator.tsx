import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ActivitiesHome from '@/pages/activities/ActivitiesHome';
import CheckInActivities from '@/pages/activities/CheckInActivities';
import CheckInFlowScreen from '@/pages/activities/CheckInFlowScreen';
import CheckInIntro from '@/pages/activities/CheckInIntro';
import CheckInResultScreen from '@/pages/activities/CheckInResultScreen';
import type { ActivitiesStackParamList } from '@/types/activitiesNavigation.types';

const Stack = createNativeStackNavigator<ActivitiesStackParamList>();

export default function ActivitiesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ActivitiesHome" component={ActivitiesHome} />
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

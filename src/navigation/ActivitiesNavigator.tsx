import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ActivitiesHome from '@/pages/activities/ActivitiesHome';
import type { ActivitiesStackParamList } from '@/types/activitiesNavigation.types';

const Stack = createNativeStackNavigator<ActivitiesStackParamList>();

export default function ActivitiesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ActivitiesHome" component={ActivitiesHome} />
    </Stack.Navigator>
  );
}

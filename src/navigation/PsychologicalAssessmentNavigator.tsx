import { createNativeStackNavigator } from '@react-navigation/native-stack';

import PsychologicalAssessmentFlowScreen from '@/pages/psychologicalAssessment/PsychologicalAssessmentFlowScreen';
import PsychologicalAssessmentIntro from '@/pages/psychologicalAssessment/PsychologicalAssessmentIntro';
import type { PsychologicalAssessmentStackParamList } from '@/types/psychologicalAssessmentNavigation';

const Stack = createNativeStackNavigator<PsychologicalAssessmentStackParamList>();

export default function PsychologicalAssessmentNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="PsychologicalAssessmentIntro"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#1D1916' },
      }}
    >
      <Stack.Screen
        name="PsychologicalAssessmentIntro"
        component={PsychologicalAssessmentIntro}
      />
      <Stack.Screen
        name="PsychologicalAssessmentFlow"
        component={PsychologicalAssessmentFlowScreen}
      />
    </Stack.Navigator>
  );
}

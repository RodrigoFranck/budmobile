import { useRoute, type RouteProp } from '@react-navigation/native';

import CincoPorquesScreen from '@/pages/activitiesV3/CincoPorquesScreen';
import FieeScreen from '@/pages/activitiesV3/FieeScreen';
import RelationMapScreen from '@/pages/activitiesV3/RelationMapScreen';
import ValuesSortScreen from '@/pages/activitiesV3/ValuesSortScreen';
import type { ActivityId } from '@/pages/activitiesV3/activityFlows';
import type { MainTabParamList } from '@/types/navigation';

type Route = RouteProp<MainTabParamList, 'ActivityFlow'>;

export default function ActivityFlowScreen() {
  const route = useRoute<Route>();
  const activityId = (route.params?.activityId ?? 'cinco_porques') as ActivityId;
  if (activityId === 'fiee') return <FieeScreen />;
  if (activityId === 'mapa_relacoes') return <RelationMapScreen />;
  if (activityId === 'ordenacao_valores') return <ValuesSortScreen />;
  return <CincoPorquesScreen />;
}

import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, Compass, History } from 'lucide-react-native';

import { ActivitiesTabIcon } from '@/components/icons/ActivitiesTabIcon';
import { TabScreenProvider, useTabScreenContext } from '@/contexts/TabScreenContext';
import ChatNavigator from '@/navigation/ChatNavigator';
import ExploreScreen from '@/pages/Explore';
import HistoryScreen from '@/pages/History';
import ActivitiesNavigator from '@/navigation/ActivitiesNavigator';
import {
  getMainTabScreenOptions,
  TAB_BAR_ICON_SIZE,
} from '@/constants/tabBar';
import type { MainTabParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabsNavigator() {
  const insets = useSafeAreaInsets();
  const { resetChatToHome, unviewedInsightsCount } = useTabScreenContext();

  const screenOptions = useMemo(
    () => getMainTabScreenOptions(insets.bottom),
    [insets.bottom],
  );

  return (
    <Tab.Navigator
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={screenOptions}
    >
      <Tab.Screen
        name="Chat"
        component={ChatNavigator}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MessageSquare color={color} size={size ?? TAB_BAR_ICON_SIZE} />
          ),
        }}
        listeners={() => ({
          tabPress: () => {
            resetChatToHome();
          },
        })}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Explorar',
          tabBarBadge:
            unviewedInsightsCount > 0 ? unviewedInsightsCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#BEEEEE',
            color: '#1D1916',
            fontSize: 11,
            fontWeight: '700',
            minWidth: 18,
            height: 18,
            lineHeight: 18,
            borderRadius: 9,
          },
          tabBarIcon: ({ color, size }) => (
            <Compass color={color} size={size ?? TAB_BAR_ICON_SIZE} />
          ),
        }}
      />
      <Tab.Screen
        name="Activities"
        component={ActivitiesNavigator}
        options={{
          tabBarLabel: 'Atividades',
          tabBarIcon: ({ color, size }) => (
            <ActivitiesTabIcon color={color} size={size ?? TAB_BAR_ICON_SIZE} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Histórico',
          tabBarIcon: ({ color, size }) => (
            <History color={color} size={size ?? TAB_BAR_ICON_SIZE} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainTabs() {
  return (
    <TabScreenProvider>
      <MainTabsNavigator />
    </TabScreenProvider>
  );
}

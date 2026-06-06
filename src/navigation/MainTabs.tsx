import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, Compass, History } from 'lucide-react-native';

import { ActivitiesTabIcon } from '@/components/icons/ActivitiesTabIcon';
import { TabScreenProvider, useTabScreenContext } from '@/contexts/TabScreenContext';
import ChatNavigator from '@/navigation/ChatNavigator';
import ExploreScreen from '@/pages/Explore';
import HistoryScreen from '@/pages/History';
import ActivitiesNavigator from '@/navigation/ActivitiesNavigator';
import {
  getHiddenTabBarStyle,
  getMainTabScreenOptions,
  TAB_BAR_ICON_SIZE,
} from '@/constants/tabBar';
import type { MainTabParamList } from '@/types/navigation';

const ACTIVITIES_TAB_BAR_VISIBLE_ROUTES = new Set(['ActivitiesHome']);

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabsNavigator() {
  const insets = useSafeAreaInsets();
  const { resetChatToHome } = useTabScreenContext();

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
        listeners={({ navigation }) => ({
          tabPress: () => {
            resetChatToHome();
            navigation.navigate('Chat', { screen: 'ChatHome' });
          },
        })}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Explorar',
          tabBarIcon: ({ color, size }) => (
            <Compass color={color} size={size ?? TAB_BAR_ICON_SIZE} />
          ),
        }}
      />
      <Tab.Screen
        name="Activities"
        component={ActivitiesNavigator}
        options={({ route }) => {
          const focusedRoute = getFocusedRouteNameFromRoute(route) ?? 'ActivitiesHome';
          const showTabBar = ACTIVITIES_TAB_BAR_VISIBLE_ROUTES.has(focusedRoute);

          return {
            tabBarLabel: 'Atividades',
            ...(showTabBar ? {} : { tabBarStyle: getHiddenTabBarStyle() }),
            tabBarIcon: ({ color, size }) => (
              <ActivitiesTabIcon color={color} size={size ?? TAB_BAR_ICON_SIZE} />
            ),
          };
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

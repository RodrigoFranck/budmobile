import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, Compass, History } from 'lucide-react-native';

import ChatScreen from '@/pages/Chat';
import ExploreScreen from '@/pages/Explore';
import HistoryScreen from '@/pages/History';
import type { MainTabParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: 'rgba(20, 20, 20, 0.95)',
          borderTopColor: 'rgba(255, 255, 255, 0.10)',
          borderTopWidth: 1,
          height: 64 + Math.max(insets.bottom, 0),
          paddingBottom: Math.max(insets.bottom, 0),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <View style={{ marginTop: 2 }}>
              <MessageSquare color={color} size={size ?? 22} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Explorar',
          tabBarIcon: ({ color, size }) => (
            <View style={{ marginTop: 2 }}>
              <Compass color={color} size={size ?? 22} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Histórico',
          tabBarIcon: ({ color, size }) => (
            <View style={{ marginTop: 2 }}>
              <History color={color} size={size ?? 22} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}


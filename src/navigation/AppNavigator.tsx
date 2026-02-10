import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import AuthScreen from '@/pages/Auth/Auth';
import ForgotPasswordScreen from '@/pages/ForgotPassword';
import HomeScreen from '@/pages/Home';
import OnboardingScreen from '@/pages/Onboarding';
import ChatScreen from '@/pages/Chat';
import ExploreScreen from '@/pages/Explore';
import HistoryScreen from '@/pages/History';
import SettingsScreen from '@/pages/Settings';

const Stack = createNativeStackNavigator();

// Loading screen component
const LoadingScreen = () => (
  <View className="flex-1 items-center justify-center bg-background">
    <ActivityIndicator size="large" />
  </View>
);

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const isLoading = Boolean(loading);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isLoading ? (
          <Stack.Screen name="Loading" component={LoadingScreen} />
        ) : !user ? (
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
      
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Explore" component={ExploreScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
          // )
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}


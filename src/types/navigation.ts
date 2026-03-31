import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

/**
 * Root navigation stack parameter list
 * Define all routes and their parameters
 */
export type RootStackParamList = {
  Auth: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string } | undefined;
  VerifyEmail: undefined;
  MainTabs: undefined;
  // Legacy routes used in some screens
  Home: undefined;
  Chat: undefined;
  Explore: undefined;
  History: undefined;
  Settings: undefined;
  SupportFeedback: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Chat:
    | {
        voiceInsight?:
          | {
              insight_type: string;
              title: string;
              description: string;
            }
          | undefined;
      }
    | undefined;
  Explore: undefined;
  History: undefined;
};

/**
 * Navigation prop type for screens
 */
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// Backwards compatibility with existing imports
export type NavigationProp = RootNavigationProp;


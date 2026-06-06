import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type { ChatInsightParam } from '@/types/chatInsight';
import type { ChatStackParamList } from '@/types/chatNavigation.types';

/**
 * Root navigation stack parameter list
 * Define all routes and their parameters
 */
export type RootStackParamList = {
  Auth: undefined;
  Bootstrap: undefined;
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
  CrisisResources: undefined;
  SupportFeedback: undefined;
  PsychologicalAssessment: undefined;
  Onboarding: undefined;
};

export type ChatTabParams = {
  voiceInsight?:
    | {
        insight_type: string;
        title: string;
        description: string;
      }
    | undefined;
  chatInsight?: ChatInsightParam;
  screen?: keyof ChatStackParamList;
  params?: ChatStackParamList[keyof ChatStackParamList];
  merge?: boolean;
  initial?: boolean;
  pop?: boolean;
};

export type MainTabParamList = {
  Chat: ChatTabParams | undefined;
  Explore: undefined;
  Activities: undefined;
  History: undefined;
};

/**
 * Navigation prop type for screens
 */
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// Backwards compatibility with existing imports
export type NavigationProp = RootNavigationProp;


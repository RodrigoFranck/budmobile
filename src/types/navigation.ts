import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type { ActivitiesStackParamList } from '@/types/activitiesNavigation.types';
import type { ChatInsightParam } from '@/types/chatInsight';
import type { ChatStackParamList } from '@/types/chatNavigation.types';
import type { CheckInStackParamList } from '@/types/checkInNavigation.types';

/**
 * Root navigation stack parameter list
 * Define all routes and their parameters
 */
export type RootStackParamList = {
  Auth: undefined;
  Bootstrap: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  VerifyEmail: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  // Legacy routes used in some screens
  Home: undefined;
  Chat: undefined;
  Explore: undefined;
  History: undefined;
  Settings: undefined;
  CrisisResources: undefined;
  PsychologicalAssessment: undefined;
  CheckIn: NavigatorScreenParams<CheckInStackParamList> | undefined;
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
  Activities: NavigatorScreenParams<ActivitiesStackParamList> | undefined;
  History: { openDeepInsight?: boolean; weekStart?: string } | undefined;
};

/**
 * Navigation prop type for screens
 */
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// Backwards compatibility with existing imports
export type NavigationProp = RootNavigationProp;


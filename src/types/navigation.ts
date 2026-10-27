import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ChatInsightParam } from '@/types/chatInsight';
import type { ChatStackParamList } from '@/types/chatNavigation.types';
import type { CheckInStackParamList } from '@/types/checkInNavigation.types';
import type { ActivityId } from '@/pages/activitiesV3/activityFlows';
import type { ScreeningId } from '@/pages/institution/screeningCatalog';
import type { PrefEditField } from '@/pages/menu/menuCatalog';

export type RootStackParamList = {
  Auth: undefined;
  AccountDeleted: undefined;
  Bootstrap: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  VerifyEmail: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
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
  Home: undefined;
  Chat: ChatTabParams | undefined;
  Explore: undefined;
  Activities: undefined;
  History: { openDeepInsight?: boolean; weekStart?: string } | undefined;
  Menu: undefined;
  VoiceSelect: undefined;
  Preferences: undefined;
  AboutMe: undefined;
  Motives: undefined;
  PrefEdit: { field: PrefEditField };
  NotificationsPrefs: undefined;
  Account: undefined;
  DeleteAccount: undefined;
  AboutBud: undefined;
  Support: undefined;
  SupportSent: undefined;
  Letter: undefined;
  LetterOpen: undefined;
  Paywall: { interval?: 'monthly' | 'annual' } | undefined;
  ActivityFlow: { activityId: ActivityId };
  Institution: { forced?: boolean } | undefined;
  InstitutionOptional: undefined;
  SleepCheckIn: undefined;
  Screening: { instrument: ScreeningId };
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = NativeStackNavigationProp<MainTabParamList>;
export type NavigationProp = RootNavigationProp;

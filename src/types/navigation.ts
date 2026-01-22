import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/**
 * Root navigation stack parameter list
 * Define all routes and their parameters
 */
export type RootStackParamList = {
  Auth: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string } | undefined;
  VerifyEmail: undefined;
  Home: undefined;
  Chat: undefined;
  Explore: undefined;
  History: undefined;
  Settings: undefined;
  Onboarding: undefined;
};

/**
 * Navigation prop type for screens
 */
export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;


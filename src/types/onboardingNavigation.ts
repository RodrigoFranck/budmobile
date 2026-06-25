import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type OnboardingStackParamList = {
  OnboardingName: undefined;
  OnboardingAge: undefined;
  OnboardingThoughts: undefined;
  OnboardingExpectations: undefined;
  OnboardingNotifications: undefined;
  OnboardingVoice: undefined;
  OnboardingReady: undefined;
};

export type OnboardingNavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

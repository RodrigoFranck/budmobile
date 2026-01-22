import { View, Text } from 'react-native';

export default function OnboardingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-foreground text-xl">Onboarding</Text>
      <Text className="text-muted-foreground">Em desenvolvimento</Text>
    </View>
  );
}


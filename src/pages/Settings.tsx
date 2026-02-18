import { View, Text, ScrollView } from 'react-native';
import { useHeaderHeight } from '@/hooks/useHeaderHeight';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Typography, Spacing, LayoutSpacing } from '@/constants/styles';

export default function SettingsScreen() {
  const headerHeight = useHeaderHeight();

  return (
    <View className="flex-1 bg-background">
      <Header />
      <Sidebar />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: headerHeight + LayoutSpacing.contentPadding.top,
          paddingHorizontal: LayoutSpacing.contentPadding.horizontal,
          paddingBottom: LayoutSpacing.contentPadding.bottom,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text 
          className="text-foreground text-xl" 
          style={{ fontSize: Typography.xl }}
        >
          Configurações
        </Text>
        <Text 
          className="text-muted-foreground" 
          style={{ fontSize: Typography.base, marginTop: Spacing.sm }}
        >
          Em desenvolvimento
        </Text>
      </ScrollView>
    </View>
  );
}


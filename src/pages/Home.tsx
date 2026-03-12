import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@/hooks/useHeaderHeight';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import type { NavigationProp } from '@/types/navigation';
import { Typography, Spacing } from '@/constants/styles';
import { LayoutSpacing } from '@/constants/layout';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const headerHeight = useHeaderHeight();

  return (
    <View className="flex-1 bg-background">
      <Header />
      <Sidebar />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: headerHeight + LayoutSpacing.contentPadding.top,
          paddingHorizontal: LayoutSpacing.contentPadding.horizontal,
          paddingBottom: LayoutSpacing.contentPadding.bottom,
        }}
      >
        <View className="items-center justify-center">
          <Text 
            className="text-foreground text-2xl font-bold mb-4" 
            style={{ fontSize: Typography['2xl'] }}
          >
            Bem-vindo ao Bud
          </Text>
          {user && (
            <>
              <Text 
                className="text-muted-foreground mb-6" 
                style={{ fontSize: Typography.base }}
              >
                Logado como: {user.email}
              </Text>
              <View style={{ width: '100%', gap: Spacing.md }}>
                <Button
                  onPress={() => navigation.navigate('Chat')}
                  className="w-full"
                >
                  Ir para Chat
                </Button>
                <Button
                  onPress={() => navigation.navigate('Explore')}
                  variant="outline"
                  className="w-full"
                >
                  Explorar Insights
                </Button>
                <Button
                  onPress={() => navigation.navigate('History')}
                  variant="outline"
                  className="w-full"
                >
                  Histórico
                </Button>
                <Button
                  onPress={() => navigation.navigate('Settings')}
                  variant="ghost"
                  className="w-full"
                >
                  Preferências
                </Button>
                <Button
                  onPress={signOut}
                  variant="destructive"
                  className="w-full"
                  style={{ marginTop: Spacing.base }}
                >
                  Sair
                </Button>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}


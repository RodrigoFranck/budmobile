import { useMemo } from 'react';
import { ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Book, Settings } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import checkInCardBg from '@/assets/checkin-card-bg.png';
import { WeekCalendarHeader } from '@/components/ui/WeekCalendarHeader';
import { LayoutSpacing } from '@/constants/layout';
import { useActivitiesTheme } from '@/lib/activitiesTheme';
import type { ActivitiesStackParamList } from '@/types/activitiesNavigation.types';
import type { MainTabNavigationProp, RootNavigationProp } from '@/types/navigation';
import { createActivitiesHomeStyles } from './ActivitiesHome.styles';

type Nav = NativeStackNavigationProp<ActivitiesStackParamList, 'ActivitiesHome'>;

export default function ActivitiesHome() {
  const navigation = useNavigation<Nav>();
  const tabNavigation = useNavigation<MainTabNavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();
  const insets = useSafeAreaInsets();
  const theme = useActivitiesTheme();
  const styles = useMemo(() => createActivitiesHomeStyles(theme), [theme]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + LayoutSpacing.contentPadding.top },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <WeekCalendarHeader
          leftIcon={Book}
          leftAccessibilityLabel="Histórico"
          onPressLeft={() => tabNavigation.navigate('History')}
          rightIcon={Settings}
          rightAccessibilityLabel="Configurações"
          onPressRight={() => rootNavigation.navigate('Settings')}
        />

        <Text style={styles.title} accessibilityRole="header">
          Atividades
        </Text>
        <Text style={styles.subtitle}>
          Exercícios rápidos para te ajudar a refletir e seguir em frente.
        </Text>

        <Pressable
          style={styles.checkInCard}
          onPress={() => navigation.navigate('CheckInIntro')}
          accessibilityRole="button"
          accessibilityLabel="Check-In. Um check-in diário com você mesmo"
        >
          <ImageBackground source={checkInCardBg} style={styles.checkInCardImage} resizeMode="cover">
            <View style={styles.checkInCardOverlay} />
            <View style={styles.checkInCardContent}>
              <View>
                <Text style={styles.checkInTitle}>Check-In</Text>
                <Text style={styles.checkInSubtitle}>Um check-in diário com você mesmo</Text>
              </View>
            </View>
          </ImageBackground>
        </Pressable>
      </ScrollView>
    </View>
  );
}

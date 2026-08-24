import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { createInsightContextCardStyles } from '@/components/chat/InsightContextCard.styles';
import {
  getInsightCardPalette,
  type InsightVisualCategory,
} from '@/constants/insightCategoryTheme';
import { useTheme } from '@/contexts/ThemeContext';

export type InsightContextBackgroundType = 'yesterday' | 'inspired' | 'frequency' | 'habit';

interface InsightContextCardProps {
  badge: string;
  title: string;
  description?: string;
  category?: InsightVisualCategory;
  backgroundType?: InsightContextBackgroundType;
}

export function InsightContextCard({
  badge,
  title,
  description,
  category = 'inspired',
}: InsightContextCardProps) {
  const { isDarkMode } = useTheme();
  const palette = useMemo(
    () => getInsightCardPalette(category, isDarkMode),
    [category, isDarkMode],
  );
  const styles = useMemo(() => createInsightContextCardStyles(palette), [palette]);
  const body = description?.trim() || title;
  const accessibilityText = description?.trim()
    ? `${badge}. ${description}`
    : `${badge}. ${title}`;

  return (
    <View
      style={styles.wrapper}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityText}
    >
      <LinearGradient
        colors={[palette.fillFrom, palette.fillTo]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.card}
      >
        <View style={styles.content}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
          <Text style={styles.body} numberOfLines={10}>
            {body}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

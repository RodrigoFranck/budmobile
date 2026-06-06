import React from 'react';
import { ImageBackground, Text, View } from 'react-native';

import { insightContextCardStyles } from '@/components/chat/InsightContextCard.styles';

const backgroundImages = {
  yesterday: require('@/assets/yesterday-journey-bg.png'),
  inspired: require('@/assets/inspired-bg.png'),
  frequency: require('@/assets/frequency-bg.png'),
  habit: require('@/assets/habit-bg.png'),
} as const;

export type InsightContextBackgroundType = keyof typeof backgroundImages;

interface InsightContextCardProps {
  badge: string;
  title: string;
  description: string;
  backgroundType: InsightContextBackgroundType;
}

export function InsightContextCard({
  badge,
  title,
  description,
  backgroundType,
}: InsightContextCardProps) {
  const styles = insightContextCardStyles;

  return (
    <View style={styles.wrapper}>
      <ImageBackground
        source={backgroundImages[backgroundType]}
        style={styles.card}
        imageStyle={styles.cardImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.content}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description} numberOfLines={3}>
            {description}
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

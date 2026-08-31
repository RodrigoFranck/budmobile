import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';

import { InsightChatActions } from '@/components/explore/InsightChatActions';
import { createInsightCardStyles } from '@/components/explore/InsightCard.styles';
import {
  getInsightCardPalette,
  type InsightVisualCategory,
} from '@/constants/insightCategoryTheme';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  badge: string;
  title: string;
  description: string;
  category?: InsightVisualCategory;
  buttonText?: string;
  onButtonClick?: () => void;
  secondaryButtonText?: string;
  onSecondaryButtonClick?: () => void;
  loading?: boolean;
  locked?: boolean;
  remaining?: number;
  cycleProgress?: number;
  cycleRequired?: number;
  lockedMessage?: string;
  onMicClick?: () => void;
  micDisabled?: boolean;
  micLabel?: string;
  className?: string;
  fillParent?: boolean;
}

export function InsightCard({
  badge,
  title,
  description,
  category = 'inspired',
  buttonText,
  onButtonClick,
  secondaryButtonText,
  onSecondaryButtonClick,
  loading = false,
  locked = false,
  remaining = 0,
  cycleProgress = 0,
  cycleRequired = 0,
  lockedMessage,
  onMicClick,
  micDisabled = false,
  micLabel,
  className,
  fillParent = false,
}: InsightCardProps) {
  const { isDarkMode } = useTheme();
  const palette = useMemo(
    () => getInsightCardPalette(category, isDarkMode),
    [category, isDarkMode],
  );
  const styles = useMemo(() => createInsightCardStyles(palette), [palette]);

  const containerStyle = [
    styles.cardContainer,
    fillParent ? styles.cardFillParent : null,
    locked ? styles.cardLocked : null,
  ];

  if (loading) {
    return (
      <View
        className={cn(className)}
        style={[
          styles.loadingContainer,
          fillParent ? styles.cardFillParent : null,
        ]}
      >
        <ActivityIndicator size="small" color={palette.title} />
      </View>
    );
  }

  const isUpgradeLocked = locked && !!lockedMessage;
  const isButtonDisabled = locked && !lockedMessage;
  const showProgress = locked && cycleRequired > 0 && cycleProgress < cycleRequired;
  const progressPercent =
    cycleRequired > 0 ? Math.min((cycleProgress / cycleRequired) * 100, 100) : 0;
  const showActions = (!!buttonText && !!onButtonClick) || !!onMicClick;
  const resolvedMessageLabel = isUpgradeLocked
    ? lockedMessage || buttonText
    : buttonText;

  return (
    <View className={className} style={containerStyle}>
      <LinearGradient
        colors={[palette.fillFrom, palette.fillTo]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      >
        <View
          style={[
            styles.contentContainer,
            !showActions ? styles.contentContainerNoActions : null,
          ]}
        >
          <View style={styles.badgeWrap}>
            <View style={styles.badgeContainer}>
              {locked ? (
                <Lock size={12} color={palette.badgeText} strokeWidth={2} />
              ) : null}
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          </View>

          <View style={styles.contentGap}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.descriptionText}>{description}</Text>

            {showProgress ? (
              <View style={styles.progressWrap}>
                <Text style={styles.progressLabel}>
                  {cycleProgress}/{cycleRequired} dias
                </Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${progressPercent}%` }]}
                  />
                </View>
              </View>
            ) : null}
          </View>

          {!!secondaryButtonText && !!onSecondaryButtonClick ? (
            <View style={styles.secondaryButtonWrap}>
              <TouchableOpacity
                onPress={onSecondaryButtonClick}
                accessibilityRole="button"
                accessibilityLabel={secondaryButtonText}
                activeOpacity={0.8}
                disabled={locked}
                style={[
                  styles.secondaryButton,
                  locked
                    ? styles.secondaryButtonLocked
                    : styles.secondaryButtonEnabled,
                ]}
              >
                <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
        {showActions ? (
          <InsightChatActions
            style={styles.actionsRow}
            messageLabel={resolvedMessageLabel}
            messageAccessibilityLabel={
              isUpgradeLocked ? lockedMessage || buttonText : buttonText
            }
            voiceAccessibilityLabel={micLabel}
            onMessage={buttonText && onButtonClick ? onButtonClick : undefined}
            onVoice={onMicClick}
            messageDisabled={isButtonDisabled}
            voiceDisabled={micDisabled || locked}
          />
        ) : null}
      </LinearGradient>
    </View>
  );
}

import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronUp, Lock, Mic } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { insightCardStyles } from '@/components/explore/InsightCard.styles';
import {
  insightCardImageStyle,
  insightCardMicHitSlop,
} from '@/components/explore/InsightCard.styles';

interface InsightCardProps {
  badge: string;
  title: string;
  description: string;
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
  backgroundImage?: any;
}

export function InsightCard({
  badge,
  title,
  description,
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
  backgroundImage,
}: InsightCardProps) {
  if (loading) {
    return (
      <View className={cn(className)} style={insightCardStyles.loadingContainer}>
        <ActivityIndicator size="small" color="white" />
      </View>
    );
  }

  const isUpgradeLocked = locked && !!lockedMessage;
  const isButtonDisabled = locked && !lockedMessage;
  const showProgress = locked && cycleRequired > 0 && cycleProgress < cycleRequired;
  const progressPercent =
    cycleRequired > 0 ? Math.min((cycleProgress / cycleRequired) * 100, 100) : 0;
  const showActions =
    !isButtonDisabled && ((!!buttonText && !!onButtonClick) || !!onMicClick);

  const CardActions = showActions ? (
    <View style={insightCardStyles.actionsRow}>
      {!!buttonText && !!onButtonClick ? (
        <TouchableOpacity
          onPress={onButtonClick}
          disabled={isButtonDisabled}
          accessibilityRole="button"
          accessibilityLabel={isUpgradeLocked ? lockedMessage || buttonText : buttonText}
          activeOpacity={0.85}
          style={[
            insightCardStyles.actionButton,
            isButtonDisabled
              ? insightCardStyles.actionButtonLocked
              : insightCardStyles.actionButtonEnabled,
          ]}
        >
          <Text style={insightCardStyles.actionButtonText} numberOfLines={1}>
            {isUpgradeLocked ? lockedMessage || buttonText : buttonText}
          </Text>
          <View style={insightCardStyles.sendIcon}>
            <ChevronUp size={14} color="#EFEAE6" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
      ) : null}

      {onMicClick ? (
        <TouchableOpacity
          onPress={onMicClick}
          disabled={micDisabled || locked}
          accessibilityRole="button"
          accessibilityLabel={micLabel || 'Abrir modo de voz para este insight'}
          activeOpacity={0.7}
          style={[
            insightCardStyles.micButton,
            micDisabled || locked
              ? insightCardStyles.micButtonDisabled
              : insightCardStyles.micButtonEnabled,
          ]}
          hitSlop={insightCardMicHitSlop}
        >
          <Mic
            size={18}
            color={micDisabled || locked ? 'rgba(29,25,22,0.45)' : '#1D1916'}
            strokeWidth={2}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  ) : null;

  const CardBody = (
    <>
      <View
        style={[
          insightCardStyles.contentContainer,
          !showActions ? insightCardStyles.contentContainerNoActions : null,
        ]}
      >
        {backgroundImage ? <View className="absolute inset-0 bg-black/40" /> : null}

        <View style={insightCardStyles.badgeWrap}>
          <View style={insightCardStyles.badgeContainer}>
            {locked ? (
              <Lock size={12} color="rgba(255,255,255,0.4)" strokeWidth={2} />
            ) : null}
            <Text style={insightCardStyles.badgeText}>{badge}</Text>
          </View>
        </View>

        <View style={insightCardStyles.contentGap}>
          <Text style={insightCardStyles.titleText}>{title}</Text>
          <Text style={insightCardStyles.descriptionText}>{description}</Text>

          {showProgress ? (
            <View style={insightCardStyles.progressWrap}>
              <Text style={insightCardStyles.progressLabel}>
                {cycleProgress}/{cycleRequired} dias
              </Text>
              <View style={insightCardStyles.progressTrack}>
                <View
                  style={[insightCardStyles.progressFill, { width: `${progressPercent}%` }]}
                />
              </View>
            </View>
          ) : null}
        </View>

        {!!secondaryButtonText && !!onSecondaryButtonClick ? (
          <View style={insightCardStyles.secondaryButtonWrap}>
            <TouchableOpacity
              onPress={onSecondaryButtonClick}
              accessibilityRole="button"
              accessibilityLabel={secondaryButtonText}
              activeOpacity={0.8}
              disabled={locked}
              style={[
                insightCardStyles.secondaryButton,
                locked
                  ? insightCardStyles.secondaryButtonLocked
                  : insightCardStyles.secondaryButtonEnabled,
              ]}
            >
              <Text style={insightCardStyles.secondaryButtonText}>{secondaryButtonText}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
      {CardActions}
    </>
  );

  if (backgroundImage) {
    return (
      <ImageBackground
        source={backgroundImage}
        className={cn(locked && 'opacity-75', className)}
        imageStyle={insightCardImageStyle}
        style={insightCardStyles.cardContainer}
      >
        {CardBody}
      </ImageBackground>
    );
  }

  return (
    <View
      className={cn(locked && 'opacity-75', className)}
      style={insightCardStyles.cardContainer}
    >
      {CardBody}
    </View>
  );
}

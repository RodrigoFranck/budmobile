import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowUp, Lock } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useAppColors } from '@/lib/colors';
import { WavesIcon } from '@/voice/WavesIcon';
import {
  insightCardActionLayout,
  insightCardStyles,
  insightCardImageStyle,
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
  fillParent?: boolean;
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
  fillParent = false,
}: InsightCardProps) {
  const colors = useAppColors();
  const containerStyle = [
    insightCardStyles.cardContainer,
    fillParent ? insightCardStyles.cardFillParent : null,
    locked ? insightCardStyles.cardLocked : null,
  ];

  if (loading) {
    return (
      <View
        className={cn(className)}
        style={[
          insightCardStyles.loadingContainer,
          fillParent ? insightCardStyles.cardFillParent : null,
        ]}
      >
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
  const isVoiceDisabled = micDisabled || locked;
  const sendIconColor = `${colors['chat-warm-bg']}8C`;
  const voiceIconSize = Math.round(insightCardActionLayout.height * 0.42);

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
          <View style={insightCardStyles.sendButton}>
            <ArrowUp
              size={insightCardActionLayout.sendIconSize}
              color={sendIconColor}
              strokeWidth={3}
            />
          </View>
        </TouchableOpacity>
      ) : null}

      {onMicClick ? (
        <TouchableOpacity
          onPress={onMicClick}
          disabled={isVoiceDisabled}
          accessibilityRole="button"
          accessibilityLabel={micLabel || 'Abrir modo de voz para este insight'}
          activeOpacity={0.88}
          style={[
            insightCardStyles.voiceButton,
            isVoiceDisabled
              ? insightCardStyles.voiceButtonDisabled
              : insightCardStyles.voiceButtonEnabled,
          ]}
          hitSlop={insightCardActionLayout.voiceHitSlop}
        >
          <WavesIcon size={voiceIconSize} color="#373737" />
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
        className={className}
        imageStyle={insightCardImageStyle}
        style={containerStyle}
      >
        {CardBody}
      </ImageBackground>
    );
  }

  return (
    <View className={className} style={containerStyle}>
      {CardBody}
    </View>
  );
}

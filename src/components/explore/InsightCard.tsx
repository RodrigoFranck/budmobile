import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronUp, Mic } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { insightCardStyles } from '@/components/explore/InsightCard.styles';
import {
  insightCardImageStyle,
  insightCardMicHitSlop,
} from '@/components/explore/InsightCard.styles';
// Lock icon will be represented as emoji or text

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
      <View
        className={cn(
          'relative overflow-hidden rounded-2xl p-5 min-h-[220px]',
          className
        )}
        style={insightCardStyles.loadingContainer}
      >
        <ActivityIndicator size="small" color="white" />
      </View>
    );
  }

  const isUpgradeLocked = locked && !!lockedMessage;
  const isButtonDisabled = locked && !lockedMessage;
  const showProgress = locked && cycleRequired > 0 && cycleProgress < cycleRequired;
  const progressPercent = cycleRequired > 0
    ? Math.min((cycleProgress / cycleRequired) * 100, 100)
    : 0;

  const CardContent = (
    <View style={insightCardStyles.contentContainer}>
      {/* Dark overlay for text legibility when background image exists */}
      {backgroundImage && (
        <View className="absolute inset-0 bg-black/40" />
      )}

      {/* Badge */}
      <View className="flex justify-center mb-5">
        <View
          className="flex-row items-center gap-1.5 px-3 py-1 rounded-full self-center"
          style={insightCardStyles.badgeContainer}
        >
          {locked && <Text className="text-white/40 text-sm">🔒</Text>}
          <Text
            className="text-xs font-bold tracking-widest uppercase"
            style={insightCardStyles.badgeText}
          >
            {badge}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="relative" style={insightCardStyles.contentGap}>
        <Text
          className="text-2xl font-bold text-white leading-tight tracking-tight"
          style={insightCardStyles.titleText}
        >
          {title}
        </Text>
        <Text
          className="text-base leading-relaxed font-light"
          style={insightCardStyles.descriptionText}
        >
          {description}
        </Text>

        {showProgress ? (
          <View style={insightCardStyles.progressWrap}>
            <Text style={insightCardStyles.progressLabel}>
              {cycleProgress}/{cycleRequired} conversas
            </Text>
            <View style={insightCardStyles.progressTrack}>
              <View
                style={[
                  insightCardStyles.progressFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
          </View>
        ) : null}
      </View>

      {!!secondaryButtonText && !!onSecondaryButtonClick && (
        <View style={insightCardStyles.secondaryButtonWrap}>
          <TouchableOpacity
            onPress={onSecondaryButtonClick}
            accessibilityRole="button"
            accessibilityLabel={secondaryButtonText}
            activeOpacity={0.8}
            disabled={locked}
            style={[
              insightCardStyles.secondaryButton,
              locked ? insightCardStyles.secondaryButtonLocked : insightCardStyles.secondaryButtonEnabled,
            ]}
          >
            <Text style={insightCardStyles.secondaryButtonText}>
              {secondaryButtonText}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (backgroundImage) {
    return (
      <ImageBackground
        source={backgroundImage}
        className={cn(
          'group relative overflow-hidden rounded-2xl pt-5 px-5 pb-16 min-h-[220px]',
          locked && 'opacity-75',
          className
        )}
        imageStyle={insightCardImageStyle}
        style={insightCardStyles.cardContainer}
      >
        {CardContent}

        {/* Insight action button (matches Figma "Envie uma mensagem") */}
        {!!buttonText && !!onButtonClick && (
          <TouchableOpacity
            onPress={onButtonClick}
            disabled={isButtonDisabled}
            accessibilityRole="button"
            accessibilityLabel={isUpgradeLocked ? lockedMessage || buttonText : buttonText}
            activeOpacity={0.85}
            style={[
              insightCardStyles.actionButton,
              isButtonDisabled ? insightCardStyles.actionButtonLocked : insightCardStyles.actionButtonEnabled,
            ]}
          >
            <Text
              style={insightCardStyles.actionButtonText}
              numberOfLines={1}
            >
              {isUpgradeLocked ? lockedMessage || buttonText : buttonText}
            </Text>
            <ChevronUp size={18} color="#EFEAE6" />
          </TouchableOpacity>
        )}

        {/* Microfone (voz) */}
        {onMicClick && (
          <TouchableOpacity
            onPress={onMicClick}
            disabled={micDisabled}
            accessibilityRole="button"
            accessibilityLabel={micLabel || 'Abrir modo de voz para este insight'}
            activeOpacity={0.7}
            style={[
              insightCardStyles.micButton,
              micDisabled ? insightCardStyles.micButtonDisabled : insightCardStyles.micButtonEnabled,
            ]}
            hitSlop={insightCardMicHitSlop}
          >
            <Mic
              size={20}
              color={micDisabled ? 'rgba(255,255,255,0.45)' : '#FFFFFF'}
              strokeWidth={2}
            />
          </TouchableOpacity>
        )}
      </ImageBackground>
    );
  }

  return (
    <View
      className={cn(
        'group relative overflow-hidden rounded-2xl pt-5 px-5 pb-16 min-h-[220px]',
        locked && 'opacity-75',
        className
      )}
      style={insightCardStyles.cardContainer}
    >
      {CardContent}

      {/* Insight action button (matches Figma "Envie uma mensagem") */}
      {!!buttonText && !!onButtonClick && (
        <TouchableOpacity
          onPress={onButtonClick}
          disabled={isButtonDisabled}
          accessibilityRole="button"
          accessibilityLabel={isUpgradeLocked ? lockedMessage || buttonText : buttonText}
          activeOpacity={0.85}
          style={[
            insightCardStyles.actionButton,
            isButtonDisabled ? insightCardStyles.actionButtonLocked : insightCardStyles.actionButtonEnabled,
          ]}
        >
          <Text style={insightCardStyles.actionButtonText} numberOfLines={1}>
            {isUpgradeLocked ? lockedMessage || buttonText : buttonText}
          </Text>
          <ChevronUp size={18} color="#EFEAE6" />
        </TouchableOpacity>
      )}

      {/* Microfone (voz) */}
      {onMicClick && (
        <TouchableOpacity
          onPress={onMicClick}
          disabled={micDisabled}
          accessibilityRole="button"
          accessibilityLabel={micLabel || 'Abrir modo de voz para este insight'}
          activeOpacity={0.7}
          style={[
            insightCardStyles.micButton,
            micDisabled ? insightCardStyles.micButtonDisabled : insightCardStyles.micButtonEnabled,
          ]}
          hitSlop={insightCardMicHitSlop}
        >
          <Mic
            size={20}
            color={micDisabled ? 'rgba(255,255,255,0.45)' : '#FFFFFF'}
            strokeWidth={2}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}


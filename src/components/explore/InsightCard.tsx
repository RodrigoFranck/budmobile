import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
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
  lockedMessage?: string;
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
  lockedMessage,
  className,
  backgroundImage,
}: InsightCardProps) {
  if (loading) {
    return (
      <View
        className={cn(
          'relative overflow-hidden rounded-2xl p-5 min-h-[220px]',
          'bg-black/95 border border-white/5',
          className
        )}
      >
        <ActivityIndicator size="small" color="white" />
      </View>
    );
  }

  const CardContent = (
    <View>
      {/* Dark overlay for text legibility when background image exists */}
      {backgroundImage && (
        <View className="absolute inset-0 bg-black/40" />
      )}

      {/* Badge */}
      <View className="flex justify-center mb-5">
        <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 self-center">
          {locked && <Text className="text-white/40 text-sm">🔒</Text>}
          <Text className="text-xs font-bold text-white/60 tracking-widest uppercase">
            {badge}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="relative items-center" style={{ gap: 12 }}>
        <Text className="text-2xl font-bold text-white leading-tight tracking-tight text-center">
          {title}
        </Text>
        <Text className="text-base text-white/60 leading-relaxed font-light text-center">
          {description}
        </Text>
      </View>

      {/* Buttons - só renderiza se NÃO estiver locked */}
      {!locked && (buttonText || secondaryButtonText) && (
        <View className="relative mt-6 flex-row justify-center" style={{ gap: 12 }}>
          {secondaryButtonText && onSecondaryButtonClick && (
            <Button
              onPress={onSecondaryButtonClick}
              size="sm"
              variant="ghost"
              className="bg-transparent"
            >
              <Text className="text-white/60 text-base font-medium">
                {secondaryButtonText}
              </Text>
            </Button>
          )}
          {buttonText && onButtonClick && (
            <Button
              onPress={onButtonClick}
              size="sm"
              className="bg-white/10 border border-white/10"
            >
              <Text className="text-white text-base font-medium">
                {buttonText}
              </Text>
            </Button>
          )}
        </View>
      )}

      {/* Quando locked, mostrar indicador visual */}
      {locked && (
        <View className="relative mt-6 flex justify-center">
          <Text className="text-sm text-white/40 font-medium text-center">
            {lockedMessage || 'Continue conversando para desbloquear'}
          </Text>
        </View>
      )}
    </View>
  );

  if (backgroundImage) {
    return (
      <ImageBackground
        source={backgroundImage}
        className={cn(
          'group relative overflow-hidden rounded-2xl p-5 min-h-[220px]',
          'bg-black/95 border border-white/10',
          locked && 'opacity-75',
          className
        )}
        imageStyle={{ opacity: 0.6 }}
      >
        {CardContent}
      </ImageBackground>
    );
  }

  return (
    <View
      className={cn(
        'group relative overflow-hidden rounded-2xl p-5 min-h-[220px]',
        'bg-black/95 border border-white/10',
        locked && 'opacity-75',
        className
      )}
    >
      {CardContent}
    </View>
  );
}


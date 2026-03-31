import { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { instrumentSansFont } from '@/constants/onboardingTheme';
import { useAppColors } from '@/lib/colors';

function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun..6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface WeekCalendarHeaderProps {
  leftIcon?: LucideIcon;
  leftAccessibilityLabel?: string;
  onPressLeft?: () => void;
  showLeftIndicatorDot?: boolean;

  rightIcon?: LucideIcon;
  rightAccessibilityLabel?: string;
  onPressRight?: () => void;

  referenceDate?: Date;
}

export function WeekCalendarHeader({
  leftIcon: LeftIcon,
  leftAccessibilityLabel = 'Calendário',
  onPressLeft,
  showLeftIndicatorDot = false,
  rightIcon: RightIcon,
  rightAccessibilityLabel = 'Configurações',
  onPressRight,
  referenceDate,
}: WeekCalendarHeaderProps) {
  const colors = useAppColors();
  const now = referenceDate ?? new Date();
  const buttonSize = 35;
  const buttonRadius = 12;
  const buttonBackgroundColor = 'transparent';
  const buttonIconSize = 35;

  const weekDays = useMemo(() => {
    const weekStart = startOfWeekMonday(now);
    return [
      { key: 'Seg', offset: 0 },
      { key: 'Ter', offset: 1 },
      { key: 'Qua', offset: 2 },
      { key: 'Qui', offset: 3 },
      { key: 'Sex', offset: 4 },
      { key: 'Sab', offset: 5 },
      { key: 'Dom', offset: 6 },
    ].map((d) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + d.offset);
      return {
        label: d.key,
        day: date.getDate(),
        isToday: date.toDateString() === now.toDateString(),
      };
    });
  }, [now]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 20,
      }}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={leftAccessibilityLabel}
        activeOpacity={0.8}
        onPress={onPressLeft}
        disabled={!onPressLeft}
        style={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonRadius,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: buttonBackgroundColor,
          borderWidth: 0,
          opacity: onPressLeft ? 1 : 0,
        }}
      >
        {showLeftIndicatorDot ? (
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 6,
              height: 6,
              borderRadius: 3,
                backgroundColor: colors.accent,
            }}
          />
        ) : null}
        {LeftIcon ? <LeftIcon size={buttonIconSize} color={colors['muted-foreground']} /> : null}
      </TouchableOpacity>

      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
        {weekDays.map((d) => (
          <View key={`${d.label}-${d.day}`} style={{ width: 38, alignItems: 'center', gap: 2 }}>
            <Text
              style={{
                fontFamily: instrumentSansFont,
                fontSize: 15,
                color: colors['muted-foreground'],
                opacity: 0.85,
              }}
            >
              {d.label}
            </Text>
            <View
              style={{
                minWidth: 0,
                height: 22,
                borderRadius: 11,
                paddingHorizontal: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: d.isToday ? colors.card : 'transparent',
                borderWidth: d.isToday ? 1 : 0,
                borderColor: d.isToday ? colors.border : 'transparent',
              }}
            >
              <Text
                style={{
                  fontFamily: instrumentSansFont,
                  fontSize: 15,
                  color: colors.foreground,
                  opacity: d.isToday ? 1 : 0.75,
                }}
              >
                {d.day}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={rightAccessibilityLabel}
        activeOpacity={0.8}
        onPress={onPressRight}
        disabled={!onPressRight}
        style={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonRadius,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: buttonBackgroundColor,
          borderWidth: 0,
          opacity: onPressRight ? 1 : 0,
        }}
      >
        {RightIcon ? <RightIcon size={buttonIconSize} color={colors['muted-foreground']} /> : null}
      </TouchableOpacity>
    </View>
  );
}


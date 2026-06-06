import { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useAppColors } from '@/lib/colors';
import {
  createWeekCalendarHeaderStyles,
  WEEK_CALENDAR_HEADER,
} from '@/components/ui/WeekCalendarHeader.styles';

function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
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
  const styles = useMemo(() => createWeekCalendarHeaderStyles(colors), [colors]);

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
    <View style={styles.root}>
      <View style={[styles.sideSlot, styles.sideSlotLeft]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={leftAccessibilityLabel}
          activeOpacity={0.8}
          onPress={onPressLeft}
          disabled={!onPressLeft}
          style={[styles.actionButton, !onPressLeft && styles.actionButtonHidden]}
        >
          {showLeftIndicatorDot ? <View style={styles.indicatorDot} /> : null}
          {LeftIcon ? (
            <LeftIcon size={WEEK_CALENDAR_HEADER.iconSize} color={colors['muted-foreground']} />
          ) : null}
        </TouchableOpacity>
      </View>

      <View style={styles.calendarOverlay} pointerEvents="box-none">
        <View style={styles.calendarRow}>
          {weekDays.map((d) => (
            <View key={`${d.label}-${d.day}`} style={styles.dayColumn}>
              <Text style={styles.dayLabel}>{d.label}</Text>
              <View
                style={[styles.dayNumberWrap, d.isToday && styles.dayNumberWrapToday]}
              >
                <Text
                  style={[styles.dayNumber, !d.isToday && styles.dayNumberMuted]}
                >
                  {d.day}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.sideSlot, styles.sideSlotRight]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={rightAccessibilityLabel}
          activeOpacity={0.8}
          onPress={onPressRight}
          disabled={!onPressRight}
          style={[styles.actionButton, !onPressRight && styles.actionButtonHidden]}
        >
          {RightIcon ? (
            <RightIcon size={WEEK_CALENDAR_HEADER.iconSize} color={colors['muted-foreground']} />
          ) : null}
        </TouchableOpacity>
      </View>
    </View>
  );
}

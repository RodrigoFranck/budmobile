import { Platform, StyleSheet } from 'react-native';

import { LayoutSpacing, SCREEN } from '@/constants/layout';
import { instrumentSansFont } from '@/constants/onboardingTheme';
import type { AppColors } from '@/lib/colors';

export const WEEK_CALENDAR_HEADER = {
  rowHeight: Platform.select({ ios: 48, android: 50, default: 48 }) ?? 48,
  sideSlotWidth: Platform.select({ ios: 40, android: 44, default: 40 }) ?? 40,
  buttonSize: 36,
  iconSize: 24,
  marginBottom: 10,
} as const;

function getCalendarTrackWidth() {
  const horizontalPadding = LayoutSpacing.contentPadding.horizontal * 2;
  const sideSlots = WEEK_CALENDAR_HEADER.sideSlotWidth * 2;
  return SCREEN.width - horizontalPadding - sideSlots;
}

export function getWeekCalendarDayColumnWidth() {
  return Math.floor(getCalendarTrackWidth() / 7);
}

export function createWeekCalendarHeaderStyles(colors: AppColors) {
  const dayColumnWidth = getWeekCalendarDayColumnWidth();
  const calendarTrackWidth = dayColumnWidth * 7;

  return StyleSheet.create({
    root: {
      position: 'relative',
      minHeight: WEEK_CALENDAR_HEADER.rowHeight,
      marginBottom: WEEK_CALENDAR_HEADER.marginBottom,
    },
    sideSlot: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: WEEK_CALENDAR_HEADER.sideSlotWidth,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    sideSlotLeft: {
      left: 0,
    },
    sideSlotRight: {
      right: 0,
    },
    actionButton: {
      width: WEEK_CALENDAR_HEADER.buttonSize,
      height: WEEK_CALENDAR_HEADER.buttonSize,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    },
    actionButtonHidden: {
      opacity: 0,
    },
    indicatorDot: {
      position: 'absolute',
      top: Platform.OS === 'android' ? 0 : -2,
      right: Platform.OS === 'android' ? 0 : -2,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },
    calendarOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    calendarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: calendarTrackWidth,
    },
    dayColumn: {
      width: dayColumnWidth,
      alignItems: 'center',
      gap: 2,
    },
    dayLabel: {
      fontFamily: instrumentSansFont,
      fontSize: 15,
      color: colors['muted-foreground'],
      opacity: 0.85,
    },
    dayNumberWrap: {
      minWidth: 0,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayNumberWrapToday: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayNumber: {
      fontFamily: instrumentSansFont,
      fontSize: 15,
      color: colors.foreground,
    },
    dayNumberMuted: {
      opacity: 0.75,
    },
  });
}

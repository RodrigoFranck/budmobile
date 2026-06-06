import { Platform, StyleSheet } from 'react-native';

import { LayoutSpacing } from '@/constants/layout';
import { WEEK_CALENDAR_HEADER } from '@/components/ui/WeekCalendarHeader.styles';

export const TAB_SCREEN_HEADER = {
  contentTopPadding: LayoutSpacing.contentPadding.top,
  horizontalPadding: LayoutSpacing.contentPadding.horizontal,
  contentHeight:
    WEEK_CALENDAR_HEADER.rowHeight + WEEK_CALENDAR_HEADER.marginBottom,
} as const;

export function createTabScreenHeaderStyles() {
  return StyleSheet.create({
    container: {
      zIndex: Platform.OS === 'android' ? 2 : 1,
    },
  });
}

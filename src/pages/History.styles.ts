import { StyleSheet } from 'react-native';

import { frauncesFont } from '@/constants/onboardingTheme';
import type { AppColors } from '@/lib/colors';

export function createHistoryStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageTitle: {
      fontFamily: frauncesFont,
      fontSize: 32,
      color: colors.foreground,
      marginBottom: 16,
    },
    inspiredCard: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 24,
      minHeight: 140,
    },
    inspiredOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    inspiredContent: {
      padding: 24,
    },
    inspiredBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    inspiredBadge: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 2,
      color: 'rgba(255, 255, 255, 0.8)',
      textTransform: 'uppercase',
    },
    inspiredTitle: {
      fontFamily: frauncesFont,
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 4,
    },
    inspiredDescription: {
      fontFamily: frauncesFont,
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: 20,
    },
    inspiredHintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
    },
    inspiredHint: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.5)',
    },
    inspiredLockedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    inspiredLockedText: {
      flex: 1,
      fontFamily: frauncesFont,
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: 20,
    },
    skeletonCard: {
      height: 140,
      borderRadius: 16,
      backgroundColor: colors.muted,
      marginBottom: 24,
    },
    skeletonLine: {
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.muted,
      marginBottom: 8,
    },
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    monthNavButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthNavButtonDisabled: {
      opacity: 0.35,
    },
    monthLabel: {
      fontFamily: frauncesFont,
      fontSize: 18,
      color: colors.foreground,
      textAlign: 'center',
    },
    monthCount: {
      fontFamily: frauncesFont,
      fontSize: 12,
      color: colors['muted-foreground'],
      textAlign: 'center',
      marginTop: 4,
    },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingVertical: 48,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: frauncesFont,
      fontSize: 16,
      color: colors['muted-foreground'],
      textAlign: 'center',
      marginTop: 16,
    },
    emptyMonth: {
      paddingVertical: 48,
      alignItems: 'center',
    },
    emptyMonthText: {
      fontFamily: frauncesFont,
      fontSize: 14,
      color: colors['muted-foreground'],
    },
    dateGroup: {
      marginBottom: 32,
    },
    dateGroupTitle: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 1,
      color: colors['muted-foreground'],
      marginBottom: 12,
    },
    conversationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 4,
      borderRadius: 8,
    },
    conversationTitle: {
      flex: 1,
      fontFamily: frauncesFont,
      fontSize: 17,
      color: colors.foreground,
      marginRight: 12,
    },
  });
}

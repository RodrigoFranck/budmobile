import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LayoutSpacing } from '@/constants/layout';
import { useAppColors } from '@/lib/colors';
import { createScreenLoadingGateStyles } from '@/components/ui/ScreenLoadingGate.styles';

interface ScreenLoadingGateProps {
  loading: boolean;
  children: ReactNode;
}

export function ScreenLoadingGate({ loading, children }: ScreenLoadingGateProps) {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const styles = useMemo(() => createScreenLoadingGateStyles(colors), [colors]);

  if (loading) {
    return (
      <View
        style={[
          styles.loadingRoot,
          {
            paddingTop: insets.top + LayoutSpacing.contentPadding.top,
            paddingBottom: insets.bottom + LayoutSpacing.contentPadding.bottom,
          },
        ]}
        accessibilityRole="progressbar"
        accessibilityLabel="Carregando conteúdo"
      >
        <View style={[styles.skeletonBlock, { height: 48, width: '55%' }]} />
        <View style={[styles.skeletonBlock, { height: 180 }]} />
        <View style={[styles.skeletonLine, { width: '40%' }]} />
        <View style={[styles.skeletonLine, { width: '100%' }]} />
        <View style={[styles.skeletonLine, { width: '92%' }]} />
        <View style={[styles.skeletonBlock, { height: 180, marginTop: 8 }]} />
      </View>
    );
  }

  return <View style={styles.content}>{children}</View>;
}

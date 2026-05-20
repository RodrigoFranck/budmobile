import { Pressable, View } from 'react-native';
import { ChevronLeft, X } from 'lucide-react-native';

import { useActivitiesTheme } from '@/lib/activitiesTheme';
import { useCheckInFlowStyles } from './checkInFlow.styles';

interface CheckInFlowHeaderProps {
  progress: number;
  topInset: number;
  onBack: () => void;
  onClose: () => void;
}

export function CheckInFlowHeader({ progress, topInset, onBack, onClose }: CheckInFlowHeaderProps) {
  const styles = useCheckInFlowStyles();
  const theme = useActivitiesTheme();

  return (
    <View style={[styles.header, { paddingTop: topInset + 12 }]}>
      <Pressable
        style={styles.headerButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <ChevronLeft color={theme.icon} size={20} />
      </Pressable>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, progress))}%` }]} />
      </View>

      <Pressable
        style={styles.headerButton}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar check-in"
      >
        <X color={theme.icon} size={18} />
      </Pressable>
    </View>
  );
}

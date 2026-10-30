import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type LetterHapticKind = 'light' | 'medium' | 'success';

export function playLetterHaptic(kind: LetterHapticKind): void {
  if (Platform.OS === 'web') {
    return;
  }
  void (async () => {
    try {
      if (kind === 'success') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      await Haptics.impactAsync(
        kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
      );
    } catch {
      // ignore missing haptics hardware
    }
  })();
}

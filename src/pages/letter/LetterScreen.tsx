import { useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MainTabNavigationProp } from '@/types/navigation';
import LetterCeremony, { LETTER_HOME } from './LetterCeremony';

export default function LetterScreen() {
  const navigation = useNavigation<MainTabNavigationProp>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const envelopeW = width - 40;

  return (
    <LetterCeremony
      origin={{
        x: (width - envelopeW) / 2,
        y: insets.top + 176,
        width: envelopeW,
        height: envelopeW * (LETTER_HOME.envH / LETTER_HOME.envW),
      }}
      onClose={() => navigation.goBack()}
    />
  );
}

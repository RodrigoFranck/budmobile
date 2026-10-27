import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { BudIconButton } from '@/components/v3';
import { useDailyLetter } from '@/hooks/useDailyLetter';
import { fonts, motion, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';

export default function LetterScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { letter, markOpened } = useDailyLetter();
  const open = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(open, {
      toValue: 1,
      duration: motion.letterOpenMs,
      useNativeDriver: true,
    }).start(() => {
      void markOpened();
    });
  }, [markOpened, open]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, alignItems: 'flex-end' }}>
        <BudIconButton icon={X} accessibilityLabel="Fechar" onPress={() => navigation.goBack()} />
      </View>
      <Pressable
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}
        onPress={() => navigation.navigate('LetterOpen')}
      >
        <Animated.View
          style={{
            opacity: open,
            transform: [
              {
                scale: open.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }),
              },
            ],
            alignItems: 'center',
          }}
        >
          <Image source={assets.envelopeOpen} style={{ width: 300, height: 210 }} resizeMode="contain" />
          <Image
            source={assets.envelopePaper}
            style={{ width: 260, height: 180, marginTop: -120 }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 26,
              lineHeight: 32,
              color: colors.text,
              textAlign: 'center',
              marginTop: 24,
            }}
          >
            {letter?.title ?? 'Abrindo…'}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

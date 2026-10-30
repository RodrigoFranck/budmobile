import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Menu, MessageSquare, SquareArrowOutUpRight } from 'lucide-react-native';

import { BudIconButton } from '@/components/v3';
import { useDailyLetter } from '@/hooks/useDailyLetter';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
import { fonts, motion, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import {
  formatDailyLetterPlain,
  LETTER_NOTICED_HEADING,
  LETTER_SIGNOFF,
  LETTER_TAKEAWAY_HEADING,
  parseDailyLetterBody,
} from '@/utils/dailyLetter';
import { getNowInBrasilia, getWeekStartBrasilia } from '@/utils/dateUtils';
import { navigateToChatTab } from '@/utils/navigateToChat';

import { playLetterHaptic } from './letterSounds';

export type LetterOrigin = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const OPEN_MS = motion.letterFlapMs + motion.letterRiseMs + motion.letterEnterMs;
const P1 = motion.letterFlapMs / OPEN_MS;
const P2 = (motion.letterFlapMs + motion.letterRiseMs) / OPEN_MS;
const GENTLE = Easing.bezier(0.25, 0.1, 0.25, 1);
const STANDARD = Easing.bezier(0.4, 0, 0.2, 1);
const ENTER = Easing.bezier(0.25, 0.1, 0.25, 1);
const EXIT = Easing.bezier(0.32, 0, 0.67, 0);
const OPEN_ASPECT = 542 / 510;
const MOUTH = 0.384;
const PAPER_WIDTH_RATIO = 0.46;
const WEEK_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const LETTER_HOME = {
  envW: 400,
  envH: 267,
  seal: 80,
  sealTop: 102,
  sealRotate: -6,
} as const;
const FIGMA = {
  frameW: 440,
  frameH: 960,
  paperW: 284,
  paperH: 300,
  paperY: 155,
  envW: LETTER_HOME.envW,
  envH: LETTER_HOME.envH,
  envY: 330,
} as const;

function splitAccentTitle(title: string) {
  const words = title.trim().split(' ');
  const last = words.pop() ?? title;
  return { lead: words.join(' '), last };
}

function weekStrip() {
  const now = getNowInBrasilia();
  const start = getWeekStartBrasilia(now);
  return WEEK_LABELS.map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      label,
      day: date.getDate(),
      active: date.getDate() === now.getDate() && date.getMonth() === now.getMonth(),
    };
  });
}

function TitleAccent({
  lead,
  last,
  style,
  lastStyle,
}: {
  lead: string;
  last: string;
  style: StyleProp<TextStyle>;
  lastStyle: StyleProp<TextStyle>;
}) {
  return (
    <Text style={style}>
      {lead ? `${lead} ` : ''}
      <Text style={lastStyle}>{last}</Text>
    </Text>
  );
}

type LetterCeremonyProps = {
  origin: LetterOrigin;
  onClose: () => void;
};

export default function LetterCeremony({ origin, onClose }: LetterCeremonyProps) {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const { letter, available, loading: letterLoading, markOpened } = useDailyLetter();
  const { g } = useGenderedCopy();
  const days = useMemo(() => weekStrip(), []);
  const title = g(letter?.title ?? 'O que ficou de ontem?');
  const { lead, last } = splitAccentTitle(title);
  const sections = useMemo(() => parseDailyLetterBody(letter?.body), [letter?.body]);
  const opening = g(sections.opening);
  const noticed = g(sections.noticed);
  const takeaway = g(sections.takeaway);
  const shareText = useMemo(
    () => formatDailyLetterPlain(title, { opening, noticed, takeaway }),
    [noticed, opening, takeaway, title],
  );
  const lastStyle = { fontFamily: fonts.displayItalic, color: colors.accent };

  const progress = useSharedValue(0);
  const closing = useSharedValue(0);
  const flapCued = useSharedValue(0);
  const riseCued = useSharedValue(0);
  const openedCued = useSharedValue(0);
  const finishedRef = useRef(false);
  const openingStartedRef = useRef(false);
  const [opened, setOpened] = useState(false);

  const ox = origin.x;
  const oy = origin.y;
  const ow = Math.max(origin.width, 200);
  const oh = Math.max(origin.height, 130);
  const sx = screenW / FIGMA.frameW;
  const sy = screenH / FIGMA.frameH;

  const envHoldW = FIGMA.envW * sx;
  const envHoldH = envHoldW * OPEN_ASPECT;
  const envHoldX = (screenW - envHoldW) / 2;
  const envHoldY = FIGMA.envY * sy;

  const paperHoldW = envHoldW * PAPER_WIDTH_RATIO;
  const paperHoldX = (screenW - paperHoldW) / 2;
  const paper0w = ow * PAPER_WIDTH_RATIO;
  const paper0x = ox + (ow - paper0w) / 2;
  const p2EnvY = envHoldY + envHoldH * 0.18;
  const pocket0 = oy + oh * MOUTH;
  const pocketHold = envHoldY + envHoldH * MOUTH;
  const pocketP2 = p2EnvY + envHoldH * MOUTH;
  const visibleP1 = envHoldH * 0.07;
  const visibleP2 = envHoldH * 0.2;
  const clipTuck = 0.14;
  const tuck0 = oh * clipTuck;
  const tuck = envHoldH * clipTuck;
  const paperTop0 = pocket0 - visibleP1;
  const paperTopP1 = pocketHold - visibleP1;
  const paperTopP2 = pocketP2 - visibleP2;
  const paperH0 = visibleP1 + tuck0;
  const paperHP1 = visibleP1 + tuck;
  const paperHP2 = visibleP2 + tuck;
  const clip0 = oy + oh * (MOUTH + clipTuck);
  const clipP1 = envHoldY + envHoldH * (MOUTH + clipTuck);
  const clipP2 = p2EnvY + envHoldH * (MOUTH + clipTuck);
  const sealTopRatio = LETTER_HOME.sealTop / LETTER_HOME.envH;

  const finishOpen = useCallback(() => {
    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;
    setOpened(true);
    playLetterHaptic('success');
    void markOpened();
  }, [markOpened]);

  const handleClose = useCallback(() => {
    if (closing.value === 1) {
      return;
    }
    closing.value = 1;
    setOpened(false);
    const duration = Math.max(720, Math.round(Math.max(progress.value, 0.4) * motion.letterExitMs));
    progress.value = withTiming(0, { duration, easing: EXIT }, (done) => {
      if (done) {
        runOnJS(onClose)();
      }
    });
  }, [closing, onClose, progress]);

  useEffect(() => {
    if (!letterLoading && !available) {
      onClose();
    }
  }, [available, letterLoading, onClose]);

  useEffect(() => {
    if (!available || openingStartedRef.current) {
      return;
    }
    openingStartedRef.current = true;
    playLetterHaptic('light');
    progress.value = withSequence(
      withTiming(P1, { duration: motion.letterFlapMs, easing: GENTLE }),
      withTiming(P2, { duration: motion.letterRiseMs, easing: STANDARD }),
      withTiming(1, { duration: motion.letterEnterMs, easing: ENTER }),
    );
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (enabled) {
        progress.value = 1;
        finishOpen();
      }
    });
  }, [available, finishOpen, progress]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [handleClose]);

  useAnimatedReaction(
    () => progress.value,
    (value, previous) => {
      const prev = previous ?? 0;
      if (flapCued.value === 0 && value >= P1 * 0.42 && prev < P1 * 0.42) {
        flapCued.value = 1;
        runOnJS(playLetterHaptic)('medium');
      }
      if (riseCued.value === 0 && value >= P1 + 0.08 && prev < P1 + 0.08) {
        riseCued.value = 1;
        runOnJS(playLetterHaptic)('light');
      }
      if (openedCued.value === 0 && value >= 0.98 && prev < 0.98) {
        openedCued.value = 1;
        runOnJS(finishOpen)();
      }
    },
  );

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, P1, P2], [0, 0.88, 1], Extrapolation.CLAMP),
  }));

  const envelopeStyle = useAnimatedStyle(() => ({
    left: interpolate(progress.value, [0, P1], [ox, envHoldX], Extrapolation.CLAMP),
    top: interpolate(progress.value, [0, P1, P2, 1], [oy, envHoldY, p2EnvY, screenH + 36], Extrapolation.CLAMP),
    width: interpolate(progress.value, [0, P1], [ow, envHoldW], Extrapolation.CLAMP),
    height: interpolate(progress.value, [0, P1], [oh, envHoldH], Extrapolation.CLAMP),
    opacity: interpolate(progress.value, [0.86, 1], [1, 0], Extrapolation.CLAMP),
  }));

  const closedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [P1 * 0.2, P1 * 0.85], [1, 0], Extrapolation.CLAMP),
  }));

  const openStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [P1 * 0.15, P1 * 0.75], [0, 1], Extrapolation.CLAMP),
  }));

  const envelopeFrontStyle = useAnimatedStyle(() => {
    const envLeft = interpolate(progress.value, [0, P1], [ox, envHoldX], Extrapolation.CLAMP);
    const envTop = interpolate(progress.value, [0, P1, P2, 1], [oy, envHoldY, p2EnvY, screenH + 36], Extrapolation.CLAMP);
    const envW = interpolate(progress.value, [0, P1], [ow, envHoldW], Extrapolation.CLAMP);
    const envH = interpolate(progress.value, [0, P1], [oh, envHoldH], Extrapolation.CLAMP);
    const clipTop = envH * MOUTH;
    return {
      left: envLeft,
      top: envTop + clipTop,
      width: envW,
      height: envH - clipTop,
      opacity: interpolate(progress.value, [P1 * 0.15, P1 * 0.75, 0.86, 1], [0, 1, 1, 0], Extrapolation.CLAMP),
    };
  });

  const envelopeFrontImageStyle = useAnimatedStyle(() => {
    const envW = interpolate(progress.value, [0, P1], [ow, envHoldW], Extrapolation.CLAMP);
    const envH = interpolate(progress.value, [0, P1], [oh, envHoldH], Extrapolation.CLAMP);
    return {
      top: -envH * MOUTH,
      width: envW,
      height: envH,
    };
  });

  const sealStyle = useAnimatedStyle(() => {
    const envLeft = interpolate(progress.value, [0, P1], [ox, envHoldX], Extrapolation.CLAMP);
    const envTop = interpolate(progress.value, [0, P1, P2, 1], [oy, envHoldY, p2EnvY, screenH + 36], Extrapolation.CLAMP);
    const envW = interpolate(progress.value, [0, P1], [ow, envHoldW], Extrapolation.CLAMP);
    const envH = interpolate(progress.value, [0, P1], [oh, envHoldH], Extrapolation.CLAMP);
    const size = envW * (LETTER_HOME.seal / LETTER_HOME.envW);
    const tilt = interpolate(progress.value, [0, P1], [LETTER_HOME.sealRotate, 8], Extrapolation.CLAMP);
    const ratio = interpolate(progress.value, [0, P1], [sealTopRatio, 0.545], Extrapolation.CLAMP);
    return {
      left: envLeft + (envW - size) / 2,
      top: envTop + envH * ratio,
      width: size,
      height: size,
      opacity: interpolate(progress.value, [0.72, 0.92], [1, 0], Extrapolation.CLAMP),
      transform: [{ rotate: `${tilt}deg` }],
    };
  });

  const paperClipStyle = useAnimatedStyle(() => ({
    left: interpolate(progress.value, [0, P1, P2, 1], [paper0x, paperHoldX, paperHoldX, 0], Extrapolation.CLAMP),
    width: interpolate(progress.value, [0, P1, P2, 1], [paper0w, paperHoldW, paperHoldW, screenW], Extrapolation.CLAMP),
    height: interpolate(progress.value, [0, P1, P2, 1], [clip0, clipP1, clipP2, screenH], Extrapolation.CLAMP),
  }));

  const paperStyle = useAnimatedStyle(() => {
    const tilt = interpolate(progress.value, [0, P1, P2, 1], [0, -2, -3, 0], Extrapolation.CLAMP);
    return {
      top: interpolate(progress.value, [0, P1, P2, 1], [paperTop0, paperTopP1, paperTopP2, 0], Extrapolation.CLAMP),
      height: interpolate(progress.value, [0, P1, P2, 1], [paperH0, paperHP1, paperHP2, screenH], Extrapolation.CLAMP),
      borderRadius: interpolate(progress.value, [P2, 1], [2, 0], Extrapolation.CLAMP),
      opacity: interpolate(progress.value, [P1 * 0.55, P1], [0, 1], Extrapolation.CLAMP),
      transform: [{ rotate: `${tilt}deg` }],
    };
  });

  const peekCopyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [P1 + 0.04, P2, 0.82], [0, 1, 0], Extrapolation.CLAMP),
  }));

  const readingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.8, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const openingHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.72, 0.9], [1, 0], Extrapolation.CLAMP),
  }));

  const readingHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.82, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const shareLetter = useCallback(() => {
    void Share.share({ message: shareText });
  }, [shareText]);

  const openChat = useCallback(() => {
    navigateToChatTab(navigation, {
      chatInsight: {
        insightType: 'yesterday_journey',
        title,
        contextSummary: opening,
        internalContext: shareText,
        cardDescription: opening,
        backgroundType: 'yesterday',
      },
    });
  }, [navigation, opening, shareText, title]);

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }, scrimStyle]}
      />

      <Animated.View pointerEvents="none" style={[styles.envelope, envelopeStyle]}>
        <Animated.Image
          source={assets.envelopeClosed}
          style={[styles.fill, closedStyle]}
          resizeMode="contain"
        />
        <Animated.Image
          source={assets.envelopeOpen}
          style={[styles.fill, openStyle]}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View pointerEvents="none" style={[styles.paperClip, paperClipStyle]}>
        <Animated.View style={[styles.paper, paperStyle]}>
          <Image source={assets.envelopePaper} style={styles.fill} resizeMode="cover" />
          <Animated.View style={[styles.peekCopy, peekCopyStyle]}>
            <TitleAccent
              lead={lead}
              last={last}
              style={[styles.peekTitle, { color: colors.text }]}
              lastStyle={lastStyle}
            />
            <View style={[styles.peekRule, { backgroundColor: colors.line }]} />
            <View style={[styles.peekRuleShort, { backgroundColor: colors.line }]} />
          </Animated.View>
        </Animated.View>
      </Animated.View>

      <Animated.View
        collapsable={false}
        pointerEvents="none"
        style={[styles.envelopeFront, envelopeFrontStyle]}
      >
        <Animated.Image
          source={assets.envelopeOpen}
          style={[styles.envelopeFrontImage, envelopeFrontImageStyle]}
          resizeMode="stretch"
        />
      </Animated.View>

      <Animated.Image
        pointerEvents="none"
        source={assets.waxSeal}
        style={[styles.seal, sealStyle]}
        resizeMode="contain"
      />

      <Animated.View pointerEvents={opened ? 'auto' : 'none'} style={[styles.reading, readingStyle]}>
        <View style={{ flex: 1, paddingTop: insets.top + 4 }}>
          <View style={styles.headerSpace} />
          <View style={styles.weekRow}>
            {days.map((item) => (
              <View key={item.label} style={styles.weekCell}>
                <Text style={[styles.weekLabel, { color: item.active ? colors.accent : colors.text3 }]}>
                  {item.label}
                </Text>
                <Text style={[styles.weekDay, { color: item.active ? colors.accent : colors.text2 }]}>
                  {item.day}
                </Text>
              </View>
            ))}
          </View>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 28,
              paddingTop: 44,
              paddingBottom: insets.bottom + 108,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.eyebrow, { color: colors.text3 }]}>Carta de hoje</Text>
            <TitleAccent
              lead={lead}
              last={last}
              style={[styles.readingTitle, { color: colors.text }]}
              lastStyle={lastStyle}
            />
            {opening ? (
              <Text style={[styles.body, { color: colors.text2 }]}>{opening}</Text>
            ) : null}
            {noticed ? (
              <>
                <View style={styles.noticedHeading}>
                  <Image
                    pointerEvents="none"
                    source={assets.letterUnderline}
                    style={styles.noticedUnderline}
                    resizeMode="contain"
                  />
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>
                    {LETTER_NOTICED_HEADING}
                  </Text>
                </View>
                <Text style={[styles.sectionBody, { color: colors.text2 }]}>{noticed}</Text>
              </>
            ) : null}
            {takeaway ? (
              <>
                <Text style={[styles.takeawayHeading, { color: colors.text }]}>
                  {LETTER_TAKEAWAY_HEADING}
                </Text>
                <Text style={[styles.sectionBody, { color: colors.text2 }]}>{takeaway}</Text>
              </>
            ) : null}
            <Text style={[styles.signoff, { color: colors.text2 }]}>{LETTER_SIGNOFF}</Text>
          </ScrollView>
        </View>
        <View
          pointerEvents="box-none"
          style={[styles.talkWrap, { bottom: insets.bottom + 24 }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Conversar sobre isso"
            onPress={openChat}
            style={[styles.talkButton, { backgroundColor: colors.accent, shadowColor: colors.scrim }]}
          >
            <MessageSquare color={colors.onAccent} size={22} />
            <Text style={[styles.talkLabel, { color: colors.onAccent }]}>Conversar sobre isso</Text>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents={opened ? 'none' : 'auto'}
        style={[styles.header, { top: insets.top + 4 }, openingHeaderStyle]}
      >
        <BudIconButton icon={Menu} accessibilityLabel="Menu" onPress={() => navigation.navigate('Menu')} />
        <View style={styles.headerSpacer} />
      </Animated.View>

      <Animated.View
        pointerEvents={opened ? 'auto' : 'none'}
        style={[styles.header, { top: insets.top + 4 }, readingHeaderStyle]}
      >
        <BudIconButton icon={ChevronLeft} accessibilityLabel="Guardar carta" onPress={handleClose} />
        <BudIconButton icon={SquareArrowOutUpRight} accessibilityLabel="Compartilhar" onPress={shareLetter} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    elevation: 40,
  },
  header: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 50,
  },
  headerSpace: {
    height: 56,
  },
  headerSpacer: {
    width: 48,
    height: 48,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  envelope: {
    position: 'absolute',
    zIndex: 2,
    elevation: 2,
  },
  paperClip: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderRadius: 0.5,
    zIndex: 3,
    elevation: 3,
  },
  paper: {
    position: 'absolute',
    left: 0,
    width: '100%',
    overflow: 'hidden',
  },
  envelopeFront: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderRadius: 0.5,
    zIndex: 4,
    elevation: 4,
  },
  envelopeFrontImage: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  seal: {
    position: 'absolute',
    zIndex: 5,
    elevation: 5,
  },
  peekCopy: {
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  peekTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  peekRule: {
    height: 6,
    width: 218,
    borderRadius: 3,
    marginTop: 18,
  },
  peekRuleShort: {
    height: 6,
    width: 188,
    borderRadius: 3,
    marginTop: 12,
  },
  reading: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 6,
    elevation: 6,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 20,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 13,
    textAlign: 'center',
  },
  weekDay: {
    fontFamily: fonts.sansMedium,
    fontSize: 19,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  eyebrow: {
    fontFamily: fonts.sansSemi,
    fontSize: 11.5,
    lineHeight: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  readingTitle: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
    marginTop: 14,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 22,
  },
  noticedHeading: {
    marginTop: 28,
    paddingBottom: 16,
    overflow: 'visible',
  },
  noticedUnderline: {
    position: 'absolute',
    left: -6,
    top: 16,
    width: 190,
    height: 26,
  },
  sectionHeading: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  takeawayHeading: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
    marginTop: 28,
  },
  sectionBody: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 16,
  },
  signoff: {
    fontFamily: fonts.displayItalic,
    fontSize: 20,
    letterSpacing: -0.4,
    marginTop: 26,
  },
  talkWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  talkButton: {
    height: 56,
    borderRadius: 28,
    paddingLeft: 20,
    paddingRight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  talkLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 18,
    lineHeight: 18,
  },
});

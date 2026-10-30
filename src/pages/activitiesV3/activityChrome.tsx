import type { ReactNode } from 'react';
import { useEffect } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ArrowUp, ChevronLeft, MessageSquare, Mic, ThumbsDown, ThumbsUp, X } from 'lucide-react-native';

import { BudButton, BudIconButton } from '@/components/v3';
import { activityEasing, activityMotion } from '@/pages/activitiesV3/activityMotion';
import { activityColors, fonts, useV3Colors, type V3Colors } from '@/theme';
import type { ActivityIntroCopy } from '@/pages/activitiesV3/activityFlows';

const HERO_H = 330;
const GIZ = 180;

export function ActivityClockIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M19.25 11C19.25 15.5563 15.5563 19.25 11 19.25C6.44365 19.25 2.75 15.5563 2.75 11C2.75 6.44365 6.44365 2.75 11 2.75C15.5563 2.75 19.25 6.44365 19.25 11Z"
        stroke={color}
        strokeWidth={1.55833}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11 6.41667V11L13.75 12.8333"
        stroke={color}
        strokeWidth={1.55833}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ActivityLeafIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M4.58333 17.4167C4.58333 10.0833 9.16667 4.58333 17.4167 4.58333C17.4167 12.8333 11.9167 17.4167 4.58333 17.4167Z"
        stroke={color}
        strokeWidth={1.55833}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.58333 17.4167L11.9167 10.0833"
        stroke={color}
        strokeWidth={1.55833}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AccentTitle({
  before,
  accent,
  after,
  color,
  accentColor,
  fontSize = 34,
  lineHeight = 40,
}: {
  before?: string;
  accent: string;
  after?: string;
  color: string;
  accentColor: string;
  fontSize?: number;
  lineHeight?: number;
}) {
  return (
    <Text style={[styles.displayTitle, { fontSize, lineHeight }]}>
      {before ? <Text style={{ color }}>{before}</Text> : null}
      <Text style={{ color: accentColor, fontFamily: fonts.displayItalic }}>{accent}</Text>
      {after ? <Text style={{ color }}>{after}</Text> : null}
    </Text>
  );
}

export function ActivityIntro({
  copy,
  mist,
  giz,
  onBack,
  onStart,
}: {
  copy: ActivityIntroCopy;
  mist: ImageSourcePropType;
  giz: ImageSourcePropType;
  onBack: () => void;
  onStart: () => void;
}) {
  const colors = useV3Colors();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
      >
        <View style={styles.hero}>
          <Image source={mist} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={styles.heroGizWrap} pointerEvents="none">
            <Image source={giz} style={styles.heroGiz} resizeMode="contain" />
          </View>
          <View style={[styles.heroBack, { top: insets.top + 4 }]}>
            <BudIconButton
              icon={ChevronLeft}
              tone="scrim"
              accessibilityLabel="Voltar"
              onPress={onBack}
            />
          </View>
        </View>

        <View style={styles.introBody}>
          <AccentTitle
            before={copy.titleBefore}
            accent={copy.titleAccent}
            after={copy.titleAfter}
            color={colors.text}
            accentColor={colors.accent}
          />
          <View style={styles.metaRow}>
            <ActivityClockIcon color={colors.text2} />
            <Text style={[styles.metaText, { color: colors.text2 }]}>{copy.duration}</Text>
            <Text style={[styles.metaDot, { color: colors.text3 }]}>·</Text>
            <ActivityLeafIcon color={colors.text2} />
            <Text style={[styles.metaText, { color: colors.text2 }]}>{copy.category}</Text>
          </View>
          <Text style={[styles.body, { color: colors.text2, paddingTop: 18 }]}>{copy.lead}</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Como funciona</Text>
          <Text style={[styles.body, { color: colors.text2, paddingTop: 10 }]}>{copy.how}</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Por que funciona</Text>
          <Text style={[styles.body, { color: colors.text2, paddingTop: 10 }]}>{copy.why}</Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.bg, paddingBottom: Math.max(insets.bottom, 16) + 16 },
        ]}
      >
        <BudButton label="Começar" onPress={onStart} />
      </View>
    </View>
  );
}

export function ActivityFlowHeader({
  title,
  onBack,
  onClose,
  progress,
  closeOnLeft,
}: {
  title?: string;
  onBack?: () => void;
  onClose: () => void;
  progress?: number;
  closeOnLeft?: boolean;
}) {
  const colors = useV3Colors();
  const insets = useSafeAreaInsets();
  const clamped = Math.max(0.02, Math.min(1, progress ?? 0));
  const fill = useSharedValue(clamped);

  useEffect(() => {
    if (progress === undefined) return;
    fill.value = withTiming(Math.max(0.02, Math.min(1, progress)), {
      duration: activityMotion.nextMs,
      easing: activityEasing.standard,
    });
  }, [fill, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  return (
    <View style={{ paddingTop: insets.top }}>
      <View style={styles.flowHeader}>
        {closeOnLeft ? (
          <BudIconButton icon={X} accessibilityLabel="Fechar" onPress={onClose} />
        ) : onBack ? (
          <BudIconButton icon={ChevronLeft} accessibilityLabel="Voltar" onPress={onBack} />
        ) : (
          <View style={styles.headerSpacer} />
        )}
        {title ? (
          <Text style={[styles.flowTitle, { color: colors.text }]}>{title}</Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {closeOnLeft ? (
          <View style={styles.headerSpacer} />
        ) : (
          <BudIconButton icon={X} accessibilityLabel="Fechar" onPress={onClose} />
        )}
      </View>
      {progress !== undefined ? (
        <View style={[styles.progressTrack, { backgroundColor: colors.surface2 }]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: activityColors.ardosia },
              fillStyle,
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

export function ActivityOptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const colors = useV3Colors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      style={[
        styles.optionRow,
        {
          borderColor: selected ? activityColors.ardosia : colors.line,
          backgroundColor: selected ? colors.surface : 'transparent',
        },
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 16,
          lineHeight: 22,
          color: selected ? activityColors.ardosia : colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ActivityComposer({
  value,
  onChangeText,
  onSend,
  placeholder = 'Escreva aqui…',
  disabled,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const colors = useV3Colors();
  const canSend = Boolean(value.trim()) && !disabled;
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 12) }}>
      <View style={[styles.composer, { backgroundColor: colors.surface2 }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text3}
          editable={!disabled}
          multiline
          style={[styles.composerInput, { color: colors.text }]}
        />
        <Mic color={colors.text2} size={22} />
        <TouchableOpacity
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Enviar"
          style={[styles.send, { backgroundColor: canSend ? colors.accent : colors.line }]}
        >
          <ArrowUp color={canSend ? colors.onAccent : colors.text3} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ActivityKicker({
  label,
  align = 'center',
}: {
  label: string;
  align?: 'center' | 'left';
}) {
  const colors = useV3Colors();
  return (
    <Text style={[styles.kicker, { color: colors.text3, textAlign: align }]}>{label}</Text>
  );
}

export function ActivityPrompt({
  children,
  align = 'center',
}: {
  children: string;
  align?: 'center' | 'left';
}) {
  const colors = useV3Colors();
  return (
    <Text
      style={[
        styles.prompt,
        { color: colors.text, textAlign: align },
      ]}
    >
      {children}
    </Text>
  );
}

export function Glow({ color, style }: { color: string; style?: object }) {
  return <View pointerEvents="none" style={[styles.glow, { backgroundColor: color }, style]} />;
}

export function LayerGlow({
  color,
  top,
  id,
  size = 420,
  opacity = 0.28,
}: {
  color: string;
  top: number;
  id: string;
  size?: number;
  opacity?: number;
}) {
  const radius = size / 2;
  return (
    <View pointerEvents="none" style={[styles.layerGlow, { top, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx={radius} cy={radius} r={radius} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="0.7" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} rx={radius} fill={`url(#${id})`} opacity={opacity} />
      </Svg>
    </View>
  );
}

export function PreviousAnswerCard({
  question,
  answer,
  compact,
}: {
  question: string;
  answer: string;
  compact?: boolean;
}) {
  const colors = useV3Colors();
  return (
    <View
      style={[
        styles.answerCard,
        { backgroundColor: colors.surface, paddingVertical: compact ? 14 : 16 },
      ]}
    >
      <Text style={[styles.answerCardQuestion, { color: colors.text3 }]}>{question}</Text>
      <Text style={[styles.answerCardAnswer, { color: colors.text }]}>{answer}</Text>
    </View>
  );
}

export function ActivityResult({
  mist,
  giz,
  insight,
  body,
  sectionLabel,
  children,
  followUps,
  onBack,
  onTalk,
  talking,
}: {
  mist: ImageSourcePropType;
  giz: ImageSourcePropType;
  insight: string;
  body: string;
  sectionLabel: string;
  children: ReactNode;
  followUps: string[];
  onBack: () => void | Promise<void>;
  onTalk: (prompt: string) => void;
  talking?: boolean;
}) {
  const colors = useV3Colors();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={mist} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={styles.heroGizWrap} pointerEvents="none">
            <Image source={giz} style={styles.heroGiz} resizeMode="contain" />
          </View>
          <View style={[styles.heroBack, { top: insets.top + 4 }]}>
            <BudIconButton icon={ChevronLeft} tone="scrim" accessibilityLabel="Voltar" onPress={onBack} />
          </View>
        </View>

        <View style={styles.introBody}>
          <Text style={[styles.insight, { color: colors.text }]}>{insight}</Text>
          <Text style={[styles.body, { color: colors.text, paddingTop: 18 }]}>{body}</Text>
          <Text style={[styles.kicker, { color: colors.text3, textAlign: 'left', paddingTop: 38 }]}>
            {sectionLabel}
          </Text>
          {children}
          <View style={{ paddingTop: 40 }}>
            <AccentTitle
              before="Quer ir mais "
              accent="fundo"
              after="?"
              color={colors.text}
              accentColor={colors.accent}
              fontSize={26}
              lineHeight={32}
            />
          </View>
          {followUps.map((prompt) => (
            <Pressable
              key={prompt}
              onPress={() => onTalk(prompt)}
              accessibilityRole="button"
              style={[styles.followUp, { borderBottomColor: colors.line }]}
            >
              <Text style={[styles.followUpText, { color: colors.text }]}>{prompt}</Text>
              <View style={{ paddingTop: 2 }}>
                <MessageSquare color={colors.text2} size={22} />
              </View>
            </Pressable>
          ))}
          <View style={{ paddingTop: 34 }}>
            <BudButton
              icon={MessageSquare}
              label="Conversar sobre isso"
              loading={talking}
              onPress={() => onTalk(followUps[0])}
            />
          </View>
        </View>
        <View
          style={[
            styles.rateFooter,
            { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 28) },
          ]}
        >
          <Text style={[styles.kicker, { color: colors.text3 }]}>O que achou desta atividade?</Text>
          <View style={styles.rateRow}>
            <BudIconButton icon={ThumbsDown} accessibilityLabel="Não gostei" onPress={onBack} />
            <BudIconButton icon={X} accessibilityLabel="Mais ou menos" onPress={onBack} />
            <BudIconButton icon={ThumbsUp} accessibilityLabel="Gostei" onPress={onBack} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export function ResultEntry({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: V3Colors;
}) {
  return (
    <View style={{ paddingTop: 18 }}>
      <Text style={[styles.entryLabel, { color: colors.text3 }]}>{label}</Text>
      <Text style={[styles.entryValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: HERO_H,
    overflow: 'hidden',
  },
  heroGizWrap: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 85,
    alignItems: 'center',
  },
  heroGiz: {
    width: GIZ,
    height: GIZ,
  },
  heroBack: {
    position: 'absolute',
    left: 20,
  },
  introBody: {
    paddingHorizontal: 28,
    paddingTop: 26,
  },
  displayTitle: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    height: 34,
  },
  metaText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 14,
  },
  metaDot: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 14,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 25,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 17,
    lineHeight: 17,
    paddingTop: 24,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  flowHeader: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flowTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 18,
    lineHeight: 18,
  },
  headerSpacer: {
    width: 48,
    height: 48,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  optionRow: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  composer: {
    minHeight: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 22,
    paddingRight: 8,
    gap: 8,
  },
  composerInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 16,
    paddingVertical: 12,
    maxHeight: 88,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontFamily: fonts.sansSemi,
    fontSize: 11.5,
    lineHeight: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  prompt: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  glow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    opacity: 0.28,
  },
  insight: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  followUp: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  followUpText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 25,
  },
  rateFooter: {
    marginTop: 34,
    paddingTop: 28,
    paddingHorizontal: 28,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    paddingTop: 18,
  },
  entryLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  entryValue: {
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 24,
    paddingTop: 4,
  },
  layerGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    height: 420,
  },
  answerCard: {
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  answerCardQuestion: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  answerCardAnswer: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 23,
    paddingTop: 6,
  },
});

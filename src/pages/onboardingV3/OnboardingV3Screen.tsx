import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import {
  Check,
  ChevronLeft,
  Clock,
  Mail,
  MessageCircle,
  Mic,
  Plus,
  Share2,
  Sparkles,
  Volume2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BudButton, BudIconButton } from '@/components/v3';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/constants/healthSafety';
import { useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import { useOnboardingComplete } from '@/hooks/useOnboardingComplete';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useUserPlan } from '@/hooks/useUserPlan';
import {
  MOOD_STOPS,
  ONBOARDING_V3_STEPS,
  type OnboardingArt,
  type OnboardingTitle,
} from '@/pages/onboardingV3/onboardingSteps';
import { fonts, useV3Asset, useV3Colors, v3LightColors, voiceOptions, type V3ThemedAssets } from '@/theme';

const LOADING_PHRASES = ['Entendendo', 'Aprendendo', 'Preparando'] as const;

function splitList(value: string | undefined) {
  if (!value) return [] as string[];
  return value.split(' · ').filter(Boolean);
}

function joinList(values: string[]) {
  return values.join(' · ');
}

function artSource(art: OnboardingArt | undefined, assets: V3ThemedAssets) {
  if (art === 'lock') return assets.onboardingLock;
  if (art === 'leafSit') return assets.onboardingLeafSit;
  if (art === 'leafWalk') return assets.onboardingLeafWalk;
  if (art === 'mood') return assets.onboardingMood;
  if (art === 'bell') return assets.onboardingBell;
  if (art === 'waves') return assets.onboardingWaves;
  return assets.onboardingLeafStand;
}

function AccentTitle({
  title,
  color,
  accent,
  size = 34,
  lineHeight = 40,
}: {
  title: OnboardingTitle;
  color: string;
  accent: string;
  size?: number;
  lineHeight?: number;
}) {
  return (
    <Text
      style={{
        fontFamily: fonts.display,
        fontSize: size,
        lineHeight,
        letterSpacing: -0.4,
        color,
      }}
    >
      {title.before}
      <Text style={{ fontFamily: fonts.displayItalic, fontStyle: 'italic', color: accent }}>
        {title.accent}
      </Text>
      {title.after ?? ''}
    </Text>
  );
}

function SelectRow({
  label,
  selected,
  onPress,
  showMark = true,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  showMark?: boolean;
}) {
  const colors = useV3Colors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        minHeight: 60,
        borderRadius: 20,
        paddingHorizontal: 22,
        backgroundColor: selected ? colors.accent : colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: showMark ? 'space-between' : 'center',
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sansSemi,
          fontSize: 16.5,
          lineHeight: 16.5,
          color: selected ? colors.onAccent : colors.text,
          flex: showMark ? 1 : undefined,
          textAlign: showMark ? 'left' : 'center',
        }}
      >
        {label}
      </Text>
      {showMark ? (
        selected ? (
          <Check color={colors.onAccent} size={22} strokeWidth={2.4} />
        ) : (
          <Plus color={colors.text} size={22} strokeWidth={2} opacity={0.7} />
        )
      ) : null}
    </Pressable>
  );
}

function BudToggle({ value, onValueChange }: { value: boolean; onValueChange: (next: boolean) => void }) {
  const colors = useV3Colors();
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={{
        width: 52,
        height: 32,
        borderRadius: 16,
        backgroundColor: value ? colors.accent : colors.line,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: value ? colors.onAccent : colors.surface,
          marginLeft: value ? 23 : 3,
        }}
      />
    </Pressable>
  );
}

export default function OnboardingV3Screen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const flow = useOnboardingFlow();
  const { completeOnboarding, submitting } = useOnboardingComplete();
  const { startCheckout } = useUserPlan();
  const { setNotificationsEnabled } = useNotificationPreferences();
  const [index, setIndex] = useState(0);
  const [skipDeep, setSkipDeep] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [planInterval, setPlanInterval] = useState<'annual' | 'monthly'>('annual');
  const [moodIndex, setMoodIndex] = useState(0);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [loadingTick, setLoadingTick] = useState(0);
  const [selectedMany, setSelectedMany] = useState<string[]>([]);
  const sliderWidth = useRef(300);
  const indexRef = useRef(0);
  indexRef.current = index;

  const visibleIndexes = useMemo(
    () =>
      ONBOARDING_V3_STEPS.map((_, stepIndex) => stepIndex).filter((stepIndex) => {
        if (skipDeep && ONBOARDING_V3_STEPS[stepIndex].group === 'deep') return false;
        return true;
      }),
    [skipDeep],
  );

  const step = ONBOARDING_V3_STEPS[index];
  const visiblePos = Math.max(0, visibleIndexes.indexOf(index));

  const currentValue = useMemo(() => {
    if (!step.field) return '';
    if (step.field === 'displayName') return flow.displayName;
    if (step.field === 'ageRange') return flow.ageRange ?? '30 a 34';
    return flow.answers[step.field] ?? '';
  }, [flow.answers, flow.ageRange, flow.displayName, step.field]);

  useEffect(() => {
    if (step.layout === 'multiSelect') {
      setSelectedMany(splitList(currentValue));
    }
    if (step.layout === 'mood') {
      const found = MOOD_STOPS.findIndex((item) => item.label === currentValue);
      setMoodIndex(found >= 0 ? found : 0);
    }
    if (step.layout === 'voice') {
      const found = voiceOptions.findIndex((item) => item.id === currentValue);
      setVoiceIndex(found >= 0 ? found : 0);
    }
    if (step.layout === 'ageWheel' && !flow.ageRange) {
      flow.setAgeRange('30 a 34');
    }
  }, [currentValue, flow.ageRange, flow.setAgeRange, step.key, step.layout]);

  const setValue = (value: string) => {
    if (step.field === 'displayName') {
      flow.setDisplayName(value);
      return;
    }
    if (step.field === 'ageRange') {
      flow.setAgeRange(value as typeof flow.ageRange);
      return;
    }
    if (step.field) {
      flow.setAnswer(step.field, value);
    }
  };

  const goToVisible = (from: number, direction: 1 | -1) => {
    const pos = visibleIndexes.indexOf(from);
    const nextPos = pos + direction;
    if (nextPos < 0 || nextPos >= visibleIndexes.length) return;
    setIndex(visibleIndexes[nextPos]);
  };

  const persistStep = () => {
    if (step.layout === 'multiSelect' && step.field) {
      flow.setAnswer(step.field, joinList(selectedMany));
    }
    if (step.layout === 'mood') {
      flow.setAnswer('mood', MOOD_STOPS[moodIndex].label);
    }
    if (step.layout === 'voice') {
      flow.setAnswer('voice', voiceOptions[voiceIndex].id);
    }
    if (step.layout === 'ageWheel' && !flow.ageRange) {
      flow.setAgeRange('30 a 34');
    }
  };

  const finishOnboarding = async () => {
    persistStep();
    if (!flow.conversationGoal && flow.answers.focus) {
      flow.setConversationGoal(flow.answers.focus);
    }
    if (!flow.initialThoughts && (flow.answers.mood || flow.answers.anythingElse)) {
      flow.setInitialThoughts(flow.answers.anythingElse || flow.answers.mood);
    }
    await completeOnboarding();
  };

  const goNext = async () => {
    persistStep();
    if (step.layout === 'paywall') {
      await startCheckout(planInterval);
      await finishOnboarding();
      return;
    }
    if (index === visibleIndexes[visibleIndexes.length - 1]) {
      await finishOnboarding();
      return;
    }
    goToVisible(index, 1);
  };

  const skipAprofundar = () => {
    setSkipDeep(true);
    const quase = ONBOARDING_V3_STEPS.findIndex((item) => item.key === 'quase');
    setIndex(quase);
  };

  useEffect(() => {
    if (step.layout !== 'loading') {
      setLoadingTick(0);
      return;
    }
    setLoadingTick(0);
    const timers = [
      setTimeout(() => setLoadingTick(1), 900),
      setTimeout(() => setLoadingTick(2), 1800),
      setTimeout(() => goToVisible(indexRef.current, 1), 2700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step.key, step.layout]);

  const toggleMany = (option: string) => {
    setSelectedMany((current) => {
      if (current.includes(option)) {
        return current.filter((item) => item !== option);
      }
      if (step.maxSelect && current.length >= step.maxSelect) {
        return current;
      }
      return [...current, option];
    });
  };

  const sliderResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const x = Math.max(0, Math.min(sliderWidth.current, event.nativeEvent.locationX));
          setMoodIndex(Math.round((x / sliderWidth.current) * 4));
        },
        onPanResponderMove: (event) => {
          const x = Math.max(0, Math.min(sliderWidth.current, event.nativeEvent.locationX));
          setMoodIndex(Math.round((x / sliderWidth.current) * 4));
        },
      }),
    [],
  );

  const handleCta = async () => {
    if (step.layout === 'notify') {
      try {
        await setNotificationsEnabled(true);
      } catch {
        // permission denied still continues
      }
      flow.setAnswer('notifications', 'Sim');
    }
    if (step.layout === 'microphone') {
      try {
        await Audio.requestPermissionsAsync();
      } catch {
        // ignore
      }
      flow.setAnswer('microphone', 'Sim');
    }
    await goNext();
  };

  const showBack = visiblePos > 0 && step.layout !== 'loading' && step.layout !== 'ready';
  const showSkip = Boolean(step.skippable) && step.layout !== 'ready' && step.layout !== 'paywall';
  const ctaDisabled =
    (step.layout === 'multiSelect' && selectedMany.length === 0) ||
    (step.layout === 'text' && !currentValue.trim());

  const misted = step.layout === 'mistHero' || step.layout === 'deepen' || step.layout === 'loading';
  const mistOpacity = step.layout === 'loading' ? 0.7 : step.layout === 'deepen' ? 0.4 : 0.55;

  const renderBody = () => {
    if (step.layout === 'commitment') {
      return (
        <>
          <View style={styles.flexCenter}>
            <Image source={artSource(step.art, assets)} style={styles.lock} resizeMode="contain" />
          </View>
          <Pressable
            onPress={() => flow.setShareConversations(!flow.shareConversations)}
            style={[styles.toggleCard, { backgroundColor: colors.surface }]}
          >
            <BudToggle value={flow.shareConversations} onValueChange={flow.setShareConversations} />
            <Text style={[styles.toggleCopy, { color: colors.text }]}>
              Ajudar a melhorar o Bud compartilhando minhas conversas de forma anônima.
            </Text>
          </Pressable>
        </>
      );
    }

    if (step.layout === 'mistHero') {
      const sit = step.art === 'leafSit';
      return (
        <View style={styles.flex}>
          <Image
            source={artSource(step.art, assets)}
            style={sit ? styles.leafSit : styles.leafStand}
            resizeMode="contain"
          />
        </View>
      );
    }

    if (step.layout === 'ready') {
      return (
        <View style={styles.flexCenter}>
          <Image source={artSource(step.art, assets)} style={styles.leafWalk} resizeMode="contain" />
        </View>
      );
    }

    if (step.layout === 'deepen') {
      return (
        <View style={styles.flex}>
          <View style={[styles.timeChip, { backgroundColor: colors.surface2 }]}>
            <Clock color={colors.text} size={22} />
            <Text style={[styles.timeChipText, { color: colors.text }]}>Cerca de 4 minutos</Text>
          </View>
          <View style={styles.benefitList}>
            {[
              { Icon: MessageCircle, text: 'Conversas mais certeiras desde o primeiro dia' },
              { Icon: Mail, text: 'Cartas do dia com a sua cara' },
              { Icon: Share2, text: 'Dá para mudar tudo depois em Preferências' },
            ].map((item) => (
              <View key={item.text} style={styles.benefitRow}>
                <item.Icon color={colors.text} size={22} />
                <Text style={[styles.benefitText, { color: colors.text }]}>{item.text}</Text>
              </View>
            ))}
          </View>
          <Image source={artSource(step.art, assets)} style={styles.leafSit} resizeMode="contain" />
        </View>
      );
    }

    if (step.layout === 'text') {
      return (
        <View style={styles.nameBlock}>
          <TextInput
            value={currentValue}
            onChangeText={setValue}
            placeholder={step.placeholder}
            placeholderTextColor={colors.text3}
            autoFocus
            style={[styles.nameInput, { color: colors.text }]}
          />
          <View style={[styles.nameUnderline, { backgroundColor: colors.accent }]} />
        </View>
      );
    }

    if (step.layout === 'anythingElse') {
      return (
        <View style={styles.anythingBlock}>
          <TextInput
            value={currentValue}
            onChangeText={setValue}
            placeholder={step.placeholder}
            placeholderTextColor={colors.text3}
            multiline
            style={[styles.anythingInput, { color: colors.text }]}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.promptRow}
            contentContainerStyle={styles.promptContent}
          >
            {(step.prompts ?? []).map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => setValue(currentValue ? `${currentValue} ${prompt}` : prompt)}
                style={[styles.promptChip, { backgroundColor: colors.surface2 }]}
              >
                <Text style={[styles.promptChipText, { color: colors.text }]}>{prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      );
    }

    if (step.layout === 'ageWheel') {
      const selected = currentValue;
      const selectedIndex = Math.max(0, (step.options ?? []).indexOf(selected));
      return (
        <ScrollView style={styles.ageList} contentContainerStyle={styles.ageContent} showsVerticalScrollIndicator={false}>
          {(step.options ?? []).map((option, optionIndex) => {
            const isSelected = option === selected;
            const faded = Math.abs(optionIndex - selectedIndex) >= 3;
            return (
              <Pressable
                key={option}
                onPress={() => setValue(option)}
                style={[
                  styles.ageRow,
                  isSelected ? { backgroundColor: colors.surface } : null,
                  faded ? { opacity: 0.5 } : null,
                ]}
              >
                <Text
                  style={{
                    fontFamily: fonts.sansSemi,
                    fontSize: isSelected ? 22 : 18,
                    lineHeight: isSelected ? 22 : 18,
                    color: isSelected ? colors.text : colors.text3,
                  }}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      );
    }

    if (step.layout === 'choiceAdvance') {
      return (
        <ScrollView
          style={styles.choiceList}
          contentContainerStyle={styles.choiceContent}
          showsVerticalScrollIndicator={false}
        >
          {(step.options ?? []).map((option) => (
            <SelectRow
              key={option}
              label={option}
              selected={false}
              showMark={false}
              onPress={() => {
                setValue(option);
                setTimeout(() => goToVisible(index, 1), 40);
              }}
            />
          ))}
        </ScrollView>
      );
    }

    if (step.layout === 'multiSelect') {
      return (
        <ScrollView
          style={styles.choiceListTight}
          contentContainerStyle={styles.choiceContent}
          showsVerticalScrollIndicator={false}
        >
          {(step.options ?? []).map((option) => (
            <SelectRow
              key={option}
              label={option}
              selected={selectedMany.includes(option)}
              onPress={() => toggleMany(option)}
            />
          ))}
        </ScrollView>
      );
    }

    if (step.layout === 'mood') {
      const stop = MOOD_STOPS[moodIndex];
      const knobLeft = (moodIndex / 4) * 300 - 26;
      return (
        <View style={styles.moodBody}>
          <Image source={assets.onboardingMood} style={styles.moodArt} resizeMode="contain" />
          <Text style={[styles.moodLabel, { color: colors.text }]}>{stop.label}</Text>
          <View
            {...sliderResponder.panHandlers}
            onLayout={(event) => {
              sliderWidth.current = event.nativeEvent.layout.width;
            }}
            style={styles.slider}
          >
            <View style={[styles.sliderTrack, { backgroundColor: colors.text }]} />
            {[0, 1, 2, 3, 4].map((tick) => (
              <View
                key={tick}
                style={[styles.sliderTick, { left: (tick / 4) * 300 - 1, backgroundColor: colors.text }]}
              />
            ))}
            <View style={[styles.sliderKnob, { left: knobLeft, backgroundColor: colors.accent }]} />
          </View>
        </View>
      );
    }

    if (step.layout === 'voice') {
      const voice = voiceOptions[voiceIndex];
      return (
        <View style={styles.flex}>
          <View style={styles.voiceRow}>
            <Pressable
              onPress={() => setVoiceIndex((current) => (current + 1) % voiceOptions.length)}
              style={[styles.voicePortrait, { backgroundColor: v3LightColors.surface }]}
            >
              <Image source={voice.image} style={styles.voiceImage} />
            </Pressable>
            <View style={styles.voiceCopy}>
              <Text style={[styles.voiceName, { color: colors.text }]}>{voice.label}</Text>
              <Text style={[styles.voiceBio, { color: colors.text2 }]}>{voice.bio}</Text>
              <View style={styles.voiceListen}>
                <Volume2 color={colors.accent} size={22} />
                <Text style={[styles.voiceListenText, { color: colors.accent }]}>Ouvir</Text>
              </View>
            </View>
          </View>
          <View style={styles.dots}>
            {voiceOptions.map((item, itemIndex) => (
              <Pressable
                key={item.id}
                onPress={() => setVoiceIndex(itemIndex)}
                style={{
                  height: 9,
                  width: itemIndex === voiceIndex ? 28 : 9,
                  borderRadius: 5,
                  backgroundColor: itemIndex === voiceIndex ? colors.text : colors.text3,
                }}
              />
            ))}
          </View>
          <Text style={[styles.voiceHint, { color: colors.text2 }]}>
            Se o celular estiver no silencioso, você não vai ouvir as vozes.
          </Text>
        </View>
      );
    }

    if (step.layout === 'notify' || step.layout === 'microphone') {
      return (
        <View
          style={[
            styles.artCard,
            {
              backgroundColor: colors.surface,
              height: step.layout === 'notify' ? 360 : 340,
            },
          ]}
        >
          <Image
            source={artSource(step.art, assets)}
            style={step.layout === 'notify' ? styles.bellArt : styles.waveArt}
            resizeMode="contain"
          />
        </View>
      );
    }

    if (step.layout === 'paywall') {
      const annual = planInterval === 'annual';
      return (
        <View style={[styles.paywallCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.planSwitch, { backgroundColor: colors.surface2 }]}>
            {(['monthly', 'annual'] as const).map((interval) => {
              const active = planInterval === interval;
              return (
                <Pressable
                  key={interval}
                  onPress={() => setPlanInterval(interval)}
                  style={[styles.planTab, active ? { backgroundColor: colors.btn } : null]}
                >
                  <Text style={[styles.planTabText, { color: active ? colors.onBtn : colors.text2 }]}>
                    {interval === 'annual' ? 'Anual · economize 36%' : 'Mensal'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.text }]}>{annual ? 'R$ 83,33' : 'R$ 129,90'}</Text>
            <Text style={[styles.priceSuffix, { color: colors.text2 }]}>/ mês</Text>
            {annual ? (
              <View style={[styles.bestBadge, { backgroundColor: colors.accent }]}>
                <Text style={[styles.bestBadgeText, { color: colors.onAccent }]}>Melhor valor</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.billedHint, { color: colors.text3 }]}>
            {annual ? 'Cobrado R$ 999,90 por ano' : 'Cobrado todo mês'}
          </Text>
          <View style={[styles.paywallRule, { backgroundColor: colors.line }]} />
          {[
            { Icon: MessageCircle, text: 'Conversas sem limite' },
            { Icon: Sparkles, text: 'Memória que liga os pontos entre as conversas' },
            { Icon: Mic, text: 'Converse por voz quando quiser' },
          ].map((item) => (
            <View key={item.text} style={styles.featureRow}>
              <item.Icon color={colors.text} size={22} />
              <Text style={[styles.featureText, { color: colors.text }]}>{item.text}</Text>
            </View>
          ))}
        </View>
      );
    }

    return <View style={styles.flex} />;
  };

  if (step.layout === 'loading') {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <Image source={assets.onboardingMist} style={[styles.mist, { opacity: 0.7 }]} resizeMode="cover" />
        <View style={styles.loadingBody}>
          <Image source={assets.onboardingLoading} style={styles.loadingArt} resizeMode="contain" />
          <Text style={[styles.loadingPhrase, { color: colors.text }]}>
            {LOADING_PHRASES[loadingTick]}
            <Text style={{ color: colors.accent }}>.</Text>
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {misted ? (
        <Image source={assets.onboardingMist} style={[styles.mist, { opacity: mistOpacity }]} resizeMode="cover" />
      ) : null}

      <View style={[styles.screen, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 8 }]}>
        {step.layout === 'ready' ? (
          <View style={styles.readyHeader} />
        ) : (
          <View style={styles.header}>
            {showBack ? (
              <BudIconButton icon={ChevronLeft} accessibilityLabel="Voltar" onPress={() => goToVisible(index, -1)} />
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
        )}

        <View style={[styles.titleBlock, step.layout === 'paywall' || step.layout === 'ready' ? { marginTop: 12 } : null]}>
          <AccentTitle title={step.title} color={colors.text} accent={colors.accent} />
          {step.subtitle ? (
            <Text
              style={[
                styles.subtitle,
                { color: colors.text2 },
                step.layout === 'paywall' ? styles.paywallSubtitle : null,
              ]}
            >
              {step.subtitle}
            </Text>
          ) : null}
        </View>

        {renderBody()}

        <View style={styles.footer}>
          {step.layout === 'paywall' ? (
            <Text style={[styles.renew, { color: colors.text2 }]}>
              Renova em{' '}
              <Text style={{ fontFamily: fonts.sansSemi, color: colors.text }}>
                {planInterval === 'annual' ? 'R$ 999,90 por ano' : 'R$ 129,90 por mês'}
              </Text>
              {' · cancele quando quiser'}
            </Text>
          ) : null}

          {step.cta ? (
            <BudButton
              label={step.cta}
              disabled={ctaDisabled}
              loading={submitting}
              onPress={() => {
                void handleCta();
              }}
            />
          ) : null}

          {step.layout === 'paywall' ? (
            <>
              <Pressable onPress={() => void finishOnboarding()} style={styles.skipHit} accessibilityRole="button">
                <Text style={[styles.skipText, { color: colors.text }]}>Agora não</Text>
              </Pressable>
              <Text style={[styles.legal, { color: colors.text3 }]}>
                Restaurar compra ·{' '}
                <Text onPress={() => void Linking.openURL(TERMS_OF_SERVICE_URL)}>Termos</Text>
                {' · '}
                <Text onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}>Privacidade</Text>
              </Text>
            </>
          ) : null}

          {showSkip ? (
            <Pressable
              onPress={() => (step.key === 'deepen' ? skipAprofundar() : setConfirmSkip(true))}
              style={styles.skipHit}
              accessibilityRole="button"
            >
              <Text style={[styles.skipText, { color: colors.text2 }]}>Pular por agora</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Modal visible={confirmSkip} transparent animationType="slide" onRequestClose={() => setConfirmSkip(false)}>
        <View style={styles.modalRoot}>
          <Pressable
            style={[styles.scrim, { backgroundColor: colors.scrim }]}
            onPress={() => setConfirmSkip(false)}
          />
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: colors.line }]} />
            </View>
            <View style={styles.sheetTitle}>
              <AccentTitle
                title={{ before: 'Tudo bem ', accent: 'pular' }}
                color={colors.text}
                accent={colors.accent}
                size={26}
                lineHeight={32}
              />
            </View>
            <Text style={[styles.sheetCopy, { color: colors.text2 }]}>
              Não tem problema. Você pode responder quando quiser em Preferências, e o Bud vai se adaptando
              enquanto vocês conversam.
            </Text>
            <BudButton label="Continuar respondendo" onPress={() => setConfirmSkip(false)} style={{ marginTop: 28 }} />
            <Pressable
              onPress={() => {
                setConfirmSkip(false);
                void finishOnboarding();
              }}
              style={styles.skipHit}
              accessibilityRole="button"
            >
              <Text style={[styles.skipText, { color: colors.text2 }]}>Pular e ir para o início</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
  mist: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  header: {
    height: 56,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  headerSpacer: { width: 48, height: 48 },
  readyHeader: { height: 20 },
  titleBlock: {
    paddingHorizontal: 28,
    marginTop: 36,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 26,
    marginTop: 16,
  },
  paywallSubtitle: {
    fontSize: 16,
    lineHeight: 25,
    marginTop: 12,
  },
  flex: { flex: 1 },
  flexCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lock: { width: 140, height: 190 },
  leafStand: {
    width: 290,
    height: 390,
    position: 'absolute',
    right: -18,
    bottom: 8,
  },
  leafSit: {
    width: 170,
    height: 230,
    position: 'absolute',
    right: 0,
    bottom: 8,
  },
  leafWalk: { width: 300, height: 400 },
  toggleCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 22,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  toggleCopy: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 21,
  },
  timeChip: {
    marginTop: 24,
    marginLeft: 28,
    alignSelf: 'flex-start',
    height: 44,
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeChipText: { fontFamily: fonts.sansSemi, fontSize: 15, lineHeight: 15 },
  benefitList: { marginLeft: 28, marginTop: 10, width: 262 },
  benefitRow: { flexDirection: 'row', gap: 14, paddingTop: 14 },
  benefitText: { flex: 1, fontFamily: fonts.sans, fontSize: 16, lineHeight: 25 },
  nameBlock: { marginTop: 78, paddingHorizontal: 28, flex: 1 },
  nameInput: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
    paddingVertical: 8,
  },
  nameUnderline: { height: 2, marginTop: 6 },
  anythingBlock: { flex: 1, paddingHorizontal: 28 },
  anythingInput: {
    marginTop: 70,
    fontFamily: fonts.sans,
    fontSize: 18,
    lineHeight: 18,
    paddingVertical: 4,
  },
  promptRow: { marginTop: 122, marginHorizontal: -4 },
  promptContent: { gap: 8, paddingRight: 28 },
  promptChip: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  promptChipText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 15 },
  ageList: { marginTop: 72, paddingHorizontal: 24, flex: 1 },
  ageContent: { gap: 2, paddingBottom: 12 },
  ageRow: {
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceList: { marginTop: 48, paddingHorizontal: 24, flex: 1 },
  choiceListTight: { marginTop: 28, paddingHorizontal: 24, flex: 1 },
  choiceContent: { gap: 10, paddingBottom: 12 },
  moodBody: { flex: 1, alignItems: 'center' },
  moodArt: { width: 260, height: 260, marginTop: 48 },
  moodLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 21,
    lineHeight: 21,
    marginTop: 40,
  },
  slider: { width: 300, height: 52, marginTop: 28, justifyContent: 'center' },
  sliderTrack: { height: 2, width: 300 },
  sliderTick: { position: 'absolute', width: 2, height: 20 },
  sliderKnob: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    opacity: 0.85,
  },
  voiceRow: { marginTop: 88, flexDirection: 'row', paddingHorizontal: 28 },
  voicePortrait: { width: 200, height: 200, borderRadius: 22, overflow: 'hidden' },
  voiceImage: { width: 200, height: 200 },
  voiceCopy: { flex: 1, marginLeft: 22, paddingTop: 8 },
  voiceName: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  voiceBio: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 25, marginTop: 8 },
  voiceListen: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  voiceListenText: { fontFamily: fonts.sansSemi, fontSize: 14, lineHeight: 14 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 80 },
  voiceHint: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 40,
  },
  artCard: {
    marginTop: 48,
    marginHorizontal: 24,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellArt: { width: 220, height: 260 },
  waveArt: { width: 280, height: 110 },
  paywallCard: {
    marginTop: 40,
    marginHorizontal: 20,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
  },
  planSwitch: { borderRadius: 28, padding: 4, flexDirection: 'row' },
  planTab: { flex: 1, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  planTabText: { fontFamily: fonts.sansSemi, fontSize: 15, lineHeight: 15 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 24 },
  price: { fontFamily: fonts.display, fontSize: 46, lineHeight: 46, letterSpacing: -0.4 },
  priceSuffix: { fontFamily: fonts.sans, fontSize: 17, marginLeft: 8, marginTop: 12 },
  bestBadge: {
    marginLeft: 'auto',
    height: 30,
    borderRadius: 20,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  bestBadgeText: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 13 },
  billedHint: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 14, marginTop: 10 },
  paywallRule: { height: 1, marginTop: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 },
  featureText: { flex: 1, fontFamily: fonts.sans, fontSize: 16, lineHeight: 22 },
  footer: { paddingHorizontal: 24, paddingTop: 8 },
  renew: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  skipHit: { alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
  skipText: { fontFamily: fonts.sansSemi, fontSize: 16, lineHeight: 16 },
  legal: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 13, textAlign: 'center', marginBottom: 8 },
  loadingBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingArt: { width: 220, height: 220 },
  loadingPhrase: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    marginTop: 120,
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, opacity: 0.55 },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  handleWrap: { alignItems: 'center' },
  handle: { width: 44, height: 5, borderRadius: 3 },
  sheetTitle: { marginTop: 26 },
  sheetCopy: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 25, marginTop: 12 },
});

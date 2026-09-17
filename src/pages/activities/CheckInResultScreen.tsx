import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUp, X } from 'lucide-react-native';

import { insightCardActionLayout } from '@/components/explore/InsightCard.styles';
import { CHECKIN_LOADING_MESSAGES } from '@/features/checkin/checkInResult.constants';
import { useCheckIns, type CheckinReport } from '@/hooks/useCheckIns';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { resolveCheckInGradient, useActivitiesTheme } from '@/lib/activitiesTheme';
import { useAppColors } from '@/lib/colors';
import type { CheckInStackParamList } from '@/types/checkInNavigation.types';
import { openCheckInChat } from '@/utils/buildCheckInChatInsight';
import { WavesIcon } from '@/voice/WavesIcon';
import { ACTION_EVENTS, logActionEvent } from '@/analytics';

import { createCheckInResultStyles } from './CheckInResult.styles';

type Route = RouteProp<CheckInStackParamList, 'CheckInResult'>;
type Nav = NativeStackNavigationProp<CheckInStackParamList, 'CheckInResult'>;

function splitParagraphs(text: string): string[] {
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

const MORNING_GRADIENT = ['rgba(245,158,11,0.2)', 'rgba(244,63,94,0.1)', '#1D1916'] as const;
const POST_TRAINING_GRADIENT = ['rgba(147,51,234,0.22)', 'rgba(59,130,246,0.1)', '#1D1916'] as const;
const POST_GAME_GRADIENT = ['rgba(120,53,15,0.28)', 'rgba(180,83,9,0.12)', '#1D1916'] as const;

function getResultGradient(type: string) {
  if (type === 'morning') return MORNING_GRADIENT;
  if (type === 'post_game') return POST_GAME_GRADIENT;
  return POST_TRAINING_GRADIENT;
}

function getResultBadge(type: string) {
  if (type === 'morning') return 'Check-in da Manhã';
  if (type === 'post_game') return 'CHECK-IN PÓS-JOGO';
  return 'Check-in Pós-Treino';
}

export default function CheckInResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();
  const { updateReport } = useCheckIns();
  const theme = useActivitiesTheme();
  const colors = useAppColors();
  const styles = useMemo(() => createCheckInResultStyles(theme), [theme]);
  const sendIconColor = `${colors['chat-warm-bg']}8C`;
  const voiceIconSize = Math.round(insightCardActionLayout.height * 0.42);

  const { type, checkinId, pendingReport, responses, checkinResponses } = route.params;
  const initialReport = route.params.report;

  useEffect(() => {
    reportViewedLoggedRef.current = false;
  }, [checkinId, type]);

  const [report, setReport] = useState<CheckinReport | null>(initialReport);
  const [loading, setLoading] = useState(Boolean(pendingReport && !initialReport));
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [generateFailed, setGenerateFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const generateInFlightRef = useRef(false);
  const reportViewedLoggedRef = useRef(false);

  const gradient = useMemo(
    () => resolveCheckInGradient(getResultGradient(type), theme.surface),
    [theme.surface, type],
  );

  const badge = getResultBadge(type);
  const loadingMessages = CHECKIN_LOADING_MESSAGES[type];

  useEffect(() => {
    if (!loading) return;
    setLoadingIdx(0);
    const id = setInterval(() => {
      setLoadingIdx((i) => (i + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(id);
  }, [loading, loadingMessages.length]);

  const generateReport = useCallback(async () => {
    if (!responses || generateInFlightRef.current || report) return;

    generateInFlightRef.current = true;
    setLoading(true);
    setGenerateFailed(false);

    try {
      const { data, error, response } = await supabase.functions.invoke('generate-checkin-report', {
        body: {
          checkin_type: type,
          responses,
          user_name: profile?.name ?? null,
        },
      });

      if (error || !data?.report) {
        const responseBody = response ? await response.text().catch(() => null) : null;
        console.error('generate-checkin-report failed', {
          status: response?.status,
          body: responseBody,
          error: error?.message,
        });
        throw new Error(error?.message ?? 'Falha ao gerar relatório');
      }

      await updateReport(checkinId, data.report);
      const nextReport = data.report as CheckinReport;
      setReport(nextReport);
      navigation.setParams({
        report: nextReport,
        pendingReport: false,
        checkinResponses: responses ?? checkinResponses,
      });
    } catch (err) {
      console.error(err);
      setGenerateFailed(true);
    } finally {
      setLoading(false);
      generateInFlightRef.current = false;
    }
  }, [
    checkinId,
    checkinResponses,
    navigation,
    profile?.name,
    report,
    responses,
    type,
    updateReport,
  ]);

  useEffect(() => {
    if (!pendingReport || initialReport || report || !responses) return;
    void generateReport();
  }, [generateReport, initialReport, pendingReport, report, responses, retryKey]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      if (report || loading || !responses) return;
      if (!pendingReport && !generateFailed) return;
      setRetryKey((key) => key + 1);
    });

    return () => subscription.remove();
  }, [generateFailed, loading, pendingReport, report, responses]);

  useEffect(() => {
    if (loading || !report || reportViewedLoggedRef.current) {
      return;
    }

    reportViewedLoggedRef.current = true;
    void logActionEvent(ACTION_EVENTS.CHECKIN_REPORT_VIEWED, {
      checkin_type: type,
      source: initialReport ? 'existing' : 'generated',
    });
  }, [initialReport, loading, report, type]);

  const handleTalkAbout = (question?: string, mode: 'text' | 'voice' = 'text') => {
    if (!report) return;
    openCheckInChat(navigation, {
      type,
      report,
      responses: checkinResponses ?? responses ?? null,
      clickedQuestion: question,
      mode,
    });
  };

  const questions = useMemo(() => report?.reflection_questions?.slice(0, 3) ?? [], [report]);
  const analysisParagraphs = useMemo(
    () => (report ? splitParagraphs(report.analysis) : []),
    [report],
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradient]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerBadge}>{badge}</Text>
        <Pressable
          style={styles.headerButton}
          onPress={() => navigation.getParent()?.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        >
          <X color={theme.icon} size={18} />
        </Pressable>
      </View>

      {loading ? (
        <View style={[styles.loadingContainer, { paddingBottom: insets.bottom }]}>
          <Text style={styles.loadingMessage} accessibilityLiveRegion="polite">
            {loadingMessages[loadingIdx]}
          </Text>
        </View>
      ) : null}

      {!loading && generateFailed && !report ? (
        <View style={[styles.loadingContainer, { paddingBottom: insets.bottom }]}>
          <Text style={styles.errorText}>
            Não foi possível gerar o relatório agora. Suas respostas foram salvas.
          </Text>
          <Pressable
            style={styles.ctaButton}
            onPress={() => setRetryKey((key) => key + 1)}
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
          >
            <Text style={styles.ctaLabel}>Tentar novamente</Text>
          </Pressable>
          <Pressable
            style={styles.errorButton}
            onPress={() => navigation.navigate('CheckInActivities')}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Text style={styles.errorButtonLabel}>Fechar</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && report ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >
            <Text style={styles.headline} accessibilityRole="header">
              {report.headline}
            </Text>

            {analysisParagraphs.map((para) => (
              <Text key={para} style={styles.analysisParagraph}>
                {para}
              </Text>
            ))}

            {questions.length > 0 ? (
              <>
                <Text style={styles.reflectTitle}>Pra refletir</Text>
                {questions.map((q) => (
                  <View key={q} style={styles.questionCard}>
                    <Text style={styles.questionText}>{q}</Text>
                    <View style={styles.questionActions}>
                      <Pressable
                        style={styles.questionMessageButton}
                        onPress={() => handleTalkAbout(q)}
                        accessibilityRole="button"
                        accessibilityLabel={`Enviar mensagem sobre: ${q}`}
                      >
                        <Text style={styles.questionMessageText} numberOfLines={1}>
                          Envie uma mensagem
                        </Text>
                        <View style={styles.questionSendButton}>
                          <ArrowUp
                            size={insightCardActionLayout.sendIconSize}
                            color={sendIconColor}
                            strokeWidth={3}
                          />
                        </View>
                      </Pressable>
                      <Pressable
                        style={styles.questionVoiceButton}
                        onPress={() => handleTalkAbout(q, 'voice')}
                        accessibilityRole="button"
                        accessibilityLabel={`Conversar por voz sobre: ${q}`}
                        hitSlop={insightCardActionLayout.voiceHitSlop}
                      >
                        <WavesIcon size={voiceIconSize} color="#373737" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            <Pressable
              style={styles.ctaButton}
              onPress={() => handleTalkAbout()}
              accessibilityRole="button"
              accessibilityLabel="Conversar sobre isso"
            >
              <Text style={styles.ctaLabel}>Conversar sobre isso</Text>
            </Pressable>
        </ScrollView>
      ) : null}
    </View>
  );
}

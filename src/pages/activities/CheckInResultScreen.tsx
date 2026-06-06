import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { CHECKIN_LOADING_MESSAGES } from '@/features/checkin/checkInResult.constants';
import { useCheckIns, type CheckinReport } from '@/hooks/useCheckIns';
import { openCheckInChat } from '@/utils/buildCheckInChatInsight';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { resolveCheckInGradient, useActivitiesTheme } from '@/lib/activitiesTheme';
import type { ActivitiesStackParamList } from '@/types/activitiesNavigation.types';
import { createCheckInResultStyles } from './CheckInResult.styles';

type Route = RouteProp<ActivitiesStackParamList, 'CheckInResult'>;
type Nav = NativeStackNavigationProp<ActivitiesStackParamList, 'CheckInResult'>;

function splitParagraphs(text: string): string[] {
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

const MORNING_GRADIENT = ['rgba(245,158,11,0.2)', 'rgba(244,63,94,0.1)', '#1D1916'] as const;
const POST_TRAINING_GRADIENT = ['rgba(147,51,234,0.22)', 'rgba(59,130,246,0.1)', '#1D1916'] as const;

export default function CheckInResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();
  const { updateReport } = useCheckIns();
  const theme = useActivitiesTheme();
  const styles = useMemo(() => createCheckInResultStyles(theme), [theme]);

  const { type, checkinId, pendingReport, responses, checkinResponses } = route.params;
  const initialReport = route.params.report;

  const [report, setReport] = useState<CheckinReport | null>(initialReport);
  const [loading, setLoading] = useState(Boolean(pendingReport && !initialReport));
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [generateFailed, setGenerateFailed] = useState(false);
  const didGenerateRef = useRef(false);

  const gradient = useMemo(
    () =>
      resolveCheckInGradient(
        type === 'morning' ? MORNING_GRADIENT : POST_TRAINING_GRADIENT,
        theme.surface,
      ),
    [theme.surface, type],
  );

  const badge = type === 'morning' ? 'Check-in da Manhã' : 'Check-in Pós-Treino';
  const loadingMessages = CHECKIN_LOADING_MESSAGES[type];

  useEffect(() => {
    if (!loading) return;
    setLoadingIdx(0);
    const id = setInterval(() => {
      setLoadingIdx((i) => (i + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(id);
  }, [loading, loadingMessages.length]);

  useEffect(() => {
    if (!pendingReport || initialReport || didGenerateRef.current || !responses) return;
    didGenerateRef.current = true;

    const generate = async () => {
      setLoading(true);
      setGenerateFailed(false);
      try {
        const { data, error } = await supabase.functions.invoke('generate-checkin-report', {
          body: {
            checkin_type: type,
            responses,
            user_name: profile?.name ?? null,
          },
        });

        if (error || !data?.report) {
          throw new Error(error?.message ?? 'Falha ao gerar relatório');
        }

        await updateReport(checkinId, data.report);
        const nextReport = data.report as CheckinReport;
        setReport(nextReport);
        navigation.setParams({
          report: nextReport,
          checkinResponses: responses ?? checkinResponses,
        });
      } catch (err) {
        console.error(err);
        setGenerateFailed(true);
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [checkinId, initialReport, pendingReport, profile?.name, responses, type, updateReport]);

  const handleTalkAbout = (question?: string) => {
    if (!report) return;
    openCheckInChat(navigation, {
      type,
      report,
      responses: checkinResponses ?? responses ?? null,
      clickedQuestion: question,
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
          onPress={() => navigation.navigate('ActivitiesHome')}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        >
          <X color={theme.icon} size={18} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingMessage} accessibilityLiveRegion="polite">
              {loadingMessages[loadingIdx]}
            </Text>
          </View>
        ) : null}

        {!loading && generateFailed && !report ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>
              Não foi possível gerar o relatório agora. Suas respostas foram salvas.
            </Text>
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
          <>
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
                  <Pressable
                    key={q}
                    style={styles.questionCard}
                    onPress={() => handleTalkAbout(q)}
                    accessibilityRole="button"
                    accessibilityLabel={`Conversar sobre: ${q}`}
                  >
                    <Text style={styles.questionText}>{q}</Text>
                  </Pressable>
                ))}
              </>
            ) : null}

            <Pressable
              style={styles.ctaButton}
              onPress={() => handleTalkAbout()}
              accessibilityRole="button"
              accessibilityLabel="Vamos conversar sobre isso"
            >
              <Text style={styles.ctaLabel}>Vamos conversar sobre isso</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

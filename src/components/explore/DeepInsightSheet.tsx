import React, { useCallback, useEffect, useState } from 'react';
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, ThumbsDown, ThumbsUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { deepInsightSheetStyles as styles } from '@/components/explore/DeepInsightSheet.styles';
import { useAppAlert } from '@/contexts/AppAlertContext';
import { useDeepInsight } from '@/hooks/useDeepInsight';
import { supabase } from '@/integrations/supabase/client';
import { navigateToChatTab } from '@/utils/navigateToChat';
import type { MainTabNavigationProp } from '@/types/navigation';

const inspiredBg = require('@/assets/inspired-bg.png');

const loadingMessages = [
  'Okay, tenho alguns pensamentos...',
  'Deixa eu revisitar nossas conversas...',
  'Você trouxe coisas interessantes recentemente...',
  'Estou conectando alguns pontos aqui...',
  'Acho que encontrei algo importante...',
];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface DeepInsightSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function DeepInsightSheet({ visible, onClose }: DeepInsightSheetProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { showAlert } = useAppAlert();
  const {
    loading,
    status,
    insight,
    weeklyConversationCount,
    requiredConversations,
    error,
    generateDeepInsight,
  } = useDeepInsight();

  const [feedbackGiven, setFeedbackGiven] = useState<'negative' | 'positive' | 'love' | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [selectedWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  useEffect(() => {
    if (visible && status === 'idle') {
      generateDeepInsight(selectedWeekStart).catch((err) => {
        console.error('Error generating deep insight:', err);
      });
    }
  }, [visible, status, generateDeepInsight, selectedWeekStart]);

  useEffect(() => {
    if (!visible) {
      setCurrentMessageIndex(0);
    }
  }, [visible]);

  useEffect(() => {
    if (!loading) {
      setCurrentMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) =>
        prev < loadingMessages.length - 1 ? prev + 1 : prev,
      );
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (status !== 'loaded' || !insight?.headline) return;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('insight_feedback')
        .select('feedback_type')
        .eq('user_id', user.id)
        .eq('insight_type', 'deep_insight')
        .eq('insight_headline', insight.headline)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.feedback_type) {
        setFeedbackGiven(data.feedback_type as 'negative' | 'positive' | 'love');
      } else {
        setFeedbackGiven(null);
      }
    })();
  }, [status, insight?.headline]);

  const handleTalkAbout = useCallback(() => {
    if (!insight) return;

    onClose();
    navigateToChatTab(navigation, {
      chatInsight: {
        insightType: 'deep_insight',
        badge: 'INSPIRADO EM VOCÊ',
        title: insight.headline || 'Deep Insight',
        contextSummary: insight.headline,
        internalContext: insight.intro,
        backgroundType: 'inspired',
        autoStartVoice: true,
      },
    });
  }, [insight, navigation, onClose]);

  const handleFeedback = async (type: 'negative' | 'positive' | 'love') => {
    setFeedbackGiven(type);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showAlert({ title: 'Obrigado', message: 'Obrigado pelo feedback!' });
        return;
      }
      await supabase.from('insight_feedback').insert({
        user_id: user.id,
        insight_type: 'deep_insight',
        feedback_type: type,
        insight_headline: insight?.headline,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        insight_content: insight as any,
      });
      showAlert({ title: 'Obrigado', message: 'Obrigado pelo feedback!' });
    } catch (err) {
      console.error('Erro ao salvar feedback:', err);
      showAlert({ title: 'Obrigado', message: 'Obrigado pelo feedback!' });
    }
  };

  const backTop = insets.top + 8;

  const renderBackButton = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      onPress={onClose}
      style={[styles.backButton, { top: backTop }]}
    >
      <ArrowLeft size={20} color="#ffffff" />
    </Pressable>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      {renderBackButton()}
      <Text style={styles.loadingText}>{loadingMessages[currentMessageIndex]}</Text>
    </View>
  );

  const renderInsufficient = () => (
    <View style={styles.gradient}>
      {renderBackButton()}
      <View style={styles.centerContent}>
        <Text style={styles.centerTitle}>Ainda estamos nos conhecendo...</Text>
        <Text style={styles.centerSubtitle}>
          Continue conversando comigo para que eu possa preparar algo especial para você.
        </Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>
            {weeklyConversationCount}/{requiredConversations} conversas
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((weeklyConversationCount / requiredConversations) * 100, 100)}%`,
                },
              ]}
            />
          </View>
        </View>
        <Pressable style={styles.outlineButton} onPress={onClose}>
          <Text style={styles.outlineButtonText}>Continuar conversando</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderNoInsight = () => (
    <View style={styles.gradient}>
      {renderBackButton()}
      <View style={styles.centerContent}>
        <Text style={styles.centerTitle}>Ainda não geramos esse insight</Text>
        <Text style={styles.centerSubtitle}>
          Continue conversando comigo para desbloquear novos insights.
        </Text>
        <Pressable style={styles.outlineButton} onPress={onClose}>
          <Text style={styles.outlineButtonText}>Continuar conversando</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderError = () => (
    <View style={styles.gradient}>
      {renderBackButton()}
      <View style={styles.centerContent}>
        <Text style={styles.centerTitle}>{error}</Text>
        <Pressable style={styles.outlineButton} onPress={onClose}>
          <Text style={styles.outlineButtonText}>Fechar</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderContent = () => {
    if (!insight) return null;

    return (
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <ImageBackground source={inspiredBg} style={styles.hero} resizeMode="cover">
          <View style={styles.heroOverlay} />
          {renderBackButton()}
          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroSubtitle}>
              Pensamentos e insights baseados nas últimas conversas
            </Text>
            <Text style={styles.heroHeadline}>{insight.headline}</Text>
          </View>
        </ImageBackground>

        <View style={styles.introCard}>
          <Text style={styles.introText}>{insight.intro}</Text>
          <Text style={styles.introSignature}>- Bud</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{insight.what_i_noticed.title}</Text>
          <Text style={styles.sectionBody}>{insight.what_i_noticed.content}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{insight.reflection.title}</Text>
          <Text style={styles.sectionBody}>{insight.reflection.content}</Text>
        </View>

        <ImageBackground source={inspiredBg} style={styles.takeawayCard} resizeMode="cover">
          <View style={styles.takeawayOverlay}>
            <Text style={styles.takeawayLabel}>{insight.key_takeaway.title}</Text>
            <Text style={styles.takeawayText}>{insight.key_takeaway.content}</Text>
          </View>
        </ImageBackground>

        <View style={styles.ctaSection}>
          <Text style={styles.sectionTitle}>{insight.next_steps.title}</Text>
          <Text style={styles.sectionBody}>{insight.next_steps.content}</Text>
          <Pressable style={styles.ctaButton} onPress={handleTalkAbout}>
            <Text style={styles.ctaButtonText}>Vamos conversar sobre isso</Text>
          </Pressable>
        </View>

        <View style={[styles.feedbackSection, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.feedbackLabel}>Feedback</Text>
          <View style={styles.feedbackRow}>
            <Pressable
              style={[styles.feedbackButton, feedbackGiven === 'negative' && styles.feedbackButtonActive]}
              onPress={() => handleFeedback('negative')}
            >
              <ThumbsDown size={24} color={feedbackGiven === 'negative' ? '#fff' : 'rgba(255,255,255,0.6)'} />
            </Pressable>
            <Pressable
              style={[styles.feedbackButton, feedbackGiven === 'positive' && styles.feedbackButtonActive]}
              onPress={() => handleFeedback('positive')}
            >
              <ThumbsUp size={24} color={feedbackGiven === 'positive' ? '#fff' : 'rgba(255,255,255,0.6)'} />
            </Pressable>
            <Pressable
              style={[styles.feedbackButton, feedbackGiven === 'love' && styles.feedbackButtonActive]}
              onPress={() => handleFeedback('love')}
            >
              <Heart
                size={24}
                color={feedbackGiven === 'love' ? '#fff' : 'rgba(255,255,255,0.6)'}
                fill={feedbackGiven === 'love' ? '#fff' : 'transparent'}
              />
            </Pressable>
          </View>
          {feedbackGiven ? <Text style={styles.feedbackThanks}>Obrigado pelo feedback</Text> : null}
        </View>
      </ScrollView>
    );
  };

  let body: React.ReactNode = null;
  if (loading) {
    body = renderLoading();
  } else if (status === 'insufficient_conversations') {
    body = renderInsufficient();
  } else if (status === 'no_insight_for_week') {
    body = renderNoInsight();
  } else if (status === 'error') {
    body = renderError();
  } else if (status === 'loaded' && insight) {
    body = renderContent();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.gradient}>{body}</View>
      </View>
    </Modal>
  );
}

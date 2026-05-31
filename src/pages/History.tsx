import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, endOfDay, format, isWithinInterval, startOfDay } from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { useConversations } from '@/hooks/useConversations';
import type { ConversationWithDate } from '@/utils/dateGrouping';
import ConversationDetail from '@/components/history/ConversationDetail';
import { LayoutSpacing } from '@/constants/layout';
import { frauncesFont } from '@/constants/onboardingTheme';
import { useAppColors } from '@/lib/colors';
import { getWeekEndBrasilia, getWeekStartBrasilia, parseDateString } from '@/utils/dateUtils';

interface ConversationToDelete {
  id: string;
  title: string;
}

type WeekDayConversation = {
  dayKey: string; // yyyy-MM-dd
  dayTitle: string; // Monday, etc (pt-BR)
  daySubtitle: string; // 19 de janeiro
  date: Date;
  conversation: {
    id: string;
    title: string;
    date: Date;
  } | null;
};

function getConversationDate(conv: ConversationWithDate) {
  const dateSource = conv.conversation_date || conv.created_at;
  return dateSource.includes('T') ? new Date(dateSource) : parseDateString(dateSource);
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();

  const daysLimit = undefined;

  const { conversations, loading: conversationsLoading, deleteConversation } = useConversations(daysLimit);
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    title: string;
    date: string;
  } | null>(null);
  const [weekReferenceDate, setWeekReferenceDate] = useState<Date>(() => new Date());
  const [conversationToDelete, setConversationToDelete] = useState<ConversationToDelete | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isLoading = conversationsLoading;

  const weekStart = useMemo(
    () => getWeekStartBrasilia(weekReferenceDate),
    [weekReferenceDate]
  );
  const weekEnd = useMemo(() => getWeekEndBrasilia(weekStart), [weekStart]);

  const weekTitle = useMemo(() => {
    const startLabel = format(weekStart, 'd MMM', { locale: enUS });
    const endLabel = format(weekEnd, 'd MMM', { locale: enUS });
    return `${startLabel} - ${endLabel}`;
  }, [weekEnd, weekStart]);

  const weekDays = useMemo<WeekDayConversation[]>(() => {
    if (isLoading) return [];

    const interval = { start: startOfDay(weekStart), end: endOfDay(weekEnd) };

    const inWeek = conversations
      .map((conv) => {
        const date = getConversationDate(conv);
        return {
          id: conv.id,
          title: conv.title ?? '',
          date,
        };
      })
      .filter((c) => isWithinInterval(c.date, interval))
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const byDayKey = new Map<string, typeof inWeek>();
    inWeek.forEach((c) => {
      const key = format(c.date, 'yyyy-MM-dd');
      const list = byDayKey.get(key) ?? [];
      list.push(c);
      byDayKey.set(key, list);
    });

    const result: WeekDayConversation[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = addDays(weekStart, i);
      const dayKey = format(date, 'yyyy-MM-dd');
      const convs = byDayKey.get(dayKey) ?? [];
      const mostRecent = convs[0] ?? null;

      result.push({
        dayKey,
        date,
        dayTitle: format(date, 'EEEE', { locale: ptBR }),
        daySubtitle: format(date, "d 'de' MMMM", { locale: ptBR }),
        conversation: mostRecent
          ? {
              id: mostRecent.id,
              title: mostRecent.title || format(date, 'EEEE', { locale: ptBR }),
              date: mostRecent.date,
            }
          : null,
      });
    }

    return result;
  }, [conversations, isLoading, weekEnd, weekStart]);

  const handleLongPress = (conversation: { id: string; title: string }) => {
    setConversationToDelete(conversation);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteConversation(conversationToDelete.id);
      setConversationToDelete(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setConversationToDelete(null);
  };

  if (isLoading) {
    return (
      <View style={[styles.screen(colors).screen, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (selectedConversation) {
    return (
      <ConversationDetail
        conversationId={selectedConversation.id}
        conversationTitle={selectedConversation.title}
        conversationDate={selectedConversation.date}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <View style={styles.screen(colors).screen}>
      <ScrollView
        style={styles.screen(colors).scroll}
        contentContainerStyle={{
          paddingTop: insets.top + LayoutSpacing.contentPadding.top,
          paddingHorizontal: LayoutSpacing.contentPadding.horizontal,
          paddingBottom: LayoutSpacing.contentPadding.bottom,
        }}
      >
        <View style={styles.screen(colors).weekHeader}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Semana anterior"
            activeOpacity={0.85}
            onPress={() => setWeekReferenceDate((d) => addDays(d, -7))}
            style={styles.screen(colors).weekNavButton}
          >
            <ChevronLeft size={18} color={colors['muted-foreground']} />
          </TouchableOpacity>

          <Text style={styles.screen(colors).weekTitle} accessibilityLabel={`Semana ${weekTitle}`}>
            {weekTitle}
          </Text>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Próxima semana"
            activeOpacity={0.85}
            onPress={() => setWeekReferenceDate((d) => addDays(d, 7))}
            style={styles.screen(colors).weekNavButton}
          >
            <ChevronRight size={18} color={colors['muted-foreground']} />
          </TouchableOpacity>
        </View>

        <Text style={styles.screen(colors).pageTitle}>Conversas da semana</Text>
        
        {conversations.length === 0 ? (
          <View style={styles.screen(colors).emptyCard}>
            <Text style={styles.screen(colors).emptyEmoji}>💬</Text>
            <Text style={styles.screen(colors).emptyText}>Você ainda não tem conversas salvas.</Text>
          </View>
        ) : (
          <View style={styles.screen(colors).list}>
            {weekDays
              .filter((d) => d.conversation)
              .map((d) => (
                <TouchableOpacity
                  key={`week-day-${d.dayKey}`}
                  activeOpacity={0.9}
                  onPress={() =>
                    d.conversation
                      ? setSelectedConversation({
                          id: d.conversation.id,
                          title: d.dayTitle,
                          date: d.conversation.date.toISOString(),
                        })
                      : undefined
                  }
                  onLongPress={() =>
                    d.conversation
                      ? handleLongPress({
                          id: d.conversation.id,
                          title: d.dayTitle,
                        })
                      : undefined
                  }
                  delayLongPress={500}
                  style={styles.screen(colors).dayCard}
                >
                  <Text style={styles.screen(colors).dayTitle}>{d.dayTitle}</Text>
                  <Text style={styles.screen(colors).daySubtitle}>{d.daySubtitle}</Text>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={conversationToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <Pressable 
          style={styles.screen(colors).modalOverlay}
          onPress={handleCancelDelete}
        >
          <Pressable 
            style={styles.screen(colors).modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.screen(colors).modalHeader}>
              <View style={styles.screen(colors).modalIconCircle}>
                <Text style={styles.screen(colors).modalIcon}>🗑️</Text>
              </View>
              <Text style={styles.screen(colors).modalTitle}>Excluir conversa?</Text>
            </View>

            <View style={styles.screen(colors).modalBody}>
              <Text style={styles.screen(colors).modalText}>
                A conversa <Text style={styles.screen(colors).modalTextStrong}>"{conversationToDelete?.title}"</Text> será excluída
                permanentemente. Esta ação não pode ser desfeita.
              </Text>
            </View>

            <View style={styles.screen(colors).modalSeparator} />

            <View style={styles.screen(colors).modalActionsRow}>
              <TouchableOpacity
                style={styles.screen(colors).modalAction}
                onPress={handleCancelDelete}
                disabled={isDeleting}
                activeOpacity={0.85}
              >
                <Text style={styles.screen(colors).modalActionCancel}>Cancelar</Text>
              </TouchableOpacity>

              <View style={styles.screen(colors).modalDivider} />

              <TouchableOpacity
                style={styles.screen(colors).modalAction}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
                activeOpacity={0.85}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Text style={styles.screen(colors).modalActionDelete}>Excluir</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = {
  center: StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }).center,
  screen: (colors: { background: string; card: string; foreground: string; border: string; 'muted-foreground': string }) =>
    StyleSheet.create({
      screen: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scroll: {
        flex: 1,
      },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  weekNavButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.10)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekTitle: {
    fontFamily: frauncesFont,
    fontSize: 20,
    color: colors.foreground,
    letterSpacing: 0.2,
  },
  pageTitle: {
    fontFamily: frauncesFont,
    fontSize: 28,
    color: colors.foreground,
    marginBottom: 18,
  },
  list: {
    gap: 16,
    paddingBottom: 16,
  },
  dayCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayTitle: {
    fontFamily: frauncesFont,
    fontSize: 26,
    color: colors.foreground,
    marginBottom: 6,
  },
  daySubtitle: {
    fontFamily: frauncesFont,
    fontSize: 14,
    color: colors['muted-foreground'],
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: frauncesFont,
    fontSize: 16,
    color: colors['muted-foreground'],
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: 18,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingTop: 22,
    paddingBottom: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalIcon: {
    fontSize: 28,
  },
  modalTitle: {
    fontFamily: frauncesFont,
    fontSize: 20,
    color: colors.foreground,
    textAlign: 'center',
  },
  modalBody: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  modalText: {
    fontFamily: frauncesFont,
    fontSize: 15,
    color: colors['muted-foreground'],
    textAlign: 'center',
    lineHeight: 22,
  },
  modalTextStrong: {
    color: colors.foreground,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: colors.border,
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAction: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  modalActionCancel: {
    fontFamily: frauncesFont,
    fontSize: 16,
    color: colors['muted-foreground'],
  },
  modalActionDelete: {
    fontFamily: frauncesFont,
    fontSize: 16,
    color: '#ef4444',
  },
    }),
};

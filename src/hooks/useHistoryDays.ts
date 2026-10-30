import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { noteRelationError, relationAvailable } from '@/lib/schemaAvailability';
import {
  type ActivityId,
} from '@/pages/activitiesV3/activityFlows';
import type { Conversation } from '@/services/conversationsQuery';
import { activityColors } from '@/theme';
import {
  formatDateBrasilia,
  getNowInBrasilia,
  getWeekEndBrasilia,
  getWeekStartBrasilia,
  parseDateString,
} from '@/utils/dateUtils';

const WEEK_DOT_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] as const;
const ACTIVITY_IDS: ActivityId[] = [
  'cinco_porques',
  'fiee',
  'mapa_relacoes',
  'ordenacao_valores',
];

export const ACTIVITY_CHIP_META: Record<ActivityId, { label: string; color: string }> = {
  cinco_porques: { label: '5PQs', color: activityColors.menta },
  fiee: { label: 'FIEE?', color: activityColors.folha },
  mapa_relacoes: { label: 'Relações', color: activityColors.ardosia },
  ordenacao_valores: { label: 'OV', color: activityColors.agua },
};

export type HistoryActivityChip = {
  id: ActivityId;
  label: string;
  color: string;
};

export type HistoryDay = {
  dateKey: string;
  weekdayLabel: string;
  dateLabel: string;
  date: Date;
  messageCount: number;
  conversationId: string | null;
  conversationTitle: string;
  conversationDate: string;
  hasLetter: boolean;
  activities: HistoryActivityChip[];
};

export type HistoryWeekDot = {
  label: string;
  active: boolean;
};

function isActivityId(value: string): value is ActivityId {
  return ACTIVITY_IDS.includes(value as ActivityId);
}

function capitalizeFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function weekdayLabel(date: Date) {
  return capitalizeFirst(format(date, 'EEEE', { locale: ptBR }).split('-')[0]);
}

function dateLabel(date: Date) {
  return format(date, "d 'de' MMMM", { locale: ptBR });
}

function conversationDayKey(conversation: Conversation) {
  const source = conversation.conversation_date || conversation.created_at;
  return source.includes('T') ? source.split('T')[0] : source;
}

function brasiliaDayKey(iso: string | null | undefined) {
  if (!iso) return null;
  if (!iso.includes('T')) return iso.slice(0, 10);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(iso));
}

export function formatWeekRangeLong(weekStart: Date, weekEnd: Date) {
  const startMonth = format(weekStart, 'MMMM', { locale: ptBR });
  const endMonth = format(weekEnd, 'MMMM', { locale: ptBR });
  if (startMonth === endMonth) {
    return `${format(weekStart, 'd')} a ${format(weekEnd, "d 'de' MMMM", { locale: ptBR })}`;
  }
  return `${format(weekStart, "d 'de' MMMM", { locale: ptBR })} a ${format(weekEnd, "d 'de' MMMM", { locale: ptBR })}`;
}

export function daysUntilSunday(from = getNowInBrasilia()) {
  const day = from.getDay();
  return day === 0 ? 0 : 7 - day;
}

type HistoryExtras = {
  messageCounts: Record<string, number>;
  activityByDay: Record<string, ActivityId[]>;
  letterDays: string[];
  checkInDays: string[];
};

async function fetchHistoryExtras(
  userId: string,
  conversationIds: string[],
): Promise<HistoryExtras> {
  const [activitiesRes, lettersRes, checkInsRes, messagesRes] = await Promise.all([
    supabase
      .from('activity_sessions')
      .select('activity_type, completed_at, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed'),
    relationAvailable('daily_letters')
      ? supabase.from('daily_letters').select('letter_date').eq('user_id', userId)
      : Promise.resolve({ data: [] as Array<{ letter_date: string }>, error: null }),
    supabase.from('daily_checkins').select('checkin_date').eq('user_id', userId),
    conversationIds.length > 0
      ? supabase.from('messages').select('conversation_id').in('conversation_id', conversationIds)
      : Promise.resolve({ data: [] as { conversation_id: string }[], error: null }),
  ]);

  noteRelationError('activity_sessions', activitiesRes.error);
  noteRelationError('daily_letters', lettersRes.error);

  const messageCounts: Record<string, number> = {};
  for (const row of messagesRes.data ?? []) {
    messageCounts[row.conversation_id] = (messageCounts[row.conversation_id] ?? 0) + 1;
  }

  const activityByDay: Record<string, ActivityId[]> = {};
  for (const row of activitiesRes.data ?? []) {
    if (!isActivityId(row.activity_type)) continue;
    const key = brasiliaDayKey(row.completed_at ?? row.created_at);
    if (!key) continue;
    const list = activityByDay[key] ?? [];
    if (!list.includes(row.activity_type)) {
      list.push(row.activity_type);
    }
    activityByDay[key] = list;
  }

  return {
    messageCounts,
    activityByDay,
    letterDays: (lettersRes.data ?? []).map((row) => row.letter_date),
    checkInDays: (checkInsRes.data ?? []).map((row) => row.checkin_date),
  };
}

export function useHistoryDays(conversations: Conversation[]) {
  const { user } = useAuth();
  const userId = user?.id;
  const conversationIds = useMemo(
    () => conversations.map((conversation) => conversation.id),
    [conversations],
  );
  const stamp = conversations[0]?.updated_at ?? String(conversations.length);

  const query = useQuery({
    queryKey: [...queryKeys.historyDays(userId ?? ''), stamp, conversationIds.join(',')],
    queryFn: () => fetchHistoryExtras(userId!, conversationIds),
    enabled: Boolean(userId),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const extras = query.data;
  const weekStart = getWeekStartBrasilia();
  const weekEnd = getWeekEndBrasilia(weekStart);
  const weekStartKey = formatDateBrasilia(weekStart);
  const weekEndKey = formatDateBrasilia(weekEnd);

  const days = useMemo<HistoryDay[]>(() => {
    const byDay = new Map<string, HistoryDay>();

    const ensureDay = (dateKey: string) => {
      const existing = byDay.get(dateKey);
      if (existing) return existing;
      const date = parseDateString(dateKey);
      const next: HistoryDay = {
        dateKey,
        weekdayLabel: weekdayLabel(date),
        dateLabel: dateLabel(date),
        date,
        messageCount: 0,
        conversationId: null,
        conversationTitle: '',
        conversationDate: date.toISOString(),
        hasLetter: false,
        activities: [],
      };
      byDay.set(dateKey, next);
      return next;
    };

    for (const conversation of conversations) {
      const dateKey = conversationDayKey(conversation);
      const day = ensureDay(dateKey);
      const count = extras?.messageCounts[conversation.id];
      if (!day.conversationId || (typeof count === 'number' && count >= day.messageCount)) {
        day.conversationId = conversation.id;
        day.conversationTitle = conversation.title ?? '';
        day.conversationDate = conversation.conversation_date || conversation.created_at;
      }
      day.messageCount += typeof count === 'number' ? count : 1;
    }

    for (const [dateKey, ids] of Object.entries(extras?.activityByDay ?? {})) {
      const day = ensureDay(dateKey);
      day.activities = ACTIVITY_IDS.filter((id) => ids.includes(id)).map((id) => ({
        id,
        label: ACTIVITY_CHIP_META[id].label,
        color: ACTIVITY_CHIP_META[id].color,
      }));
    }

    for (const dateKey of extras?.letterDays ?? []) {
      ensureDay(dateKey).hasLetter = true;
    }

    return Array.from(byDay.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [conversations, extras]);

  const weekDots = useMemo<HistoryWeekDot[]>(() => {
    const active = new Set(
      days
        .filter((day) => day.dateKey >= weekStartKey && day.dateKey <= weekEndKey)
        .map((day) => day.dateKey),
    );
    for (const dateKey of extras?.checkInDays ?? []) {
      if (dateKey >= weekStartKey && dateKey <= weekEndKey) {
        active.add(dateKey);
      }
    }
    return WEEK_DOT_LABELS.map((label, index) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      return {
        label,
        active: active.has(formatDateBrasilia(date)),
      };
    });
  }, [days, extras?.checkInDays, weekStart, weekStartKey, weekEndKey]);

  const conversationDaysThisWeek = useMemo(
    () =>
      days.filter(
        (day) =>
          day.dateKey >= weekStartKey &&
          day.dateKey <= weekEndKey &&
          day.messageCount > 0,
      ).length,
    [days, weekStartKey, weekEndKey],
  );

  return {
    days,
    weekDots,
    weekStart,
    weekEnd,
    conversationDaysThisWeek,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}

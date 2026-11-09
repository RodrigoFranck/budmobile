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
import { countDisplayableHistoryTurns } from '@/utils/historyMessages';

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
  resultText?: string | null;
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

export function historyDayIsOpenable(day: HistoryDay) {
  return Boolean(day.conversationId) || day.activities.length > 0 || day.hasLetter;
}

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

function brasiliaDayKey(iso: string | null | undefined) {
  if (!iso) return null;
  if (!iso.includes('T')) return iso.slice(0, 10);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(iso));
}

/** Day key in America/Sao_Paulo — ISO timestamps must not use UTC `split('T')[0]` (breaks after 21h). */
function conversationDayKey(conversation: Conversation) {
  const source = conversation.conversation_date || conversation.created_at;
  return brasiliaDayKey(source) ?? source.slice(0, 10);
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

export type HistoryWeekTitle =
  | { kind: 'this_week' }
  | { kind: 'last_week' }
  | { kind: 'range'; label: string };

export type HistoryWeekSection = {
  key: string;
  weekStart: Date;
  weekEnd: Date;
  title: HistoryWeekTitle;
  days: HistoryDay[];
};

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

/** Groups history days into Mon–Sun weeks (Brasília). Empty weeks are omitted. */
export function groupHistoryDaysByWeek(
  days: HistoryDay[],
  reference = getNowInBrasilia(),
): HistoryWeekSection[] {
  const thisWeekStart = getWeekStartBrasilia(reference);
  const thisWeekKey = formatDateBrasilia(thisWeekStart);
  const lastWeekStart = addDays(thisWeekStart, -7);
  const lastWeekKey = formatDateBrasilia(lastWeekStart);

  const byWeek = new Map<string, HistoryDay[]>();
  for (const day of days) {
    const weekStart = getWeekStartBrasilia(day.date);
    const key = formatDateBrasilia(weekStart);
    const list = byWeek.get(key);
    if (list) {
      list.push(day);
    } else {
      byWeek.set(key, [day]);
    }
  }

  const keys = Array.from(byWeek.keys()).sort((a, b) => b.localeCompare(a));
  return keys.map((key) => {
    const weekStart = parseDateString(key);
    const weekEnd = getWeekEndBrasilia(weekStart);
    const title: HistoryWeekTitle =
      key === thisWeekKey
        ? { kind: 'this_week' }
        : key === lastWeekKey
          ? { kind: 'last_week' }
          : { kind: 'range', label: formatWeekRangeLong(weekStart, weekEnd) };

    return {
      key,
      weekStart,
      weekEnd,
      title,
      days: (byWeek.get(key) ?? []).sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
    };
  });
}

type HistoryExtras = {
  messageCounts: Record<string, number>;
  activityByDay: Record<string, HistoryActivityChip[]>;
  letterDays: string[];
  checkInDays: string[];
};

function toActivityChip(
  id: ActivityId,
  resultText?: string | null,
): HistoryActivityChip {
  return {
    id,
    label: ACTIVITY_CHIP_META[id].label,
    color: ACTIVITY_CHIP_META[id].color,
    resultText: resultText ?? null,
  };
}

async function fetchHistoryExtras(
  userId: string,
  conversationIds: string[],
): Promise<HistoryExtras> {
  const [activitiesRes, lettersRes, checkInsRes, messagesRes] = await Promise.all([
    supabase
      .from('activity_sessions')
      .select('activity_type, completed_at, created_at, result_text')
      .eq('user_id', userId)
      .eq('status', 'completed'),
    relationAvailable('daily_letters')
      ? supabase.from('daily_letters').select('letter_date').eq('user_id', userId)
      : Promise.resolve({ data: [] as Array<{ letter_date: string }>, error: null }),
    supabase.from('daily_checkins').select('checkin_date').eq('user_id', userId),
    conversationIds.length > 0
      ? supabase
          .from('messages')
          .select('conversation_id, role, content')
          .in('conversation_id', conversationIds)
      : Promise.resolve({
          data: [] as { conversation_id: string; role: string; content: string }[],
          error: null,
        }),
  ]);

  noteRelationError('activity_sessions', activitiesRes.error);
  noteRelationError('daily_letters', lettersRes.error);

  const messagesByConversation = new Map<
    string,
    Array<{ role: string; content: string }>
  >();
  for (const row of messagesRes.data ?? []) {
    const list = messagesByConversation.get(row.conversation_id) ?? [];
    list.push({ role: row.role, content: row.content });
    messagesByConversation.set(row.conversation_id, list);
  }

  const messageCounts: Record<string, number> = {};
  for (const [conversationId, rows] of messagesByConversation) {
    messageCounts[conversationId] = countDisplayableHistoryTurns(rows);
  }

  const activityByDay: Record<string, HistoryActivityChip[]> = {};
  for (const row of activitiesRes.data ?? []) {
    if (!isActivityId(row.activity_type)) continue;
    const key = brasiliaDayKey(row.completed_at ?? row.created_at);
    if (!key) continue;
    const list = activityByDay[key] ?? [];
    if (!list.some((item) => item.id === row.activity_type)) {
      list.push(toActivityChip(row.activity_type, row.result_text));
    }
    activityByDay[key] = list;
  }

  for (const key of Object.keys(activityByDay)) {
    activityByDay[key] = ACTIVITY_IDS.filter((id) =>
      (activityByDay[key] ?? []).some((item) => item.id === id),
    ).map((id) => (activityByDay[key] ?? []).find((item) => item.id === id)!);
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
      const counted = extras?.messageCounts[conversation.id];
      // After extras resolve, hide conversations with no displayable turns (empty voice stubs, etc.).
      if (extras && typeof counted === 'number' && counted <= 0) {
        continue;
      }
      const count = typeof counted === 'number' ? counted : 1;
      const day = ensureDay(dateKey);
      if (!day.conversationId || count >= day.messageCount) {
        day.conversationId = conversation.id;
        day.conversationTitle = conversation.title ?? '';
        day.conversationDate = conversation.conversation_date || conversation.created_at;
      }
      day.messageCount += count;
    }

    for (const [dateKey, chips] of Object.entries(extras?.activityByDay ?? {})) {
      ensureDay(dateKey).activities = chips;
    }

    for (const dateKey of extras?.letterDays ?? []) {
      ensureDay(dateKey).hasLetter = true;
    }

    return Array.from(byDay.values())
      .filter(
        (day) => day.messageCount > 0 || day.activities.length > 0 || day.hasLetter,
      )
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
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

import { queryClient } from '@/lib/queryClient';
import { queryKeys } from '@/lib/queryKeys';
import { fetchConversationsWithMessages } from '@/services/conversationsQuery';
import { supabase } from '@/integrations/supabase/client';
import type {
  InsightCountScope,
  InsightUnlockProgress,
  InsightUnlockRule,
} from '@/types/insightUnlock.types';
import {
  formatDateBrasilia,
  getWeekEndBrasilia,
  getWeekStartBrasilia,
  getYesterdayInBrasilia,
  isSundayInBrasilia,
} from '@/utils/dateUtils';

const DEFAULT_RULES: InsightUnlockRule[] = [
  {
    insight_type: 'yesterday_journey',
    required_conversations: 1,
    count_scope: 'yesterday_with_messages',
    locked_title: 'Ainda estou te conhecendo',
    locked_description:
      'Quando a gente conversar, vou poder te trazer algo sobre como foi o dia anterior.',
    display_order: 1,
  },
  {
    insight_type: 'general_insight',
    required_conversations: 5,
    count_scope: 'total_with_messages',
    locked_title: 'Preciso de mais contexto',
    locked_description:
      'Continue conversando comigo que logo eu consigo observar alguns padrões sobre você.',
    display_order: 2,
  },
  {
    insight_type: 'frequency',
    required_conversations: 2,
    count_scope: 'total_active_days',
    locked_title: 'Vou observar sua frequência',
    locked_description:
      'Converse comigo ou faça check-ins por 2 dias para eu te trazer um resumo de como você usa o Bud.',
    display_order: 3,
  },
  {
    insight_type: 'habit',
    required_conversations: 2,
    count_scope: 'total_active_days',
    locked_title: 'Um hábito pra você',
    locked_description:
      'Converse comigo ou faça check-ins por 2 dias para eu sugerir algo que faça sentido pra sua rotina.',
    display_order: 4,
  },
  {
    insight_type: 'deep_insight',
    required_conversations: 2,
    count_scope: 'weekly_active_days',
    locked_title: 'Inspirado em você',
    locked_description:
      'Converse ou faça check-ins em 2 dias nesta semana. Seu insight semanal é liberado todo domingo.',
    display_order: 5,
  },
];

function uniqueDateCount(dates: Array<string | null | undefined>): number {
  return new Set(dates.filter((date): date is string => !!date)).size;
}

function inRange(date: string, range?: { start: string; end: string }): boolean {
  if (!range) return true;
  return date >= range.start && date <= range.end;
}

async function fetchConversationDates(userId: string): Promise<string[]> {
  const conversations = await queryClient.ensureQueryData({
    queryKey: queryKeys.conversations(userId),
    queryFn: () => fetchConversationsWithMessages(userId),
  });

  return conversations
    .map((row) => row.conversation_date)
    .filter((date): date is string => !!date);
}

async function countYesterdayConversations(userId: string): Promise<number> {
  const yesterday = getYesterdayInBrasilia();
  const { count, error } = await supabase
    .from('conversations')
    .select('id, messages!inner(id)', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_archived', false)
    .eq('conversation_date', yesterday);

  if (error) {
    console.error('Error counting yesterday conversations:', error);
    return 0;
  }

  return count ?? 0;
}

async function fetchCheckInDates(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('daily_checkins')
    .select('checkin_date')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching check-in days:', error);
    return [];
  }

  return (data ?? []).map((row) => row.checkin_date);
}

function countForScope(
  scope: InsightCountScope,
  conversationDates: string[],
  checkInDates: string[],
  yesterdayCount?: number,
): number {
  if (scope === 'yesterday_with_messages') {
    if (typeof yesterdayCount === 'number') {
      return yesterdayCount;
    }

    const yesterday = getYesterdayInBrasilia();
    return conversationDates.filter((date) => date === yesterday).length;
  }

  if (scope === 'weekly_with_messages' || scope === 'weekly_active_days') {
    const weekStart = formatDateBrasilia(getWeekStartBrasilia());
    const weekEnd = formatDateBrasilia(getWeekEndBrasilia(getWeekStartBrasilia()));
    const range = { start: weekStart, end: weekEnd };

    if (scope === 'weekly_active_days') {
      return uniqueDateCount([
        ...conversationDates.filter((date) => inRange(date, range)),
        ...checkInDates.filter((date) => inRange(date, range)),
      ]);
    }

    return conversationDates.filter((date) => inRange(date, range)).length;
  }

  if (scope === 'total_active_days') {
    return uniqueDateCount([...conversationDates, ...checkInDates]);
  }

  return conversationDates.length;
}

export async function fetchInsightUnlockRules(): Promise<InsightUnlockRule[]> {
  const { data, error } = await supabase
    .from('insight_unlock_rules')
    .select(
      'insight_type, required_conversations, count_scope, locked_title, locked_description, display_order',
    )
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error || !data?.length) {
    return DEFAULT_RULES;
  }

  return data as InsightUnlockRule[];
}

export async function countConversationsForScope(
  userId: string,
  scope: InsightCountScope,
): Promise<number> {
  const needsCheckIns = scope === 'total_active_days' || scope === 'weekly_active_days';
  const [conversationDates, checkInDates, yesterdayCount] = await Promise.all([
    fetchConversationDates(userId),
    needsCheckIns ? fetchCheckInDates(userId) : Promise.resolve([] as string[]),
    scope === 'yesterday_with_messages'
      ? countYesterdayConversations(userId)
      : Promise.resolve(undefined as number | undefined),
  ]);

  return countForScope(scope, conversationDates, checkInDates, yesterdayCount);
}

export function computeInsightUnlockProgress(
  conversationCount: number,
  rule: InsightUnlockRule,
): InsightUnlockProgress {
  if (rule.count_scope === 'yesterday_with_messages') {
    const unlocked = conversationCount >= 1;
    return {
      conversationCount,
      required: 1,
      remaining: 0,
      progress: unlocked ? 1 : 0,
      locked: !unlocked,
    };
  }

  const required = rule.required_conversations;
  const progress = Math.min(conversationCount, required);
  const remaining = Math.max(0, required - conversationCount);
  const meetsThreshold = conversationCount >= required;
  const waitingForSunday =
    rule.insight_type === 'deep_insight' && meetsThreshold && !isSundayInBrasilia();

  return {
    conversationCount,
    required,
    remaining,
    progress,
    locked: !meetsThreshold || waitingForSunday,
  };
}

export async function buildInsightProgressMap(
  userId: string,
  rules: InsightUnlockRule[],
): Promise<Record<string, InsightUnlockProgress>> {
  const scopes = [...new Set(rules.map((rule) => rule.count_scope))];
  const needsCheckIns = scopes.some(
    (scope) => scope === 'total_active_days' || scope === 'weekly_active_days',
  );

  const [conversationDates, checkInDates, yesterdayCount] = await Promise.all([
    fetchConversationDates(userId),
    needsCheckIns ? fetchCheckInDates(userId) : Promise.resolve([] as string[]),
    scopes.includes('yesterday_with_messages')
      ? countYesterdayConversations(userId)
      : Promise.resolve(undefined as number | undefined),
  ]);

  const counts = new Map<InsightCountScope, number>();
  for (const scope of scopes) {
    counts.set(scope, countForScope(scope, conversationDates, checkInDates, yesterdayCount));
  }

  return rules.reduce<Record<string, InsightUnlockProgress>>((acc, rule) => {
    const conversationCount = counts.get(rule.count_scope) ?? 0;
    acc[rule.insight_type] = computeInsightUnlockProgress(conversationCount, rule);
    return acc;
  }, {});
}

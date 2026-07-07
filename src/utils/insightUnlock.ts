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
    required_conversations: 3,
    count_scope: 'total_with_messages',
    locked_title: 'Vou observar sua frequência',
    locked_description:
      'Continue conversando comigo que logo eu te trago um resumo de como você usa o Bud.',
    display_order: 3,
  },
  {
    insight_type: 'habit',
    required_conversations: 3,
    count_scope: 'total_with_messages',
    locked_title: 'Um hábito pra você',
    locked_description:
      'Quanto mais a gente conversa, mais eu consigo sugerir algo que faça sentido pra sua rotina.',
    display_order: 4,
  },
  {
    insight_type: 'deep_insight',
    required_conversations: 5,
    count_scope: 'weekly_with_messages',
    locked_title: 'Inspirado em você',
    locked_description:
      'Continue conversando comigo para desbloquear seu insight semanal.',
    display_order: 5,
  },
];

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
  if (scope === 'yesterday_with_messages') {
    const { count, error } = await supabase
      .from('conversations')
      .select('id, messages!inner(id)', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_archived', false)
      .eq('conversation_date', getYesterdayInBrasilia());

    if (error) {
      console.error('Error counting yesterday conversations:', error);
      return 0;
    }

    return count ?? 0;
  }

  if (scope === 'weekly_with_messages') {
    const weekStart = formatDateBrasilia(getWeekStartBrasilia());
    const weekEnd = formatDateBrasilia(getWeekEndBrasilia(getWeekStartBrasilia()));

    const { count, error } = await supabase
      .from('conversations')
      .select('id, messages!inner(id)', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_archived', false)
      .gte('conversation_date', weekStart)
      .lte('conversation_date', weekEnd);

    if (error) {
      console.error('Error counting weekly conversations:', error);
      return 0;
    }

    return count ?? 0;
  }

  const { count, error } = await supabase
    .from('conversations')
    .select('id, messages!inner(id)', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_archived', false);

  if (error) {
    console.error('Error counting total conversations:', error);
    return 0;
  }

  return count ?? 0;
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

  return {
    conversationCount,
    required,
    remaining,
    progress,
    locked: conversationCount < required,
  };
}

export async function buildInsightProgressMap(
  userId: string,
  rules: InsightUnlockRule[],
): Promise<Record<string, InsightUnlockProgress>> {
  const scopes = [...new Set(rules.map((rule) => rule.count_scope))];
  const counts = new Map<InsightCountScope, number>();

  await Promise.all(
    scopes.map(async (scope) => {
      counts.set(scope, await countConversationsForScope(userId, scope));
    }),
  );

  return rules.reduce<Record<string, InsightUnlockProgress>>((acc, rule) => {
    const conversationCount = counts.get(rule.count_scope) ?? 0;
    acc[rule.insight_type] = computeInsightUnlockProgress(conversationCount, rule);
    return acc;
  }, {});
}

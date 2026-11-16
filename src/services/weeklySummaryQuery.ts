import type { DeepInsight } from '@/hooks/useDeepInsight';
import { supabase } from '@/integrations/supabase/client';
import { noteRelationError, relationAvailable } from '@/lib/schemaAvailability';
import {
  canReadWeeklySummary,
  qualifyingConversationDays,
  resolveWeeklySummaryCard,
  weeklySummaryDots,
  weeklySummarySundayKey,
  type WeeklySummaryCardPhase,
  type WeeklySummaryDot,
} from '@/utils/weeklySummary';

const MESSAGE_ID_CHUNK = 80;

export type WeeklySummarySnapshot = {
  weekStartKey: string;
  phase: WeeklySummaryCardPhase;
  qualifyingDays: number;
  dots: WeeklySummaryDot[];
  insight: DeepInsight | null;
};

function emptySection(title: string) {
  return { title, content: '' };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function toDeepInsight(value: unknown): DeepInsight | null {
  const record = asRecord(value);
  if (!record) return null;

  const headline = readString(record.headline);
  const intro = readString(record.intro);
  const noticed = asRecord(record.what_i_noticed);
  const reflection = asRecord(record.reflection);
  const takeaway = asRecord(record.key_takeaway);
  const nextSteps = asRecord(record.next_steps);
  if (headline && intro && noticed && nextSteps) {
    return {
      headline,
      intro,
      themes: Array.isArray(record.themes)
        ? record.themes.filter((theme): theme is string => typeof theme === 'string')
        : undefined,
      quote: readString(record.quote) || undefined,
      what_i_noticed: {
        title: readString(noticed.title) || 'Um padrão que eu notei',
        content: readString(noticed.content),
      },
      reflection: {
        title: readString(reflection?.title) || 'Algo para refletir',
        content: readString(reflection?.content),
      },
      key_takeaway: {
        title: readString(takeaway?.title) || 'Minha principal observação',
        content: readString(takeaway?.content),
      },
      next_steps: {
        title: readString(nextSteps.title) || 'Pra levar pra próxima semana',
        content: readString(nextSteps.content),
      },
    };
  }

  const pattern = readString(record.padrao);
  const quote = readString(record.frase_sua);
  const next = readString(record.pra_levar);
  const themes = Array.isArray(record.temas)
    ? record.temas.filter((theme): theme is string => typeof theme === 'string' && theme.trim())
    : [];
  if (!pattern && !quote && !next && themes.length === 0) return null;

  return {
    headline: pattern || 'Sua semana',
    intro: pattern || quote || next,
    themes,
    quote: quote || undefined,
    what_i_noticed: { title: 'Um padrão que eu notei', content: pattern },
    reflection: emptySection('Algo para refletir'),
    key_takeaway: emptySection('Minha principal observação'),
    next_steps: { title: 'Pra levar pra próxima semana', content: next },
  };
}

async function fetchResumoSemana(
  userId: string,
  weekStartKey: string,
): Promise<DeepInsight | null> {
  if (!relationAvailable('resumo_semana')) return null;

  const { data, error } = await supabase
    .from('resumo_semana')
    .select('content_json')
    .eq('user_id', userId)
    .eq('week_start', weekStartKey)
    .maybeSingle();

  if (error) {
    if (!noteRelationError('resumo_semana', error)) {
      console.error('Error fetching weekly summary cache:', error);
    }
    return null;
  }

  return toDeepInsight(data?.content_json);
}

async function fetchUserInsightSummary(
  userId: string,
  weekStartKey: string,
): Promise<DeepInsight | null> {
  const { data, error } = await supabase
    .from('user_insights')
    .select('content_json')
    .eq('user_id', userId)
    .eq('insight_type', 'deep_insight')
    .eq('week_start', weekStartKey)
    .eq('locked', false)
    .maybeSingle();

  if (error) {
    console.error('Error fetching stored weekly insight:', error);
    return null;
  }

  return toDeepInsight(data?.content_json);
}

async function fetchCachedWeeklySummary(
  userId: string,
  weekStartKey: string,
): Promise<DeepInsight | null> {
  const stored = await fetchResumoSemana(userId, weekStartKey);
  if (stored) return stored;
  return fetchUserInsightSummary(userId, weekStartKey);
}

async function fetchUserMessageTimes(
  userId: string,
  weekStartKey: string,
): Promise<string[]> {
  const { data: conversations, error: conversationError } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId);

  if (conversationError) {
    console.error('Error fetching conversations for weekly summary:', conversationError);
    return [];
  }

  const ids = (conversations ?? []).map((conversation) => conversation.id);
  if (ids.length === 0) return [];

  const sunday = weeklySummarySundayKey(weekStartKey);
  const rangeStart = `${weekStartKey}T00:00:00-03:00`;
  const rangeEnd = `${sunday}T16:00:00-03:00`;
  const createdAts: string[] = [];

  for (let index = 0; index < ids.length; index += MESSAGE_ID_CHUNK) {
    const chunk = ids.slice(index, index + MESSAGE_ID_CHUNK);
    const { data, error } = await supabase
      .from('messages')
      .select('created_at, content')
      .eq('role', 'user')
      .in('conversation_id', chunk)
      .gte('created_at', rangeStart)
      .lt('created_at', rangeEnd);

    if (error) {
      console.error('Error fetching weekly conversation days:', error);
      continue;
    }

    for (const row of data ?? []) {
      if (!row.content?.trim() || !row.created_at) continue;
      createdAts.push(row.created_at);
    }
  }

  return createdAts;
}

export async function loadWeeklySummary(
  userId: string,
  weekStartKey: string,
  now = new Date(),
): Promise<WeeklySummarySnapshot> {
  const [cached, createdAts] = await Promise.all([
    fetchCachedWeeklySummary(userId, weekStartKey),
    fetchUserMessageTimes(userId, weekStartKey),
  ]);
  const activeDates = qualifyingConversationDays(createdAts, weekStartKey);
  const qualifyingDays = activeDates.length;
  const hasCachedSummary = Boolean(cached);
  const phase = resolveWeeklySummaryCard({
    now,
    weekStartKey,
    qualifyingDays,
    hasCachedSummary,
  });
  const readable = canReadWeeklySummary({
    now,
    weekStartKey,
    qualifyingDays,
    hasCachedSummary,
  });

  return {
    weekStartKey,
    phase,
    qualifyingDays,
    dots: weeklySummaryDots(activeDates, weekStartKey),
    insight: readable ? cached : null,
  };
}

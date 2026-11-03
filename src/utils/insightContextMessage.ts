import type { ChatInsightParam } from '@/types/chatInsight';
import {
  resolveInsightActivityType,
  resolveInsightContextVariant,
  type InsightActivityType,
  type InsightContextVariant,
} from '@/utils/insightContextVariant';

export type InsightContextCardData = {
  badge: string;
  title: string;
  description?: string;
  variant: InsightContextVariant;
  activityType?: InsightActivityType;
};

type InsightContextPayload = {
  badge?: unknown;
  title?: unknown;
  description?: unknown;
  insightType?: unknown;
  backgroundType?: unknown;
  variant?: unknown;
  activityType?: unknown;
  category?: unknown;
};

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function serializeInsightContextMessage(insight: ChatInsightParam): string {
  const title = insight.title.trim();
  const description =
    insight.cardDescription?.trim() ||
    insight.contextSummary?.trim() ||
    title;
  const variant = resolveInsightContextVariant({
    variant: insight.contextVariant,
    insightType: insight.insightType,
    backgroundType: insight.backgroundType,
  });
  const activityType =
    insight.activityType ?? resolveInsightActivityType(insight.insightType);

  const payload = {
    badge: insight.badge?.trim() || 'INSIGHT',
    title,
    description,
    insightType: insight.insightType,
    backgroundType: insight.backgroundType,
    variant,
    activityType,
  };

  return JSON.stringify(payload);
}

export function parseInsightContextMessage(content: string): InsightContextCardData | null {
  try {
    const parsed = JSON.parse(content) as InsightContextPayload;
    const title = asNonEmptyString(parsed.title);
    const description = asNonEmptyString(parsed.description);
    if (!title && !description) {
      return null;
    }

    const insightType = asNonEmptyString(parsed.insightType);
    const variant = resolveInsightContextVariant({
      variant: asNonEmptyString(parsed.variant),
      insightType,
      backgroundType: asNonEmptyString(parsed.backgroundType),
    });

    return {
      badge: asNonEmptyString(parsed.badge) || 'INSIGHT',
      title: title || description || 'INSIGHT',
      ...(description ? { description } : {}),
      variant,
      activityType:
        (asNonEmptyString(parsed.activityType) as InsightActivityType | undefined) ??
        resolveInsightActivityType(insightType),
    };
  } catch {
    return null;
  }
}

export function isUserMessageAfterContext(
  messages: Array<{ role: string }>,
  index: number,
): boolean {
  const message = messages[index];
  if (message?.role !== 'user') {
    return false;
  }

  return messages[index - 1]?.role === 'context';
}
